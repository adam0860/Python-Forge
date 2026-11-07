"""Runs lesson code jobs and reports JSON results.

Used by scripts/run-examples.ts — inside Pyodide (the app's own Python, the
default) or as a CPython subprocess (PYTHON=python3). It mirrors the app's
runtime (src/lib/pyworker.ts):
input() echoes what was "typed", tracebacks are trimmed to the learner's code
("main.py"), and tests run in the same namespace as the code.

Job (JSON on stdin): {"code": str, "stdin": str|None, "tests": str|None}
Result (JSON on stdout): {"ok", "stdout", "stderr", "tests", "message"}
"""
import builtins
import contextlib
import io
import json
import linecache
import sys
import traceback

def run_job(code, stdin=None, tests=None):
    lines = (stdin or "").split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    out = io.StringIO()
    err = io.StringIO()

    def fake_input(prompt=""):
        out.write(str(prompt))
        if not lines:
            raise EOFError("EOF when reading a line")
        line = lines.pop(0)
        out.write(line + "\n")
        return line

    def trim(tb, names):
        while tb is not None and tb.tb_frame.f_code.co_filename not in names:
            tb = tb.tb_next
        return tb

    result = {"ok": True, "tests": None, "message": None}
    linecache.cache["main.py"] = (len(code), None, code.splitlines(True), "main.py")
    if tests is not None:
        linecache.cache["tests.py"] = (len(tests), None, tests.splitlines(True), "tests.py")
    ns = {"__name__": "__main__", "__builtins__": builtins}
    real_input = builtins.input
    builtins.input = fake_input
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            try:
                exec(compile(code, "main.py", "exec"), ns)
            except SystemExit as e:
                if e.code not in (None, 0):
                    result["ok"] = False
            except BaseException as e:  # noqa: BLE001 - report everything, like the app
                result["ok"] = False
                traceback.print_exception(type(e), e, trim(e.__traceback__, ("main.py",)), file=err)
            if tests is not None and result["ok"]:
                hidden = io.StringIO()
                with contextlib.redirect_stdout(hidden):
                    try:
                        exec(compile(tests, "tests.py", "exec"), ns)
                        result["tests"] = True
                    except AssertionError as e:
                        result["tests"] = False
                        result["message"] = str(e) or "A check failed."
                    except BaseException as e:  # noqa: BLE001
                        result["tests"] = False
                        result["message"] = f"{type(e).__name__}: {e}"
            elif tests is not None:
                result["tests"] = False
                result["message"] = "code raised before tests"
    finally:
        builtins.input = real_input
    result["stdout"] = out.getvalue()
    result["stderr"] = err.getvalue()
    return result


def parse_errors(items):
    import ast
    bad = []
    for it in items:
        try:
            ast.parse(it["code"])
        except SyntaxError as e:
            bad.append({"where": it["where"], "strict": it["strict"], "error": f"line {e.lineno}: {e.msg}"})
    return bad


if __name__ == "__main__":
    job = json.loads(sys.stdin.read())
    if job.get("parse") is not None:
        sys.__stdout__.write(json.dumps(parse_errors(job["parse"])))
    else:
        sys.__stdout__.write(json.dumps(run_job(job["code"], job.get("stdin"), job.get("tests"))))
