import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'pg-states',
  title: 'Game States and Scenes',
  summary: 'Menu, playing, paused, game over: organise a game into states with their own events, update and draw, and manage them with a stack so that pause is easy.',
  minutes: 38,
  objectives: [
    'Explain why a game is a set of states, and why one giant loop with flags does not scale',
    'Write a `State` base class with `handle_event`, `update` and `draw`, and subclasses for a menu, play and pause',
    'Manage states with a stack: `change`, `push` and `pop`',
    'Add enter and exit hooks to run set-up and clean-up code at the right moment',
    'Describe a state machine as a table of (state, event) to next state, and build a screen fade',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A game is several programs taking turns',
      blocks: [
        {
          type: 'p',
          text: 'Breakout had two situations at the end, "playing" and "over", and a few `if game.over:` tests were enough to cope. A real game has many more: a title screen, an options menu, the game itself, a pause overlay, a shop, a game-over screen with the high scores. Each one **reacts to input differently**, **updates different things** and **draws a different picture**. If they are all squeezed into one loop with flags such as `in_menu`, `paused` and `showing_scores`, every `if` has to consider every flag, and every new screen touches code everywhere.',
        },
        {
          type: 'p',
          text: 'The cure is to give each situation its own **state** (also called a **scene** or a **screen**): an object that knows how to handle events, update and draw **itself**. The game loop becomes tiny and never changes: it passes events, `dt` and the screen to whichever state is current.',
        },
        {
          type: 'table',
          headers: ['Approach', 'Looks like', 'Works well for'],
          rows: [
            ['A variable and `if/elif`', '`if state == "menu": ... elif state == "play": ...` in the loop', 'Two or three simple states'],
            ['**State objects**', 'A class per state with `handle_event`, `update`, `draw`', 'Anything bigger; each screen is a small file'],
            ['A state **stack**', 'A list of states: the top one runs; `push` opens a screen over another, `pop` returns', 'Pause, dialogs, a shop opened from the game'],
            ['A transition **table**', 'A dictionary from (state, event) to the next state', 'Rules that must be checked: which screen can lead where'],
          ],
          caption: 'Start with the simplest that fits, and move to objects when the `if` chain gets awkward.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why one object per state?',
          text: 'The pause screen needs to know nothing about enemies, and the play state needs to know nothing about the menu. Each class is small enough to read at once, and you can work on one without breaking the others. Adding "Options" means writing one new class and one line to open it, with no edits in the play code at all.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A game has a menu, the game itself and a pause screen. What is the main benefit of giving each its own class with `handle_event`, `update` and `draw`?',
      options: [
        { text: 'Each screen is self-contained, so adding or changing one does not require editing a large `if` chain of flags in the main loop', correct: true, why: 'The loop just calls the same three methods on the current state; what differs is inside each class.' },
        { text: 'It makes the game run faster', why: 'The speed is the same; the benefit is in organisation.' },
        { text: 'pygame requires state classes', why: 'pygame has no such requirement; this is a design pattern you choose.' },
        { text: 'It removes the need for the game loop', why: 'The loop is still there: it is just short and fixed.' },
      ],
      explanation: 'The state pattern trades one tangled loop for several small classes with the same interface.',
    },
    {
      kind: 'truefalse',
      prompt: 'To show a "PAUSED" panel on top of the frozen game, the loop should draw **every** state on the stack from bottom to top, but only **update** the top one.',
      answer: true,
      explanation: 'True. Drawing the whole stack shows the game underneath the pause panel (painter’s order again: the bottom state first), while updating only the top state keeps the game below frozen. If you drew only the top state, the game would vanish behind the pause text.',
    },
    {
      kind: 'concept',
      title: 'State objects and a stack',
      blocks: [
        {
          type: 'p',
          text: 'The program below has three states and a small `StateMachine` that holds them in a **stack** (a Python list where you only touch the end). The top of the stack is the **current** state. Three operations cover nearly every screen change:',
        },
        {
          type: 'table',
          headers: ['Operation', 'Effect', 'Example'],
          rows: [
            ['`change(state)`', 'Replace the top state', 'Menu to Play; Play to Game Over'],
            ['`push(state)`', 'Open a new state **on top**; the old one waits underneath', 'Pause, a dialog, an inventory'],
            ['`pop()`', 'Close the top state; the one beneath becomes current', 'Resume from pause'],
          ],
          caption: 'The stack remembers where to go back to, so a pause screen needs no knowledge of what it paused.',
        },
        {
          type: 'code',
          title: 'states_demo.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()
font = pygame.font.Font(None, 48)


class State:
    def handle_event(self, event, machine):
        pass

    def update(self, dt, machine):
        pass

    def draw(self, screen):
        pass


class MenuState(State):
    def handle_event(self, event, machine):
        if event.type == pygame.KEYDOWN and event.key == pygame.K_RETURN:
            machine.change(PlayState())

    def draw(self, screen):
        screen.fill((20, 24, 48))
        text = font.render("PRESS ENTER", True, (250, 200, 40))
        screen.blit(text, text.get_rect(center=(320, 180)))


class PlayState(State):
    def __init__(self):
        self.x = 0.0

    def handle_event(self, event, machine):
        if event.type == pygame.KEYDOWN and event.key == pygame.K_p:
            machine.push(PauseState())
        elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            machine.change(MenuState())

    def update(self, dt, machine):
        self.x = (self.x + 200 * dt) % 640

    def draw(self, screen):
        screen.fill((20, 40, 30))
        pygame.draw.circle(screen, (90, 200, 240), (int(self.x), 180), 20)


class PauseState(State):
    def handle_event(self, event, machine):
        if event.type == pygame.KEYDOWN and event.key == pygame.K_p:
            machine.pop()

    def draw(self, screen):
        overlay = pygame.Surface(screen.get_size(), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 140))
        screen.blit(overlay, (0, 0))
        text = font.render("PAUSED", True, (240, 240, 240))
        screen.blit(text, text.get_rect(center=(320, 180)))


class StateMachine:
    def __init__(self, first):
        self.stack = [first]

    def change(self, state):
        self.stack[-1] = state

    def push(self, state):
        self.stack.append(state)

    def pop(self):
        self.stack.pop()

    @property
    def current(self):
        return self.stack[-1]


machine = StateMachine(MenuState())
running = True
while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        else:
            machine.current.handle_event(event, machine)
    machine.current.update(dt, machine)
    for state in machine.stack:
        state.draw(screen)
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '9-17', text: 'The interface every state shares: three methods, each doing nothing by default, so a state only overrides what it needs. A menu has no `update`; a pause screen needs no `update` either.' },
            { lines: '20-28', text: 'A state reacts to input by telling the **machine** to change: `machine.change(PlayState())`. Each state is passed the machine so that it can request transitions.' },
            { lines: '31-46', text: 'The play state keeps its own data (`self.x`) and decides when to open the pause screen (`push`) or return to the menu (`change`).' },
            { lines: '49-59', text: 'The pause state draws a half-transparent black layer over whatever is beneath, then the word. `SRCALPHA` gives the surface an alpha channel; the fourth number, 140, is the opacity. Its only event is `P`, which pops it.' },
            { lines: '62-77', text: 'The state machine is just a stack with three methods and a `current` property: the top item.' },
            { lines: '80-92', text: 'The whole game loop: events go to the current state, only the top state updates, and every state on the stack draws (bottom first), so that the paused game stays visible. It never changes, whatever states you add.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Create the next state when you need it',
          text: '`machine.change(PlayState())` builds a **fresh** play state each time, so starting a new game is automatic: nothing is left over from the last one. Keep data that must survive between states (the high score, settings) in a separate object that you pass in, or in a module-level object.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code that opens the pause screen and later returns to the game.',
      template: `machine.___(PauseState())
# ... later, in the pause state:
machine.___()
screen_to_show = machine.stack[___]`,
      templateIsCode: true,
      blanks: [{ answers: ['push'] }, { answers: ['pop'] }, { answers: ['-1'] }],
      wordBank: ['push', 'pop', '-1', 'change', '0', 'append'],
      explanation: '`push` puts the pause state on top of the game; `pop` removes it so the game below is current again; and the top of the stack, the current state, is `stack[-1]`.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. A stack of states goes through these operations, written with plain list calls: push, push, pop, then `change` (replacing the top).',
      code: `stack = ["menu"]
stack.append("play")
stack.append("pause")
stack.pop()
stack[-1] = "menu"
print(stack)`,
      answer: "['menu', 'menu']",
      hint: 'After the pop the stack is menu, play. Then the top is replaced.',
      explanation: 'After the three first lines the stack is `["menu", "play", "pause"]`; `pop` leaves `["menu", "play"]`; replacing the last item gives `["menu", "menu"]`. A stack that has the menu twice is unusual, but it shows how `change` (replace the top) differs from `push` (add one).',
    },
    {
      kind: 'concept',
      title: 'Hooks, tables and transitions',
      blocks: [
        {
          type: 'p',
          text: 'States often need to do something **once** when they start or stop, not every frame: load a level, start the music, reset a timer, save the score. Give the base class two hooks, `enter()` and `exit()`, and let the machine call them: `change` calls `exit()` on the old state and `enter()` on the new; `push` calls `enter()` on the new one; `pop` calls `exit()` on the one removed. That puts set-up and clean-up next to the state it belongs to.',
        },
        {
          type: 'p',
          text: 'When the rules of "which screen can lead to which" matter, write them down as a **transition table**, a dictionary from `(current state, event)` to the next state. The machine then has one method, `send(event)`, which looks the pair up, and ignores events that have no entry. Invalid moves (such as pausing from the menu) cannot happen, because they are not in the table, and the whole flow of the game is readable at a glance:',
        },
        {
          type: 'code',
          code: `TRANSITIONS = {
    ("menu", "start"): "playing",
    ("playing", "pause"): "paused",
    ("paused", "resume"): "playing",
    ("playing", "die"): "game_over",
    ("paused", "quit"): "menu",
    ("game_over", "retry"): "playing",
    ("game_over", "quit"): "menu",
}`,
          annotations: [
            { lines: '2-3', text: 'From the menu, "start" begins the game; from playing, "pause" pauses it.' },
            { lines: '4-5', text: 'You can resume from a pause, but cannot "die" while paused: there is no entry, so it is impossible by construction.' },
            { lines: '6-8', text: 'From a game over, you may retry or return to the menu. Any other pair (for example `("menu", "die")`) is simply ignored.' },
          ],
        },
        {
          type: 'p',
          text: 'Switching screens abruptly can feel harsh, so many games add a **transition**: fade to black, switch the state at the darkest moment, and fade back in. It is a small object driven by `dt`: its opacity goes from 0 to 255 during the first half, the state change happens once at the midpoint, and the opacity falls back to 0 in the second half. The exercises build it.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why switch at the midpoint?',
          text: 'At the darkest moment the screen is completely covered, so the player never sees the old state disappear or the new one pop in. The fade hides the cut. If the switch were made at the start, the new screen would flash in underneath a half-faded cover.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The game crashes with `IndexError: list index out of range` on the first frame after a key is pressed in the menu. Tap the line that causes it.',
      lines: [
        'class MenuState(State):',
        '    def handle_event(self, event, machine):',
        '        if event.type == pygame.KEYDOWN:',
        '            machine.pop()',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'The menu is the **only** state on the stack, and `pop` removes it, leaving an empty stack, so the next `machine.current` (`stack[-1]`) fails. To go from the menu to the game use `change(PlayState())`. A safe machine also refuses to pop its last state.',
    },
    {
      kind: 'numeric',
      prompt: 'The stack starts with one state. These operations run in order: `change(play)`, `push(pause)`, `push(options)`, `pop()`, `change(game_over)`, `pop()`. How many states are on the stack at the end?',
      answer: '1',
      hint: 'Count only the pushes (+1) and pops (-1); a change does not alter the size.',
      explanation: 'Start 1; change keeps 1; push gives 2; push gives 3; pop gives 2; change keeps 2; pop gives 1. A stack of depth 1 means only the base screen remains. A well-behaved game never lets the depth reach 0.',
      label: 'Depth:',
    },
    {
      kind: 'concept',
      title: 'Your turn: build the machinery',
      blocks: [
        {
          type: 'p',
          text: 'You will write the real machine (with hooks), a screen-fade controller, and the table-driven version. They use plain Python objects (the tests supply fake states that record what happens), so no window is needed.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write a class `StateMachine(first)` holding a list `stack`. Methods: `change(state)` calls `exit()` on the current state, replaces it, then calls `enter()` on the new state; `push(state)` adds a new state on top and calls its `enter()` (the old state is not exited); `pop()` removes the top state and calls its `exit()`, but **refuses** to pop the last remaining state (return `None` and do nothing then); otherwise it returns the removed state. The property `current` is the top state. The first state’s `enter()` is called when the machine is created.',
      starter: `class StateMachine:
    def __init__(self, first):
        ...

    def change(self, state):
        ...

    def push(self, state):
        ...

    def pop(self):
        ...

    @property
    def current(self):
        ...
`,
      solution: `class StateMachine:
    def __init__(self, first):
        self.stack = [first]
        first.enter()

    def change(self, state):
        self.stack[-1].exit()
        self.stack[-1] = state
        state.enter()

    def push(self, state):
        self.stack.append(state)
        state.enter()

    def pop(self):
        if len(self.stack) <= 1:
            return None
        state = self.stack.pop()
        state.exit()
        return state

    @property
    def current(self):
        return self.stack[-1]
`,
      tests: `log = []

class S:
    def __init__(self, name):
        self.name = name

    def enter(self):
        log.append("enter " + self.name)

    def exit(self):
        log.append("exit " + self.name)

menu, play, pause, over = S("menu"), S("play"), S("pause"), S("over")
m = StateMachine(menu)
assert m.current is menu and log == ["enter menu"]
m.change(play)
assert m.current is play and m.stack == [play]
assert log[-2:] == ["exit menu", "enter play"]
m.push(pause)
assert m.current is pause and m.stack == [play, pause]
assert log[-1] == "enter pause" and "exit play" not in log, "push does not exit the state below"
removed = m.pop()
assert removed is pause and m.current is play and log[-1] == "exit pause"
before = list(log)
assert m.pop() is None, "the last state is never popped"
assert m.current is play and log == before and m.stack == [play]
m.push(pause)
m.change(over)
assert m.stack == [play, over], "change replaces only the top"
assert log[-2:] == ["exit pause", "enter over"]
assert m.pop() is over and m.current is play
assert len(m.stack) == 1`,
      checks: ['`change` exits the old state, replaces the top, and enters the new one, in that order', '`push` enters the new state without exiting the one below; `pop` exits the removed state', '`pop` refuses to remove the last state and returns `None`'],
      hint: '`self.stack` is a list. `change`: `self.stack[-1].exit()`, then `self.stack[-1] = state`, then `state.enter()`. In `pop`, check `len(self.stack) <= 1` first.',
      explanation: 'The hooks make every state responsible for its own start-up and shut-down: the play state can start its music in `enter()` and stop it in `exit()`, with no other code knowing. Refusing to pop the last state turns a crash into a harmless no-op.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Fade(duration, on_midpoint)`. It represents a fade out and in lasting `duration` seconds in total. `update(dt)` advances its time (not beyond `duration`). The first time the time reaches **half** the duration (or more), call `on_midpoint()` exactly once. The property `alpha` is the cover opacity from 0 to 255 as a whole number (`int`): rising linearly from 0 at the start to 255 at the midpoint, then falling back to 0 at the end. The property `done` is `True` once the whole duration has passed.',
      starter: `class Fade:
    def __init__(self, duration, on_midpoint):
        ...

    def update(self, dt):
        ...

    @property
    def alpha(self):
        ...

    @property
    def done(self):
        ...
`,
      solution: `class Fade:
    def __init__(self, duration, on_midpoint):
        self.duration = duration
        self.on_midpoint = on_midpoint
        self.time = 0.0
        self.switched = False

    def update(self, dt):
        self.time = min(self.duration, self.time + dt)
        if not self.switched and self.time >= self.duration / 2:
            self.switched = True
            self.on_midpoint()

    @property
    def alpha(self):
        half = self.duration / 2
        if self.time <= half:
            t = self.time / half
        else:
            t = (self.duration - self.time) / half
        return int(255 * t)

    @property
    def done(self):
        return self.time >= self.duration
`,
      tests: `calls = []
f = Fade(2.0, lambda: calls.append("switch"))
assert f.alpha == 0 and f.done is False and calls == []
f.update(0.5)
assert f.alpha == 127 and calls == [], f.alpha
f.update(0.5)
assert f.alpha == 255 and calls == ["switch"], "the switch happens at the midpoint"
f.update(0.25)
assert f.alpha == 191 and calls == ["switch"], "only once"
f.update(0.5)
assert f.alpha == 63 and f.done is False
f.update(0.25)
assert f.alpha == 0 and f.done is True
f.update(10)
assert f.alpha == 0 and f.done is True and calls == ["switch"]
g = Fade(1.0, lambda: calls.append("g"))
g.update(5.0)
assert g.done is True and calls == ["switch", "g"], "a huge dt still triggers the switch"
assert g.alpha == 0
h = Fade(4.0, lambda: calls.append("h"))
seen = []
for _ in range(16):
    h.update(0.25)
    seen.append(h.alpha)
assert seen[:8] == [31, 63, 95, 127, 159, 191, 223, 255]
assert seen[8:] == [223, 191, 159, 127, 95, 63, 31, 0]
assert calls.count("h") == 1`,
      checks: ['`alpha` rises linearly to 255 at the midpoint and falls back to 0, as an `int`', '`on_midpoint` is called exactly once, even when one big `dt` jumps past it', '`done` becomes `True` only when the whole duration has elapsed'],
      hint: 'Keep `self.time` (limited to `duration`) and a `switched` flag. For `alpha`, `t` is `time / half` up to the half, and `(duration - time) / half` after it; `int(255 * t)`.',
      explanation: 'In the game, `alpha` becomes the opacity of a black surface blitted over the screen, and `on_midpoint` is `lambda: machine.change(PlayState())`. Because the fade is a plain object driven by `dt`, you can test its whole sequence in a loop of sixteen lines.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `FSM(transitions, start)`. `transitions` is a dictionary from `(state, event)` to the next state. `state` is the current state (starting at `start`). `send(event)` looks up `(self.state, event)`: if found, the machine moves there, records the new state in `history` (a list that starts with `[start]`), and returns `True`; if not found, nothing changes and it returns `False`. Add a method `can(event)` that says whether the event is valid in the current state.',
      starter: `class FSM:
    def __init__(self, transitions, start):
        ...

    def send(self, event):
        ...

    def can(self, event):
        ...
`,
      solution: `class FSM:
    def __init__(self, transitions, start):
        self.transitions = transitions
        self.state = start
        self.history = [start]

    def send(self, event):
        key = (self.state, event)
        if key not in self.transitions:
            return False
        self.state = self.transitions[key]
        self.history.append(self.state)
        return True

    def can(self, event):
        return (self.state, event) in self.transitions
`,
      tests: `T = {
    ("menu", "start"): "playing",
    ("playing", "pause"): "paused",
    ("paused", "resume"): "playing",
    ("playing", "die"): "game_over",
    ("paused", "quit"): "menu",
    ("game_over", "retry"): "playing",
    ("game_over", "quit"): "menu",
}
f = FSM(T, "menu")
assert f.state == "menu" and f.history == ["menu"]
assert f.can("start") is True and f.can("pause") is False
assert f.send("pause") is False and f.state == "menu", "invalid event is ignored"
assert f.history == ["menu"]
assert f.send("start") is True and f.state == "playing"
assert f.send("pause") is True and f.state == "paused"
assert f.send("die") is False and f.state == "paused", "you cannot die while paused"
assert f.send("resume") is True and f.send("die") is True
assert f.state == "game_over"
assert f.can("retry") and f.can("quit") and not f.can("start")
assert f.send("retry") and f.send("pause") and f.send("quit")
assert f.state == "menu"
assert f.history == ["menu", "playing", "paused", "playing", "game_over", "playing", "paused", "menu"]
assert T[("menu", "start")] == "playing", "the table is not modified"
empty = FSM({}, "only")
assert empty.send("anything") is False and empty.state == "only"`,
      checks: ['`send` follows the table and returns `True`, or returns `False` and changes nothing for unknown pairs', '`history` records the start and every state entered', '`can` tells whether an event is valid in the current state'],
      hint: 'The key is the tuple `(self.state, event)`. `key in self.transitions` tells whether the move exists.',
      explanation: 'A table-driven machine makes the legal flow of the game **data**: you can print it, draw it as a diagram, and test that every path works. When a design change says "players can now pause from the shop", you add one line to the table.',
    },
  ],
  takeaways: [
    'A game is a set of **states** (menu, playing, paused, game over). Give each its own class with the same three methods, `handle_event`, `update` and `draw`, and the main loop becomes short and never changes.',
    'Hold states in a **stack**: `change` replaces the top, `push` opens a new state over the current one (pause, dialog), and `pop` returns to what was below. Draw the whole stack bottom to top, but update only the top.',
    '`enter()` and `exit()` hooks run set-up and clean-up exactly once, at transitions; the machine calls them. Never let the stack become empty.',
    'Build a **new** state object each time you enter it, so a restart starts clean; keep data that must outlive states (settings, high score) somewhere shared.',
    'A **transition table** `{(state, event): next_state}` makes legal moves explicit and unlegal ones impossible, and can be tested like any dictionary.',
    'Transitions between screens are small objects driven by `dt`: a fade has a time, an opacity, and a one-time switch at the midpoint.',
  ],
  reading: [
    { title: 'Game Programming Patterns: State', url: 'https://gameprogrammingpatterns.com/state.html', source: 'book', note: 'The state pattern explained in depth, with pushdown automata (the stack used here).' },
    { title: 'Wikipedia: Finite-state machine', url: 'https://en.wikipedia.org/wiki/Finite-state_machine', source: 'wikipedia', note: 'The theory behind transition tables.' },
    { title: 'pygame docs: Surface.set_alpha and SRCALPHA', url: 'https://www.pygame.org/docs/ref/surface.html#pygame.Surface.set_alpha', source: 'docs', note: 'How to make translucent overlays such as the pause layer and the fade.' },
  ],
};
