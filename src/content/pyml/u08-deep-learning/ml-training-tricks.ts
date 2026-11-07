import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-training-tricks',
  title: 'Training Deep Networks: Normalization, Dropout and Schedules',
  summary: 'Why deep networks are hard to train, and the toolkit that fixed it: weight initialization, batch and layer normalization, dropout, residual connections, and a practical recipe for choosing hyperparameters.',
  minutes: 25,
  objectives: [
    'Explain vanishing and exploding signals and choose a weight initialization (Xavier or He) accordingly',
    'Describe what batch normalization and layer normalization do, and how train and eval mode differ',
    'Use dropout, weight decay and augmentation as regularizers, in the right places and modes',
    'Explain how residual (skip) connections let gradients reach early layers',
    'Follow a sensible order for tuning hyperparameters, searching the learning rate on a log scale',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Why depth is hard: signals that vanish or explode',
      blocks: [
        {
          type: 'p',
          text: 'In theory a deeper network is more expressive. In practice, before about 2010 networks with more than a few layers refused to train. The reason is multiplication. A signal passing through a layer is multiplied by a weight matrix, so after 20 layers it has been multiplied by 20 matrices. If each one shrinks the signal slightly, the product becomes microscopic (**[[vanishing-gradient|vanishing]]**); if each one enlarges it slightly, the product becomes astronomical (**[[exploding-gradient|exploding]]**). Backpropagation multiplies the *gradients* by the same matrices in reverse, so the early layers receive either nothing or noise.',
        },
        {
          type: 'p',
          text: 'The cure starts with **[[weight-initialization|weight initialization]]**: choose the starting weights so the signal keeps roughly the same size from layer to layer. A neuron that sums `n` inputs, each with variance `Var(x)`, with weights of variance `Var(w)`, produces an output of variance about `n · Var(w) · Var(x)`. To keep the variance constant we need `n · Var(w) = 1` (**Xavier / Glorot** initialization, designed for tanh and sigmoid). A ReLU zeroes half of the signal, so we need twice as much: `Var(w) = 2/n` (**He / Kaiming** initialization, the standard for ReLU networks). The experiment below pushes random data through 20 ReLU layers with three different weight scales.',
        },
        {
          type: 'code',
          title: 'init_experiment.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

rng = np.random.default_rng(0)
x0 = rng.normal(size=(256, 512))

def final_std(scale_fn, depth=20):
    x = x0
    for _ in range(depth):
        W = rng.normal(size=(512, 512)) * scale_fn(512)
        x = np.maximum(0, x @ W)
    return x.std()

for name, fn in [("too small (0.01)", lambda n: 0.01), ("too big (0.1)", lambda n: 0.1), ("He sqrt(2/n)", lambda n: np.sqrt(2 / n))]:
    magnitude = round(float(np.log10(final_std(fn))))
    print(f"{name:18s} about 10^{magnitude}")`,
          output: `too small (0.01)   about 10^-16
too big (0.1)      about 10^4
He sqrt(2/n)       about 10^0`,
          annotations: [
            { lines: '3-4', text: 'A batch of 256 random inputs with 512 features each, standard deviation 1.' },
            { lines: '6-11', text: 'Push the batch through a **20-layer ReLU network** of width 512 whose weights are random with a standard deviation given by `scale_fn`, and return the size (standard deviation) of the final activations.' },
            { lines: '13-15', text: 'Weights with standard deviation 0.01 shrink the signal to about **10⁻¹⁶**, so nothing reaches the output (and gradients vanish just the same). Weights of 0.1 blow it up to about **10⁴**. The He scale `√(2/512) ≈ 0.0625` keeps it near **10⁰ = 1** through all 20 layers. Try changing the depth or the scale to see how sharp the cliff is.' },
          ],
        },
        {
          type: 'table',
          headers: ['Initialization', 'Weight variance', 'Use with', 'PyTorch'],
          rows: [
            ['Xavier / Glorot', '`2 / (n_in + n_out)` (or `1/n`)', 'tanh, sigmoid, linear layers', '`nn.init.xavier_normal_`'],
            ['He / Kaiming', '`2 / n_in`', 'ReLU and its relatives', '`nn.init.kaiming_normal_`'],
            ['Zeros for biases', 'all 0', 'Biases (never weights!)', '`nn.init.zeros_`'],
            ['Small random', 'e.g. 0.02 std', 'Transformer embeddings and projections', '`nn.init.normal_(w, std=0.02)`'],
          ],
          caption: 'Pick the initialization to match the activation. Weights must never all start equal (zeros), or every neuron in a layer computes and learns the same thing: the symmetry-breaking problem.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'PyTorch picks a reasonable default',
          text: '`nn.Linear` and `nn.Conv2d` initialize their weights with a scheme close to `1/√fan_in` that works well for networks up to a dozen layers, which is why your earlier models trained without any special care. Initialization starts to matter when you go deeper, change the activation (tanh, GELU) or train an unusual architecture such as a policy network with a tiny output scale; then call `nn.init` explicitly, or use normalization layers (next step), which make the network far less sensitive to the starting scale.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You stack 30 ReLU layers and initialize every weight with standard deviation 0.01. The loss never moves and the early layers’ gradients are about 1e-30. What is the most likely cause and fix?',
      options: [
        { text: 'The signal vanishes layer by layer because the weights are too small: use He initialization (std ≈ √(2/fan_in)) or add normalization layers', correct: true, why: 'Each layer multiplies the signal by a factor below 1, and 30 such factors compound to a tiny number; backprop multiplies the gradients the same way.' },
        { text: 'The learning rate is too high: lower it by 10×', why: 'A too-high rate makes the loss jump or become `nan`; it does not produce gradients of 1e-30 in early layers.' },
        { text: 'The batch size is too small: use a bigger batch', why: 'Batch size changes gradient noise, not the multiplicative shrinking of the signal through depth.' },
        { text: 'ReLU cannot be used in deep networks: switch to sigmoid', why: 'Sigmoid is *worse* for depth (its derivative is at most 0.25, which makes gradients vanish faster). ReLU with proper initialization is the standard.' },
      ],
      explanation: 'Too-small initial weights make the signal and gradients shrink exponentially with depth. Match the initial variance to the layer width and activation (He for ReLU), or normalize activations.',
    },
    {
      kind: 'concept',
      title: 'Normalization layers: keeping activations in range',
      blocks: [
        {
          type: 'p',
          text: 'Good initialization only helps at the start; as the weights change during training, the scale of each layer’s inputs drifts. **Normalization layers** fix this directly by rescaling activations inside the network. **[[batch-normalization|Batch normalization]]** standardizes each feature using the mean and variance **over the current batch**, then applies a learned scale `γ` and shift `β` so the network can undo the normalization if that is useful. With it you can use much higher learning rates, depend less on initialization, and often get a mild regularizing effect from the batch noise.',
        },
        {
          type: 'math',
          tex: '\\hat{x}_i = \\frac{x_i - \\mu_B}{\\sqrt{\\sigma_B^2 + \\varepsilon}}, \\qquad y_i = \\gamma\\,\\hat{x}_i + \\beta',
          caption: 'Batch normalization: μ and σ² are computed over the batch for each feature; ε is a tiny constant that avoids dividing by zero; γ and β are learned.',
        },
        {
          type: 'p',
          text: 'The catch is that batch norm behaves differently in **training** and **evaluation**. In training it uses the current batch’s statistics (and updates running averages of them). In evaluation, a single input has no meaningful batch, so it uses the **running averages** collected during training. That is why you must call `model.eval()` before testing. **Layer normalization** avoids the problem by normalizing across the *features of each single example*, so it behaves identically in training and evaluation, works with batch size 1, and is the norm in transformers, recurrent networks and many reinforcement-learning models.',
        },
        {
          type: 'code',
          title: 'batchnorm_demo.py',
          desktopOnly: true,
          code: `import torch
from torch import nn

torch.manual_seed(0)
x = torch.randn(64, 3) * torch.tensor([1.0, 10.0, 100.0]) + torch.tensor([5.0, -20.0, 300.0])
bn = nn.BatchNorm1d(3)
y = bn(x)
print([abs(round(v, 2)) for v in y.mean(0).tolist()], [round(v, 2) for v in y.std(0, unbiased=False).tolist()])
for _ in range(200):
    bn(x)
bn.eval()
print([round(v, 1) for v in bn.running_mean.tolist()], [round(v, 1) for v in x.mean(0).tolist()])`,
          output: `[0.0, 0.0, 0.0] [1.0, 1.0, 1.0]
[5.0, -22.5, 326.8] [5.0, -22.5, 326.8]`,
          annotations: [
            { lines: 5, text: 'Three features on wildly different scales: roughly 5 ± 1, −20 ± 10 and 300 ± 100. A raw network would find these very hard to train on.' },
            { lines: '6-8', text: 'In training mode, the batch norm output has **mean 0 and standard deviation 1 for every feature**, whatever the input scale. (Learned `γ = 1` and `β = 0` at the start.)' },
            { lines: '9-12', text: 'Each forward pass also updates the **running mean** (a moving average). After many passes it has converged to the data’s true mean `[5, −22.5, 326.8]`: these stored numbers are what `eval()` mode uses, so predictions on one example do not depend on whichever other examples share its batch.' },
          ],
        },
        {
          type: 'table',
          headers: ['Property', 'Batch norm', 'Layer norm'],
          rows: [
            ['Normalizes over', 'The batch, separately for each feature', 'The features, separately for each example'],
            ['Train vs eval', 'Differs (batch statistics vs running averages)', 'Identical'],
            ['Small batches', 'Noisy and unreliable', 'Unaffected'],
            ['Typical home', 'CNNs and image models', 'Transformers, RNNs, RL and sequence models'],
            ['PyTorch', '`nn.BatchNorm1d` / `BatchNorm2d`', '`nn.LayerNorm`'],
          ],
          caption: 'Choosing a normalization layer. Place it between the linear/conv layer and the activation: `Linear → Norm → ReLU`.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Batch norm and RL do not always mix',
          text: 'In reinforcement learning the data in a batch is highly correlated (consecutive frames of one game), and the data distribution shifts as the agent improves. Batch statistics are then unreliable, and the train/eval gap causes subtle bugs. Many RL implementations use **layer norm** or no normalization at all (and normalize the *observations* and rewards instead). A common mistake is to forget `model.eval()` when your trained agent plays the game, so it silently behaves differently from the one you measured.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'At test time a batch-normalized network (in `eval()` mode) normalizes each input using the mean and variance of the test batch it is given.',
      answer: false,
      explanation: 'False. In `eval()` mode batch norm uses the **running averages** collected during training, so each prediction is independent of the other examples in its batch. (Layer norm has no train/eval difference at all.) Using batch statistics at test time would make a single-example prediction impossible.',
    },
    {
      kind: 'fill',
      prompt: 'Fill in the call that switches off dropout and makes batch normalization use its running statistics before you evaluate or deploy a model.',
      template: `model.___()
with torch.no_grad():
    predictions = model(test_inputs)`,
      templateIsCode: true,
      blanks: [{ answers: ['eval'] }],
      wordBank: ['eval', 'train', 'zero_grad', 'freeze'],
      explanation: '`model.eval()` puts every layer into evaluation mode: dropout becomes the identity and batch norm uses its running averages. `model.train()` does the opposite, `zero_grad()` clears gradients, and there is no `freeze` method on a module.',
    },
    {
      kind: 'concept',
      title: 'Dropout, residual connections and regularization',
      blocks: [
        {
          type: 'p',
          text: '**[[dropout|Dropout]]** is a regularizer that randomly zeroes each activation with probability `p` during training, so no neuron can rely on a particular partner being present; the network must learn redundant, robust features. To keep the *expected* total activation unchanged, the survivors are scaled up by `1/(1−p)` (this is **inverted dropout**), which means that at test time you do nothing: `model.eval()` turns dropout off entirely.',
        },
        {
          type: 'code',
          title: 'dropout_demo.py',
          desktopOnly: true,
          code: `import torch
from torch import nn

torch.manual_seed(0)
drop = nn.Dropout(p=0.5)
x = torch.ones(10000)
drop.train()
y = drop(x)
print(sorted(set(y.tolist())), round(y.mean().item(), 1))
drop.eval()
print(torch.equal(drop(x), x))`,
          output: `[0.0, 2.0] 1.0
True`,
          annotations: [
            { lines: '5-6', text: 'Dropout with probability 0.5, applied to 10,000 ones.' },
            { lines: '7-9', text: 'In training mode each value becomes either `0.0` (dropped) or `2.0` (kept and scaled by `1/(1−0.5)`). The average stays at about **1.0**, so the next layer sees the same expected input as without dropout.' },
            { lines: '10-11', text: 'In evaluation mode dropout is the identity: the output equals the input exactly.' },
          ],
        },
        {
          type: 'p',
          text: 'The second great enabler of depth is the **[[residual-connection|residual (skip) connection]]**, introduced by ResNet. Instead of asking a block to compute `h → f(h)`, it computes `h → h + f(h)`. The identity path gives gradients a clean highway from the output to the first layer: the derivative of `h + f(h)` is `1 + f′(h)`, which cannot vanish even if `f′` is tiny. Every modern deep architecture, including transformers, uses them.',
        },
        {
          type: 'code',
          title: 'residual_gradients.py',
          desktopOnly: true,
          code: `import torch
from torch import nn

torch.manual_seed(0)
depth, width = 30, 64

def first_layer_grad(residual):
    layers = [nn.Linear(width, width) for _ in range(depth)]
    for l in layers:
        nn.init.normal_(l.weight, std=0.05)
        nn.init.zeros_(l.bias)
    h = torch.randn(32, width)
    for l in layers:
        h = torch.tanh(l(h)) + (h if residual else 0)
    h.pow(2).mean().backward()
    return layers[0].weight.grad.abs().mean().item()

g_plain, g_res = first_layer_grad(False), first_layer_grad(True)
print(g_plain < 1e-10, g_res > 1e-4)`,
          output: `True True`,
          annotations: [
            { lines: '7-11', text: 'Build a 30-layer network of tanh layers with small weights (a deliberately hard case).' },
            { lines: '12-14', text: 'Run the batch through it. The only difference between the two variants is the skip: `h = tanh(layer(h)) + h` instead of just `h = tanh(layer(h))`.' },
            { lines: '15-16', text: 'Backpropagate a loss and measure the gradient arriving at the **first** layer, 30 layers away from the output.' },
            { lines: '18-19', text: 'Without skips the first layer’s gradient is astronomically small (around 10⁻²⁶: it cannot learn). With skips it is about 0.06, a perfectly healthy size. This is the whole reason ResNets can be 100 layers deep.' },
          ],
        },
        {
          type: 'table',
          headers: ['Technique', 'What it fights', 'Where to apply it', 'Eval mode'],
          rows: [
            ['**Weight decay** (`AdamW(weight_decay=0.01)`)', 'Overfitting: keeps weights small', 'All weights (not biases or norm parameters)', 'No difference'],
            ['**Dropout** (`p` of 0.1 to 0.5)', 'Overfitting: co-adaptation', 'After activations in big fully connected layers; less in CNNs', 'Switched off'],
            ['**Data augmentation**', 'Overfitting: too little data', 'Training data only', 'Not applied'],
            ['**Early stopping**', 'Overfitting: training too long', 'Monitor validation loss', 'n/a'],
            ['**Normalization**', 'Unstable scales, slow training', 'Between layer and activation', 'Batch norm differs'],
            ['**Residual connections**', 'Vanishing gradients in deep stacks', 'Around blocks of layers', 'No difference'],
          ],
          caption: 'The regularization and stabilization toolbox. Use them one at a time, and measure the validation loss after each change.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why you use several tricks together',
          text: 'Each trick fixes a different failure. Initialization and normalization keep the *forward* signal healthy; residual connections keep the *backward* gradient healthy; dropout, weight decay and augmentation fight *overfitting*; schedules and clipping keep the *optimization* stable. A modern training recipe (AdamW, warm-up and cosine decay, layer norm, residual blocks, light dropout) is not magic: it is each of these answers to a problem that earlier networks hit. When your training misbehaves, ask which of those four things is going wrong and reach for the matching tool.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output (dropout applied in evaluation mode).',
      code: `import torch
from torch import nn

drop = nn.Dropout(0.5)
drop.eval()
print(drop(torch.tensor([1.0, 2.0, 3.0])).tolist())`,
      answer: '[1.0, 2.0, 3.0]',
      hint: 'In `eval()` mode dropout is switched off completely.',
      explanation: 'Dropout only drops (and rescales) values in training mode. In evaluation mode it passes its input through unchanged.',
    },
    {
      kind: 'error',
      prompt: 'The model trains poorly because of a mode mistake before this training loop: dropout and batch norm are not behaving as they should. Tap the faulty line.',
      lines: [
        'model.eval()',
        'for x, y in train_loader:',
        '    loss = loss_fn(model(x), y)',
        '    optimizer.zero_grad(); loss.backward(); optimizer.step()',
      ],
      linesAreCode: true,
      errorLines: [1],
      explanation: 'Training must run in `model.train()` mode. With `model.eval()` dropout is disabled (no regularization) and batch norm uses its untrained running averages instead of the batch statistics, so the network trains as if it had no normalization. Call `model.eval()` only for validation, testing and deployment, and switch back with `model.train()`.',
    },
    {
      kind: 'numeric',
      prompt: 'You apply `nn.Dropout(p=0.2)` during training. By what factor are the activations that **survive** multiplied, so that the expected total stays the same?',
      answer: '1.25',
      hint: 'The scale is `1 / (1 − p)`.',
      explanation: 'With p = 0.2, 80% of the units survive, so each survivor is multiplied by `1 / 0.8 = 1.25`. On average, `0.8 × 1.25 = 1`, so the expected activation is unchanged.',
      label: 'Factor:',
    },
    {
      kind: 'concept',
      title: 'A practical recipe for hyperparameters',
      blocks: [
        {
          type: 'p',
          text: 'A network has dozens of **[[hyperparameter|hyperparameters]]** (settings you choose, not learn) and you cannot search them all. Fortunately they are not equally important. Tune them in this order, changing one thing at a time and keeping everything else fixed, so you know what helped.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Get a working baseline', text: 'A simple model, Adam at 3e-4 or 1e-3, no tricks. Pass the overfit-one-batch test first. Record the training and validation loss.' },
            { title: 'Tune the learning rate', text: 'The most important setting by far. Try values on a **log scale** (1e-4, 3e-4, 1e-3, 3e-3, 1e-2) and pick the largest one that trains stably. If the loss is `nan` or jumps around, go lower.' },
            { title: 'Add a schedule', text: 'Warm-up plus cosine decay, or step decay. This usually gives a few percent for free and makes the final result less sensitive to the exact starting rate.' },
            { title: 'Fix capacity', text: 'If training and validation loss are both high, grow the model (wider, deeper). If training is low but validation is high, regularize (dropout, weight decay, augmentation, more data) instead.' },
            { title: 'Batch size and fine details', text: 'Larger batches are smoother and faster per example; when you double the batch size, try scaling the learning rate up a little. Tune weight decay and dropout last.' },
            { title: 'Search randomly, not on a grid', text: 'For several hyperparameters, **random search** beats a grid, because usually only one or two matter a lot and random samples try many distinct values of each.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Rates and decays live on log scales',
          text: 'The difference between 1e-4 and 1e-3 matters as much as the difference between 1e-3 and 1e-2, so sample hyperparameters like the learning rate and weight decay **uniformly in the logarithm**: draw `u` uniformly between `log(low)` and `log(high)`, then use `exp(u)`. Sampling uniformly between 0.0001 and 0.01 would put 90% of your trials above 0.001 and almost never try the small values. Always run each candidate with the same seed (and ideally two or three seeds for the final comparison) because run-to-run noise can be as large as the effect you are measuring.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises: implement the batch-norm forward pass, inverted dropout, and the log-uniform sampler that a random search of learning rates is built on.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `batch_norm(x, gamma, beta, eps=1e-5)` for a 2-D NumPy array `x` of shape `(N, D)` in **training mode**: for each column compute the mean and the (biased, i.e. divide by N) variance over the batch, normalize with `(x - mean) / sqrt(var + eps)`, then return `gamma * normalized + beta`. `gamma` and `beta` are arrays of length `D` (or scalars).',
      starter: `import numpy as np

def batch_norm(x, gamma, beta, eps=1e-5):
    ...
`,
      solution: `import numpy as np


def batch_norm(x, gamma, beta, eps=1e-5):
    x = np.asarray(x, dtype=float)
    mean = x.mean(axis=0)
    var = x.var(axis=0)
    x_hat = (x - mean) / np.sqrt(var + eps)
    return gamma * x_hat + beta
`,
      tests: `import numpy as np

rng = np.random.default_rng(0)
x = rng.normal(size=(200, 3)) * np.array([1.0, 10.0, 100.0]) + np.array([5.0, -20.0, 300.0])
y = batch_norm(x, np.ones(3), np.zeros(3))
assert y.shape == x.shape
assert np.allclose(y.mean(axis=0), 0, atol=1e-8)
assert np.allclose(y.std(axis=0), 1, atol=1e-3)

z = batch_norm(x, np.array([2.0, 2.0, 2.0]), np.array([3.0, -1.0, 0.0]))
assert np.allclose(z.mean(axis=0), [3.0, -1.0, 0.0], atol=1e-8)
assert np.allclose(z.std(axis=0), 2.0, atol=2e-3)

single = batch_norm(np.array([[4.0, 5.0]]), np.array([1.0, 1.0]), np.array([7.0, 8.0]))
assert np.allclose(single, [[7.0, 8.0]])
const = batch_norm(np.full((5, 2), 3.0), 1.0, 0.5)
assert np.allclose(const, 0.5)

tiny = np.array([[1.0], [3.0]])
out = batch_norm(tiny, 1.0, 0.0, eps=0.0)
assert np.allclose(out, [[-1.0], [1.0]])
before = x.copy()
batch_norm(x, 1.0, 0.0)
assert np.array_equal(x, before)`,
      packages: ['numpy'],
      checks: ['Normalizes each column with the batch mean and the biased variance (divide by N), using `sqrt(var + eps)`', 'Applies `gamma * normalized + beta`, so the output has mean `beta` and std `gamma` per column', 'Handles a single-example batch and constant columns (no division by zero thanks to `eps`); does not modify the input'],
      hint: '`mean = x.mean(axis=0)` and `var = x.var(axis=0)` (NumPy’s default divides by N). Then `x_hat = (x - mean) / np.sqrt(var + eps)` and `return gamma * x_hat + beta`.',
      explanation: 'This is the training-mode forward pass of `nn.BatchNorm1d`. A real layer also keeps exponential running averages of `mean` and `var` (to use in `eval()` mode) and learns `gamma` and `beta` by backpropagation. Notice that with a batch of one example the output is just `beta`: the batch statistics carry no information, which is why batch norm needs reasonably large batches.',
    },
    {
      kind: 'code',
      prompt: 'Write `inverted_dropout(x, p, rng, training=True)` for a NumPy array `x` and a `numpy.random.Generator` `rng`. Raise `ValueError` unless `0 <= p < 1`. If `training` is false, return `x` unchanged. Otherwise draw `mask = rng.random(x.shape) >= p` (a boolean array; `True` means keep) and return `(x * mask / (1 - p))`. The input must not be modified.',
      starter: `import numpy as np

def inverted_dropout(x, p, rng, training=True):
    ...
`,
      solution: `import numpy as np


def inverted_dropout(x, p, rng, training=True):
    if not 0 <= p < 1:
        raise ValueError("p must satisfy 0 <= p < 1")
    x = np.asarray(x, dtype=float)
    if not training:
        return x
    mask = rng.random(x.shape) >= p
    return x * mask / (1 - p)
`,
      tests: `import numpy as np

rng = np.random.default_rng(0)
x = np.ones(100000)
y = inverted_dropout(x, 0.5, rng)
assert set(np.unique(y).tolist()) == {0.0, 2.0}
assert abs(y.mean() - 1.0) < 0.02
assert abs((y == 0).mean() - 0.5) < 0.01

y = inverted_dropout(x, 0.2, np.random.default_rng(1))
assert set(np.unique(y).tolist()) == {0.0, 1.25}
assert abs(y.mean() - 1.0) < 0.02

e = np.arange(6.0)
assert np.array_equal(inverted_dropout(e, 0.9, rng, training=False), e)
assert np.array_equal(inverted_dropout(e, 0.0, rng), e)

a = inverted_dropout(x, 0.5, np.random.default_rng(7))
b = inverted_dropout(x, 0.5, np.random.default_rng(7))
assert np.array_equal(a, b)
m = np.random.default_rng(3).normal(size=(50, 20))
out = inverted_dropout(m, 0.5, np.random.default_rng(4))
assert out.shape == m.shape
assert np.all((out == 0) | np.isclose(out, 2 * m))

before = x.copy()
inverted_dropout(x, 0.5, rng)
assert np.array_equal(x, before)
for bad in (1.0, -0.1, 1.5):
    try:
        inverted_dropout(x, bad, rng)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      packages: ['numpy'],
      checks: ['In training mode each element is either dropped (0) or kept and scaled by `1 / (1 - p)`, so the average is unchanged', 'In evaluation mode (`training=False`) the input is returned unchanged; `p = 0` is the identity', 'Raises `ValueError` unless `0 <= p < 1`; reproducible for a given generator; does not modify the input'],
      hint: 'Validate `p` first. Then `mask = rng.random(x.shape) >= p` and `return x * mask / (1 - p)`; for `training=False` return `x` before touching the generator.',
      explanation: 'Scaling the survivors *during training* (the "inverted" variant) means no adjustment is needed at test time: evaluation simply skips dropout. The expected value of each element is `(1 - p) · x / (1 - p) = x`, so the next layer sees the same average input in both modes, which is exactly what `nn.Dropout` does.',
    },
    {
      kind: 'code',
      prompt: 'Write `log_uniform(low, high, n, seed)` that returns a list of `n` samples drawn **uniformly in the logarithm** between `low` and `high` (both positive, `low < high`): use `random.Random(seed)` and for each sample `math.exp(rng.uniform(math.log(low), math.log(high)))`. Raise `ValueError` if `low <= 0` or `low >= high`. This is how you sample learning rates for a random search.',
      starter: `import math
import random

def log_uniform(low, high, n, seed):
    ...
`,
      solution: `import math
import random


def log_uniform(low, high, n, seed):
    if low <= 0 or low >= high:
        raise ValueError("need 0 < low < high")
    rng = random.Random(seed)
    lo, hi = math.log(low), math.log(high)
    return [math.exp(rng.uniform(lo, hi)) for _ in range(n)]
`,
      tests: `import math

xs = log_uniform(1e-5, 1e-1, 4000, seed=0)
assert len(xs) == 4000
assert all(1e-5 <= v <= 1e-1 for v in xs)
logs = [math.log10(v) for v in xs]
assert abs(sum(logs) / len(logs) - (-3.0)) < 0.1
below = sum(1 for v in xs if v < 1e-3) / len(xs)
assert abs(below - 0.5) < 0.05
decades = [sum(1 for l in logs if k <= l < k + 1) for k in (-5, -4, -3, -2)]
assert all(abs(d / 4000 - 0.25) < 0.05 for d in decades)

assert log_uniform(1e-4, 1e-2, 10, seed=3) == log_uniform(1e-4, 1e-2, 10, seed=3)
assert log_uniform(1e-4, 1e-2, 10, seed=3) != log_uniform(1e-4, 1e-2, 10, seed=4)
assert log_uniform(1.0, 2.0, 0, seed=0) == []
assert all(1.0 <= v <= 2.0 for v in log_uniform(1.0, 2.0, 50, seed=1))
for args in [(0, 1), (-1, 1), (2, 1), (1, 1)]:
    try:
        log_uniform(args[0], args[1], 5, 0)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      checks: ['Draws `n` samples with `math.exp(rng.uniform(log(low), log(high)))` using `random.Random(seed)`', 'Every decade between `low` and `high` receives about the same share of samples; the result is reproducible for a seed', 'Raises `ValueError` unless `0 < low < high`; `n = 0` gives an empty list'],
      hint: 'Create `rng = random.Random(seed)` once, take `lo, hi = math.log(low), math.log(high)`, and return a list comprehension of `math.exp(rng.uniform(lo, hi))`.',
      explanation: 'Uniform sampling in log space gives each order of magnitude equal attention, which is how learning rates, weight decays and regularization strengths behave. In a random search you sample many such configurations, train each briefly with the same seed and data, and look at the validation scores.',
    },
  ],
  takeaways: [
    'Depth multiplies signals and gradients layer by layer, so they **vanish or explode**. Use **He initialization** (`std = √(2/fan_in)`) for ReLU and Xavier for tanh, and never initialize all weights equally.',
    '**Batch norm** standardizes each feature over the batch (and behaves differently in `train()` vs `eval()`); **layer norm** standardizes each example across its features and behaves the same in both. Place them between the layer and the activation; prefer layer norm for transformers, small batches and RL.',
    '**Dropout** zeroes activations randomly in training and scales survivors by `1/(1−p)`; it is off in `eval()`. Together with **weight decay**, **augmentation** and **early stopping** it fights overfitting.',
    '**Residual connections** (`h + f(h)`) give gradients a direct path to early layers, which makes networks of 100+ layers trainable and are in every modern architecture.',
    'Tune hyperparameters in order: working baseline, **learning rate on a log scale**, schedule, capacity, then regularization. Prefer random over grid search, and always remember `model.train()` for training and `model.eval()` for evaluation and deployment.',
  ],
  reading: [
    { title: 'Andrej Karpathy: A Recipe for Training Neural Networks', url: 'https://karpathy.github.io/2019/04/25/recipe/', source: 'article', note: 'The most useful practical guide to training and debugging deep networks.' },
    { title: 'Delving Deep into Rectifiers (He initialization)', url: 'https://arxiv.org/abs/1502.01852', source: 'paper', note: 'He et al. derive the √(2/n) initialization for ReLU networks.' },
    { title: 'Batch Normalization: Accelerating Deep Network Training', url: 'https://arxiv.org/abs/1502.03167', source: 'paper', note: 'The original batch normalization paper.' },
    { title: 'Dropout: A Simple Way to Prevent Neural Networks from Overfitting', url: 'https://jmlr.org/papers/v15/srivastava14a.html', source: 'paper', note: 'Srivastava, Hinton et al., the dropout paper (JMLR 2014).' },
    { title: 'Random Search for Hyper-Parameter Optimization', url: 'https://jmlr.org/papers/v13/bergstra12a.html', source: 'paper', note: 'Bergstra and Bengio on why random search beats grid search.' },
  ],
};
