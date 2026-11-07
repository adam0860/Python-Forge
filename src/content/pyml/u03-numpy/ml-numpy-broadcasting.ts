import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-numpy-broadcasting',
  title: 'Vectorization and Broadcasting',
  summary: 'Replace Python loops with whole-array operations, and learn the broadcasting rules that let arrays of different shapes work together: the technique behind normalization, softmax, distance matrices and every batch computation.',
  minutes: 22,
  objectives: [
    'Rewrite element-by-element loops as vectorized NumPy expressions using ufuncs',
    'Apply the broadcasting rules to predict the result shape of an operation, or the error it raises',
    'Use np.newaxis and keepdims to make shapes line up',
    'Normalize a dataset and compute softmax over a batch with broadcasting',
    'Compute distances between many points at once without loops',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Vectorization: think in whole arrays',
      blocks: [
        {
          type: 'p',
          text: '**Vectorization** means expressing a computation on a whole array at once instead of writing a Python loop over its elements. NumPy provides **universal functions** ([[ufunc|ufuncs]]) such as `np.exp`, `np.sqrt`, `np.maximum` and the arithmetic operators, which apply an operation to every element in compiled code. The result is shorter, clearer and usually much faster code. Almost every formula in an ML paper (a sigmoid, a loss, a normalization) turns into one line of vectorized code.',
        },
        {
          type: 'code',
          title: 'loop_vs_vectorized.py',
          runnable: true,
          outputVaries: true,
          packages: ['numpy'],
          code: `import time
import numpy as np

n = 1_000_000
xs = list(range(n))
arr = np.arange(n, dtype=np.float64)

start = time.perf_counter()
squares = [x * x + 1.0 for x in xs]
t_loop = time.perf_counter() - start

start = time.perf_counter()
squares_np = arr * arr + 1.0
t_np = time.perf_counter() - start

print(f"list comprehension: {t_loop:.3f} s")
print(f"NumPy:              {t_np:.4f} s")
print(f"speed-up: about {t_loop / t_np:.0f}x")
print(squares[10] == squares_np[10])`,
          output: `list comprehension: 0.065 s
NumPy:              0.0092 s
speed-up: about 7x
True`,
          annotations: [
            { lines: '4-6', text: 'A million numbers, once as a Python list and once as a `float64` array.' },
            { lines: '8-10', text: 'The loop version, timed with `time.perf_counter`: the interpreter runs the multiply-and-add a million times.' },
            { lines: '12-14', text: 'The vectorized version: one expression, no loop. `arr * arr + 1.0` runs two compiled passes over the memory.' },
            { lines: '16-18', text: 'Your timings will differ from this sample (it varies with the machine). The speed-up is typically somewhere between 5× and 100× depending on the operation, and grows for heavier maths such as `np.exp` on large arrays.' },
            { lines: 19, text: 'Both versions compute exactly the same numbers.' },
          ],
        },
        {
          type: 'code',
          title: 'ufuncs.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

x = np.array([-2.0, -0.5, 0.0, 1.5, 3.0])
print(np.maximum(x, 0))
print(np.round(1 / (1 + np.exp(-x)), 3))
print(np.where(x > 0, x, 0.1 * x))
print(np.clip(x, -1, 1), np.abs(x).sum())`,
          output: `[0.  0.  0.  1.5 3. ]
[0.119 0.378 0.5   0.818 0.953]
[-0.2  -0.05  0.    1.5   3.  ]
[-1.  -0.5  0.   1.   1. ] 7.0`,
          annotations: [
            { lines: 4, text: '**ReLU**, the most common neural-network activation: `np.maximum(x, 0)` compares every element with 0 and keeps the larger one.' },
            { lines: 5, text: 'The **sigmoid** `1 / (1 + e^-x)` written exactly like the formula. `np.exp` is applied to every element; `1 / (...)` and `+` are element-wise too.' },
            { lines: 6, text: '`np.where(condition, a, b)` chooses element by element: `x` where the condition holds, `0.1 * x` elsewhere. That is a **leaky ReLU** in one line, with no `if` statement.' },
            { lines: 7, text: '`np.clip` limits values to a range (handy for bounding actions or rewards), and `np.abs(x).sum()` chains a ufunc with a reduction.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why vectorized code also matters beyond speed',
          text: 'GPU libraries such as PyTorch use exactly the same style: you describe operations on whole tensors, and the library runs them in parallel on thousands of cores. A Python loop over elements cannot be parallelized and defeats the purpose. Learning to write array code in NumPy is learning to write PyTorch code, and a tensor operation that looks like a NumPy one usually *is* the same function with the same name.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Avoid explicit loops over elements',
          text: 'If you find yourself writing `for i in range(len(a))` to touch every element, stop and look for a ufunc, a reduction or `np.where`. It is fine to loop over *episodes*, *epochs* or *batches* (a handful of iterations that each do heavy array work); it is not fine to loop over the *elements* inside one.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Broadcasting: arrays of different shapes',
      blocks: [
        {
          type: 'p',
          text: 'What should `matrix + row` mean when the shapes differ? **[[broadcasting]]** gives a precise answer. NumPy compares the two shapes **from the rightmost dimension to the left**. Two dimensions are compatible if they are **equal** or one of them is **1**; a dimension of length 1 is stretched to match the other. A missing leading dimension counts as 1. If any pair is incompatible, you get a `ValueError`. The stretching is virtual: no data is copied.',
        },
        {
          type: 'table',
          headers: ['Shape A', 'Shape B', 'Result', 'Why'],
          rows: [
            ['`(2, 3)`', '`(3,)`', '`(2, 3)`', 'the row `(3,)` becomes `(1, 3)` and is stretched down over 2 rows'],
            ['`(2, 3)`', '`(2, 1)`', '`(2, 3)`', 'the column is stretched across the 3 columns'],
            ['`(2, 1)`', '`(1, 3)`', '`(2, 3)`', 'both stretch: a column and a row make a full table'],
            ['`(4, 1, 3)`', '`(5, 1)`', '`(4, 5, 3)`', 'aligned right: `3` vs `1`, then `1` vs `5`, then `4` vs missing'],
            ['`(3, 4)`', '`(3,)`', 'error', 'aligned right, `4` vs `3` are different and neither is 1'],
          ],
          caption: 'Broadcasting examples. Compare dimensions right to left.',
        },
        {
          type: 'code',
          title: 'broadcasting.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

m = np.arange(6).reshape(2, 3)
row = np.array([10, 20, 30])
col = np.array([[100], [200]])
print(m + row)
print(m + col)
print(col + row)
a = np.zeros((3, 4))
try:
    a + np.zeros(3)
except ValueError as e:
    print(e)
print((a + np.zeros(3)[:, None]).shape)`,
          output: `[[10 21 32]
 [13 24 35]]
[[100 101 102]
 [203 204 205]]
[[110 120 130]
 [210 220 230]]
operands could not be broadcast together with shapes (3,4) (3,) 
(3, 4)`,
          annotations: [
            { lines: 6, text: 'The row `[10 20 30]` is added to **each** row of `m`.' },
            { lines: 7, text: 'The column `(2, 1)` is added across every column: its first value goes to row 0, its second to row 1.' },
            { lines: 8, text: 'A column `(2, 1)` plus a row `(3,)` stretches both and produces a full `(2, 3)` table, like an addition table.' },
            { lines: '9-13', text: 'Shapes `(3, 4)` and `(3,)` do not broadcast: the right-most dimensions are 4 and 3. NumPy refuses and tells you both shapes, which is the first thing to read in a shape error.' },
            { lines: 14, text: 'The fix: give the vector a trailing axis of length 1. `[:, None]` (or `np.newaxis`, or `.reshape(3, 1)`) turns shape `(3,)` into `(3, 1)`, which broadcasts across the columns.' },
          ],
        },
        {
          type: 'callout',
          variant: 'analogy',
          title: 'Stretching, not copying',
          text: 'Imagine adding the same price list to every row of a spreadsheet. You do not retype the list for every row; you just say "apply it to each row". Broadcasting is that instruction. A `(1000000, 3)` array plus a `(3,)` vector never builds a million copies of the vector, which is why it is both fast and memory-efficient.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which of these pairs of shapes can be combined by broadcasting?',
      options: [
        { text: '`(5, 1)` and `(1, 4)`', correct: true, why: 'Right to left: 1 vs 4 (stretch the 1) and 5 vs 1 (stretch the 1). The result has shape `(5, 4)`.' },
        { text: '`(5, 3)` and `(5,)`', why: 'The right-most dimensions are 3 and 5: different, and neither is 1, so this fails. A `(5, 1)` column would have worked.' },
        { text: '`(2, 3)` and `(3, 2)`', why: '3 vs 2 on the right: incompatible. Equal total size does not matter, only the dimensions.' },
        { text: '`(4,)` and `(3,)`', why: 'The only dimensions are 4 and 3: different and neither is 1.' },
      ],
      explanation: 'Compare shapes from the right. Each pair must be equal or contain a 1. The `(5, 1)` and `(1, 4)` pair stretches both arrays and makes a full `(5, 4)` table.',
    },
    {
      kind: 'truefalse',
      prompt: 'When NumPy broadcasts a `(3,)` vector over a `(1000, 3)` array, it first makes 1000 physical copies of the vector in memory.',
      answer: false,
      explanation: 'False. The stretch is virtual: NumPy reuses the same 3 numbers for every row without copying them. That is what makes broadcasting memory-efficient.',
    },
    {
      kind: 'concept',
      title: 'Broadcasting in practice: normalizing and softmax',
      blocks: [
        {
          type: 'p',
          text: 'Two of the most common ML data steps are pure broadcasting. **Standardizing** features: subtract each column’s mean and divide by its standard deviation, so every feature has mean 0 and spread 1. A `(n, d)` data matrix minus a `(d,)` vector of means broadcasts perfectly.',
        },
        {
          type: 'code',
          title: 'standardize.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

data = np.array([[1.0, 200.0], [2.0, 400.0], [3.0, 600.0]])
mean = data.mean(axis=0)
std = data.std(axis=0)
z = (data - mean) / std
print(mean, std)
print(np.round(z, 3))
print(bool(np.allclose(z.mean(axis=0), 0)), np.round(z.std(axis=0), 3))`,
          output: `[  2. 400.] [  0.81649658 163.29931619]
[[-1.225 -1.225]
 [ 0.     0.   ]
 [ 1.225  1.225]]
True [1. 1.]`,
          annotations: [
            { lines: 3, text: 'Two features on very different scales: values around 2 and values around 400.' },
            { lines: '4-5', text: '`axis=0` reduces down the rows, giving **one mean and one standard deviation per column**, shape `(2,)`.' },
            { lines: 6, text: 'The key line. `data - mean` broadcasts the `(2,)` vector across all 3 rows; the division does the same. No loop over rows or columns.' },
            { lines: '7-8', text: 'After standardizing, both columns are identical (-1.225, 0, 1.225) even though the raw data differed 200-fold.' },
            { lines: 9, text: 'Each column now has mean 0 (checked with `allclose`, since floating-point sums are never *exactly* 0) and standard deviation 1.' },
          ],
        },
        {
          type: 'p',
          text: 'The second pattern is **row-wise** work on a batch, such as softmax over the scores of many examples at once. Here a reduction must keep its axis so the result still broadcasts. `keepdims=True` leaves the reduced axis in place with length 1: a `(2, 3)` array reduced over `axis=1` becomes `(2, 1)` instead of `(2,)`, a column that broadcasts against every row.',
        },
        {
          type: 'code',
          title: 'batch_softmax.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

logits = np.array([[1.0, 2.0, 3.0], [1.0, 1.0, 1.0]])
e = np.exp(logits - logits.max(axis=1, keepdims=True))
probs = e / e.sum(axis=1, keepdims=True)
print(np.round(probs, 3))
print(probs.sum(axis=1), logits.max(axis=1).shape, logits.max(axis=1, keepdims=True).shape)`,
          output: `[[0.09  0.245 0.665]
 [0.333 0.333 0.333]]
[1. 1.] (2,) (2, 1)`,
          annotations: [
            { lines: 3, text: 'A batch of two examples with three class scores each.' },
            { lines: 4, text: 'Subtract each row’s own maximum (the numerical-stability trick from the probability lesson). `keepdims=True` makes the maxima shape `(2, 1)`, so the subtraction broadcasts across the three columns of each row.' },
            { lines: 5, text: 'Divide each row by its own total, again with `keepdims=True`. Every row now sums to 1.' },
            { lines: 7, text: 'The shapes tell the story. Without `keepdims` the maximum has shape `(2,)`, which would try to align with the *column* axis and fail for a `(2, 3)` batch (or, worse, silently do the wrong thing for a square one).' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The silent broadcasting bug',
          text: 'Broadcasting can hide mistakes. If you subtract a `(n,)` vector from an `(n, n)` square matrix, NumPy happily broadcasts along the *last* axis and gives a result of the right shape, but with the wrong meaning (rows and columns swapped). Wrong-axis reductions behave the same way. Defend yourself by using `keepdims=True` or explicit `[:, None]`, checking shapes, and testing on a rectangular example where an axis mix-up would crash.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Game-style example: many positions at once',
      blocks: [
        {
          type: 'p',
          text: 'Broadcasting also removes the inner loops from game and simulation code. Below, three entities move by a shared velocity for half a second, and we measure each one’s distance to the player. Then a trick for *all pairs*: insert a new axis in two different places, `pts[:, None, :]` has shape `(n, 1, d)` and `pts[None, :, :]` has shape `(1, n, d)`, and subtracting them broadcasts to every pair, shape `(n, n, d)`.',
        },
        {
          type: 'code',
          title: 'distances.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

pos = np.array([[0.0, 0.0], [5.0, 5.0], [-3.0, 4.0]])
vel = np.array([1.0, -0.5])
pos = pos + vel * 0.5
player = np.array([0.0, 0.0])
dist = np.sqrt(((pos - player) ** 2).sum(axis=1))
print(pos)
print(np.round(dist, 3), dist.argmin())
pts = np.array([[0.0, 0.0], [3.0, 4.0], [6.0, 8.0]])
diff = pts[:, None, :] - pts[None, :, :]
print(diff.shape)
print(np.sqrt((diff ** 2).sum(axis=-1)))`,
          output: `[[ 0.5  -0.25]
 [ 5.5   4.75]
 [-2.5   3.75]]
[0.559 7.267 4.507] 0
(3, 3, 2)
[[ 0.  5. 10.]
 [ 5.  0.  5.]
 [10.  5.  0.]]`,
          annotations: [
            { lines: 5, text: 'The velocity `(2,)` is scaled by the time step and added to **every** position `(3, 2)` at once. One line moves a whole particle system (a thousand or a million entities cost the same line).' },
            { lines: 7, text: 'Distance to the player: subtract the player position (broadcast), square, sum over the coordinates (`axis=1`) and take the square root, giving one distance per entity.' },
            { lines: 9, text: '`argmin` returns the index of the nearest entity (entity 0), the kind of query an AI uses to choose a target.' },
            { lines: '10-12', text: 'All-pairs differences: `(3, 1, 2) - (1, 3, 2)` broadcasts to `(3, 3, 2)`, the vector from every point to every other point.' },
            { lines: 13, text: 'Summing over the last axis (`axis=-1` means "the last one") and taking the root gives the full 3 × 3 table of distances: zero on the diagonal, symmetric, and 5, 5 and 10 for the three points on a line.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Memory: all-pairs is quadratic',
          text: 'The `(n, n, d)` intermediate array has `n² · d` numbers. For 10 000 points that is 200 million floats (1.6 GB in float64). For large `n`, compute distances in chunks, use the identity `|a − b|² = |a|² + |b|² − 2 a·b` (which needs only an `(n, n)` matrix, via a matrix multiplication), or use a spatial index such as a k-d tree (`scipy.spatial.cKDTree`).',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Turn the vector `v` of shape `(3,)` into a column of shape `(3, 1)` so it broadcasts across the columns of a `(3, 4)` array.',
      template: `col = v[:, ___]
total = grid + col`,
      templateIsCode: true,
      blanks: [{ answers: ['None', 'np.newaxis'] }],
      wordBank: ['None', '0', '1', ':'],
      explanation: 'Indexing with `None` (also spelled `np.newaxis`) inserts a new axis of length 1 at that position, so `v[:, None]` has shape `(3, 1)`. It then stretches across the 4 columns of `grid`.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `import numpy as np

a = np.ones((4, 1, 3))
b = np.ones((5, 1))
print((a + b).shape)`,
      answer: '(4, 5, 3)',
      hint: 'Align the shapes on the right: `(4, 1, 3)` and `( , 5, 1)`. Compare 3 with 1, then 1 with 5, then 4 with nothing.',
      explanation: 'From the right: 3 vs 1 gives 3; 1 vs 5 gives 5; 4 vs (missing) gives 4. The result shape is `(4, 5, 3)`.',
    },
    {
      kind: 'error',
      prompt: 'This batch softmax crashes with a broadcasting error. Tap the faulty line.',
      lines: [
        'import numpy as np',
        'logits = np.array([[1.0, 2.0, 3.0], [1.0, 1.0, 1.0]])',
        'e = np.exp(logits - logits.max(axis=1))',
        'probs = e / e.sum(axis=1, keepdims=True)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`logits.max(axis=1)` has shape `(2,)`, which does not broadcast against `(2, 3)` (3 vs 2 on the right). It needs `keepdims=True` to become `(2, 1)`, exactly as the next line does.',
    },
    {
      kind: 'numeric',
      prompt: 'Arrays of shape `(8, 1, 6, 1)` and `(7, 1, 5)` are added. How many elements does the result have?',
      answer: '1680',
      hint: 'First find the result shape (align on the right), then multiply its dimensions.',
      explanation: 'Right to left: 1 vs 5 gives 5; 6 vs 1 gives 6; 1 vs 7 gives 7; 8 vs (missing) gives 8. The shape is `(8, 7, 6, 5)` and 8 × 7 × 6 × 5 = 1680.',
      label: 'Elements:',
    },
    {
      kind: 'code',
      prompt: 'Write `standardize(a)` for a 2-D array: subtract each **column’s** mean and divide by its standard deviation (population, the NumPy default). If a column has standard deviation 0, leave it centred at 0 rather than dividing by zero. Return a new float array and do not modify the input.',
      starter: `import numpy as np

def standardize(a):
    ...
`,
      solution: `import numpy as np


def standardize(a):
    a = np.asarray(a, dtype=float)
    mean = a.mean(axis=0)
    std = a.std(axis=0)
    std = np.where(std == 0, 1.0, std)
    return (a - mean) / std
`,
      tests: `import numpy as np

data = np.array([[1.0, 200.0], [2.0, 400.0], [3.0, 600.0]])
z = standardize(data)
assert z.shape == (3, 2)
assert np.allclose(z.mean(axis=0), 0)
assert np.allclose(z.std(axis=0), 1)
assert np.allclose(z[:, 0], z[:, 1])
assert data.tolist() == [[1.0, 200.0], [2.0, 400.0], [3.0, 600.0]]

const = standardize(np.array([[5.0, 1.0], [5.0, 3.0]]))
assert np.allclose(const[:, 0], 0)
assert np.isfinite(const).all()
assert np.allclose(const[:, 1], [-1.0, 1.0])

ints = standardize([[1, 10], [3, 30]])
assert ints.dtype.kind == 'f'
assert np.allclose(ints, [[-1.0, -1.0], [1.0, 1.0]])
one = standardize(np.array([[4.0, 7.0]]))
assert np.allclose(one, 0)`,
      packages: ['numpy'],
      checks: ['Every column ends up with mean 0 and standard deviation 1', 'A constant column becomes all zeros instead of nan', 'Does not modify the input and accepts integer lists'],
      hint: 'Compute `mean = a.mean(axis=0)` and `std = a.std(axis=0)`. Replace zero entries of `std` by 1 with `np.where(std == 0, 1.0, std)`, then return `(a - mean) / std`.',
      explanation: 'Broadcasting does the per-column work, and the `np.where` guard avoids a division by zero (which would give `nan` and silently poison training). Real pipelines compute the mean and standard deviation on the *training* data only and reuse them for new data.',
    },
    {
      kind: 'code',
      prompt: 'Write `nearest_enemy(player, enemies)`: `player` is one position (a list or 1-D array of coordinates) and `enemies` is a 2-D array with one position per row. Return the **index** of the enemy closest to the player (Euclidean distance) as an `int`. Use broadcasting, not a loop.',
      starter: `import numpy as np

def nearest_enemy(player, enemies):
    ...
`,
      solution: `import numpy as np


def nearest_enemy(player, enemies):
    player = np.asarray(player, dtype=float)
    enemies = np.asarray(enemies, dtype=float)
    dist = np.sqrt(((enemies - player) ** 2).sum(axis=1))
    return int(dist.argmin())
`,
      tests: `import numpy as np

assert nearest_enemy([0, 0], [[5, 5], [1, 1], [-3, 0]]) == 1
assert nearest_enemy(np.array([10.0, 10.0]), np.array([[0.0, 0.0], [9.0, 12.0], [20.0, 20.0]])) == 1
assert nearest_enemy([0, 0, 0], [[3, 4, 12], [1, 2, 2], [6, 6, 6]]) == 1
assert nearest_enemy([1, 1], [[100, 100]]) == 0
assert nearest_enemy([-5, 0], [[0, 0], [-4, 0], [-9, 0]]) == 1
assert isinstance(nearest_enemy([0, 0], [[1, 0], [2, 0]]), int)

player = np.array([2.0, 3.0])
foes = np.array([[2.0, 4.0], [0.0, 0.0]])
nearest_enemy(player, foes)
assert player.tolist() == [2.0, 3.0] and foes.tolist() == [[2.0, 4.0], [0.0, 0.0]]`,
      packages: ['numpy'],
      checks: ['Subtracts the player position from every enemy at once using broadcasting', 'Returns the position of the smallest distance as a plain `int`', 'Works in 2-D and 3-D and does not modify its inputs'],
      hint: 'Subtract: `enemies - player` broadcasts the player over every row. Square, sum over `axis=1`, take the square root and use `argmin`. Convert the result with `int(...)`.',
      explanation: 'One broadcast subtraction replaces a loop over enemies. (Because the square root is increasing, you could skip it and compare squared distances: same answer, slightly faster. Game code does this all the time.)',
    },
    {
      kind: 'code',
      prompt: 'Write `batch_softmax(logits)` for a 2-D array with one row of scores per example. Return the array of row-wise softmax probabilities (each row sums to 1). Subtract each row’s maximum for numerical stability, using `keepdims=True`.',
      starter: `import numpy as np

def batch_softmax(logits):
    ...
`,
      solution: `import numpy as np


def batch_softmax(logits):
    logits = np.asarray(logits, dtype=float)
    e = np.exp(logits - logits.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)
`,
      tests: `import numpy as np

p = batch_softmax(np.array([[2.0, 1.0, 0.1], [1.0, 1.0, 1.0]]))
assert p.shape == (2, 3)
assert np.allclose(p.sum(axis=1), 1)
assert np.allclose(p[0], [0.6590011388859679, 0.2424329707047139, 0.09856589040931818])
assert np.allclose(p[1], 1 / 3)

big = batch_softmax([[1000.0, 1000.0], [-1000.0, 0.0]])
assert np.isfinite(big).all()
assert np.allclose(big, [[0.5, 0.5], [0.0, 1.0]])

shifted = batch_softmax([[1.0, 2.0, 3.0]])
assert np.allclose(shifted, batch_softmax([[101.0, 102.0, 103.0]]))
assert np.allclose(batch_softmax([[7.0]]), [[1.0]])
assert np.allclose(batch_softmax(np.zeros((4, 5))), 0.2)

x = np.array([[1.0, 2.0], [3.0, 4.0]])
batch_softmax(x)
assert x.tolist() == [[1.0, 2.0], [3.0, 4.0]]`,
      packages: ['numpy'],
      checks: ['Every row sums to 1 and large scores do not overflow', 'Uses `keepdims=True` so the row maxima and totals broadcast correctly', 'Does not modify its input'],
      hint: 'Mirror the pure-Python version: `top = logits.max(axis=1, keepdims=True)`, `e = np.exp(logits - top)`, then divide by `e.sum(axis=1, keepdims=True)`.',
      explanation: 'This is the real softmax of a classifier, processing the whole batch in three array operations. It is the function behind `torch.softmax(x, dim=1)`: the `dim` argument is the same idea as `axis`.',
    },
  ],
  takeaways: [
    '**Vectorize**: replace element-wise Python loops with ufuncs (`np.exp`, `np.maximum`, `+`, `*`), `np.where` and reductions. Code gets shorter and typically 5–100× faster, and it is the same style PyTorch uses on GPUs.',
    '**Broadcasting rule**: compare shapes right to left; dimensions must be equal or one of them 1, and missing leading dimensions count as 1. The stretching is virtual (no copies).',
    'Fix shape mismatches with `[:, None]` / `np.newaxis` / `reshape`, and keep reduced axes with `keepdims=True` so results broadcast back against the original.',
    '**Standardization** (`(a - a.mean(axis=0)) / a.std(axis=0)`) and **batch softmax** are the two patterns to know by heart; watch out for zero standard deviations.',
    'Broadcasting bugs are often silent. Check `.shape` at every step, and test with non-square data so a wrong axis crashes instead of quietly giving wrong numbers.',
  ],
  reading: [
    { title: 'NumPy: Broadcasting (official guide)', url: 'https://numpy.org/doc/stable/user/basics.broadcasting.html', source: 'docs', note: 'The official rules with diagrams and examples.' },
    { title: 'NumPy for MATLAB users / Python-loop conversion tips', url: 'https://numpy.org/doc/stable/user/numpy-for-matlab-users.html', source: 'docs', note: 'Useful cross-reference if you have seen array languages before.' },
    { title: 'Look Ma, No For-Loops: Array Programming With NumPy (Real Python)', url: 'https://realpython.com/numpy-array-programming/', source: 'tutorial', note: 'A worked tour of vectorization and broadcasting with real examples.' },
    { title: 'From Python to NumPy — Code vectorization', url: 'https://www.labri.fr/perso/nrougier/from-python-to-numpy/#code-vectorization', source: 'book', note: 'Deeper techniques for removing loops from real code.' },
  ],
};
