import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-autograd',
  title: 'Autograd',
  summary: 'PyTorch’s automatic differentiation: mark tensors with requires_grad, call backward(), and read the gradients, with no backward pass written by hand. Learn gradient accumulation, no_grad, detach, non-scalar outputs and the common autograd errors.',
  minutes: 22,
  objectives: [
    'Use `requires_grad`, `backward()` and `.grad` to compute gradients of a scalar loss',
    'Explain why gradients accumulate and why they must be zeroed each step',
    'Use `torch.no_grad()` and `detach()` correctly, and update leaf tensors safely',
    'Train a model by hand with autograd and manual gradient-descent updates',
    'Handle non-scalar outputs, `torch.autograd.grad`, higher-order derivatives and `retain_graph`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'requires_grad and backward()',
      blocks: [
        {
          type: 'p',
          text: 'In the last unit you wrote a tiny autodiff engine: every operation recorded its inputs, and `backward()` walked that record in reverse. PyTorch’s **[[autograd]]** is the industrial version of the same idea. Create a tensor with `requires_grad=True` and PyTorch starts **recording every operation** that involves it, building the computational graph as ordinary Python executes (a *dynamic*, define-by-run graph, so `if` statements and loops just work). Calling `.backward()` on a scalar result then fills in the `.grad` attribute of every tensor that required gradients. Here is exactly the hand calculation from the backpropagation lesson (`L = (w·x + b − y)²`, with `w = 3`, `b = 1`, `x = 2`, `y = 4`), done by PyTorch:',
        },
        {
          type: 'code',
          title: 'autograd_basics.py',
          desktopOnly: true,
          code: `import torch

w = torch.tensor(3.0, requires_grad=True)
b = torch.tensor(1.0, requires_grad=True)
x, y = 2.0, 4.0
loss = (w * x + b - y) ** 2
print(loss.item(), loss.requires_grad, loss.is_leaf, w.is_leaf)
loss.backward()
print(w.grad.item(), b.grad.item())`,
          output: `9.0 True False True
12.0 6.0`,
          annotations: [
            { lines: '3-4', text: '`w` and `b` are the **parameters**: `requires_grad=True` tells PyTorch to track them and to compute gradients for them. They are **leaf** tensors: created directly by you, not computed from other tracked tensors.' },
            { lines: 6, text: 'The forward pass is ordinary arithmetic. Because `w` and `b` are tracked, PyTorch quietly records each operation (multiply, add, subtract, power) and builds the graph.' },
            { lines: 7, text: 'The result `loss` is 9.0, it also requires grad (it depends on tracked tensors), but it is *not* a leaf (it was computed). Only leaves get their `.grad` filled in by default.' },
            { lines: 8, text: '`loss.backward()` runs backpropagation through the recorded graph, starting from the scalar `loss`.' },
            { lines: 9, text: 'The gradients: `dL/dw = 12.0` and `dL/db = 6.0`, identical to the hand derivation and to the autodiff class you built. Same algorithm, now for any network you can write.' },
          ],
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'Dynamic graphs',
          text: 'Early frameworks (Theano, TensorFlow 1) required you to *declare* a static graph first and then run it, which made debugging painful. Chainer pioneered the define-by-run approach, where the graph is rebuilt on every forward pass, and PyTorch’s autograd (building on the Python `autograd` library and Torch’s experience) made it mainstream. The benefit: the network can change shape from step to step (variable-length sequences, recursion, a game agent with a different number of units each turn), and you can inspect any intermediate value with `print`.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Only scalars can start a backward pass',
          text: 'Gradients are defined for a **single number** (the loss) with respect to many inputs. That is why `loss.backward()` works on a scalar. A loss over a batch is reduced to a scalar by `mean()` or `sum()` first. (Calling `backward()` on a tensor with several elements needs an extra argument, which this lesson covers at the end.)',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'After `loss.backward()`, where do you find the gradient of the loss with respect to a parameter `w`?',
      options: [
        { text: 'In `w.grad`, an attribute filled in by `backward()` (for tensors created with `requires_grad=True`)', correct: true, why: '`backward()` stores each leaf tensor’s gradient in its `.grad` attribute, which the optimizer then reads.' },
        { text: 'It is returned by `loss.backward()` as a value', why: '`backward()` returns `None`; it writes results into the `.grad` fields as a side effect.' },
        { text: 'In `loss.grad`, the gradient of the loss itself', why: '`loss` is not a leaf, so its `.grad` is not populated (and the gradient of the loss with respect to itself would be just 1).' },
        { text: 'You must call `torch.gradient(w)` afterwards', why: 'No further call is needed; gradients are ready in `.grad` right after `backward()`.' },
      ],
      explanation: '`backward()` computes gradients for every leaf tensor that requires grad and stores them in their `.grad` attributes; the optimizer step then uses them.',
    },
    {
      kind: 'concept',
      title: 'Accumulation, no_grad and detach',
      blocks: [
        {
          type: 'p',
          text: 'One behaviour surprises everyone once: `backward()` **adds** to `.grad` instead of replacing it. That is the right behaviour for the chain rule (a value used in several places sums its contributions) and it makes **[[gradient-accumulation|gradient accumulation]]** over several micro-batches possible, but it means that in a training loop you must **zero the gradients** every step, or the old ones pile up:',
        },
        {
          type: 'code',
          title: 'accumulation.py',
          desktopOnly: true,
          code: `import torch

w = torch.tensor(3.0, requires_grad=True)
for step in range(3):
    loss = (w * 2.0) ** 2
    loss.backward()
    print(step, w.grad.item())
w.grad.zero_()
(w * 2.0).pow(2).backward()
print("after zero_grad:", w.grad.item())`,
          output: `0 24.0
1 48.0
2 72.0
after zero_grad: 24.0`,
          annotations: [
            { lines: '4-7', text: 'The loss is `(2w)² = 4w²`, whose gradient at `w = 3` is `8w = 24`. The first backward gives 24, but nothing resets it: the second call *adds* another 24 (48), the third another (72). A training loop that forgets to zero gradients silently takes bigger and bigger wrong steps.' },
            { lines: 8, text: '`w.grad.zero_()` resets the accumulated gradient in place. (With an optimizer you will call `optimizer.zero_grad()`, which does this for every parameter.)' },
            { lines: '9-10', text: 'The next backward starts from zero again and gives the correct 24.' },
          ],
        },
        {
          type: 'p',
          text: 'Not everything should be recorded. During **inference** or when you update the weights yourself, tracking wastes memory and time (or is outright forbidden). `torch.no_grad()` is a context manager that turns recording off. `tensor.detach()` returns a tensor that shares the data but is cut out of the graph; use it to log a value, to convert to NumPy, or to stop gradients flowing into a target (as in reinforcement learning). PyTorch also protects you from corrupting the graph: modifying a leaf that requires grad in place is an error unless you are inside `no_grad`.',
        },
        {
          type: 'code',
          title: 'no_grad_detach.py',
          desktopOnly: true,
          code: `import torch

w = torch.tensor([1.0, 2.0], requires_grad=True)
y = (w * 3).sum()
print(y.requires_grad)
with torch.no_grad():
    z = (w * 3).sum()
    w -= 0.1
print(z.requires_grad, w.requires_grad, [round(v, 2) for v in w.tolist()])
d = w.detach()
print(d.requires_grad, [round(v, 2) for v in d.tolist()])
try:
    w.add_(1.0)
except RuntimeError as err:
    print("in-place on a leaf:", type(err).__name__)`,
          output: `True
False True [0.9, 1.9]
False [0.9, 1.9]
in-place on a leaf: RuntimeError`,
          annotations: [
            { lines: '4-5', text: 'Normal arithmetic on a tracked tensor produces a tracked result.' },
            { lines: '6-8', text: 'Inside `torch.no_grad()` nothing is recorded: `z` is untracked, and the in-place update `w -= 0.1` is allowed (this is how a hand-written optimizer step updates weights without confusing autograd).' },
            { lines: 9, text: '`z` does not require grad, `w` still does (it is still a tracked parameter), and the weights moved from `[1, 2]` to `[0.9, 1.9]`.' },
            { lines: '10-11', text: '`detach()` gives a tensor that shares the numbers but is cut from the graph (`requires_grad` is `False`), the safe way to read values out or to convert with `.numpy()`.' },
            { lines: '12-15', text: 'Outside `no_grad`, an in-place change to a leaf that requires grad is rejected with a `RuntimeError`: PyTorch guards against silently invalidating the recorded graph.' },
          ],
        },
        {
          type: 'table',
          headers: ['Tool', 'What it does', 'Typical use'],
          rows: [
            ['`requires_grad=True`', 'Track operations on this tensor; fill `.grad`', 'Parameters (nn.Module does this for you)'],
            ['`loss.backward()`', 'Backpropagate from a scalar; add into `.grad`', 'Every training step'],
            ['`optimizer.zero_grad()` / `w.grad.zero_()`', 'Reset accumulated gradients', 'Once per step, before `backward()`'],
            ['`with torch.no_grad():`', 'Do not record operations', 'Evaluation, inference, manual weight updates'],
            ['`torch.inference_mode()`', 'Like `no_grad`, with extra speed', 'Pure inference'],
            ['`t.detach()`', 'Same data, cut from the graph', 'Logging, `.numpy()`, RL targets'],
          ],
          caption: 'The six autograd controls you will use daily.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Code run inside `with torch.no_grad():` builds no computational graph, which saves memory and time, so it is the right place for model evaluation and inference.',
      answer: true,
      explanation: 'True. Without recording there is no graph to keep in memory and nothing to backpropagate, so evaluation loops use `torch.no_grad()` (or `torch.inference_mode()`), often roughly halving memory use and speeding things up.',
    },
    {
      kind: 'concept',
      title: 'Training by hand with autograd',
      blocks: [
        {
          type: 'p',
          text: 'You already have everything needed to train a model. Repeat the same four moves as in the from-scratch network, with autograd replacing the hand-written backward pass: forward and loss, `backward()`, update the parameters inside `no_grad`, zero the gradients. Here is the straight-line fit from the gradient-descent lesson, now in PyTorch. It reproduces the numbers from the NumPy version:',
        },
        {
          type: 'code',
          title: 'manual_training.py',
          desktopOnly: true,
          code: `import torch

x = torch.tensor([0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0])
noise = torch.tensor([0.3, -0.2, 0.1, -0.4, 0.25, 0.0, -0.3, 0.15])
y = 2 * x + 1 + noise

w = torch.zeros(1, requires_grad=True)
b = torch.zeros(1, requires_grad=True)
lr = 0.02
for epoch in range(1, 501):
    loss = ((w * x + b - y) ** 2).mean()
    loss.backward()
    with torch.no_grad():
        w -= lr * w.grad
        b -= lr * b.grad
    w.grad.zero_()
    b.grad.zero_()
    if epoch in (1, 10, 100, 500):
        print(epoch, round(loss.item(), 3), round(w.item(), 2), round(b.item(), 2))`,
          output: `1 84.559 1.54 0.32
10 0.148 2.1 0.5
100 0.069 2.02 0.85
500 0.058 1.99 1.04`,
          annotations: [
            { lines: '3-5', text: 'The same eight noisy points around `y = 2x + 1` as before.' },
            { lines: '7-8', text: 'The parameters, starting at zero, tracked by autograd. (Shape `(1,)` so they broadcast over `x`.)' },
            { lines: '10-11', text: '**Forward pass and loss**: written like plain maths. The mean squared error is a scalar.' },
            { lines: 12, text: '**Backward**: autograd fills `w.grad` and `b.grad`. No derivative formula was needed; compare with the `dw`, `db` lines of the NumPy version.' },
            { lines: '13-15', text: '**Update**: step against the gradient. This is inside `torch.no_grad()` because the update itself must not be recorded as part of the graph.' },
            { lines: '16-17', text: '**Zero the gradients** so the next iteration starts clean (the accumulation rule).' },
            { lines: '18-19', text: 'The loss falls from 84.6 to 0.058 and `w, b` converge to about `1.99, 1.04`: the same result as the NumPy version and the exact least-squares fit. Every PyTorch training loop is this skeleton; the next lessons replace the hand-written parts with `nn.Module` (the model), a loss object and an `optimizer`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'The skeleton to memorize',
          text: 'Forward → loss → `optimizer.zero_grad()` → `loss.backward()` → `optimizer.step()`. Whenever training misbehaves (loss not decreasing, memory growing, `nan`) check each of these five in order: is the loss computed from the right outputs, are gradients zeroed, does `backward` reach the parameters (non-`None` `.grad`), is the step applied to the right parameters, and is the learning rate sensible?',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the step that resets accumulated gradients before the next backward pass.',
      template: `w.grad.___()`,
      templateIsCode: true,
      blanks: [{ answers: ['zero_'] }],
      wordBank: ['zero_', 'zero', 'clear', 'reset'],
      explanation: '`w.grad.zero_()` sets the gradient tensor to zero in place (the trailing underscore means in place). With an optimizer you call `optimizer.zero_grad()` instead, which does this for all parameters at once.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `import torch

x = torch.tensor(3.0, requires_grad=True)
y = x ** 2 + 2 * x
y.backward()
print(x.grad.item())`,
      answer: '8.0',
      hint: 'The derivative of x² + 2x is 2x + 2. Evaluate it at x = 3.',
      explanation: '`dy/dx = 2x + 2`, which is 2·3 + 2 = 8 at `x = 3`. Autograd computes this exactly by applying the chain rule to the recorded operations.',
    },
    {
      kind: 'error',
      prompt: 'This gradient-descent update crashes with "a leaf Variable that requires grad is being used in an in-place operation". Tap the faulty line.',
      lines: [
        'loss = ((w * x - y) ** 2).mean()',
        'loss.backward()',
        'w -= lr * w.grad',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The update modifies a tracked leaf in place while autograd is recording. Wrap it in `with torch.no_grad():`, so it is not recorded and the in-place change is allowed. Optimizers like `torch.optim.SGD` do this for you internally.',
    },
    {
      kind: 'concept',
      title: 'Non-scalar outputs, autograd.grad and retain_graph',
      blocks: [
        {
          type: 'p',
          text: 'Three more tools complete the picture. First, **`backward()` needs a scalar**. For a vector output `y` you pass the "upstream gradient" to start from (`y.backward(torch.ones_like(y))`), which computes the gradient of `y.sum()`; usually you simply reduce to a scalar first with `.sum()` or `.mean()`. Second, `torch.autograd.grad(outputs, inputs)` *returns* the gradients instead of storing them in `.grad`, which is handy for derivatives you do not want to accumulate. With `create_graph=True` it can be differentiated again, giving **higher-order derivatives**. Third, the graph is freed after one backward pass to save memory, so a second `backward()` through the same graph needs `retain_graph=True`.',
        },
        {
          type: 'code',
          title: 'gradient_apis.py',
          desktopOnly: true,
          code: `import torch

x = torch.tensor([1.0, 2.0, 3.0], requires_grad=True)
y = x ** 2
y.backward(torch.ones_like(y))
print(x.grad)

x.grad = None
(x ** 2).sum().backward()
print(x.grad)

g, = torch.autograd.grad((x ** 3).sum(), x)
print(g)

a = torch.tensor(2.0, requires_grad=True)
first, = torch.autograd.grad(a ** 3, a, create_graph=True)
second, = torch.autograd.grad(first, a)
print(first.item(), second.item())`,
          output: `tensor([2., 4., 6.])
tensor([2., 4., 6.])
tensor([ 3., 12., 27.])
12.0 12.0`,
          annotations: [
            { lines: '3-6', text: '`y` has three elements, so `backward` needs a starting gradient: `ones_like(y)` means "differentiate the sum of the elements". Each `x[i]` only affects `y[i]`, so the gradient is `2x = [2, 4, 6]`.' },
            { lines: '8-10', text: 'The same result by reducing to a scalar with `.sum()` first, the usual approach. (`x.grad = None` clears the old value.)' },
            { lines: '12-13', text: '`torch.autograd.grad` *returns* the gradient `3x² = [3, 12, 27]` of `sum(x³)` without touching `x.grad`.' },
            { lines: '15-18', text: 'Higher-order derivatives: with `create_graph=True` the first derivative `3a² = 12` is itself differentiable, and differentiating again gives the second derivative `6a = 12` at `a = 2`. (Used in meta-learning and some RL algorithms.)' },
          ],
        },
        {
          type: 'code',
          title: 'retain_graph.py',
          desktopOnly: true,
          code: `import torch

x = torch.tensor(2.0, requires_grad=True)
y = x * x
y.backward()
try:
    y.backward()
except RuntimeError as err:
    print("second backward fails:", type(err).__name__)

x = torch.tensor(2.0, requires_grad=True)
y = x * x
y.backward(retain_graph=True)
y.backward()
print(x.grad.item())`,
          output: `second backward fails: RuntimeError
8.0`,
          annotations: [
            { lines: '3-5', text: 'After the first `backward()` PyTorch frees the intermediate values saved in the graph to save memory.' },
            { lines: '6-9', text: 'A second `backward()` through the same graph fails with a `RuntimeError` ("Trying to backward through the graph a second time"). In a training loop this usually means a value from the *previous* iteration is being reused: recompute it, or `detach()` it.' },
            { lines: '11-15', text: '`retain_graph=True` keeps the graph for another pass. Two backward calls each add the gradient 4.0 (`d(x²)/dx = 2x`), so `x.grad` is 8.0: accumulation again.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Do not hold on to the graph by accident',
          text: 'Appending `loss` (a tensor with its graph) to a list for logging keeps *every iteration’s graph* alive, and memory grows until the GPU runs out. Log numbers instead: `losses.append(loss.item())`, or `loss.detach()`. Likewise, carrying a hidden state of a recurrent model from batch to batch without `detach()` makes backward pass through the whole history.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'With `w = 1`, `x = 3` and `y = 5`, the loss is `L = (w·x − y)²`. What gradient `w.grad` does `L.backward()` produce?',
      answer: '-12',
      hint: '`dL/dw = 2·(w·x − y)·x`. Here `w·x − y = 3 − 5 = −2`.',
      explanation: '`dL/dw = 2·(wx − y)·x = 2·(−2)·3 = −12`. The negative sign means increasing `w` would *decrease* the loss, so gradient descent would raise `w` (`w −= lr·(−12)`).',
      label: 'w.grad:',
    },
    {
      kind: 'code',
      prompt: 'Write `clip_grad_norm(grads, max_norm)`, the logic of `torch.nn.utils.clip_grad_norm_`, using NumPy. `grads` is a list of arrays. Compute the total L2 norm over *all* arrays together (the square root of the sum of all squared entries). If it exceeds `max_norm`, multiply every array by `max_norm / (total + 1e-6)`. Return `(clipped_list, total_norm)` where `total_norm` is the norm *before* clipping (a float) and the inputs are not modified.',
      starter: `import numpy as np

def clip_grad_norm(grads, max_norm):
    ...
`,
      solution: `import numpy as np


def clip_grad_norm(grads, max_norm):
    total = float(np.sqrt(sum(float(np.sum(np.asarray(g, dtype=float) ** 2)) for g in grads)))
    if total > max_norm:
        scale = max_norm / (total + 1e-6)
        return [np.asarray(g, dtype=float) * scale for g in grads], total
    return [np.array(g, dtype=float) for g in grads], total
`,
      tests: `import numpy as np

g = [np.array([3.0, 0.0]), np.array([[0.0], [4.0]])]
out, total = clip_grad_norm(g, 1.0)
assert type(total) is float and abs(total - 5.0) < 1e-12
new_norm = np.sqrt(sum(np.sum(a ** 2) for a in out))
assert abs(new_norm - 1.0) < 1e-5
assert out[0].shape == (2,) and out[1].shape == (2, 1)
assert np.allclose(out[0] / out[1].ravel()[1], [0.75, 0.0])

out2, total2 = clip_grad_norm(g, 10.0)
assert abs(total2 - 5.0) < 1e-12
assert np.array_equal(out2[0], g[0]) and np.array_equal(out2[1], g[1])

zero_out, zt = clip_grad_norm([np.zeros(3)], 1.0)
assert zt == 0.0 and np.array_equal(zero_out[0], np.zeros(3))

assert np.array_equal(g[0], [3.0, 0.0]) and np.array_equal(g[1], [[0.0], [4.0]])
out3, t3 = clip_grad_norm([np.array([6.0, 8.0])], 5.0)
assert abs(t3 - 10.0) < 1e-12 and abs(np.linalg.norm(out3[0]) - 5.0) < 1e-4
assert out3[0] is not g[0]`,
      packages: ['numpy'],
      checks: ['The total norm is taken over all arrays together, and returned as the norm before clipping', 'If it exceeds `max_norm`, every array is scaled by `max_norm / (total + 1e-6)`; otherwise values are unchanged', 'Preserves shapes, returns new arrays and does not modify the inputs'],
      hint: 'Sum `np.sum(g ** 2)` over all the arrays and take the square root for the total norm. If `total > max_norm`, multiply every array by `max_norm / (total + 1e-6)`.',
      explanation: 'Gradient clipping is the standard remedy for exploding gradients (the backpropagation lesson), and a staple of RNN and reinforcement-learning training (PPO clips at 0.5 by default). Clipping the *global* norm rescales the whole gradient vector without changing its direction, unlike clipping each entry separately.',
    },
    {
      kind: 'code',
      prompt: 'Write `accumulate_gradients(micro_grads, sizes)` for **gradient accumulation**: you computed the mean gradient of several micro-batches (a list of arrays, all the same shape) with `sizes[i]` examples each. Return the gradient you would have got from one big batch containing all examples: the average of the arrays weighted by their sizes. Raise `ValueError` if the lists are empty or have different lengths.',
      starter: `import numpy as np

def accumulate_gradients(micro_grads, sizes):
    ...
`,
      solution: `import numpy as np


def accumulate_gradients(micro_grads, sizes):
    if not micro_grads or len(micro_grads) != len(sizes):
        raise ValueError("need one size per micro-batch gradient")
    total = float(sum(sizes))
    out = np.zeros_like(np.asarray(micro_grads[0], dtype=float))
    for g, n in zip(micro_grads, sizes):
        out = out + np.asarray(g, dtype=float) * n
    return out / total
`,
      tests: `import numpy as np

rng = np.random.default_rng(0)
X = rng.normal(size=(10, 3))
y = rng.normal(size=10)
w = np.array([0.5, -1.0, 2.0])

def grad(Xb, yb):
    return 2 * Xb.T @ (Xb @ w - yb) / len(yb)

full = grad(X, y)
parts = [(X[:4], y[:4]), (X[4:7], y[4:7]), (X[7:], y[7:])]
acc = accumulate_gradients([grad(a, b) for a, b in parts], [4, 3, 3])
assert acc.shape == (3,) and np.allclose(acc, full)

assert np.allclose(accumulate_gradients([np.array([1.0, 2.0]), np.array([3.0, 4.0])], [1, 1]), [2.0, 3.0])
assert np.allclose(accumulate_gradients([np.array([1.0]), np.array([4.0])], [3, 1]), [1.75])
assert np.allclose(accumulate_gradients([np.array([[1.0, 2.0], [3.0, 4.0]])], [8]), [[1.0, 2.0], [3.0, 4.0]])

g1 = np.array([1.0, 2.0])
accumulate_gradients([g1, g1], [1, 3])
assert np.array_equal(g1, [1.0, 2.0])
for bad in [([], []), ([np.ones(2)], [1, 2])]:
    try:
        accumulate_gradients(*bad)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      packages: ['numpy'],
      checks: ['Returns the size-weighted average of the micro-batch gradients', 'Equals the gradient of one big batch containing all the examples (also for unequal sizes)', 'Raises `ValueError` for empty input or mismatched lengths, and does not modify the inputs'],
      hint: 'Multiply each micro-batch gradient by its number of examples, add them up, and divide by the total number of examples.',
      explanation: 'Gradient accumulation lets you train with a large effective batch when the GPU can only hold a small one: run several micro-batches, let `backward()` accumulate into `.grad` (scaling each loss by its share, `loss / accumulation_steps`), and call `optimizer.step()` only after the last one. Weighting by size is what makes unequal micro-batches (such as a smaller final batch) exact.',
    },
    {
      kind: 'code',
      prompt: 'Write `sgd_momentum_step(params, grads, velocities, lr, momentum)` for lists of NumPy arrays. For each parameter: `v = momentum * v + g`, then `p = p - lr * v`. Return `(new_params, new_velocities)` as lists of new arrays (do not modify the inputs).',
      starter: `import numpy as np

def sgd_momentum_step(params, grads, velocities, lr, momentum):
    ...
`,
      solution: `import numpy as np


def sgd_momentum_step(params, grads, velocities, lr, momentum):
    new_params, new_velocities = [], []
    for p, g, v in zip(params, grads, velocities):
        v_new = momentum * np.asarray(v, dtype=float) + np.asarray(g, dtype=float)
        new_velocities.append(v_new)
        new_params.append(np.asarray(p, dtype=float) - lr * v_new)
    return new_params, new_velocities
`,
      tests: `import numpy as np

p = [np.array([1.0, 2.0]), np.array([[3.0]])]
g = [np.array([0.5, -1.0]), np.array([[2.0]])]
v = [np.zeros(2), np.zeros((1, 1))]
p1, v1 = sgd_momentum_step(p, g, v, 0.1, 0.9)
assert np.allclose(p1[0], [0.95, 2.1]) and np.allclose(p1[1], [[2.8]])
assert np.allclose(v1[0], [0.5, -1.0]) and np.allclose(v1[1], [[2.0]])

p2, v2 = sgd_momentum_step(p1, g, v1, 0.1, 0.9)
assert np.allclose(v2[0], [0.95, -1.9])
assert np.allclose(p2[0], [0.95 - 0.095, 2.1 + 0.19])

p3, v3 = sgd_momentum_step(p, g, v, 0.1, 0.0)
assert np.allclose(p3[0], p[0] - 0.1 * g[0])

assert np.array_equal(p[0], [1.0, 2.0]) and np.array_equal(v[0], [0.0, 0.0])
assert p1[0] is not p[0] and isinstance(p1, list) and len(v1) == 2

q, w = [np.array([5.0])], [np.array([0.0])]
for _ in range(200):
    q, w = sgd_momentum_step(q, [2 * q[0]], w, 0.05, 0.9)
assert abs(q[0][0]) < 1e-3`,
      packages: ['numpy'],
      checks: ['Updates each velocity with `v = momentum * v + g` and each parameter with `p = p - lr * v`', 'With `momentum = 0` it is plain gradient descent', 'Returns new lists of arrays and does not modify its inputs; converges on a simple quadratic'],
      hint: 'For each triple `(p, g, v)`: `v_new = momentum * v + g`, `p_new = p - lr * v_new`. Collect both into new lists and return them together.',
      explanation: 'This is what `torch.optim.SGD(params, lr=..., momentum=0.9)` does at every `optimizer.step()`, using the `.grad` values that autograd filled in. Optimizers are small: the hard part (the gradient) was already done by `backward()`.',
    },
  ],
  takeaways: [
    '**Autograd** records operations on tensors created with `requires_grad=True`; `loss.backward()` backpropagates from a scalar and fills each leaf’s `.grad`. It is your autodiff class, industrial strength, rebuilt dynamically on every forward pass.',
    'Gradients **accumulate** in `.grad`, so zero them every step (`optimizer.zero_grad()`); accumulation is also what makes micro-batch gradient accumulation possible.',
    '`torch.no_grad()` turns recording off (evaluation, inference, manual weight updates); `detach()` cuts a tensor from the graph (logging, `.numpy()`, RL targets). Updating a tracked leaf in place outside `no_grad` is an error.',
    'A manual training step: forward, loss, `zero_grad`, `backward`, update inside `no_grad`. This skeleton is what `nn.Module`, loss objects and `torch.optim` automate in the next lessons.',
    'For non-scalar outputs reduce with `.sum()`/`.mean()` (or pass a gradient to `backward`); `torch.autograd.grad` returns gradients, `create_graph=True` allows higher-order derivatives, and a second backward needs `retain_graph=True`. Log `loss.item()`, not `loss`, to avoid keeping graphs alive.',
  ],
  reading: [
    { title: 'PyTorch: Automatic differentiation with torch.autograd', url: 'https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html', source: 'tutorial', note: 'Official tutorial: tracking, backward, disabling gradients and the computational graph.' },
    { title: 'PyTorch documentation: Autograd mechanics', url: 'https://docs.pytorch.org/docs/stable/notes/autograd.html', source: 'docs', note: 'How the graph is built, in-place correctness, and saved tensors; essential for debugging.' },
    { title: 'PyTorch: A Gentle Introduction to torch.autograd', url: 'https://docs.pytorch.org/tutorials/beginner/blitz/autograd_tutorial.html', source: 'tutorial', note: 'The classic walk-through with a small network and the graph picture.' },
    { title: 'Baydin et al.: Automatic differentiation in machine learning: a survey', url: 'https://arxiv.org/abs/1502.05767', source: 'paper', note: 'The definitive survey of forward and reverse mode autodiff, for the curious.' },
  ],
};
