import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-backprop',
  title: 'Backpropagation',
  summary: 'The algorithm that makes deep learning possible: the chain rule, applied backward through a computational graph so one sweep yields the gradient of every weight. Build a tiny autodiff engine, derive the layer formulas, and check them numerically.',
  minutes: 23,
  objectives: [
    'Explain backpropagation as the chain rule applied backward through a computational graph',
    'Compute the gradients of a small expression by hand, and know why gradients from multiple uses add up',
    'Write the backward formulas for a linear layer and for ReLU, with correct shapes',
    'Verify analytic gradients with a numerical gradient check',
    'Explain vanishing and exploding gradients and the standard fixes',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The chain rule, applied backward',
      blocks: [
        {
          type: 'p',
          text: 'Gradient descent needs `∂L/∂w` for *every* weight in the network, possibly billions of them. A neural network is a long composition of simple functions (matrix multiply, add, activation, loss), and the calculus **[[chain-rule|chain rule]]** says how to differentiate a composition: multiply the local derivatives along the path. **[[backpropagation|Backpropagation]]** is that rule organized efficiently: do the forward pass once and remember the intermediate values, then sweep **backward** from the loss, multiplying local derivatives as you go, so each weight’s gradient comes out of a single backward pass. Here is a tiny example by hand: one neuron without activation, `ŷ = w·x + b`, and the loss `L = (ŷ − y)²` with `w = 3`, `b = 1`, `x = 2`, `y = 4`.',
        },
        {
          type: 'derivation',
          steps: [
            { tex: 'z = wx + b = 3\\cdot 2 + 1 = 7 \\qquad e = z - y = 3 \\qquad L = e^2 = 9', why: 'The forward pass: compute and store each intermediate value.' },
            { tex: '\\frac{\\partial L}{\\partial e} = 2e = 6', why: 'Start at the loss: the local derivative of e² with respect to e.' },
            { tex: '\\frac{\\partial L}{\\partial z} = \\frac{\\partial L}{\\partial e}\\cdot\\frac{\\partial e}{\\partial z} = 6 \\cdot 1 = 6', why: 'Move one step back. e = z − y has slope 1 with respect to z. Multiply the incoming gradient by the local one.' },
            { tex: '\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial z}\\cdot\\frac{\\partial z}{\\partial w} = 6 \\cdot x = 12', why: 'z = wx + b has slope x with respect to w.' },
            { tex: '\\frac{\\partial L}{\\partial b} = \\frac{\\partial L}{\\partial z}\\cdot 1 = 6', why: 'And slope 1 with respect to b.' },
          ],
          result: 'dL/dw = 12 and dL/db = 6: raising w by a tiny amount raises the loss 12 times as fast.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why backward, not forward?',
          text: 'You could compute each weight’s gradient separately by nudging it and re-running the network (numerical differentiation): one extra forward pass *per parameter*, which for a million parameters means a million passes. Backpropagation gets *all* the gradients in a backward sweep costing about **twice one forward pass**, regardless of the number of parameters. This asymmetry (one output, many inputs) is why reverse-mode differentiation made training huge networks feasible.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'An old idea with a long delay',
          text: 'Reverse-mode automatic differentiation was described by Seppo Linnainmaa in 1970, and Paul Werbos proposed using it to train neural networks in 1974. It became famous in 1986, when David Rumelhart, Geoffrey Hinton and Ronald Williams showed that backpropagation lets hidden layers learn useful internal representations, ending the XOR-era pessimism. Today PyTorch, TensorFlow and JAX implement it generally as **[[automatic-differentiation|automatic differentiation]]**, so you almost never write a backward pass by hand. But understanding it is what lets you debug training.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why is backpropagation much cheaper than estimating every gradient by nudging each parameter and re-running the network?',
      options: [
        { text: 'One backward sweep reuses the stored forward values and delivers the gradient of every parameter, at a cost of about two forward passes in total', correct: true, why: 'Reverse-mode differentiation shares the work among all parameters: each local derivative is computed once and multiplied into everything upstream of it.' },
        { text: 'It skips most of the parameters and only updates the important ones', why: 'Backpropagation computes the exact gradient for all parameters; it does not skip any.' },
        { text: 'It replaces the loss with a simpler function that has no derivatives', why: 'It differentiates the real loss exactly using the chain rule; nothing is simplified away.' },
        { text: 'It runs the network backward from the targets to the inputs', why: 'It does not run the model in reverse: it propagates *gradients* backward through the stored computation, using the forward activations.' },
      ],
      explanation: 'Nudging costs one forward pass per parameter; backpropagation costs about the same as two forward passes in total, no matter how many parameters there are.',
    },
    {
      kind: 'concept',
      title: 'Computational graphs: a tiny autodiff engine',
      blocks: [
        {
          type: 'p',
          text: 'Every calculation can be drawn as a **[[computational-graph|computational graph]]**: nodes are values, edges say which values were combined to make which. The forward pass fills in the values from the inputs to the loss. The backward pass visits the nodes in **reverse topological order** (every node before the nodes it was computed from), and each node hands its gradient to its parents after multiplying by the local derivative. Two details matter. A node’s gradient is initialized to 0 and each child **adds** its contribution (`+=`), because when a value is used in several places its total effect is the sum of the effects along each path. And the loss node starts with gradient 1. The code below is a complete autodiff engine in about fifty lines (in the style of Andrej Karpathy’s *micrograd*), and then it reproduces the hand calculation above:',
        },
        {
          type: 'code',
          title: 'tiny_autodiff.py',
          runnable: true,
          code: `import math

class Value:
    def __init__(self, data, parents=()):
        self.data, self.grad, self.parents = data, 0.0, parents
        self._backward = lambda: None

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other))
        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other))
        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    def __sub__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return self + other * -1

    def tanh(self):
        t = math.tanh(self.data)
        out = Value(t, (self,))
        def _backward():
            self.grad += (1 - t ** 2) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        order, seen = [], set()
        def visit(v):
            if v not in seen:
                seen.add(v)
                for p in v.parents:
                    visit(p)
                order.append(v)
        visit(self)
        self.grad = 1.0
        for v in reversed(order):
            v._backward()

w, b = Value(3.0), Value(1.0)
x, y = 2.0, 4.0
e = w * x + b - y
loss = e * e
loss.backward()
print(loss.data, w.grad, b.grad)

w, b = Value(3.0), Value(1.0)
loss = (w * x + b).tanh()
loss.backward()
print(f"{loss.data:.6f} {w.grad:.1e} {b.grad:.1e}")`,
          output: `9.0 12.0 6.0
0.999998 6.7e-06 3.3e-06`,
          annotations: [
            { lines: '3-6', text: 'A `Value` is a node in the graph: its number (`data`), its gradient (`grad`, starting at 0), the nodes it was computed from (`parents`), and a small function `_backward` that pushes its gradient to those parents.' },
            { lines: '8-15', text: 'Addition: the output’s gradient flows unchanged to both inputs (the local derivative of `a + b` is 1 for each). Note the `+=`: gradients **accumulate**.' },
            { lines: '17-24', text: 'Multiplication: the gradient flowing to one factor is the *other* factor’s value times the output’s gradient (the product rule).' },
            { lines: '26-28', text: 'Subtraction reuses the operators already defined: `a − b = a + (−1)·b`, so it needs no backward rule of its own.' },
            { lines: '30-36', text: 'A non-linearity: the slope of `tanh` is `1 − tanh²`, and we already computed `tanh` in the forward pass, so we reuse it.' },
            { lines: '38-46', text: 'Build the nodes in **topological order** with a depth-first walk that appends a node only after all its parents.' },
            { lines: '47-49', text: 'Set the loss gradient to 1, then sweep the nodes in reverse order, calling each `_backward`. That single loop is the entire backpropagation algorithm.' },
            { lines: '51-56', text: 'The hand calculation from before, now done by the machine: loss 9, `dL/dw = 12`, `dL/db = 6`, exactly as derived. The expression `w * x + b - y` built the graph automatically as Python evaluated it.' },
            { lines: '58-61', text: 'A cautionary second example: the same neuron with `tanh` and an input that makes the pre-activation 7. `tanh(7)` is already 0.999998 (**saturated**), so the slope is tiny and the gradients are about 10⁻⁶: practically no learning signal. Saturation is exactly why sigmoid and tanh are poor hidden activations in deep networks, as the end of this lesson shows.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'This is what PyTorch does',
          text: 'PyTorch’s `autograd` (next unit) works exactly like this class: tensors record the operations that created them, and `loss.backward()` walks the graph in reverse, accumulating into each parameter’s `.grad`. The real library has hundreds of operations with hand-written backward rules, processes whole arrays instead of single numbers, and runs on GPUs, but the mechanism is the one you just read.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If a variable is used in two different places in a computation, its gradient is the *sum* of the gradient contributions that flow back from each use.',
      answer: true,
      explanation: 'True. This is the multivariate chain rule: a change in the variable affects the loss along every path that uses it, and the total effect is the sum of the effects. That is why the backward functions use `+=` (and why you must zero gradients between training steps in PyTorch).',
    },
    {
      kind: 'concept',
      title: 'Backpropagation through layers',
      blocks: [
        {
          type: 'p',
          text: 'Scalar nodes are great for understanding but slow; real networks apply the same rules to whole matrices at once. Let the incoming gradient from the layer above be `dZ`: the gradient of the loss with respect to this layer’s output, with the same shape as `Z`. For the linear layer `Z = X·W + b`, the chain rule gives three gradients, each with the shape of the thing it is a gradient of (a handy check). For ReLU, the slope is 1 where the input was positive and 0 elsewhere, so it simply *lets the gradient through or blocks it*:',
        },
        {
          type: 'math',
          tex: 'Z = XW + b:\\quad dW = X^{\\top} dZ \\qquad db = \\sum_{\\text{rows}} dZ \\qquad dX = dZ\\, W^{\\top} \\qquad\\qquad A = \\text{ReLU}(Z):\\quad dZ = dA \\odot \\mathbb{1}[Z > 0]',
          caption: 'Backward rules for a linear layer and ReLU. X has shape (batch, n_in), W (n_in, n_out), Z (batch, n_out). dX is passed down to the previous layer; dW and db are used by the optimizer.',
        },
        {
          type: 'p',
          text: 'Chain these rules from the loss to the input and you have the backward pass of a whole network. The code below does it by hand for a two-layer network (3 → 5 → 1 with ReLU and mean squared error), and then proves the formulas right with a **gradient check**: nudge each weight of the first layer by ±10⁻⁶, measure the change of the loss numerically, and compare:',
        },
        {
          type: 'code',
          title: 'backprop_layers.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

rng = np.random.default_rng(0)
X = rng.normal(size=(4, 3))
y = rng.normal(size=(4, 1))
W1, b1 = rng.normal(size=(3, 5)) * 0.5, np.zeros(5)
W2, b2 = rng.normal(size=(5, 1)) * 0.5, np.zeros(1)

def forward(W1):
    z1 = X @ W1 + b1
    h = np.maximum(0, z1)
    out = h @ W2 + b2
    return z1, h, out, np.mean((out - y) ** 2)

z1, h, out, loss = forward(W1)
dout = 2 * (out - y) / len(X)
dW2 = h.T @ dout
db2 = dout.sum(axis=0)
dh = dout @ W2.T
dz1 = dh * (z1 > 0)
dW1 = X.T @ dz1
db1 = dz1.sum(axis=0)
print(dW1.shape, dW2.shape, db1.shape)

num = np.zeros_like(W1)
for i in range(W1.shape[0]):
    for j in range(W1.shape[1]):
        Wp, Wm = W1.copy(), W1.copy()
        Wp[i, j] += 1e-6
        Wm[i, j] -= 1e-6
        num[i, j] = (forward(Wp)[3] - forward(Wm)[3]) / 2e-6
print(np.max(np.abs(num - dW1)) < 1e-6)`,
          output: `(3, 5) (5, 1) (5,)
True`,
          annotations: [
            { lines: '3-7', text: 'A batch of 4 examples with 3 features and a target each, and the two layers’ weights (small random values) and biases (zeros).' },
            { lines: '9-13', text: 'The forward pass. It returns the **intermediate values** (`z1`, `h`) because the backward pass needs them: this is why training uses more memory than inference. The last value is the mean squared error.' },
            { lines: 15, text: 'Run the forward pass once.' },
            { lines: 16, text: 'Start of the backward pass: the derivative of the *mean* squared error with respect to each output is `2·(out − y) / batch_size`.' },
            { lines: '17-18', text: 'Output layer: `dW2 = hᵀ·dout` and `db2` sums over the batch rows.' },
            { lines: '19-20', text: 'Push the gradient back to the hidden layer: through the weights (`dout @ W2ᵀ`), then through the ReLU (multiply by 1 where `z1 > 0`, else 0).' },
            { lines: '21-22', text: 'First layer: `dW1 = Xᵀ·dz1` and `db1`.' },
            { lines: 23, text: 'Each gradient has the shape of its parameter: (3, 5), (5, 1), (5,). If a shape is wrong, the formula is wrong.' },
            { lines: '25-31', text: 'The **gradient check**: for each entry of `W1`, evaluate the loss with that weight nudged up and down by 10⁻⁶ and take the central difference `(L(w+ε) − L(w−ε)) / 2ε`. That is slow (one pair of forward passes per weight) but trustworthy.' },
            { lines: 32, text: '`True`: the hand-derived backward pass matches the numerical gradient to within 10⁻⁶. **Gradient checking is the standard way to test a backward implementation**; you use it to debug custom layers and then turn it off.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'The shape rule',
          text: 'Every gradient has the same shape as the quantity it is the gradient of: `dW` is shaped like `W`, `dX` like `X`. When deriving matrix formulas, you can often recover them just by making the shapes work: `dW` must be `(n_in, n_out)`, and the only product of `X` `(batch, n_in)` and `dZ` `(batch, n_out)` with that shape is `Xᵀ @ dZ`.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the gradient of the weights of a linear layer `Z = X @ W + b`, given the upstream gradient `dZ`.',
      template: `dW = X.___ @ dZ`,
      templateIsCode: true,
      blanks: [{ answers: ['T', 'transpose()'] }],
      wordBank: ['T', 'shape', 'ravel()', 'sum'],
      explanation: '`dW = X.T @ dZ`: `X` is `(batch, n_in)` and `dZ` is `(batch, n_out)`, so `X.T @ dZ` is `(n_in, n_out)`, exactly the shape of `W`. Each weight’s gradient sums, over the batch, (its input) × (the gradient at its output).',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program (the backward rule of ReLU: the gradient passes only where the input was positive).',
      code: `z = [-1.0, 2.0, 0.0, 3.0]
dout = [5.0, 5.0, 5.0, 5.0]
dz = [d * (zi > 0) for d, zi in zip(dout, z)]
print(dz)`,
      answer: '[0.0, 5.0, 0.0, 5.0]',
      hint: '`zi > 0` is True (1) or False (0). Note that 0.0 is not greater than 0.',
      explanation: 'ReLU’s slope is 1 for positive inputs and 0 otherwise (including exactly 0), so the upstream gradient 5.0 passes through for 2.0 and 3.0 and is blocked (0.0) for −1.0 and 0.0. A neuron whose input is always negative receives no gradient at all: the "dead ReLU" problem.',
    },
    {
      kind: 'error',
      prompt: 'This backward function for multiplication is wrong when a value is used more than once in the expression (for example `a * a`). Tap the faulty line(s).',
      lines: [
        'def _backward():',
        '    self.grad = other.data * out.grad',
        '    other.grad = self.data * out.grad',
      ],
      linesAreCode: true,
      errorLines: [2, 3],
      explanation: 'Gradients must **accumulate**: `self.grad += …` and `other.grad += …`. With `=` each contribution overwrites the previous one, so a value used twice keeps only the last path’s gradient instead of the sum. (For `a * a` the gradient should be `2a`, but this version returns `a`.)',
    },
    {
      kind: 'concept',
      title: 'Vanishing and exploding gradients',
      blocks: [
        {
          type: 'p',
          text: 'The backward pass multiplies a local derivative at every layer. A product of many numbers either shrinks toward 0 or grows without bound, unless the factors are near 1. When the gradient reaching the early layers is vanishingly small they barely learn (**[[vanishing-gradient|vanishing gradients]]**); when it is huge the updates blow up (**exploding gradients**, `nan` losses). The sigmoid’s slope is at most 0.25, so a stack of sigmoid layers is the textbook victim:',
        },
        {
          type: 'code',
          title: 'vanishing.py',
          runnable: true,
          code: `import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

print("depth  sigmoid gradient  relu gradient")
for depth in (1, 5, 10, 20):
    a, grad = 0.5, 1.0
    for _ in range(depth):
        a = sigmoid(a)
        grad *= a * (1 - a)
    print(f"{depth:5d}  {grad:16.2e}  {1.0:13.1f}")`,
          output: `depth  sigmoid gradient  relu gradient
    1          2.35e-01            1.0
    5          6.08e-04            1.0
   10          3.48e-07            1.0
   20          1.14e-13            1.0`,
          annotations: [
            { lines: '3-4', text: 'The sigmoid function; its slope is `s·(1 − s)`, a maximum of 0.25 at `z = 0`.' },
            { lines: '7-8', text: 'For several depths, push a number through a chain of sigmoid layers (all weights 1, for simplicity) and keep a running product of the slopes. That product is exactly what the backward pass multiplies through the chain.' },
            { lines: '9-11', text: 'Each layer multiplies the gradient by that layer’s slope `a·(1 − a)`, which is at most 0.25.' },
            { lines: 12, text: 'After 10 sigmoid layers the gradient is 3·10⁻⁷, after 20 layers 10⁻¹³: the first layers receive essentially nothing. The ReLU column is 1.0 at every depth: its slope for positive inputs is exactly 1, so the signal survives (the typical case; negative inputs would be blocked entirely).' },
          ],
        },
        {
          type: 'table',
          headers: ['Problem', 'Symptom', 'Standard remedies'],
          rows: [
            ['**Vanishing gradients**', 'Early layers do not learn; the loss plateaus', 'ReLU-family activations; careful initialization (He/Xavier); normalization layers; **residual (skip) connections**'],
            ['**Exploding gradients**', 'Loss spikes or becomes `nan`; huge weights', '**Gradient clipping** (cap the gradient norm); lower learning rate; careful initialization; normalization'],
            ['**Dead ReLUs**', 'Many neurons always output 0 and never recover', 'Lower learning rate; leaky ReLU; better initialization'],
            ['**Wrong gradients (a bug)**', 'Loss will not go down even on a tiny dataset', 'Gradient check against numerical differentiation; overfit one batch as a sanity test'],
          ],
          caption: 'Most of the deep-learning "tricks" (the next units) exist to keep gradients healthy through many layers.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Two debugging habits worth forming now',
          text: '**Overfit a single small batch first**: a correct network with a sensible learning rate must be able to drive the loss on 8 examples to nearly zero. If it cannot, you have a bug in the model, the loss, or the data pipeline, and no amount of tuning will fix it. And **watch the gradient norms**: gradients that are 10⁻⁸ in the first layers or 10⁸ anywhere are the early warning of the problems in the table above.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'Let `y = (3x + 1)²`. Use the chain rule (outer derivative × inner derivative) to compute `dy/dx` at `x = 1`.',
      answer: '24',
      hint: 'Outer: `d(u²)/du = 2u` with `u = 3x + 1 = 4`. Inner: `du/dx = 3`.',
      explanation: 'With `u = 3x + 1 = 4` at `x = 1`: `dy/dx = 2u · 3 = 2·4·3 = 24`. Backpropagation does just this at every node, multiplying a local derivative into the gradient arriving from above.',
      label: 'dy/dx:',
    },
    {
      kind: 'code',
      prompt: 'Write `relu_backward(dout, z)` for NumPy arrays: return the gradient with respect to the ReLU’s input `z`, given the upstream gradient `dout` (same shape). The gradient passes where `z > 0` and is 0 elsewhere (including `z == 0`). Do not modify the inputs.',
      starter: `import numpy as np

def relu_backward(dout, z):
    ...
`,
      solution: `import numpy as np


def relu_backward(dout, z):
    dout = np.asarray(dout, dtype=float)
    z = np.asarray(z, dtype=float)
    return dout * (z > 0)
`,
      tests: `import numpy as np

z = np.array([-1.0, 2.0, 0.0, 3.0])
d = np.array([5.0, 5.0, 5.0, 5.0])
out = relu_backward(d, z)
assert isinstance(out, np.ndarray) and out.shape == (4,)
assert np.array_equal(out, [0.0, 5.0, 0.0, 5.0])

z2 = np.array([[1.0, -2.0], [-3.0, 4.0]])
d2 = np.array([[10.0, 20.0], [30.0, 40.0]])
assert np.array_equal(relu_backward(d2, z2), [[10.0, 0.0], [0.0, 40.0]])

assert np.array_equal(relu_backward(np.array([1.0, 2.0]), np.array([0.0, 0.0])), [0.0, 0.0])
assert np.array_equal(relu_backward([1.0, 2.0], [1.0, -1.0]), [1.0, 0.0])
z3, d3 = z2.copy(), d2.copy()
relu_backward(d2, z2)
assert np.array_equal(z2, z3) and np.array_equal(d2, d3)
rng = np.random.default_rng(0)
zz = rng.normal(size=(6, 4))
dd = rng.normal(size=(6, 4))
assert np.array_equal(relu_backward(dd, zz), np.where(zz > 0, dd, 0.0))`,
      packages: ['numpy'],
      checks: ['Passes the upstream gradient where `z > 0` and returns 0 elsewhere (including `z == 0`)', 'Works for any shape and for plain lists', 'Does not modify its inputs'],
      hint: 'The local derivative of ReLU is the boolean mask `z > 0` (1 where true, 0 where false). Multiply `dout` by it.',
      explanation: 'One line of real content, but it is exactly what `torch.nn.ReLU` does on the backward pass. The mask `z > 0` is why frameworks must remember each layer’s input (or output) from the forward pass: without it the backward pass cannot be computed.',
    },
    {
      kind: 'code',
      prompt: 'Write `linear_backward(X, W, dZ)` for the layer `Z = X @ W + b` with `X` `(batch, n_in)`, `W` `(n_in, n_out)`, and the upstream gradient `dZ` `(batch, n_out)`. Return the tuple `(dX, dW, db)`: `dX = dZ @ W.T`, `dW = X.T @ dZ`, `db = dZ.sum(axis=0)`.',
      starter: `import numpy as np

def linear_backward(X, W, dZ):
    ...
`,
      solution: `import numpy as np


def linear_backward(X, W, dZ):
    X = np.asarray(X, dtype=float)
    W = np.asarray(W, dtype=float)
    dZ = np.asarray(dZ, dtype=float)
    dX = dZ @ W.T
    dW = X.T @ dZ
    db = dZ.sum(axis=0)
    return dX, dW, db
`,
      tests: `import numpy as np

rng = np.random.default_rng(0)
X = rng.normal(size=(4, 3))
W = rng.normal(size=(3, 2))
dZ = rng.normal(size=(4, 2))
dX, dW, db = linear_backward(X, W, dZ)
assert dX.shape == (4, 3) and dW.shape == (3, 2) and db.shape == (2,)
assert np.allclose(dX, dZ @ W.T) and np.allclose(dW, X.T @ dZ) and np.allclose(db, dZ.sum(axis=0))

# gradient check on the loss L = sum(dZ * (X @ W + b))
b = np.zeros(2)
def loss(Wm):
    return float(np.sum(dZ * (X @ Wm + b)))
eps = 1e-6
for i in range(3):
    for j in range(2):
        Wp, Wm = W.copy(), W.copy()
        Wp[i, j] += eps
        Wm[i, j] -= eps
        assert abs((loss(Wp) - loss(Wm)) / (2 * eps) - dW[i, j]) < 1e-5

X1 = np.array([[1.0, 2.0]])
dX1, dW1, db1 = linear_backward(X1, np.zeros((2, 3)), np.array([[1.0, 0.0, -1.0]]))
assert np.allclose(dW1, [[1.0, 0.0, -1.0], [2.0, 0.0, -2.0]])
assert np.allclose(db1, [1.0, 0.0, -1.0]) and np.allclose(dX1, 0.0)

Xc, Wc, dc = X.copy(), W.copy(), dZ.copy()
linear_backward(X, W, dZ)
assert np.array_equal(X, Xc) and np.array_equal(W, Wc) and np.array_equal(dZ, dc)`,
      packages: ['numpy'],
      checks: ['`dX = dZ @ W.T`, `dW = X.T @ dZ` and `db = dZ.sum(axis=0)`, each with the right shape', 'The gradients agree with a numerical check of the loss `sum(dZ * (X @ W + b))`', 'Does not modify its inputs'],
      hint: 'Match the shapes: `dW` must be `(n_in, n_out)`, which is `X.T @ dZ`; `dX` must be `(batch, n_in)`, which is `dZ @ W.T`; the bias gradient sums `dZ` over the batch axis.',
      explanation: 'These three lines are the backward pass of every fully connected layer ever trained. `dX` is handed to the previous layer, which treats it as *its* upstream gradient, and the chain continues down to the input. Repeating this layer by layer is all that "backpropagation" means for an MLP.',
    },
    {
      kind: 'code',
      prompt: 'Write `numerical_gradient(f, x, eps=1e-5)` returning the central-difference gradient of the scalar function `f` at the NumPy array `x` (any shape): for every entry, `(f(x + eps·e) − f(x − eps·e)) / (2·eps)`. The result has the shape of `x`; `x` itself must be left unchanged.',
      starter: `import numpy as np

def numerical_gradient(f, x, eps=1e-5):
    ...
`,
      solution: `import numpy as np


def numerical_gradient(f, x, eps=1e-5):
    x = np.asarray(x, dtype=float)
    grad = np.zeros_like(x)
    for idx in np.ndindex(x.shape):
        plus, minus = x.copy(), x.copy()
        plus[idx] += eps
        minus[idx] -= eps
        grad[idx] = (f(plus) - f(minus)) / (2 * eps)
    return grad
`,
      tests: `import numpy as np

x = np.array([1.0, -2.0, 3.0])
g = numerical_gradient(lambda v: float(np.sum(v ** 2)), x)
assert g.shape == (3,) and np.allclose(g, 2 * x, atol=1e-6)
assert np.array_equal(x, [1.0, -2.0, 3.0])

A = np.array([[1.0, 2.0], [3.0, 4.0]])
g2 = numerical_gradient(lambda M: float(np.sum(M ** 3)), A)
assert g2.shape == (2, 2) and np.allclose(g2, 3 * A ** 2, atol=1e-4)

f = lambda v: float(v[0] * v[1] + np.sin(v[2]))
v = np.array([2.0, 5.0, 0.5])
g3 = numerical_gradient(f, v)
assert np.allclose(g3, [5.0, 2.0, np.cos(0.5)], atol=1e-6)

assert np.allclose(numerical_gradient(lambda v: 7.0, np.array([1.0, 2.0])), [0.0, 0.0])
g4 = numerical_gradient(lambda v: float(v @ v), np.array([[0.0]]).reshape(1))
assert np.allclose(g4, [0.0])
assert np.allclose(numerical_gradient(lambda v: float(np.sum(v ** 2)), [1.0, 2.0]), [2.0, 4.0], atol=1e-6)

calls = []
numerical_gradient(lambda v: calls.append(1) or 0.0, np.zeros((2, 3)))
assert len(calls) == 12`,
      packages: ['numpy'],
      checks: ['Returns the central-difference gradient with the same shape as `x`', 'Works for 1-D and 2-D arrays and accepts plain lists; `x` is not modified', 'Evaluates `f` exactly twice per entry of `x`'],
      hint: 'Loop over every index with `np.ndindex(x.shape)`. For each, copy `x` twice, add `eps` to one copy and subtract it from the other at that index, and store `(f(plus) - f(minus)) / (2 * eps)`.',
      explanation: 'This is the same check as in the lesson’s code, packaged for reuse: PyTorch ships it as `torch.autograd.gradcheck`. It costs `2·size` evaluations of `f`, so use it on tiny inputs while developing a custom backward function, not during training.',
    },
  ],
  takeaways: [
    '**Backpropagation** is the chain rule applied backward through the computational graph: one forward pass stores the intermediate values, then one backward sweep multiplies local derivatives to give the gradient of the loss with respect to **every** parameter at about twice the cost of the forward pass.',
    'In a graph, each node’s gradient is the **sum** over every use of the node (`+=`), and the loss node starts at 1. A short autodiff class with `__add__`, `__mul__` and a reverse topological sweep is the whole idea; PyTorch’s autograd is the industrial version.',
    'For a linear layer `Z = XW + b`: `dW = Xᵀ·dZ`, `db = ΣdZ`, `dX = dZ·Wᵀ`; for ReLU: `dZ = dA ⊙ (Z > 0)`. Each gradient has the shape of its variable.',
    '**Gradient checking** against central differences `(f(x+ε) − f(x−ε)) / 2ε` validates any backward implementation; another sanity test is to overfit a single tiny batch.',
    '**Vanishing gradients** (sigmoid/tanh stacks, saturation) and **exploding gradients** come from multiplying many local derivatives. ReLU, good initialization, normalization, residual connections and gradient clipping keep gradients healthy.',
  ],
  reading: [
    { title: '3Blue1Brown: Backpropagation, intuitively (Deep Learning chapter 3)', url: 'https://www.youtube.com/watch?v=Ilg3gGewQ5U', source: 'video', note: 'A visual walk-through of how the error flows backward through the network.' },
    { title: 'Andrej Karpathy: The spelled-out intro to neural networks and backpropagation (micrograd)', url: 'https://www.youtube.com/watch?v=VMj-3S1tku0', source: 'video', note: 'Builds the tiny autodiff engine of this lesson from nothing; superb.' },
    { title: 'Michael Nielsen: How the backpropagation algorithm works', url: 'https://neuralnetworksanddeeplearning.com/chap2.html', source: 'book', note: 'The four fundamental equations of backprop with proofs; free online.' },
    { title: 'Rumelhart, Hinton and Williams (1986): Learning representations by back-propagating errors', url: 'https://www.nature.com/articles/323533a0', source: 'paper', note: 'The classic paper that popularized backpropagation.' },
  ],
};
