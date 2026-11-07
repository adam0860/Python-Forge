import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-capstone',
  title: 'Capstone: Building a Complete Program',
  summary: 'A guided project that ties the whole course together: design and build "Forge Duel", a turn-based battle simulator with pluggable AI strategies, a seeded tournament, tests, logging and a path to packaging — and the bridge to the AI course, where the strategies learn by themselves.',
  minutes: 25,
  objectives: [
    'Break a project into pure rules, interchangeable strategies and a runner, and design for testability',
    'Use dataclasses, decorators, first-class functions and injected randomness together in one program',
    'Write the rules engine, the match loop and the tournament runner yourself, with tests that pin down their behavior',
    'Apply the professional toolkit from this unit: tests, logging, profiling and packaging, to your own project',
    'See how hand-written strategies are the starting point for learned game AI in the AI and machine learning course',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Design first: Forge Duel',
      blocks: [
        {
          type: 'p',
          text: 'Time to build something complete. **Forge Duel** is a tiny turn-based game: two fighters with 20 hit points take turns choosing one of three actions — **attack** (deal 2 to 5 damage), **guard** (halve the next attack that hits you) or **heal** (restore 4 hit points, up to 20). The first fighter to reach 0 loses. What makes it interesting is that *you do not play it*: each fighter is controlled by a **strategy**, a function that looks at the situation and picks an action. We will write several strategies, hold a **tournament** between them and find out which one is best. It is a miniature of how game AI is evaluated — and, in the AI course, the strategies will be replaced by neural networks that learn.',
        },
        {
          type: 'table',
          headers: ['Part', 'Job', 'Course topics it uses'],
          rows: [
            ['Model: `Fighter`', 'Holds hit points and the guard flag', 'Classes, dataclasses, type hints'],
            ['Rules: `apply_action`', 'Changes the state for one action; takes the random generator as a **parameter**', 'Functions, exceptions, injected dependencies, testability'],
            ['Strategies', 'Pure functions `(me, foe) -> action`, registered by name with a decorator', 'First-class functions, closures, decorators'],
            ['Match: `play`', 'Alternates turns until someone reaches 0 hit points or the turn limit', 'Loops, early return, control flow'],
            ['Tournament', 'Every ordered pair of strategies plays many seeded games and wins are counted', 'Dictionaries, nested loops, `random.Random(seed)`'],
            ['Quality', 'Tests, logging, profiling, packaging', 'This whole unit'],
          ],
          caption: 'The architecture. Each part is small, does one thing and can be tested alone.',
        },
        {
          type: 'p',
          text: 'The key design decision is to keep the **rules separate from randomness and from the players**. Damage is random, but the rules function never imports `random`: it receives an object with a `randint` method. In a game we pass a seeded generator; in a test we pass a trivial fake that always returns the same number — a **[[test-double]]**. That one habit makes the whole program **deterministic** and therefore testable. Here is the rules idea in miniature, with a fake dice roll:',
        },
        {
          type: 'code',
          title: 'rules_demo.py',
          runnable: true,
          code: `from dataclasses import dataclass

@dataclass
class Fighter:
    hp: int = 20
    guarding: bool = False

class Fixed:
    def __init__(self, value):
        self.value = value
    def randint(self, low, high):
        return self.value

def attack(target, rng):
    damage = rng.randint(2, 5)
    if target.guarding:
        damage //= 2
    target.hp = max(0, target.hp - damage)
    return damage

foe = Fighter()
print(attack(foe, Fixed(3)), foe.hp)
foe.guarding = True
print(attack(foe, Fixed(5)), foe.hp)`,
          output: `3 17
2 15`,
          annotations: [
            { lines: '3-6', text: 'The **model**: a `@dataclass` gives us `__init__`, `__repr__` and `__eq__` for free, with defaults of 20 hit points and not guarding.' },
            { lines: '8-12', text: 'A **test double** for the random generator: it has the same `randint(low, high)` method but always returns the number it was given. No randomness, so no flaky tests.' },
            { lines: '14-19', text: 'A rule: roll damage from 2 to 5, halve it (integer division) if the target is guarding, never drop below 0 hit points, and report the damage. The generator `rng` is a **parameter**.' },
            { lines: '21-22', text: 'With a fixed roll of 3 the result is exactly predictable: 3 damage, 17 hit points left.' },
            { lines: '23-24', text: 'A guarding target takes `5 // 2 = 2`, leaving 15. We could assert both facts in a unit test, because nothing is left to chance.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why design before code?',
          text: 'Thirty minutes of thinking about *parts and their boundaries* saves days of rewriting. Notice what the design buys: the rules can be tested without any players, strategies can be swapped or added without touching the rules, and the tournament does not care how a strategy decides — a hand-written `if` or a neural network behave the same from the outside. This is the **[[strategy-pattern]]**, and it is exactly how real game AI frameworks plug agents into environments.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why does `apply_action` receive the random generator as a parameter instead of calling `random.randint` itself?',
      options: [
        { text: 'So tests can pass a fake or seeded generator and get exactly repeatable results', correct: true, why: 'Injecting the dependency makes the rules deterministic under test and lets a tournament use one seeded generator for reproducible experiments.' },
        { text: 'Because `random.randint` is not allowed inside functions', why: 'It is allowed anywhere. The reason is testability and reproducibility, not a language rule.' },
        { text: 'Because passing a parameter makes the function run faster', why: 'There is no speed benefit; the benefit is control over the randomness.' },
        { text: 'Because the rules would otherwise be unable to import modules', why: 'Imports work fine inside any module. Injecting the generator is a design choice.' },
      ],
      explanation: 'Passing the random generator in (dependency injection) lets tests use a fixed fake and lets a tournament seed one generator for reproducible runs. Hidden randomness makes programs hard to test and experiments impossible to repeat.',
    },
    {
      kind: 'concept',
      title: 'The complete program',
      blocks: [
        {
          type: 'p',
          text: 'Here is the whole game in one file, about seventy lines. Read it from the top; every line uses something you have learned. The `@strategy("name")` decorator registers each strategy function in a dictionary so the tournament can look them up by name — a **decorator factory** (three nested levels) that returns the function unchanged. Run it and watch the leaderboard appear.',
        },
        {
          type: 'code',
          title: 'duel.py',
          runnable: true,
          code: `import random
from dataclasses import dataclass

MAX_HP = 20
STRATEGIES = {}

def strategy(name):
    def register(func):
        STRATEGIES[name] = func
        return func
    return register

@dataclass
class Fighter:
    hp: int = MAX_HP
    guarding: bool = False

@strategy("aggressive")
def aggressive(me, foe):
    return "attack"

@strategy("cautious")
def cautious(me, foe):
    return "heal" if me.hp <= 8 else "attack"

@strategy("turtle")
def turtle(me, foe):
    return "guard" if me.hp <= 12 else "attack"

def apply_action(actor, target, action, rng):
    actor.guarding = False
    if action == "attack":
        damage = rng.randint(2, 5)
        if target.guarding:
            damage //= 2
        target.hp = max(0, target.hp - damage)
        return damage
    if action == "guard":
        actor.guarding = True
    elif action == "heal":
        actor.hp = min(MAX_HP, actor.hp + 4)
    else:
        raise ValueError(f"unknown action: {action}")
    return 0

def play(a, b, rng, max_turns=50):
    fa, fb = Fighter(), Fighter()
    for _ in range(max_turns):
        apply_action(fa, fb, a(fa, fb), rng)
        if fb.hp == 0:
            return "A"
        apply_action(fb, fa, b(fb, fa), rng)
        if fa.hp == 0:
            return "B"
    return "draw"

def tournament(names, games, rng):
    wins = {name: 0 for name in names}
    for first in names:
        for second in names:
            if first == second:
                continue
            for _ in range(games):
                result = play(STRATEGIES[first], STRATEGIES[second], rng)
                if result == "A":
                    wins[first] += 1
                elif result == "B":
                    wins[second] += 1
    return wins

rng = random.Random(7)
board = tournament(list(STRATEGIES), 200, rng)
for name, w in sorted(board.items(), key=lambda kv: -kv[1]):
    print(f"{name:<12}{w:>5}")`,
          output: `cautious      774
aggressive    405
turtle          1`,
          annotations: [
            { lines: '7-11', text: 'A **decorator factory**: `strategy("x")` returns `register`, which stores the function under that name in `STRATEGIES` and returns it unchanged. Adding a strategy to the game is now one decorated function.' },
            { lines: '13-16', text: 'The model, as a dataclass with defaults.' },
            { lines: '18-28', text: 'Three strategies, each a **pure function** `(me, foe) -> action`: always attack; heal when low, otherwise attack; guard when below 13 hit points, otherwise attack. They only *look at* the fighters; the rules do the changing.' },
            { lines: '30-44', text: 'The **rules**. Acting clears your own guard; an attack rolls damage with the injected generator; guard and heal change only the actor; anything else raises `ValueError`. The function returns the damage dealt.' },
            { lines: '46-55', text: 'The **match**: A moves first, then B, and the game ends as soon as someone hits 0. Early `return` makes the logic flat and readable; after `max_turns` the result is a draw.' },
            { lines: '57-69', text: 'The **tournament**: every ordered pair (first player, second player) of different strategies plays `games` matches, and wins are tallied in a dictionary. The order matters because moving first is an advantage.' },
            { lines: '71-72', text: 'One seeded generator for the whole tournament: `random.Random(7)` produces the same sequence every run, so the results below are reproducible on every computer.' },
            { lines: '73-74', text: 'Sort the dictionary by wins, highest first, and print an aligned leaderboard with an f-string format spec.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Reading the results',
          text: 'The cautious strategy wins by far: healing when low keeps it in the game while it keeps hitting. The turtle wins almost nothing — guarding only *halves* damage and never restores hit points, so a turn spent guarding is mostly a turn wasted, and an attacker simply out-damages it. That is a real insight about the game, discovered by simulation instead of argument. Try changing the numbers (the healing amount, the guard threshold) and re-run.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'What a good project feels like',
          text: 'No function is longer than a screen; names say what things are; rules, players and orchestration are separate; there is no global state except the strategy registry; and everything random is injected. When a bug appears, you can reproduce it with one seed and one pair of strategies.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Running the program twice with `random.Random(7)` produces exactly the same tournament results both times.',
      answer: true,
      explanation: 'True. A seeded generator is **deterministic**: the same seed gives the same sequence of numbers, so the same games are played and the leaderboard is identical. That makes experiments repeatable and bugs reproducible. Using the unseeded global `random` (or changing the seed) gives different numbers each time.',
    },
    {
      kind: 'concept',
      title: 'Tests, logging, profiling, shipping',
      blocks: [
        {
          type: 'p',
          text: 'A program is finished when it is *trustworthy*. Apply this unit’s toolkit. **Tests** pin the rules down: with the fake generator from step one, a test can state that an unguarded attack of 3 leaves 17 hit points. **Property-style tests** check things that must be true for *any* input: hit points always stay between 0 and 20, and the same seed always gives the same tournament. Below is the pytest file for the game (run on your PC with `pytest`); all four tests pass.',
        },
        {
          type: 'code',
          title: 'test_duel.py',
          lang: 'text',
          code: `import random

from duel import STRATEGIES, Fighter, apply_action, tournament


class Fixed:
    def __init__(self, v):
        self.v = v

    def randint(self, a, b):
        return self.v


def test_attack_reduces_hp():
    foe = Fighter()
    assert apply_action(Fighter(), foe, "attack", Fixed(3)) == 3
    assert foe.hp == 17


def test_guard_halves_damage():
    foe = Fighter(guarding=True)
    apply_action(Fighter(), foe, "attack", Fixed(5))
    assert foe.hp == 18


def test_hp_stays_in_range():
    rng = random.Random(0)
    for _ in range(1000):
        a, b = Fighter(hp=rng.randint(0, 20)), Fighter(hp=rng.randint(0, 20))
        apply_action(a, b, rng.choice(["attack", "guard", "heal"]), rng)
        assert 0 <= a.hp <= 20 and 0 <= b.hp <= 20


def test_same_seed_same_result():
    names = list(STRATEGIES)
    assert tournament(names, 20, random.Random(3)) == tournament(names, 20, random.Random(3))`,
          annotations: [
            { lines: '6-11', text: 'The same fake generator as before, defined once for the whole test file. (A fixture would work too.)' },
            { lines: '14-17', text: 'An **example-based test**: specific input, exact expected output.' },
            { lines: '20-23', text: 'A second example covering the guard rule: `5 // 2 = 2`, so 20 - 2 = 18.' },
            { lines: '26-31', text: 'A **property test**: 1000 random situations, and an invariant — hit points stay within 0 and 20 — must hold in all of them. A bug in `min`/`max` would be caught here.' },
            { lines: '34-36', text: 'A **determinism test**: two tournaments with the same seed must be identical.' },
          ],
        },
        {
          type: 'table',
          headers: ['Quality step', 'How for Forge Duel', 'Lesson'],
          rows: [
            ['Tests', 'The file above, plus a test per rule and per strategy', 'Testing with pytest'],
            ['Logging', '`log.debug("%s -> %s", name, action)` inside `play`; switch on with one `basicConfig(level=DEBUG)` when a match behaves oddly', 'Debugging and Logging'],
            ['Debugging', '`breakpoint()` inside `apply_action` and a fixed seed reproduce any single match', 'Debugging and Logging'],
            ['Profiling', '`python -m cProfile -s tottime duel.py` shows time is spent in `apply_action` and the strategies; 10,000 games per pair would call for a faster rules function', 'Profiling and Optimization'],
            ['Parallelism', 'Games are independent, so a `ProcessPoolExecutor` can play them on all cores (give each worker its own seed)', 'Multiprocessing'],
            ['Packaging', '`pyproject.toml` with a `[project.scripts]` entry `forge-duel = "duel:main"`, then `python -m build`', 'Packaging and Publishing'],
            ['Types', 'Annotate `Fighter`, `apply_action(...) -> int` and check with mypy or pyright', 'Advanced typing'],
          ],
          caption: 'Every step of this unit has a concrete place in the project.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'From hand-written to learned strategies',
          text: 'Look at the shape of a strategy: it takes the game state `(me, foe)` and returns an action. That is **exactly the interface of a reinforcement-learning agent**. In the AI and machine learning course you will replace `cautious` and `turtle` with a neural network that *learns* which action to pick by playing thousands of games against these baselines, using the same `play` and `tournament` functions to measure whether it got better. Frameworks such as Gymnasium and RLGym are the same idea at industrial scale: an environment with rules, and an agent that chooses actions.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Stretch goals',
          text: 'Add a fourth action and a strategy that uses it; limit healing to three uses per match; add a `--games` and `--seed` command line with `argparse`; save the leaderboard as JSON with `pathlib`; add a type-hinted `Strategy = Callable[[Fighter, Fighter], str]` alias; read strategies from a plugin folder with `importlib`; run the tournament in a process pool and measure the speedup with `time.perf_counter`; publish the package to TestPyPI.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the decorator factory so that functions can be registered with `@strategy("aggressive")`.',
      template: `STRATEGIES = {}

def ___(name):
    def register(func):
        STRATEGIES[name] = func
        return ___
    return register`,
      templateIsCode: true,
      blanks: [{ answers: ['strategy'] }, { answers: ['func'] }],
      wordBank: ['strategy', 'func', 'register', 'name'],
      explanation: 'The outer function is named `strategy` (it takes the name and returns the decorator `register`). `register` stores `func` and must **return `func`** so the decorated name still refers to the original function.',
    },
    {
      kind: 'concept',
      title: 'Where to go from here',
      blocks: [
        {
          type: 'p',
          text: 'You started this course not knowing what Python was, and you now know the language, its standard library, the object model, concurrency, and the professional workflow of testing, debugging, profiling and packaging. The habits matter as much as the syntax: **small pure functions, injected dependencies, tests that run in a second, measurement before optimization.** Everything in the AI course builds on them — a training loop is a function with a seeded generator, a model is an object with a `__call__`, an experiment is a reproducible run.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Next: Python for AI and Machine Learning',
          text: 'The second course starts from the math you need (vectors, gradients, probability), moves through NumPy and pandas, classic machine learning, neural networks from scratch, **PyTorch**, reinforcement learning, and finally **building game AI** — custom environments, reward design, RLGym, self-play and deploying a trained agent into a game. Forge Duel returns there as a first environment. Your Python foundation is exactly what it assumes.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'How the language got here',
          text: 'Python began as a Christmas-holiday hobby project by Guido van Rossum in 1989 and grew into the language of web servers, science and AI because it stayed readable and made it easy for people to share libraries. The standard library, the packaging ecosystem and the community you just learned to use are the reason a single developer can build a game AI in an afternoon. Keep reading the documentation: it is the best textbook there is.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this piece of the rules (the same logic as `apply_action`).',
      code: `class Fixed:
    def randint(self, a, b):
        return 5

hp = 6
guarding = True
damage = Fixed().randint(2, 5)
if guarding:
    damage //= 2
hp = max(0, hp - damage)
print(damage, hp)`,
      answer: '2 4',
      hint: 'A guarded attack of 5 is halved with integer division.',
      explanation: '`5 // 2` is `2`, so the damage is 2 and the hit points go from 6 to 4. If the target had 1 hit point, `max(0, ...)` would stop them at 0 instead of going negative.',
    },
    {
      kind: 'error',
      prompt: 'After this change the tournament crashes with `TypeError: \'function\' object is not iterable` or reports no strategies — and `aggressive(me, foe)` no longer works. Tap the faulty line.',
      lines: [
        '@strategy',
        'def aggressive(me, foe):',
        '    return "attack"',
      ],
      linesAreCode: true,
      errorLines: [1],
      explanation: '`strategy` is a decorator **factory**: it must be *called* with the name (`@strategy("aggressive")`) to return the real decorator. Writing `@strategy` passes the function as the `name` argument and replaces `aggressive` with the inner `register` function, so nothing is registered and the original function is lost.',
    },
    {
      kind: 'numeric',
      prompt: 'A tournament has 4 strategies. Every **ordered** pair of different strategies plays 10 games (A moves first, so (x, y) and (y, x) are different pairs). How many games are played in total?',
      answer: '120',
      hint: 'There are 4 × 3 ordered pairs.',
      explanation: 'Each of the 4 strategies can be first player against 3 others: 4 × 3 = 12 ordered pairs, times 10 games = 120 games.',
      label: 'Games:',
    },
    {
      kind: 'code',
      prompt: 'Write the **rules**: `apply_action(actor, target, action, rng)`. First clear `actor.guarding`. Then: `"attack"` rolls `damage = rng.randint(2, 5)`, halves it with `//= 2` if `target.guarding`, reduces `target.hp` (never below 0) and returns the damage; `"guard"` sets `actor.guarding = True`; `"heal"` raises `actor.hp` by 4 but at most to `MAX_HP`. Guard and heal return 0. Any other action raises `ValueError` (and must not call `rng`).',
      starter: `from dataclasses import dataclass

MAX_HP = 20

@dataclass
class Fighter:
    hp: int = MAX_HP
    guarding: bool = False

def apply_action(actor, target, action, rng):
    ...
`,
      solution: `from dataclasses import dataclass

MAX_HP = 20


@dataclass
class Fighter:
    hp: int = MAX_HP
    guarding: bool = False


def apply_action(actor, target, action, rng):
    actor.guarding = False
    if action == "attack":
        damage = rng.randint(2, 5)
        if target.guarding:
            damage //= 2
        target.hp = max(0, target.hp - damage)
        return damage
    if action == "guard":
        actor.guarding = True
    elif action == "heal":
        actor.hp = min(MAX_HP, actor.hp + 4)
    else:
        raise ValueError(f"unknown action: {action}")
    return 0
`,
      tests: `class Fixed:
    def __init__(self, v):
        self.v = v

    def randint(self, a, b):
        return self.v


a, b = Fighter(), Fighter()
assert apply_action(a, b, "attack", Fixed(3)) == 3
assert b.hp == 17 and a.hp == 20

b = Fighter(guarding=True)
assert apply_action(Fighter(), b, "attack", Fixed(5)) == 2
assert b.hp == 18

b = Fighter(hp=2)
apply_action(Fighter(), b, "attack", Fixed(5))
assert b.hp == 0

a = Fighter(hp=10)
assert apply_action(a, Fighter(), "heal", Fixed(3)) == 0
assert a.hp == 14
a = Fighter(hp=18)
apply_action(a, Fighter(), "heal", Fixed(3))
assert a.hp == 20

a = Fighter()
assert apply_action(a, Fighter(), "guard", Fixed(3)) == 0
assert a.guarding is True

a = Fighter(guarding=True)
apply_action(a, Fighter(), "attack", Fixed(3))
assert a.guarding is False
a = Fighter(guarding=True)
apply_action(a, Fighter(), "heal", Fixed(3))
assert a.guarding is False


class Rec:
    def __init__(self):
        self.args = []

    def randint(self, lo, hi):
        self.args.append((lo, hi))
        return 4


rec = Rec()
apply_action(Fighter(), Fighter(), "attack", rec)
assert rec.args == [(2, 5)]
rec = Rec()
apply_action(Fighter(), Fighter(), "guard", rec)
apply_action(Fighter(), Fighter(), "heal", rec)
assert rec.args == []

rec = Rec()
try:
    apply_action(Fighter(), Fighter(), "dance", rec)
    assert False, "must raise ValueError"
except ValueError:
    pass
assert rec.args == []`,
      checks: ['Attack deals \`rng.randint(2, 5)\` damage, halved with \`//=\` against a guarding target, and never drops hit points below 0', 'Heal adds 4 up to \`MAX_HP\`; guard sets the flag; both return 0 and never call \`rng\`', 'The actor’s guard is cleared on every action; unknown actions raise \`ValueError\`'],
      hint: 'Start with `actor.guarding = False`. Then use `if action == "attack": ... return damage`, `if action == "guard": ... elif action == "heal": ... else: raise ValueError(...)`, and `return 0` at the end.',
      explanation: 'All the rules live in one small function that depends only on its arguments, which is why it can be tested exhaustively with a fake generator. Notice that the function mutates the fighters it is given and reports the damage: a deliberate, simple contract that `play` relies on.',
    },
    {
      kind: 'code',
      prompt: 'Write the **match** `play(a, b, rng, max_turns=50)`. Create two fresh `Fighter`s `fa` and `fb`. Each turn, fighter A acts first (its strategy is called as `a(fa, fb)`) using the provided `apply_action`; if B then has 0 hit points return `"A"`. Then B acts (`b(fb, fa)`); if A has 0 hit points return `"B"`. If nobody has won after `max_turns` turns return `"draw"`.',
      starter: `from dataclasses import dataclass

MAX_HP = 20

@dataclass
class Fighter:
    hp: int = MAX_HP
    guarding: bool = False

def apply_action(actor, target, action, rng):
    actor.guarding = False
    if action == "attack":
        damage = rng.randint(2, 5)
        if target.guarding:
            damage //= 2
        target.hp = max(0, target.hp - damage)
        return damage
    if action == "guard":
        actor.guarding = True
    elif action == "heal":
        actor.hp = min(MAX_HP, actor.hp + 4)
    else:
        raise ValueError(f"unknown action: {action}")
    return 0

def play(a, b, rng, max_turns=50):
    ...
`,
      solution: `from dataclasses import dataclass

MAX_HP = 20


@dataclass
class Fighter:
    hp: int = MAX_HP
    guarding: bool = False


def apply_action(actor, target, action, rng):
    actor.guarding = False
    if action == "attack":
        damage = rng.randint(2, 5)
        if target.guarding:
            damage //= 2
        target.hp = max(0, target.hp - damage)
        return damage
    if action == "guard":
        actor.guarding = True
    elif action == "heal":
        actor.hp = min(MAX_HP, actor.hp + 4)
    else:
        raise ValueError(f"unknown action: {action}")
    return 0


def play(a, b, rng, max_turns=50):
    fa, fb = Fighter(), Fighter()
    for _ in range(max_turns):
        apply_action(fa, fb, a(fa, fb), rng)
        if fb.hp == 0:
            return "A"
        apply_action(fb, fa, b(fb, fa), rng)
        if fa.hp == 0:
            return "B"
    return "draw"
`,
      tests: `class Fixed:
    def __init__(self, v):
        self.v = v

    def randint(self, a, b):
        return self.v


aggressive = lambda me, foe: "attack"
cautious = lambda me, foe: "heal" if me.hp <= 8 else "attack"
turtle = lambda me, foe: "guard" if me.hp <= 12 else "attack"
heal = lambda me, foe: "heal"
guard = lambda me, foe: "guard"

assert play(aggressive, aggressive, Fixed(3)) == "A"
assert play(aggressive, turtle, Fixed(3)) == "A"
assert play(turtle, aggressive, Fixed(3)) == "B"
assert play(aggressive, cautious, Fixed(3)) == "B"
assert play(cautious, aggressive, Fixed(3)) == "A"
assert play(heal, heal, Fixed(3)) == "draw"
assert play(guard, guard, Fixed(3)) == "draw"
assert play(aggressive, heal, Fixed(3)) == "draw"
assert play(aggressive, guard, Fixed(3)) == "A"
assert play(aggressive, aggressive, Fixed(3), max_turns=3) == "draw"

seen = []

def spy_a(me, foe):
    seen.append(("a", me.hp, foe.hp))
    return "attack"

def spy_b(me, foe):
    seen.append(("b", me.hp, foe.hp))
    return "attack"

assert play(spy_a, spy_b, Fixed(5), max_turns=1) == "draw"
assert seen == [("a", 20, 20), ("b", 15, 20)]

try:
    play(lambda me, foe: "dance", aggressive, Fixed(3))
    assert False, "must raise ValueError"
except ValueError:
    pass`,
      checks: ['A moves first each turn; the result is \`"A"\` as soon as B reaches 0 hit points and \`"B"\` as soon as A does', 'Strategies are called as \`a(fa, fb)\` and \`b(fb, fa)\` (own fighter first) on fresh fighters', 'Returns \`"draw"\` after \`max_turns\` turns; invalid actions propagate \`ValueError\`'],
      hint: 'Loop `for _ in range(max_turns)`. Inside: `apply_action(fa, fb, a(fa, fb), rng)`, return `"A"` if `fb.hp == 0`; then the same for B and `"B"`. After the loop `return "draw"`.',
      explanation: 'Checking for a knockout right after each action matters: if A’s attack already reduced B to 0, B must not get another move. Early returns keep the loop flat, and because the strategies and the rules are passed in, the match logic is only a few lines.',
    },
    {
      kind: 'code',
      prompt: 'Write the **tournament** `tournament(strategies, games, rng)`. `strategies` is a dict mapping names to strategy functions; the provided `play(a, b, rng)` plays one match and returns `"A"`, `"B"` or `"draw"`. Every **ordered** pair of different names plays `games` matches (the first name as A) using the same `rng`. Return a dict with every name mapped to its number of wins (draws count for nobody).',
      starter: `def play(a, b, rng, max_turns=50):
    ...  # provided: returns "A", "B" or "draw"

def tournament(strategies, games, rng):
    ...
`,
      solution: `def play(a, b, rng, max_turns=50):
    ...  # provided: returns "A", "B" or "draw"


def tournament(strategies, games, rng):
    wins = {name: 0 for name in strategies}
    for first in strategies:
        for second in strategies:
            if first == second:
                continue
            for _ in range(games):
                result = play(strategies[first], strategies[second], rng)
                if result == "A":
                    wins[first] += 1
                elif result == "B":
                    wins[second] += 1
    return wins
`,
      tests: `from collections import Counter

real_play = play
pairs = []
rngs = []
outcome = ["A"]

def fake_play(a, b, rng, max_turns=50):
    pairs.append((a, b))
    rngs.append(rng)
    return outcome[0]

play = fake_play

fa = lambda me, foe: "attack"
fb = lambda me, foe: "heal"
fc = lambda me, foe: "guard"
names = {id(fa): "a", id(fb): "b", id(fc): "c"}
shared = object()

assert tournament({"a": fa, "b": fb, "c": fc}, 4, shared) == {"a": 8, "b": 8, "c": 8}
assert len(pairs) == 24
counts = Counter((names[id(x)], names[id(y)]) for x, y in pairs)
assert len(counts) == 6 and set(counts.values()) == {4}
assert all(a != b for a, b in counts)
assert all(r is shared for r in rngs)

pairs.clear()
outcome[0] = "B"
assert tournament({"a": fa, "b": fb, "c": fc}, 4, shared) == {"a": 8, "b": 8, "c": 8}

pairs.clear()
outcome[0] = "draw"
assert tournament({"a": fa, "b": fb}, 5, shared) == {"a": 0, "b": 0}
assert len(pairs) == 10

pairs.clear()
assert tournament({"solo": fa}, 5, shared) == {"solo": 0}
assert pairs == []
assert tournament({}, 5, shared) == {}

play = real_play`,
      checks: ['Every ordered pair of different names plays \`games\` matches, with the first name as player A', 'Wins are counted for the winner by name; draws count for nobody; every name appears in the result', 'Passes the same \`rng\` object to every match and uses the provided \`play\`'],
      hint: 'Create `wins = {name: 0 for name in strategies}`. Use two nested loops over the names, skip `first == second`, repeat `games` times calling `play(strategies[first], strategies[second], rng)`, and add one to `wins[first]` for `"A"` or `wins[second]` for `"B"`.',
      explanation: 'This is the evaluation harness of game AI in miniature: a fixed environment, interchangeable agents, many repeated matches and a score table. Swapping each hand-written strategy for a trained network later needs **no change** to `tournament` — the reward for the design decision of passing functions around.',
    },
  ],
  takeaways: [
    'Start with a **design**: split a project into small parts with one job each (model, rules, strategies, match, tournament) so that each can be written, tested and replaced on its own.',
    'Make programs **deterministic and testable** by injecting dependencies such as the random generator: tests use a fake, experiments use a seeded `random.Random(seed)`.',
    'Plain functions plus a **decorator registry** make behaviors pluggable (the strategy pattern); the surrounding code never needs to know how a strategy decides.',
    'Use the professional toolkit on your own work: pytest examples and property tests, logging for diagnosis, `cProfile` before optimizing, `ProcessPoolExecutor` for independent jobs, and `pyproject.toml` plus `python -m build` to ship.',
    'A strategy `(state) -> action` is exactly the shape of an RL agent: the next course replaces hand-written strategies with learned ones and reuses the same match and tournament harness to measure progress.',
  ],
  reading: [
    { title: 'The Python Tutorial', url: 'https://docs.python.org/3/tutorial/index.html', source: 'docs', note: 'Re-read it now: after this course every chapter will feel familiar, and the details will stick.' },
    { title: 'dataclasses — Data Classes', url: 'https://docs.python.org/3/library/dataclasses.html', source: 'docs', note: 'Everything `@dataclass` can do: defaults, `frozen`, `order`, `field()`.' },
    { title: 'random — Generate pseudo-random numbers', url: 'https://docs.python.org/3/library/random.html', source: 'docs', note: 'Seeding, `random.Random` instances, and the warning about cryptographic use.' },
    { title: 'Structuring Your Project (The Hitchhiker’s Guide to Python)', url: 'https://docs.python-guide.org/writing/structure/', source: 'book', note: 'A community guide to project layout, modules and common design pitfalls.' },
    { title: 'Gymnasium documentation', url: 'https://gymnasium.farama.org/', source: 'docs', note: 'The standard API for reinforcement-learning environments: a preview of the next course.' },
  ],
};
