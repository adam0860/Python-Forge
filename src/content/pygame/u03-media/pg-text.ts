import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-text',
  title: 'Text, Fonts and the Score Display',
  summary: 'Render text into surfaces, centre and cache it, format scores and timers, wrap long text, and read typed text from key events.',
  minutes: 36,
  objectives: [
    'Create a `Font`, render text to a surface with `render`, and blit it',
    'Explain why `render` returns a surface (it does not draw), and why unchanged text should be rendered once',
    'Position text by its rectangle, including centring',
    'Format scores and timers with f-strings',
    'Wrap text to a pixel width using a measuring function, and collect typed characters from `KEYDOWN` events',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Text is a picture made on demand',
      blocks: [
        {
          type: 'p',
          text: 'pygame has no "draw text" function. Instead you create a `Font`, and **render** a string into a brand-new `Surface` (an image of the words), which you then blit like any other picture. That sounds roundabout, but it makes text just another surface: you can position it by its rectangle, scale it, rotate it, fade it, and keep it for later.',
        },
        {
          type: 'table',
          headers: ['Call', 'What it does', 'Notes'],
          rows: [
            ['`pygame.font.Font(None, 36)`', 'The built-in default font at size 36', 'Always available and identical on every computer'],
            ['`pygame.font.Font("assets/game.ttf", 32)`', 'A font file that ships with your game', 'The safe way to get a particular look'],
            ['`pygame.font.SysFont("arial", 24)`', 'A font installed on this computer', 'Falls back to the default if missing, so it looks different on other machines'],
            ['`font.render(text, antialias, colour)`', 'A new surface with the text', '`True` makes smooth edges. An optional 4th argument gives a background colour.'],
            ['`font.size(text)`', 'The `(width, height)` the text would take', 'Measures without rendering'],
            ['`font.get_linesize()`', 'Distance between lines', 'Use it to stack lines yourself'],
            ['`font.set_bold(True)`', 'Bold, italic and underline switches', 'Where the font supports them'],
          ],
          caption: 'The font module is started by `pygame.init()`. Create fonts after it.',
        },
        {
          type: 'code',
          title: 'text_demo.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

title_font = pygame.font.Font(None, 72)
hud_font = pygame.font.Font(None, 32)
WHITE = (240, 240, 240)

title = title_font.render("SPACE DASH", True, (250, 200, 40))
title_rect = title.get_rect(center=(320, 100))
score = 0
timer = 0.0
running = True

while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
            score += 10

    timer += dt
    score_text = hud_font.render(f"SCORE {score:06d}", True, WHITE)
    blink_on = int(timer * 2) % 2 == 0

    screen.fill((20, 24, 48))
    screen.blit(title, title_rect)
    screen.blit(score_text, (16, 12))
    if blink_on:
        prompt = hud_font.render("Press SPACE", True, WHITE)
        screen.blit(prompt, prompt.get_rect(center=(320, 260)))
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '7-8', text: '`Font(None, size)` is the built-in font. Create each font once, before the loop. (Loading a font file is as slow as loading an image.)' },
            { lines: '11-12', text: 'The title never changes, so it is rendered **once**, and its rectangle is placed by `center`: the usual way to centre text on a spot.' },
            { lines: '26', text: 'The score changes, so it is rendered again here. The f-string `:06d` pads the number with zeros to 6 digits: `000040`.' },
            { lines: '27', text: 'A blinking prompt: `timer * 2` counts half-seconds, and `% 2` alternates between 0 and 1.' },
            { lines: '31', text: 'Left-aligned text is simply blitted at a top-left position.' },
            { lines: '33-34', text: 'Centred text: render it, then ask the new surface for a rectangle centred on the point you want.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why render once, and when to render again?',
          text: '`font.render` rasterises every letter into pixels, a job that takes time (a long string can take a millisecond or more). Doing it every frame for text that has not changed wastes that time, and a game with a lot of text feels it. The rule: **render when the text changes, blit every frame**. Keep the last string, and only call `render` again if the new string differs.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which line puts the words "Score: 10" at the top-left of the screen?',
      options: [
        { text: '`screen.blit(font.render("Score: 10", True, WHITE), (10, 10))`', correct: true, why: '`render` builds a surface that holds the text; `blit` copies it to the screen at the given point.' },
        { text: '`font.render("Score: 10", True, WHITE, (10, 10))`', why: 'The fourth argument of `render` is the **background colour**, not a position, and the result is still not drawn anywhere.' },
        { text: '`pygame.draw.text(screen, "Score: 10", (10, 10))`', why: 'There is no `draw.text`: the draw module only has shapes.' },
        { text: '`screen.write("Score: 10")`', why: 'A surface has no `write` method.' },
      ],
      explanation: '`font.render(...)` **returns** a surface; nothing appears until you blit it.',
    },
    {
      kind: 'truefalse',
      prompt: 'A string containing `"\\n"` passed to `font.render` is drawn on two lines.',
      answer: false,
      explanation: 'False. `render` makes a single line: a newline does not start a new one (you get an odd placeholder or nothing, depending on the font). To show several lines, split the text yourself, render each line, and blit them `font.get_linesize()` pixels apart: the wrapping exercise below builds the splitting step.',
    },
    {
      kind: 'concept',
      title: 'Formatting numbers for display',
      blocks: [
        {
          type: 'p',
          text: 'Most game text is a number put into a string. Python’s f-strings do the formatting, and a few specifiers cover nearly every case:',
        },
        {
          type: 'table',
          headers: ['Want', 'Code', 'Result for the value'],
          rows: [
            ['Zero-padded score', '`f"{score:06d}"`', '`1250` becomes `001250`'],
            ['Thousands separator', '`f"{score:,}"`', '`1250000` becomes `1,250,000`'],
            ['One decimal place', '`f"{fps:.1f}"`', '`59.94` becomes `59.9`'],
            ['A percentage', '`f"{hp / max_hp:.0%}"`', '`0.5` becomes `50%`'],
            ['Minutes and seconds', '`f"{secs // 60}:{secs % 60:02d}"`', '`125` becomes `2:05`'],
            ['Fixed width, right-aligned', '`f"{n:>5}"`', '`42` becomes `   42`'],
          ],
          caption: 'Format first, then render once the result is a string.',
        },
        {
          type: 'p',
          text: 'Use whole numbers (`//` and `%`) for clock-style displays so that the digits do not jitter, and keep the **game value** (a number) separate from its **display** (a string): the score is 1250, and `"001250"` is only how it is shown.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'A cache for rendered text',
          text: 'When the same strings come back (menu items, numbers 0 to 99), keep a dictionary `{(text, colour): surface}` and render on a miss only. Then drawing any text is a dictionary lookup plus a blit. Small and effective, and the performance lesson returns to this idea.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the HUD code: a font made once, a zero-padded score, and the text centred at the top.',
      template: `font = pygame.font.___(None, 32)
text = font.___(f"SCORE {score:___d}", True, WHITE)
screen.blit(text, text.get_rect(___=(320, 20)))`,
      templateIsCode: true,
      blanks: [{ answers: ['Font'] }, { answers: ['render'] }, { answers: ['06', '6'] }, { answers: ['center', 'midtop'] }],
      wordBank: ['Font', 'render', '06', 'center', 'topleft', 'write', 'draw'],
      explanation: '`Font(None, 32)` is the default font; `render` turns the string into a surface; `06d` pads with zeros to 6 digits; and `get_rect(center=...)` centres the text on a point.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. The time is kept in whole seconds, and shown as minutes and seconds with a leading zero on the seconds.',
      code: `secs = 125
print(f"{secs // 60}:{secs % 60:02d}")`,
      answer: '2:05',
      hint: '125 seconds is 2 minutes and 5 seconds.',
      explanation: '`125 // 60` is 2 and `125 % 60` is 5; the `:02d` pads the 5 to `05`. Without the padding you would see the confusing `2:5`.',
    },
    {
      kind: 'concept',
      title: 'Longer text, and typed text',
      blocks: [
        {
          type: 'p',
          text: 'A single `render` cannot wrap. To fit a paragraph into a box, split it into words and add them to the current line until the next word would not **fit**: measure with `font.size(line)[0]`, which gives the width in pixels with no drawing. Then render each finished line separately and blit them one `get_linesize()` below the other.',
        },
        {
          type: 'p',
          text: 'To let the player **type** text (a name for the high-score table, say), read `KEYDOWN` events. Each has `event.unicode`, the character the key produced, with Shift and the keyboard layout already applied. Add printable characters to a string, remove the last one for `K_BACKSPACE`, and finish on `K_RETURN`. (Do not use `get_pressed` for typing: it cannot tell you the letter, and it misses fast keys.)',
        },
        {
          type: 'code',
          code: `def wrap_words(text, max_width, measure):
    lines = []
    line = ""
    for word in text.split():
        trial = word if not line else line + " " + word
        if measure(trial) <= max_width:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines`,
          annotations: [
            { lines: '1', text: '`measure` is a function that gives the width of a string. With a real font it is `lambda s: font.size(s)[0]`; in a test it can be anything, such as `len(s) * 8`. Passing it in keeps this function independent of pygame.' },
            { lines: '5-6', text: 'Try adding the next word to the current line, with a space between them if the line is not empty.' },
            { lines: '7', text: 'It still fits: keep the longer line.' },
            { lines: '8-10', text: 'It does not fit: finish the current line and start a new one with this word.' },
            { lines: '11', text: 'After the loop the last line is still waiting, so it is added here. (The sketch has two flaws: a first word that is too wide adds an empty line first, and empty text gives `[""]`. The exercise below fixes both.)' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why pass in a measuring function?',
          text: 'Text layout is a pure calculation: words in, lines out. Only the **width of a string** depends on the font. By giving the function a `measure` parameter, the same code works with any font and can be tested without opening a window or loading a font file. Splitting what changes from what does not is a habit that makes game code testable.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code crashes with `TypeError: argument 1 must be pygame.surface.Surface, not pygame.font.Font`. Tap the line with the mistake.',
      lines: [
        'font = pygame.font.Font(None, 32)',
        'text = font.render("Score: 10", True, (255, 255, 255))',
        'screen.fill((20, 24, 48))',
        'screen.blit(font, (10, 10))',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'A `Font` is a tool for making text pictures; it is not a picture. `render` returns the **surface** that holds the words (`text` on line 2), and that is what must be blitted: `screen.blit(text, (10, 10))`. Mixing up the font and the rendered text is the most common text mistake.',
    },
    {
      kind: 'numeric',
      prompt: 'The text "Score: 100" is 121 pixels wide in a font. In a 640 pixel wide window, what x position (the left edge) centres it horizontally? Round down to a whole number.',
      answer: '259',
      hint: '(640 - 121) divided by 2.',
      explanation: '(640 - 121) / 2 = 259.5, so 259 with the fraction dropped. In real code let pygame do this: `text.get_rect(centerx=320)` computes the left edge for you.',
      label: 'x:',
    },
    {
      kind: 'concept',
      title: 'Your turn: text without a window',
      blocks: [
        {
          type: 'p',
          text: 'Formatting, wrapping and typing are all calculations on strings and events, so they can be written and tested without any font at all. The real game then plugs in the font’s `measure` function.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `format_score(score, digits=6)` that returns the score as a string padded with zeros on the left to `digits` digits (a longer number is not cut). Write `format_time(seconds)` that returns minutes and seconds as `"M:SS"`: whole seconds only (drop any fraction), the seconds always with two digits, and the minutes as they come (no limit, no zero padding). Negative times are shown as `"0:00"`.',
      starter: `def format_score(score, digits=6):
    ...


def format_time(seconds):
    ...
`,
      solution: `def format_score(score, digits=6):
    return f"{score:0{digits}d}"


def format_time(seconds):
    total = max(0, int(seconds))
    return f"{total // 60}:{total % 60:02d}"
`,
      tests: `assert format_score(1250) == "001250"
assert format_score(0) == "000000"
assert format_score(7, 3) == "007"
assert format_score(1234567) == "1234567"
assert format_score(42, 1) == "42"
assert format_time(0) == "0:00"
assert format_time(5) == "0:05"
assert format_time(59) == "0:59"
assert format_time(60) == "1:00"
assert format_time(125) == "2:05"
assert format_time(3599) == "59:59"
assert format_time(3600) == "60:00"
assert format_time(125.9) == "2:05"
assert format_time(-3) == "0:00"`,
      checks: ['`format_score` pads with zeros to `digits` places and never cuts a longer number', '`format_time` gives `M:SS` with two-digit seconds and unbounded minutes', 'Fractions are dropped and negative times show `0:00`'],
      hint: 'A format spec can itself contain a variable: `f"{score:0{digits}d}"`. For the time, `int(seconds)` drops the fraction, `max(0, ...)` handles negatives, then `// 60` and `% 60:02d`.',
      explanation: 'Nested replacement fields such as `{score:0{digits}d}` let the width be a variable. Keeping display formatting in tiny functions like these means the HUD code only says what to show, not how to format it.',
    },
    {
      kind: 'code',
      prompt: 'Write `wrap_text(text, max_width, measure)` that splits `text` into lines no wider than `max_width`, where `measure(s)` gives the width of the string `s`. Words are separated by whitespace and a line holds as many words as fit (joined by single spaces). A single word wider than `max_width` goes on a line of its own. Empty text gives an empty list.',
      starter: `def wrap_text(text, max_width, measure):
    ...
`,
      solution: `def wrap_text(text, max_width, measure):
    lines = []
    line = ""
    for word in text.split():
        trial = word if not line else line + " " + word
        if not line or measure(trial) <= max_width:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines
`,
      tests: `def m(s):
    return len(s) * 8

assert wrap_text("", 100, m) == []
assert wrap_text("   ", 100, m) == []
assert wrap_text("hello", 100, m) == ["hello"]
assert wrap_text("the quick brown fox", 80, m) == ["the quick", "brown fox"], wrap_text("the quick brown fox", 80, m)
assert wrap_text("the quick brown fox", 1000, m) == ["the quick brown fox"]
assert wrap_text("a b c d e f", 24, m) == ["a b", "c d", "e f"]
assert wrap_text("supercalifragilistic is long", 40, m) == ["supercalifragilistic", "is", "long"]
assert wrap_text("supercalifragilistic is", 40, m) == ["supercalifragilistic", "is"]
assert wrap_text("ab cd", 16, m) == ["ab", "cd"]
assert wrap_text("ab cd", 40, m) == ["ab cd"]
assert wrap_text("one  two\\tthree\\nfour", 64, m) == ["one two", "three", "four"]
text = "pack my box with five dozen liquor jugs"
for width in (40, 64, 100, 200):
    lines = wrap_text(text, width, m)
    assert " ".join(lines) == text
    assert all(m(l) <= width or " " not in l for l in lines)
widest = wrap_text(text, 100, m)
assert len(widest) == 4`,
      checks: ['Lines never exceed `max_width` unless they hold one single long word', 'Words are joined by single spaces, in the original order, and nothing is lost', 'Empty or blank text gives an empty list, and the last line is included'],
      hint: 'Same shape as the sketch in the lesson: try `line + " " + word`, keep it if `measure(trial) <= max_width`. The special case: if `line` is empty the word is accepted whatever its width. Add the final line at the end if it is not empty.',
      explanation: 'The one subtle rule is "a word that is too long still has to go somewhere": accept the first word of a line unconditionally. With a real font the call is `wrap_text(text, 300, lambda s: font.size(s)[0])`, and each returned line is rendered and blitted `get_linesize()` below the last.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `TextInput(max_len)` for a typed name. It has an attribute `text` (starts as `""`) and `done` (starts `False`). Method `handle(event)` reacts to `KEYDOWN` events only: `K_BACKSPACE` removes the last character; `K_RETURN` sets `done` to `True`; any other key adds `event.unicode` if it is a single printable character and the text is shorter than `max_len`. Once `done` is `True`, further events are ignored. Also write `typewriter(text, elapsed, chars_per_second)` returning the part of `text` visible after `elapsed` seconds (whole characters only).',
      starter: `import pygame


class TextInput:
    def __init__(self, max_len):
        ...

    def handle(self, event):
        ...


def typewriter(text, elapsed, chars_per_second):
    ...
`,
      solution: `import pygame


class TextInput:
    def __init__(self, max_len):
        self.max_len = max_len
        self.text = ""
        self.done = False

    def handle(self, event):
        if self.done or event.type != pygame.KEYDOWN:
            return
        if event.key == pygame.K_BACKSPACE:
            self.text = self.text[:-1]
        elif event.key == pygame.K_RETURN:
            self.done = True
        elif len(event.unicode) == 1 and event.unicode.isprintable() and len(self.text) < self.max_len:
            self.text += event.unicode


def typewriter(text, elapsed, chars_per_second):
    count = int(elapsed * chars_per_second)
    return text[:max(0, count)]
`,
      setup: PG_SIM,
      tests: `E = pygame.event.Event

def key(k, ch=""):
    return E(pygame.KEYDOWN, key=k, unicode=ch)

t = TextInput(5)
assert t.text == "" and t.done is False
for ch in "ada":
    t.handle(key(ord(ch), ch))
assert t.text == "ada"
t.handle(key(pygame.K_BACKSPACE))
assert t.text == "ad"
t.handle(key(pygame.K_BACKSPACE))
t.handle(key(pygame.K_BACKSPACE))
t.handle(key(pygame.K_BACKSPACE))
assert t.text == "", "backspace on empty text is safe"
for ch in "abcdefgh":
    t.handle(key(ord(ch), ch))
assert t.text == "abcde", "limited to max_len"
t.handle(key(pygame.K_LSHIFT, ""))
t.handle(key(pygame.K_TAB, "\\t"))
assert t.text == "abcde" and t.done is False
t.handle(E(pygame.KEYUP, key=ord("z"), unicode="z"))
t.handle(E(pygame.MOUSEBUTTONDOWN, pos=(1, 1), button=1))
assert t.text == "abcde"
t.handle(key(pygame.K_RETURN, "\\r"))
assert t.done is True and t.text == "abcde"
t.handle(key(pygame.K_BACKSPACE))
t.handle(key(ord("q"), "q"))
assert t.text == "abcde", "ignored after done"
u = TextInput(10)
u.handle(key(ord("A"), "A"))
u.handle(key(ord(" "), " "))
assert u.text == "A "
assert typewriter("hello", 0, 10) == ""
assert typewriter("hello", 0.25, 10) == "he"
assert typewriter("hello", 0.5, 10) == "hello"
assert typewriter("hello", 99, 10) == "hello"
assert typewriter("hello", -1, 10) == ""
assert typewriter("", 1, 10) == ""
assert typewriter("hello", 1, 0) == ""`,
      checks: ['Only `KEYDOWN` matters; backspace deletes (safely on empty text), return finishes, printable characters are added up to `max_len`', 'Modifier and control keys (shift, tab) add nothing', 'After `done`, nothing changes; `typewriter` reveals `int(elapsed * chars_per_second)` characters and never fails on odd values'],
      hint: 'Return early if `self.done` or the event is not a `KEYDOWN`. Use `event.unicode` for the character: check `len(event.unicode) == 1 and event.unicode.isprintable()`. For `typewriter`: `text[:max(0, int(elapsed * chars_per_second))]`.',
      explanation: '`event.unicode` is the right tool for typing: it already reflects Shift, Caps Lock and the keyboard layout, and is an empty string for keys like Shift or the arrows. The typewriter effect is just slicing a string by elapsed time, the same time-based thinking as cooldowns.',
    },
  ],
  takeaways: [
    'Text is drawn in two steps: `font.render(text, True, colour)` **returns a surface**, then you `blit` it. Nothing shows until you blit.',
    'Create fonts once (`Font(None, size)` is the built-in default; ship a `.ttf` for a particular look). `SysFont` depends on the computer. Render text when it **changes**, and blit every frame; cache surfaces for strings that repeat.',
    'Place text by its rectangle: `text.get_rect(center=...)` centres it, `topleft`/`topright` align it left and right. `font.size(text)` measures without rendering.',
    'Format with f-strings: `{score:06d}` zero-pad, `{n:,}` thousands, `{x:.1f}` decimals, `{secs // 60}:{secs % 60:02d}` for clocks. Keep the number and its display text separate.',
    '`render` makes one line only. To wrap, split into words and measure with `font.size(line)[0]`, passing the measuring function in so the layout code can be tested.',
    'For typed text, use `KEYDOWN` and `event.unicode` (not `get_pressed`): add printable characters, handle `K_BACKSPACE` and `K_RETURN`, and limit the length.',
  ],
  reading: [
    { title: 'pygame docs: pygame.font', url: 'https://www.pygame.org/docs/ref/font.html', source: 'docs', note: 'Font creation, render options, size and metrics.' },
    { title: 'Python docs: Format specification mini-language', url: 'https://docs.python.org/3/library/string.html#format-specification-mini-language', source: 'docs', note: 'Everything the f-string format specs can do.' },
    { title: 'pygame docs: pygame.freetype', url: 'https://www.pygame.org/docs/ref/freetype.html', source: 'docs', note: 'An alternative text module with rotation, styles and more control.' },
    { title: 'Google Fonts', url: 'https://fonts.google.com/', source: 'other', note: 'Free fonts under open licences that you can ship with a game.' },
  ],
};
