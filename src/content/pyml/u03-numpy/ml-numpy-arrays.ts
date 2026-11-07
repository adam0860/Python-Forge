import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-numpy-arrays',
  title: 'NumPy Arrays',
  summary: 'NumPy is the foundation under every Python ML library. Learn to create arrays, read their shape and dtype, slice and mask them, understand views versus copies, and reduce along axes.',
  minutes: 22,
  objectives: [
    'Create arrays with np.array, zeros, arange, linspace and eye and inspect shape, ndim, size and dtype',
    'Index and slice arrays with integers, slices, boolean masks and index lists',
    'Predict when an operation returns a view that shares memory and when it returns a copy',
    'Reduce arrays along an axis with sum, mean, max and argmax, and reshape them',
    'Choose a dtype deliberately and recognize overflow and precision pitfalls',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Why NumPy, and your first arrays',
      blocks: [
        {
          type: 'p',
          text: 'A Python list can hold anything, which makes it flexible and slow: every number is a separate object and every loop runs in the interpreter. The **[[ndarray]]** (n-dimensional array) trades flexibility for speed. All elements share one type, the data sits side by side in one block of memory, and an operation like `a * 2` runs as a single loop in compiled C. Arrays are often tens to hundreds of times faster than the equivalent list code, and they use far less memory. PyTorch tensors, pandas columns and scikit-learn inputs are all built on the same idea.',
        },
        {
          type: 'p',
          text: 'The most important properties of an array are its **shape** (the length along each dimension), `ndim` (how many dimensions), `size` (total number of elements) and its **[[dtype]]** (the type of every element). Here are the everyday ways to make arrays:',
        },
        {
          type: 'code',
          title: 'creating_arrays.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])
print(a.shape, a.ndim, a.size)
f = np.array([1, 2, 3], dtype=np.float32)
print(f.dtype, f * 0.5)
print(np.zeros((2, 3)))
print(np.arange(0, 10, 3), np.linspace(0, 1, 5))
print(np.eye(3, dtype=np.int8))`,
          output: `(2, 3) 2 6
float32 [0.5 1.  1.5]
[[0. 0. 0.]
 [0. 0. 0.]]
[0 3 6 9] [0.   0.25 0.5  0.75 1.  ]
[[1 0 0]
 [0 1 0]
 [0 0 1]]`,
          annotations: [
            { lines: 1, text: 'By universal convention NumPy is imported as `np`.' },
            { lines: '3-4', text: '`np.array` converts a (nested) list. Two rows of three columns: shape `(2, 3)`, 2 dimensions, 6 elements. Note that the shape is a **tuple**.' },
            { lines: '5-6', text: 'The `dtype` argument sets the element type explicitly. `float32` (32-bit floats) is the usual choice for deep learning. `f * 0.5` multiplies *every* element at once: no loop.' },
            { lines: 7, text: '`np.zeros(shape)` makes an array of zeros; `np.ones` and `np.full` work the same way. Pass the shape as a tuple.' },
            { lines: 8, text: '`np.arange` is like `range` (start, stop, step; the stop is excluded) but returns an array. `np.linspace(0, 1, 5)` gives 5 evenly spaced points *including* both ends, handy for plotting and sweeping a parameter.' },
            { lines: 9, text: '`np.eye(n)` is the identity matrix: ones on the diagonal.' },
          ],
        },
        {
          type: 'table',
          headers: ['Function', 'Creates', 'Typical use'],
          rows: [
            ['`np.array(list)`', 'an array from existing data', 'converting a list of rows or a column of numbers'],
            ['`np.zeros(shape)` / `np.ones(shape)`', 'filled with 0 or 1', 'accumulators, masks, initial buffers'],
            ['`np.full(shape, v)`', 'filled with the value `v`', 'a constant bias or a fill value like `-1`'],
            ['`np.arange(a, b, step)`', 'evenly stepped integers or floats', 'indices, counters, quick test data'],
            ['`np.linspace(a, b, n)`', '`n` evenly spaced values from `a` to `b`', 'plot x-axes, parameter sweeps'],
            ['`np.eye(n)`', 'the identity matrix', 'linear algebra, one-hot encodings'],
            ['`np.random.default_rng(seed).random(shape)`', 'random numbers', 'weights, noise, shuffling (covered in the third lesson)'],
          ],
          caption: 'The array-creation functions you will use constantly.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Coming from C++',
          text: 'An ndarray is closest to a `std::vector<float>` plus a shape: contiguous typed memory with the dimensions stored alongside. Unlike a C++ array, one line of NumPy loops over every element in compiled code (`a * 2`), the way an `std::transform` would, and the library can reinterpret the same memory with a different shape without copying it (like a `std::span`). Game programmers: the position arrays of ten thousand particles are exactly this kind of data.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'The default integer dtype is platform dependent',
          text: 'Floats default to `float64`. Integers default to the platform’s native integer: usually 64-bit, but 32-bit on some platforms (older NumPy on Windows, WebAssembly). When the exact size matters (saving files, comparing with PyTorch, avoiding overflow) always pass `dtype=` explicitly.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why is `a * 2` on a million-element NumPy array so much faster than `[x * 2 for x in my_list]` on a list?',
      options: [
        { text: 'The array stores same-typed numbers contiguously and the loop runs in compiled C instead of the Python interpreter', correct: true, why: 'There is no per-element Python object, no per-element type check and no interpreter loop: just a tight compiled loop over packed memory.' },
        { text: 'NumPy uses the GPU automatically', why: 'NumPy runs on the CPU only. GPU arrays need libraries such as PyTorch, CuPy or JAX.' },
        { text: 'NumPy skips the multiplication for repeated values', why: 'Every element is multiplied; the speed comes from how cheaply each multiplication is dispatched.' },
        { text: 'Arrays are stored in a compressed format that is quicker to read', why: 'Arrays are *not* compressed; they are plain packed numbers, which is why they are fast to process.' },
      ],
      explanation: 'Speed comes from uniform typed data in contiguous memory plus a loop written in C. That is why ML code avoids Python-level loops over elements and expresses everything as whole-array operations (the next lesson).',
    },
    {
      kind: 'concept',
      title: 'Indexing, slicing and masks',
      blocks: [
        {
          type: 'p',
          text: 'Indexing a 2-D array takes one index per dimension, separated by commas: `m[row, col]`. Each position can be an integer, a **slice** `start:stop:step` (the stop is excluded, as in lists) or a bare `:` meaning "everything along this axis". Two more powerful ways to select elements are a **[[boolean-mask]]**, an array of `True`/`False` built from a comparison, and **[[fancy-indexing]]**, a list of integer positions.',
        },
        {
          type: 'code',
          title: 'indexing.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

m = np.arange(12).reshape(3, 4)
print(m)
print(m[1, 2], m[0], m[:, 1])
print(m[1:, :2])
print(m[m % 2 == 0])
print(m[[2, 0]])`,
          output: `[[ 0  1  2  3]
 [ 4  5  6  7]
 [ 8  9 10 11]]
6 [0 1 2 3] [1 5 9]
[[4 5]
 [8 9]]
[ 0  2  4  6  8 10]
[[ 8  9 10 11]
 [ 0  1  2  3]]`,
          annotations: [
            { lines: 3, text: '`np.arange(12)` is a flat array of 0 to 11 and `.reshape(3, 4)` lays it out as 3 rows by 4 columns, without copying the data.' },
            { lines: 5, text: '`m[1, 2]` is row 1, column 2: the value 6. `m[0]` is a whole row. `m[:, 1]` means "all rows, column 1": the second column, `[1 5 9]`.' },
            { lines: 6, text: 'Slices work on each axis: rows 1 onward, columns 0 and 1. The result is a 2 × 2 sub-matrix.' },
            { lines: 7, text: 'A **boolean mask**: `m % 2 == 0` is a 3 × 4 array of `True`/`False`, and indexing with it keeps only the elements where it is `True`, flattened into a 1-D array.' },
            { lines: 8, text: '**Fancy indexing**: a list of row numbers picks those rows in that order (here row 2, then row 0).' },
          ],
        },
        {
          type: 'p',
          text: 'Masks are how data cleaning and game logic read naturally in NumPy: `health[health <= 0] = 0`, `scores[scores > threshold]`, `(enemy_dist < 5).sum()` to count the enemies that are close. You can also assign through a mask or slice: `a[a < 0] = 0` clips every negative value in place.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Combine conditions with & and |, not and/or',
          text: 'Python’s `and` / `or` demand a single True/False and fail on arrays (`ValueError: truth value of an array is ambiguous`). Use `&` and `|` for element-wise logic and parenthesize each comparison: `(a > 0) & (a < 10)`. Negate a mask with `~`.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Views versus copies',
      blocks: [
        {
          type: 'p',
          text: 'To stay fast, NumPy avoids copying data when it can. A basic **slice** (such as `a[1:4]`) returns a **[[array-view]]**: a new array object looking at the *same memory*. Writing through the view changes the original. By contrast, a boolean mask or an integer list (fancy indexing) always produces a **copy**. This is the number-one source of confusing NumPy bugs, so test your understanding on this example:',
        },
        {
          type: 'code',
          title: 'views_and_copies.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

a = np.arange(6)
view = a[1:4]
view[0] = 99
print(a)
copy = a[1:4].copy()
copy[0] = -1
print(a, copy)
picked = a[a > 3]
picked[0] = 0
print(a)`,
          output: `[ 0 99  2  3  4  5]
[ 0 99  2  3  4  5] [-1  2  3]
[ 0 99  2  3  4  5]`,
          annotations: [
            { lines: '4-6', text: '`a[1:4]` is a **view**. Setting `view[0] = 99` writes into the memory that `a` also owns, so `a` changed too: its element 1 is now 99.' },
            { lines: '7-9', text: 'An explicit `.copy()` owns separate memory. Changing `copy` leaves `a` alone.' },
            { lines: '10-12', text: 'A boolean mask returns a **copy**, so overwriting `picked[0]` does not affect `a`. (Assigning *through* the mask, `a[a > 3] = 0`, would change `a`, since that writes to the array itself.)' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Views are a feature and a trap',
          text: 'Views make slicing free, which matters for large arrays, but they cause *aliasing* bugs: you "just modify the batch" and corrupt your dataset. When you intend to change a slice independently, call `.copy()`. `np.shares_memory(a, b)` tells you whether two arrays overlap. PyTorch has the same behavior: slices of a tensor share storage.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Changing an element of a basic slice such as `view = a[1:4]` leaves the original array `a` unchanged.',
      answer: false,
      explanation: 'False. A basic slice is a **view** onto the same memory, so writing through it changes the original. Only masks, integer-list indexing and an explicit `.copy()` give independent data.',
    },
    {
      kind: 'concept',
      title: 'Axes, reductions and reshaping',
      blocks: [
        {
          type: 'p',
          text: 'Functions such as `sum`, `mean`, `max`, `min` and `argmax` **reduce** an array. With no argument they collapse everything to one number. With `axis=n` they collapse **[[axis]]** `n` and keep the others. The easiest way to remember it: `axis=0` goes *down* the rows (giving one result per column), and `axis=1` goes *across* the columns (giving one result per row). The same pattern holds for 3-D data, e.g. averaging a batch of images over `axis=0`.',
        },
        {
          type: 'code',
          title: 'axes_and_reshape.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

scores = np.array([[90, 70, 80], [60, 85, 95]])
print(scores.sum(), scores.sum(axis=0), scores.sum(axis=1))
print(scores.mean(axis=0), scores.max(axis=1), scores.argmax(axis=1))
print(scores.reshape(-1).shape, scores.reshape(3, 2).shape, scores.T.shape)`,
          output: `480 [150 155 175] [240 240]
[75.  77.5 87.5] [90 95] [0 2]
(6,) (3, 2) (3, 2)`,
          annotations: [
            { lines: 3, text: 'Two students (rows) with three test scores (columns).' },
            { lines: 4, text: 'No axis: the grand total, 480. `axis=0` collapses the rows and gives **one total per test** (column): `[150 155 175]`. `axis=1` collapses the columns and gives **one total per student**: `[240 240]`.' },
            { lines: 5, text: 'The average of each test; the best score of each student; and `argmax` gives the **position** of each student’s best score (column 0 for the first student, column 2 for the second). `argmax` is how you turn a vector of class scores into a predicted class.' },
            { lines: 6, text: '`reshape` re-labels the same data with a new shape. `-1` means "work this length out for me", so `reshape(-1)` flattens to 1-D. `.T` is the transpose, swapping the axes: `(2, 3)` becomes `(3, 2)`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Shapes are the language of ML code',
          text: 'Most bugs in ML code are shape bugs: a batch dimension in the wrong place, an axis summed that should not have been. Get in the habit of printing `.shape` after every step, and write the expected shape in a comment (`# (batch, features)`). Reduction along the wrong axis is silent: no error, just wrong numbers. In PyTorch the same idea appears as `dim=` instead of `axis=`.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'For `scores` with students in rows and tests in columns, fill in the axis for each result.',
      template: `per_test_total = scores.sum(axis=___)
per_student_total = scores.sum(axis=___)`,
      templateIsCode: true,
      blanks: [{ answers: ['0'] }, { answers: ['1'] }],
      wordBank: ['0', '1', '2', '-1'],
      explanation: '`axis=0` collapses the rows, leaving one value per column (per test). `axis=1` collapses the columns, leaving one value per row (per student).',
    },
    {
      kind: 'concept',
      title: 'dtypes: precision, memory and overflow',
      blocks: [
        {
          type: 'p',
          text: 'Every array has one **dtype**, and choosing it is a real engineering decision. `float64` is the Python default (precise, 8 bytes per element). Deep learning typically uses `float32` (4 bytes, half the memory and faster on GPUs) or even 16-bit floats. Images are often stored as `uint8` (0 to 255). Smaller types save memory and bandwidth, but have less precision and a narrower range, and **integer arrays overflow silently**.',
        },
        {
          type: 'code',
          title: 'dtypes.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

x = np.arange(1000, dtype=np.float64)
print(x.nbytes, x.astype(np.float32).nbytes, x.astype(np.int8).nbytes)
print(float(np.float32(0.1)), 0.1)
big = np.array([100, 120], dtype=np.int8)
print(big + big)`,
          output: `8000 4000 1000
0.10000000149011612 0.1
[-56 -16]`,
          annotations: [
            { lines: 4, text: '`nbytes` reports the memory used: 8 bytes per `float64` element, 4 per `float32`, 1 per `int8`. Converting with `.astype` makes a copy in the new type.' },
            { lines: 5, text: '`float32` keeps only about 7 significant digits: 0.1 is stored as 0.10000000149…, which is why exact `==` comparisons of floats are fragile.' },
            { lines: '6-7', text: '`int8` holds only -128 to 127. 100 + 100 = 200 does not fit, so it **wraps around** to -56, and no error or warning is raised for array arithmetic. The same wraparound has caused real bugs with `uint8` images (200 + 100 becomes 44, not 255).' },
          ],
        },
        {
          type: 'table',
          headers: ['dtype', 'Bytes', 'Range or precision', 'Typical use'],
          rows: [
            ['`float64`', '8', '≈ 15–16 digits', 'scientific code; NumPy default for floats'],
            ['`float32`', '4', '≈ 7 digits', 'deep-learning weights and activations'],
            ['`float16` / `bfloat16`', '2', '≈ 3 digits (bfloat16 keeps float32’s range)', 'mixed-precision training on GPUs'],
            ['`int64` / `int32`', '8 / 4', 'whole numbers up to ≈ 9×10¹⁸ / 2×10⁹', 'indices, counts, class labels'],
            ['`uint8`', '1', '0 to 255', 'image pixels'],
            ['`bool`', '1', '`True` / `False`', 'masks'],
          ],
          caption: 'The dtypes you will meet in ML. Libraries such as PyTorch use the same names.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Convert images before doing arithmetic',
          text: 'The standard pattern is `img = pixels.astype(np.float32) / 255.0`: convert **first** (so nothing wraps), then scale to the range 0 to 1 that networks expect. Doing the arithmetic in `uint8` is the classic way to silently ruin an image.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `import numpy as np

a = np.arange(10)
b = a[2:8:2]
b[0] = 100
print(a[2], b.sum())`,
      answer: '100 110',
      hint: '`a[2:8:2]` takes elements 2, 4 and 6, and it is a slice, so what kind of object is `b`?',
      explanation: '`b` is a **view** of elements 2, 4 and 6 of `a`. Setting `b[0] = 100` writes into `a[2]`, so `a[2]` is 100. Then `b` is `[100, 4, 6]`, which sums to 110.',
    },
    {
      kind: 'error',
      prompt: 'The goal is **one total per column**, but this program prints the wrong numbers. Tap the faulty line.',
      lines: [
        'import numpy as np',
        'a = np.arange(6).reshape(2, 3)',
        'col_sums = a.sum(axis=1)   # one total per column',
        'print(col_sums)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`axis=1` collapses the columns and gives one total per **row** (`[3 12]`). One total per column needs `axis=0`, which gives `[3 5 7]`. Reducing along the wrong axis raises no error, so always check the shape of the result.',
    },
    {
      kind: 'numeric',
      prompt: 'How many elements does an array of shape `(4, 3, 2)` hold? (This is also its `size`.)',
      answer: '24',
      hint: 'Multiply the lengths of all the dimensions.',
      explanation: 'The size is the product of the shape: 4 × 3 × 2 = 24. It could be, say, a batch of 4 samples, each a 3 × 2 matrix.',
      label: 'Elements:',
    },
    {
      kind: 'code',
      prompt: 'Write `clip_negatives(a)`: return a **new** array like `a` in which every negative value is replaced by 0. The input array must not be modified.',
      starter: `import numpy as np

def clip_negatives(a):
    ...
`,
      solution: `import numpy as np


def clip_negatives(a):
    out = np.array(a, dtype=float)
    out[out < 0] = 0
    return out
`,
      tests: `import numpy as np

a = np.array([[-1.0, 2.0], [3.0, -4.0]])
out = clip_negatives(a)
assert out.tolist() == [[0.0, 2.0], [3.0, 0.0]]
assert a.tolist() == [[-1.0, 2.0], [3.0, -4.0]]
assert out is not a
assert not np.shares_memory(out, a)

assert clip_negatives(np.array([1.0, 2.0])).tolist() == [1.0, 2.0]
assert clip_negatives(np.array([-5.0, -0.5, 0.0])).tolist() == [0.0, 0.0, 0.0]
assert clip_negatives([3, -2, 7]).tolist() == [3.0, 0.0, 7.0]
assert clip_negatives(np.zeros((2, 2, 2))).shape == (2, 2, 2)`,
      packages: ['numpy'],
      checks: ['Negative values become 0 and everything else is kept', 'Works for any shape and returns a new array', 'Leaves the input array unchanged'],
      hint: 'Make a copy first (`np.array(a, dtype=float)` or `a.copy()`), then assign `0` through the mask `out < 0`.',
      explanation: 'Copy first, then assign through a boolean mask. This is the pattern behind ReLU, `max(0, x)`, the most common neural-network activation; NumPy’s `np.maximum(a, 0)` does the same in one call.',
    },
    {
      kind: 'code',
      prompt: 'Write `top_k(scores, k)` returning the **indices** of the `k` largest values in `scores` (a 1-D array or list), ordered from the largest value to the smallest. All values in the tests are distinct.',
      starter: `import numpy as np

def top_k(scores, k):
    ...
`,
      solution: `import numpy as np


def top_k(scores, k):
    scores = np.asarray(scores)
    order = np.argsort(scores)
    return order[::-1][:k]
`,
      tests: `import numpy as np

scores = np.array([0.1, 0.9, 0.3, 0.7])
assert [int(i) for i in top_k(scores, 2)] == [1, 3]
assert [int(i) for i in top_k(scores, 1)] == [1]
assert [int(i) for i in top_k(scores, 4)] == [1, 3, 2, 0]
assert [int(i) for i in top_k([5, 1, 9], 2)] == [2, 0]
assert [int(i) for i in top_k([2.5], 1)] == [0]
assert len(top_k(np.arange(10), 3)) == 3
assert scores.tolist() == [0.1, 0.9, 0.3, 0.7]`,
      packages: ['numpy'],
      checks: ['Returns positions, not values', 'Ordered from the largest value down', 'Accepts a list as well as an array and does not modify its input'],
      hint: '`np.argsort(x)` gives the indices that would sort `x` in ascending order. Reverse it with `[::-1]` and keep the first `k`.',
      explanation: '`argsort` returns the *order*, not the sorted values, which is what you need to find the best actions, the most likely classes or the nearest neighbours. (For a huge array `np.argpartition` finds the top `k` without sorting everything.)',
    },
    {
      kind: 'code',
      prompt: 'Write `one_hot_argmax(a)` for a 2-D array `a` of scores (one row per example). Return an integer array of the same shape that has a `1` in each row at the position of that row’s largest value and `0` elsewhere.',
      starter: `import numpy as np

def one_hot_argmax(a):
    ...
`,
      solution: `import numpy as np


def one_hot_argmax(a):
    a = np.asarray(a)
    out = np.zeros(a.shape, dtype=int)
    out[np.arange(a.shape[0]), a.argmax(axis=1)] = 1
    return out
`,
      tests: `import numpy as np

a = np.array([[0.1, 0.8, 0.1], [0.6, 0.3, 0.1], [0.2, 0.2, 0.9]])
out = one_hot_argmax(a)
assert out.tolist() == [[0, 1, 0], [1, 0, 0], [0, 0, 1]]
assert out.shape == a.shape
assert out.dtype.kind == 'i'
assert one_hot_argmax([[1, 5]]).tolist() == [[0, 1]]
assert one_hot_argmax(np.array([[3.0], [4.0]])).tolist() == [[1], [1]]
assert one_hot_argmax(np.eye(4)).tolist() == np.eye(4, dtype=int).tolist()
assert out.sum(axis=1).tolist() == [1, 1, 1]
assert a.tolist() == [[0.1, 0.8, 0.1], [0.6, 0.3, 0.1], [0.2, 0.2, 0.9]]`,
      packages: ['numpy'],
      checks: ['Each row has exactly one 1, at the position of the row’s maximum', 'Returns an integer array with the same shape as the input', 'Does not modify the input'],
      hint: 'Start from `np.zeros(a.shape, dtype=int)`. `a.argmax(axis=1)` gives the winning column of every row; set `out[row_numbers, those_columns] = 1` using `np.arange(number_of_rows)` for the rows.',
      explanation: 'Indexing with two integer arrays picks the pairs `(0, c0), (1, c1), …`, one element per row, and assigning through it sets them all at once. Turning class scores into one-hot predictions is a daily operation in classification code.',
    },
  ],
  takeaways: [
    'An **ndarray** holds same-typed numbers in contiguous memory, so whole-array operations run as compiled loops. Always know your array’s `shape` and `dtype`.',
    'Index with `a[row, col]`, slices `start:stop:step`, boolean masks (`a[a > 0]`) and index lists (`a[[2, 0]]`). Combine conditions with `&`, `|` and `~`, never `and` / `or`.',
    'Basic slices are **views** that share memory with the original; masks, index lists and `.copy()` give independent copies. Use `.copy()` when in doubt.',
    'Reductions take an `axis`: `axis=0` runs down the rows (one result per column) and `axis=1` across the columns (one per row). Check shapes after every step.',
    'Choose dtypes on purpose: `float32` for deep learning, `uint8` for pixels, and convert **before** arithmetic because integer arrays overflow silently.',
  ],
  reading: [
    { title: 'NumPy: the absolute basics for beginners', url: 'https://numpy.org/doc/stable/user/absolute_beginners.html', source: 'docs', note: 'The official gentle introduction to arrays, indexing and operations.' },
    { title: 'NumPy quickstart tutorial', url: 'https://numpy.org/doc/stable/user/quickstart.html', source: 'docs', note: 'A longer official tour including views and copies.' },
    { title: 'From Python to NumPy (Nicolas Rougier)', url: 'https://www.labri.fr/perso/nrougier/from-python-to-numpy/', source: 'book', note: 'A free book on thinking in vectorized, array-oriented code.' },
    { title: '100 NumPy exercises', url: 'https://github.com/rougier/numpy-100', source: 'repo', note: 'A progressive set of practice problems from easy to tricky.' },
  ],
};
