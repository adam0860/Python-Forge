import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'pg-save-data',
  title: 'Saving Scores, Settings and Progress',
  summary: 'Keep a high-score table, store it as JSON in the right folder, write files so a crash cannot corrupt them, and upgrade old saves when the game changes.',
  minutes: 40,
  objectives: [
    'Explain why games save data as JSON, and what can go wrong when loading it',
    'Maintain a sorted, limited high-score table without modifying the original list',
    'Load saved text defensively: invalid JSON, wrong types and unknown keys must never crash the game',
    'Migrate old save formats to the current one with a version number',
    'Write a file atomically (temporary file, then replace) and choose a sensible save folder for each platform',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'What to save, and in which format',
      blocks: [
        {
          type: 'p',
          text: 'Everything in your game vanishes when the program closes, unless you write it down. Games save three kinds of data: **settings** (volume, key bindings, window size), **progress** (levels unlocked, items owned, a checkpoint) and **scores** (a high-score table). All three are small collections of names, numbers and lists, and the best format for them in Python is **JSON**: plain text that both people and programs can read, which maps directly onto dictionaries, lists, strings, numbers and booleans.',
        },
        {
          type: 'code',
          lang: 'json',
          code: `{
  "version": 3,
  "volume": 0.7,
  "high_scores": [
    {"name": "ADA", "score": 4200},
    {"name": "BOB", "score": 3100}
  ]
}`,
          annotations: [
            { lines: '2', text: 'A **version number** is the most useful field in any save format. When the game changes, it tells your loader which format it is looking at.' },
            { lines: '3-7', text: 'Ordinary data: a number and a list of small records.' },
          ],
        },
        {
          type: 'table',
          headers: ['Format', 'Good for', 'Watch out for'],
          rows: [
            ['**JSON** (`json` module)', 'Settings, scores, progress: nearly everything', 'Only basic types (no sets, tuples become lists, no custom classes)'],
            ['`pickle`', 'Nothing you load from outside', '**Unsafe**: loading a doctored pickle can run arbitrary code, and it breaks when classes change'],
            ['Plain text / CSV', 'Simple tables', 'No structure for nesting'],
            ['SQLite (`sqlite3`)', 'Large or searchable data', 'More machinery than a small game needs'],
          ],
          caption: 'For a small game, use JSON. Do not load pickles of data that a player can edit or share.',
        },
        {
          type: 'p',
          text: 'The crucial habit is to treat a save file as **untrusted input**. The player may have edited it, an older version of the game may have written it, or a crash may have cut it short. Loading should never crash the game: it should fall back to sensible defaults and carry on. The exercises below build exactly that loader.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not just trust the file?',
          text: 'Your own program wrote it, so it seems safe. But files are damaged by power cuts and full disks, edited by curious players, copied between versions of your game, and renamed. A loader that assumes perfection turns one bad byte into a crash on start-up, and the player cannot even reach the menu to fix it. Defensive loading costs ten lines and prevents the worst bug a game can have.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why is it risky to save game data with `pickle` and load it back?',
      options: [
        { text: 'Loading a pickle can execute arbitrary code, so a modified save file could harm the player’s computer', correct: true, why: 'Pickle can reconstruct arbitrary objects, including ones that run code while loading.' },
        { text: 'Pickle files are always too large', why: 'Size is not the issue.' },
        { text: 'Pickle cannot store numbers', why: 'It stores numbers fine; the danger is elsewhere.' },
        { text: 'Pickle only works on Linux', why: 'It works on every platform.' },
      ],
      explanation: 'JSON can only describe data, never code, which is why it is the right choice for files that players can touch.',
    },
    {
      kind: 'truefalse',
      prompt: 'A game should check the contents of a loaded save file (type, shape and version) instead of assuming that it is valid.',
      answer: true,
      explanation: 'True. The file may be damaged, hand-edited, empty, or from an older version. Validating costs very little, and the fallback (use the defaults) keeps the game playable.',
    },
    {
      kind: 'concept',
      title: 'A game that remembers its best score',
      blocks: [
        {
          type: 'p',
          text: 'This small game counts your mouse clicks in 5 seconds, remembers the best result in a JSON file in your home folder, and shows it the next time you run it. (Press R to try again.) Look at the two helpers at the top: `load_save` never raises, and `write_save` never leaves a half-written file behind.',
        },
        {
          type: 'code',
          title: 'clicker.py',
          desktopOnly: true,
          code: `import json
import os
from pathlib import Path

import pygame

pygame.init()
screen = pygame.display.set_mode((480, 240))
clock = pygame.time.Clock()
font = pygame.font.Font(None, 36)

SAVE_PATH = Path.home() / ".pyforge_demo" / "save.json"
DEFAULT = {"version": 1, "best": 0}


def load_save():
    try:
        data = json.loads(SAVE_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return dict(DEFAULT)
    if not isinstance(data, dict) or not isinstance(data.get("best"), int):
        return dict(DEFAULT)
    return data


def write_save(data):
    SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = SAVE_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    os.replace(tmp, SAVE_PATH)


save = load_save()
clicks = 0
time_left = 5.0
running = True
while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.MOUSEBUTTONDOWN and time_left > 0:
            clicks += 1
        elif event.type == pygame.KEYDOWN and event.key == pygame.K_r:
            clicks = 0
            time_left = 5.0

    time_left = max(0.0, time_left - dt)
    if time_left == 0 and clicks > save["best"]:
        save["best"] = clicks
        write_save(save)

    screen.fill((20, 24, 32))
    lines = [f"Clicks: {clicks}", f"Best: {save['best']}", f"Time: {time_left:.1f}"]
    for i, text in enumerate(lines):
        screen.blit(font.render(text, True, (240, 240, 240)), (20, 20 + i * 40))
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '12-13', text: 'A save path in the user’s home folder (not next to the program), and the default data to fall back on.' },
            { lines: '16-23', text: 'Loading: any problem (missing file, unreadable file, invalid JSON, wrong shape) returns a fresh copy of the defaults. `OSError` covers file problems and `ValueError` covers bad JSON.' },
            { lines: '26-30', text: 'Saving: create the folder if needed, write to a temporary file, then `os.replace` it over the real one. Replacing is a single step, so a crash leaves either the old file or the new one, never half of each.' },
            { lines: '33', text: 'Load once at start-up, and keep the data in a dictionary while the game runs.' },
            { lines: '49-51', text: 'Write the file only when there is something new to save (a new best), not every frame.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Save at moments, not continuously',
          text: 'Save when something worth keeping has happened: the level ends, the settings screen closes, the player passes a checkpoint, the game quits. Writing a file every frame wastes time, wears the disk and multiplies the chance that a crash catches you in the middle of a write.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the three JSON idioms: turning data into text, text into data, and opening a text file for writing.',
      template: `text = json.___(data, indent=2)
data = json.___(text)
open(path, "w", encoding="___")`,
      templateIsCode: true,
      blanks: [{ answers: ['dumps'] }, { answers: ['loads'] }, { answers: ['utf-8'] }],
      wordBank: ['dumps', 'loads', 'utf-8', 'dump', 'load', 'ascii'],
      explanation: '`json.dumps` ("dump string") produces text and `json.loads` ("load string") parses it; `dump` and `load` do the same with open files. Naming `utf-8` explicitly means names with accents are saved the same way on every platform.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Python values are converted to JSON text.',
      code: `import json
data = {"name": "Ada", "scores": [30, 20], "muted": False}
print(json.dumps(data))`,
      answer: '{"name": "Ada", "scores": [30, 20], "muted": false}',
      hint: 'JSON writes booleans in lower case, and strings with double quotes.',
      explanation: 'The dictionary becomes JSON text: keys in double quotes, the list in brackets, and Python’s `False` becomes the JSON literal `false`. `None` would become `null`, and a tuple would become a list.',
    },
    {
      kind: 'concept',
      title: 'Tables, versions and folders',
      blocks: [
        {
          type: 'p',
          text: '**A high-score table** is a list of records kept sorted from best to worst and cut to a limit (usually 5 or 10). Adding a score means building a **new** list: append the entry, sort by score (highest first), and keep the first few. Python’s `sorted` is **stable**, so entries with equal scores keep their order and the earlier player stays above the later one. A score **qualifies** if the table is not yet full or if it beats the lowest entry.',
        },
        {
          type: 'p',
          text: '**Versions and migration.** Your game will change: a new field here, a renamed one there. Players still have saves in the old format. Store a `"version"` number in every file. On loading, upgrade step by step: version 1 to 2, then 2 to 3, and so on, so each old format needs only one small converter and a save from any past version reaches the current one. A save from a **newer** version than your game knows must be refused rather than guessed at.',
        },
        {
          type: 'p',
          text: '**Where to save.** A game installed in `Program Files` (or inside a macOS app bundle) is usually **read-only** for normal users, so writing next to the program fails. Use the per-user data folder instead. The three platforms keep it in different places:',
        },
        {
          type: 'code',
          runnable: true,
          code: `from pathlib import PurePosixPath, PureWindowsPath


def save_dir(app, platform, env, home):
    if platform == "win32":
        return str(PureWindowsPath(env.get("APPDATA", home)) / app)
    if platform == "darwin":
        return str(PurePosixPath(home) / "Library" / "Application Support" / app)
    base = env.get("XDG_DATA_HOME") or str(PurePosixPath(home) / ".local" / "share")
    return str(PurePosixPath(base) / app)


print(save_dir("star-defender", "win32", {"APPDATA": "C:/Users/Ada/AppData/Roaming"}, "C:/Users/Ada"))
print(save_dir("star-defender", "darwin", {}, "/Users/ada"))
print(save_dir("star-defender", "linux", {}, "/home/ada"))`,
          output: `C:\\Users\\Ada\\AppData\\Roaming\\star-defender
/Users/ada/Library/Application Support/star-defender
/home/ada/.local/share/star-defender`,
          annotations: [
            { lines: '5-6', text: 'Windows keeps per-user data in the `APPDATA` folder (usually `AppData\\Roaming`), and `PureWindowsPath` prints it with backslashes.' },
            { lines: '7-8', text: 'macOS uses `Library/Application Support` in the home folder.' },
            { lines: '9-10', text: 'Linux follows the XDG convention: `XDG_DATA_HOME` if it is set, otherwise `.local/share` in the home folder.' },
            { lines: '13-15', text: 'The platform, the environment and the home folder are **passed in**, so one machine can show all three answers. In a game you would pass `sys.platform`, `os.environ` and `str(Path.home())`. The `platformdirs` package does all this for you.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why write to a temporary file and then replace?',
          text: 'Writing a file takes time. If the power fails or the game crashes halfway, the file holds half of the new data and half of nothing, and the player’s whole save is gone. If instead you write the new data to `save.json.tmp` and then **replace** the old file in one step (`os.replace`), the operating system guarantees that you end up with either the complete old file or the complete new one.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The game saves with `str(data)` but then crashes on the next start with `json.decoder.JSONDecodeError`. Tap the mistaken line.',
      lines: [
        'import json',
        'data = {"score": 10}',
        'text = str(data)',
        'loaded = json.loads(text)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`str(data)` gives Python’s **representation**, `{\'score\': 10}`, with single quotes, which is not valid JSON. Use `json.dumps(data)`, which writes `{"score": 10}`. (The crash shows at `json.loads`, but the mistake is made one line earlier.)',
    },
    {
      kind: 'numeric',
      prompt: 'A high-score table (limit 5) holds 90, 80, 70, 60 and 50. A new score of 65 is added and the table is sorted and cut to five entries. At which **position** (counting from 1 at the top) does 65 appear?',
      answer: '4',
      hint: 'Sort from highest to lowest: 90, 80, 70, then where?',
      explanation: 'The sorted list is 90, 80, 70, 65, 60; the old 50 falls off the end. So 65 is in 4th place, and it **qualified** because it beat the lowest score (50).',
      label: 'Position:',
    },
    {
      kind: 'concept',
      title: 'Your turn: scores, loading and writing',
      blocks: [
        {
          type: 'p',
          text: 'You will write the high-score table functions, a defensive loader with a version migration, and the atomic file writer and reader. The file tests use a temporary folder, which they create and then delete.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `add_score(table, name, score, limit=5)` that returns a **new** list: a copy of `table` (a list of dictionaries with `"name"` and `"score"`, best first) with `{"name": name, "score": score}` added, sorted by score from highest to lowest, keeping the original order among equal scores (the earlier entry stays above), and cut to `limit` entries. The given list must not be changed. Then write `qualifies(table, score, limit=5)`: `True` if the table has fewer than `limit` entries, or `score` is **strictly greater** than the lowest score in the table.',
      starter: `def add_score(table, name, score, limit=5):
    ...


def qualifies(table, score, limit=5):
    ...
`,
      solution: `def add_score(table, name, score, limit=5):
    entries = list(table) + [{"name": name, "score": score}]
    entries.sort(key=lambda entry: entry["score"], reverse=True)
    return entries[:limit]


def qualifies(table, score, limit=5):
    if len(table) < limit:
        return True
    return score > min(entry["score"] for entry in table)
`,
      tests: `table = [{"name": "A", "score": 90}, {"name": "B", "score": 80}]
new = add_score(table, "C", 85)
assert [e["name"] for e in new] == ["A", "C", "B"]
assert new[1] == {"name": "C", "score": 85}
assert [e["name"] for e in table] == ["A", "B"], "the original list is not changed"
tie = add_score(table, "D", 80)
assert [e["name"] for e in tie] == ["A", "B", "D"], "equal scores: the earlier entry stays above"
top = add_score(table, "E", 100)
assert [e["name"] for e in top] == ["E", "A", "B"]
full = [{"name": "A", "score": 90}, {"name": "B", "score": 80}, {"name": "C", "score": 70}]
cut = add_score(full, "D", 85, limit=3)
assert [e["name"] for e in cut] == ["A", "D", "B"], "the lowest entry falls off"
miss = add_score(full, "E", 10, limit=3)
assert [e["name"] for e in miss] == ["A", "B", "C"], "a score that is too low does not get in"
assert add_score([], "Z", 5) == [{"name": "Z", "score": 5}]
five = []
for i, s in enumerate([10, 50, 30, 20, 40, 60, 5]):
    five = add_score(five, "P" + str(i), s)
assert [e["score"] for e in five] == [60, 50, 40, 30, 20]
assert qualifies([], 0) is True
assert qualifies(table, 1) is True, "the table is not full"
assert qualifies(full, 75, limit=3) is True
assert qualifies(full, 70, limit=3) is False, "equal to the lowest does not qualify"
assert qualifies(full, 69, limit=3) is False
assert qualifies(full, 71, limit=3) is True
assert qualifies(full, 1000, limit=3) is True`,
      checks: ['`add_score` returns a new sorted list cut to `limit` and leaves the input unchanged', 'Equal scores keep their original order (the earlier one stays higher)', '`qualifies` is true for a non-full table or a score strictly above the lowest'],
      hint: 'Build `entries = list(table) + [new_entry]`, sort with `key=lambda e: e["score"], reverse=True` (the sort is stable, even with `reverse=True`), and return `entries[:limit]`.',
      explanation: 'Python’s sort is **stable**, including with `reverse=True`: equal items keep their original relative order. That is why the player who got 80 first stays above the one who got 80 later. In the game, `qualifies` decides whether to show the "enter your name" screen.',
    },
    {
      kind: 'code',
      prompt: 'Write `migrate(data)` that returns an **upgraded copy** of a save dictionary (the input must not change). The current version is `3`. A missing `"version"` means 1. **From 1 to 2:** remove `"best"` (default 0) and set `"scores"` to `[best]` if `best > 0`, else `[]`; add `"volume": 0.7` if there is none; set the version to 2. **From 2 to 3:** remove `"scores"` and set `"high_scores"` to a list of `{"name": "???", "score": s}` for each score; set the version to 3. A version above 3 raises `ValueError`. Then write `load_save(text, default)`: parse `text` as JSON; if it is invalid, is not a dictionary, cannot be migrated (`ValueError` or `TypeError`), return a **deep copy** of `default`. Otherwise start from a deep copy of `default` and take each key of the migrated data only if the key is in `default` and `type(value) is type(default[key])`.',
      starter: `import copy
import json

CURRENT = 3


def migrate(data):
    ...


def load_save(text, default):
    ...
`,
      solution: `import copy
import json

CURRENT = 3


def migrate(data):
    data = dict(data)
    version = data.get("version", 1)
    if version > CURRENT:
        raise ValueError("save is from a newer version")
    if version < 2:
        best = data.pop("best", 0)
        data["scores"] = [best] if best > 0 else []
        data.setdefault("volume", 0.7)
        data["version"] = 2
        version = 2
    if version < 3:
        scores = data.pop("scores", [])
        data["high_scores"] = [{"name": "???", "score": s} for s in scores]
        data["version"] = 3
    return data


def load_save(text, default):
    try:
        data = json.loads(text)
        if not isinstance(data, dict):
            raise ValueError("not a dictionary")
        data = migrate(data)
    except (ValueError, TypeError):
        return copy.deepcopy(default)
    result = copy.deepcopy(default)
    for key, value in data.items():
        if key in default and type(value) is type(default[key]):
            result[key] = value
    return result
`,
      tests: `v1 = {"version": 1, "best": 120}
out = migrate(v1)
assert out == {"version": 3, "volume": 0.7, "high_scores": [{"name": "???", "score": 120}]}
assert v1 == {"version": 1, "best": 120}, "the input is not changed"
assert migrate({"best": 0}) == {"version": 3, "volume": 0.7, "high_scores": []}, "no version means 1"
assert migrate({}) == {"version": 3, "volume": 0.7, "high_scores": []}
v2 = {"version": 2, "scores": [50, 10], "volume": 0.2}
assert migrate(v2) == {"version": 3, "volume": 0.2, "high_scores": [{"name": "???", "score": 50}, {"name": "???", "score": 10}]}
assert v2["scores"] == [50, 10]
v3 = {"version": 3, "volume": 0.5, "high_scores": []}
same = migrate(v3)
assert same == v3 and same is not v3
try:
    migrate({"version": 4})
    assert False, "a newer save must be refused"
except ValueError:
    pass

default = {"version": 3, "volume": 0.7, "high_scores": []}
text = '{"version": 3, "volume": 0.25, "high_scores": [{"name": "ADA", "score": 9}]}'
got = load_save(text, default)
assert got == {"version": 3, "volume": 0.25, "high_scores": [{"name": "ADA", "score": 9}]}
assert default == {"version": 3, "volume": 0.7, "high_scores": []}, "the default is not changed"
for bad in ["not json", "", "[1, 2, 3]", "42", "null", '{"version": 9}', '{"version": 1, "best": "lots"}']:
    r = load_save(bad, default)
    assert r == default, bad
    assert r is not default and r["high_scores"] is not default["high_scores"], "a deep copy"
r = load_save('{"version": 1, "best": 70}', default)
assert r == {"version": 3, "volume": 0.7, "high_scores": [{"name": "???", "score": 70}]}, "an old save is upgraded"
r = load_save('{"version": 3, "volume": "loud", "extra": 1, "high_scores": 5}', default)
assert r == default, "wrong types and unknown keys are ignored"
r = load_save('{"version": 3, "volume": 1}', default)
assert r["volume"] == 0.7, "an int is not a float: the default stays"
r["high_scores"].append("x")
assert default["high_scores"] == [], "mutating the result never touches the default"`,
      checks: ['`migrate` upgrades 1 to 2 to 3 on a copy, treats a missing version as 1, and rejects newer versions', '`load_save` falls back to a deep copy of the default for bad JSON, a non-dictionary, or an unmigratable save', 'Only known keys with the same type as the default are taken'],
      hint: 'In `migrate`, copy with `dict(data)` and use two separate `if version < 2:` and `if version < 3:` blocks so that an old save passes through both. In `load_save`, wrap parsing and migrating in one `try` that catches `(ValueError, TypeError)`.',
      explanation: 'Because each converter only knows one step, adding a version 4 later means adding one more `if version < 4:` block: you never touch the old converters, and every save ever written still loads. The `try` block means no save file, however damaged, can stop the game from starting.',
    },
    {
      kind: 'code',
      prompt: 'Write `save_json(path, data)` that writes `json.dumps(data, indent=2, sort_keys=True)` (as UTF-8 text) to the temporary file `path + ".tmp"`, creating the folder of `path` first if it does not exist, and then replaces `path` with it using `os.replace`. Write `load_json(path, default)` that returns the parsed data, or a **deep copy** of `default` if the file is missing, cannot be read, or does not contain valid JSON.',
      starter: `import copy
import json
import os


def save_json(path, data):
    ...


def load_json(path, default):
    ...
`,
      solution: `import copy
import json
import os


def save_json(path, data):
    folder = os.path.dirname(path)
    if folder:
        os.makedirs(folder, exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, indent=2, sort_keys=True))
    os.replace(tmp, path)


def load_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.loads(f.read())
    except (OSError, ValueError):
        return copy.deepcopy(default)
`,
      tests: `import shutil
import tempfile

folder = tempfile.mkdtemp()
try:
    path = os.path.join(folder, "profile", "save.json")
    data = {"b": 1, "a": [1, 2], "name": "Zo\\u00eb"}
    save_json(path, data)
    assert os.path.exists(path), "the folder was created and the file written"
    assert not os.path.exists(path + ".tmp"), "the temporary file is gone after the replace"
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    assert raw == json.dumps(data, indent=2, sort_keys=True)
    assert raw.index('"a"') < raw.index('"b"'), "keys are sorted"
    back = load_json(path, {})
    assert back == data
    save_json(path, {"x": 1})
    assert load_json(path, {}) == {"x": 1}, "an existing file is replaced"
    assert not os.path.exists(path + ".tmp")

    default = {"k": [1]}
    missing = load_json(os.path.join(folder, "nope.json"), default)
    assert missing == {"k": [1]} and missing is not default and missing["k"] is not default["k"]

    bad = os.path.join(folder, "bad.json")
    with open(bad, "w", encoding="utf-8") as f:
        f.write("{broken")
    assert load_json(bad, default) == {"k": [1]}
    empty = os.path.join(folder, "empty.json")
    open(empty, "w").close()
    assert load_json(empty, 7) == 7, "an empty file is not valid JSON"

    flat = os.path.join(folder, "flat.json")
    save_json(flat, [3, 1, 2])
    assert load_json(flat, None) == [3, 1, 2], "a path without a folder part or any data type works"
finally:
    shutil.rmtree(folder)`,
      checks: ['`save_json` creates the folder, writes sorted, indented JSON to `path + ".tmp"`, and replaces the file so no `.tmp` is left', '`load_json` returns the parsed data for a good file', '`load_json` returns a deep copy of the default for a missing, unreadable or invalid file'],
      hint: 'Use `os.makedirs(os.path.dirname(path), exist_ok=True)` (only when the folder part is not empty), write the temporary file inside a `with open(...)`, then `os.replace(tmp, path)`. For loading, catch `(OSError, ValueError)`.',
      explanation: 'These two functions are everything a small game needs for persistence: settings, scores and progress can all go through them. `os.replace` is atomic on every major platform, so even a crash in the middle of `save_json` cannot damage the existing save.',
    },
  ],
  takeaways: [
    'Save settings, progress and scores as **JSON** with the `json` module: readable, editable and safe. Do not load `pickle` data that a player can touch.',
    'Treat every loaded file as **untrusted**: catch invalid JSON, check the type and shape, ignore unknown keys, and fall back to a **copy** of the defaults so that the game can always start.',
    'Put a **`version`** in every save and upgrade old saves one step at a time (1 to 2 to 3). Refuse saves from a newer version.',
    'A high-score table is a sorted, limited list built into a **new** list each time. Python’s sort is stable, so ties keep their order; a score qualifies if the table is not full or it beats the lowest entry.',
    '**Write atomically**: write to a temporary file, then `os.replace` it over the real one, so a crash leaves the old file or the new one, never half of each. Save at meaningful moments, not every frame.',
    'Save in the **per-user data folder** (`APPDATA` on Windows, `Library/Application Support` on macOS, `XDG_DATA_HOME` or `~/.local/share` on Linux), not next to the program, which may be read-only. The `platformdirs` package finds it for you.',
  ],
  reading: [
    { title: 'Python docs: json', url: 'https://docs.python.org/3/library/json.html', source: 'docs', note: '`dumps`, `loads`, `indent`, `sort_keys` and how Python types map to JSON.' },
    { title: 'Python docs: pickle (security warning)', url: 'https://docs.python.org/3/library/pickle.html', source: 'docs', note: 'Read the warning box at the top: why you should never unpickle untrusted data.' },
    { title: 'platformdirs on PyPI', url: 'https://pypi.org/project/platformdirs/', source: 'repo', note: 'A tiny package that returns the right user data folder on each operating system.' },
  ],
};
