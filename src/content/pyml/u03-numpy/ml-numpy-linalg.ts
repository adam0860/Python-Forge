import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-numpy-linalg',
  title: 'Linear Algebra and Random Numbers in NumPy',
  summary: 'The last NumPy toolkit: matrix products and the shape rule behind every neural-network layer, solving linear systems and least-squares fits, and reproducible random numbers with the modern Generator API.',
  minutes: 22,
  objectives: [
    'Distinguish element-wise * from matrix multiplication @ and predict result shapes',
    'Express a neural-network layer as x @ W + b and compute it for a batch',
    'Solve linear systems and fit a line by least squares instead of inverting matrices',
    'Generate reproducible random numbers with np.random.default_rng and a seed',
    'Shuffle and split data into train and test sets with a random generator',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Matrix products and the shape rule',
      blocks: [
        {
          type: 'p',
          text: 'In NumPy `*` is **element-wise**: matching positions multiply. Matrix multiplication, the operation from the vectors-and-matrices lesson, is the **`@` operator** (also `np.matmul` and `np.dot`). For `A @ B` the inner dimensions must agree, and the result takes the outer ones: `(m, n) @ (n, p)` gives `(m, p)`. A matrix times a vector, `(m, n) @ (n,)`, gives `(m,)`; two vectors give their dot product, a single number.',
        },
        {
          type: 'code',
          title: 'matrix_ops.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

a = np.array([[2.0, 1.0], [1.0, 3.0]])
b = np.array([[0.0, 1.0], [1.0, 0.0]])
v = np.array([1.0, 2.0])
print(a @ b)
print(a * b)
print(a @ v, v @ v)
print(a.T, np.trace(a), np.linalg.det(a).round(3))`,
          output: `[[1. 2.]
 [3. 1.]]
[[0. 1.]
 [1. 0.]]
[4. 7.] 5.0
[[2. 1.]
 [1. 3.]] 5.0 5.0`,
          annotations: [
            { lines: 6, text: '`a @ b` is a true matrix product. Because `b` swaps the two columns, `a @ b` is `a` with its columns swapped.' },
            { lines: 7, text: '`a * b` is the *element-wise* product, a completely different result: each entry multiplied by the entry in the same position. Mixing the two up is a classic bug, and both are legal for same-shaped arrays so nothing warns you.' },
            { lines: 8, text: '`a @ v` applies the matrix to a vector: `[2·1 + 1·2, 1·1 + 3·2] = [4, 7]`. `v @ v` is the dot product `1 + 4 = 5`.' },
            { lines: 9, text: '`.T` transposes, `np.trace` sums the diagonal and `np.linalg.det` gives the determinant (2·3 − 1·1 = 5). The matrix is symmetric, so it equals its own transpose.' },
          ],
        },
        {
          type: 'p',
          text: 'The most important matrix product in this course is a **neural-network layer**. With a batch of inputs `x` of shape `(batch, inputs)`, a weight matrix `W` of shape `(inputs, outputs)` and a bias vector `b` of shape `(outputs,)`, the layer’s output is `x @ W + b`. The matrix product handles every example and every neuron at once, and the bias is *broadcast* onto each row.',
        },
        {
          type: 'code',
          title: 'dense_layer.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

x = np.ones((4, 3))
W = np.full((3, 2), 0.5)
b = np.array([0.1, -0.1])
out = x @ W + b
print(out.shape, out[0])`,
          output: `(4, 2) [1.6 1.4]`,
          annotations: [
            { lines: 3, text: 'A batch of 4 examples with 3 input features each: `(batch, inputs)`.' },
            { lines: 4, text: 'The weights: 3 inputs feeding 2 neurons, `(inputs, outputs)`. Here every weight is 0.5.' },
            { lines: 6, text: '`x @ W` is `(4, 3) @ (3, 2) → (4, 2)`: the 3s match and disappear. Each output is `0.5 + 0.5 + 0.5 = 1.5`; the bias row `(2,)` is broadcast onto all 4 rows, giving `1.6` and `1.4`.' },
            { lines: 7, text: 'The result is 4 examples × 2 neuron outputs. This one line *is* a fully connected layer. PyTorch’s `nn.Linear` does the same computation, with the weights learned instead of fixed.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Shape bugs live at the @ operator',
          text: 'When a model crashes with "mat1 and mat2 shapes cannot be multiplied (32x784 and 748x10)" the inner dimensions disagree (a typo here). The cure is the habit from the last lessons: write the expected shape next to each line and print `.shape` while debugging. Remember also that the ordering matters: `A @ B` is generally *not* `B @ A`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A layer receives a batch `x` of shape `(32, 784)` and has a weight matrix `W` of shape `(784, 10)`. What is the shape of `x @ W`?',
      options: [
        { text: '`(32, 10)`', correct: true, why: 'The inner dimensions (784 and 784) match and vanish; the outer ones remain: 32 examples by 10 outputs.' },
        { text: '`(784, 784)`', why: 'That would be the outer dimensions of a different product. The inner 784s are the ones that cancel.' },
        { text: '`(32, 784)`', why: 'That is the input shape. The product replaces the 784 input features with the 10 outputs of `W`.' },
        { text: 'An error: the shapes must be identical', why: 'Matrix multiplication needs only the *inner* dimensions to match; the shapes themselves differ.' },
      ],
      explanation: '`(m, n) @ (n, p)` gives `(m, p)`. A batch of 32 flattened 28 × 28 images (784 pixels) passed through a 10-class output layer yields 32 rows of 10 scores.',
    },
    {
      kind: 'concept',
      title: 'Solving systems, inverses and norms',
      blocks: [
        {
          type: 'p',
          text: '`np.linalg` is NumPy’s linear-algebra toolbox. To solve the system `A x = y` for the unknown `x`, use `np.linalg.solve(A, y)`. The inverse `np.linalg.inv(A)` exists, but you rarely need it: **solving is faster and more accurate than inverting then multiplying**. `np.linalg.eigh` finds the eigenvalues and eigenvectors of a symmetric matrix ([[eigenvalue|eigenvalues]] describe how a matrix stretches space), and `np.linalg.norm` measures the length of a vector.',
        },
        {
          type: 'code',
          title: 'linalg_tools.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

A = np.array([[2.0, 1.0], [1.0, 3.0]])
y = np.array([5.0, 10.0])
x = np.linalg.solve(A, y)
print(x, np.allclose(A @ x, y))
inv = np.linalg.inv(A)
print(np.round(inv, 3), np.allclose(inv @ A, np.eye(2)))
vals, vecs = np.linalg.eigh(A)
print(np.round(vals, 3))
print(np.round(np.linalg.norm(y), 3), np.linalg.norm(y, 1))`,
          output: `[1. 3.] True
[[ 0.6 -0.2]
 [-0.2  0.4]] True
[1.382 3.618]
11.18 15.0`,
          annotations: [
            { lines: '5-6', text: '`solve(A, y)` finds `x` with `A @ x == y`: here `x = [1, 3]` (2·1 + 1·3 = 5 and 1·1 + 3·3 = 10). `np.allclose` verifies the answer, the right way to compare floats.' },
            { lines: '7-8', text: 'The inverse satisfies `inv @ A = I` (the identity matrix). It is shown for completeness; prefer `solve`.' },
            { lines: '9-10', text: '`eigh` (for symmetric matrices) returns the eigenvalues in ascending order, 1.382 and 3.618, along with the eigenvectors. In machine learning they appear in PCA, where the biggest eigenvalues mark the directions along which the data varies the most.' },
            { lines: 11, text: '`np.linalg.norm(y)` is the usual Euclidean (L2) length, √(25 + 100) ≈ 11.18; with `1` as the second argument it is the L1 norm, the sum of absolute values (15). Both appear as regularization terms.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Do not invert matrices unless you must',
          text: 'Write `np.linalg.solve(A, y)`, not `np.linalg.inv(A) @ y`. Explicit inverses amplify rounding error, cost more, and fail outright for singular matrices. If `A` is singular or not square (more equations than unknowns), use least squares, which is the next topic.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'For two 2 × 2 NumPy arrays `A` and `B`, the expressions `A * B` and `A @ B` produce the same result.',
      answer: false,
      explanation: 'False. `A * B` multiplies matching entries (element-wise), while `A @ B` is the matrix product (rows times columns). They coincide only in special cases, such as when one matrix is all ones in the right places.',
    },
    {
      kind: 'concept',
      title: 'Least squares: fitting a line',
      blocks: [
        {
          type: 'p',
          text: 'Real data does not satisfy a system exactly: you have more equations (data points) than unknowns (parameters), and noise. **[[least-squares|Least squares]]** finds the parameters `w` that make the predictions `X @ w` as close as possible to the targets `y`, minimizing the sum of squared errors. This *is* linear regression, and the first model you will build in the classical ML unit. The columns of `X` are the features, plus a column of ones so the model can learn an intercept.',
        },
        {
          type: 'math',
          tex: '\\hat{\\mathbf{w}} = \\arg\\min_{\\mathbf{w}} \\ \\lVert X\\mathbf{w} - \\mathbf{y} \\rVert^2 \\quad\\Longrightarrow\\quad X^{\\top}X\\,\\hat{\\mathbf{w}} = X^{\\top}\\mathbf{y}',
          caption: 'Setting the gradient of the squared error to zero gives the normal equations. NumPy solves this for you, in a numerically careful way.',
        },
        {
          type: 'code',
          title: 'fit_line.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

X = np.array([[1.0, 1.0], [1.0, 2.0], [1.0, 3.0], [1.0, 4.0]])
y = np.array([2.1, 3.9, 6.2, 7.8])
w, residuals, rank, sv = np.linalg.lstsq(X, y, rcond=None)
print(np.round(w, 3), rank)
print(np.round(X @ w, 2))`,
          output: `[0.15 1.94] 2
[2.09 4.03 5.97 7.91]`,
          annotations: [
            { lines: 3, text: 'The **design matrix**: the first column is all ones (for the intercept) and the second holds the x values 1, 2, 3, 4.' },
            { lines: 4, text: 'The noisy targets, roughly `2x`.' },
            { lines: 5, text: '`np.linalg.lstsq` solves the least-squares problem and also returns diagnostics. `rcond=None` selects the modern default cutoff and avoids a warning.' },
            { lines: 6, text: '`w = [0.15, 1.94]`: an intercept of 0.15 and a slope of 1.94. The `rank` of 2 tells us that both columns carry independent information.' },
            { lines: 7, text: '`X @ w` are the fitted values, `[2.09, 4.03, 5.97, 7.91]`, close to the observed `y` without matching it exactly: the line balances the noise.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Closed-form fit vs gradient descent',
          text: 'For linear models the best weights have a direct formula, so `lstsq` finishes in one step. Neural networks have no such formula: their loss is not a simple quadratic bowl, so we *walk* downhill with gradient descent instead. Linear regression is the one case where you can do both and compare, which makes it a perfect test bench for the training loops you will write later.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Random numbers you can reproduce',
      blocks: [
        {
          type: 'p',
          text: 'ML is full of randomness: initial weights, shuffled batches, noise, random starting states for an agent. NumPy’s modern interface is a **`Generator`** object created with `np.random.default_rng(seed)`. The **[[random-seed|seed]]** fixes the whole sequence, so the same seed reproduces the same numbers, run after run. Call methods on the generator: `.random()` (uniform in [0, 1)), `.integers(low, high)`, `.normal(mean, std)`, `.choice(items)`, `.shuffle(array)` and `.permutation(n)`.',
        },
        {
          type: 'code',
          title: 'random_numbers.py',
          runnable: true,
          outputVaries: true,
          packages: ['numpy'],
          code: `import numpy as np

rng = np.random.default_rng(42)
print(rng.random(3))
print(rng.integers(0, 10, size=5))
print(rng.normal(loc=0.0, scale=1.0, size=3))
same = np.random.default_rng(42).random(3)
print(np.allclose(same, np.random.default_rng(42).random(3)))
deck = np.arange(8)
rng.shuffle(deck)
print(deck)
print(rng.choice(["rock", "paper", "scissors"], size=4))
big = rng.normal(5.0, 2.0, size=100_000)
print(round(float(big.mean()), 2), round(float(big.std()), 2))`,
          output: `[0.77395605 0.43887844 0.85859792]
[0 6 2 0 5]
[ 0.1278404  -0.31624259 -0.01680116]
True
[4 0 2 3 7 1 6 5]
['paper' 'paper' 'scissors' 'paper']
4.99 2.01`,
          annotations: [
            { lines: 3, text: 'One generator seeded with 42. Everything below draws from this single stream.' },
            { lines: '4-6', text: 'Three kinds of draws: three uniform numbers in [0, 1); five integers from 0 to 9 (the upper bound is *excluded*); and three samples from a normal distribution with mean 0 and standard deviation 1.' },
            { lines: '7-8', text: 'Two brand-new generators with the same seed produce identical numbers: reproducibility. (The exact digits can differ between NumPy versions, so your output may not match this sample, but the same seed will always agree with itself on your machine.)' },
            { lines: '9-11', text: '`rng.shuffle` reorders an array **in place**. Shuffling the dataset every epoch is standard practice, so the model never sees the examples in a fixed order.' },
            { lines: 12, text: '`rng.choice` samples from a list (with replacement by default): a random-action policy for rock, paper, scissors.' },
            { lines: '13-14', text: 'Draw 100 000 samples with mean 5 and standard deviation 2: the sample mean and spread come out at about 4.99 and 2.01. This is the law of large numbers in action.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Legacy np.random.seed and global state',
          text: 'Older code calls `np.random.seed(0)` and then `np.random.rand(...)`, which uses one hidden *global* generator, so any library call can disturb it. Prefer your own `rng = np.random.default_rng(seed)` and pass it around: results become reproducible and independent of unrelated code. Remember that Python’s `random` module and PyTorch (`torch.manual_seed`) each have their own separate generators and seeds.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Train/test splits with a permutation',
          text: 'To split data randomly, shuffle the *indices*, not the data: `idx = rng.permutation(n)`, then take the first part as the test set and the rest for training. The same index arrays then select the matching rows of both `X` and `y`, so inputs and labels stay paired. Never evaluate on data the model trained on.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the predictions of a linear model with weights `w` for a feature matrix `X`.',
      template: `y_hat = X ___ w`,
      templateIsCode: true,
      blanks: [{ answers: ['@'] }],
      wordBank: ['@', '*', '+', '**'],
      explanation: 'The matrix product `X @ w` combines each row of features with the weights. Using `*` would multiply element by element (or fail on mismatched shapes) and would not sum the products.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `import numpy as np

A = np.array([[1, 2], [3, 4]])
B = np.array([[0, 1], [1, 0]])
print((A @ B)[0], (A * B)[1])`,
      answer: '[2 1] [3 0]',
      hint: '`A @ B` swaps the columns of `A`; `A * B` multiplies matching entries.',
      explanation: '`A @ B` swaps the columns of `A`, giving `[[2, 1], [4, 3]]`, whose row 0 is `[2 1]`. The element-wise product `A * B` is `[[0, 2], [3, 0]]`, and its row 1 is `[3 0]`.',
    },
    {
      kind: 'error',
      prompt: 'The layer should map 5 examples of 3 features to 2 outputs, but it crashes. Tap the faulty line.',
      lines: [
        'import numpy as np',
        'X = np.ones((5, 3))        # batch of 5 examples, 3 features',
        'W = np.ones((5, 2))        # weights: 3 inputs -> 2 outputs',
        'out = X @ W                # expected shape (5, 2)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The weights must be `(inputs, outputs)` = `(3, 2)`, but `W` was created with 5 rows. `(5, 3) @ (5, 2)` has mismatched inner dimensions (3 vs 5). The batch size belongs only to `X`, never to `W`.',
    },
    {
      kind: 'numeric',
      prompt: 'How many scalar multiplications does the product `(4, 3) @ (3, 5)` perform? (Each entry of the result is a sum of products.)',
      answer: '60',
      hint: 'The result has 4 × 5 entries, and each entry sums 3 products.',
      explanation: 'The `(4, 5)` result has 20 entries, and each one is a dot product of length 3, so 20 × 3 = 60 multiplications. In general a product `(m, n) @ (n, p)` costs `m · n · p`, which is why big matrix products run on GPUs.',
      label: 'Multiplications:',
    },
    {
      kind: 'code',
      prompt: 'Write `mlp_forward(x, W1, b1, W2, b2)` for a two-layer network: compute `h = max(0, x @ W1 + b1)` (ReLU), then return `h @ W2 + b2`. `x` has shape `(batch, inputs)`.',
      starter: `import numpy as np

def mlp_forward(x, W1, b1, W2, b2):
    ...
`,
      solution: `import numpy as np


def mlp_forward(x, W1, b1, W2, b2):
    h = np.maximum(0, x @ W1 + b1)
    return h @ W2 + b2
`,
      tests: `import numpy as np

x = np.array([[1.0, 2.0], [-1.0, 0.5]])
W1 = np.array([[1.0, -1.0, 0.5], [0.5, 1.0, -0.5]])
b1 = np.array([0.0, 0.5, -0.25])
W2 = np.array([[1.0], [2.0], [3.0]])
b2 = np.array([0.1])
out = mlp_forward(x, W1, b1, W2, b2)
assert out.shape == (2, 1)
assert np.allclose(out, [[5.1], [4.1]])

hidden_negative = mlp_forward(np.array([[1.0]]), np.array([[-2.0]]), np.array([0.0]), np.array([[5.0]]), np.array([1.0]))
assert np.allclose(hidden_negative, [[1.0]])

big = mlp_forward(np.ones((7, 4)), np.ones((4, 6)), np.zeros(6), np.ones((6, 3)), np.zeros(3))
assert big.shape == (7, 3) and np.allclose(big, 24.0)

orig = x.copy()
mlp_forward(x, W1, b1, W2, b2)
assert np.array_equal(x, orig)`,
      packages: ['numpy'],
      checks: ['The hidden layer is `x @ W1 + b1` followed by ReLU (negative values become 0)', 'The output layer is `h @ W2 + b2`, with no activation', 'Works for any batch size and does not modify the inputs'],
      hint: '`np.maximum(0, z)` is the ReLU. Compute `h = np.maximum(0, x @ W1 + b1)` and then `h @ W2 + b2`.',
      explanation: 'This is the complete forward pass of a small neural network, written in two lines. The ReLU between the layers is essential: without it two matrix products collapse into a single one, and the network could only learn straight-line relationships.',
    },
    {
      kind: 'code',
      prompt: 'Write `fit_line(x, y)` that fits `y ≈ slope * x + intercept` by least squares and returns the tuple `(slope, intercept)` as plain floats. Build the design matrix with a column of ones and use `np.linalg.lstsq`.',
      starter: `import numpy as np

def fit_line(x, y):
    ...
`,
      solution: `import numpy as np


def fit_line(x, y):
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    X = np.column_stack([x, np.ones_like(x)])
    (slope, intercept), *_ = np.linalg.lstsq(X, y, rcond=None)
    return float(slope), float(intercept)
`,
      tests: `import numpy as np

slope, intercept = fit_line([1, 2, 3, 4], [2.1, 3.9, 6.2, 7.8])
assert abs(slope - 1.94) < 1e-9 and abs(intercept - 0.15) < 1e-9

slope, intercept = fit_line(np.array([0.0, 1.0, 2.0]), np.array([1.0, 3.0, 5.0]))
assert abs(slope - 2.0) < 1e-9 and abs(intercept - 1.0) < 1e-9

slope, intercept = fit_line([-2, 0, 2], [4, 4, 4])
assert abs(slope) < 1e-9 and abs(intercept - 4.0) < 1e-9

slope, intercept = fit_line([0, 10], [-3, 7])
assert abs(slope - 1.0) < 1e-9 and abs(intercept + 3.0) < 1e-9

result = fit_line([1, 2, 3], [3, 5, 7])
assert isinstance(result, tuple) and len(result) == 2
assert all(type(v) is float for v in result)`,
      packages: ['numpy'],
      checks: ['Fits both a slope and an intercept (a column of ones in the design matrix)', 'Returns a tuple of two plain floats `(slope, intercept)`', 'Accepts lists as well as arrays'],
      hint: 'Stack the x values and a column of ones side by side with `np.column_stack([x, np.ones_like(x)])`, call `np.linalg.lstsq(X, y, rcond=None)`, and take the first two numbers of the first result.',
      explanation: 'A line is a linear model with two parameters, so the same design-matrix trick extends to any number of features (and to polynomial features: add a column of `x**2`). Convert the NumPy scalars with `float()` so the caller gets ordinary Python numbers.',
    },
    {
      kind: 'code',
      prompt: 'Write `train_test_split(n, test_fraction, seed)` returning `(train_idx, test_idx)`: two integer index arrays that together contain every number from 0 to `n - 1` exactly once. `test_idx` has `int(n * test_fraction)` indices. Shuffle with `np.random.default_rng(seed).permutation(n)`. The same seed must always give the same split.',
      starter: `import numpy as np

def train_test_split(n, test_fraction, seed):
    ...
`,
      solution: `import numpy as np


def train_test_split(n, test_fraction, seed):
    rng = np.random.default_rng(seed)
    idx = rng.permutation(n)
    n_test = int(n * test_fraction)
    return idx[n_test:], idx[:n_test]
`,
      tests: `import numpy as np

train, test = train_test_split(100, 0.2, 7)
assert len(test) == 20 and len(train) == 80
assert set(train.tolist()).isdisjoint(test.tolist())
assert sorted(train.tolist() + test.tolist()) == list(range(100))

train2, test2 = train_test_split(100, 0.2, 7)
assert np.array_equal(train, train2) and np.array_equal(test, test2)

train3, test3 = train_test_split(100, 0.2, 8)
assert not np.array_equal(test, test3)

t, s = train_test_split(10, 0.5, 0)
assert len(t) == 5 and len(s) == 5
t, s = train_test_split(7, 0.3, 1)
assert len(s) == 2 and len(t) == 5
t, s = train_test_split(5, 0.0, 3)
assert len(s) == 0 and sorted(t.tolist()) == [0, 1, 2, 3, 4]
assert train.dtype.kind in 'iu'`,
      packages: ['numpy'],
      checks: ['Train and test indices are disjoint and together cover `0..n-1` exactly once', '`test_idx` has `int(n * test_fraction)` entries', 'The same seed gives the same split; a different seed gives a different one'],
      hint: 'Create `rng = np.random.default_rng(seed)`, get `idx = rng.permutation(n)`, compute `n_test = int(n * test_fraction)`, and slice: the first `n_test` for testing and the rest for training.',
      explanation: 'Shuffling indices, then slicing, guarantees no example is in both sets. Using a seeded generator makes the split reproducible, which is essential so that results from different experiments can be compared fairly. (scikit-learn’s `train_test_split` works the same way.)',
    },
  ],
  takeaways: [
    '`*` is element-wise and `@` is the matrix product. For `(m, n) @ (n, p)` the inner dimensions must match and the result is `(m, p)`; a layer’s forward pass is just `x @ W + b`.',
    'Use `np.linalg.solve` instead of inverting matrices, `np.linalg.norm` for lengths, `eigh` for symmetric eigenproblems, and `np.allclose` to compare floats.',
    '**Least squares** (`np.linalg.lstsq` on a design matrix with a column of ones) fits a linear model in one step: it is linear regression and a baseline to beat with learning.',
    'Create a `Generator` with `np.random.default_rng(seed)` and draw from it. A fixed **seed** makes experiments reproducible; use several seeds to see how much results vary.',
    'Split data by shuffling **indices** with `rng.permutation(n)`, so inputs and labels stay paired and no example lands in both the training and test sets.',
  ],
  reading: [
    { title: 'NumPy linear algebra routines (numpy.linalg)', url: 'https://numpy.org/doc/stable/reference/routines.linalg.html', source: 'docs', note: 'The reference for solve, lstsq, eigh, norm and friends.' },
    { title: 'NumPy random Generator', url: 'https://numpy.org/doc/stable/reference/random/generator.html', source: 'docs', note: 'Every distribution and sampling method of the modern random API.' },
    { title: 'Essence of Linear Algebra (3Blue1Brown)', url: 'https://www.3blue1brown.com/topics/linear-algebra', source: 'video', note: 'The visual intuition behind matrix products, determinants and eigenvectors.' },
    { title: 'MIT 18.06 Linear Algebra (Gilbert Strang)', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/', source: 'course', note: 'The classic full university course, free with videos and notes.' },
  ],
};
