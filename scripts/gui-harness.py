"""Smoke-test harness for the tkinter and pygame example programs.

Usage: python gui-harness.py <tk|pg> <file.py> [seconds] [tests.py]

With a tests file (code questions) the program runs first, then the tests run in the same
namespace, exactly as the app does with its stand-in library.

The program is executed as __main__. For tkinter the main loop is shortened so the
window closes by itself, and an exception inside any callback fails the run. For
pygame a QUIT event is posted after a short while. Placeholder assets
(assets/player.png, assets/click.wav ...) are generated in the working directory so
examples can load files without shipping any.
"""
import os
import runpy
import sys
import traceback

kind, path = sys.argv[1], sys.argv[2]
seconds = float(sys.argv[3]) if len(sys.argv) > 3 else 0.7
tests_path = sys.argv[4] if len(sys.argv) > 4 else None


def make_assets():
    import wave
    import struct
    import math

    os.makedirs("assets", exist_ok=True)
    os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
    os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
    import pygame

    pygame.init()
    pygame.display.set_mode((64, 64))

    def img(name, size, color, shape="rect"):
        s = pygame.Surface(size, pygame.SRCALPHA)
        if shape == "circle":
            pygame.draw.ellipse(s, color, s.get_rect())
        else:
            s.fill(color)
            pygame.draw.rect(s, (0, 0, 0), s.get_rect(), 2)
        pygame.image.save(s, f"assets/{name}")

    img("player.png", (48, 48), (60, 180, 90))
    img("enemy.png", (40, 40), (200, 60, 60))
    img("bullet.png", (6, 16), (250, 230, 80))
    img("coin.png", (24, 24), (250, 200, 40), "circle")
    img("ball.png", (24, 24), (240, 240, 240), "circle")
    img("tiles.png", (64, 32), (120, 90, 60))
    img("icon.png", (32, 32), (60, 180, 90))
    bg = pygame.Surface((800, 600))
    bg.fill((20, 24, 48))
    pygame.image.save(bg, "assets/background.png")
    sheet = pygame.Surface((128, 32), pygame.SRCALPHA)
    for i in range(4):
        pygame.draw.rect(sheet, (60 + 40 * i, 120, 200 - 40 * i), (i * 32 + 2, 2, 28, 28))
    pygame.image.save(sheet, "assets/spritesheet.png")
    for name in ("click.wav", "shoot.wav", "explosion.wav", "music.wav"):
        with wave.open(f"assets/{name}", "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(22050)
            frames = b"".join(struct.pack("<h", int(8000 * math.sin(i / 8))) for i in range(2205))
            w.writeframes(frames)
    pygame.quit()


if kind == "pg":
    make_assets()
src = open(path, encoding="utf-8").read()
code = compile(src, os.path.basename(path), "exec")

if kind == "tk":
    import tkinter as tk
    from tkinter import messagebox, filedialog, simpledialog, colorchooser

    failures = []

    def report(self, exc, val, tb):
        failures.append("".join(traceback.format_exception(exc, val, tb)))

    tk.Tk.report_callback_exception = report
    tk.Toplevel.report_callback_exception = report

    def short_mainloop(self, n=0):
        self.update()
        self.after(int(seconds * 1000), self.quit)
        self._orig_mainloop(n)

    tk.Misc._orig_mainloop = tk.Misc.mainloop
    tk.Misc.mainloop = short_mainloop
    tk.mainloop = lambda n=0: tk._default_root and short_mainloop(tk._default_root, n)
    for name in ("showinfo", "showwarning", "showerror"):
        setattr(messagebox, name, lambda *a, **k: "ok")
    for name in ("askyesno", "askokcancel", "askretrycancel"):
        setattr(messagebox, name, lambda *a, **k: True)
    messagebox.askquestion = lambda *a, **k: "yes"
    messagebox.askyesnocancel = lambda *a, **k: True
    filedialog.askopenfilename = lambda *a, **k: ""
    filedialog.asksaveasfilename = lambda *a, **k: ""
    filedialog.askdirectory = lambda *a, **k: ""
    simpledialog.askstring = lambda *a, **k: "demo"
    simpledialog.askinteger = lambda *a, **k: 7
    simpledialog.askfloat = lambda *a, **k: 1.5
    colorchooser.askcolor = lambda *a, **k: ((255, 0, 0), "#ff0000")
else:
    import pygame

    pygame.init()
    pygame.time.set_timer(pygame.QUIT, int(seconds * 1000), loops=1)
    # blocking helpers would hang a headless run
    pygame.event.wait = lambda *a, **k: pygame.event.Event(pygame.QUIT)

ns = {"__name__": "__main__", "__file__": os.path.abspath(path)}
try:
    exec(code, ns)
    if tests_path:
        exec(compile(open(tests_path, encoding="utf-8").read(), "tests.py", "exec"), ns)
except SystemExit:
    pass
except BaseException:
    traceback.print_exc()
    sys.exit(1)
if kind == "tk" and failures:
    sys.stderr.write("\n".join(failures))
    sys.exit(1)
