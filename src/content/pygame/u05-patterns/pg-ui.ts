import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-ui',
  title: 'Menus, Buttons and the HUD',
  summary: 'pygame has no widgets, so you build them: a button with hover and click states, a keyboard menu, a slider, and a heads-up display that stays on top of the action.',
  minutes: 40,
  objectives: [
    'Explain why pygame has no built-in buttons and what a minimal widget needs: a rectangle, some state, an event handler and a draw method',
    'Write a `Button` that tracks hover and press, and fires its callback only on a complete click',
    'Build a menu that works with the keyboard, wrapping around and skipping disabled items',
    'Map a mouse position to a value with a slider, clamping at the ends',
    'Lay out widgets with `Rect` anchors and draw a heads-up display (HUD) with a proportional bar',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'pygame has no widgets: you build them',
      blocks: [
        {
          type: 'p',
          text: 'tkinter hands you buttons, entries and sliders. pygame gives you a blank surface and an event queue, so every menu, button and health bar in a pygame game is something you built. That sounds like work, but the idea is small. A **widget** is a little object with four parts:',
        },
        {
          type: 'table',
          headers: ['Part', 'What it holds', 'Button example'],
          rows: [
            ['A **rectangle**', 'Where it is, and the area that reacts to the mouse', '`self.rect`'],
            ['Some **state**', 'What it is doing right now', '`hovered`, `pressed`'],
            ['`handle_event(event)`', 'Updates state from input and may call back into your game', 'Fire `on_click` on a full click'],
            ['`draw(screen)`', 'Draws itself according to its state', 'A darker colour while pressed'],
          ],
          caption: 'The same four parts describe a slider, a checkbox, a text field and a menu.',
        },
        {
          type: 'p',
          text: 'You have used this shape already: the states of the last lesson were objects with `handle_event`, `update` and `draw`. A menu screen is a state that owns a few widgets and forwards events to them.',
        },
        {
          type: 'p',
          text: 'There is also a second kind of interface: the **HUD** (heads-up display). It is the score, lives, ammunition and health bar that sit on top of the game. A HUD is not interactive. It is drawn **last**, in fixed screen positions, so that it stays on top and does not move with the camera or the world.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why fire on mouse-up, not mouse-down?',
          text: 'Every desktop app lets you press a button, change your mind, slide the pointer away and release to cancel. To get this, a button remembers that it was **pressed** inside, and fires only when the mouse is **released** inside as well. A button that fires on mouse-down cannot be cancelled and feels twitchy.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A player presses the mouse on a button, drags the pointer off it and releases. What should a well-behaved button do?',
      options: [
        { text: 'Nothing: the click was cancelled because the release was outside the button', correct: true, why: 'The click counts only if both the press and the release happen inside.' },
        { text: 'Fire the callback, because the press was inside', why: 'That is the twitchy behaviour: it fires on the press and cannot be cancelled.' },
        { text: 'Fire the callback, because the release produced an event', why: 'The release event arrives, but its position is outside the button.' },
        { text: 'Crash with an error', why: 'Nothing here is an error; it is just a cancelled click.' },
      ],
      explanation: 'The button needs a little memory (`pressed`) to tell a full click from half of one.',
    },
    {
      kind: 'truefalse',
      prompt: 'The HUD should be drawn after the game world and at fixed screen positions, so that the score and health bar stay on top and do not scroll with the world.',
      answer: true,
      explanation: 'True. Drawing order is painter’s order: the last thing drawn is on top. And a HUD uses screen coordinates, not world coordinates, so a camera that follows the player does not drag it around.',
    },
    {
      kind: 'concept',
      title: 'A button, and a HUD around it',
      blocks: [
        {
          type: 'p',
          text: 'The program below has two buttons and a small HUD. "Score +10" raises a score and "Take damage" lowers a health bar. The button class is the one you will write in the exercises: its callbacks are ordinary functions that the game passes in.',
        },
        {
          type: 'code',
          title: 'ui_demo.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()
font = pygame.font.Font(None, 36)


class Button:
    def __init__(self, rect, label, on_click):
        self.rect = pygame.Rect(rect)
        self.label = label
        self.on_click = on_click
        self.hovered = False
        self.pressed = False

    def handle_event(self, event):
        if event.type == pygame.MOUSEMOTION:
            self.hovered = self.rect.collidepoint(event.pos)
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            self.pressed = self.rect.collidepoint(event.pos)
        elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
            if self.pressed and self.rect.collidepoint(event.pos):
                self.on_click()
            self.pressed = False

    def draw(self, screen):
        color = (60, 140, 90)
        if self.pressed and self.hovered:
            color = (30, 90, 60)
        elif self.hovered:
            color = (90, 180, 120)
        pygame.draw.rect(screen, color, self.rect, border_radius=8)
        text = font.render(self.label, True, (255, 255, 255))
        screen.blit(text, text.get_rect(center=self.rect.center))


score = 0
health = 75


def add_score():
    global score
    score += 10


def hurt():
    global health
    health = max(0, health - 15)


buttons = [
    Button((220, 120, 200, 50), "Score +10", add_score),
    Button((220, 190, 200, 50), "Take damage", hurt),
]

running = True
while running:
    clock.tick(60)
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        for button in buttons:
            button.handle_event(event)

    screen.fill((20, 24, 32))
    for button in buttons:
        button.draw(screen)
    label = font.render(f"Score: {score}", True, (250, 200, 40))
    screen.blit(label, (10, 10))
    pygame.draw.rect(screen, (70, 20, 20), (10, 50, 200, 16))
    pygame.draw.rect(screen, (220, 60, 60), (10, 50, 200 * health // 100, 16))
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '10-15', text: 'A button owns a rectangle, a label, a callback (`on_click`, any function) and two booleans for its state.' },
            { lines: '17-25', text: 'Events update the state. Motion sets `hovered`; a press sets `pressed` only if it landed inside; and on release the callback fires **only** if the button was pressed **and** the release is inside, a complete click. Then `pressed` is cleared.' },
            { lines: '27-35', text: 'Drawing reads the state: darkest while pressed, lighter while hovered. `border_radius` rounds the corners, and `get_rect(center=self.rect.center)` centres the label.' },
            { lines: '38-49', text: 'The callbacks are plain functions that change game data. The button knows nothing about scores or health; it just calls whatever it was given.' },
            { lines: '52-55', text: 'Widgets are created once, in a list, so one loop can forward events to them and draw them.' },
            { lines: '66-72', text: 'The HUD comes after everything else, so it is on top. The red bar is the full-width dark bar with a second, proportional one over it: `200 * health // 100` pixels wide.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Pass the function, do not call it',
          text: 'Write `Button(rect, "Play", start_game)`, with **no** brackets after `start_game`. Brackets would call the function immediately and pass its result (usually `None`) to the button. The button needs the function itself, to call later, at the right moment.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the HUD code that draws a label centred at the top of the screen.',
      template: `text = font.___("Score", True, white)
screen.___(text, text.get_rect(___=(320, 40)))`,
      templateIsCode: true,
      blanks: [{ answers: ['render'] }, { answers: ['blit'] }, { answers: ['center'] }],
      wordBank: ['render', 'blit', 'center', 'draw', 'topleft', 'fill'],
      explanation: '`font.render` makes a surface from text; `screen.blit` copies it onto the screen; and `get_rect(center=...)` builds a rectangle whose centre is where you want the text, so the text is centred without any arithmetic.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. A menu cursor moves with the keys below. The index wraps around the list, as a menu does.',
      code: `items = ["Play", "Options", "Quit"]
index = 0
for key in ["down", "down", "down", "up"]:
    index = (index + (1 if key == "down" else -1)) % len(items)
print(items[index])`,
      answer: 'Quit',
      hint: 'Track the index: 1, 2, 0, then up from 0.',
      explanation: 'The index goes 0 to 1, 2, then wraps to 0 on the third "down"; the "up" gives `(0 - 1) % 3`, which is 2 in Python (the result of `%` takes the sign of the divisor), so the cursor lands on "Quit". That wrap-around is why menus use `%`.',
    },
    {
      kind: 'concept',
      title: 'Layout, menus and a proportional bar',
      blocks: [
        {
          type: 'p',
          text: 'Hard-coded coordinates like `(220, 120)` break the moment you change the window size. Better to **anchor** widgets with the `Rect` attributes you met in the rectangles lesson: centre a button on the screen, then stack others below it with a gap. A rectangle’s `center`, `midtop`, `topright` and friends let you say where it goes without any arithmetic:',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> import pygame
>>> screen_rect = pygame.Rect(0, 0, 640, 360)
>>> button = pygame.Rect(0, 0, 200, 50)
>>> button.center = screen_rect.center
>>> button
<rect(220, 155, 200, 50)>
>>> button.midtop = (320, 100)
>>> button
<rect(220, 100, 200, 50)>`,
          annotations: [
            { lines: '4-6', text: 'Assigning to `center` moves the rectangle so its middle is at the screen’s middle: (220, 155) is the top-left that does it.' },
            { lines: '7-9', text: 'Assigning `midtop` puts the top-middle point at (320, 100); the width is unchanged, so x stays 220 and y becomes 100.' },
          ],
        },
        {
          type: 'p',
          text: 'A **menu** is a list of items and an index of the one selected. The up and down keys move the index (wrapping with `%`), Enter chooses the item, and mouse hover can set the index too, so mouse and keyboard players are both served. Real menus also have **disabled** items (such as "Continue" when there is no save file) that the cursor must skip.',
        },
        {
          type: 'p',
          text: 'A **slider** turns a position into a value. The fraction along the track is `(x - left) / width`; clamp it between 0 and 1, then scale it into the value range: `low + fraction * (high - low)`. A **bar** (health, ammunition, loading) does the reverse: the filled width is `max_width * value // maximum`. The same two lines of arithmetic power volume sliders, health bars and progress bars.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why keep widgets separate from game data?',
          text: 'The button calls `hurt()`; it does not touch `health` itself. That keeps the widget reusable (the same class serves "Play", "Quit" and "Buy") and keeps the rules of the game in one place. It also makes both testable: you can test a button with fake events and a menu without drawing anything.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'When the program starts it prints `starting` immediately, even though the player has not clicked anything. Then clicking Play crashes with `TypeError: \'NoneType\' object is not callable`. Tap the line responsible.',
      lines: [
        'def start_game():',
        '    print("starting")',
        'play = Button((10, 10, 100, 40), "Play", start_game())',
        'play.handle_event(click)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`start_game()` **calls** the function while the button is being created (hence the early "starting"), and the button receives its result, `None`. On a click it tries `None()`. Pass the function itself: `Button(..., start_game)`.',
    },
    {
      kind: 'numeric',
      prompt: 'A health bar is 240 pixels wide when full. The player has 45 health out of 60. How many pixels wide is the filled part, using `max_width * value // maximum`?',
      answer: '180',
      hint: '240 * 45 = 10800, then divide by 60.',
      explanation: '`240 * 45 // 60` is 180. Multiplying before dividing keeps the result exact with whole numbers; `value // maximum * max_width` would divide first and give 0.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: widgets you can test',
      blocks: [
        {
          type: 'p',
          text: 'The widgets below take events and keys as plain data, so the tests create fake events instead of opening a window. You will write a button with a complete-click rule, a keyboard menu that wraps and skips disabled items, and a slider that follows the mouse.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `Button(rect, label, on_click)` with attributes `rect` (a `pygame.Rect`), `label`, `on_click`, `hovered` and `pressed` (both start `False`). `handle_event(event)` works like this: `MOUSEMOTION` sets `hovered` from `event.pos`; `MOUSEBUTTONDOWN` with button 1 sets both `hovered` and `pressed` to whether `pos` is inside; `MOUSEBUTTONUP` with button 1 calls `on_click()` only if `pressed` is true and `pos` is inside, then clears `pressed` and sets `hovered` from `pos`. The property `state` is `"pressed"` if pressed **and** hovered, else `"hover"` if hovered, else `"normal"`.',
      starter: `import pygame


class Button:
    def __init__(self, rect, label, on_click):
        ...

    def handle_event(self, event):
        ...

    @property
    def state(self):
        ...
`,
      solution: `import pygame


class Button:
    def __init__(self, rect, label, on_click):
        self.rect = pygame.Rect(rect)
        self.label = label
        self.on_click = on_click
        self.hovered = False
        self.pressed = False

    def handle_event(self, event):
        if event.type == pygame.MOUSEMOTION:
            self.hovered = bool(self.rect.collidepoint(event.pos))
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            inside = bool(self.rect.collidepoint(event.pos))
            self.hovered = inside
            self.pressed = inside
        elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
            inside = bool(self.rect.collidepoint(event.pos))
            if self.pressed and inside:
                self.on_click()
            self.pressed = False
            self.hovered = inside

    @property
    def state(self):
        if self.pressed and self.hovered:
            return "pressed"
        if self.hovered:
            return "hover"
        return "normal"
`,
      setup: PG_SIM,
      tests: `E = pygame.event.Event
clicks = []
b = Button((10, 10, 100, 40), "Play", lambda: clicks.append("play"))
assert b.state == "normal" and b.hovered is False and b.pressed is False
assert b.rect == pygame.Rect(10, 10, 100, 40) and b.label == "Play"

def move(pos):
    b.handle_event(E(pygame.MOUSEMOTION, pos=pos, rel=(0, 0), buttons=(0, 0, 0)))

def down(pos, button=1):
    b.handle_event(E(pygame.MOUSEBUTTONDOWN, pos=pos, button=button))

def up(pos, button=1):
    b.handle_event(E(pygame.MOUSEBUTTONUP, pos=pos, button=button))

move((20, 20))
assert b.state == "hover"
move((300, 300))
assert b.state == "normal"
move((20, 20))
down((20, 20))
assert b.state == "pressed" and clicks == [], "nothing fires on the press"
up((20, 20))
assert clicks == ["play"] and b.state == "hover" and b.pressed is False
down((20, 20))
move((300, 300))
assert b.state == "normal", "pressed but the pointer left: not drawn as pressed"
move((20, 20))
assert b.state == "pressed", "it is pressed again when the pointer returns"
up((300, 300))
assert clicks == ["play"], "released outside: the click is cancelled"
assert b.pressed is False and b.state == "normal"
down((300, 300))
up((20, 20))
assert clicks == ["play"], "pressed outside, released inside: no click"
down((20, 20), button=3)
up((20, 20), button=3)
assert clicks == ["play"] and b.pressed is False, "only the left button counts"
down((20, 20))
up((20, 20))
down((20, 20))
up((20, 20))
assert clicks == ["play", "play", "play"]`,
      checks: ['A click fires only when the press and the release are both inside, and only for button 1', 'Releasing outside cancels the click and clears `pressed`', '`state` is `pressed`, `hover` or `normal` as described'],
      hint: 'Compute `inside = bool(self.rect.collidepoint(event.pos))` in each branch. On release: `if self.pressed and inside: self.on_click()`, then reset `pressed` and set `hovered = inside`.',
      explanation: 'The one extra boolean, `pressed`, is what separates a click from two unrelated events. Wrapping `collidepoint` in `bool()` just guarantees real booleans whatever the pygame version returns.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Menu(items, disabled=())`. `items` is a list of strings; `disabled` is a collection of item names that cannot be selected. `index` starts at the first enabled item. `move(step)` (step is `1` or `-1`) moves the selection to the next enabled item in that direction, wrapping around the ends and skipping disabled items. `handle_key(key)` moves down on `pygame.K_DOWN`, up on `pygame.K_UP`, and returns the selected item name on `pygame.K_RETURN` or `pygame.K_SPACE`; it returns `None` for everything else. The property `selected` is `items[index]`.',
      starter: `import pygame


class Menu:
    def __init__(self, items, disabled=()):
        ...

    def move(self, step):
        ...

    def handle_key(self, key):
        ...

    @property
    def selected(self):
        ...
`,
      solution: `import pygame


class Menu:
    def __init__(self, items, disabled=()):
        self.items = list(items)
        self.disabled = set(disabled)
        self.index = 0
        for i, name in enumerate(self.items):
            if name not in self.disabled:
                self.index = i
                break

    def move(self, step):
        n = len(self.items)
        i = self.index
        for _ in range(n):
            i = (i + step) % n
            if self.items[i] not in self.disabled:
                self.index = i
                return

    def handle_key(self, key):
        if key == pygame.K_DOWN:
            self.move(1)
        elif key == pygame.K_UP:
            self.move(-1)
        elif key in (pygame.K_RETURN, pygame.K_SPACE):
            return self.selected
        return None

    @property
    def selected(self):
        return self.items[self.index]
`,
      setup: PG_SIM,
      tests: `m = Menu(["Continue", "New Game", "Options", "Quit"], disabled={"Continue"})
assert m.index == 1 and m.selected == "New Game", "starts at the first enabled item"
assert m.handle_key(pygame.K_DOWN) is None and m.selected == "Options"
m.handle_key(pygame.K_DOWN)
assert m.selected == "Quit"
m.handle_key(pygame.K_DOWN)
assert m.selected == "New Game", "wraps around and skips the disabled Continue"
m.handle_key(pygame.K_UP)
assert m.selected == "Quit", "up from the first enabled item wraps to the end"
assert m.handle_key(pygame.K_RETURN) == "Quit"
assert m.handle_key(pygame.K_SPACE) == "Quit"
assert m.handle_key(pygame.K_a) is None and m.selected == "Quit"
n = Menu(["Play", "Options", "Quit"])
assert n.index == 0
n.handle_key(pygame.K_UP)
assert n.selected == "Quit"
n.handle_key(pygame.K_DOWN)
assert n.selected == "Play"
k = Menu(["A", "B", "C", "D"], disabled=["B", "C"])
assert k.selected == "A"
k.move(1)
assert k.selected == "D", "skips two disabled items"
k.move(1)
assert k.selected == "A"
k.move(-1)
assert k.selected == "D"
d = Menu(["A", "B"], disabled=["A"])
assert d.selected == "B"
d.move(1)
assert d.selected == "B", "only one choice: the cursor stays"
d.move(-1)
assert d.selected == "B"`,
      checks: ['The cursor wraps at both ends and skips disabled items, in both directions', 'Enter or Space returns the selected name; other keys return `None`', 'With only one enabled item the cursor stays put'],
      hint: 'In `move`, loop at most `len(items)` times: step the index with `% n`, and stop at the first item that is not disabled. Set the starting `index` by looping with `enumerate` and `break`.',
      explanation: 'Looping at most `n` times guarantees the search ends even if every item is disabled. The same wrap-around idea drives inventory cursors, level selectors and settings lists.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Slider(rect, low, high, value)`. `rect` is the track (a `pygame.Rect`). `value_at(x)` maps a screen x coordinate to a value between `low` and `high`: the fraction `(x - rect.left) / rect.width`, **clamped** between 0 and 1, then `low + fraction * (high - low)`. `handle_event(event)`: a left `MOUSEBUTTONDOWN` inside the track starts dragging and sets `value` from the pointer; `MOUSEMOTION` while dragging sets `value` from `event.pos[0]` (even if the pointer has left the track vertically or horizontally); a left `MOUSEBUTTONUP` stops the dragging. `dragging` starts `False`.',
      starter: `import pygame


class Slider:
    def __init__(self, rect, low, high, value):
        ...

    def value_at(self, x):
        ...

    def handle_event(self, event):
        ...
`,
      solution: `import pygame


class Slider:
    def __init__(self, rect, low, high, value):
        self.rect = pygame.Rect(rect)
        self.low = low
        self.high = high
        self.value = value
        self.dragging = False

    def value_at(self, x):
        fraction = (x - self.rect.left) / self.rect.width
        fraction = max(0, min(1, fraction))
        return self.low + fraction * (self.high - self.low)

    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.rect.collidepoint(event.pos):
                self.dragging = True
                self.value = self.value_at(event.pos[0])
        elif event.type == pygame.MOUSEMOTION and self.dragging:
            self.value = self.value_at(event.pos[0])
        elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
            self.dragging = False
`,
      setup: PG_SIM,
      tests: `E = pygame.event.Event
s = Slider((100, 50, 200, 20), 0, 100, 30)
assert s.value == 30 and s.dragging is False
assert s.value_at(100) == 0.0
assert s.value_at(200) == 50.0
assert s.value_at(250) == 75.0
assert s.value_at(300) == 100.0
assert s.value_at(0) == 0.0, "left of the track clamps to low"
assert s.value_at(900) == 100.0, "right of the track clamps to high"
v = Slider((0, 0, 200, 10), 0, 1, 0.5)
assert v.value_at(50) == 0.25 and v.value_at(150) == 0.75

def down(pos, button=1):
    s.handle_event(E(pygame.MOUSEBUTTONDOWN, pos=pos, button=button))

def move(pos):
    s.handle_event(E(pygame.MOUSEMOTION, pos=pos, rel=(0, 0), buttons=(1, 0, 0)))

def up(pos):
    s.handle_event(E(pygame.MOUSEBUTTONUP, pos=pos, button=1))

move((250, 60))
assert s.value == 30 and s.dragging is False, "motion without a press does nothing"
down((500, 60))
assert s.dragging is False and s.value == 30, "pressing outside the track does not start a drag"
down((150, 60), button=3)
assert s.dragging is False
down((150, 60))
assert s.dragging is True and s.value == 25.0
move((250, 400))
assert s.value == 75.0, "the pointer may leave the track vertically"
move((999, 400))
assert s.value == 100.0, "and horizontally: the value clamps"
up((999, 400))
assert s.dragging is False
move((150, 60))
assert s.value == 100.0, "after release, moving does nothing"
w = Slider((10, 10, 100, 10), 20, 220, 20)
w.handle_event(E(pygame.MOUSEBUTTONDOWN, pos=(60, 15), button=1))
assert w.value == 120.0
w.handle_event(E(pygame.MOUSEBUTTONDOWN, pos=(35, 15), button=1))
assert w.value == 70.0 and w.dragging is True`,
      checks: ['`value_at` maps the track linearly and clamps at both ends', 'A drag starts only with a left press inside the track and follows the pointer’s x even outside it', 'Releasing the button stops the drag'],
      hint: '`fraction = (x - self.rect.left) / self.rect.width`, then `max(0, min(1, fraction))`. In `handle_event`, check the event type first, then the button, then `collidepoint` for the press.',
      explanation: 'Notice that the press must be inside the track but the **motion** does not: once you have grabbed a slider you keep control of it even if the pointer wanders off, exactly like every slider you have used. A volume setting is then just `pygame.mixer.music.set_volume(slider.value)`.',
    },
  ],
  takeaways: [
    'pygame has no widgets. A widget is an object with a **rectangle**, some **state**, a `handle_event` method and a `draw` method; a menu screen is a state that owns widgets and forwards events to them.',
    'A **button** fires its callback only on a **complete click**: pressed inside and released inside. Remember `pressed` between the two events, and let the player cancel by releasing elsewhere.',
    'Pass callbacks as functions, **without** brackets (`Button(rect, "Play", start_game)`); brackets would call the function immediately and pass `None`.',
    'A **menu** is a list and an index. Move the index with `% len(items)` to wrap, skip disabled items, and support both keyboard and mouse.',
    'A **slider** maps a position to a value, `low + fraction * (high - low)` with the fraction clamped to 0..1; a **bar** shows a value as `max_width * value // maximum` pixels. Multiply before dividing.',
    'The **HUD** is drawn last, in screen coordinates, so it stays on top and ignores the camera. Anchor widgets with `Rect` attributes such as `center` and `midtop` rather than hard-coded numbers.',
  ],
  reading: [
    { title: 'pygame docs: pygame.Rect', url: 'https://www.pygame.org/docs/ref/rect.html', source: 'docs', note: 'The anchor attributes (center, midtop, topright) used for layout.' },
    { title: 'pygame docs: pygame.event', url: 'https://www.pygame.org/docs/ref/event.html', source: 'docs', note: 'MOUSEBUTTONDOWN, MOUSEBUTTONUP and MOUSEMOTION and their attributes.' },
    { title: 'pygame-gui documentation', url: 'https://pygame-gui.readthedocs.io/', source: 'docs', note: 'A full widget toolkit for pygame, once you outgrow hand-made buttons.' },
  ],
};
