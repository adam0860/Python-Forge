import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-json-csv',
  title: 'JSON, CSV and Config Files',
  summary: 'Turn Python data into text and back: the `json` module and its type mapping, writing robust save-game code, the `csv` module with quoting and `DictReader`, and picking between JSON, CSV, TOML, INI and (carefully) pickle.',
  minutes: 19,
  objectives: [
    'Convert between Python objects and JSON with `dumps`, `loads`, `dump` and `load`, and predict which types survive the round trip',
    'Handle `JSONDecodeError` and non-serializable values, and supply sensible defaults when loading data',
    'Read and write CSV with `csv.reader`, `csv.writer`, `DictReader` and `DictWriter`, understanding quoting and why every field is a string',
    'Choose between JSON, CSV, TOML, INI and pickle for saves, settings and tables',
    'Write small functions that parse untrusted data defensively',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'JSON: the universal data format',
      blocks: [
        {
          type: 'p',
          text: 'Programs need to store data between runs (saves, settings) and to exchange it with other programs (web APIs, tools, other languages). **JSON** (JavaScript Object Notation) is the most common format for that: plain text, readable by humans, and supported by every language. Python’s `json` module converts between Python objects and JSON text: `dumps` ("dump string") makes text, `loads` ("load string") parses it back, and `dump` / `load` do the same directly with a file object.',
        },
        {
          type: 'code',
          title: 'json_basics.py',
          runnable: true,
          code: `import json
player = {"name": "Ada", "hp": 75, "alive": True, "boss": None, "items": ["sword", "bow"], "pos": (3, 4)}
text = json.dumps(player)
print(text)
back = json.loads(text)
print(back)
print(back == player, back["pos"], type(back["pos"]).__name__)
print(json.dumps({1: "a", 2: "b"}), json.loads(json.dumps({1: "a"})))
print(json.dumps("café ✓"), json.dumps("café ✓", ensure_ascii=False))`,
          output: `{"name": "Ada", "hp": 75, "alive": true, "boss": null, "items": ["sword", "bow"], "pos": [3, 4]}
{'name': 'Ada', 'hp': 75, 'alive': True, 'boss': None, 'items': ['sword', 'bow'], 'pos': [3, 4]}
False [3, 4] list
{"1": "a", "2": "b"} {'1': 'a'}
"caf\\u00e9 \\u2713" "café ✓"`,
          annotations: [
            { lines: 3, text: '`dumps` returns a **string**. `True` became `true`, `None` became `null` and the tuple became an array.' },
            { lines: 5, text: '`loads` parses the text back into ordinary Python objects: a `dict` with lists, `True` and `None`.' },
            { lines: 7, text: 'The round trip is **not perfect**: `back == player` is `False` because JSON has no tuples, so `(3, 4)` came back as the list `[3, 4]`.' },
            { lines: 8, text: 'JSON object keys are always **strings**. The integer keys `1` and `2` were turned into `"1"` and `"2"`, and they stay strings when loaded — a classic source of bugs.' },
            { lines: 9, text: 'By default non-ASCII characters are written as `\\uXXXX` escapes (safe anywhere). `ensure_ascii=False` keeps them readable — then write the file as UTF-8.' },
          ],
        },
        {
          type: 'table',
          headers: ['Python', 'JSON', 'Notes'],
          rows: [
            ['`dict`', 'object `{ }`', 'keys must be strings; other key types are converted'],
            ['`list`, `tuple`', 'array `[ ]`', 'tuples come back as lists'],
            ['`str`', 'string', 'always double quotes in JSON'],
            ['`int`, `float`', 'number', '`NaN` and infinity are not valid JSON'],
            ['`True` / `False`', '`true` / `false`', 'lowercase in JSON'],
            ['`None`', '`null`', 'the only way JSON says "no value"'],
            ['`set`, `datetime`, `Path`, your own objects', '—', '`TypeError`: convert them yourself (next step)'],
          ],
          caption: 'How Python values map to JSON. Only these types are supported out of the box.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why JSON and not Python’s own syntax?',
          text: 'You could save a dictionary with `str(data)` and read it back with `eval`, but `eval` runs arbitrary code — an attacker-written save file could delete your files. JSON is only *data*: parsing it can never execute anything. And because every language reads it, your Python tools can exchange files with a C++ engine, a web page or an editor plugin.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ has no JSON support in its standard library; projects add one (nlohmann/json, RapidJSON, simdjson). In Python it is built in, which is one reason Python is a favorite for tooling that generates or inspects game data files.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does `json.loads(json.dumps({"pos": (3, 4)}))["pos"]` return?',
      options: [
        { text: '`(3, 4)`, the same tuple', why: 'JSON has no tuple type, so the information that it was a tuple is lost.' },
        { text: '`[3, 4]`, a list', correct: true, why: 'Right: tuples are written as JSON arrays, and arrays are read back as lists.' },
        { text: '`"(3, 4)"`, a string', why: 'Python does not write the tuple as text; it writes a real JSON array.' },
        { text: 'It raises `TypeError`', why: 'Tuples are supported; they are simply converted to arrays.' },
      ],
      explanation: 'JSON only knows arrays, so a tuple is written as `[3, 4]` and read back as a list. If your code needs a tuple, convert after loading: `tuple(data["pos"])`.',
    },
    {
      kind: 'concept',
      title: 'JSON in practice: errors, defaults and save files',
      blocks: [
        {
          type: 'p',
          text: 'Real data is untrusted: files get corrupted, edited by hand, or written by an older version of your game. Parsing bad text raises `json.JSONDecodeError` (a subclass of `ValueError`, with the position of the problem). Writing something JSON cannot represent raises `TypeError`, unless you teach `dumps` how to convert it with the `default=` function.',
        },
        {
          type: 'code',
          title: 'json_errors.py',
          runnable: true,
          code: `import json, io
print(json.dumps({"b": 1, "a": [1, 2]}, indent=2, sort_keys=True))
buf = io.StringIO()
json.dump({"level": 3}, buf)
buf.seek(0)
print(buf.read(), json.load(io.StringIO('{"a": [1, 2]}')))
try:
    json.loads("{'name': 'Ada'}")
except json.JSONDecodeError as e:
    print(type(e).__name__, "|", e.msg, "|", e.lineno, e.colno, isinstance(e, ValueError))
try:
    json.dumps({"s": {1, 2}})
except TypeError as e:
    print(e)
def encode(obj):
    if isinstance(obj, set):
        return sorted(obj)
    raise TypeError(f"cannot encode {type(obj).__name__}")
print(json.dumps({"s": {3, 1, 2}}, default=encode))`,
          output: `{
  "a": [
    1,
    2
  ],
  "b": 1
}
{"level": 3} {'a': [1, 2]}
JSONDecodeError | Expecting property name enclosed in double quotes | 1 2 True
Object of type set is not JSON serializable
{"s": [1, 2, 3]}`,
          annotations: [
            { lines: 2, text: '`indent=2` pretty-prints with line breaks for humans, and `sort_keys=True` orders keys alphabetically so files are stable and diff-friendly in version control.' },
            { lines: '3-6', text: '`dump` writes JSON directly to a file object (here an in-memory one) and `load` reads from one. With real files: `with open(path, "w", encoding="utf-8") as f: json.dump(data, f)`.' },
            { lines: '7-10', text: 'JSON requires **double quotes**. Single quotes (valid Python, invalid JSON) raise `JSONDecodeError`, which reports the message and the line and column.' },
            { lines: '11-14', text: 'A `set` cannot be written. The `TypeError` message names the type.' },
            { lines: '15-19', text: '`default=` is called for every object `dumps` does not understand; return something serializable (here a sorted list) or raise `TypeError`.' },
          ],
        },
        {
          type: 'code',
          title: 'save_load.py',
          runnable: true,
          code: `import json
from pathlib import Path
def defaults():
    return {"version": 1, "level": 1, "hp": 100, "items": []}
def save_game(path, state):
    Path(path).write_text(json.dumps(state, indent=2), encoding="utf-8")
def load_game(path):
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return defaults()
    return {**defaults(), **data}

save_game("slot1.json", {"version": 1, "level": 4, "items": ["bow"]})
print(load_game("slot1.json"))
Path("slot1.json").write_text("{broken", encoding="utf-8")
print(load_game("slot1.json"))
Path("slot1.json").unlink()
print(load_game("slot1.json") == defaults())`,
          output: `{'version': 1, 'level': 4, 'hp': 100, 'items': ['bow']}
{'version': 1, 'level': 1, 'hp': 100, 'items': []}
True`,
          annotations: [
            { lines: '3-4', text: 'A function that builds **fresh** defaults each time. A shared module-level dict would let one caller’s changes (like appending to `items`) leak into the next call.' },
            { lines: 6, text: 'Saving is two steps — serialize to text, write the text — using `pathlib` from the previous lesson.' },
            { lines: '8-11', text: 'Loading is defensive: a missing or corrupted file falls back to defaults instead of crashing the game.' },
            { lines: 12, text: '`{**defaults(), **data}` merges two dicts, with the loaded values winning. A save written by an *older* version that lacks `hp` still loads, because the default fills the gap.' },
            { lines: 14, text: 'A partial save: only some keys were stored, and the merge supplies the rest.' },
            { lines: 16, text: 'Simulating corruption: the text is not valid JSON, so the loader quietly returns defaults.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Version your save files',
          text: 'Store a `"version"` number in every save. When a later release changes the format, `load_game` can check the number and *migrate* old data (rename a key, add a field) instead of rejecting it. Players hate losing saves after an update.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Do not trust loaded data',
          text: 'Loading succeeds for *any* valid JSON — a list, a number or a dictionary with unexpected keys and wrong types. After `loads`, check what you got (`isinstance(data, dict)`, ranges, required keys) before using it, especially for data from the network or from mods.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `import json
print(json.dumps({"a": None, "b": [True, 1.5]}))`,
      answer: '{"a": null, "b": [true, 1.5]}',
      hint: 'Convert `None`, `True` and the quoting style to their JSON forms.',
      explanation: '`None` becomes `null` and `True` becomes `true` (lowercase). Strings use double quotes, and the default separators are `", "` between items and `": "` after keys.',
    },
    {
      kind: 'fill',
      prompt: 'Pick the right `json` function for each step.',
      template: `import json
text = json.___({"hp": 5})        # Python object -> string
data = json.___(text)             # string -> Python object
with open("save.json", "w", encoding="utf-8") as f:
    json.___(data, f)             # Python object -> file`,
      templateIsCode: true,
      blanks: [{ answers: ['dumps'] }, { answers: ['loads'] }, { answers: ['dump'] }],
      wordBank: ['dumps', 'loads', 'dump', 'load'],
      explanation: 'The functions ending in `s` work with **s**trings: `dumps` makes one, `loads` reads one. The ones without the `s` work with file objects: `dump(data, f)` writes to the file and `load(f)` reads from it.',
    },
    {
      kind: 'concept',
      title: 'CSV: tables as text',
      blocks: [
        {
          type: 'p',
          text: 'A **CSV** (comma-separated values) file is a table: one row per line, columns separated by commas. Spreadsheets, databases and data-science tools all import and export it, so it is the format for leaderboards, balance tables and datasets. It looks trivial, but real data contains commas, quotes and line breaks inside fields, which is why you should use the `csv` module instead of `line.split(",")`: it handles the **quoting** rules for you.',
        },
        {
          type: 'code',
          title: 'csv_basics.py',
          runnable: true,
          code: `import csv, io
rows = [["name", "score"], ["Ada", 120], ["Ben, Jr.", 95], ['Say "hi"', 7]]
buf = io.StringIO()
csv.writer(buf, lineterminator="\\n").writerows(rows)
print(repr(buf.getvalue()))
buf.seek(0)
for row in csv.reader(buf):
    print(row)
buf = io.StringIO()
dw = csv.DictWriter(buf, fieldnames=["name", "score"], lineterminator="\\n")
dw.writeheader()
dw.writerow({"name": "Cai", "score": 7})
dw.writerow({"name": "Dee", "score": 300})
buf.seek(0)
records = list(csv.DictReader(buf))
print(records)
print(sum(int(r["score"]) for r in records))`,
          output: `'name,score\\nAda,120\\n"Ben, Jr.",95\\n"Say ""hi""",7\\n'
['name', 'score']
['Ada', '120']
['Ben, Jr.', '95']
['Say "hi"', '7']
[{'name': 'Cai', 'score': '7'}, {'name': 'Dee', 'score': '300'}]
307`,
          annotations: [
            { lines: 4, text: '`writer(...).writerows(rows)` writes every row. Passing an in-memory `StringIO` keeps the demo self-contained; for a real file you open it with `open(path, "w", newline="", encoding="utf-8")`.' },
            { lines: 5, text: 'Look at the quoting: a field with a comma gets double quotes, and a quote inside a field is **doubled**. Numbers are written as text.' },
            { lines: '7-8', text: '`csv.reader` yields each row as a list of **strings** — including the numbers. It correctly un-quotes `"Ben, Jr."` into one field.' },
            { lines: '9-13', text: '`DictWriter` writes dictionaries, using `fieldnames` as the column order. `writeheader` writes the first line.' },
            { lines: 15, text: '`DictReader` uses the header row to give you one **dictionary per row**, so code reads `r["score"]` instead of remembering that the score is column 1.' },
            { lines: 17, text: 'Everything read from CSV is text — convert it yourself (`int(r["score"])`) before doing arithmetic.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'open(..., newline="") for CSV files',
          text: 'The `csv` module does its own line-ending handling. When you open a real CSV file, pass `newline=""` (and `encoding="utf-8"`) — otherwise text mode’s newline translation can insert blank lines on Windows or corrupt fields that contain line breaks.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Other separators',
          text: 'Pass `delimiter=";"` (common in European spreadsheet exports) or `delimiter="\\t"` for tab-separated files. For large numeric tables you will later prefer `pandas.read_csv`, which also detects types — but the `csv` module is lightweight, built in, and perfect for small files.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'When `csv.reader` reads a field containing `120`, it gives you the integer `120`.',
      answer: false,
      explanation: 'False. CSV carries no type information, so `csv.reader` and `DictReader` return every field as a string (`"120"`). Convert it yourself with `int(...)` or `float(...)`; `pandas` can guess the types for you.',
    },
    {
      kind: 'error',
      prompt: 'The program should print the total score `215`, but it crashes with a `TypeError`. Tap the line with the bug.',
      lines: [
        'import csv, io',
        'data = io.StringIO("name,score\\nAda,120\\nBen,95\\n")',
        'total = 0',
        'for row in csv.DictReader(data):',
        '    total += row["score"]',
        'print(total)',
      ],
      linesAreCode: true,
      errorLines: [5],
      explanation: '`row["score"]` is the *string* `"120"`, and `int += str` is a `TypeError`. Convert first: `total += int(row["score"])`.',
    },
    {
      kind: 'concept',
      title: 'Choosing a format: TOML, INI and pickle',
      blocks: [
        {
          type: 'p',
          text: 'JSON and CSV are not the only options. **TOML** is designed for hand-edited configuration: it has comments, nested sections and real types, and Python’s standard library can read it with `tomllib` (3.11+; reading only). **INI** files are the older "sections with key = value" style, read with `configparser`. And `pickle` can save almost *any* Python object — with a serious catch.',
        },
        {
          type: 'code',
          title: 'config_formats.py',
          runnable: true,
          code: `import tomllib, configparser
cfg = tomllib.loads("""
title = "Forge"
[window]
width = 1280
fullscreen = false
[audio]
volume = 0.8
tracks = ["menu", "battle"]
""")
print(cfg)
cp = configparser.ConfigParser()
cp.read_string("[video]\\nwidth = 800\\nvsync = yes\\n")
print(cp["video"].getint("width"), cp["video"].getboolean("vsync"), cp.sections())`,
          output: `{'title': 'Forge', 'window': {'width': 1280, 'fullscreen': False}, 'audio': {'volume': 0.8, 'tracks': ['menu', 'battle']}}
800 True ['video']`,
          annotations: [
            { lines: '2-10', text: 'A TOML document: top-level keys, `[sections]` for nested tables, and real integers, floats, booleans and arrays.' },
            { lines: 11, text: '`tomllib.loads` returns plain nested dictionaries with the correct Python types — `1280` is an `int` and `false` is `False`. (`tomllib` only **reads** TOML; use a third-party package such as `tomli-w` to write it.)' },
            { lines: '12-13', text: '`configparser` reads INI files into sections. Every value is a string until you ask for a type.' },
            { lines: 14, text: '`getint` and `getboolean` convert, understanding `yes`/`no`/`true`/`false`/`1`/`0`.' },
          ],
        },
        {
          type: 'table',
          headers: ['Format', 'Best for', 'Watch out for'],
          rows: [
            ['JSON', 'saves, API data, tool exchange', 'no comments, no tuples/sets, string keys'],
            ['CSV', 'tables, leaderboards, spreadsheets', 'everything is a string; one flat table only'],
            ['TOML', 'settings people edit by hand', 'read-only in the standard library'],
            ['INI', 'simple legacy settings', 'strings only, one level of sections'],
            ['YAML', 'complex human-written config', 'third-party (`PyYAML`); use `safe_load` only'],
            ['pickle', 'caching your own trusted data', '**unsafe** to load from untrusted sources'],
          ],
          caption: 'A rule of thumb: machine-written data → JSON; human-edited settings → TOML; tables → CSV.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Never unpickle untrusted data',
          text: '`pickle.load` can execute arbitrary code embedded in the file, so loading a pickle from a download, a mod or another player is as dangerous as running an unknown program. Use pickle only for data your own program wrote and nobody else can modify (for example a local cache) — and prefer JSON for anything that is shared.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Plain data in, plain data out',
          text: 'The most maintainable pattern: convert your game objects to plain dicts and lists (`to_dict()`), write those as JSON, and rebuild objects from them (`from_dict()`). You keep a human-readable, version-able, language-neutral file, and the save format does not depend on your class layout. Unit 10 shows `dataclasses.asdict` doing much of this for you.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'How many characters are in the string returned by `json.dumps([1, 2, 3])`?',
      answer: '9',
      hint: 'The default separator after each item is a comma and a space: `[1, 2, 3]`.',
      explanation: 'The text is `[1, 2, 3]`: two brackets, three digits, and two `", "` separators of two characters each, so $2 + 3 + 4 = 9$ characters.',
      label: 'Characters:',
    },
    {
      kind: 'code',
      prompt: 'Write `load_settings(text, defaults)` that parses `text` as JSON and returns a **new** dict made from `defaults`, updated with the parsed values — but only for keys that already exist in `defaults` (unknown keys are ignored). If `text` is not valid JSON, or is valid JSON but not an object (for example a list), return a copy of `defaults`. Do not modify `defaults`.',
      starter: `import json

# define load_settings here
`,
      solution: `import json

def load_settings(text, defaults):
    result = dict(defaults)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return result
    if not isinstance(data, dict):
        return result
    for key, value in data.items():
        if key in defaults:
            result[key] = value
    return result
`,
      tests: `d = {"volume": 5, "fullscreen": False}
assert load_settings('{"volume": 9}', d) == {"volume": 9, "fullscreen": False}
assert load_settings('{"volume": 9, "cheat": true}', d) == {"volume": 9, "fullscreen": False}
assert load_settings("{broken", d) == d
assert load_settings("[1, 2]", d) == d
assert load_settings('"hello"', d) == d
assert load_settings("{}", d) == d
assert load_settings("", d) == d
r = load_settings('{"volume": 1}', d)
assert d == {"volume": 5, "fullscreen": False}, "defaults must not change"
assert r is not d`,
      checks: ['Valid values override the defaults', 'Unknown keys are ignored', 'Invalid JSON and non-object JSON return the defaults', '`defaults` itself is never modified'],
      hint: 'Start from `result = dict(defaults)`. Parse in a `try` that catches `json.JSONDecodeError`, check `isinstance(data, dict)`, then copy over only keys found in `defaults`.',
      explanation: 'Two separate failure modes need handling: text that is not JSON at all (`JSONDecodeError`) and JSON that parses but has the wrong *shape* (a list or string). Copying only known keys protects the program from unexpected data, and working on a copy keeps `defaults` safe for the next call.',
    },
    {
      kind: 'code',
      prompt: 'Write `scores_to_csv(scores)` that takes a dict of `name → score` and returns CSV text with the header `name,score`, one row per player sorted by score (highest first, ties by name), every line ending in `"\\n"`. Use the `csv` module so names containing commas or quotes are quoted correctly.',
      starter: `import csv
import io

# define scores_to_csv here
`,
      solution: `import csv
import io

def scores_to_csv(scores):
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\\n")
    writer.writerow(["name", "score"])
    for name, score in sorted(scores.items(), key=lambda item: (-item[1], item[0])):
        writer.writerow([name, score])
    return buf.getvalue()
`,
      tests: `assert scores_to_csv({"Ada": 120, "Ben, Jr.": 95}) == 'name,score\\nAda,120\\n"Ben, Jr.",95\\n', repr(scores_to_csv({"Ada": 120, "Ben, Jr.": 95}))
assert scores_to_csv({}) == "name,score\\n"
assert scores_to_csv({"B": 5, "A": 5, "C": 9}) == "name,score\\nC,9\\nA,5\\nB,5\\n"
assert scores_to_csv({'Say "hi"': 1}) == 'name,score\\n"Say ""hi""",1\\n'`,
      checks: ['Header row first', 'Sorted by score descending, then name', 'Commas and quotes in names are quoted by the csv module'],
      hint: 'Write into an `io.StringIO` with `csv.writer(buf, lineterminator="\\n")`. Sort with `key=lambda item: (-item[1], item[0])`, then return `buf.getvalue()`.',
      explanation: 'Negating the score in the sort key gives descending order while the name breaks ties alphabetically. Letting `csv.writer` produce the lines means a name like `Ben, Jr.` is quoted automatically — building the line with an f-string would silently corrupt the file.',
    },
    {
      kind: 'code',
      prompt: 'Write `average_by_team(csv_text)` that parses CSV text with the header `name,team,score` and returns a dict mapping each team to the **average score** (a float) of its members. For `"name,team,score\\nAda,red,10\\nBen,red,20\\nCai,blue,7\\n"` the result is `{"red": 15.0, "blue": 7.0}`.',
      starter: `import csv
import io

# define average_by_team here
`,
      solution: `import csv
import io

def average_by_team(csv_text):
    totals = {}
    counts = {}
    for row in csv.DictReader(io.StringIO(csv_text)):
        team = row["team"]
        totals[team] = totals.get(team, 0) + int(row["score"])
        counts[team] = counts.get(team, 0) + 1
    return {team: totals[team] / counts[team] for team in totals}
`,
      tests: `text = "name,team,score\\nAda,red,10\\nBen,red,20\\nCai,blue,7\\n"
assert average_by_team(text) == {"red": 15.0, "blue": 7.0}
assert average_by_team("name,team,score\\n") == {}
assert average_by_team('name,team,score\\n"Lee, Al",green,3\\nBo,green,4\\n') == {"green": 3.5}
assert isinstance(average_by_team(text)["blue"], float)`,
      checks: ['Scores are converted to numbers before adding', 'Averages are floats per team', 'Quoted names containing commas are handled, and an empty table gives `{}`'],
      hint: 'Wrap the text in `io.StringIO` and loop over `csv.DictReader`. Keep a running total and a count per team, then divide at the end.',
      explanation: '`DictReader` makes each row a dictionary, so the code reads `row["team"]` and `row["score"]`, and the module takes care of the quoted `"Lee, Al"`. Scores are strings until converted with `int`, and dividing two ints with `/` always gives a float.',
    },
  ],
  takeaways: [
    '`json.dumps`/`loads` convert to and from strings; `dump`/`load` use file objects. Types map as dict↔object, list/tuple→array, `True`/`None`→`true`/`null` — tuples come back as lists and keys become strings.',
    'Handle `JSONDecodeError` and `TypeError`, use `default=` for custom types, merge loaded data over fresh defaults, version your files, and validate what you loaded.',
    'Use the `csv` module (never `split(",")`): it handles quoting. `reader` gives lists of strings, `DictReader`/`DictWriter` use the header row; open real files with `newline=""`.',
    'Everything read from CSV is a string — convert with `int`/`float` before computing.',
    'Machine-written data → JSON; human-edited settings → TOML (`tomllib`) or INI (`configparser`); tables → CSV. Never unpickle untrusted data.',
  ],
  reading: [
    { title: 'json — JSON encoder and decoder', url: 'https://docs.python.org/3/library/json.html', source: 'docs', note: 'All options of `dump`/`load`, custom encoders, and the exact type mapping.' },
    { title: 'csv — CSV File Reading and Writing', url: 'https://docs.python.org/3/library/csv.html', source: 'docs', note: 'Dialects, quoting options, and `DictReader`/`DictWriter`.' },
    { title: 'tomllib — Parse TOML files', url: 'https://docs.python.org/3/library/tomllib.html', source: 'docs', note: 'Reading TOML with the standard library, and the TOML-to-Python type table.' },
    { title: 'pickle — Python object serialization', url: 'https://docs.python.org/3/library/pickle.html', source: 'docs', note: 'Read the security warning at the top before using pickle.' },
  ],
};
