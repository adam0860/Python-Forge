import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-gradient-descent',
  title: 'Loss Functions and Gradient Descent',
  summary: 'How a model actually learns: a loss function scores its mistakes and gradient descent walks the parameters downhill. Covers learning rates, mini-batches and SGD, and the momentum and Adam optimizers, each built from scratch.',
  minutes: 22,
  objectives: [
    'Choose a loss function for regression and classification, and explain robustness to outliers (MSE, MAE, Huber)',
    'Write the gradient descent update and run it on a real model',
    'Explain what the learning rate does and recognize too-small, good and too-large values',
    'Distinguish full-batch, mini-batch and stochastic gradient descent and count updates per epoch',
    'Describe momentum and Adam and when to prefer each',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Loss functions: a score for being wrong',
      blocks: [
        {
          type: 'p',
          text: 'A neural network with random weights outputs nonsense. To improve it we need a number that says *how* wrong it is: the **[[loss-function|loss]]**. Training is then a search for the parameters that make the average loss over the training data small. The loss must be **differentiable** (so we can compute slopes) and must reflect what we care about. Two families cover most work. For **regression** use a distance between prediction and target. For **classification** use **[[cross-entropy]]**, which punishes a confident wrong answer severely.',
        },
        {
          type: 'math',
          tex: '\\text{MSE} = \\frac{1}{n}\\sum_i (\\hat y_i - y_i)^2 \\qquad \\text{MAE} = \\frac{1}{n}\\sum_i |\\hat y_i - y_i| \\qquad \\text{BCE} = -\\frac{1}{n}\\sum_i \\left[ y_i \\ln p_i + (1-y_i)\\ln(1-p_i) \\right]',
          caption: 'Mean squared error and mean absolute error for regression, and binary cross-entropy for a classifier that outputs a probability p for the label y ∈ {0, 1}.',
        },
        {
          type: 'p',
          text: 'Which distance for regression? Squaring (**MSE**) is smooth and punishes large errors heavily, which is good when errors are small and Gaussian but terrible if the data contains a few wild outliers: one bad point can dominate. The absolute value (**MAE**) treats all errors proportionally but has a corner at zero. The **[[huber-loss|Huber loss]]** combines them: quadratic for small errors, linear for large ones. Watch what a single outlier (the residual 5.0) does:',
        },
        {
          type: 'code',
          title: 'losses_outlier.py',
          runnable: true,
          code: `residuals = [0.1, -0.2, 0.15, 5.0]

def mse(r):
    return sum(e ** 2 for e in r) / len(r)

def mae(r):
    return sum(abs(e) for e in r) / len(r)

def huber(r, delta=1.0):
    return sum(0.5 * e ** 2 if abs(e) <= delta else delta * (abs(e) - 0.5 * delta) for e in r) / len(r)

for name, f in [("mse", mse), ("mae", mae), ("huber", huber)]:
    print(name, round(f(residuals[:3]), 4), round(f(residuals), 4))`,
          output: `mse 0.0242 6.2681
mae 0.15 1.3625
huber 0.0121 1.1341`,
          annotations: [
            { lines: 1, text: 'Prediction errors (residuals): three small ones and one outlier of 5.0.' },
            { lines: '3-4', text: 'MSE: the mean of the squared errors.' },
            { lines: '6-7', text: 'MAE: the mean of the absolute errors.' },
            { lines: '9-10', text: 'Huber: for an error within `delta` use `½e²` (like MSE), beyond it use a straight line `delta·(|e| − ½·delta)` (like MAE). The two pieces join smoothly.' },
            { lines: '12-13', text: 'Each loss on the first three residuals only, then on all four. MSE jumps from 0.024 to 6.27 (a factor of **259**) because of one point; MAE rises 9×; Huber 94×, but in absolute terms stays close to MAE’s scale. Huber is the loss of choice in reinforcement learning (DQN), where a few huge errors early in training would otherwise swamp the gradient.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'The loss defines the goal',
          text: 'The model optimizes *exactly* what you wrote, not what you meant. MSE aims for the mean, MAE for the median. Cross-entropy rewards well-calibrated probabilities, while a loss on raw accuracy is not even differentiable (it is a step function, so it has no slope to follow). A great deal of applied machine learning is choosing a loss that is a good smooth stand-in for the real objective. In reinforcement learning, the *reward* plays this role, which is why reward design gets a whole lesson later.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Your regression data contains a few wildly wrong measurements. Which loss is the best choice to keep them from dominating training?',
      options: [
        { text: 'Huber loss (or MAE), because large errors grow only linearly', correct: true, why: 'Beyond a threshold Huber’s penalty grows linearly, so an outlier’s influence is bounded relative to MSE, where it grows with the square.' },
        { text: 'MSE, because squaring makes every error small', why: 'Squaring makes errors bigger when they exceed 1, so a huge outlier is penalized enormously.' },
        { text: 'Accuracy, because it counts errors rather than measuring them', why: 'Accuracy is for classification, and being a step function it is not differentiable, so gradient descent cannot use it.' },
        { text: 'Cross-entropy, because it is used in deep learning', why: 'Cross-entropy is a classification loss for probabilities; it is not the right tool for predicting a continuous value.' },
      ],
      explanation: 'MSE punishes large errors quadratically and lets outliers dominate; MAE and Huber grow linearly for large errors and are much more robust.',
    },
    {
      kind: 'concept',
      title: 'Gradient descent: walking downhill',
      blocks: [
        {
          type: 'p',
          text: 'We have a loss that depends on thousands or millions of parameters. How do we find the values that minimize it? Try everything: impossible. Instead, use the **[[gradient]]**: the vector of partial derivatives that points in the direction of *steepest increase*. **[[gradient-descent|Gradient descent]]** repeatedly steps the *opposite* way: `w ← w − η · ∂L/∂w`, where `η` (eta) is the **[[learning-rate|learning rate]]**, the step size. It is like descending a foggy mountain by always stepping down the steepest slope under your feet. Try it on the simplest possible loss, a parabola `L(w) = (w − 3)²`, whose minimum is at `w = 3`:',
        },
        {
          type: 'graph',
          caption: 'One gradient-descent step on L(w) = (w − 3)². The red point is the current position; the green point is where the update w − s·L′(w) lands. Drag the position w and the step size (learning rate) s. A small s creeps; s = 0.5 lands exactly on the minimum; s = 1 bounces to the mirror point forever; s > 1 jumps further away every time and diverges.',
          x: [-1, 7],
          y: [0, 18],
          functions: [{ expr: '(x-3)^2', label: 'loss L(w)', color: 'blue' }],
          points: [
            { x: 'w', y: '(w-3)^2', color: 'red' },
            { x: 'w-s*2*(w-3)', y: '(w-s*2*(w-3))^2', color: 'green' },
          ],
          sliders: [
            { name: 'w', min: -0.5, max: 6.5, step: 0.1, value: 0.5, label: 'position w' },
            { name: 's', min: 0.05, max: 1.2, step: 0.05, value: 0.3, label: 'learning rate' },
          ],
          readouts: [
            { label: 'gradient L′(w)', expr: '2*(w-3)', digits: 2 },
            { label: 'next w', expr: 'w-s*2*(w-3)', digits: 2 },
            { label: 'next loss', expr: '(w-s*2*(w-3))^2', digits: 2 },
          ],
          height: 320,
        },
        {
          type: 'p',
          text: 'Now a real (if small) model. Fit `y ≈ w·x + b` to eight noisy points generated around the line `y = 2x + 1`. Each epoch computes the predictions, the mean squared error, its two partial derivatives (derived in the calculus lesson), and takes a step:',
        },
        {
          type: 'code',
          title: 'gd_linear.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

x = np.array([0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0])
noise = np.array([0.3, -0.2, 0.1, -0.4, 0.25, 0.0, -0.3, 0.15])
y = 2 * x + 1 + noise

w, b, lr = 0.0, 0.0, 0.02
for epoch in range(1, 501):
    err = w * x + b - y
    loss = np.mean(err ** 2)
    dw = 2 * np.mean(err * x)
    db = 2 * np.mean(err)
    w -= lr * dw
    b -= lr * db
    if epoch in (1, 10, 100, 500):
        print(epoch, round(float(loss), 4), round(float(w), 3), round(float(b), 3))
print(np.round(np.polyfit(x, y, 1), 3))`,
          output: `1 84.5594 1.535 0.32
10 0.1484 2.096 0.496
100 0.0693 2.025 0.847
500 0.0581 1.986 1.036
[1.986 1.037]`,
          annotations: [
            { lines: '3-5', text: 'Eight points scattered around `y = 2x + 1`, with a fixed pattern of noise.' },
            { lines: 7, text: 'Start with `w = 0`, `b = 0` (a bad model) and a learning rate of 0.02.' },
            { lines: '9-10', text: 'The forward pass: the errors `ŷ − y` and the mean squared error. The loss printed each time is the one *before* that epoch’s update.' },
            { lines: '11-12', text: 'The gradient of the MSE: `∂L/∂w = 2·mean(err·x)` and `∂L/∂b = 2·mean(err)`.' },
            { lines: '13-14', text: 'The update: step against the gradient, scaled by the learning rate.' },
            { lines: '15-16', text: 'Print a few checkpoints.' },
            { lines: 17, text: 'The loss collapses from 84.6 to 0.15 in ten epochs, then creeps down slowly as `b` (the harder-to-move parameter) catches up. After 500 epochs `w = 1.986` and `b = 1.036`, matching the exact least-squares fit from `np.polyfit` on the last line. Gradient descent found the closed-form answer *without* being told the formula, which matters because for neural networks no closed form exists.' },
          ],
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Gradient descent moves the parameters in the direction *opposite* to the gradient of the loss, because the gradient points toward the steepest increase.',
      answer: true,
      explanation: 'True. The gradient is the direction in which the loss grows fastest, so subtracting `learning_rate * gradient` moves the parameters toward lower loss. A plus sign would be gradient *ascent*, which climbs the loss.',
    },
    {
      kind: 'concept',
      title: 'The learning rate, and mini-batches',
      blocks: [
        {
          type: 'p',
          text: 'The learning rate is the single most important hyperparameter. Too small and training crawls; too large and the steps overshoot the valley and the loss bounces or explodes. On the loss `w²` (gradient `2w`), each step multiplies `w` by `1 − 2η`. Run 20 steps from `w = 5` with four learning rates:',
        },
        {
          type: 'code',
          title: 'learning_rates.py',
          runnable: true,
          code: `for lr in (0.01, 0.1, 0.9, 1.1):
    w = 5.0
    for step in range(20):
        w -= lr * 2 * w
    print(lr, round(w, 4))`,
          output: `0.01 3.338
0.1 0.0576
0.9 0.0576
1.1 191.688`,
          annotations: [
            { lines: 1, text: 'Four candidate learning rates, from tiny to too large.' },
            { lines: '2-4', text: 'Twenty gradient-descent steps on `L(w) = w²` from `w = 5`: the update `w −= lr · 2w` multiplies `w` by `(1 − 2·lr)` each time.' },
            { lines: 5, text: '`0.01`: the factor is 0.98, so after 20 steps `w` has barely moved (3.34): too slow. `0.1`: factor 0.8, converges to 0.058. `0.9`: factor −0.8, so `w` flips sign every step but still shrinks (0.058): oscillating yet converging. `1.1`: factor −1.2, each step overshoots by more than it fixes and `w` explodes to 191.7: **divergence**. The rule: the best rate is as large as possible without diverging.' },
          ],
        },
        {
          type: 'p',
          text: 'The second question is *how much data to use per step*. The true gradient averages over all `n` training examples (**full-batch** gradient descent), which is exact but slow for millions of examples. **[[sgd|Stochastic gradient descent (SGD)]]** instead estimates the gradient from a single example; **[[mini-batch|mini-batch]]** SGD uses a small random batch (32, 64, 256…) and is what everyone uses. The estimate is noisy but *unbiased*, it is far cheaper per step, and the noise even helps escape poor regions. One pass through the data is an **epoch**, which contains `ceil(n / batch_size)` updates. Same model, same five epochs, three batch sizes:',
        },
        {
          type: 'code',
          title: 'minibatch_sgd.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

rng = np.random.default_rng(0)
x = rng.uniform(-1, 1, size=200)
y = 3 * x - 2 + 0.3 * rng.normal(size=200)

def train(batch_size, epochs=5, lr=0.1):
    w, b, updates = 0.0, 0.0, 0
    order = np.random.default_rng(1)
    for epoch in range(epochs):
        idx = order.permutation(len(x))
        for start in range(0, len(x), batch_size):
            batch = idx[start:start + batch_size]
            err = w * x[batch] + b - y[batch]
            w -= lr * 2 * np.mean(err * x[batch])
            b -= lr * 2 * np.mean(err)
            updates += 1
    loss = np.mean((w * x + b - y) ** 2)
    return updates, round(float(w), 2), round(float(b), 2), round(float(loss), 3)

for bs in (200, 20, 1):
    print("batch", bs, train(bs, lr=0.1 if bs > 1 else 0.02))`,
          output: `batch 200 (5, 0.85, -1.23, 2.113)
batch 20 (50, 2.88, -2.02, 0.096)
batch 1 (1000, 2.93, -2.06, 0.096)`,
          outputVaries: true,
          annotations: [
            { lines: '3-5', text: '200 noisy points around the true line `y = 3x − 2`. A perfect fit would score a loss of about 0.09 (the noise variance).' },
            { lines: '8-9', text: 'Start at zero; `order` is a random generator used to shuffle the examples each epoch.' },
            { lines: '10-11', text: 'Each epoch begins with a fresh random permutation of the example indices. Shuffling is essential: without it, every epoch would see the data in the same order.' },
            { lines: '12-13', text: 'Walk through the data in chunks of `batch_size`.' },
            { lines: '14-16', text: 'The gradient step uses *only the current batch* (the same formulas as before, restricted to `x[batch]`).' },
            { lines: 17, text: 'Count the parameter updates.' },
            { lines: '18-19', text: 'Report the updates, the final `w` and `b`, and the loss on all data.' },
            { lines: '21-22', text: '**Full batch** (200) makes only 5 updates in 5 epochs and is nowhere near done (w = 0.85, loss 2.11). **Mini-batches of 20** make 50 updates and nearly reach the optimum (loss 0.096, the noise floor). **Batch size 1** makes 1000 noisy updates (needing a smaller learning rate) and ends in the same place. Per epoch, smaller batches mean more, noisier, cheaper updates; in practice 32–256 balances noise against how well GPUs parallelize.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Reading a loss curve',
          text: 'Plot the training loss against the epoch. **Smoothly falling**: healthy. **Flat from the start**: learning rate too small, or a bug (check that gradients are non-zero). **Zig-zag or rising**: learning rate too high. **`nan`**: it exploded (lower the learning rate, check the inputs). **Training falls but validation rises**: overfitting (the previous unit). Looking at this plot is the first debugging step in all of deep learning.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the gradient descent update: move the weight against the gradient, scaled by the learning rate.',
      template: `w ___ lr * grad`,
      templateIsCode: true,
      blanks: [{ answers: ['-='] }],
      wordBank: ['-=', '+=', '*=', '/='],
      explanation: '`w -= lr * grad` subtracts a step proportional to the gradient: downhill. `+=` would climb the loss (gradient *ascent*), and the loss would increase every step.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program (two gradient-descent steps on `L(w) = w²`, whose gradient is `2w`).',
      code: `w = 4.0
lr = 0.25
for _ in range(2):
    w -= lr * 2 * w
    print(w, end=" ")`,
      answer: '2.0 1.0',
      hint: 'Each step multiplies w by (1 − 2·0.25) = 0.5.',
      explanation: 'The first step: 4 − 0.25·8 = 2.0. The second: 2 − 0.25·4 = 1.0. The weight halves each step, converging geometrically toward the minimum at 0.',
    },
    {
      kind: 'concept',
      title: 'Momentum and Adam',
      blocks: [
        {
          type: 'p',
          text: 'Plain gradient descent struggles on loss surfaces shaped like a long, narrow canyon, which is typical. The steep walls force a small learning rate to avoid overshooting, but then progress *along* the gentle canyon floor is very slow. **[[momentum|Momentum]]** fixes this by keeping a running **velocity**: `v ← β·v + g`, then `w ← w − η·v`. Consistent gradient components (along the canyon) add up and accelerate; oscillating ones (across it) cancel. It is like a heavy ball rolling downhill. **[[adam|Adam]]** goes further: it keeps a running average of the gradient (momentum) *and* of its square, and divides each parameter’s step by the square root of the latter, so every parameter gets an automatically scaled step size. It is the standard default optimizer for deep learning.',
        },
        {
          type: 'math',
          tex: '\\text{Adam: } m \\leftarrow \\beta_1 m + (1-\\beta_1) g \\quad v \\leftarrow \\beta_2 v + (1-\\beta_2) g^2 \\quad w \\leftarrow w - \\eta\\,\\frac{\\hat m}{\\sqrt{\\hat v} + \\varepsilon}',
          caption: 'Adam’s update (m̂ and v̂ are m and v with a bias correction for the first steps). Typical defaults: β₁ = 0.9, β₂ = 0.999, ε = 10⁻⁸, learning rate 10⁻³.',
        },
        {
          type: 'p',
          text: 'Here are all three on a deliberately nasty loss, `L = w₁² + 100·w₂²`: ten times steeper in one direction than the other (curvature differs by a factor of 100), starting at `(5, 1)`. The code counts the steps needed to get the loss below 10⁻⁶:',
        },
        {
          type: 'code',
          title: 'optimizers.py',
          runnable: true,
          code: `import math

def grad(w):
    return [2 * w[0], 200 * w[1]]

def loss(w):
    return w[0] ** 2 + 100 * w[1] ** 2

def run(update, max_steps=2000):
    w, state = [5.0, 1.0], {}
    for step in range(1, max_steps + 1):
        w = update(w, grad(w), state)
        if loss(w) < 1e-6:
            return step
    return None

def gd(lr):
    return lambda w, g, s: [w[i] - lr * g[i] for i in range(2)]

def momentum(lr, beta):
    def update(w, g, s):
        v = s.setdefault("v", [0.0, 0.0])
        for i in range(2):
            v[i] = beta * v[i] + g[i]
        return [w[i] - lr * v[i] for i in range(2)]
    return update

def adam(lr, b1=0.9, b2=0.999, eps=1e-8):
    def update(w, g, s):
        s["t"] = s.get("t", 0) + 1
        m = s.setdefault("m", [0.0, 0.0])
        v = s.setdefault("v", [0.0, 0.0])
        out = []
        for i in range(2):
            m[i] = b1 * m[i] + (1 - b1) * g[i]
            v[i] = b2 * v[i] + (1 - b2) * g[i] ** 2
            mh = m[i] / (1 - b1 ** s["t"])
            vh = v[i] / (1 - b2 ** s["t"])
            out.append(w[i] - lr * mh / (math.sqrt(vh) + eps))
        return out
    return update

print("gradient descent, lr 0.0099:", run(gd(0.0099)))
print("gradient descent, lr 0.0101:", run(gd(0.0101)) or "never")
print("momentum, lr 0.003:         ", run(momentum(0.003, 0.9)))
print("adam, lr 0.3:               ", run(adam(0.3)))`,
          output: `gradient descent, lr 0.0099: 463
gradient descent, lr 0.0101: never
momentum, lr 0.003:          144
adam, lr 0.3:                157`,
          annotations: [
            { lines: '3-7', text: 'The loss is a narrow canyon: `w₂` is 100× steeper than `w₁`. Its gradient is `[2·w₁, 200·w₂]`.' },
            { lines: '9-15', text: '`run` applies an optimizer’s `update` function repeatedly from the start `(5, 1)` and returns the number of steps until the loss drops below 10⁻⁶, or `None` if it never does within the limit. The `state` dict lets each optimizer keep its running averages between steps.' },
            { lines: '17-18', text: 'Plain gradient descent as a one-line update.' },
            { lines: '20-26', text: 'Momentum: the velocity `v` accumulates the gradients (`β = 0.9` remembers about the last ten), and the weights move along `v`.' },
            { lines: '28-41', text: 'Adam: running averages `m` of the gradient and `v` of its square, bias-corrected (`mh`, `vh`), and a step `lr · mh / (√vh + ε)`. Dividing by `√vh` equalizes the step size across parameters with very different gradient scales.' },
            { lines: '43-46', text: 'Plain gradient descent is trapped: the steep direction limits the learning rate to just under 0.01 (at 0.0101 it **diverges**, hence "never"), and at 0.0099 it needs **463 steps** because the gentle direction crawls. **Momentum needs 144** steps, about 3× fewer, and **Adam 157**, without any careful per-direction tuning. On real networks with millions of differently scaled parameters this adaptivity is a large practical win.' },
          ],
        },
        {
          type: 'table',
          headers: ['Optimizer', 'Remembers', 'Typical learning rate', 'Use'],
          rows: [
            ['**SGD**', 'nothing', '0.01–0.1', 'Simple, strong with tuning and schedules; classic for vision'],
            ['**SGD + momentum**', 'a velocity (β ≈ 0.9)', '0.01–0.1', 'Smoother, faster; still a vision favourite'],
            ['**Adam / AdamW**', 'mean and variance of gradients', '0.001 (1e-3); 3e-4 is a common default', 'The default for most deep learning, transformers and RL; AdamW adds proper weight decay'],
          ],
          caption: 'When unsure, start with Adam (or AdamW) at 1e-3 or 3e-4 and tune from there.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Local minima, saddle points and non-convexity',
          text: 'The parabola has one bottom. Real neural-network losses are **non-convex**: landscapes with plateaus, ridges and many valleys. In very high dimensions true local minima are rare: most flat spots are **saddle points** (a minimum in some directions, a maximum in others), and the noise of mini-batches plus momentum helps roll off them. Surprisingly, the many minima that SGD finds in big networks tend to be about equally good. Reaching *a* good minimum is usually enough; reaching *the* global one is unnecessary.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This loop is supposed to minimize `(w − 3)²`, but the loss keeps growing. Tap the faulty line.',
      lines: [
        'grad = 2 * (w - 3)',
        'w = w + lr * grad',
        'loss = (w - 3) ** 2',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The update must **subtract** the gradient: `w = w - lr * grad`. Adding it climbs the loss (gradient ascent), so every step moves away from the minimum and the loss grows.',
    },
    {
      kind: 'numeric',
      prompt: 'A training set has 1000 examples and you use mini-batches of 64 (the last batch is smaller). How many parameter updates happen in **one epoch**?',
      answer: '16',
      hint: 'Divide 1000 by 64 and round *up*: the last, partial batch still causes an update.',
      explanation: '1000 / 64 = 15.625, so there are 15 full batches and one partial batch of 40 examples: 16 updates per epoch (`ceil(n / batch_size)`).',
      label: 'Updates:',
    },
    {
      kind: 'code',
      prompt: 'Write `gradient_descent(grad_fn, w0, lr, steps)` for a single scalar parameter. Starting at `w0`, apply `w = w - lr * grad_fn(w)` for `steps` iterations and return the list of all values of `w` visited, **including** the starting value (so the list has `steps + 1` entries).',
      starter: `def gradient_descent(grad_fn, w0, lr, steps):
    ...
`,
      solution: `def gradient_descent(grad_fn, w0, lr, steps):
    w = w0
    path = [w]
    for _ in range(steps):
        w = w - lr * grad_fn(w)
        path.append(w)
    return path
`,
      tests: `grad = lambda w: 2 * w
assert gradient_descent(grad, 4.0, 0.25, 3) == [4.0, 2.0, 1.0, 0.5]
assert gradient_descent(grad, 4.0, 1.0, 2) == [4.0, -4.0, 4.0]
assert gradient_descent(grad, 3.0, 0.0, 2) == [3.0, 3.0, 3.0]
assert gradient_descent(grad, 7.0, 0.1, 0) == [7.0]
path = gradient_descent(grad, 1.0, 1.1, 5)
assert len(path) == 6 and abs(path[-1]) > 2.4

quad = lambda w: 2 * (w - 3)
p = gradient_descent(quad, 0.0, 0.5, 4)
assert p[1] == 3.0 and p[-1] == 3.0

p = gradient_descent(quad, 10.0, 0.1, 200)
assert abs(p[-1] - 3.0) < 1e-9
assert all(abs(a - 3) >= abs(b - 3) for a, b in zip(p, p[1:]))
calls = []
gradient_descent(lambda w: calls.append(w) or 0.0, 1.0, 0.1, 3)
assert len(calls) == 3`,
      checks: ['Returns the whole path, starting with `w0`, of length `steps + 1`', 'Each step is `w - lr * grad_fn(w)`; `steps = 0` returns just `[w0]`', 'Calls `grad_fn` exactly once per step; large learning rates diverge, small ones converge'],
      hint: 'Keep `w` and a list `path = [w]`. Loop `steps` times: update `w` against the gradient and append it to the path.',
      explanation: 'Every optimizer in every deep-learning library is a fancier version of this loop. Returning the path (rather than just the final value) is how you plot or debug training: you can see whether it converges, oscillates or explodes.',
    },
    {
      kind: 'code',
      prompt: 'Write `minibatches(n, batch_size, seed)` returning a list of lists of indices `0 … n-1` for one epoch: shuffle the indices with `random.Random(seed)` and cut them into consecutive batches of `batch_size` (the last may be smaller). Every index appears exactly once. Return `[]` for `n = 0` and raise `ValueError` if `batch_size < 1`.',
      starter: `import random

def minibatches(n, batch_size, seed):
    ...
`,
      solution: `import random


def minibatches(n, batch_size, seed):
    if batch_size < 1:
        raise ValueError("batch_size must be at least 1")
    idx = list(range(n))
    random.Random(seed).shuffle(idx)
    return [idx[i:i + batch_size] for i in range(0, n, batch_size)]
`,
      tests: `batches = minibatches(10, 4, 0)
assert [len(b) for b in batches] == [4, 4, 2]
flat = [i for b in batches for i in b]
assert sorted(flat) == list(range(10))
assert flat != list(range(10))

assert minibatches(10, 4, 0) == batches
assert minibatches(10, 4, 1) != batches or minibatches(10, 4, 2) != batches

assert minibatches(0, 3, 0) == []
assert [len(b) for b in minibatches(6, 3, 5)] == [3, 3]
assert [len(b) for b in minibatches(3, 10, 5)] == [3]
assert [len(b) for b in minibatches(5, 1, 5)] == [1, 1, 1, 1, 1]
assert sorted(i for b in minibatches(1000, 64, 3) for i in b) == list(range(1000))
assert len(minibatches(1000, 64, 3)) == 16

for bad in (0, -2):
    try:
        minibatches(5, bad, 0)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")
assert all(isinstance(b, list) for b in batches)`,
      checks: ['Shuffles with `random.Random(seed)` so the result is reproducible, and every index appears exactly once', 'Consecutive batches of `batch_size`; the last batch may be smaller; `n = 0` gives `[]`', 'Raises `ValueError` when `batch_size < 1`'],
      hint: 'Make `idx = list(range(n))`, shuffle it with `random.Random(seed).shuffle(idx)`, then slice it with `idx[i:i + batch_size] for i in range(0, n, batch_size)`.',
      explanation: 'This is the heart of every data loader: shuffle once per epoch, then slice. PyTorch’s `DataLoader(dataset, batch_size=64, shuffle=True)` does precisely this, plus parallel loading. The seeded generator gives reproducible experiments, which matters when comparing runs.',
    },
    {
      kind: 'code',
      prompt: 'Write `huber_loss(residuals, delta=1.0)` returning the **mean** Huber loss: for each residual `e`, use `0.5 * e**2` if `abs(e) <= delta`, otherwise `delta * (abs(e) - 0.5 * delta)`. Raise `ValueError` for an empty list.',
      starter: `def huber_loss(residuals, delta=1.0):
    ...
`,
      solution: `def huber_loss(residuals, delta=1.0):
    if not residuals:
        raise ValueError("no residuals")
    total = 0.0
    for e in residuals:
        a = abs(e)
        if a <= delta:
            total += 0.5 * e ** 2
        else:
            total += delta * (a - 0.5 * delta)
    return total / len(residuals)
`,
      tests: `assert abs(huber_loss([0.5]) - 0.125) < 1e-12
assert abs(huber_loss([3.0]) - 2.5) < 1e-12
assert abs(huber_loss([-3.0]) - 2.5) < 1e-12
assert abs(huber_loss([0.5, 3.0]) - 1.3125) < 1e-12
assert abs(huber_loss([0.0, 0.0])) < 1e-12
assert abs(huber_loss([1.0]) - 0.5) < 1e-12
assert abs(huber_loss([2.0], delta=2.0) - 2.0) < 1e-12
assert abs(huber_loss([4.0], delta=2.0) - 6.0) < 1e-12
assert abs(huber_loss([0.1, -0.2, 0.15, 5.0]) - 1.134062) < 1e-5

r = [0.3, -4.0]
huber_loss(r)
assert r == [0.3, -4.0]
try:
    huber_loss([])
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")
assert isinstance(huber_loss([1, 2]), float)`,
      checks: ['Quadratic `0.5·e²` for `|e| <= delta`, linear `delta·(|e| − 0.5·delta)` beyond it, averaged over the residuals', 'The two pieces agree at `|e| = delta`; works for negative residuals and any `delta`', 'Raises `ValueError` for an empty list and does not modify its input'],
      hint: 'Loop over the residuals; let `a = abs(e)`; add `0.5 * e ** 2` when `a <= delta`, else `delta * (a - 0.5 * delta)`; divide the total by `len(residuals)`.',
      explanation: 'Check the join: at `|e| = delta` both branches give `0.5·delta²`, so the loss is continuous, and their slopes also agree (`delta`), so it is smooth enough for gradient descent. PyTorch provides it as `nn.HuberLoss` / `smooth_l1_loss`, and DQN-style agents use it for exactly the outlier reasons seen in this lesson.',
    },
  ],
  takeaways: [
    'A **loss function** scores the model’s mistakes with a differentiable number: MSE/MAE/Huber for regression (Huber is robust to outliers), cross-entropy for classification. The model optimizes exactly what the loss measures.',
    '**Gradient descent** repeats `w ← w − η·∇L`: step against the gradient, the direction of steepest increase. It finds the same answer as the closed form for linear regression, and works for models with no closed form.',
    'The **learning rate** is the most important knob: too small crawls, too large oscillates or diverges (`nan`). Read the loss curve to diagnose it.',
    '**Mini-batch SGD** estimates the gradient from a small random batch: noisy but unbiased and much cheaper, with `ceil(n / batch_size)` updates per epoch. Shuffle every epoch.',
    '**Momentum** accumulates a velocity to speed along consistent directions; **Adam** adds a per-parameter step size from running gradient statistics. Start with Adam/AdamW at 1e-3 or 3e-4. Real losses are non-convex, but reaching a good minimum is enough.',
  ],
  reading: [
    { title: 'Sebastian Ruder: An overview of gradient descent optimization algorithms', url: 'https://www.ruder.io/optimizing-gradient-descent/', source: 'article', note: 'SGD, momentum, Adam and friends compared, with the equations.' },
    { title: '3Blue1Brown: Gradient descent, how neural networks learn (chapter 2)', url: 'https://www.youtube.com/watch?v=IHZwWFHWa-w', source: 'video', note: 'A beautiful visual explanation of loss, gradient and the descent.' },
    { title: 'Distill: Why Momentum Really Works', url: 'https://distill.pub/2017/momentum/', source: 'article', note: 'An interactive deep dive into momentum and the geometry of the loss.' },
    { title: 'Kingma and Ba: Adam: A Method for Stochastic Optimization (the paper)', url: 'https://arxiv.org/abs/1412.6980', source: 'paper', note: 'The original Adam paper, short and readable.' },
  ],
};
