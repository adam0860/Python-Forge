"""Differential test: run the same snippets on real pygame and on the stand-in; outputs must match.
usage: diff_pg.py real|sim   (real needs pygame installed; SDL dummy drivers are set automatically)"""
import sys, os
os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
mode = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
if mode == 'sim':
    src = open(os.path.join(here, 'pg_consts.py')).read() + open(os.path.join(here, 'pgsim.py')).read()
    exec(compile(src, 'sim', 'exec'), {'__name__': 'sim'})
else:
    import contextlib, io
    with contextlib.redirect_stdout(io.StringIO()):
        import pygame
        pygame.init()
import pygame
CASES = [l for l in open(os.path.join(here, 'pg_cases.txt'), encoding='utf-8').read().split('\n---\n') if l.strip()]
for n, case in enumerate(CASES):
    ns = {'pygame': pygame}
    try:
        exec(case, ns)
        out = repr(ns.get('result'))
    except BaseException as e:
        out = '%s: %s' % (type(e).__name__, e)
    print('%03d %s' % (n, out.replace('\n', '\\n')))
