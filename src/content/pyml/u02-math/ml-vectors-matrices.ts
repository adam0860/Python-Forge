import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-vectors-matrices',
  title: 'Vectors, Matrices and Tensors',
  summary: 'The data structures of machine learning: vectors (lists of numbers), the dot product and cosine similarity, matrices and matrix multiplication as transformations, and tensors with their shapes — built in plain Python first, then previewed in NumPy.',
  minutes: 20,
  objectives: [
    'Add, scale and measure vectors, and connect them to positions in a game and features in a dataset',
    'Compute and interpret the dot product and cosine similarity',
    'Multiply a matrix by a vector and two matrices together, checking that the shapes fit',
    'Explain tensors as n-dimensional arrays and read their shapes (batch, height, width, channels)',
    'Recognize that a neural-network layer is a matrix-vector product, and spot shape mistakes',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Vectors: lists of numbers with geometry',
      blocks: [
        {
          type: 'p',
          text: 'A **[[vector]]** is an ordered list of numbers. If you have written a game you already use them: a character’s position `[x, y]`, a velocity `[dx, dy]`, an RGB colour `[r, g, b]`. Machine learning uses exactly the same object for *data*: one example is described by a vector of measurements called its **features** (a house: `[area, rooms, age]`; a game state: `[my_hp, enemy_hp, distance]`). Two operations make vectors useful: **adding** them (component by component) and **scaling** them (multiplying every component by a number). Together they give you movement: the new position is `position + dt · velocity`.',
        },
        {
          type: 'code',
          title: 'vector_basics.py',
          runnable: true,
          code: `import math

def add(a, b):
    return [x + y for x, y in zip(a, b)]

def scale(k, v):
    return [k * x for x in v]

def length(v):
    return math.sqrt(sum(x * x for x in v))

position = [3.0, 4.0]
velocity = [1.0, -2.0]
print(add(position, scale(0.5, velocity)))
print(length(position))
print(length([1, 2, 2]))`,
          output: `[3.5, 3.0]
5.0
3.0`,
          annotations: [
            { lines: '3-4', text: '**Addition** pairs up components with `zip` and adds each pair. Both vectors must have the same length.' },
            { lines: '6-7', text: '**Scaling**: multiply every component by the same number `k`.' },
            { lines: '9-10', text: 'The **length** (norm) of a vector is the square root of the sum of squares — Pythagoras in any number of dimensions.' },
            { lines: '12-13', text: 'A position and a velocity, exactly as in a game loop.' },
            { lines: 14, text: 'Move for half a time step: `position + 0.5 · velocity` gives `[3.5, 3.0]`.' },
            { lines: 15, text: 'The vector `[3, 4]` has length 5, the famous 3-4-5 right triangle.' },
            { lines: 16, text: 'Works in 3D (or 3000 dimensions) too: `sqrt(1 + 4 + 4) = 3`.' },
          ],
        },
        {
          type: 'math',
          tex: '\\lVert \\mathbf{v} \\rVert = \\sqrt{v_1^2 + v_2^2 + \\cdots + v_n^2}',
          caption: 'The norm (length) of a vector with n components.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why ML loves vectors',
          text: 'Once data is a vector, **geometry** becomes available: similar examples are *close* together, a model can be a *direction* in space, and "how wrong am I?" is a *distance*. Images, sentences, game states and sounds are all turned into vectors (often with hundreds of components) before a model sees them. Thinking in terms of points and directions in a high-dimensional space is the central mental model of machine learning.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'In C++ you would use `glm::vec3`, `Eigen::VectorXd` or `std::array<float, 3>`. Python’s built-in `list` can hold a vector but is slow and has no `+` for elementwise addition (`[1, 2] + [3, 4]` is concatenation: `[1, 2, 3, 4]`). That is why real ML code uses NumPy arrays, which you will meet in the next unit; here we build the operations by hand so you understand them.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A game character is at position `[3, 4]`. What is the length of that vector, i.e. its distance from the origin?',
      options: [
        { text: '5', correct: true, why: '√(3² + 4²) = √25 = 5, the 3-4-5 triangle.' },
        { text: '7', why: '7 is 3 + 4. Distance is not the sum of the components, it is the square root of the sum of their squares.' },
        { text: '12', why: '12 is 3 × 4, which has no geometric meaning here.' },
        { text: '25', why: '25 is the sum of squares, but you must still take the square root to get a length.' },
      ],
      explanation: 'The norm of a vector is `sqrt(sum of squares)`. For `[3, 4]` that is `sqrt(9 + 16) = 5`.',
    },
    {
      kind: 'concept',
      title: 'The dot product: measuring alignment',
      blocks: [
        {
          type: 'p',
          text: 'The most important operation in all of machine learning is the **[[dot-product]]**: multiply two equal-length vectors element by element and add everything up. `[1, 2, 3] · [4, 5, 6] = 1·4 + 2·5 + 3·6 = 32`. Its geometric meaning is the key: the dot product measures **how much two vectors point in the same direction**. It equals the product of their lengths times the cosine of the angle between them.',
        },
        {
          type: 'math',
          tex: '\\mathbf{a}\\cdot\\mathbf{b} = \\sum_{i} a_i b_i = \\lVert\\mathbf{a}\\rVert\\,\\lVert\\mathbf{b}\\rVert\\cos\\theta',
          caption: 'Two equivalent descriptions of the dot product: an arithmetic one and a geometric one.',
        },
        {
          type: 'graph',
          caption: 'Vector a (blue) is fixed. Move the slider to turn vector b (red) and watch the dot product: largest when they point the same way, zero at 90°, negative beyond.',
          x: [-4, 4],
          y: [-3, 3],
          equal: true,
          segments: [
            { from: [0, 0], to: [3, 0], color: 'blue', arrow: true, label: 'a' },
            { from: [0, 0], to: ['2cos(w)', '2sin(w)'], color: 'red', arrow: true, label: 'b' },
          ],
          sliders: [{ name: 'w', min: 0, max: 6.28, step: 0.05, value: 0.6, label: 'angle of b (radians)' }],
          readouts: [
            { label: 'a · b', expr: '6cos(w)', digits: 2 },
            { label: 'angle (degrees)', expr: 'w*180/pi', digits: 0 },
          ],
          height: 300,
        },
        {
          type: 'table',
          headers: ['Dot product', 'Angle between vectors', 'Meaning', 'Game example'],
          rows: [
            ['positive', 'less than 90°', 'roughly the same direction', 'the enemy is in front of you'],
            ['zero', 'exactly 90°', 'perpendicular, unrelated', 'the enemy is exactly to your side'],
            ['negative', 'more than 90°', 'roughly opposite directions', 'the enemy is behind you'],
          ],
          caption: 'Reading the sign of a dot product.',
        },
        {
          type: 'code',
          title: 'dot_product.py',
          runnable: true,
          code: `import math

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def norm(v):
    return math.sqrt(dot(v, v))

forward = [0, 1]
to_enemy = [1, 3]
behind = [0, -2]
side = [5, 0]
print(dot(forward, to_enemy), dot(forward, behind), dot(forward, side))

cos = dot(forward, to_enemy) / (norm(forward) * norm(to_enemy))
print(round(cos, 3), round(math.degrees(math.acos(cos)), 1))`,
          output: `3 -2 0
0.949 18.4`,
          annotations: [
            { lines: '3-4', text: 'The dot product in one line: multiply pairs, then `sum`.' },
            { lines: '6-7', text: 'A neat identity: the length of a vector is `sqrt(v · v)`, because the dot product of a vector with itself is the sum of its squares.' },
            { lines: '9-12', text: 'The player faces up `[0, 1]`. Three other vectors: an enemy up and to the right, one straight behind, one straight to the side.' },
            { lines: 13, text: 'Positive (3) for the enemy in front, negative (-2) for the one behind, and exactly 0 for the one at the side. This is how many games decide "is the target in my field of view?".' },
            { lines: '15-16', text: 'Dividing by both lengths removes the effect of size and leaves only `cos θ` = 0.949, which is an angle of about 18.4°.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Where the dot product lives in ML',
          text: 'A single **neuron** computes `output = w · x + b`: the dot product of its weight vector with the input vector, plus a bias. A model "likes" an input when the input aligns with its weights. **Cosine similarity** (the dot product divided by both lengths, so only direction counts) compares text and image *embeddings* in search engines, recommendation systems and the retrieval step of chatbots. Attention in transformers is a grid of dot products.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'zip silently cuts the longer list',
          text: 'In the pure-Python versions above, `zip(a, b)` stops at the shorter list: `dot([1, 2, 3], [4, 5])` quietly returns 14 instead of complaining about mismatched lengths. A mismatch almost always means a bug, so real code checks the lengths first (you will write that check in an exercise). NumPy raises an error for you.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If the dot product of two non-zero vectors is negative, the angle between them is greater than 90°.',
      answer: true,
      explanation: 'True. Since `a · b = ‖a‖ ‖b‖ cos θ` and the lengths are positive, the sign of the dot product is the sign of `cos θ`, which is negative exactly when θ is between 90° and 270° (i.e. more than 90° apart).',
    },
    {
      kind: 'concept',
      title: 'Matrices: grids that transform vectors',
      blocks: [
        {
          type: 'p',
          text: 'A **[[matrix]]** is a rectangular grid of numbers with `m` rows and `n` columns (an "m × n matrix"). Its main job is to **transform vectors**. The matrix-vector product takes an `m × n` matrix `M` and a vector `v` with `n` components, and produces a vector with `m` components: **each result entry is the dot product of one row of `M` with `v`**. The right matrix can rotate, stretch or mirror a vector — the foundation of every 2D/3D transformation in graphics — and in machine learning a matrix of *weights* turns an input vector into a new vector of features.',
        },
        {
          type: 'p',
          text: 'Multiplying two matrices is the same idea repeated: the `(i, j)` entry of `A·B` is the dot product of row `i` of `A` with column `j` of `B`. That requires the **inner sizes to match**: an `(m × n)` times an `(n × p)` gives an `(m × p)` result. And, unlike ordinary numbers, **order matters**: `A·B` is usually *not* the same as `B·A`.',
        },
        {
          type: 'math',
          tex: '(AB)_{ij} = \\sum_{k=1}^{n} A_{ik} B_{kj}, \\qquad (m \\times n)\\,(n \\times p) \\to (m \\times p)',
          caption: 'Matrix multiplication: dot products of rows with columns. The two inner sizes (n) must agree.',
        },
        {
          type: 'code',
          title: 'matrices.py',
          runnable: true,
          code: `def matvec(M, v):
    return [sum(m * x for m, x in zip(row, v)) for row in M]

def matmul(A, B):
    cols = list(zip(*B))
    return [[sum(a * b for a, b in zip(row, col)) for col in cols] for row in A]

rotate90 = [[0, -1],
            [1, 0]]
double = [[2, 0],
          [0, 2]]
print(matvec(rotate90, [1, 0]))
print(matvec(double, [3, 4]))
print(matmul(rotate90, double))
print(matmul(double, rotate90) == matmul(rotate90, double))
A = [[1, 2], [3, 4]]
B = [[0, 1], [1, 0]]
print(matmul(A, B), matmul(B, A))`,
          output: `[0, 1]
[6, 8]
[[0, -2], [2, 0]]
True
[[2, 1], [4, 3]] [[3, 4], [1, 2]]`,
          annotations: [
            { lines: '1-2', text: '**Matrix-vector product**: for each row of `M`, take its dot product with `v`. The result has one entry per row.' },
            { lines: '4-6', text: '**Matrix-matrix product**: `zip(*B)` turns the columns of `B` into tuples, then every row of `A` is dotted with every column. The result has the rows of `A` and the columns of `B`.' },
            { lines: '8-11', text: 'Two transformations. The first rotates a point 90° counter-clockwise; the second doubles everything.' },
            { lines: 12, text: 'Rotating `[1, 0]` (pointing right) gives `[0, 1]` (pointing up).' },
            { lines: 13, text: 'Doubling `[3, 4]` gives `[6, 8]`.' },
            { lines: 14, text: 'Multiplying the two matrices gives one matrix that does both at once: *rotate, then double*. Combining transformations into a single matrix is how graphics engines are fast — and how a stack of neural-network layers is applied.' },
            { lines: 15, text: 'Here the order happens not to matter, because "double" just scales everything. That is the exception, not the rule…' },
            { lines: '16-18', text: '…as the next pair shows: multiplying by `B` on the right swaps the **columns** of `A`, multiplying on the left swaps its **rows**. `AB` and `BA` differ.' },
          ],
        },
        {
          type: 'callout',
          variant: 'analogy',
          title: 'A matrix is a machine',
          text: 'Think of a matrix as a machine that takes a vector in and sends a vector out. Multiplying two matrices connects two machines in a row: the combined machine gives the same result as feeding the vector through the first, then the second. Because machine 1 followed by machine 2 is not the same as 2 followed by 1 (putting on socks and then shoes is not shoes and then socks), matrix multiplication is not commutative.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'A neural-network layer is one matrix',
          text: 'A layer with 3 inputs and 2 outputs stores a `2 × 3` weight matrix `W` and a bias vector `b`, and computes `y = W x + b`: two neurons, each a dot product. A whole network is a chain of such products with simple nonlinear functions in between. Processing a *batch* of 64 examples at once is just one larger matrix product, which is exactly what GPUs are built to do very fast.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Matrix multiplication needs the inner sizes to match. Complete the result shape of this product.',
      template: `A has shape (2, 3), B has shape (3, 4).
A @ B has shape (___, ___).`,
      templateIsCode: true,
      blanks: [{ answers: ['2'] }, { answers: ['4'] }],
      wordBank: ['2', '3', '4', '12'],
      explanation: 'The inner sizes (3 and 3) match and disappear; the result keeps the outer sizes: rows of A (2) and columns of B (4), so the shape is (2, 4).',
    },
    {
      kind: 'concept',
      title: 'Tensors and shapes',
      blocks: [
        {
          type: 'p',
          text: 'Scalars, vectors and matrices are the first three members of one family: **tensors**, n-dimensional grids of numbers. A scalar is a 0-dimensional tensor, a vector 1-dimensional, a matrix 2-dimensional. A colour image is 3-dimensional (height × width × colour channels); a *batch* of images is 4-dimensional; a video adds time. The size along each dimension is the tensor’s **[[tensor-shape]]**, written as a tuple, and **shapes are the language you use to reason about ML code**: almost every bug you will meet is two shapes that do not fit.',
        },
        {
          type: 'table',
          headers: ['Tensor', 'Dimensions', 'Example shape', 'What it holds'],
          rows: [
            ['scalar', '0', '`()`', 'one number: a loss value, a learning rate'],
            ['vector', '1', '`(3,)`', 'one example’s features, or a layer’s bias'],
            ['matrix', '2', '`(2, 3)`', 'a layer’s weights, or a table of examples (rows × features)'],
            ['3-D tensor', '3', '`(2, 4, 3)`', 'one colour image: height × width × channels'],
            ['4-D tensor', '4', '`(3, 2, 4, 3)`', 'a batch of images: batch × height × width × channels'],
          ],
          caption: 'The tensor family. The number of dimensions is the rank; the shape lists the size of each.',
        },
        {
          type: 'code',
          title: 'shapes.py',
          runnable: true,
          code: `def shape(t):
    dims = []
    while isinstance(t, list):
        dims.append(len(t))
        t = t[0]
    return tuple(dims)

scalar = 7
vector = [1, 2, 3]
matrix = [[1, 2, 3], [4, 5, 6]]
image = [[[0, 0, 0] for _ in range(4)] for _ in range(2)]
batch = [image, image, image]
for name, t in [("scalar", scalar), ("vector", vector), ("matrix", matrix), ("image", image), ("batch", batch)]:
    print(name, shape(t))`,
          output: `scalar ()
vector (3,)
matrix (2, 3)
image (2, 4, 3)
batch (3, 2, 4, 3)`,
          annotations: [
            { lines: '1-6', text: 'A quick `shape` function for nested lists: while the thing is a list, record its length and descend into its first element. (It trusts that the nesting is regular; you will make it check that in an exercise.)' },
            { lines: '8-12', text: 'Five tensors of rank 0 to 4. `image` is 2 rows × 4 columns × 3 colour values; `batch` stacks three images.' },
            { lines: '13-14', text: 'The shapes read like the data’s description: a batch of 3 images, each 2 high and 4 wide with 3 channels.' },
          ],
        },
        {
          type: 'p',
          text: 'Nested lists are fine for learning but slow for real work: each number is a full Python object and loops run in the interpreter. **NumPy** stores the numbers in one compact block of memory and runs vector and matrix operations in compiled code, often 50 times faster. The operations above are one-liners there (`@` is matrix multiplication):',
        },
        {
          type: 'code',
          title: 'numpy_preview.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

a = np.array([1.0, 2.0, 3.0])
b = np.array([4.0, 5.0, 6.0])
W = np.array([[1, 0, -1],
              [2, 1, 0]])
print(a @ b, round(float(np.linalg.norm(a)), 4))
print(W @ a)
print(W.shape, a.shape, np.zeros((2, 3, 4)).ndim)`,
          output: `32.0 3.7417
[-2.  4.]
(2, 3) (3,) 3`,
          annotations: [
            { lines: '3-6', text: 'Arrays are created from lists. `a` and `b` are vectors, `W` is a 2 × 3 matrix — a layer with two neurons and three inputs.' },
            { lines: 7, text: '`a @ b` is the dot product (1·4 + 2·5 + 3·6 = 32) and `np.linalg.norm(a)` the length, √14 ≈ 3.7417.' },
            { lines: 8, text: '`W @ a` applies the layer: each row of `W` is dotted with `a`, giving two outputs.' },
            { lines: 9, text: '`.shape` and `.ndim` report the dimensions: the matrix is `(2, 3)`, the vector `(3,)`, and a zeros tensor of shape `(2, 3, 4)` has 3 dimensions.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Shape detective habits',
          text: 'When code fails with "shapes cannot be multiplied", **print the shapes** and write the product as `(m, n) @ (n, p)`: the two inner numbers must match. Check shapes after every step when building a model, and give variables names that remember their shape (`batch_images`, `weights_in_out`). Time spent here saves hours of debugging later.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What is the dot product and what does it measure?" (alignment; `Σ aᵢbᵢ`); "Shape of `(5, 3) @ (3, 2)`?" (`(5, 2)`); "Is matrix multiplication commutative?" (no); "What is the shape of a batch of 32 RGB images of 64 × 64 pixels?" (`(32, 64, 64, 3)` or `(32, 3, 64, 64)` depending on the library); "Why does a neuron use a dot product?" (it scores how well the input matches the weights).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this matrix-vector product.',
      code: `def matvec(M, v):
    return [sum(m * x for m, x in zip(row, v)) for row in M]

print(matvec([[1, 2], [3, 4]], [5, 6]))`,
      answer: '[17, 39]',
      hint: 'Each result entry is the dot product of one row of the matrix with `[5, 6]`.',
      explanation: 'Row 1: `1·5 + 2·6 = 17`. Row 2: `3·5 + 4·6 = 39`. The result has one entry per row: `[17, 39]`.',
    },
    {
      kind: 'error',
      prompt: 'The function should refuse to compute a dot product of vectors with different lengths, but `dot([1, 2, 3], [4, 5])` quietly returns 14. Tap the faulty line.',
      lines: [
        'def dot(a, b):',
        '    return sum(x * y for x, y in zip(a, b))',
        '',
        'print(dot([1, 2, 3], [4, 5]))',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: '`zip` stops at the shortest input, so the third component `3` is silently ignored and the mismatch goes unnoticed. Check `len(a) == len(b)` first and raise `ValueError` if they differ (or use `zip(a, b, strict=True)`, available since Python 3.10).',
    },
    {
      kind: 'numeric',
      prompt: 'How many individual multiplications are needed to multiply a `(2, 3)` matrix by a `(3, 4)` matrix the straightforward way? (Each of the 2 × 4 result entries is a dot product of length 3.)',
      answer: '24',
      hint: 'Number of result entries times the length of each dot product.',
      explanation: 'The result has 2 × 4 = 8 entries and each needs 3 multiplications, so 8 × 3 = 24. In general an `(m, n) @ (n, p)` product costs `m · n · p` multiplications, which is why large matrix products are the computational heart of deep learning.',
      label: 'Multiplications:',
    },
    {
      kind: 'code',
      prompt: 'Write `cosine_similarity(a, b)`: the dot product of the two vectors divided by the product of their lengths. Raise `ValueError` if the vectors have different lengths or if either one has length zero (all components 0).',
      starter: `import math

def cosine_similarity(a, b):
    ...
`,
      solution: `import math


def cosine_similarity(a, b):
    if len(a) != len(b):
        raise ValueError("vectors must have the same length")
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        raise ValueError("cosine similarity is undefined for a zero vector")
    return sum(x * y for x, y in zip(a, b)) / (na * nb)
`,
      tests: `def close(x, y):
    return abs(x - y) < 1e-9

assert close(cosine_similarity([1, 0], [0, 1]), 0.0)
assert close(cosine_similarity([1, 1], [2, 2]), 1.0)
assert close(cosine_similarity([1, 0], [-3, 0]), -1.0)
assert close(cosine_similarity([3, 4], [4, 3]), 24 / 25)
assert close(cosine_similarity([1, 2, 3], [4, 5, 6]), 32 / (14 ** 0.5 * 77 ** 0.5))
assert close(cosine_similarity([0.5, 0.5], [10, 10]), 1.0)

for a, b in [([1, 2], [1, 2, 3]), ([0, 0], [1, 2]), ([1, 2], [0, 0]), ([], [])]:
    try:
        cosine_similarity(a, b)
        assert False, "must raise ValueError"
    except ValueError:
        pass`,
      checks: ['Returns \`a·b / (‖a‖ ‖b‖)\`: 1 for the same direction, 0 for perpendicular, -1 for opposite', 'Ignores vector size: \`[1, 1]\` and \`[2, 2]\` give 1', 'Raises \`ValueError\` for different lengths and for zero vectors'],
      hint: 'Compute the dot product, then each length with `math.sqrt(sum(x * x ...))`. Check the lengths first, and check for zero length before dividing.',
      explanation: 'Dividing by both lengths cancels the size of the vectors and leaves only their direction. That is why cosine similarity is the standard way to compare embeddings: a long document and a short one on the same topic point the same way, even though their raw vectors differ in size.',
    },
    {
      kind: 'code',
      prompt: 'Write `matmul(A, B)` for matrices stored as lists of rows. Return the product `A·B` as a new list of rows. If the inner dimensions do not match (the number of columns in `A` differs from the number of rows in `B`) raise `ValueError`.',
      starter: `def matmul(A, B):
    ...
`,
      solution: `def matmul(A, B):
    if len(A[0]) != len(B):
        raise ValueError("inner dimensions do not match")
    cols = list(zip(*B))
    return [[sum(a * b for a, b in zip(row, col)) for col in cols] for row in A]
`,
      tests: `assert matmul([[1, 2], [3, 4]], [[5, 6], [7, 8]]) == [[19, 22], [43, 50]]
assert matmul([[1, 2, 3], [4, 5, 6]], [[1, 0], [0, 1], [1, 1]]) == [[4, 5], [10, 11]]
assert matmul([[2]], [[3]]) == [[6]]
assert matmul([[1, 2, 3]], [[1], [2], [3]]) == [[14]]
assert matmul([[1], [2], [3]], [[1, 2, 3]]) == [[1, 2, 3], [2, 4, 6], [3, 6, 9]]

I = [[1, 0], [0, 1]]
M = [[5, 6], [7, 8]]
assert matmul(I, M) == M and matmul(M, I) == M
assert matmul([[1, 2], [3, 4]], [[0, 1], [1, 0]]) == [[2, 1], [4, 3]]
assert matmul([[0, 1], [1, 0]], [[1, 2], [3, 4]]) == [[3, 4], [1, 2]]

for A, B in [([[1, 2]], [[1, 2]]), ([[1, 2], [3, 4]], [[1, 2, 3]]), ([[1, 2, 3]], [[1, 2], [3, 4]])]:
    try:
        matmul(A, B)
        assert False, "must raise ValueError"
    except ValueError:
        pass`,
      checks: ['Entry (i, j) is the dot product of row i of A with column j of B', 'The result has the rows of A and the columns of B', 'Raises \`ValueError\` when the number of columns of A differs from the number of rows of B'],
      hint: 'Check `len(A[0]) == len(B)` first. Then `list(zip(*B))` gives the columns of B; for each row of A and each column compute `sum(a * b for a, b in zip(row, col))`.',
      explanation: 'Row-times-column dot products are the whole algorithm; the shape check catches the most common ML bug. Real libraries do the same thing in optimized compiled code (`A @ B` in NumPy), and on a GPU the many independent dot products run in parallel.',
    },
    {
      kind: 'code',
      prompt: 'Write `shape(t)` that returns the shape tuple of a tensor stored as nested lists. A non-list is a scalar with shape `()`. An empty list has shape `(0,)`. All elements at the same level must have the same shape: raise `ValueError` for ragged nesting such as `[[1, 2], [3]]` or for a mix of scalars and lists like `[1, [2]]`.',
      starter: `def shape(t):
    ...
`,
      solution: `def shape(t):
    if not isinstance(t, list):
        return ()
    if not t:
        return (0,)
    inner = [shape(x) for x in t]
    if any(s != inner[0] for s in inner):
        raise ValueError("ragged tensor")
    return (len(t),) + inner[0]
`,
      tests: `assert shape(5) == ()
assert shape([]) == (0,)
assert shape([1, 2, 3]) == (3,)
assert shape([[1, 2, 3], [4, 5, 6]]) == (2, 3)
assert shape([[[0] * 3 for _ in range(4)] for _ in range(2)]) == (2, 4, 3)
assert shape([[], []]) == (2, 0)
assert shape([[[1], [2]], [[3], [4]], [[5], [6]]]) == (3, 2, 1)

for bad in ([[1, 2], [3]], [1, [2]], [[1, 2], 3], [[[1]], [[1, 2]]]):
    try:
        shape(bad)
        assert False, "must raise ValueError"
    except ValueError:
        pass`,
      checks: ['Scalars have shape \`()\`, an empty list \`(0,)\`, and the result lists the size of every dimension', 'Works for any depth by recursion', 'Raises \`ValueError\` for ragged or mixed nesting'],
      hint: 'Recursion: a non-list has shape `()`. For a non-empty list compute `shape(x)` for every element, make sure they are all equal, and return `(len(t),) + that_shape`.',
      explanation: 'A tensor must be *rectangular*: every row the same length, every image the same size. Frameworks enforce this; recursive checking of each element’s shape is the simplest way to do it by hand. Ragged data (sentences of different length) has to be padded to a common shape before it becomes a tensor.',
    },
  ],
  takeaways: [
    'A **vector** is an ordered list of numbers: a position in a game, or the features of a data example. You can add vectors, scale them and measure their length `√(Σ vᵢ²)`.',
    'The **dot product** `Σ aᵢbᵢ = ‖a‖‖b‖ cos θ` measures alignment (positive: same way, zero: perpendicular, negative: opposite). **Cosine similarity** divides out the lengths so only direction counts. A neuron is a dot product plus a bias.',
    'A **matrix** transforms vectors: each output entry is a row dotted with the vector. In `(m, n) @ (n, p)` the inner sizes must match, the result is `(m, p)`, and order matters (`AB ≠ BA`).',
    'A **tensor** is an n-dimensional array described by its **shape**: scalar `()`, vector `(n,)`, matrix `(m, n)`, image `(h, w, c)`, batch `(N, h, w, c)`. Most ML bugs are shape mismatches, so print and check shapes.',
    'Plain lists teach the ideas, but NumPy and PyTorch run the same operations in fast compiled code (`@` for matrix products) and on GPUs: a layer is one matrix product `y = W x + b`.',
  ],
  reading: [
    { title: 'Essence of Linear Algebra (3Blue1Brown)', url: 'https://www.3blue1brown.com/topics/linear-algebra', source: 'video', note: 'The best visual introduction to vectors, dot products, matrices as transformations and more.' },
    { title: 'Mathematics for Machine Learning — Linear Algebra', url: 'https://mml-book.com/', source: 'book', note: 'Free book; Chapters 2–3 cover vectors, matrices, norms and the dot product with ML in mind.' },
    { title: 'Immersive Linear Algebra', url: 'https://immersivemath.com/ila/index.html', source: 'book', note: 'An interactive online book where you can drag vectors and see the results.' },
    { title: 'NumPy: the absolute basics for beginners', url: 'https://numpy.org/doc/stable/user/absolute_beginners.html', source: 'docs', note: 'Arrays, shapes, vectors and matrices in NumPy — a preview of the next unit.' },
  ],
};
