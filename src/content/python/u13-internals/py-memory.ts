import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-memory',
  title: 'Memory Management and Garbage Collection',
  summary: 'How CPython frees memory: reference counting, the cycle collector, `del` and `__del__`, weak references, `__slots__`, measuring memory with `sys.getsizeof` and `tracemalloc`, and the leak patterns that matter for games and AI code.',
  minutes: 20,
  objectives: [
    'Explain reference counting and what `del` really does',
    'Describe why reference cycles need the cycle collector and how `gc.collect()` fits in',
    'Use weak references (`weakref`) for caches and registries that must not keep objects alive',
    'Reduce per-object memory with `__slots__` and measure memory with `sys.getsizeof` and `tracemalloc`',
    'Recognize common Python memory leaks (unbounded caches, lingering references) and their AI/ML equivalents',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Reference counting: how objects die',
      blocks: [
        {
          type: 'p',
          text: 'Python manages memory for you, but it is not magic. In CPython every object carries a **[[reference-counting|reference count]]**: the number of references to it (names, list slots, attributes, arguments…). Binding a new reference increases it, dropping one decreases it, and when it reaches **zero** the object is destroyed on the spot and its memory is reused. That is why you rarely write `free()` — and why objects usually vanish *immediately* when the last reference goes away.',
        },
        {
          type: 'code',
          title: 'refcount.py',
          runnable: true,
          code: `import sys

events = []

class Thing:
    def __init__(self, name):
        self.name = name

    def __del__(self):
        events.append("freed " + self.name)

t = Thing("a")
alias = t
del t
events.append("after del t")
alias = None
events.append("after alias = None")
print(events)

x = []
base = sys.getrefcount(x)
y = x
z = [x]
print(sys.getrefcount(x) - base)
del y
print(sys.getrefcount(x) - base)`,
          output: `['after del t', 'freed a', 'after alias = None']
2
1`,
          annotations: [
            { lines: '9-10', text: '`__del__` is a **[[finalizer]]**: called just before the object is destroyed. We use it here only to *see* when destruction happens. Real code should rarely define it.' },
            { lines: '12-13', text: 'Two references to one `Thing`: the names `t` and `alias`. Its reference count is 2.' },
            { lines: 14, text: '`del t` removes the **name** `t`, not the object. One reference remains (`alias`), so nothing is freed yet.' },
            { lines: '16-17', text: 'Rebinding `alias` drops the last reference. The count hits zero and `__del__` runs *immediately* — "freed a" appears before the next line executes.' },
            { lines: 21, text: '`sys.getrefcount` reports one more than you expect, because passing `x` as an argument creates a temporary reference. So compare differences, not absolute numbers.' },
            { lines: '22-24', text: 'Two new references (the name `y` and the slot inside the list `z`) raise the count by 2.' },
            { lines: '25-26', text: 'Deleting `y` removes one of them: the difference is now 1.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why reference counting?',
          text: 'It gives **prompt, predictable cleanup**: memory and resources (open files, sockets) are released the moment nothing needs them, without pauses for a big collection run. Its costs are a small update on every assignment, trouble with reference cycles (next step), and the fact that it is a CPython detail — PyPy and others use different garbage collectors, so never *rely* on `__del__` timing.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'Reference counting is what `std::shared_ptr` does — but built into every Python object, with no ownership decisions for you to make. There are no dangling pointers and no manual `delete`; the price is that Python objects are heavier (each has a header with its count and type) and that cycles need special handling, which is what `std::weak_ptr` solves in C++.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'What del does',
          text: '`del name` only **unbinds a name** (and decrements the count of the object it referred to). It never forcibly destroys an object — if other references exist, the object lives on. `del lst[0]` and `del d["k"]` remove a slot or key the same way. Memory is returned to Python’s allocator, which often keeps it for reuse rather than returning it to the operating system.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'An object has three references. You execute `del` on one of the names. What happens to the object?',
      options: [
        { text: 'Nothing: it lives on with two remaining references', correct: true, why: '`del` removes just one reference. The object is destroyed only when its count drops to zero.' },
        { text: 'It is destroyed immediately, and the other two names become invalid', why: '`del` never destroys an object that is still referenced; the other two names keep working normally.' },
        { text: 'It is queued for the garbage collector, which destroys it later', why: 'Reference counting is immediate: objects with zero references are freed at once. The garbage collector is only needed for cycles.' },
        { text: 'All three names are deleted together', why: '`del` removes exactly one name. Other names bound to the same object are unaffected.' },
      ],
      explanation: '`del name` unbinds one name and decreases the object’s reference count. The object is freed only when the count reaches zero.',
    },
    {
      kind: 'concept',
      title: 'Cycles, the garbage collector and weak references',
      blocks: [
        {
          type: 'p',
          text: 'Reference counting has one weakness: **cycles**. If `a` refers to `b` and `b` refers to `a`, each keeps the other’s count above zero even after your program lets go of both. That is **[[cyclic-garbage]]**: unreachable but never freed by counting alone. CPython therefore also has a **cycle collector** (the `gc` module) that periodically searches for groups of objects that only reference each other and frees them. You can trigger it with `gc.collect()`, which returns the number of unreachable objects found.',
        },
        {
          type: 'code',
          title: 'cycles.py',
          runnable: true,
          code: `import gc

gc.disable()
freed = []

class Node:
    def __init__(self, name):
        self.name = name
        self.other = None

    def __del__(self):
        freed.append(self.name)

a, b = Node("a"), Node("b")
a.other, b.other = b, a
del a, b
print(freed)
found = gc.collect()
print(sorted(freed), found > 0)
gc.enable()`,
          output: `[]
['a', 'b'] True`,
          annotations: [
            { lines: 3, text: 'We switch off automatic collection *only for this demo*, so the result doesn’t depend on timing. In real programs leave the collector enabled.' },
            { lines: '14-15', text: 'A **cycle**: `a.other` is `b` and `b.other` is `a`. Each node is referenced by the other.' },
            { lines: 16, text: 'Both *names* are deleted, yet each object still has one reference — from the other object.' },
            { lines: 17, text: 'Nothing was freed: counts never reached zero. The pair is unreachable garbage, but counting can’t see that.' },
            { lines: 18, text: '`gc.collect()` runs the cycle detector, which finds groups reachable only from themselves, and frees them.' },
            { lines: 19, text: 'Both nodes were finalized, and `collect` reported unreachable objects (`True`).' },
            { lines: 20, text: 'Turn automatic collection back on.' },
          ],
        },
        {
          type: 'p',
          text: 'Sometimes you want a reference that does **not** keep the target alive: a cache of loaded sprites, a list of observers, a registry of live enemies. A **[[weak-reference|weak reference]]** (`weakref.ref`, `WeakValueDictionary`, `WeakSet`) does not count toward the reference count. When the object dies, the weak reference reads as `None` (or the entry disappears), so the cache can never keep dead objects alive.',
        },
        {
          type: 'code',
          title: 'weakrefs.py',
          runnable: true,
          code: `import weakref

class Enemy:
    pass

e = Enemy()
r = weakref.ref(e)
print(r() is e)
del e
print(r())

cache = weakref.WeakValueDictionary()
sprite = Enemy()
cache["boss"] = sprite
print(len(cache))
del sprite
print(len(cache))`,
          output: `True
None
1
0`,
          annotations: [
            { lines: 7, text: '`weakref.ref(e)` creates a weak reference. The `Enemy` still has a single *strong* reference: the name `e`.' },
            { lines: 8, text: 'Calling the weak reference returns the object while it is alive.' },
            { lines: '9-10', text: 'After `del e` the last strong reference is gone, the object is destroyed, and the weak reference now returns `None`.' },
            { lines: '12-15', text: 'A `WeakValueDictionary` holds its values weakly: while `sprite` exists the cache has one entry.' },
            { lines: '16-17', text: 'When the last strong reference disappears the entry vanishes automatically: `len(cache)` is 0.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Not everything can be weakly referenced',
          text: 'Instances of your own classes can, but **built-in** `list`, `dict`, `int`, `str` and `tuple` objects cannot: `weakref.ref([1, 2, 3])` raises `TypeError: cannot create weak reference to \'list\' object`. Classes that define `__slots__` without `"__weakref__"` also refuse. Wrap data in a small class (or subclass `list`) if you need to track it weakly.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Prefer with over __del__',
          text: '`__del__` timing is only reliable in CPython, exceptions inside it are swallowed, and cycles with finalizers were once uncollectable. For real cleanup use a **context manager** (previous lesson) or `try`/`finally`; use weak references to avoid keeping objects alive by accident.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If two objects only refer to each other and nothing else refers to them, plain reference counting alone frees them.',
      answer: false,
      explanation: 'False. Each object still has a reference — from the other one — so neither count reaches zero. Only the cycle collector (`gc`) can detect and free such unreachable cycles.',
    },
    {
      kind: 'concept',
      title: 'How big are objects? Measuring and shrinking memory',
      blocks: [
        {
          type: 'p',
          text: 'Everything is an object, and objects have overhead: an `int` is far larger than the 4 bytes a C++ `int` needs, and an instance with several attributes carries a per-instance `__dict__`. **`sys.getsizeof(obj)`** returns the size of the object itself — *not* of what it refers to — so a list of a million items reports only the list’s pointer array. Lists also **over-allocate** when they grow, so they resize rarely and `append` stays fast on average (amortized O(1)). Games with huge numbers of small objects can cut memory with **[[slots]]** (`__slots__`), which gives instances a fixed layout and no `__dict__`.',
        },
        {
          type: 'code',
          title: 'slots_and_sizes.py',
          runnable: true,
          code: `import sys

class A:
    def __init__(self):
        self.x = 1
        self.y = 2

class B:
    __slots__ = ("x", "y")

    def __init__(self):
        self.x = 1
        self.y = 2

a, b = A(), B()
print(hasattr(a, "__dict__"), hasattr(b, "__dict__"))
print(sys.getsizeof(b) < sys.getsizeof(a) + sys.getsizeof(a.__dict__))
try:
    b.z = 3
except AttributeError:
    print("no new attributes")
nums = list(range(1000))
gen = (n for n in range(1000))
print(sys.getsizeof(nums) > sys.getsizeof(gen))`,
          output: `True False
True
no new attributes
True`,
          annotations: [
            { lines: '3-6', text: 'An ordinary class: each instance stores its attributes in a per-instance dictionary, which costs memory.' },
            { lines: '8-13', text: '`__slots__` declares the only allowed attributes. Instances store them in a compact fixed layout.' },
            { lines: 16, text: 'Instances of `A` have a `__dict__`; instances of `B` do not.' },
            { lines: 17, text: 'The slotted object is smaller than the plain object *plus* its dictionary.' },
            { lines: '18-21', text: 'A side effect: slotted classes reject typos and new attributes with `AttributeError`.' },
            { lines: '22-24', text: 'A generator takes a few dozen bytes whatever its length; a list holds all 1000 references. Lazy iteration (Unit 11) is a memory tool, too.' },
          ],
        },
        {
          type: 'code',
          title: 'list_growth.py',
          runnable: true,
          code: `import sys

sizes = []
lst = []
for i in range(30):
    s = sys.getsizeof(lst)
    if not sizes or s != sizes[-1]:
        sizes.append(s)
    lst.append(i)
print(len(sizes) < 30, sizes[0] < sizes[-1])`,
          output: `True True`,
          annotations: [
            { lines: '5-9', text: 'Record the list’s size after each append, keeping only the values where it changed.' },
            { lines: 10, text: 'The size changed far fewer than 30 times (`True`): the list grows in occasional jumps, reserving spare room each time, which is why `append` is cheap. And it did grow overall (`True`).' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Measure before you optimize',
          text: '`__slots__` pays off when you create *hundreds of thousands* of small objects (particles, tiles, events). For ordinary code it is a distraction: it blocks features such as dynamic attributes and complicates inheritance. Profile first (Unit 15), then trade features for memory only where the numbers justify it. For truly big numeric data, use NumPy arrays or tensors, which store raw numbers compactly instead of one object per element.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Why NumPy and PyTorch exist',
          text: 'A Python list of a million floats is a million pointers to a million float *objects*. A NumPy array of a million floats is one block of 8 MB of raw numbers. Frameworks like PyTorch go further and place tensors in GPU memory, outside Python’s allocator and garbage collector. This is why AI code treats memory so differently — and why the leaks look different too (next step).',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code so that it prints `None`: the weak reference must not keep the cyclic object alive, and the garbage collector must be run to free it.',
      template: `import gc, weakref
class Node:
    pass
a = Node()
a.me = a
r = weakref.___(a)
del a
gc.___()
print(r())`,
      templateIsCode: true,
      blanks: [{ answers: ['ref'] }, { answers: ['collect'] }],
      wordBank: ['ref', 'collect', 'free', 'proxy'],
      explanation: '`weakref.ref(a)` makes a weak reference. The node refers to itself (`a.me = a`), so deleting the name leaves a cycle; reference counting cannot free it, but `gc.collect()` can — after which the weak reference returns `None`.',
    },
    {
      kind: 'concept',
      title: 'Tracking memory and avoiding leaks',
      blocks: [
        {
          type: 'p',
          text: 'Python can still “leak” memory, in the sense that your program keeps objects alive without meaning to. Typical causes: a **cache or list that only grows** (a module-level dict of results, a log of every frame), **lingering references** (a global, a closure, a long-lived object holding on to big data, an exception traceback holding stack frames), and **cycles with finalizers** in older code. The standard library’s **`tracemalloc`** shows how much memory your Python code has allocated and where.',
        },
        {
          type: 'code',
          title: 'tracemalloc_demo.py',
          runnable: true,
          code: `import tracemalloc

tracemalloc.start()
data = [str(i) for i in range(10000)]
current, peak = tracemalloc.get_traced_memory()
print(current > 100_000)
del data
current2, _ = tracemalloc.get_traced_memory()
print(current2 < current / 2)
tracemalloc.stop()`,
          output: `True
True`,
          annotations: [
            { lines: 3, text: '`tracemalloc.start()` begins recording every allocation made by Python code.' },
            { lines: 4, text: 'Ten thousand small strings: a surprising amount of memory.' },
            { lines: '5-6', text: '`get_traced_memory()` returns `(current, peak)` in bytes. The list and its strings occupy over 100,000 bytes (`True`).' },
            { lines: '7-9', text: 'After `del data` the last reference is gone, reference counting frees everything, and traced memory drops to less than half (`True`).' },
            { lines: 10, text: 'Stop tracing when done, as tracing slows the program down.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The classic AI leak',
          text: 'In PyTorch training loops, writing `total_loss += loss` (instead of `loss.item()`) keeps every iteration’s whole computation graph alive, so memory grows until the GPU runs out. Storing tensors from every step in a list, or leaving evaluation code outside `torch.no_grad()`, has the same effect. The rule is the same as for any leak: **something is still referencing data you no longer need.**',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'A debugging routine for leaks',
          text: '1) Confirm memory really grows over time (watch the process, or `tracemalloc.get_traced_memory()`). 2) Take two `tracemalloc` snapshots and compare them to find the lines allocating the growth. 3) Look for who still references the data: caches, globals, lists you only append to, closures, callbacks never unregistered. 4) Fix it by bounding the cache (`lru_cache(maxsize=...)`), using weak references, or deleting references (`del`, `x = None`) when done.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"When is an object freed in CPython?" (when its reference count reaches zero); "Why do cycles need a separate collector?"; "What does `del x` do?" (removes a name); "When would you use `weakref`?" (caches, registries that must not keep objects alive); "What does `__slots__` change?" (no per-instance `__dict__`; fixed attributes).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Follow each object’s reference count.',
      code: `log = []

class R:
    def __init__(self, n):
        self.n = n

    def __del__(self):
        log.append(self.n)

a = R(1)
b = a
a = R(2)
del b
log.append("end")
print(log)`,
      answer: "[1, 'end']",
      hint: '`R(1)` has two references (`a` and `b`) until `a` is rebound; it dies when the second one goes.',
      explanation: '`a = R(2)` rebinds `a`, but `R(1)` is still referenced by `b`, so nothing is freed. `del b` drops the last reference to `R(1)`: its `__del__` logs 1 immediately, *before* "end" is appended. `R(2)` is still alive when the list is printed.',
    },
    {
      kind: 'error',
      prompt: 'This tries to watch a list without keeping it alive, but raises `TypeError: cannot create weak reference to \'list\' object`. Tap the faulty line.',
      lines: [
        'import weakref',
        'class Enemy:',
        '    pass',
        'e = Enemy()',
        'r = weakref.ref([1, 2, 3])',
        'print(r())',
      ],
      linesAreCode: true,
      errorLines: [5],
      explanation: 'Built-in containers such as `list`, `dict`, `tuple`, `int` and `str` do not support weak references. The `Enemy` instance would work (`weakref.ref(e)`). To watch a list weakly, wrap it in your own class or subclass `list`.',
    },
    {
      kind: 'numeric',
      prompt: 'How many references to the list object exist at the end (names plus list slots)?\n\n`a = [1]`\n`b = a`\n`c = [a, a]`\n`d = a`\n`del b`\n`del d`',
      answer: '3',
      hint: 'Count the names that still exist, then the slots inside `c`.',
      explanation: 'The names `b` and `d` were deleted, leaving the name `a`. The list `c` holds two more references to the same object (two slots), so the total is 1 + 2 = 3. The list is destroyed only when all three are gone.',
      label: 'References:',
    },
    {
      kind: 'code',
      prompt: 'Write a class `WeakRegistry` that tracks objects **without keeping them alive**. `add(obj)` registers an object, `alive()` returns the sorted list of the `name` attributes of the registered objects that are still alive, and `len(registry)` returns how many are alive. Use `weakref.WeakSet`.',
      starter: `import weakref

class WeakRegistry:
    ...
`,
      solution: `import weakref


class WeakRegistry:
    def __init__(self):
        self._items = weakref.WeakSet()

    def add(self, obj):
        self._items.add(obj)

    def alive(self):
        return sorted(o.name for o in self._items)

    def __len__(self):
        return len(self._items)
`,
      tests: `import gc

class Unit:
    def __init__(self, name):
        self.name = name

reg = WeakRegistry()
a, b, c = Unit("zed"), Unit("amy"), Unit("kim")
reg.add(a)
reg.add(b)
reg.add(c)
assert reg.alive() == ["amy", "kim", "zed"]
assert len(reg) == 3

del b
gc.collect()
assert reg.alive() == ["kim", "zed"]
assert len(reg) == 2

reg.add(a)
assert len(reg) == 2

del a, c
gc.collect()
assert reg.alive() == [] and len(reg) == 0
assert len(WeakRegistry()) == 0`,
      checks: ['Stores objects in a \`weakref.WeakSet\`', '\`alive()\` returns sorted names of surviving objects', '\`len()\` counts only live objects; dead ones disappear automatically'],
      hint: 'Create `self._items = weakref.WeakSet()` in `__init__`. `alive()` can be `sorted(o.name for o in self._items)`, and `__len__` can return `len(self._items)`.',
      explanation: 'A `WeakSet` holds its members weakly, so registering an object does not keep it alive; when the last strong reference disappears the entry vanishes on its own. This is the standard pattern for caches, observer lists and "all live enemies" registries that must not cause leaks.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Particle` that uses **`__slots__`** for the attributes `x`, `y`, `vx`, `vy`. The constructor is `Particle(x, y, vx=0.0, vy=0.0)`. The method `step(dt)` moves the particle (`x += vx * dt`, `y += vy * dt`). Instances must have no `__dict__` and must reject new attributes.',
      starter: `class Particle:
    ...
`,
      solution: `class Particle:
    __slots__ = ("x", "y", "vx", "vy")

    def __init__(self, x, y, vx=0.0, vy=0.0):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy

    def step(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt
`,
      tests: `p = Particle(1.0, 2.0, vx=3.0, vy=-1.0)
p.step(2)
assert (p.x, p.y) == (7.0, 0.0)
assert (p.vx, p.vy) == (3.0, -1.0)

q = Particle(0, 0)
assert (q.vx, q.vy) == (0.0, 0.0)
q.step(5)
assert (q.x, q.y) == (0, 0)

assert not hasattr(p, "__dict__")
assert set(Particle.__slots__) == {"x", "y", "vx", "vy"}
try:
    p.z = 1
    assert False, "new attributes must be rejected"
except AttributeError:
    pass

ps = [Particle(i, 0, 1, 0) for i in range(3)]
for item in ps:
    item.step(1)
assert [item.x for item in ps] == [1, 2, 3]`,
      checks: ['Declares \`__slots__ = ("x", "y", "vx", "vy")\`', 'Defaults for \`vx\` and \`vy\` are 0.0; \`step(dt)\` updates both coordinates', 'No \`__dict__\`; assigning a new attribute raises \`AttributeError\`'],
      hint: 'Put `__slots__ = ("x", "y", "vx", "vy")` at the top of the class body, assign the four attributes in `__init__`, and update `self.x` and `self.y` in `step`.',
      explanation: 'With `__slots__` Python allocates a fixed slot per attribute and creates no per-instance dictionary, so a million particles take noticeably less memory. The trade-off is flexibility: no dynamic attributes, and every attribute must be declared in advance.',
    },
    {
      kind: 'code',
      prompt: 'Write `has_cycle(value)` that returns `True` if a structure of nested **lists and dicts** contains a reference cycle (a container that can reach itself), else `False`. Other values (numbers, strings, `None`) are not containers. A container that is merely **shared** in several places (no loop) is *not* a cycle.',
      starter: `def has_cycle(value):
    ...
`,
      solution: `def has_cycle(value):
    path = set()

    def visit(v):
        if not isinstance(v, (list, dict)):
            return False
        key = id(v)
        if key in path:
            return True
        path.add(key)
        children = v.values() if isinstance(v, dict) else v
        found = any(visit(child) for child in children)
        path.discard(key)
        return found

    return visit(value)
`,
      tests: `a = [1, 2]
assert has_cycle(a) is False
a.append(a)
assert has_cycle(a) is True

d = {}
e = {"d": d}
d["e"] = e
assert has_cycle(d) is True and has_cycle(e) is True

shared = [1]
assert has_cycle([shared, shared, {"s": shared}]) is False
assert has_cycle(5) is False and has_cycle("abc") is False and has_cycle(None) is False

deep = []
cur = deep
for _ in range(50):
    nxt = []
    cur.append(nxt)
    cur = nxt
assert has_cycle(deep) is False
cur.append(deep)
assert has_cycle(deep) is True
assert has_cycle({"k": [1, {"inner": []}]}) is False`,
      checks: ['Detects cycles through lists and dicts', 'Shared (diamond-shaped) containers without loops are not reported', 'Non-container values return \`False\`'],
      hint: 'Do a depth-first walk keeping the `id`s of the containers on the **current path**. If you meet one that is already on the path, there is a cycle. Remove an id from the path when you leave that container, so shared (but not looping) containers are fine.',
      explanation: 'A cycle means "I can reach myself", so only containers on the *current path* matter. Removing the id after finishing a container (`path.discard`) is what lets a container appear several times without being flagged. This is a simplified version of what the cycle collector does when it hunts for unreachable loops.',
    },
  ],
  takeaways: [
    'CPython frees an object the moment its **reference count** reaches zero. `del name` only removes a name; the object lives on while other references exist.',
    '**Reference cycles** keep each other’s counts above zero, so CPython also runs a cycle collector (`gc`); `gc.collect()` forces a run. Rely on neither `__del__` timing nor garbage collection for cleanup — use `with`/`try`/`finally`.',
    '**Weak references** (`weakref.ref`, `WeakValueDictionary`, `WeakSet`) don’t keep objects alive — ideal for caches and registries. Built-in `list`, `dict`, `int`, `str` can’t be weakly referenced.',
    '`sys.getsizeof` measures only the object itself; lists over-allocate; `__slots__` removes the per-instance `__dict__` for memory-heavy classes; generators avoid holding whole sequences.',
    'Python “leaks” are really lingering references: unbounded caches, globals, stored tensors with their graphs. Use `tracemalloc`, bound your caches, and call `.item()` or `detach()` in training loops.',
  ],
  reading: [
    { title: 'gc — Garbage Collector interface', url: 'https://docs.python.org/3/library/gc.html', source: 'docs', note: 'Reference for `gc.collect`, thresholds and debugging flags.' },
    { title: 'weakref — Weak references', url: 'https://docs.python.org/3/library/weakref.html', source: 'docs', note: 'How weak references, `WeakValueDictionary` and `WeakSet` work, and which types support them.' },
    { title: 'tracemalloc — Trace memory allocations', url: 'https://docs.python.org/3/library/tracemalloc.html', source: 'docs', note: 'Snapshots and comparisons for finding where memory goes.' },
    { title: 'Memory Management in Python', url: 'https://realpython.com/python-memory-management/', source: 'article', note: 'An accessible tour of CPython’s allocator, reference counting and garbage collection.' },
    { title: 'Garbage collector design (CPython Developer’s Guide)', url: 'https://devguide.python.org/internals/garbage-collector/', source: 'docs', note: 'For the curious: how the cycle detector actually works inside CPython.' },
  ],
};
