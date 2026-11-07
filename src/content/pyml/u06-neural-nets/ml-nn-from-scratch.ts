import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-nn-from-scratch',
  title: 'Build a Neural Network in NumPy',
  summary: 'Put the whole unit together: write a complete multilayer network with ReLU, softmax cross-entropy, backpropagation and mini-batch SGD in plain NumPy, check its gradients, and train it to separate two interlocking moons.',
  minutes: 24,
  objectives: [
    'Assemble data, initialization, forward pass, loss, backward pass and an update loop into a working network',
    'Use He initialization and explain why all-zero weights fail',
    'Derive and use the softmax cross-entropy gradient p − y',
    'Verify the whole implementation with a numerical gradient check and read the training curve',
    'Describe what a framework such as PyTorch adds on top of this from-scratch version',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The plan, and a problem a line cannot solve',
      blocks: [
        {
          type: 'p',
          text: 'You now know every ingredient. This lesson assembles them into a working classifier, in about 60 lines of NumPy, with no machine-learning library. The task is the classic **two moons**: two interlocking crescents of points. No straight line can separate them, so a linear model (logistic regression) tops out around 85–90% accuracy, but a small neural network with a non-linear hidden layer can separate them almost perfectly. Here is the data and a rough text plot of it (`o` and `x` are the two classes):',
        },
        {
          type: 'code',
          title: 'moons_data.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

def make_moons(n, noise, rng):
    t = rng.uniform(0, np.pi, n)
    a = np.column_stack([np.cos(t), np.sin(t)])
    b = np.column_stack([1 - np.cos(t), 0.5 - np.sin(t)])
    X = np.vstack([a, b]) + noise * rng.normal(size=(2 * n, 2))
    return X, np.array([0] * n + [1] * n)

rng = np.random.default_rng(0)
X, y = make_moons(300, 0.2, rng)
print(X.shape, y.shape, np.bincount(y))
print(np.round(X.mean(axis=0), 2), np.round(X.std(axis=0), 2))

grid = [[" "] * 40 for _ in range(12)]
for (px, py), label in zip(X[::3], y[::3]):
    col = int((px + 1.5) / 4.0 * 39)
    row = int((1.5 - py) / 2.5 * 11)
    if 0 <= col < 40 and 0 <= row < 12:
        grid[row][col] = "ox"[label]
print("\\n".join("".join(r) for r in grid))`,
          output: `(600, 2) (600,) [300 300]
[0.5  0.25] [0.96 0.52]
           o      o                     
        o oo ooo ooo                    
       oooooooooooooo                   
     ooooo o  oxo oooooo        x       
  o  o o       x xo  oooo        xxx    
    oo o o xx  xx  x   oooo    xxxxxxx x
     o oo   xxxxxxx   o o x   xxxxxxx   
 o  ooo        xxxxxxxo ox xox xxx      
                xxxxxxx xxxxx xx x      
                    x  x   xxxx x       
                       x xx             
                                        `,
          outputVaries: true,
          annotations: [
            { lines: '3-8', text: 'Each class is a half circle: class 0 is the upper arc `(cos t, sin t)`, class 1 the lower arc shifted right and down so they interlock. Gaussian noise (here `0.2`) blurs the arcs, and the function returns the points and their 0/1 labels.' },
            { lines: '10-13', text: '300 points per class, 600 in total, perfectly balanced. The features are not wildly different in scale (standard deviations 0.96 and 0.52), so we skip standardization here; for real data you would apply it first.' },
            { lines: '15-21', text: 'A crude scatter plot in text: map each point to a cell of a 40×12 character grid. The two crescents hook around each other, with some points from each landing in the other’s territory because of the noise. A single straight line cannot divide them.' },
          ],
        },
        {
          type: 'steps',
          items: [
            { title: 'Data', text: 'Generate the points, shuffle, and split into a training set (400) and a test set (200).' },
            { title: 'Initialize', text: 'Create the weight matrices with small random values (He initialization) and zero biases: a 2 → 16 → 16 → 2 network.' },
            { title: 'Forward pass', text: 'Linear, ReLU, linear, ReLU, linear: keep every intermediate value for the backward pass.' },
            { title: 'Loss', text: 'Softmax cross-entropy on the two output scores (the logits); its gradient starts the backward pass.' },
            { title: 'Backward pass', text: 'Apply the layer formulas from the last lesson from the output back to the input.' },
            { title: 'Update', text: 'Mini-batch SGD: `W −= lr · dW` for every layer. Repeat for many epochs and watch the test accuracy.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Two output neurons for two classes?',
          text: 'A binary problem can use one sigmoid output, but using **one output per class with softmax** is the general recipe: it works unchanged for 3, 10 or 1000 classes (and for a game agent choosing among actions). We use it here so the code needs no changes for more classes.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why can a linear classifier (a single neuron with no hidden layer) not separate the two moons well?',
      options: [
        { text: 'Its decision boundary is a straight line (a flat plane in higher dimensions), but the classes interlock in a curved way', correct: true, why: 'A linear model can only split space with a flat boundary. The curved, interlocking crescents need a bent boundary, which hidden layers with non-linear activations can provide.' },
        { text: 'It cannot be trained with gradient descent', why: 'Logistic regression is trained with gradient descent just fine; the limit is its expressiveness, not its training.' },
        { text: 'There are too few data points', why: 'Hundreds of points are plenty for a model with a handful of parameters; the issue is the shape of the boundary.' },
        { text: 'The labels are noisy so nothing could separate them', why: 'A small network reaches over 95% on this data, so the labels are quite separable; only the boundary shape defeats a linear model.' },
      ],
      explanation: 'Linear models have linear decision boundaries. Adding a hidden layer with a non-linearity lets the network bend the boundary around the crescents.',
    },
    {
      kind: 'concept',
      title: 'The complete network, in 60 lines',
      blocks: [
        {
          type: 'p',
          text: 'Two pieces need a short derivation before the code. The first is **initialization**. If every weight started at 0, every neuron in a layer would compute the same thing and receive the same gradient, so they would stay identical forever (and with ReLU, zero inputs give zero gradients: nothing would learn at all). Small *random* values break that symmetry. **He initialization** draws them from a normal distribution with standard deviation `√(2 / n_in)`, which keeps the typical size of the signals steady layer after layer when using ReLU, so activations and gradients neither shrink nor explode with depth.',
        },
        {
          type: 'p',
          text: 'The second is the **gradient of softmax followed by cross-entropy**, which is wonderfully simple. With probabilities `p = softmax(z)` and the true class `y` (as a one-hot vector), the gradient of the loss with respect to the logits is just:',
        },
        {
          type: 'derivation',
          steps: [
            { tex: 'p_k = \\frac{e^{z_k}}{\\sum_j e^{z_j}} \\qquad L = -\\ln p_y', why: 'Softmax turns the scores into probabilities; the loss is the negative log of the probability given to the correct class.' },
            { tex: '\\frac{\\partial L}{\\partial z_k} = p_k - \\mathbb{1}[k = y]', why: 'Working through the chain rule through the softmax (the mixed terms cancel neatly), the result is the predicted probability minus 1 for the correct class and minus 0 for the others.' },
          ],
          result: 'dlogits = p − onehot(y), divided by the batch size when the loss is a mean. It is large when the network is confidently wrong and zero when it is right with probability 1.',
        },
        {
          type: 'p',
          text: 'Everything together. Read it top to bottom: the functions are the network, and the loop at the end trains it. Before training, the program checks its own backward pass against a numerical gradient (the technique from the last lesson):',
        },
        {
          type: 'code',
          title: 'mlp_from_scratch.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

def make_moons(n, noise, rng):
    t = rng.uniform(0, np.pi, n)
    a = np.column_stack([np.cos(t), np.sin(t)])
    b = np.column_stack([1 - np.cos(t), 0.5 - np.sin(t)])
    X = np.vstack([a, b]) + noise * rng.normal(size=(2 * n, 2))
    return X, np.array([0] * n + [1] * n)

def init(sizes, rng):
    return [(rng.normal(size=(m, k)) * np.sqrt(2 / m), np.zeros(k)) for m, k in zip(sizes, sizes[1:])]

def forward(params, X):
    acts, pre = [X], []
    for i, (W, b) in enumerate(params):
        z = acts[-1] @ W + b
        pre.append(z)
        acts.append(np.maximum(0, z) if i < len(params) - 1 else z)
    return acts, pre

def softmax_ce(logits, y):
    e = np.exp(logits - logits.max(axis=1, keepdims=True))
    p = e / e.sum(axis=1, keepdims=True)
    loss = -np.mean(np.log(p[np.arange(len(y)), y] + 1e-12))
    d = p.copy()
    d[np.arange(len(y)), y] -= 1
    return loss, d / len(y)

def backward(params, acts, pre, d):
    grads = []
    for i in reversed(range(len(params))):
        grads.append((acts[i].T @ d, d.sum(axis=0)))
        if i > 0:
            d = (d @ params[i][0].T) * (pre[i - 1] > 0)
    return grads[::-1]

rng = np.random.default_rng(0)
X, y = make_moons(300, 0.2, rng)
order = rng.permutation(len(X))
X, y = X[order], y[order]
X_tr, y_tr, X_te, y_te = X[:400], y[:400], X[400:], y[400:]
params = init([2, 16, 16, 2], rng)

acts, pre = forward(params, X_tr[:8])
_, d = softmax_ce(acts[-1], y_tr[:8])
analytic = backward(params, acts, pre, d)[0][0][0, 0]
W0 = params[0][0]
W0[0, 0] += 1e-6
up = softmax_ce(forward(params, X_tr[:8])[0][-1], y_tr[:8])[0]
W0[0, 0] -= 2e-6
down = softmax_ce(forward(params, X_tr[:8])[0][-1], y_tr[:8])[0]
W0[0, 0] += 1e-6
print("gradient check:", abs((up - down) / 2e-6 - analytic) < 1e-6)

lr, batch = 0.1, 32
for epoch in range(1, 201):
    idx = rng.permutation(len(X_tr))
    for s in range(0, len(idx), batch):
        b = idx[s:s + batch]
        acts, pre = forward(params, X_tr[b])
        loss, d = softmax_ce(acts[-1], y_tr[b])
        grads = backward(params, acts, pre, d)
        params = [(W - lr * gW, c - lr * gc) for (W, c), (gW, gc) in zip(params, grads)]
    if epoch in (1, 10, 50, 200):
        tr_loss = softmax_ce(forward(params, X_tr)[0][-1], y_tr)[0]
        acc = np.mean(forward(params, X_te)[0][-1].argmax(axis=1) == y_te)
        print(f"epoch {epoch:3d}  train loss {tr_loss:.3f}  test accuracy {acc:.3f}")`,
          output: `gradient check: True
epoch   1  train loss 0.355  test accuracy 0.840
epoch  10  train loss 0.246  test accuracy 0.835
epoch  50  train loss 0.095  test accuracy 0.965
epoch 200  train loss 0.072  test accuracy 0.975`,
          outputVaries: true,
          annotations: [
            { lines: '3-8', text: 'The two-moons data generator from the previous section.' },
            { lines: '10-11', text: '**Initialization**: one `(W, b)` pair per consecutive pair of layer sizes; `W` is random normal scaled by `√(2/n_in)` (He), and the bias starts at zero.' },
            { lines: '13-19', text: '**Forward pass**: for each layer compute `z = a @ W + b`. Every layer except the last applies ReLU; the last returns raw logits. It returns two lists: `acts` (the output of every layer, starting with the input) and `pre` (every `z` before the ReLU). The backward pass needs both.' },
            { lines: '21-27', text: '**Loss**: a numerically stable softmax (subtract the row maximum), then the mean cross-entropy `−log(probability of the true class)`; the `1e-12` avoids `log(0)`. The gradient `p − onehot(y)` is made by copying `p` and subtracting 1 at each true class, divided by the batch size because the loss is a mean.' },
            { lines: '29-35', text: '**Backward pass**: walk the layers from last to first. Layer `i` gets `dW = acts[i]ᵀ @ d` and `db = Σ d`. Then, unless it is the first layer, pass the gradient to the layer below through the weights (`d @ Wᵀ`) and through that layer’s ReLU (multiply by `pre > 0`). The list is reversed so that `grads[i]` matches `params[i]`.' },
            { lines: '37-42', text: 'Make 600 points, shuffle them, keep 400 for training and 200 for testing, and build a 2 → 16 → 16 → 2 network.' },
            { lines: '44-53', text: '**Gradient check** on a batch of 8: compare the backpropagated gradient of one first-layer weight with the central difference of the loss. `True` means the whole forward, loss and backward chain agrees with calculus.' },
            { lines: 55, text: 'Learning rate 0.1 and mini-batches of 32.' },
            { lines: '56-57', text: 'For each epoch, shuffle the order of the training examples.' },
            { lines: '58-59', text: 'Walk through the shuffled data one mini-batch at a time.' },
            { lines: '60-63', text: 'One **training step**: forward pass, loss and its gradient, backward pass, then the SGD update of every weight and bias (`W − lr·dW`).' },
            { lines: '64-66', text: 'At a few checkpoints, evaluate on the whole training set (loss) and on the held-out test set (accuracy: is the highest logit the true class?).' },
            { lines: 67, text: 'The story of learning: after one epoch, 84% (a roughly linear fit); the network then bends its boundary, and by epoch 50 reaches 96.5% and by epoch 200 **97.5% accuracy on unseen points**, with the training loss falling from 0.355 to 0.072. The details vary a little with the library version’s random numbers, but the pattern holds. A linear model gets only about 85–90% on these moons.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Read it as the same recipe as every framework',
          text: 'Every neural-network training script in any framework has these six moves: batch, forward, loss, backward, update, evaluate. The differences are what the framework automates: PyTorch writes `backward` for you (autograd), supplies layers and optimizers as ready-made objects, loads data in batches, and runs it all on a GPU. What you wrote here is what they do, minus the conveniences.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If you initialize every weight of a hidden layer to the same value (for example, all zeros), the neurons in that layer stay identical during training and the layer is no more useful than a single neuron.',
      answer: true,
      explanation: 'True. Identical weights give identical outputs, hence identical gradients, hence identical updates: the symmetry is never broken. (With ReLU and zeros it is worse, since zero activations pass back zero gradients.) Random initialization breaks the symmetry so that neurons specialize in different features.',
    },
    {
      kind: 'concept',
      title: 'Experiments: width, depth and learning rate',
      blocks: [
        {
          type: 'p',
          text: 'The from-scratch network is a perfect laboratory, because you can change anything and see what happens. Here is a typical run when only the width of the two hidden layers is changed (everything else as above, 200 epochs, training loss and test accuracy):',
        },
        {
          type: 'table',
          headers: ['Hidden width', 'Parameters', 'Train loss', 'Test accuracy', 'Verdict'],
          rows: [
            ['1', '9', '0.693', '48.5%', 'Cannot learn: a one-neuron bottleneck (loss = ln 2 means "always 50/50")'],
            ['2', '18', '0.275', '85.0%', 'Underfits: too little capacity to bend the boundary enough'],
            ['4', '42', '0.102', '95.0%', 'Good fit'],
            ['16', '354', '0.072', '97.5%', 'Very good fit'],
          ],
          caption: 'Capacity matters: too little and the network underfits. Try much wider networks yourself and watch whether a gap opens between train and test accuracy (the overfitting lesson).',
        },
        {
          type: 'steps',
          items: [
            { title: 'Change the width', text: 'Try hidden sizes 2, 4, 64 and 256 and compare train and test accuracy. When does the gap open up?' },
            { title: 'Change the learning rate', text: 'Try 0.001 (crawls), 0.1, 1.0 and 5.0 (diverges, loss `nan`). Plot the loss to see each failure.' },
            { title: 'Remove the shuffle', text: 'Delete the `rng.permutation` line and sort the data by class: the batches become single-class and training stalls or oscillates.' },
            { title: 'Break the initialization', text: 'Replace the He scale with zeros (every neuron identical) or with 10 (huge signals): see how fast learning dies.' },
            { title: 'Add momentum', text: 'Keep a velocity per parameter as in the previous lesson, and see how many fewer epochs are needed.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bother, when PyTorch exists?',
          text: 'Because every failure in a real framework looks like one of these experiments: a loss stuck at `ln(classes)` (the network outputs a constant), a `nan` from a large learning rate, a plateau from poor initialization, a train/test gap from overfitting. Having *caused* each failure by hand, you will recognize it instantly when it appears in a 100-million-parameter model, and you will know where to look. The next unit moves to PyTorch, where this whole file shrinks to about twenty lines.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Performance, as a C++ programmer would ask',
          text: 'Everything here is dominated by matrix multiplications, and NumPy hands those to optimized BLAS routines in C and Fortran, so Python’s own slowness barely matters. For small networks the Python overhead per operation does show; frameworks fuse operations, use the GPU and, for deployment, compile the graph (TorchScript, ONNX, TensorRT) into fast C++ that you can embed in a game engine, which the final units cover.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the gradient of softmax cross-entropy: subtract 1 at the position of each example’s true class (the one-hot part of `p − y`).',
      template: `d[np.arange(len(y)), y] -= ___`,
      templateIsCode: true,
      blanks: [{ answers: ['1', '1.0'] }],
      wordBank: ['1', '0', 'p', 'len(y)'],
      explanation: 'The gradient is `p − onehot(y)`: copy the probabilities and subtract **1** at each example’s true class index (and 0 elsewhere). The correct class gets a negative gradient, pushing its logit up; all the other classes get a positive gradient, pushing their logits down.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program (the softmax cross-entropy gradient for one example whose two logits are equal).',
      code: `import math

logits = [0.0, 0.0]
y = 1
e = [math.exp(z) for z in logits]
p = [v / sum(e) for v in e]
grad = [p[i] - (1 if i == y else 0) for i in range(2)]
print(grad)`,
      answer: '[0.5, -0.5]',
      hint: 'Equal logits give probabilities 0.5 and 0.5. Then subtract 1 at the true class (index 1).',
      explanation: 'Equal logits mean the network is undecided: p = [0.5, 0.5]. With the true class 1, the gradient is [0.5 − 0, 0.5 − 1] = [0.5, −0.5]: lower the logit of class 0 and raise the logit of class 1, by equal amounts.',
    },
    {
      kind: 'error',
      prompt: 'This network never learns anything, however long it trains, because every neuron in a layer computes the same thing. Tap the faulty line.',
      lines: [
        'sizes = [2, 16, 2]',
        'params = [(np.zeros((m, k)), np.zeros(k)) for m, k in zip(sizes, sizes[1:])]',
        'loss = train(params, X, y)',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'Initializing the weights to zeros makes all neurons in a layer identical (and, with ReLU, produces zero gradients), so the symmetry is never broken. Use small random weights, e.g. `rng.normal(size=(m, k)) * np.sqrt(2 / m)` (He initialization). Zeros are fine for the *biases*, but not for the weights.',
    },
    {
      kind: 'concept',
      title: 'What you built, and what comes next',
      blocks: [
        {
          type: 'p',
          text: 'Take stock of what you now understand from first principles: a neuron, a layer, why non-linearity is required, how a loss measures error, how gradient descent and its variants minimize it, how backpropagation produces every gradient, and how those combine into a trained network. The table maps each piece of this from-scratch code to its PyTorch counterpart, which is exactly the next unit:',
        },
        {
          type: 'table',
          headers: ['Your NumPy code', 'PyTorch equivalent'],
          rows: [
            ['`np.ndarray`', '`torch.Tensor` (with GPU support and automatic gradients)'],
            ['`init(...)` with `(W, b)` pairs', '`nn.Linear(n_in, n_out)` modules (He-style initialization by default)'],
            ['`forward(params, X)` with stored `acts` and `pre`', '`model(X)`: the framework records the graph itself'],
            ['`softmax_ce(...)` and its gradient', '`nn.CrossEntropyLoss()`'],
            ['`backward(...)`, all 7 lines of it', '`loss.backward()` (autograd)'],
            ['`W - lr * gW`', '`optimizer.step()` (SGD, Adam…)'],
            ['The `rng.permutation` + slicing', '`DataLoader(dataset, batch_size=32, shuffle=True)`'],
          ],
          caption: 'Nothing in PyTorch is magic: each line above is a convenience over something you have just written.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'You are ready for PyTorch',
          text: 'The rest of this course uses PyTorch for neural networks, then reinforcement learning libraries built on it. Whenever something there feels like a black box, come back to this lesson: it is the same machine, with the covers off.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'How many parameters (weights and biases) does the network `2 → 16 → 16 → 2` used in this lesson have?',
      answer: '354',
      hint: 'Per layer: `n_in × n_out + n_out`. Add up the three layers: 2→16, 16→16, 16→2.',
      explanation: 'Layer 1: 2·16 + 16 = 48. Layer 2: 16·16 + 16 = 272. Layer 3: 16·2 + 2 = 34. Total: 48 + 272 + 34 = 354 parameters, tiny, yet enough to separate the two moons to 97.5%.',
      label: 'Parameters:',
    },
    {
      kind: 'code',
      prompt: 'Write `softmax_cross_entropy(logits, y)` for `logits` of shape `(batch, classes)` and integer labels `y` of shape `(batch,)`. Return `(loss, dlogits)`: `loss` is the mean of `−log(p[true class])` using a numerically stable softmax, and `dlogits` (shape `(batch, classes)`) is `(p − onehot(y)) / batch`. `loss` must be a Python float.',
      starter: `import numpy as np

def softmax_cross_entropy(logits, y):
    ...
`,
      solution: `import numpy as np


def softmax_cross_entropy(logits, y):
    logits = np.asarray(logits, dtype=float)
    y = np.asarray(y, dtype=int)
    shifted = logits - logits.max(axis=1, keepdims=True)
    e = np.exp(shifted)
    p = e / e.sum(axis=1, keepdims=True)
    n = len(y)
    loss = float(-np.mean(np.log(p[np.arange(n), y] + 1e-12)))
    d = p.copy()
    d[np.arange(n), y] -= 1.0
    return loss, d / n
`,
      tests: `import numpy as np

loss, d = softmax_cross_entropy(np.zeros((2, 3)), [0, 1])
assert type(loss) is float and abs(loss - np.log(3)) < 1e-9
expected = np.array([[1 / 3 - 1, 1 / 3, 1 / 3], [1 / 3, 1 / 3 - 1, 1 / 3]]) / 2
assert d.shape == (2, 3) and np.allclose(d, expected)

big_loss, big_d = softmax_cross_entropy(np.array([[1000.0, 0.0]]), np.array([0]))
assert np.isfinite(big_loss) and abs(big_loss) < 1e-6 and np.all(np.isfinite(big_d))
wrong, _ = softmax_cross_entropy(np.array([[0.0, 20.0]]), np.array([0]))
assert wrong > 19.0

rng = np.random.default_rng(0)
L = rng.normal(size=(5, 4))
y = np.array([0, 3, 1, 1, 2])
loss, d = softmax_cross_entropy(L, y)
assert np.allclose(d.sum(axis=1), 0.0, atol=1e-12)
eps = 1e-6
for i in range(5):
    for j in range(4):
        Lp, Lm = L.copy(), L.copy()
        Lp[i, j] += eps
        Lm[i, j] -= eps
        num = (softmax_cross_entropy(Lp, y)[0] - softmax_cross_entropy(Lm, y)[0]) / (2 * eps)
        assert abs(num - d[i, j]) < 1e-6

L0 = L.copy()
softmax_cross_entropy(L, y.tolist())
assert np.array_equal(L, L0)`,
      packages: ['numpy'],
      checks: ['The loss is the mean `−log p[true class]` as a plain float, and `dlogits = (p − onehot) / batch`', 'Stable for huge logits, and each row of `dlogits` sums to 0', 'Matches a numerical gradient; accepts a list for `y` and does not modify the inputs'],
      hint: 'Subtract each row’s max before `np.exp`, divide by the row sum to get `p`, take `-np.mean(np.log(p[np.arange(n), y]))`, and build the gradient by copying `p`, subtracting 1 at `[np.arange(n), y]` and dividing by `n`.',
      explanation: 'The compact gradient `p − onehot(y)` is why softmax and cross-entropy are always used together: their derivative is trivial and numerically stable. PyTorch’s `nn.CrossEntropyLoss` fuses them into one operation taking raw logits and integer class labels, exactly this interface.',
    },
    {
      kind: 'code',
      prompt: 'Write `he_init(sizes, seed)` returning a list of `(W, b)` pairs for consecutive layer sizes: `W` has shape `(n_in, n_out)` and is drawn from a normal distribution with standard deviation `sqrt(2 / n_in)` using `np.random.default_rng(seed)`; `b` is a zero vector of length `n_out`. Fewer than two sizes gives `[]`. The same seed must always give the same result.',
      starter: `import numpy as np

def he_init(sizes, seed):
    ...
`,
      solution: `import numpy as np


def he_init(sizes, seed):
    rng = np.random.default_rng(seed)
    params = []
    for n_in, n_out in zip(sizes, sizes[1:]):
        W = rng.normal(size=(n_in, n_out)) * np.sqrt(2.0 / n_in)
        params.append((W, np.zeros(n_out)))
    return params
`,
      tests: `import numpy as np

p = he_init([4, 8, 3], 0)
assert len(p) == 2
assert p[0][0].shape == (4, 8) and p[0][1].shape == (8,)
assert p[1][0].shape == (8, 3) and p[1][1].shape == (3,)
assert all(np.all(b == 0) for _, b in p)

big = he_init([200, 300, 10], 1)
W = big[0][0]
assert abs(W.std() - np.sqrt(2 / 200)) < 0.01
assert abs(W.mean()) < 0.01
assert abs(big[1][0].std() - np.sqrt(2 / 300)) < 0.005

a, b = he_init([3, 5], 7), he_init([3, 5], 7)
assert np.array_equal(a[0][0], b[0][0])
c = he_init([3, 5], 8)
assert not np.array_equal(a[0][0], c[0][0])
assert he_init([3], 0) == [] and he_init([], 0) == []
assert not np.all(he_init([5, 5], 0)[0][0] == he_init([5, 5], 0)[0][0][0, 0])
assert isinstance(p, list) and isinstance(p[0], tuple)`,
      packages: ['numpy'],
      checks: ['Returns one `(W, b)` tuple per pair of consecutive sizes with shapes `(n_in, n_out)` and `(n_out,)`', '`W` is random normal scaled by `sqrt(2 / n_in)`; `b` is all zeros', 'Deterministic for a given seed; fewer than two sizes gives `[]`'],
      hint: 'Create `rng = np.random.default_rng(seed)`, then for each `(n_in, n_out)` pair append `(rng.normal(size=(n_in, n_out)) * np.sqrt(2 / n_in), np.zeros(n_out))`.',
      explanation: 'The scale factor is the whole trick. With ReLU, half of each layer’s signal is zeroed, so the weights need variance `2 / n_in` to keep the activations’ size constant from layer to layer. PyTorch’s `nn.Linear` uses a closely related scheme by default, and `nn.init.kaiming_normal_` gives exactly this one.',
    },
    {
      kind: 'code',
      prompt: 'The `forward` function and the loss are given. Write `backward(params, acts, pre, d)`, which returns a list of `(dW, db)` pairs (one per layer, in the same order as `params`). `d` is the gradient of the loss with respect to the final logits. Layer `i` gets `dW = acts[i].T @ d` and `db = d.sum(axis=0)`; then, if it is not the first layer, pass `d` down with `d = (d @ W.T) * (pre[i-1] > 0)`.',
      starter: `import numpy as np

def forward(params, X):
    acts, pre = [X], []
    for i, (W, b) in enumerate(params):
        z = acts[-1] @ W + b
        pre.append(z)
        acts.append(np.maximum(0, z) if i < len(params) - 1 else z)
    return acts, pre

def backward(params, acts, pre, d):
    ...
`,
      solution: `import numpy as np


def forward(params, X):
    acts, pre = [X], []
    for i, (W, b) in enumerate(params):
        z = acts[-1] @ W + b
        pre.append(z)
        acts.append(np.maximum(0, z) if i < len(params) - 1 else z)
    return acts, pre


def backward(params, acts, pre, d):
    grads = []
    for i in reversed(range(len(params))):
        W = params[i][0]
        grads.append((acts[i].T @ d, d.sum(axis=0)))
        if i > 0:
            d = (d @ W.T) * (pre[i - 1] > 0)
    return grads[::-1]
`,
      tests: `import numpy as np

rng = np.random.default_rng(0)
params = [
    (rng.normal(size=(3, 4)) * 0.7, rng.normal(size=4) * 0.1),
    (rng.normal(size=(4, 4)) * 0.7, rng.normal(size=4) * 0.1),
    (rng.normal(size=(4, 2)) * 0.7, rng.normal(size=2) * 0.1),
]
X = rng.normal(size=(6, 3))
target = rng.normal(size=(6, 2))

def loss_fn():
    acts, _ = forward(params, X)
    return float(0.5 * np.sum((acts[-1] - target) ** 2))

acts, pre = forward(params, X)
d_out = acts[-1] - target
grads = backward(params, acts, pre, d_out)
assert len(grads) == 3
for (W, b), (dW, db) in zip(params, grads):
    assert dW.shape == W.shape and db.shape == b.shape

eps = 1e-6
for layer in range(3):
    W, b = params[layer]
    for arr, g in ((W, grads[layer][0]), (b, grads[layer][1])):
        for idx in np.ndindex(arr.shape):
            old = arr[idx]
            arr[idx] = old + eps
            up = loss_fn()
            arr[idx] = old - eps
            down = loss_fn()
            arr[idx] = old
            assert abs((up - down) / (2 * eps) - g[idx]) < 1e-5

single = backward(params[:1], *forward(params[:1], X), np.ones((6, 4)))
assert len(single) == 1 and single[0][0].shape == (3, 4)
assert np.allclose(single[0][1], 6.0)`,
      packages: ['numpy'],
      checks: ['Returns one `(dW, db)` pair per layer, in the same order as `params`, with matching shapes', 'The gradients agree with a numerical gradient check of every weight and bias in a 3-layer network', 'Handles a single-layer network (no ReLU to pass back through)'],
      hint: 'Loop `for i in reversed(range(len(params)))`: append `(acts[i].T @ d, d.sum(axis=0))`; if `i > 0`, update `d = (d @ params[i][0].T) * (pre[i - 1] > 0)`. Reverse the list at the end.',
      explanation: 'Seven lines are all the backward pass of an arbitrary-depth ReLU network needs: the same two moves, repeated per layer. Notice the one-step offset: layer `i`’s input is `acts[i]`, while the ReLU that produced it sits one layer below, on `pre[i - 1]`. Getting these indices right is the usual stumbling block, and the gradient check you just passed is how you know you did.',
    },
  ],
  takeaways: [
    'A complete neural network is about 60 lines of NumPy: **initialize** (He: `N(0, 2/n_in)` weights, zero biases), **forward** (store `acts` and `pre`), **loss** (softmax cross-entropy), **backward**, **update** (mini-batch SGD), repeated over shuffled epochs.',
    'Softmax followed by cross-entropy has the gradient **`p − onehot(y)`** (divided by the batch size for a mean loss): large when confidently wrong, zero when right.',
    'Never start all weights at zero or at the same value: identical neurons get identical gradients and never differentiate. Random scaling by `√(2/n_in)` also keeps signals stable through ReLU layers.',
    'Always **gradient-check** a hand-written backward pass, and watch the training curve: a loss stuck at `ln(classes)` means the network outputs a constant, `nan` means divergence, and a train/test gap means overfitting. Capacity (width, depth) controls under- and overfitting.',
    'A hidden layer with a non-linearity lets the network bend its decision boundary: the two moons go from about 85–90% (linear) to 97.5%. PyTorch automates exactly what you wrote: tensors, layers, autograd, optimizers and data loaders.',
  ],
  reading: [
    { title: 'Stanford CS231n: Neural Networks Part 1: Setting up the Architecture', url: 'https://cs231n.github.io/neural-networks-1/', source: 'course', note: 'Neurons, layers, activations and capacity, with the classic moon-like examples.' },
    { title: 'Stanford CS231n: Neural Networks Case Study', url: 'https://cs231n.github.io/neural-networks-case-study/', source: 'course', note: 'Trains a two-layer network from scratch in NumPy on spiral data; closely parallels this lesson.' },
    { title: 'Andrej Karpathy: Building makemore, Part 4: Becoming a Backprop Ninja', url: 'https://www.youtube.com/watch?v=q8SA3rM6ckI', source: 'video', note: 'Hand-writing the backward pass for a full network, with gradient checks.' },
    { title: 'He et al. (2015): Delving Deep into Rectifiers (He initialization)', url: 'https://arxiv.org/abs/1502.01852', source: 'paper', note: 'Where the √(2/n) initialization for ReLU networks comes from.' },
  ],
};
