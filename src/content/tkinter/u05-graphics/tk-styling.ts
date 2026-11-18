import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-styling',
  title: 'Styling: Themes, Fonts, Colors, Images',
  summary: 'Make a tkinter app look designed: ttk themes and custom styles with Style.configure and Style.map, named fonts that restyle a whole app, hex colors and readable contrast, classic widget options, and images that stay visible.',
  minutes: 34,
  objectives: [
    'Choose a ttk theme with `Style.theme_use` and change widgets with `Style.configure` and `Style.map`',
    'Create a named style variant such as `"Accent.TButton"` and apply it with `style=`',
    'Use named fonts (`TkDefaultFont`) and `tkinter.font.Font` to change text for a whole app',
    'Work with hex colors, build a palette, and choose a readable text color for a given background',
    'Show images with `PhotoImage` and keep a reference to them, with `zoom` and `subsample`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Themes and styles',
      blocks: [
        {
          type: 'p',
          text: 'Every ttk widget asks its [[ttk-style|style]] how to draw itself. A style is a name (`"TButton"`, `"TLabel"`, `"Treeview"`) with a set of options such as `background`, `foreground`, `padding`, `font` and `borderwidth`. The styles belong to a **theme**, a complete look for all widgets. `ttk.Style().theme_names()` lists the available themes: typically `clam`, `alt`, `default` and `classic` everywhere, plus the native ones (`vista` and `winnative` on Windows, `aqua` on macOS). `theme_use("clam")` switches the whole app.',
        },
        {
          type: 'p',
          text: 'You change a style with **`style.configure(name, **options)`**, and make an option depend on the widget’s state with **`style.map(name, option=[(state, value), ...])`**: for example a different background when the mouse is over the button (`active`) or the button is `disabled`. To restyle just some widgets, create a **variant** named `"Something.TButton"` and select it with `style="Something.TButton"`: it inherits everything from `TButton`.',
        },
        {
          type: 'code',
          title: 'themed_app.py',
          desktopOnly: true,
          code: `import tkinter as tk
from tkinter import ttk

root = tk.Tk()
root.title("Themes")
style = ttk.Style(root)
print("Available themes:", style.theme_names())
style.theme_use("clam")
style.configure("TLabel", font=("Segoe UI", 11))
style.configure("Accent.TButton", font=("Segoe UI", 11, "bold"), padding=(14, 8),
                background="#2a9d8f", foreground="white", borderwidth=0)
style.map("Accent.TButton",
          background=[("active", "#21867a"), ("disabled", "#b8c4c2")],
          foreground=[("disabled", "#eeeeee")])

frame = ttk.Frame(root, padding=20)
frame.pack()
ttk.Label(frame, text="Theme:").grid(row=0, column=0, sticky="w")
chooser = ttk.Combobox(frame, values=style.theme_names(), state="readonly")
chooser.set(style.theme_use())
chooser.grid(row=0, column=1, padx=(10, 0))
chooser.bind("<<ComboboxSelected>>", lambda event: style.theme_use(chooser.get()))
ttk.Button(frame, text="Normal button").grid(row=1, column=0, columnspan=2, pady=(15, 5), sticky="ew")
ttk.Button(frame, text="Accent button", style="Accent.TButton").grid(row=2, column=0, columnspan=2, sticky="ew")
root.mainloop()`,
          annotations: [
            { lines: '6-8', text: 'A `Style` object controls the whole app. `theme_use("clam")` picks a theme that honors custom colors (the native Windows and macOS themes ignore many of them).' },
            { lines: 9, text: '`configure("TLabel", ...)` changes every `ttk.Label` in the program, present and future.' },
            { lines: '10-11', text: 'The name `"Accent.TButton"` is a **variant** of `TButton`: it keeps all the normal button behavior and overrides the listed options. Only buttons created with `style="Accent.TButton"` use it.' },
            { lines: '12-14', text: '`map` lists `(state, value)` pairs and the first matching state wins, so the button darkens under the mouse and greys out when disabled.' },
            { lines: 22, text: 'Switching themes at run time is one call. Remember that `configure` settings belong to the theme that was active when you made them.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why is “clam” the theme to use for custom colors?',
          text: 'Native themes (`vista` on Windows, `aqua` on macOS) ask the operating system to paint widgets, and the system ignores colors that you try to set: a ttk button with `background="red"` stays gray there. `clam`, `alt`, `default` and `classic` paint the widgets themselves, so they follow your colors on every platform. Choose a native theme when you want the platform look, and `clam` when you want your own look.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Style settings belong to a theme',
          text: 'Everything you set with `configure` and `map` is stored in the **current theme**. If you call `theme_use("alt")` later, your accent button is back to the default look. Call `theme_use` first, then configure the styles (and configure them again if you let the user switch themes).',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'How do you give just one ttk button a green background while the other buttons keep the default look?',
      options: [
        { text: 'Configure a variant style such as `"Green.TButton"` (using a theme like `clam`) and create the button with `style="Green.TButton"`', correct: true, why: 'A style named `Name.TButton` inherits from `TButton` and overrides only what you set. The widget picks it with its `style` option.' },
        { text: 'Pass `bg="green"` to that `ttk.Button`', why: 'A `ttk.Button` has no `bg` option: Tk would raise `unknown option "-bg"`.' },
        { text: 'Call `style.configure("TButton", background="green")`', why: 'This changes **every** ttk button, not just one.' },
        { text: 'Call `button.config(style="TButton")` after changing the theme', why: 'That selects the default style, which is not what we want.' },
      ],
      explanation: 'The pattern is always the same: configure `"Something.TWidget"` once, and pass `style="Something.TWidget"` to the widgets that should use it. `map` adds the state-dependent parts, such as the hover color.',
    },
    {
      kind: 'truefalse',
      prompt: 'Colors set with `style.configure("TButton", background="red")` look the same under every ttk theme, including the native Windows theme.',
      answer: false,
      explanation: 'False. The native themes (`vista`, `winnative`, `aqua`) let the operating system draw the widgets and ignore many color options. The Tk-drawn themes (`clam`, `alt`, `default`, `classic`) apply them. Call `style.theme_use("clam")` first when you need exact colors.',
    },
    {
      kind: 'concept',
      title: 'Fonts, colors and images',
      blocks: [
        {
          type: 'p',
          text: 'Fonts are given as a tuple, `("Segoe UI", 12, "bold")` (family, size, then style words), or as a `tkinter.font.Font` object. Tk also keeps **named fonts** that every widget uses by default: `TkDefaultFont`, `TkTextFont`, `TkFixedFont`, `TkMenuFont`, `TkHeadingFont` and a few more. `tkfont.nametofont("TkDefaultFont").configure(size=12)` changes the text size of **every widget that uses the default font**: the cheapest way to make a whole app larger or smaller. A positive size is in points; a negative size means pixels.',
        },
        {
          type: 'p',
          text: 'Colors are color names (`"white"`, `"tomato"`, `"steelblue"`) or **hex strings** `"#rrggbb"`, two hex digits for red, green and blue. Pick a small **palette** (a background, a surface, a text color, one accent) and use it everywhere: consistency does more for the look of an app than any individual choice. The helpers below convert and lighten colors in plain Python:',
        },
        {
          type: 'code',
          title: 'color_tools.py',
          runnable: true,
          code: `def hex_to_rgb(color):
    color = color.lstrip("#")
    return tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return "#%02x%02x%02x" % rgb


def lighten(color, amount):
    r, g, b = hex_to_rgb(color)
    return rgb_to_hex(tuple(min(255, round(c + (255 - c) * amount)) for c in (r, g, b)))


print(hex_to_rgb("#4cc9f0"))
print(rgb_to_hex((16, 24, 32)))
print(lighten("#101820", 0.5))
print(int("ff", 16), int("80", 16))`,
          output: `(76, 201, 240)
#101820
#888c90
255 128`,
          annotations: [
            { lines: '1-3', text: 'The six digits are three pairs, red, green and blue, each a hexadecimal number from `00` to `ff` (0 to 255). `int(pair, 16)` parses one pair.' },
            { lines: '6-7', text: '`%02x` formats a number as two lowercase hex digits, padded with a zero (16 becomes `10`).' },
            { lines: '10-12', text: 'To lighten a color, move each channel part of the way toward 255. This is how you derive a hover color from your accent color.' },
          ],
        },
        {
          type: 'code',
          title: 'pixel_sprite.py',
          desktopOnly: true,
          code: `import tkinter as tk
from tkinter import font as tkfont

root = tk.Tk()
root.title("Fonts and images")
default = tkfont.nametofont("TkDefaultFont")
default.configure(size=12)
title_font = tkfont.Font(family="Segoe UI", size=20, weight="bold")
tk.Label(root, text="Pixel art", font=title_font, fg="#264653").pack(padx=20, pady=(15, 5))

sprite = tk.PhotoImage(width=8, height=8)
pattern = ["..XXXX..", ".XXXXXX.", "XX.XX.XX", "XXXXXXXX", "XXXXXXXX", ".X.XX.X.", "X......X", ".X....X."]
for y, row in enumerate(pattern):
    for x, cell in enumerate(row):
        if cell == "X":
            sprite.put("#2a9d8f", (x, y))
big = sprite.zoom(16)
label = tk.Label(root, image=big, bg="#f1faee", padx=10, pady=10)
label.image = big
label.pack(padx=20, pady=(5, 20))
root.mainloop()`,
          annotations: [
            { lines: '6-7', text: 'A named font is shared: changing `TkDefaultFont` re-sizes every widget that has no font of its own.' },
            { lines: 8, text: 'A `Font` object can be reused across widgets, and changing it later (for example `title_font.configure(size=24)`) updates all of them at once.' },
            { lines: '11-16', text: '`PhotoImage(width, height)` makes a blank image, and `put(color, (x, y))` sets one pixel. Here a text pattern is turned into pixel art. Real programs usually load a file: `PhotoImage(file="logo.png")` (PNG and GIF are supported).' },
            { lines: 17, text: '`zoom(16)` repeats every pixel 16 times in each direction. `subsample(n)` does the opposite and keeps every n-th pixel.' },
            { lines: '18-20', text: 'The label stores `big` as its image, but tkinter does not keep the image alive. `label.image = big` holds a reference so that the picture is not garbage collected.' },
          ],
        },
        {
          type: 'table',
          headers: ['Task', 'Tool'],
          rows: [
            ['Whole-app text size', '`tkfont.nametofont("TkDefaultFont").configure(size=12)` (also `TkTextFont`, `TkMenuFont`, `TkHeadingFont`, `TkFixedFont`)'],
            ['A reusable font', '`f = tkfont.Font(family="Segoe UI", size=14, weight="bold")`, then `font=f`'],
            ['Window and widget colors (classic)', '`bg`, `fg`, `activebackground`, `highlightbackground` options, and `root.configure(bg=...)`'],
            ['Spacing and borders (classic)', '`padx`, `pady`, `bd` (border width), `relief` (`"flat"`, `"raised"`, `"sunken"`, `"groove"`)'],
            ['Window icon', '`root.iconbitmap("app.ico")` (Windows) or `root.iconphoto(True, photo)` (all systems)'],
            ['Sharp text on high-DPI Windows', '`ctypes.windll.shcore.SetProcessDpiAwareness(1)` before creating the window'],
            ['Whole-window transparency / always on top', '`root.attributes("-alpha", 0.9)`, `root.attributes("-topmost", True)`'],
          ],
          caption: 'A style cheat sheet for tkinter windows.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the lines that pick the `clam` theme and set the padding of every ttk button.',
      template: `style = ttk.Style()
style.___("clam")
style.___("TButton", padding=8)`,
      templateIsCode: true,
      blanks: [{ answers: ['theme_use'] }, { answers: ['configure'] }],
      wordBank: ['theme_use', 'configure', 'map', 'lookup', 'theme_names'],
      explanation: '`theme_use(name)` switches the theme, and `configure(style_name, **options)` sets options of a style. `map` is for options that depend on the widget state, `lookup` reads a value back, and `theme_names` lists the themes.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This is how a hex color such as `#ff8000` is split into its red and green channel values.',
      code: `print(int("ff", 16), int("80", 16))`,
      answer: '255 128',
      hint: 'ff and 80 are hexadecimal numbers.',
      explanation: '`ff` in hexadecimal is 15 x 16 + 15 = 255 (the maximum for a channel), and `80` is 8 x 16 = 128. So `#ff8000` is full red, half green and no blue: orange.',
    },
    {
      kind: 'concept',
      title: 'Design habits that make apps look good',
      blocks: [
        {
          type: 'p',
          text: 'Styling is mostly **restraint**. Choose **one font family** and two or three sizes (body, heading, small), **one accent color** and a couple of neutrals, and use consistent **spacing**: the same `padx`/`pady` or `padding` values everywhere (8 and 16 pixels work well). Make sure that text is **readable**: dark text on a light background or the reverse, never two mid-tones. The test for a text color is its **luminance**, how bright the color looks to the eye. Green counts most, and blue least: `0.299 * R + 0.587 * G + 0.114 * B`. Use black text when that number is above about 150 and white text when it is not.',
        },
        {
          type: 'p',
          text: 'Keep the **colors in one place**: a dictionary such as `PALETTE = {"bg": "#101820", "fg": "#eeeeee", "accent": "#2a9d8f"}` and one function that applies it to the style. Changing the look of the whole program, or adding a light and a dark theme, is then a matter of editing that one dictionary instead of hunting for colors across the code.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Try the style in isolation',
          text: 'Build a small “style sampler” window with one of each widget (a label, an entry, a button, a checkbutton, a combobox, a treeview) and look at it under each theme. It takes ten minutes and shows exactly which options your chosen theme honors, long before you build the real screens.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code raises `_tkinter.TclError: unknown color name "reed"`. Tap the line that raises it.',
      lines: [
        'root = tk.Tk()',
        'label = tk.Label(root, text="Hello")',
        'label.config(fg="reed")',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Tk checks colors when they are set, and “reed” is not a color name (the intended `"red"` has a typo). Use the standard names or the hex form `"#rrggbb"`. A badly written hex string gives a similar error (`invalid color name "#12"`).',
    },
    {
      kind: 'numeric',
      prompt: 'A `PhotoImage` is 64 pixels wide. What is the width of `image.zoom(3)`?',
      answer: '192',
      hint: 'zoom repeats every pixel the given number of times in each direction.',
      explanation: '`zoom(3)` makes every pixel three pixels wide, so the width is 64 x 3 = 192. (`subsample(2)` would halve it to 32.) These two calls are how you enlarge pixel art without blur, or make a thumbnail cheaply.',
      label: 'Width:',
    },
    {
      kind: 'concept',
      title: 'Your turn: styling with code',
      blocks: [
        {
          type: 'p',
          text: 'In these exercises Tk answers the same questions as in a real program: `style.lookup(style, option)` returns what you configured, `nametofont(name).cget("size")` returns the size of a named font, and widgets report their `bg` and `fg` with `cget`. Colors must be valid, because Tk checks them when they are set.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `apply_theme(root, palette)`. `palette` is a dict with the keys `"bg"`, `"fg"` and `"accent"`. Create a `ttk.Style(root)`, switch to the `"clam"` theme, and configure: `TFrame` with `background=bg`; `TLabel` with `background=bg` and `foreground=fg`; the variant `"Accent.TButton"` with `background=accent` and `foreground="white"`. Also set the window background with `root.configure(bg=bg)`. Return the style object.',
      starter: `import tkinter as tk
from tkinter import ttk


def apply_theme(root, palette):
    ...
`,
      solution: `import tkinter as tk
from tkinter import ttk


def apply_theme(root, palette):
    style = ttk.Style(root)
    style.theme_use("clam")
    style.configure("TFrame", background=palette["bg"])
    style.configure("TLabel", background=palette["bg"], foreground=palette["fg"])
    style.configure("Accent.TButton", background=palette["accent"], foreground="white")
    root.configure(bg=palette["bg"])
    return style
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
palette = {"bg": "#101820", "fg": "#eeeeee", "accent": "#2a9d8f"}
style = apply_theme(root, palette)
assert isinstance(style, ttk.Style)
assert style.theme_use() == "clam"
assert style.lookup("TFrame", "background") == "#101820"
assert style.lookup("TLabel", "background") == "#101820"
assert style.lookup("TLabel", "foreground") == "#eeeeee"
assert style.lookup("Accent.TButton", "background") == "#2a9d8f"
assert style.lookup("Accent.TButton", "foreground") == "white"
assert root.cget("bg") == "#101820"
light = {"bg": "#ffffff", "fg": "#222222", "accent": "#e76f51"}
apply_theme(root, light)
assert style.lookup("TLabel", "foreground") == "#222222"
assert style.lookup("Accent.TButton", "background") == "#e76f51"
assert root.cget("bg") == "#ffffff"`,
      checks: ['Switches to the `clam` theme before configuring the styles', 'Configures `TFrame`, `TLabel` and the `Accent.TButton` variant with the colors from the palette', 'Sets the window background with `root.configure(bg=...)` and returns the `Style`'],
      hint: '`style = ttk.Style(root)`, then `style.theme_use("clam")`, and one `style.configure(name, background=..., foreground=...)` per style, reading the colors from the `palette` dict.',
      explanation: 'Because every color comes from the palette dict, calling `apply_theme(root, light_palette)` re-skins the whole program. This is the pattern behind “light and dark mode” switches. Calling it again simply overwrites the same style entries.',
    },
    {
      kind: 'code',
      prompt: 'Write `scale_fonts(names, factor)`. For each named font in `names` (such as `"TkDefaultFont"`), get it with `tkfont.nametofont(name)` and set its size to the current size multiplied by `factor`, rounded to a whole number (`round`).',
      starter: `import tkinter as tk
from tkinter import font as tkfont


def scale_fonts(names, factor):
    ...
`,
      solution: `import tkinter as tk
from tkinter import font as tkfont


def scale_fonts(names, factor):
    for name in names:
        font = tkfont.nametofont(name)
        font.configure(size=round(font.cget("size") * factor))
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
names = ["TkDefaultFont", "TkTextFont"]
for name in names:
    tkfont.nametofont(name).configure(size=10)
tkfont.nametofont("TkMenuFont").configure(size=9)
scale_fonts(names, 1.5)
assert [tkfont.nametofont(n).cget("size") for n in names] == [15, 15]
scale_fonts(["TkDefaultFont"], 0.8)
assert tkfont.nametofont("TkDefaultFont").cget("size") == 12
assert tkfont.nametofont("TkTextFont").cget("size") == 15, "only the listed fonts change"
assert tkfont.nametofont("TkMenuFont").cget("size") == 9
scale_fonts([], 2)
label = tk.Label(root, text="x", font="TkDefaultFont")
assert tkfont.nametofont("TkDefaultFont").cget("size") == 12`,
      checks: ['Looks up each name with `tkfont.nametofont(name)`', 'Sets the new size to `round(old_size * factor)` with `font.configure(size=...)`', 'Changes only the fonts that were listed'],
      hint: 'Loop over `names`. Inside: `font = tkfont.nametofont(name)` and `font.configure(size=round(font.cget("size") * factor))`.',
      explanation: 'Named fonts are shared objects, so changing the size of `TkDefaultFont` updates every widget that uses it immediately, with no loop over widgets. That is how an app can offer “larger text” in its settings in a few lines.',
    },
    {
      kind: 'code',
      prompt: 'Write `text_color(color)` and `make_swatches(parent, colors)`. `text_color` takes a `"#rrggbb"` string and returns `"#000000"` when its luminance `0.299 * R + 0.587 * G + 0.114 * B` is **greater than 150**, otherwise `"#ffffff"`. `make_swatches` creates a classic `tk.Label` for each color with `text=color`, `bg=color`, `fg=text_color(color)` and `width=10`, packs it with `side="left"`, and returns the list of labels.',
      starter: `import tkinter as tk


def text_color(color):
    ...


def make_swatches(parent, colors):
    ...
`,
      solution: `import tkinter as tk


def text_color(color):
    r, g, b = (int(color[i:i + 2], 16) for i in (1, 3, 5))
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return "#000000" if luminance > 150 else "#ffffff"


def make_swatches(parent, colors):
    labels = []
    for color in colors:
        label = tk.Label(parent, text=color, bg=color, fg=text_color(color), width=10)
        label.pack(side="left")
        labels.append(label)
    return labels
`,
      setup: TK_SIM,
      tests: `assert text_color("#ffffff") == "#000000"
assert text_color("#000000") == "#ffffff"
assert text_color("#f1faee") == "#000000"
assert text_color("#101820") == "#ffffff"
assert text_color("#264653") == "#ffffff"
assert text_color("#ffff00") == "#000000"
assert text_color("#0000ff") == "#ffffff"
root = tk.Tk()
labels = make_swatches(root, ["#ffffff", "#2a9d8f", "#e9c46a"])
assert len(labels) == 3 and all(isinstance(w, tk.Label) for w in labels)
assert [w.cget("bg") for w in labels] == ["#ffffff", "#2a9d8f", "#e9c46a"]
assert [w.cget("text") for w in labels] == ["#ffffff", "#2a9d8f", "#e9c46a"]
assert [w.cget("fg") for w in labels] == ["#000000", "#ffffff", "#000000"], [w.cget("fg") for w in labels]
assert all(w.pack_info()["side"] == "left" for w in labels)
assert make_swatches(root, []) == []`,
      checks: ['`text_color` parses the red, green and blue pairs and applies the luminance formula with the threshold of 150', 'Returns `"#000000"` for light backgrounds and `"#ffffff"` for dark ones', '`make_swatches` creates one packed `tk.Label` per color (text, `bg`, `fg`, `width=10`) and returns the labels'],
      hint: 'Parse with `int(color[1:3], 16)`, `int(color[3:5], 16)` and `int(color[5:7], 16)`. Remember that the string starts with `#`.',
      explanation: 'Never hard-code a text color for a background that can change. Computing the luminance means the text stays readable for any color, which is what colored tags, chart legends and theme editors need. (This formula is a quick approximation; the standard contrast ratio is more precise, but this is good enough for choosing black or white.)',
    },
  ],
  takeaways: [
    'ttk widgets are drawn by a **theme**: `Style.theme_names()` lists them and `theme_use("clam")` selects one. Native themes ignore many colors; `clam` follows them on every platform. Set styles **after** choosing the theme, because they belong to it.',
    '`style.configure("TButton", ...)` restyles all buttons; `style.map(name, option=[(state, value)])` handles hover and disabled; a variant name like `"Accent.TButton"` applied with `style="Accent.TButton"` restyles chosen widgets only. `style.lookup` reads values back.',
    'Fonts: a tuple `("Segoe UI", 12, "bold")`, a `tkfont.Font` object, or a **named font**. Changing `tkfont.nametofont("TkDefaultFont")` re-sizes everything that uses the default. Positive sizes are points, negative are pixels.',
    'Colors are names or `"#rrggbb"`, and Tk validates them when they are set. Keep one **palette** in one place, derive variants with helper functions, and choose black or white text from the **luminance** of the background.',
    '`PhotoImage` loads PNG and GIF files or builds pixel art; `zoom` and `subsample` resize by whole numbers. **Keep a reference** (`label.image = photo`), or the picture disappears when the variable is garbage collected.',
  ],
  reading: [
    { title: 'TkDocs: Styles and themes', url: 'https://tkdocs.com/tutorial/styles.html', source: 'tutorial', note: 'How styles, themes, configure and map work, and how to list a widget’s style options.' },
    { title: 'Python docs: tkinter.ttk Style', url: 'https://docs.python.org/3/library/tkinter.ttk.html#ttk-styling', source: 'docs', note: 'The Style class: configure, map, lookup, layout and theme management.' },
    { title: 'TkDocs: Fonts, colors and images', url: 'https://tkdocs.com/tutorial/fonts.html', source: 'tutorial', note: 'Named fonts, font families and metrics, and color names.' },
    { title: 'Tk manual: colors', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/colors.htm', source: 'docs', note: 'The complete list of named colors and the accepted hex formats.' },
  ],
};
