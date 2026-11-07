import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-training-loop',
  title: 'The Training Loop',
  summary: 'The heart of every PyTorch project: zero_grad, forward, loss, backward, step. Write a complete train-and-evaluate script, use optimizers, learning-rate schedules and gradient clipping, and learn the sanity checks that find bugs fast.',
  minutes: 24,
  objectives: [
    'Write the standard PyTorch training loop and explain the order and purpose of each step',
    'Write an `evaluate` function correctly with `model.eval()` and `torch.no_grad()`',
    'Choose among SGD, momentum, Adam and AdamW and set weight decay',
    'Use learning-rate schedulers and gradient clipping',
    'Debug training with the overfit-one-batch test, and decide when to stop and which checkpoint to keep',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The anatomy of a training step',
      blocks: [
        {
          type: 'p',
          text: 'Every PyTorch training script, from a toy classifier to a billion-parameter language model, is built from the same **training step**. You have already written its pieces by hand; now they have standard names. For each mini-batch: **(1)** run the model forward to get predictions, **(2)** compute the loss, **(3)** clear the old gradients with `optimizer.zero_grad()`, **(4)** backpropagate with `loss.backward()`, and **(5)** update the weights with `optimizer.step()`. An **optimizer** (`torch.optim.SGD`, `Adam`…) is simply an object that holds references to the model’s parameters and knows how to update them from their `.grad` values.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Forward', text: '`outputs = model(inputs)`: the batch goes through the network, building the autograd graph.' },
            { title: 'Loss', text: '`loss = loss_fn(outputs, targets)`: a single scalar measuring the error on this batch.' },
            { title: 'Zero the gradients', text: '`optimizer.zero_grad()`: reset the `.grad` of every parameter (otherwise they accumulate).' },
            { title: 'Backward', text: '`loss.backward()`: backpropagation fills each parameter’s `.grad`.' },
            { title: 'Step', text: '`optimizer.step()`: move every parameter against its gradient (with momentum, Adam’s statistics, weight decay…).' },
          ],
        },
        {
          type: 'p',
          text: 'The order of zero-grad relative to the forward pass does not matter, but it must come **before `backward()`** and the `step()` must come **after** it. Around this core sit the loops: an outer loop over **epochs** (passes through the data) and an inner loop over **mini-batches**, plus a periodic **evaluation** on held-out data. Here is the whole program, applying everything to the two-moons problem from the NumPy lesson. It is the same network (2 → 16 → 16 → 2) and the same data, with PyTorch doing the heavy lifting; compare it to the ~60 lines you wrote before:',
        },
        {
          type: 'code',
          title: 'train_moons.py',
          desktopOnly: true,
          outputVaries: true,
          code: `import numpy as np
import torch
from torch import nn

def make_moons(n, noise, seed):
    rng = np.random.default_rng(seed)
    t = rng.uniform(0, np.pi, n)
    a = np.column_stack([np.cos(t), np.sin(t)])
    b = np.column_stack([1 - np.cos(t), 0.5 - np.sin(t)])
    X = np.vstack([a, b]) + noise * rng.normal(size=(2 * n, 2))
    return torch.tensor(X, dtype=torch.float32), torch.tensor([0] * n + [1] * n)

torch.manual_seed(0)
X, y = make_moons(300, 0.2, seed=0)
perm = torch.randperm(len(X))
X, y = X[perm], y[perm]
X_tr, y_tr, X_te, y_te = X[:400], y[:400], X[400:], y[400:]

model = nn.Sequential(nn.Linear(2, 16), nn.ReLU(), nn.Linear(16, 16), nn.ReLU(), nn.Linear(16, 2))
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

def evaluate(X, y):
    model.eval()
    with torch.no_grad():
        logits = model(X)
        return loss_fn(logits, y).item(), (logits.argmax(dim=1) == y).float().mean().item()

for epoch in range(1, 101):
    model.train()
    order = torch.randperm(len(X_tr))
    for start in range(0, len(order), 32):
        idx = order[start:start + 32]
        loss = loss_fn(model(X_tr[idx]), y_tr[idx])
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    if epoch in (1, 10, 50, 100):
        tr_loss, _ = evaluate(X_tr, y_tr)
        te_loss, te_acc = evaluate(X_te, y_te)
        print(f"epoch {epoch:3d}  train loss {tr_loss:.3f}  test loss {te_loss:.3f}  test acc {te_acc:.3f}")`,
          output: `epoch   1  train loss 0.367  test loss 0.403  test acc 0.820
epoch  10  train loss 0.135  test loss 0.177  test acc 0.910
epoch  50  train loss 0.051  test loss 0.111  test acc 0.965
epoch 100  train loss 0.046  test loss 0.126  test acc 0.965`,
          annotations: [
            { lines: '5-11', text: 'The two-moons generator (NumPy), returning float32 features and `int64` class labels, the dtypes the model and `CrossEntropyLoss` expect.' },
            { lines: '13-17', text: 'Seed the random numbers for repeatability, shuffle, and split into 400 training and 200 test examples (the same split as in the NumPy lesson).' },
            { lines: '19-21', text: 'The three objects of a PyTorch project: the **model**, the **loss function**, and the **optimizer**, which is given `model.parameters()` and a learning rate. Adam adapts the step size per parameter, so a rate of 0.01 works well here.' },
            { lines: '23-27', text: '`evaluate` returns the loss and accuracy on a dataset. `model.eval()` switches off dropout and batch-norm training behaviour, and `torch.no_grad()` stops graph recording. Both are needed for evaluation.' },
            { lines: '29-31', text: 'Each epoch: put the model back in **train mode** and draw a fresh random order of the training examples.' },
            { lines: '32-34', text: 'Walk through the data in batches of 32 and compute the **forward pass and loss** for each batch.' },
            { lines: '35-37', text: 'The **three-call heart**: `zero_grad()`, `backward()`, `step()`. Compare with the manual update lines of the NumPy lesson: `step()` replaces `W - lr * gW` for every parameter, and `backward()` replaces your whole backward function.' },
            { lines: '38-41', text: 'At a few checkpoints, evaluate on both sets and print the numbers. The model reaches about 96.5% on unseen points, matching the from-scratch network. Notice the **test loss** bottoms out around epoch 50 and creeps up while the training loss keeps falling: the first sign of overfitting. The exact numbers vary with the PyTorch version and hardware.' },
          ],
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which sequence of calls is the correct core of a PyTorch training step?',
      options: [
        { text: '`optimizer.zero_grad()`, `loss.backward()`, `optimizer.step()`', correct: true, why: 'Clear stale gradients, compute fresh ones by backpropagation, then let the optimizer update the weights from them.' },
        { text: '`loss.backward()`, `optimizer.step()`, then never clear gradients', why: 'Without `zero_grad()` the gradients accumulate across batches, so every step uses an ever-larger sum of old gradients.' },
        { text: '`optimizer.step()`, `loss.backward()`, `optimizer.zero_grad()`', why: 'The step would use gradients that have not been computed yet (or are stale from the previous batch), and then the fresh gradients would be thrown away.' },
        { text: '`optimizer.zero_grad()`, `optimizer.step()`, `loss.backward()`', why: 'Stepping right after zeroing applies a zero gradient (no change at all), and then the backward result is never used.' },
      ],
      explanation: 'Zero the gradients, backpropagate, then step: `zero_grad()` must precede `backward()` and `step()` must follow it.',
    },
    {
      kind: 'concept',
      title: 'Sanity checks that find bugs in minutes',
      blocks: [
        {
          type: 'p',
          text: 'Neural-network bugs rarely crash; they just make the model quietly worse. A handful of habits catch most of them early. The single best one is the **overfit-one-batch test**: take just 8 examples and train on them repeatedly. A correct model, loss and optimizer must push the loss to nearly zero (memorizing 8 examples is easy). If it cannot, something is broken: the wrong loss/target types, a missing `zero_grad`, a frozen parameter, a learning rate far too small or large, or a bug in the data pipeline. And you find out in seconds instead of after hours of full training.',
        },
        {
          type: 'code',
          title: 'overfit_one_batch.py',
          desktopOnly: true,
          outputVaries: true,
          code: `import torch
from torch import nn

torch.manual_seed(0)
x = torch.randn(8, 4)
y = torch.randint(0, 3, (8,))
model = nn.Sequential(nn.Linear(4, 32), nn.ReLU(), nn.Linear(32, 3))
opt = torch.optim.Adam(model.parameters(), lr=0.01)
loss_fn = nn.CrossEntropyLoss()
for step in range(1, 201):
    loss = loss_fn(model(x), y)
    opt.zero_grad()
    loss.backward()
    opt.step()
    if step in (1, 50, 200):
        print(step, round(loss.item(), 4))`,
          output: `1 1.0627
50 0.0584
200 0.0021`,
          annotations: [
            { lines: '4-6', text: 'A *tiny* random problem: 8 examples, 4 features, 3 classes, with random labels. There is no pattern to learn, so the only way to get the loss down is to memorize.' },
            { lines: '7-9', text: 'The usual model, optimizer and loss.' },
            { lines: '10-14', text: 'The same five-step training step, repeated on the one batch.' },
            { lines: '15-16', text: 'The loss starts near `ln 3 ≈ 1.1` (random guessing among three classes) and falls to about 0.002: the network has memorized the batch. **This is the result you want to see.** If yours stays at 1.1, debug before training for real. (Exact values vary by version and machine.)' },
          ],
        },
        {
          type: 'table',
          headers: ['Symptom', 'Likely cause', 'Check'],
          rows: [
            ['Loss stuck at `ln(classes)` (about 1.10 for 3 classes, 0.69 for 2)', 'The model outputs a constant: dead ReLUs, learning rate too small, labels not matched to inputs', 'Overfit one batch; print the logits'],
            ['Loss is `nan` or `inf`', 'Learning rate too high; bad data (`nan`, huge values); `log(0)`', 'Lower the rate; clip gradients; check inputs with `torch.isfinite`'],
            ['Training loss falls, test loss rises', 'Overfitting', 'More data/augmentation, regularization, early stopping'],
            ['Both stay high', 'Underfitting', 'Bigger model, better features, higher learning rate, train longer'],
            ['Test accuracy lower than expected, noisy between runs', 'Forgot `model.eval()`, or different preprocessing at test time', 'Print `model.training`; reuse the training transform'],
            ['Memory grows each step', 'Keeping `loss` (with its graph) in a list', 'Log `loss.item()`'],
            ['Results change on every run', 'Unseeded randomness', '`torch.manual_seed(0)` (and the NumPy / Python seeds)'],
          ],
          caption: 'A debugging cheat sheet for training problems. Most will seem familiar from earlier lessons: you have caused them all by hand.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Log, plot, and keep the best checkpoint',
          text: 'Record the training and validation loss every epoch and plot them (matplotlib, or TensorBoard / Weights & Biases for bigger projects). Keep the weights from the epoch with the **best validation loss**, not the last one: `best = copy.deepcopy(model.state_dict())` whenever the validation loss improves, then restore it at the end (and save it to disk, which a later lesson covers). That one habit is early stopping plus checkpointing, and it is the cheapest regularizer there is.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Reproducibility is a debugging tool',
          text: 'If a run cannot be repeated you cannot tell whether a change helped or you just got lucky. Seed everything (`torch.manual_seed`, `numpy.random.seed`, `random.seed`) while developing. Exact bit-for-bit reproducibility across machines and library versions is not guaranteed (GPU kernels, library updates), but the *same* machine and versions will give the same run, and that is enough to compare ideas fairly.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If the validation loss starts rising while the training loss keeps falling, the model is overfitting, and the weights saved from the epoch with the lowest validation loss are usually the ones to keep.',
      answer: true,
      explanation: 'True. The divergence between training and validation loss is the signature of overfitting. Checkpointing the best-validation-loss weights (early stopping) gives the model that generalizes best, which is not necessarily the one from the final epoch.',
    },
    {
      kind: 'concept',
      title: 'Optimizers and weight decay',
      blocks: [
        {
          type: 'p',
          text: '`torch.optim` provides every optimizer from the gradient-descent lesson. They all share one interface (`step()`, `zero_grad()`), so swapping them is a one-line change. **Weight decay** is L2 regularization built into the optimizer (the regularization lesson); with Adam use **`AdamW`**, which applies it correctly. Each optimizer also takes per-parameter-group settings, for instance a smaller learning rate for a pretrained body and a larger one for a fresh head.',
        },
        {
          type: 'table',
          headers: ['Optimizer', 'Create it with', 'Good starting point'],
          rows: [
            ['SGD', '`optim.SGD(params, lr=0.1)`', 'lr 0.01 to 0.1; add `momentum=0.9`'],
            ['SGD with momentum', '`optim.SGD(params, lr=0.05, momentum=0.9)`', 'Classic for vision, with a schedule'],
            ['Adam', '`optim.Adam(params, lr=1e-3)`', 'lr 1e-3 to 3e-4; the usual first choice'],
            ['AdamW', '`optim.AdamW(params, lr=1e-3, weight_decay=0.01)`', 'Adam with proper weight decay; standard for transformers'],
            ['RMSprop', '`optim.RMSprop(params, lr=1e-3)`', 'Older RL and recurrent-network favourite'],
          ],
          caption: 'Start with AdamW or Adam at 1e-3 / 3e-4, and tune the learning rate first: it matters more than the choice of optimizer.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the line that applies the computed gradients to the model’s weights.',
      template: `loss.backward()
optimizer.___()`,
      templateIsCode: true,
      blanks: [{ answers: ['step'] }],
      wordBank: ['step', 'update', 'zero_grad', 'apply'],
      explanation: '`optimizer.step()` updates every parameter using its `.grad` (plus momentum, Adam statistics, weight decay and so on). `zero_grad()` only clears the gradients, and there are no `update` or `apply` methods.',
    },
    {
      kind: 'concept',
      title: 'Schedules and gradient clipping',
      blocks: [
        {
          type: 'p',
          text: 'A fixed learning rate is rarely best: large steps make fast early progress, while small steps at the end settle into a good minimum. A **learning-rate scheduler** changes the rate on a schedule, and you call `scheduler.step()` once per epoch (after `optimizer.step()`). `StepLR` multiplies the rate by `gamma` every `step_size` epochs; `CosineAnnealingLR` decays it smoothly along a half cosine, the popular default.',
        },
        {
          type: 'code',
          title: 'lr_schedules.py',
          desktopOnly: true,
          code: `import torch

p = torch.nn.Parameter(torch.zeros(1))
opt = torch.optim.SGD([p], lr=0.1)
step_lr = torch.optim.lr_scheduler.StepLR(opt, step_size=2, gamma=0.5)
for epoch in range(6):
    print(epoch, opt.param_groups[0]["lr"])
    opt.step()
    step_lr.step()

opt2 = torch.optim.SGD([p], lr=0.1)
cosine = torch.optim.lr_scheduler.CosineAnnealingLR(opt2, T_max=4)
lrs = [opt2.param_groups[0]["lr"]]
for _ in range(4):
    opt2.step()
    cosine.step()
    lrs.append(round(opt2.param_groups[0]["lr"], 4))
print(lrs)`,
          output: `0 0.1
1 0.1
2 0.05
3 0.05
4 0.025
5 0.025
[0.1, 0.0854, 0.05, 0.0146, 0.0]`,
          annotations: [
            { lines: '3-5', text: 'A dummy parameter and an SGD optimizer starting at learning rate 0.1, with a `StepLR` scheduler that halves the rate every 2 epochs.' },
            { lines: '6-9', text: 'The optimizer’s current rate lives in `opt.param_groups[0]["lr"]`. After each epoch we call `opt.step()` (normally inside the batch loop) then `step_lr.step()` once per epoch: the printed rates drop 0.1, 0.1, 0.05, 0.05, 0.025, 0.025.' },
            { lines: '11-12', text: 'A cosine schedule over `T_max = 4` epochs starts at the base rate and decays to 0 along half a cosine wave.' },
            { lines: '13-18', text: 'The rates fall slowly at first, fastest in the middle, and slowly again at the end: `0.1 → 0.0854 → 0.05 → 0.0146 → 0.0`. Many modern recipes add a short linear **warm-up** at the beginning so the first, risky steps are small.' },
          ],
        },
        {
          type: 'p',
          text: 'The last control is **[[gradient-clipping|gradient clipping]]**: if the global gradient norm exceeds a threshold, rescale it. Call `torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm)` *after* `backward()` and *before* `step()`. It returns the norm before clipping, which is also a useful number to log (a sudden spike warns of instability).',
        },
        {
          type: 'code',
          title: 'clip_gradients.py',
          desktopOnly: true,
          code: `import torch

w = torch.nn.Parameter(torch.zeros(2))
w.grad = torch.tensor([3.0, 4.0])
total = torch.nn.utils.clip_grad_norm_([w], max_norm=1.0)
print(round(total.item(), 2), [round(v, 2) for v in w.grad.tolist()])`,
          output: `5.0 [0.6, 0.8]`,
          annotations: [
            { lines: '3-4', text: 'A parameter whose gradient we set by hand to `[3, 4]`, which has length 5.' },
            { lines: 5, text: '`clip_grad_norm_` computes the total norm (5.0), sees that it exceeds `max_norm = 1.0`, and rescales the gradient *in place* by `1/5`.' },
            { lines: 6, text: 'It returned the *original* norm (5.0), and the gradient is now `[0.6, 0.8]`: the same direction, with length 1. Same idea as the NumPy function you wrote in the autograd lesson.' },
          ],
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program (a learning-rate schedule that multiplies the rate by 0.1 every epoch).',
      code: `import torch

p = torch.nn.Parameter(torch.zeros(1))
opt = torch.optim.SGD([p], lr=1.0)
sch = torch.optim.lr_scheduler.StepLR(opt, step_size=1, gamma=0.1)
lrs = []
for _ in range(3):
    lrs.append(round(opt.param_groups[0]["lr"], 4))
    opt.step()
    sch.step()
print(lrs)`,
      answer: '[1.0, 0.1, 0.01]',
      hint: 'The rate is recorded before each scheduler step, and each `sch.step()` multiplies it by 0.1.',
      explanation: 'Epoch 0 uses 1.0; after one scheduler step the rate is 0.1; after the next it is 0.01. The list records the rate used in each of the three epochs.',
    },
    {
      kind: 'error',
      prompt: 'This training step never improves the model, because the update uses gradients that have not been computed yet. Tap the faulty line.',
      lines: [
        'loss = loss_fn(model(x), y)',
        'optimizer.zero_grad()',
        'optimizer.step()',
        'loss.backward()',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`optimizer.step()` must come **after** `loss.backward()`. Here it runs first and uses empty (or stale) gradients, and the fresh gradients computed afterwards are cleared by the next `zero_grad()` and never applied. The order is: `zero_grad()`, `backward()`, `step()`.',
    },
    {
      kind: 'numeric',
      prompt: 'You train on 400 examples with batches of 32 for 100 epochs (the last batch of each epoch is smaller). How many times is `optimizer.step()` called in total?',
      answer: '1300',
      hint: 'Updates per epoch = `ceil(400 / 32)`. Multiply by the number of epochs.',
      explanation: '400 / 32 = 12.5, rounded up to 13 batches per epoch (12 full ones and one of 16 examples). Over 100 epochs that is 13 × 100 = 1300 optimizer steps.',
      label: 'Steps:',
    },
    {
      kind: 'concept',
      title: 'Scaling up: accumulation, devices and mixed precision',
      blocks: [
        {
          type: 'p',
          text: 'Three more tools appear in nearly every real project, and all of them are small changes to the loop you now know. **Gradient accumulation** simulates a big batch on a small GPU: call `backward()` on several mini-batches (their gradients add up, which is the "feature" that bites you without `zero_grad`) and only then `step()` and `zero_grad()`. Divide each loss by the number of accumulation steps so the sum is an average. **Devices**: move the model once with `model.to(device)` and every batch with `x.to(device)`; the loss, optimizer and loop stay unchanged. **Mixed precision** (`torch.autocast`, plus a `GradScaler` for float16) runs most arithmetic in 16-bit numbers for a large speed-up on modern GPUs.',
        },
        {
          type: 'code',
          title: 'loop_variants.py',
          lang: 'python',
          desktopOnly: true,
          code: `device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)
accum = 4  # effective batch = 4 x the loader batch size

optimizer.zero_grad()
for i, (x, y) in enumerate(loader):
    x, y = x.to(device), y.to(device)
    with torch.autocast(device_type=device, dtype=torch.bfloat16):
        loss = loss_fn(model(x), y) / accum
    loss.backward()
    if (i + 1) % accum == 0:
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        optimizer.zero_grad()`,
          annotations: [
            { lines: '1-2', text: 'Pick the GPU if there is one, and move the **model** there once (parameters live on a device).' },
            { lines: 3, text: 'Accumulate gradients over 4 mini-batches before each update.' },
            { lines: '6-7', text: 'Move every **batch** to the same device as the model; mixing devices is a runtime error.' },
            { lines: '8-9', text: 'Run the forward pass in bfloat16 where it is safe, and divide the loss by `accum` so the summed gradients form an average.' },
            { lines: '10-14', text: '`backward()` runs on every batch, but the clip, `step()` and `zero_grad()` run only every 4th. This sketch assumes `torch`, `model`, `loader`, `loss_fn` and `optimizer` already exist.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Now write it yourself',
          text: 'The last three questions rebuild the training toolkit from first principles in plain Python and NumPy: a learning-rate schedule, an early stopper and a mini-batch trainer. If you can write them, the PyTorch versions are just names you look up.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `warmup_cosine_lr(epoch, base_lr, warmup, total)`, the schedule used by many transformer and RL recipes. For `epoch < warmup` the rate rises linearly: `base_lr * (epoch + 1) / warmup`. From then on it follows a half-cosine down to zero: with `progress = (epoch - warmup) / (total - warmup)`, return `base_lr * 0.5 * (1 + cos(pi * progress))`. Use `math`; if `total <= warmup` raise `ValueError`.',
      starter: `import math

def warmup_cosine_lr(epoch, base_lr, warmup, total):
    ...
`,
      solution: `import math


def warmup_cosine_lr(epoch, base_lr, warmup, total):
    if total <= warmup:
        raise ValueError("total must exceed warmup")
    if epoch < warmup:
        return base_lr * (epoch + 1) / warmup
    progress = (epoch - warmup) / (total - warmup)
    return base_lr * 0.5 * (1 + math.cos(math.pi * progress))
`,
      tests: `import math

assert abs(warmup_cosine_lr(0, 0.1, 4, 14) - 0.025) < 1e-12
assert abs(warmup_cosine_lr(1, 0.1, 4, 14) - 0.05) < 1e-12
assert abs(warmup_cosine_lr(3, 0.1, 4, 14) - 0.1) < 1e-12
assert abs(warmup_cosine_lr(4, 0.1, 4, 14) - 0.1) < 1e-12
assert abs(warmup_cosine_lr(9, 0.1, 4, 14) - 0.05) < 1e-12
assert abs(warmup_cosine_lr(14, 0.1, 4, 14)) < 1e-12
assert abs(warmup_cosine_lr(0, 1.0, 0 + 1, 11) - 1.0) < 1e-12
assert abs(warmup_cosine_lr(6, 1.0, 1, 11) - 0.5) < 1e-12
lrs = [warmup_cosine_lr(e, 0.3, 5, 50) for e in range(5, 50)]
assert all(a >= b for a, b in zip(lrs, lrs[1:]))
assert isinstance(warmup_cosine_lr(2, 0.1, 4, 14), float)
for bad in [(0, 0.1, 5, 5), (0, 0.1, 6, 5)]:
    try:
        warmup_cosine_lr(*bad)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      checks: ['Warm-up: `base_lr * (epoch + 1) / warmup` for the first `warmup` epochs', 'Afterwards `base_lr * 0.5 * (1 + cos(pi * progress))`, falling from `base_lr` at the end of warm-up to 0 at `total`', 'Raises `ValueError` if `total <= warmup`; the cosine part never increases'],
      hint: 'Handle the warm-up branch first (`epoch < warmup`). Otherwise compute `progress = (epoch - warmup) / (total - warmup)` and apply the cosine formula with `math.cos` and `math.pi`.',
      explanation: 'Warm-up avoids huge, destabilizing early updates (especially with Adam, whose statistics start empty), and the cosine decay settles training gently. In PyTorch you would implement it with `LambdaLR` or `SequentialLR`, but the formula is exactly this.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `EarlyStopper(patience, min_delta=0.0)` with a method `step(val_loss)` that returns `True` when training should stop. An epoch counts as an improvement only if `val_loss < best - min_delta` (then reset the wait counter and remember the best loss and its epoch index, starting from 0). Otherwise increase the counter; return `True` once the counter reaches `patience`. The attributes `best` (initially `float("inf")`), `best_epoch` and `epochs` (number of calls so far) must be readable.',
      starter: `class EarlyStopper:
    ...
`,
      solution: `class EarlyStopper:
    def __init__(self, patience, min_delta=0.0):
        self.patience = patience
        self.min_delta = min_delta
        self.best = float("inf")
        self.best_epoch = 0
        self.epochs = 0
        self.wait = 0

    def step(self, val_loss):
        if val_loss < self.best - self.min_delta:
            self.best = val_loss
            self.best_epoch = self.epochs
            self.wait = 0
        else:
            self.wait += 1
        self.epochs += 1
        return self.wait >= self.patience
`,
      tests: `stopper = EarlyStopper(patience=3)
assert stopper.best == float("inf") and stopper.epochs == 0
losses = [1.00, 0.80, 0.62, 0.55, 0.57, 0.54, 0.56, 0.58, 0.60, 0.59, 0.55]
stopped_at = None
for epoch, loss in enumerate(losses):
    if stopper.step(loss):
        stopped_at = epoch
        break
assert stopped_at == 8
assert stopper.best == 0.54 and stopper.best_epoch == 5 and stopper.epochs == 9

s = EarlyStopper(patience=2)
assert s.step(1.0) is False and s.step(1.0) is False and s.step(1.0) is True

s = EarlyStopper(patience=2, min_delta=0.1)
assert s.step(1.0) is False
assert s.step(0.95) is False
assert s.step(0.93) is True
assert s.best == 1.0 and s.best_epoch == 0

s = EarlyStopper(patience=1)
assert s.step(5.0) is False
assert s.step(4.0) is False
assert s.step(4.5) is True and s.best == 4.0 and s.best_epoch == 1

t = EarlyStopper(patience=3)
for v in [3, 2, 1]:
    assert t.step(v) is False
assert t.best_epoch == 2 and t.epochs == 3`,
      checks: ['Counts an epoch as an improvement only if `val_loss < best - min_delta`, resetting the wait counter and recording `best` and `best_epoch`', '`step` returns `True` as soon as `patience` epochs in a row failed to improve', 'The attributes `best`, `best_epoch` and `epochs` track the state correctly'],
      hint: 'Keep `best`, `best_epoch`, `epochs` and `wait` as attributes. In `step`, check the improvement condition first, update or increment `wait`, increase `epochs`, and return `self.wait >= self.patience`.',
      explanation: 'This is the callback that PyTorch Lightning and Keras call `EarlyStopping`. You call `step(val_loss)` once per epoch and break out of the training loop when it returns `True`, restoring the checkpoint saved at `best_epoch`. The `min_delta` stops tiny, noisy improvements from resetting the counter.',
    },
    {
      kind: 'code',
      prompt: 'Write `train_logistic(X, y, lr, epochs, batch_size, seed)`: train logistic regression with **mini-batch gradient descent** in NumPy, following the five-step structure. `X` is `(n, d)`, `y` holds 0/1 labels. Start with `w = zeros(d)` and `b = 0.0`; each epoch shuffle the indices with `np.random.default_rng(seed)` (create it once, before the loop) and for each batch compute `p = sigmoid(X_b @ w + b)`, the gradients `dw = X_b.T @ (p - y_b) / len(batch)` and `db = mean(p - y_b)`, then update `w -= lr * dw` and `b -= lr * db`. Return `(w, b)`.',
      starter: `import numpy as np

def train_logistic(X, y, lr, epochs, batch_size, seed):
    ...
`,
      solution: `import numpy as np


def train_logistic(X, y, lr, epochs, batch_size, seed):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    rng = np.random.default_rng(seed)
    n, d = X.shape
    w = np.zeros(d)
    b = 0.0
    for _ in range(epochs):
        order = rng.permutation(n)
        for start in range(0, n, batch_size):
            idx = order[start:start + batch_size]
            xb, yb = X[idx], y[idx]
            p = 1.0 / (1.0 + np.exp(-(xb @ w + b)))
            err = p - yb
            dw = xb.T @ err / len(idx)
            db = float(np.mean(err))
            w = w - lr * dw
            b = b - lr * db
    return w, b
`,
      tests: `import numpy as np

rng = np.random.default_rng(0)
X0 = rng.normal(loc=[-2.0, -2.0], scale=0.7, size=(60, 2))
X1 = rng.normal(loc=[2.0, 2.0], scale=0.7, size=(60, 2))
X = np.vstack([X0, X1])
y = np.array([0] * 60 + [1] * 60)

w, b = train_logistic(X, y, lr=0.5, epochs=100, batch_size=16, seed=1)
assert w.shape == (2,) and isinstance(b, float)
pred = (X @ w + b > 0).astype(int)
assert (pred == y).mean() > 0.97
assert w[0] > 0 and w[1] > 0

w2, b2 = train_logistic(X, y, lr=0.5, epochs=100, batch_size=16, seed=1)
assert np.array_equal(w, w2) and b == b2

w0, b0 = train_logistic(X, y, lr=0.5, epochs=0, batch_size=16, seed=1)
assert np.array_equal(w0, np.zeros(2)) and b0 == 0.0

def loss(w, b):
    p = 1 / (1 + np.exp(-(X @ w + b)))
    return -np.mean(y * np.log(p + 1e-12) + (1 - y) * np.log(1 - p + 1e-12))
wa, ba = train_logistic(X, y, lr=0.1, epochs=3, batch_size=32, seed=0)
wb, bb = train_logistic(X, y, lr=0.1, epochs=30, batch_size=32, seed=0)
assert loss(wb, bb) < loss(wa, ba) < loss(np.zeros(2), 0.0)

Xc, yc = X.copy(), y.copy()
train_logistic(X, y, 0.1, 2, 10, 0)
assert np.array_equal(X, Xc) and np.array_equal(y, yc)`,
      packages: ['numpy'],
      checks: ['Follows the loop: shuffle each epoch, then for every batch forward (sigmoid), gradient and update', 'Learns a separating weight vector on separable data (over 97% accuracy), and is deterministic for a given seed', 'With `epochs = 0` returns zeros; more epochs lower the loss; does not modify its inputs'],
      hint: 'Create `rng = np.random.default_rng(seed)` once. Per epoch: `order = rng.permutation(n)`, then slice `order[start:start + batch_size]`. For each batch: `p = 1 / (1 + np.exp(-(xb @ w + b)))`, `err = p - yb`, `dw = xb.T @ err / len(idx)`, `db = err.mean()`.',
      explanation: 'The structure (epochs → shuffled mini-batches → forward, loss gradient, update) is the same one a PyTorch loop has. Here the "model" is one sigmoid neuron and the gradient `X.T @ (p − y) / n` is the logistic-regression special case of softmax cross-entropy’s `p − y`. In PyTorch, `loss.backward()` and `optimizer.step()` do the last four lines for any model.',
    },
  ],
  takeaways: [
    'The **training step** is: forward → loss → `optimizer.zero_grad()` → `loss.backward()` → `optimizer.step()`. Wrap it in a loop over shuffled mini-batches and an outer loop over epochs, calling `model.train()` for training and `model.eval()` plus `torch.no_grad()` for evaluation.',
    'An **optimizer** (`SGD`, `Adam`, `AdamW`…) holds the parameters and updates them from `.grad`. Start with Adam/AdamW at 1e-3 or 3e-4 and tune the learning rate first; use `weight_decay` for regularization.',
    '**Schedulers** change the learning rate over time (`StepLR`, `CosineAnnealingLR`, warm-up then cosine); call `scheduler.step()` once per epoch. **`clip_grad_norm_`** between `backward()` and `step()` tames exploding gradients.',
    'Debug with the **overfit-one-batch** test, plots of training and validation loss, and the symptom table (loss stuck at `ln(classes)`, `nan`, rising validation loss, forgotten `eval()`). Seed your runs so experiments are comparable.',
    '**Early stopping and checkpointing**: keep the weights from the best validation epoch, not the last. This costs nothing and is the best cheap regularizer.',
  ],
  reading: [
    { title: 'PyTorch: Optimizing Model Parameters', url: 'https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html', source: 'tutorial', note: 'Official tutorial: the training and test loops, loss and optimizer, in full.' },
    { title: 'PyTorch documentation: torch.optim (optimizers and schedulers)', url: 'https://docs.pytorch.org/docs/stable/optim.html', source: 'docs', note: 'Every optimizer and learning-rate scheduler with its parameters.' },
    { title: 'Andrej Karpathy: A Recipe for Training Neural Networks', url: 'https://karpathy.github.io/2019/04/25/recipe/', source: 'article', note: 'The classic practical checklist: overfit one batch, baselines, regularize, tune. Required reading.' },
    { title: 'PyTorch: Reproducibility notes', url: 'https://docs.pytorch.org/docs/stable/notes/randomness.html', source: 'docs', note: 'What can and cannot be made deterministic, and how to seed everything.' },
  ],
};
