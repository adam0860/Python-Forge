import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-neurons',
  title: 'Neurons, Layers and Activation Functions',
  summary: 'The building block of every neural network: a weighted sum followed by a non-linearity. See why a single neuron cannot solve XOR, why activation functions are essential, and how layers become matrix multiplications.',
  minutes: 22,
  objectives: [
    'Describe an artificial neuron as a weighted sum plus bias passed through an activation function',
    'Explain why stacking purely linear layers adds nothing, and why non-linear activations fix it',
    'Compare sigmoid, tanh and ReLU, and choose an output activation for regression, binary and multi-class tasks',
    'Express a layer as `activation(X @ W + b)` and track the shapes through a multilayer network',
    'Count the parameters of a fully connected network',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The artificial neuron',
      blocks: [
        {
          type: 'p',
          text: 'An artificial **[[neuron]]** is a tiny function. It takes several numbers `x₁ … xₙ`, multiplies each by a **weight** `wᵢ` (how much that input matters), adds them up together with a **bias** `b` (how easily the neuron fires), and passes the total `z` through an **[[activation-function|activation function]]** `f`: `output = f(w·x + b)`. The weights and the bias are the neuron’s [[parameter|parameters]]: training a network means finding good values for them. You already know the first half of this formula: it is exactly linear regression. The new ingredient is the activation function.',
        },
        {
          type: 'math',
          tex: 'z = \\sum_{i=1}^{n} w_i x_i + b = \\mathbf{w}\\cdot\\mathbf{x} + b \\qquad\\qquad a = f(z)',
          caption: 'The whole neuron: a weighted sum z (the pre-activation) and an activation f(z) (the output, often written a).',
        },
        {
          type: 'p',
          text: 'The earliest activation was a hard **step**: output 1 if `z > 0`, else 0. That is Frank Rosenblatt’s **[[perceptron]]**. With suitable weights one neuron can behave like a logic gate. Below, weights `[1, 1]` and bias `−1.5` make it fire only when *both* inputs are 1 (an AND gate). Then the step is replaced by the smooth **[[sigmoid]]**, which turns the same `z` into a graded value between 0 and 1:',
        },
        {
          type: 'code',
          title: 'neuron.py',
          runnable: true,
          code: `import math

def neuron(x, w, b, act):
    z = sum(xi * wi for xi, wi in zip(x, w)) + b
    return act(z)

step = lambda z: 1 if z > 0 else 0
sigmoid = lambda z: 1 / (1 + math.exp(-z))

print("AND gate")
for x in [(0, 0), (0, 1), (1, 0), (1, 1)]:
    print(x, neuron(x, [1, 1], -1.5, step))
print("sigmoid neuron")
for z_in in [(0, 0), (1, 1), (3, 3)]:
    print(z_in, round(neuron(z_in, [1, 1], -1.5, sigmoid), 3))`,
          output: `AND gate
(0, 0) 0
(0, 1) 0
(1, 0) 0
(1, 1) 1
sigmoid neuron
(0, 0) 0.182
(1, 1) 0.622
(3, 3) 0.989`,
          annotations: [
            { lines: '3-5', text: 'The whole neuron in three lines: the weighted sum plus the bias, then the activation function `act` applied to it. The activation is passed in as a function, because swapping it is the main design choice.' },
            { lines: '7-8', text: 'Two activations: the hard step of the original perceptron, and the sigmoid `1 / (1 + e^−z)`, which squashes any number into the interval (0, 1).' },
            { lines: '10-12', text: 'Weights `[1, 1]`, bias `−1.5`. The weighted sum is 0, 1 or 2, minus 1.5: it is positive only for the input (1, 1). One neuron has become an AND gate.' },
            { lines: '13-15', text: 'The same weights with a sigmoid give a smooth confidence rather than a hard 0/1: 0.18 for (0, 0) up to 0.99 for (3, 3). Smoothness matters because training needs a *slope* to follow (the next lessons), and a step has none.' },
          ],
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'From brain cells to a billion parameters',
          text: 'Warren McCulloch and Walter Pitts proposed a mathematical neuron in 1943; Rosenblatt built the perceptron (a learning machine for it) in 1958. In 1969 Marvin Minsky and Seymour Papert proved that a single perceptron cannot compute XOR, which helped trigger the first "AI winter". Multilayer networks trained by **backpropagation** (popularized in 1986) overcame the limit, and the GPU-powered deep learning boom began around 2012. The brain was an inspiration, not a blueprint: modern networks bear little resemblance to biological neurons.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In the neuron `a = f(w·x + b)`, what is the job of the bias `b`?',
      options: [
        { text: 'It shifts the threshold at which the neuron activates, independent of the inputs', correct: true, why: 'Without it the weighted sum is forced to 0 when all inputs are 0. The bias lets the neuron fire earlier or later (as in the AND gate, where −1.5 sets the threshold).' },
        { text: 'It scales how strongly each input matters', why: 'That is the job of the weights, one per input. The bias is a single number added once.' },
        { text: 'It makes the output non-linear', why: 'Non-linearity comes from the activation function `f`, not from adding a constant.' },
        { text: 'It counts how many inputs the neuron has', why: 'The number of inputs is set by the length of the weight vector, not by the bias.' },
      ],
      explanation: 'Weights scale the inputs, the bias shifts the whole sum, and the activation function adds non-linearity. All three are needed for a useful neuron.',
    },
    {
      kind: 'concept',
      title: 'Why we need non-linearity (and the XOR problem)',
      blocks: [
        {
          type: 'p',
          text: 'A neuron with a linear (or no) activation can only draw a straight line through its inputs. That is a serious limit: the **[[xor-problem|XOR problem]]** (output 1 when exactly one of the two inputs is 1) cannot be solved by any single neuron, since no straight line separates {(0,1), (1,0)} from {(0,0), (1,1)}. Stacking more neurons helps, but *only if they are non-linear*. Two linear layers collapse into one: `(X @ W1) @ W2 = X @ (W1 @ W2)`, and the product `W1 @ W2` is just another matrix. A hundred stacked linear layers are exactly as powerful as one.',
        },
        {
          type: 'code',
          title: 'linear_collapse.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

rng = np.random.default_rng(0)
X = rng.normal(size=(5, 3))
W1, W2 = rng.normal(size=(3, 4)), rng.normal(size=(4, 2))
two_layers = (X @ W1) @ W2
one_layer = X @ (W1 @ W2)
print(np.allclose(two_layers, one_layer), (W1 @ W2).shape)

relu = lambda z: np.maximum(0, z)
with_relu = relu(X @ W1) @ W2
print(np.allclose(with_relu, one_layer))`,
          output: `True (3, 2)
False`,
          annotations: [
            { lines: '3-5', text: 'Five random 3-feature examples and two random weight matrices: 3 → 4 and 4 → 2.' },
            { lines: '6-8', text: 'Applying the two layers one after the other gives *exactly* the same answer as a single layer whose matrix is the product `W1 @ W2` (shape 3 × 2). The "deep" network was secretly shallow.' },
            { lines: '10-12', text: 'Insert a ReLU (`max(0, z)`) between the layers and the equality breaks: the network now computes something no single matrix can. **Non-linear activations are what give depth its power.**' },
          ],
        },
        {
          type: 'p',
          text: 'And here is XOR solved by a tiny network whose weights I chose by hand. Two hidden neurons use ReLU (`max(0, z)`), and the output neuron combines them:',
        },
        {
          type: 'code',
          title: 'xor_net.py',
          runnable: true,
          code: `def relu(z):
    return max(0, z)

def xor_net(x1, x2):
    h1 = relu(x1 + x2)
    h2 = relu(x1 + x2 - 1)
    return h1 - 2 * h2

for x1 in (0, 1):
    for x2 in (0, 1):
        print(x1, x2, "->", xor_net(x1, x2))`,
          output: `0 0 -> 0
0 1 -> 1
1 0 -> 1
1 1 -> 0`,
          annotations: [
            { lines: '1-2', text: 'ReLU, the "rectified linear unit": pass positive values through and clip negatives to zero.' },
            { lines: '5-6', text: 'The **hidden layer**: `h1` counts how many inputs are on (0, 1 or 2), and `h2` becomes positive only when *both* are on (it equals 1 for the input (1, 1) and 0 otherwise).' },
            { lines: 7, text: 'The output neuron: `h1 − 2·h2`. For one active input it gives 1 − 0 = 1; for two active inputs it gives 2 − 2·1 = 0. The `h2` neuron "subtracts back" the (1, 1) case that a single line could not exclude.' },
            { lines: '9-11', text: 'The table is exactly XOR. Two layers with a non-linearity solve what no single neuron can. Training a network just means finding such weights automatically, instead of by hand.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Universal approximation',
          text: 'A famous result (Cybenko 1989, Hornik 1991) says that a network with just **one hidden layer** and enough neurons can approximate *any* reasonable continuous function to any accuracy. The theorem says such a network exists, not that it is easy to find or efficient: in practice, **deeper** networks reach the same accuracy with far fewer neurons and learn better features layer by layer, which is why we stack many layers.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A network made of ten fully connected layers with *no* activation functions between them is no more expressive than a single linear layer.',
      answer: true,
      explanation: 'True. Each layer is a matrix multiplication, and a product of matrices is a single matrix: ten linear layers collapse into one. Non-linear activations between the layers are what let depth add expressive power.',
    },
    {
      kind: 'concept',
      title: 'Activation functions',
      blocks: [
        {
          type: 'p',
          text: 'Which non-linearity should you use? The three classics, plotted together:',
        },
        {
          type: 'graph',
          caption: 'Sigmoid squashes to (0, 1); tanh squashes to (−1, 1) and is centred on zero; ReLU is zero for negatives and the identity for positives. Sigmoid and tanh flatten out at both ends, which is where learning stalls (the slope there is nearly zero).',
          x: [-4, 4],
          y: [-1.3, 2.5],
          functions: [
            { expr: '1/(1+exp(-x))', label: 'sigmoid', color: 'blue' },
            { expr: '(exp(x)-exp(-x))/(exp(x)+exp(-x))', label: 'tanh', color: 'green' },
            { expr: '(x+sqrt(x^2))/2', label: 'ReLU', color: 'red' },
          ],
          height: 320,
        },
        {
          type: 'table',
          headers: ['Activation', 'Formula', 'Used for', 'Notes'],
          rows: [
            ['**ReLU**', 'max(0, z)', 'Hidden layers (the default)', 'Cheap, and its slope is 1 for positives, so gradients flow. A neuron stuck at z < 0 gets slope 0 and can "die"'],
            ['**Leaky ReLU / GELU**', 'small slope for z < 0 / smooth ReLU', 'Hidden layers (GELU in transformers)', 'Avoid dead neurons; slightly smoother'],
            ['**Sigmoid**', '1 / (1 + e⁻ᶻ)', 'Output of a binary classifier (a probability)', 'Slope at most 0.25 and near zero at the ends: poor for deep hidden layers (vanishing gradients)'],
            ['**Tanh**', '(eᶻ − e⁻ᶻ)/(eᶻ + e⁻ᶻ)', 'Recurrent networks, some bounded outputs', 'Zero-centred, still saturates at the ends'],
            ['**[[softmax]]**', 'eᶻⁱ / Σ eᶻʲ', 'Output of a multi-class classifier', 'Turns a vector of scores into probabilities that sum to 1'],
            ['**Linear (none)**', 'z', 'Output of a regression network', 'The output can be any real number'],
          ],
          caption: 'A practical cheat sheet. Hidden layers: ReLU first, unless you have a reason. The *output* activation is dictated by the task.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Match the output layer to the task',
          text: '**Regression** (predict a score): one output, *no* activation. **Binary classification**: one output with sigmoid. **Multi-class classification**: one output per class with softmax. **A game agent choosing among 6 actions**: 6 outputs, softmax for a probabilistic policy or linear for action-value estimates. (In PyTorch you will usually leave the final sigmoid/softmax *out* of the model and let the loss function apply it, for numerical stability.)',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Why vanishing gradients happen',
          text: 'Training adjusts each weight using the slope of the activation (the chain rule: gradients are *products* of slopes layer by layer). The sigmoid’s slope never exceeds 0.25, so ten sigmoid layers multiply ten numbers below 0.25: a factor of about 10⁻⁶, and the early layers barely learn. ReLU’s slope of exactly 1 for positive inputs keeps the product from shrinking, one of the main reasons deep networks became trainable. The next-but-one lesson, on backpropagation, makes this precise.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Layers, shapes and parameter counts',
      blocks: [
        {
          type: 'p',
          text: 'A single neuron is a dot product; a **layer** of neurons is many dot products at once: a matrix multiplication. For a batch `X` of shape `(batch, n_in)`, a layer with weight matrix `W` of shape `(n_in, n_out)` and bias `b` of shape `(n_out,)` computes `activation(X @ W + b)`, shape `(batch, n_out)`. Chaining layers gives the **[[mlp|multilayer perceptron (MLP)]]**, the classic fully connected network: the **input layer** (just the data), one or more **[[hidden-layer|hidden layers]]**, and an **output layer**. Computing the output from the input is the **[[forward-pass|forward pass]]**. The code below builds a 4 → 8 → 8 → 3 network with random weights and follows the shapes through:',
        },
        {
          type: 'code',
          title: 'mlp_shapes.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

sizes = [4, 8, 8, 3]
rng = np.random.default_rng(0)
params = [(rng.normal(size=(m, n)) * np.sqrt(2 / m), np.zeros(n)) for m, n in zip(sizes, sizes[1:])]
x = rng.normal(size=(5, 4))
for i, (W, b) in enumerate(params):
    x = x @ W + b
    if i < len(params) - 1:
        x = np.maximum(0, x)
    print("layer", i, "W", W.shape, "b", b.shape, "->", x.shape)
print("parameters:", sum(W.size + b.size for W, b in params))
e = np.exp(x - x.max(axis=1, keepdims=True))
p = e / e.sum(axis=1, keepdims=True)
print(np.round(p.sum(axis=1), 3))`,
          output: `layer 0 W (4, 8) b (8,) -> (5, 8)
layer 1 W (8, 8) b (8,) -> (5, 8)
layer 2 W (8, 3) b (3,) -> (5, 3)
parameters: 139
[1. 1. 1. 1. 1.]`,
          annotations: [
            { lines: 3, text: 'Layer sizes: 4 inputs, two hidden layers of 8 neurons, 3 outputs (say, three classes).' },
            { lines: '4-5', text: 'One `(W, b)` pair per consecutive pair of sizes: `W` has shape `(inputs, outputs)`, `b` is zeros. The weights are random normal numbers scaled by `√(2/m)` (He initialization), which keeps the signal’s size steady through ReLU layers; we return to initialization later.' },
            { lines: 6, text: 'A batch of five examples with four features each.' },
            { lines: '7-11', text: 'The forward pass: multiply and add the bias in each layer, apply ReLU in every layer except the last (the output stays linear: raw scores called **logits**), and print the shapes. The batch dimension 5 is untouched; the feature dimension goes 4 → 8 → 8 → 3.' },
            { lines: 12, text: 'Parameter count: (4·8 + 8) + (8·8 + 8) + (8·3 + 3) = 40 + 72 + 27 = **139**. For a layer, `n_in × n_out` weights plus `n_out` biases.' },
            { lines: '13-15', text: 'Softmax on the logits turns each row of three scores into probabilities. Subtracting the row maximum first prevents overflow in `exp`. Each row sums to 1.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Shape errors are the #1 bug',
          text: 'Most neural-network bugs are shape mismatches. Habit: write the shape in a comment next to each tensor, `# (batch, 8)`. The inner dimensions must agree in `X @ W` (the last of `X` equals the first of `W`), and the bias broadcasts across the batch. If you see "mat1 and mat2 shapes cannot be multiplied", you have `W` the wrong way round (a classic: PyTorch’s `nn.Linear` stores its weight as `(n_out, n_in)` and transposes internally).',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Like a chain of matrix-vector products',
          text: 'If you have written a vertex transform in C++ or a shader, this is the same machinery: a layer is a matrix-vector multiply followed by a per-element function, just in much higher dimensions and with the matrices *learned* instead of designed. The performance-minded reading: a forward pass is dominated by large matrix multiplications, which is exactly the workload GPUs do best.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the ReLU activation for a whole array: keep positive values and replace negative values with 0.',
      template: `h = np.___(0, X @ W + b)`,
      templateIsCode: true,
      blanks: [{ answers: ['maximum'] }],
      wordBank: ['maximum', 'max', 'minimum', 'abs'],
      explanation: '`np.maximum(0, z)` compares element by element and keeps the larger of the two, which is exactly ReLU. (`np.max` would instead collapse the whole array to one number.)',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `w = [2, -1]
x = [1, 3]
b = 0.5
z = sum(wi * xi for wi, xi in zip(w, x)) + b
print(z, max(0, z))`,
      answer: '-0.5 0',
      hint: 'First the weighted sum: 2·1 + (−1)·3, then add the bias. Then ReLU clips negatives to 0.',
      explanation: 'The weighted sum is 2 − 3 = −1, plus the bias 0.5 gives z = −0.5. ReLU of a negative number is 0, so this neuron outputs 0 (it is "off" for this input).',
    },
    {
      kind: 'error',
      prompt: 'This code should apply a layer from 4 inputs to 8 outputs to a batch of 5 examples, but it crashes with a shape error. Tap the faulty line.',
      lines: [
        'X = np.zeros((5, 4))',
        'W = np.zeros((8, 4))',
        'out = np.maximum(0, X @ W + b)',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The weight matrix must be `(n_in, n_out) = (4, 8)`. With shape `(8, 4)` the inner dimensions of `X @ W` (4 and 8) do not match. (If your weights are stored as `(n_out, n_in)`, as in PyTorch, you multiply by `W.T`.)',
    },
    {
      kind: 'concept',
      title: 'Counting parameters, and what comes next',
      blocks: [
        {
          type: 'p',
          text: 'The parameter count of a fully connected network is the sum over layers of `n_in × n_out + n_out`. It tells you the model’s size in memory (4 bytes per float32 parameter) and its capacity to overfit. A network for 28×28 handwritten digits (784 inputs) with one hidden layer of 128 neurons and 10 outputs has about 100,000 parameters, tiny by modern standards: large language models have hundreds of billions.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Neuron', text: 'A weighted sum plus bias, then an activation: `a = f(w·x + b)`.' },
            { title: 'Layer', text: 'Many neurons side by side: `activation(X @ W + b)`.' },
            { title: 'Network', text: 'Layers chained, with a non-linearity between them (ReLU in hidden layers, an output activation suited to the task).' },
            { title: 'Learning', text: 'Choose a loss that measures the error, then adjust every weight and bias downhill: gradient descent and backpropagation, the next two lessons.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Right now the weights are just random',
          text: 'Everything above was a *forward pass* with arbitrary weights (or hand-picked ones for XOR). A network with random weights is a random function. The remaining question, and the heart of deep learning, is how to find the right weights automatically from data. That takes a way to measure how wrong the network is (a **loss function**) and a way to improve it (**gradient descent**).',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'How many parameters (weights and biases) does a fully connected network with layer sizes 784 → 128 → 10 have?',
      answer: '101770',
      hint: 'Layer 1: 784·128 weights + 128 biases. Layer 2: 128·10 weights + 10 biases. Add them.',
      explanation: 'Layer 1: 784 × 128 = 100,352 weights + 128 biases = 100,480. Layer 2: 128 × 10 = 1,280 weights + 10 biases = 1,290. Total 100,480 + 1,290 = 101,770.',
      label: 'Parameters:',
    },
    {
      kind: 'code',
      prompt: 'Write `neuron(x, w, b, activation="relu")` returning the output of one neuron: the weighted sum `sum(w·x) + b` passed through the named activation. Supported activations: `"relu"` (`max(0, z)`), `"sigmoid"` (`1 / (1 + e^−z)`), `"tanh"` and `"linear"` (no change). Raise `ValueError` for any other name.',
      starter: `import math

def neuron(x, w, b, activation="relu"):
    ...
`,
      solution: `import math


def neuron(x, w, b, activation="relu"):
    z = sum(xi * wi for xi, wi in zip(x, w)) + b
    if activation == "relu":
        return max(0.0, z)
    if activation == "sigmoid":
        if z >= 0:
            return 1 / (1 + math.exp(-z))
        e = math.exp(z)
        return e / (1 + e)
    if activation == "tanh":
        return math.tanh(z)
    if activation == "linear":
        return z
    raise ValueError(f"unknown activation: {activation!r}")
`,
      tests: `import math

assert neuron([1, 3], [2, -1], 0.5) == 0.0
assert neuron([1, 3], [2, -1], 0.5, "linear") == -0.5
assert neuron([2, 2], [1, 1], 1, "relu") == 5
assert abs(neuron([0, 0], [1, 1], 0, "sigmoid") - 0.5) < 1e-12
assert abs(neuron([1, 1], [1, 1], -1.5, "sigmoid") - 0.6224593312018546) < 1e-12
assert abs(neuron([1, 2], [0.5, 0.25], 0.0, "tanh") - math.tanh(1.0)) < 1e-12
assert neuron([], [], 3.0, "linear") == 3.0
assert 0 <= neuron([-800], [1], 0, "sigmoid") < 1e-300
assert neuron([800], [1], 0, "sigmoid") == 1.0
assert neuron([5], [-1], 0) == 0

try:
    neuron([1], [1], 0, "swish")
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")`,
      checks: ['Computes `sum(w·x) + b` and applies relu / sigmoid / tanh / linear', 'Sigmoid does not overflow for large positive or negative `z`', 'Raises `ValueError` for an unknown activation name'],
      hint: 'Compute `z = sum(xi * wi for xi, wi in zip(x, w)) + b` first, then branch on `activation`. For a numerically safe sigmoid use `1 / (1 + exp(-z))` when `z >= 0` and `exp(z) / (1 + exp(z))` otherwise.',
      explanation: 'A neuron really is this small. The only subtle point is numerical: `math.exp(800)` overflows, so a production sigmoid evaluates the form that only ever exponentiates a *non-positive* number. Deep-learning libraries do the same, which is why they provide fused, stable versions of sigmoid and softmax.',
    },
    {
      kind: 'code',
      prompt: 'Write `count_parameters(layer_sizes)` returning the number of weights and biases in a fully connected network with those layer sizes, e.g. `[4, 8, 8, 3]` gives 139. Every layer has `n_in × n_out` weights plus `n_out` biases. A list with fewer than two sizes has no layers: return 0.',
      starter: `def count_parameters(layer_sizes):
    ...
`,
      solution: `def count_parameters(layer_sizes):
    total = 0
    for n_in, n_out in zip(layer_sizes, layer_sizes[1:]):
        total += n_in * n_out + n_out
    return total
`,
      tests: `assert count_parameters([4, 8, 8, 3]) == 139
assert count_parameters([784, 128, 10]) == 101770
assert count_parameters([2, 1]) == 3
assert count_parameters([3]) == 0
assert count_parameters([]) == 0
assert count_parameters([2, 2, 1]) == 9
assert count_parameters((10, 10, 10)) == 220
sizes = [5, 6, 7]
count_parameters(sizes)
assert sizes == [5, 6, 7]
assert isinstance(count_parameters([1, 1]), int)`,
      checks: ['Each layer contributes `n_in * n_out + n_out`', 'Fewer than two sizes gives 0', 'Works for lists and tuples and does not modify its input'],
      hint: 'Loop over consecutive pairs with `zip(layer_sizes, layer_sizes[1:])` and add `n_in * n_out + n_out` for each.',
      explanation: 'Counting parameters is a useful sanity check when you build a model (PyTorch can report it for you): it tells you the model’s memory footprint and warns you about networks big enough to overfit a small dataset.',
    },
    {
      kind: 'code',
      prompt: 'Write `layer_forward(X, W, b, activation="relu")` for NumPy arrays: `X` has shape `(batch, n_in)`, `W` `(n_in, n_out)`, `b` `(n_out,)`. Return `activation(X @ W + b)` with shape `(batch, n_out)`. Activations: `"relu"`, `"sigmoid"`, `"tanh"`, `"linear"` and `"softmax"` (row-wise: each row sums to 1; subtract the row maximum for stability). Raise `ValueError` for any other name.',
      starter: `import numpy as np

def layer_forward(X, W, b, activation="relu"):
    ...
`,
      solution: `import numpy as np


def layer_forward(X, W, b, activation="relu"):
    z = np.asarray(X, dtype=float) @ np.asarray(W, dtype=float) + np.asarray(b, dtype=float)
    if activation == "relu":
        return np.maximum(0.0, z)
    if activation == "sigmoid":
        return 1.0 / (1.0 + np.exp(-np.clip(z, -500, 500)))
    if activation == "tanh":
        return np.tanh(z)
    if activation == "linear":
        return z
    if activation == "softmax":
        e = np.exp(z - z.max(axis=1, keepdims=True))
        return e / e.sum(axis=1, keepdims=True)
    raise ValueError(f"unknown activation: {activation!r}")
`,
      tests: `import numpy as np

X = np.array([[1.0, 2.0], [-1.0, 0.5], [0.0, 0.0]])
W = np.array([[1.0, -1.0, 0.5], [0.5, 2.0, -1.0]])
b = np.array([0.0, 1.0, -0.5])

z = X @ W + b
assert np.allclose(layer_forward(X, W, b, "linear"), z)
out = layer_forward(X, W, b)
assert out.shape == (3, 3) and np.allclose(out, np.maximum(0, z))
assert np.all(out >= 0)
assert np.allclose(layer_forward(X, W, b, "tanh"), np.tanh(z))
assert np.allclose(layer_forward(X, W, b, "sigmoid"), 1 / (1 + np.exp(-z)))

s = layer_forward(X, W, b, "softmax")
assert s.shape == (3, 3) and np.allclose(s.sum(axis=1), 1.0) and np.all(s > 0)
assert np.allclose(s[2], np.exp(z[2]) / np.exp(z[2]).sum())

big = layer_forward(np.array([[1000.0, 0.0]]), np.eye(2), np.zeros(2), "softmax")
assert np.allclose(big, [[1.0, 0.0]])
assert np.all(np.isfinite(layer_forward(np.array([[-1000.0]]), np.eye(1), np.zeros(1), "sigmoid")))

try:
    layer_forward(X, W, b, "swish")
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")

X0 = X.copy()
layer_forward(X, W, b)
assert np.array_equal(X, X0)`,
      packages: ['numpy'],
      checks: ['Computes `activation(X @ W + b)` for the whole batch, shape `(batch, n_out)`', 'Softmax is row-wise, sums to 1 and survives huge inputs; sigmoid does not overflow', 'Raises `ValueError` for an unknown activation and does not modify its inputs'],
      hint: 'Compute `z = X @ W + b` once, then branch. ReLU: `np.maximum(0, z)`. Softmax: subtract `z.max(axis=1, keepdims=True)`, exponentiate, then divide by the row sums (`keepdims=True` again).',
      explanation: 'This function is the entire forward pass of a fully connected layer, and a whole MLP is just a loop calling it. PyTorch’s `nn.Linear` does the matrix part, and `nn.ReLU`/`nn.Softmax` the activation; you will meet them in the PyTorch unit.',
    },
  ],
  takeaways: [
    'A **neuron** computes `a = f(w·x + b)`: a weighted sum of its inputs plus a bias, passed through an **activation function**. The weights and biases are the learnable parameters.',
    'Without non-linear activations, any stack of layers collapses into a single linear map. **Non-linearity** is what lets depth help, and it is how a small network solves XOR, which no single neuron can.',
    '**ReLU** is the default hidden activation (cheap, gradient 1 for positives). **Sigmoid/tanh** saturate and cause vanishing gradients in deep stacks. The **output** activation follows the task: none for regression, sigmoid for binary, softmax for multi-class.',
    'A layer is a matrix multiplication plus bias plus activation: `activation(X @ W + b)` with `W` of shape `(n_in, n_out)`. A fully connected network has `Σ (n_in·n_out + n_out)` parameters; track shapes in comments to avoid the most common bug.',
    'The **universal approximation theorem** says one wide hidden layer can fit any continuous function, but deeper networks do it more efficiently. Finding the weights needs a loss and gradient descent, which is the next lesson.',
  ],
  reading: [
    { title: '3Blue1Brown: But what is a neural network? (Deep Learning, chapter 1)', url: 'https://www.youtube.com/watch?v=aircAruvnKk', source: 'video', note: 'The best visual introduction to neurons, layers and activations.' },
    { title: 'Michael Nielsen: Neural Networks and Deep Learning, chapter 1', url: 'https://neuralnetworksanddeeplearning.com/chap1.html', source: 'book', note: 'Perceptrons and sigmoid neurons built up step by step; free online.' },
    { title: 'TensorFlow Playground', url: 'https://playground.tensorflow.org/', source: 'other', note: 'An interactive sandbox: add neurons and layers and watch XOR-like data get solved.' },
    { title: 'Dive into Deep Learning: Multilayer Perceptrons', url: 'https://d2l.ai/chapter_multilayer-perceptrons/index.html', source: 'book', note: 'Hidden layers, activations and the forward pass with runnable code.' },
  ],
};
