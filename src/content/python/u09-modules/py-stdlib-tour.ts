import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-stdlib-tour',
  title: 'A Tour of the Standard Library',
  summary: '"Batteries included": a guided tour of the modules you will reach for most often — `collections`, `heapq`, `bisect`, `math`, `random`, `statistics`, `decimal`, `datetime`, `time`, `argparse`, `hashlib`, `sqlite3` — and how to discover the rest.',
  minutes: 19,
  objectives: [
    'Pick the right container from `collections` (`Counter`, `defaultdict`, `deque`, `namedtuple`) and use `heapq` and `bisect` for priority queues and sorted lists',
    'Use `math`, seeded `random.Random`, `statistics`, `decimal` and `fractions` for numeric work',
    'Work with dates and durations using `datetime` and `timedelta`, and time code with `time.perf_counter`',
    'Parse command-line options with `argparse`, hash and encode data, and store tables with in-memory `sqlite3`',
    'Find your way around the library with `help()`, `dir()` and the documentation index',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Batteries included: containers and queues',
      blocks: [
        {
          type: 'p',
          text: 'Python’s [[standard-library]] ships with hundreds of modules, installed with the language itself — no `pip` required. Before writing a helper or installing a package, check whether the standard library already has it. This tour covers the modules that pay off first, starting with specialised containers that fix the weaknesses of plain lists and dictionaries.',
        },
        {
          type: 'code',
          title: 'containers_tour.py',
          runnable: true,
          code: `from collections import Counter, defaultdict, deque, namedtuple
import heapq, bisect
text = "the cat and the hat and the bat"
print(Counter(text.split()).most_common(2))
by_len = defaultdict(list)
for name in ["Ada", "Ben", "Cleo", "Dan", "Eve", "Fiona"]:
    by_len[len(name)].append(name)
print(dict(by_len))
recent = deque(maxlen=3)
for n in range(5):
    recent.append(n)
print(recent)
Point = namedtuple("Point", "x y")
p = Point(3, 4)
print(p, p.x, p._replace(x=9))
pq = []
for prio, name in [(3, "low"), (1, "urgent"), (2, "normal")]:
    heapq.heappush(pq, (prio, name))
print([heapq.heappop(pq)[1] for _ in range(3)])
scores = [10, 20, 30, 40]
bisect.insort(scores, 25)
print(scores, bisect.bisect_left(scores, 30))`,
          output: `[('the', 3), ('and', 2)]
{3: ['Ada', 'Ben', 'Dan', 'Eve'], 4: ['Cleo'], 5: ['Fiona']}
deque([2, 3, 4], maxlen=3)
Point(x=3, y=4) 3 Point(x=9, y=4)
['urgent', 'normal', 'low']
[10, 20, 25, 30, 40] 3`,
          annotations: [
            { lines: 4, text: '`Counter` is a dictionary specialised for counting. `most_common(2)` returns the two most frequent items with their counts. Looking up a missing key gives `0` instead of an error.' },
            { lines: '5-8', text: '`defaultdict(list)` creates a missing entry automatically, so grouping needs no `if key not in d` check. Here names are grouped by length.' },
            { lines: '9-12', text: '`deque` is a **double-ended queue** with fast appends and pops at *both* ends. With `maxlen=3` it keeps only the last three items — a ready-made "recent history" buffer. (`list.pop(0)` is slow because every item shifts.)' },
            { lines: '13-15', text: '`namedtuple` makes a tuple whose fields have names: `p.x` instead of `p[0]`. `_replace` returns a modified copy. (Unit 10 introduces `dataclasses`, the modern alternative.)' },
            { lines: '16-19', text: '`heapq` implements a **priority queue**: `heappush` adds, `heappop` always returns the *smallest* item. Tuples compare element by element, so `(priority, name)` pops by priority. Use it for schedulers, event queues and A* path-finding.' },
            { lines: '20-22', text: '`bisect` searches and inserts in an already **sorted** list using binary search: `insort` keeps the list sorted, and `bisect_left` finds a position in logarithmic time.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not just use lists and dicts?',
          text: 'You can build all of these by hand, but the standard versions are shorter, tested, and often much faster (`deque.popleft()` is constant time, `list.pop(0)` is linear; `heappop` is logarithmic, scanning for `min()` is linear). Choosing the right container is the cheapest optimization there is.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: '`deque` ↔ `std::deque`, `heapq` ↔ `std::priority_queue` (note: Python’s heap pops the **smallest** first, whereas the C++ one pops the largest), `defaultdict` ↔ `unordered_map` with `operator[]` creating missing entries, `Counter` ↔ a `map<T,int>`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You are keeping the last 100 chat messages for a game. New messages arrive constantly and the oldest must drop off automatically. Which standard tool fits best?',
      options: [
        { text: 'A `list`, using `pop(0)` when it gets too long', why: 'It works, but `pop(0)` shifts every remaining item, which gets slow, and you must write the trimming code yourself.' },
        { text: '`collections.deque(maxlen=100)`', correct: true, why: 'Right: appends are constant time and the oldest item is discarded automatically when the limit is reached.' },
        { text: '`heapq`', why: 'A heap orders by priority, not by arrival time, so it does not model "oldest first".' },
        { text: '`collections.Counter`', why: '`Counter` counts how often items occur; it is not a queue.' },
      ],
      explanation: 'A `deque` with `maxlen` is exactly a sliding window: append on one end, and the other end is trimmed for you in constant time.',
    },
    {
      kind: 'concept',
      title: 'Numbers: math, random, statistics',
      blocks: [
        {
          type: 'p',
          text: 'For numeric work Python gives you `math` (functions on floats), `random` (pseudo-random numbers), `statistics` (averages and spread), plus exact arithmetic with `decimal` and `fractions`. A key point about `random`: it is **deterministic** once seeded. Create your own generator with `random.Random(seed)`, and the same seed always produces the same sequence — essential for reproducible game levels, replays, tests, and machine-learning experiments.',
        },
        {
          type: 'code',
          title: 'numbers_tour.py',
          runnable: true,
          code: `import math, random, statistics
from decimal import Decimal
from fractions import Fraction
print(math.hypot(3, 4), math.gcd(12, 18), math.isclose(0.1 + 0.2, 0.3), math.degrees(math.pi))
print(math.floor(-2.5), math.ceil(-2.5), round(2.5), round(3.5))
rng = random.Random(42)
print([rng.randint(1, 6) for _ in range(5)], rng.choice(["a", "b", "c"]))
data = [2, 4, 4, 4, 5, 5, 7, 9]
print(statistics.mean(data), statistics.median(data), statistics.mode(data), statistics.pstdev(data))
print(0.1 + 0.2, Decimal("0.1") + Decimal("0.2"), Fraction(1, 3) + Fraction(1, 6))`,
          output: `5.0 6 True 180.0
-3 -2 2 4
[6, 1, 1, 6, 3] a
5 4.5 4 2.0
0.30000000000000004 0.3 1/2`,
          annotations: [
            { lines: 4, text: '`hypot` is the length of a vector (the Pythagorean theorem), `gcd` the greatest common divisor, `degrees` converts radians. **`isclose` compares floats with a tolerance** — never use `==` on computed floats.' },
            { lines: 5, text: '`floor` always rounds *down* and `ceil` *up*, so `floor(-2.5)` is `-3`. The built-in `round` rounds halves to the **nearest even** number: `round(2.5)` is 2 but `round(3.5)` is 4 ("banker’s rounding").' },
            { lines: 6, text: 'A private generator with a fixed seed: it does not interfere with other code that uses `random`.' },
            { lines: 7, text: 'The five dice rolls are always `[6, 1, 1, 6, 3]` for seed 42 in this Python version (and the same on every run), which is why seeded randomness suits tests and replays. Without a seed the sequence differs every run.' },
            { lines: 9, text: '`statistics` covers the everyday needs: mean, median, mode, and spread (`pstdev` is the population standard deviation, `stdev` the sample one). Machine-learning code uses NumPy for big arrays, but this is perfect for small data.' },
            { lines: 10, text: 'Binary floats cannot represent 0.1 exactly. `Decimal` does decimal arithmetic exactly (use it for money), and `Fraction` keeps exact ratios.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'random is not for security',
          text: '`random` is predictable by design: anyone who sees enough outputs can work out the rest. For passwords, tokens, anything an attacker should not guess, use the `secrets` module (`secrets.token_hex(16)`, `secrets.choice(...)`), which draws from the operating system’s secure source.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Seeds in games and AI',
          text: 'Roguelikes derive a whole dungeon from one seed that players can share; automated tests of game logic seed the generator so a failing run can be replayed exactly; and reinforcement-learning experiments (the second course) record their seeds so results can be reproduced. Pass the `Random` object into functions instead of using the global `random` module, so the dependency is explicit.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `from collections import Counter
print(Counter("banana").most_common(1))`,
      answer: "[('a', 3)]",
      hint: 'Count each letter first: b, a, n.',
      explanation: '`Counter("banana")` counts `a` three times, `n` twice and `b` once. `most_common(1)` returns a list holding the single top pair: `[(\'a\', 3)]`.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the date arithmetic.',
      template: `from datetime import date, timedelta
tomorrow = date(2026, 11, 7) + ___(days=1)
gap = (date(2026, 12, 25) - date(2026, 11, 7)).___`,
      templateIsCode: true,
      blanks: [{ answers: ['timedelta'] }, { answers: ['days'] }],
      wordBank: ['timedelta', 'days', 'weeks', 'seconds'],
      explanation: 'Adding a `timedelta` to a `date` moves it forward. Subtracting two dates gives a `timedelta`, whose `.days` attribute is the whole number of days between them (48 here).',
    },
    {
      kind: 'concept',
      title: 'Dates, times and timing code',
      blocks: [
        {
          type: 'p',
          text: 'The `datetime` module has `date`, `time`, `datetime` and `timedelta` (a duration). Subtracting two dates gives a `timedelta`; adding a `timedelta` moves a date. For **measuring how long code takes**, use `time.perf_counter()`, a high-resolution clock that only goes forward — not `datetime.now()`, which can jump when the system clock is adjusted.',
        },
        {
          type: 'code',
          title: 'time_tour.py',
          runnable: true,
          code: `from datetime import date, datetime, timedelta, timezone
import time
d = date(2026, 11, 7)
print(d.weekday(), d + timedelta(days=30), (date(2027, 1, 1) - d).days)
dt = datetime(2026, 11, 7, 6, 30, tzinfo=timezone.utc)
print(dt.isoformat(), dt.timestamp())
print(datetime.fromisoformat("2026-11-07T06:30:00"), datetime.strptime("07/11/2026 18:05", "%d/%m/%Y %H:%M"))
print(timedelta(hours=1, minutes=30).total_seconds(), timedelta(days=1, seconds=1))
start = time.perf_counter()
time.sleep(0.01)
print(0.005 < time.perf_counter() - start < 1)`,
          output: `5 2026-12-07 55
2026-11-07T06:30:00+00:00 1794033000.0
2026-11-07 06:30:00 2026-11-07 18:05:00
5400.0 1 day, 0:00:01
True`,
          annotations: [
            { lines: 4, text: '`weekday()` counts Monday as 0, so 5 is **Saturday**. Date plus a `timedelta` gives a new date; date minus date gives a `timedelta` whose `.days` is the gap.' },
            { lines: 5, text: 'A `datetime` can be **naive** (no time zone) or **aware**. Attach a zone such as `timezone.utc` whenever the time will be stored or compared across machines.' },
            { lines: 6, text: '`isoformat()` gives the standard `YYYY-MM-DDTHH:MM:SS+00:00` text, and `timestamp()` the seconds since 1970-01-01 UTC (the "Unix time").' },
            { lines: 7, text: '`fromisoformat` parses ISO text; `strptime` parses any layout using the `%` codes from the Formatting lesson (`%d/%m/%Y` here).' },
            { lines: 8, text: '`timedelta` normalizes: one day and one second prints as `1 day, 0:00:01`; `total_seconds()` gives a single float.' },
            { lines: '9-11', text: '`perf_counter` before and after gives elapsed seconds. The comparison avoids printing the exact (varying) time.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Store UTC, show local',
          text: 'Save timestamps in UTC (or as ISO text with an offset) and convert to the player’s local zone only for display. Mixing naive and aware datetimes raises a `TypeError`, which is Python protecting you from silently wrong arithmetic. For named time zones, use `zoneinfo.ZoneInfo("Europe/Paris")`.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Measuring performance',
          text: 'For quick measurements use `time.perf_counter()`; for small snippets run many times use `timeit`; for finding *where* a program spends its time use `cProfile` (the Profiling lesson in Unit 15). Always measure before optimizing — intuition about speed is wrong surprisingly often.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: '`sqlite3`, Python’s interface to the SQLite database, is a third-party package that you must install with `pip` before use.',
      answer: false,
      explanation: 'False. `sqlite3` is part of the standard library. SQLite is a complete SQL database stored in a single file (or in memory), which makes it a great choice for game saves with lots of structured data, local caches and tools.',
    },
    {
      kind: 'error',
      prompt: 'The code should print `1`, the smallest number in the list, but it prints `5`. Tap the line where the bug starts.',
      lines: [
        'import heapq',
        'tasks = [5, 1, 3]',
        'smallest = heapq.heappop(tasks)',
        'print(smallest)',
      ],
      linesAreCode: true,
      errorLines: [2, 3],
      explanation: '`heappop` only works on a list that already satisfies the heap property. A plain list `[5, 1, 3]` does not, so it returns the first item. Call `heapq.heapify(tasks)` after creating the list (or build it with `heappush`) and `heappop` will return 1.',
    },
    {
      kind: 'concept',
      title: 'Programs and data: argparse, hashing, SQLite',
      blocks: [
        {
          type: 'p',
          text: 'The last group of modules connects your program to the world. `argparse` turns command-line arguments into values (with `--help` for free). `hashlib` and `base64` fingerprint and encode data. `sqlite3` gives you a real SQL database with no server. In this example `parse_args` receives an explicit list; when you run a script it reads the real arguments from `sys.argv`.',
        },
        {
          type: 'code',
          title: 'system_tour.py',
          runnable: true,
          code: `import argparse, hashlib, base64, sqlite3
ap = argparse.ArgumentParser(prog="forge")
ap.add_argument("level", type=int)
ap.add_argument("--hard", action="store_true")
ap.add_argument("--name", default="Ada")
print(ap.parse_args(["3", "--hard"]))
print(hashlib.sha256(b"hello").hexdigest()[:16], base64.b64encode(b"hello"))
con = sqlite3.connect(":memory:")
con.execute("create table scores (name text, pts int)")
con.executemany("insert into scores values (?, ?)", [("Ada", 120), ("Ben", 95), ("Cai", 7)])
print(con.execute("select name from scores where pts > ? order by pts desc", (50,)).fetchall())
print(con.execute("select count(*), sum(pts) from scores").fetchone())
con.close()`,
          output: `Namespace(level=3, hard=True, name='Ada')
2cf24dba5fb0a30e b'aGVsbG8='
[('Ada',), ('Ben',)]
(3, 222)`,
          annotations: [
            { lines: '2-5', text: 'Declare the options your program accepts: a required positional `level` converted to `int`, a `--hard` flag that is `True` only if present, and a `--name` option with a default. Users get `python forge.py --help` automatically.' },
            { lines: 6, text: '`parse_args` returns a `Namespace` whose attributes are the values. Wrong input prints a usage message and exits.' },
            { lines: 7, text: '`hashlib` computes digests: the same input always gives the same fixed-size fingerprint (here the first 16 hex characters of SHA-256), and a tiny change gives a completely different one. Useful for checksums and cache keys. `base64` encodes bytes as plain text.' },
            { lines: 8, text: '`":memory:"` creates a throwaway database that lives in RAM; pass a file name to store it on disk.' },
            { lines: '9-10', text: 'SQL is the language for tables: create one, insert many rows. The `?` placeholders are essential — they let the library insert values safely.' },
            { lines: 11, text: 'A query with a parameter. Rows come back as tuples, so a single column is `("Ada",)`.' },
            { lines: 12, text: 'Aggregates (`count`, `sum`) summarize a whole table in one query.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Never build SQL with f-strings',
          text: 'Writing `f"select * from users where name = \'{name}\'"` lets a player named `x\'; drop table users; --` run their own SQL — **SQL injection**. Always pass values through `?` placeholders as above. (This is exactly the problem Python 3.14’s t-strings were designed to help libraries solve.)',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'How to find your way around',
          text: 'In a REPL, `dir(module)` lists a module’s names and `help(module.function)` prints its documentation; `python -m pydoc -b` opens browsable docs. The official "Python Module Index" lists every standard module, and the "Library Reference" has an intro paragraph for each. Other modules worth knowing exist for `logging`, `subprocess`, `urllib`, `zipfile`, `shutil`, `tempfile`, `enum`, `dataclasses`, `functools`, `itertools`, `threading` and `asyncio` — several are covered in later units.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Standard library first',
          text: 'The usual order of preference: (1) a built-in or standard-library tool, (2) a well-known third-party package, (3) your own code. Every dependency you add must be installed, updated and trusted; the standard library comes for free and is maintained by the Python core team.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'What is `statistics.median([7, 1, 5, 3])`?',
      answer: '4',
      hint: 'Sort the data first: with an even number of items the median is the mean of the two middle values.',
      explanation: 'Sorted, the list is `[1, 3, 5, 7]`. With four items the median is the average of the two middle ones: $(3 + 5) / 2 = 4$ (printed as `4.0`).',
      label: 'Median:',
    },
    {
      kind: 'code',
      prompt: 'Write `top_words(text, n)` that returns the `n` most frequent words as a list of `(word, count)` tuples. Words are runs of lowercase letters and apostrophes **after lower-casing** the text (so punctuation is ignored and `The` equals `the`). Sort by count descending, ties alphabetically.',
      starter: `# define top_words here
`,
      solution: `import re
from collections import Counter

def top_words(text, n):
    words = re.findall(r"[a-z']+", text.lower())
    counts = Counter(words)
    return sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))[:n]
`,
      tests: `assert top_words("The cat and the hat. And THE bat!", 3) == [("the", 3), ("and", 2), ("bat", 1)], top_words("The cat and the hat. And THE bat!", 3)
assert top_words("", 5) == []
assert top_words("b a b a c", 2) == [("a", 2), ("b", 2)]
assert top_words("don't stop, don't", 1) == [("don't", 2)]
assert top_words("one two", 10) == [("one", 1), ("two", 1)]`,
      checks: ['Case and punctuation are ignored', 'Sorted by count (high to low), ties alphabetical', 'Returns at most `n` pairs, and `[]` for empty text'],
      hint: 'Use `re.findall(r"[a-z\']+", text.lower())`, build a `Counter`, then `sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))` and slice with `[:n]`.',
      explanation: '`Counter` does the counting. Its own `most_common` breaks ties by first appearance, so to get a *stable, alphabetical* tie-break the code sorts the items itself with the key `(-count, word)`: negating the count gives descending order while the word keeps ascending order.',
    },
    {
      kind: 'code',
      prompt: 'Write `days_until(today, target)` that takes two ISO date strings (`"YYYY-MM-DD"`) and returns the number of days from `today` to `target` as an `int` — negative if `target` is in the past.',
      starter: `# define days_until here
`,
      solution: `from datetime import date

def days_until(today, target):
    return (date.fromisoformat(target) - date.fromisoformat(today)).days
`,
      tests: `assert days_until("2026-11-07", "2026-12-25") == 48
assert days_until("2024-02-28", "2024-03-01") == 2
assert days_until("2025-02-28", "2025-03-01") == 1
assert days_until("2026-11-07", "2026-11-07") == 0
assert days_until("2026-11-07", "2026-11-01") == -6
assert isinstance(days_until("2026-01-01", "2026-01-02"), int)`,
      checks: ['Handles month boundaries and leap years', 'Same day gives 0 and past dates are negative', 'Returns an `int`'],
      hint: 'Parse both strings with `date.fromisoformat`, subtract them, and take `.days` of the resulting `timedelta`.',
      explanation: 'Subtracting two `date` objects gives a `timedelta`, and `.days` is its whole-day count (negative if the result is backwards). Using the library means leap years — 2024 had a February 29th — are handled correctly without any special code.',
    },
    {
      kind: 'code',
      prompt: 'Write `top_players(rows, n)` using an **in-memory SQLite database**. `rows` is a list of `(name, points)` tuples, where a name may appear several times (one row per match). Return the `n` best players as `(name, total_points)` tuples sorted by total points descending, ties alphabetical. Use SQL (`group by`) for the totals and pass values with `?` placeholders.',
      starter: `import sqlite3

# define top_players here
`,
      solution: `import sqlite3

def top_players(rows, n):
    con = sqlite3.connect(":memory:")
    con.execute("create table s (name text, pts int)")
    con.executemany("insert into s values (?, ?)", rows)
    result = con.execute(
        "select name, sum(pts) as total from s group by name order by total desc, name limit ?",
        (n,),
    ).fetchall()
    con.close()
    return result
`,
      tests: `rows = [("Ada", 10), ("Ben", 5), ("Ada", 7), ("Cai", 17)]
assert top_players(rows, 2) == [("Ada", 17), ("Cai", 17)], top_players(rows, 2)
assert top_players(rows, 10) == [("Ada", 17), ("Cai", 17), ("Ben", 5)]
assert top_players([], 3) == []
assert top_players([("Zed", 1)], 5) == [("Zed", 1)]
assert top_players([("O'Neil", 4), ("O'Neil", 6)], 1) == [("O'Neil", 10)]`,
      checks: ['Totals are summed per name with `group by`', 'Ordered by total descending, then name', 'Names containing quotes work, because values use `?` placeholders'],
      hint: 'SQL: `select name, sum(pts) as total from s group by name order by total desc, name limit ?`. Create the table, `executemany` the rows, then `fetchall()`.',
      explanation: '`group by name` collapses each player’s rows into one and `sum(pts)` totals them; `order by total desc, name` gives the required ordering and `limit ?` takes the top `n`. Because the values travel through `?` placeholders, a name like `O\'Neil` needs no special handling — and cannot be used for SQL injection.',
    },
  ],
  takeaways: [
    'The standard library is "batteries included": check it before installing a package. Start with `collections` (`Counter`, `defaultdict`, `deque`, `namedtuple`), `heapq` (priority queue — pops the smallest) and `bisect` (sorted lists).',
    '`math` for float functions (use `isclose`, not `==`), `random.Random(seed)` for reproducible randomness (use `secrets` for security), `statistics` for averages, `decimal` and `fractions` for exact arithmetic.',
    '`datetime`/`timedelta` for dates and durations (store UTC, show local); `time.perf_counter()` to measure code.',
    '`argparse` builds command-line interfaces; `hashlib`/`base64` fingerprint and encode data; `sqlite3` is a full SQL database — always pass values with `?` placeholders, never f-strings.',
    'Explore with `dir()`, `help()` and the Library Reference; prefer standard library, then well-known packages, then your own code.',
  ],
  reading: [
    { title: 'The Python Standard Library (Library Reference)', url: 'https://docs.python.org/3/library/index.html', source: 'docs', note: 'The index of every standard module with an overview for each.' },
    { title: 'Python Module Index', url: 'https://docs.python.org/3/py-modindex.html', source: 'docs', note: 'An alphabetical list of all modules, handy for browsing what exists.' },
    { title: 'Python Module of the Week', url: 'https://pymotw.com/3/', source: 'article', note: 'Doug Hellmann’s long-running tour of the standard library, with examples and output for each module.' },
    { title: 'collections — Container datatypes', url: 'https://docs.python.org/3/library/collections.html', source: 'docs', note: 'Counter, defaultdict, deque, namedtuple and friends in detail.' },
  ],
};
