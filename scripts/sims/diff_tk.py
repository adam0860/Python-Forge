"""Differential test: run the same snippets on real tkinter and on the stand-in; outputs must match.
usage: diff_tk.py real|sim   (real needs a display: use xvfb-run and a Python with tkinter)"""
import sys, os, json
mode = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
if mode == 'sim':
    src = open(os.path.join(here, 'tk_opts.py')).read() + open(os.path.join(here, 'tksim.py')).read()
    exec(compile(src, 'sim', 'exec'), {'__name__': 'sim'})
import tkinter as tk
from tkinter import ttk, messagebox

CASES = [l for l in open(os.path.join(here, 'tk_cases.txt'), encoding='utf-8').read().split('\n---\n') if l.strip()]
for n, case in enumerate(CASES):
    ns = {'tk': tk, 'ttk': ttk, 'messagebox': messagebox}
    root = tk.Tk()
    ns['root'] = root
    try:
        exec(case, ns)
        res = ns.get('result')
        out = repr(res)
    except BaseException as e:
        out = '%s: %s' % (type(e).__name__, e)
    print('%03d %s' % (n, out.replace('\n', '\\n')))
    try:
        root.destroy()
    except Exception:
        pass
