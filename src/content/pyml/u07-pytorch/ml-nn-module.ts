import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-nn-module',
  title: 'Building Models with nn.Module',
  summary: 'How PyTorch models are built: layers such as nn.Linear, containers such as nn.Sequential, custom nn.Module classes with forward(), parameter bookkeeping, train versus eval mode, and the loss functions with the inputs each one expects.',
  minutes: 23,
  objectives: [
    'Build models from `nn.Linear`, activations and `nn.Sequential`, and read a model’s parameters',
    'Write a custom `nn.Module` with `__init__` and `forward`, and explain why you call `model(x)`',
    'Use `named_parameters`, `state_dict`, `ModuleList` and `requires_grad_` to inspect and freeze parts of a model',
    'Explain `train()` versus `eval()` mode and what dropout and batch normalization do in each',
    'Choose the right loss (`MSELoss`, `CrossEntropyLoss`, `BCEWithLogitsLoss`) and feed it logits and correctly typed targets',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Layers and nn.Sequential',
      blocks: [
        {
          type: 'p',
          text: 'In the NumPy network you passed a list of `(W, b)` pairs around by hand. PyTorch packages that bookkeeping into **modules**. A **[[nn-module|`nn.Module`]]** is any object that owns parameters, nested modules, and a forward computation. `nn.Linear(n_in, n_out)` is the fully connected layer you wrote as `X @ W + b`: it creates `W` and `b` as tracked parameters (with sensible random initialization) and applies them when you call it. Note that PyTorch stores the weight as `(n_out, n_in)` and transposes internally. `nn.Sequential` chains modules, feeding each one’s output to the next, which is all a plain MLP needs. Here is the 2 → 16 → 16 → 2 moons network from the NumPy lesson, in five lines:',
        },
        {
          type: 'code',
          title: 'sequential_model.py',
          desktopOnly: true,
          code: `import torch
from torch import nn

layer = nn.Linear(3, 2)
print(layer.weight.shape, layer.bias.shape)
x = torch.ones(5, 3)
print(layer(x).shape)

model = nn.Sequential(nn.Linear(2, 16), nn.ReLU(), nn.Linear(16, 16), nn.ReLU(), nn.Linear(16, 2))
print(model)
print(sum(p.numel() for p in model.parameters()))`,
          output: `torch.Size([2, 3]) torch.Size([2])
torch.Size([5, 2])
Sequential(
  (0): Linear(in_features=2, out_features=16, bias=True)
  (1): ReLU()
  (2): Linear(in_features=16, out_features=16, bias=True)
  (3): ReLU()
  (4): Linear(in_features=16, out_features=2, bias=True)
)
354`,
          annotations: [
            { lines: 4, text: '`nn.Linear(3, 2)` maps 3 features to 2 outputs. It already owns its parameters.' },
            { lines: 5, text: 'The weight has shape `(2, 3)`, i.e. `(out, in)`, and the bias `(2,)`. (In your NumPy code `W` was `(in, out)`; PyTorch computes `x @ weight.T + bias`.)' },
            { lines: '6-7', text: 'A layer is a function: calling `layer(x)` on a batch of 5 examples with 3 features returns a `(5, 2)` tensor.' },
            { lines: 9, text: '`nn.Sequential` takes layers in order. The activation functions are modules too (`nn.ReLU()`), so the whole network is a list of modules, and there is no activation after the last layer (it outputs raw **logits**).' },
            { lines: 10, text: 'Printing a model shows its structure, a great first check that you built what you meant.' },
            { lines: 11, text: 'Summing `numel()` over `model.parameters()` counts the weights and biases: **354**, exactly the number you computed by hand for this network in the NumPy lesson.' },
          ],
        },
        {
          type: 'table',
          headers: ['Module', 'What it does', 'Typical use'],
          rows: [
            ['`nn.Linear(i, o)`', 'Fully connected layer, `x @ Wᵀ + b`', 'MLPs, classifier and regression heads'],
            ['`nn.ReLU()`, `nn.GELU()`, `nn.Tanh()`, `nn.Sigmoid()`', 'Elementwise activations', 'Between layers'],
            ['`nn.Conv2d(c_in, c_out, k)`', 'Convolution over images', 'Vision (next unit)'],
            ['`nn.Embedding(n, d)`', 'Lookup table: integer ID → vector', 'Words, tokens, categorical features, game unit types'],
            ['`nn.LSTM`, `nn.GRU`, `nn.TransformerEncoderLayer`', 'Sequence models', 'Text, time series, memory in agents'],
            ['`nn.Dropout(p)`, `nn.BatchNorm1d(n)`, `nn.LayerNorm(n)`', 'Regularization and normalization', 'Deep networks (next unit)'],
            ['`nn.Flatten()`', 'Merge dimensions (all but batch)', 'Between conv layers and linear layers'],
          ],
          caption: 'A tour of the layers you will meet. Each is a `Module` and works inside `Sequential`.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why modules rather than plain functions?',
          text: 'A module **registers** everything assigned to it. `model.parameters()` finds every weight in every nested layer automatically: that is what you hand to the optimizer. `model.to(device)` moves them all, `model.state_dict()` collects them for saving, `model.train()` / `model.eval()` switches behaviour for every sub-module, and `print(model)` shows the tree. In the NumPy version you had to carry each of these around by hand.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why do you write `model(x)` rather than calling `model.forward(x)` directly?',
      options: [
        { text: 'Calling the module runs `forward` plus PyTorch’s machinery (hooks, autograd setup); calling `forward` directly skips it', correct: true, why: '`nn.Module.__call__` wraps `forward` with hooks and other bookkeeping, so the documented way to run a model is always `model(x)`.' },
        { text: 'It is faster, because `forward` is a slow method', why: 'The speed is the same; the difference is the extra machinery that `__call__` adds, not performance.' },
        { text: '`forward` is private and raises an error if you call it', why: 'It is an ordinary public method; calling it directly works but bypasses hooks and is considered bad style.' },
        { text: 'Only `model(x)` moves the data to the GPU', why: 'Device placement is controlled by `.to(device)`, not by how you call the model.' },
      ],
      explanation: 'You define `forward`, but you *call* the module itself. `__call__` runs `forward` inside the framework’s hook and bookkeeping machinery.',
    },
    {
      kind: 'concept',
      title: 'Writing your own nn.Module',
      blocks: [
        {
          type: 'p',
          text: '`Sequential` only handles straight chains. For anything else (skip connections, several inputs or outputs, an actor-critic with a shared body and two heads) you subclass `nn.Module`. The recipe has two parts. In `__init__`, call `super().__init__()` first, then create the layers and assign them to `self` (assignment is what registers them). In `forward`, say how data flows through them, using ordinary Python: loops, `if` statements, anything.',
        },
        {
          type: 'code',
          title: 'custom_module.py',
          desktopOnly: true,
          code: `import torch
from torch import nn

class MLP(nn.Module):
    def __init__(self, sizes):
        super().__init__()
        layers = []
        for n_in, n_out in zip(sizes, sizes[1:]):
            layers += [nn.Linear(n_in, n_out), nn.ReLU()]
        self.net = nn.Sequential(*layers[:-1])

    def forward(self, x):
        return self.net(x)

model = MLP([4, 8, 3])
for name, p in model.named_parameters():
    print(name, tuple(p.shape), p.requires_grad)
print(model(torch.zeros(5, 4)).shape, list(model.state_dict().keys())[:2])`,
          output: `net.0.weight (8, 4) True
net.0.bias (8,) True
net.2.weight (3, 8) True
net.2.bias (3,) True
torch.Size([5, 3]) ['net.0.weight', 'net.0.bias']`,
          annotations: [
            { lines: 4, text: 'A model is a class inheriting from `nn.Module`.' },
            { lines: '5-6', text: '`__init__` takes the configuration (here, the layer sizes) and **must** call `super().__init__()` first; without it, assigning layers raises an error.' },
            { lines: '7-10', text: 'Build the layers in a loop: a `Linear` then a `ReLU` for each pair of sizes, drop the final `ReLU` (the output stays linear) and wrap them in `Sequential`, assigned to `self.net`. Assignment registers it.' },
            { lines: '12-13', text: '`forward` describes the computation. Backpropagation needs no extra code: autograd follows whatever happens here.' },
            { lines: 15, text: 'Create the network: 4 inputs, 8 hidden units, 3 outputs.' },
            { lines: '16-17', text: '`named_parameters()` lists every parameter with a path-like name (`net.0.weight` is layer 0 of `self.net`), its shape (weights are `(out, in)`), and that it is trainable.' },
            { lines: 18, text: 'Call the model on a batch of 5 zeros: output shape `(5, 3)`. `state_dict()` is an ordered dictionary of the same tensors by name: this is what you save to disk (a later lesson).' },
          ],
        },
        {
          type: 'p',
          text: 'Modules nest freely. When you keep a *variable number* of layers, use `nn.ModuleList` rather than a plain Python list, since a plain list would hide the layers from PyTorch (their weights would be missing from `parameters()`, never trained, never saved). You can also freeze part of a network by turning off gradients on its parameters, the standard move in transfer learning, where you keep a pretrained body fixed and train only a new head:',
        },
        {
          type: 'code',
          title: 'modulelist_freeze.py',
          desktopOnly: true,
          code: `import torch
from torch import nn

class Policy(nn.Module):
    def __init__(self, obs, actions):
        super().__init__()
        self.body = nn.ModuleList([nn.Linear(obs, 32), nn.Linear(32, 32)])
        self.head = nn.Linear(32, actions)

    def forward(self, x):
        for layer in self.body:
            x = torch.relu(layer(x))
        return self.head(x)

net = Policy(8, 4)
print(sum(p.numel() for p in net.parameters()))
for p in net.body.parameters():
    p.requires_grad_(False)
print(sum(p.numel() for p in net.parameters() if p.requires_grad))
print([name for name, _ in net.named_children()])
print(net(torch.zeros(1, 8)).shape)`,
          output: `1476
132
['body', 'head']
torch.Size([1, 4])`,
          annotations: [
            { lines: '4-8', text: 'A small game-agent policy: a body of two layers (observation size 8 in, 32 hidden) and a head that outputs one score per action (4). The body is a `ModuleList` so both its layers are registered.' },
            { lines: '10-13', text: '`forward` loops over the body layers with a ReLU after each (plain Python control flow), then applies the head to produce action scores.' },
            { lines: '15-16', text: 'Total parameters: body `8·32+32 + 32·32+32 = 1344`, head `32·4+4 = 132`, so **1476**.' },
            { lines: '17-19', text: '`p.requires_grad_(False)` freezes the body: autograd no longer tracks it and the optimizer will not move it. Only the head’s **132** parameters remain trainable.' },
            { lines: '20-21', text: '`named_children()` lists the direct sub-modules, and the model still runs: one observation in, four action scores out.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'It is just a Python class',
          text: 'There is no special language for models: `forward` is ordinary Python, and a module is an ordinary object with a few special methods. Add your own helper methods, store hyperparameters as attributes, write unit tests, subclass modules. The game-agent example is already the shape of a real PPO policy: swap the head for two (action logits and a value estimate) and you have an actor-critic.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A plain Python list of layers stored on a module (`self.layers = [nn.Linear(4, 4), nn.Linear(4, 4)]`) is registered by PyTorch, so the layers’ weights appear in `model.parameters()` and are trained.',
      answer: false,
      explanation: 'False. Only modules and parameters assigned directly as attributes (or stored in `nn.ModuleList`, `nn.ModuleDict` or `nn.Sequential`) are registered. A plain list hides the layers: their weights would not show up in `parameters()`, so the optimizer never updates them and `state_dict()` never saves them. Use `nn.ModuleList`.',
    },
    {
      kind: 'concept',
      title: 'Train mode versus eval mode',
      blocks: [
        {
          type: 'p',
          text: 'A few layers behave differently during training and during evaluation. **[[dropout|Dropout]]** randomly zeroes a fraction `p` of its inputs during training (scaling the survivors by `1/(1−p)`) so that the network cannot rely on any one neuron, a powerful regularizer; at evaluation time it must do nothing. **[[batch-normalization|Batch normalization]]** standardizes each feature using the statistics of the *current batch* while training (and updates running averages), but uses those stored running averages at evaluation, so that a prediction does not depend on which other examples share the batch. You switch every layer at once with `model.train()` and `model.eval()`.',
        },
        {
          type: 'code',
          title: 'train_vs_eval.py',
          desktopOnly: true,
          code: `import torch
from torch import nn

torch.manual_seed(0)
net = nn.Sequential(nn.Linear(100, 100), nn.Dropout(p=0.5))
x = torch.ones(4, 100)
net.train()
print(torch.equal(net(x), net(x)))
net.eval()
print(torch.equal(net(x), net(x)), net.training)
bn = nn.BatchNorm1d(3)
data = torch.tensor([[1.0, 10.0, 100.0], [3.0, 30.0, 300.0]])
print(bn(data).round(decimals=2).tolist())
print([round(v, 2) for v in bn.running_mean.tolist()])`,
          output: `False
True False
[[-1.0, -1.0, -1.0], [1.0, 1.0, 1.0]]
[0.2, 2.0, 20.0]`,
          annotations: [
            { lines: '5-6', text: 'A linear layer followed by dropout with `p = 0.5`, and a batch of four identical inputs.' },
            { lines: '7-8', text: 'In **train mode** dropout draws a fresh random mask on every call, so two forward passes on the same input give *different* outputs: `equal` is `False`.' },
            { lines: '9-10', text: 'After `net.eval()` dropout is switched off and the output is deterministic: `True`. `net.training` is `False`. **Forgetting `eval()` before testing is a classic bug**: accuracy is lower than it should be, and noisy.' },
            { lines: '11-13', text: 'Batch norm in train mode normalizes each feature (column) using the batch’s own mean and standard deviation, so two examples become exactly −1 and +1 whatever the original scale (1 and 3, 10 and 30, 100 and 300 all map to the same result).' },
            { lines: 14, text: 'It also updated its running averages (10% of the batch mean: 0.2, 2.0 and 20.0), which are what evaluation mode will use instead of the batch statistics.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The train/eval checklist',
          text: 'Call `model.train()` before the training loop and `model.eval()` before validation, testing or playing the game with the trained agent; wrap the evaluation in `torch.no_grad()` as well. `model.eval()` does **not** stop gradient tracking and `no_grad()` does **not** change dropout/batch-norm behaviour: you need both for evaluation. Remember to switch back to `train()` afterwards.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the constructor of a custom module: it must call the parent class’s initializer before creating any layers.',
      template: `class Net(nn.Module):
    def __init__(self):
        ___().__init__()
        self.fc = nn.Linear(4, 2)`,
      templateIsCode: true,
      blanks: [{ answers: ['super'] }],
      wordBank: ['super', 'self', 'nn.Module', 'torch'],
      explanation: '`super().__init__()` runs `nn.Module`’s own constructor, which sets up the bookkeeping that registers layers and parameters. Skipping it fails with "cannot assign module before Module.__init__() call".',
    },
    {
      kind: 'concept',
      title: 'Loss functions: what each one expects',
      blocks: [
        {
          type: 'p',
          text: 'PyTorch ships the standard losses as modules in `nn`. The skill is knowing the **input convention** of each, because most "my model won’t learn" problems here come from giving a loss the wrong kind of input. The key rule for classification: feed `CrossEntropyLoss` raw **[[logits]]** (the unnormalized scores from the last linear layer) and **integer class indices** as targets. It applies the softmax (stably) internally, so a softmax layer in your model would apply it *twice*. The binary version, `BCEWithLogitsLoss`, likewise expects raw logits (it applies the sigmoid inside) and float 0/1 targets.',
        },
        {
          type: 'code',
          title: 'losses.py',
          desktopOnly: true,
          code: `import torch
from torch import nn

logits = torch.tensor([[2.0, 0.5, -1.0], [0.1, 0.2, 3.0]])
target = torch.tensor([0, 2])
loss_fn = nn.CrossEntropyLoss()
loss = loss_fn(logits, target)
p = logits.softmax(dim=1)
manual = -(p[torch.arange(2), target].log()).mean()
print(round(loss.item(), 4), round(manual.item(), 4))

pred = torch.tensor([0.3, 2.0, -1.0])
truth = torch.tensor([0.0, 1.0, 1.0])
print(round(nn.MSELoss()(pred, truth).item(), 4), round(nn.BCEWithLogitsLoss()(pred, truth).item(), 4))
bce = -(truth * pred.sigmoid().log() + (1 - truth) * (1 - pred.sigmoid()).log()).mean()
print(round(bce.item(), 4))`,
          output: `0.1755 0.1755
1.6967 0.7648
0.7648`,
          annotations: [
            { lines: '4-5', text: 'Two examples, three classes. `logits` are raw scores (any real numbers), and `target` holds the *index* of the correct class for each example: an `int64` tensor of shape `(batch,)`, not one-hot vectors.' },
            { lines: '6-7', text: 'The loss is called like a function: `loss_fn(logits, target)`, a scalar tensor ready for `backward()`.' },
            { lines: '8-10', text: 'The same value by hand: softmax the logits to probabilities, pick out each example’s true-class probability, take `−log` and average. This is exactly the `softmax_ce` function you wrote in NumPy (0.1755 both ways).' },
            { lines: '12-13', text: 'Regression and binary targets: `pred` are raw scores and `truth` are 0.0/1.0 floats.' },
            { lines: 14, text: '`MSELoss` treats `pred` as numbers to match (1.6967); `BCEWithLogitsLoss` treats the same numbers as logits of probabilities (0.7648). The same inputs mean different things to different losses.' },
            { lines: '15-16', text: 'The by-hand binary cross-entropy `−[y·log σ(z) + (1−y)·log(1−σ(z))]` agrees (0.7648). The built-in version is preferred because it computes this in a numerically stable way that does not break for large `|z|`.' },
          ],
        },
        {
          type: 'table',
          headers: ['Task', 'Last layer', 'Loss', 'Target'],
          rows: [
            ['Regression', '`Linear(…, 1)`, no activation', '`nn.MSELoss()` (or `nn.HuberLoss()`)', 'float tensor, same shape as the output'],
            ['Binary classification', '`Linear(…, 1)`, no sigmoid', '`nn.BCEWithLogitsLoss()`', 'float tensor of 0.0 and 1.0'],
            ['Multi-class classification', '`Linear(…, n_classes)`, no softmax', '`nn.CrossEntropyLoss()`', '`int64` tensor of class indices'],
            ['Multi-label (several tags at once)', '`Linear(…, n_labels)`, no sigmoid', '`nn.BCEWithLogitsLoss()`', 'float 0/1 matrix `(batch, n_labels)`'],
          ],
          caption: 'The pairings to memorize. Note that the activation (sigmoid or softmax) is left *out* of the model: the loss includes it, and at prediction time you apply `torch.sigmoid` or `softmax` yourself if you want probabilities.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The double-softmax bug',
          text: 'Putting `nn.Softmax` at the end of the model *and* using `CrossEntropyLoss` does not crash: it trains, but badly (the gradients are squashed and the model hovers at a low accuracy). It is one of the most common silent mistakes. If a classifier learns slowly, check that its last layer outputs logits.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program (how many learnable parameters a layer has).',
      code: `import torch
from torch import nn

layer = nn.Linear(10, 5)
print(sum(p.numel() for p in layer.parameters()))`,
      answer: '55',
      hint: 'A weight matrix of shape (5, 10) plus a bias vector of length 5.',
      explanation: 'The weight has 5 × 10 = 50 entries and the bias has 5, so the layer has 55 parameters, the same `n_in × n_out + n_out` formula you used for the NumPy network.',
    },
    {
      kind: 'error',
      prompt: 'This classifier trains but stays poor. The model’s last layer outputs raw scores. Tap the faulty line.',
      lines: [
        'logits = model(x)',
        'probs = logits.softmax(dim=1)',
        'loss = nn.CrossEntropyLoss()(probs, y)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`CrossEntropyLoss` expects **raw logits** and applies the softmax internally. Passing `probs` applies softmax twice, which flattens the gradients and degrades learning. Use `nn.CrossEntropyLoss()(logits, y)`, and take the softmax only when you want probabilities for display.',
    },
    {
      kind: 'numeric',
      prompt: 'How many parameters does the network `nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 3))` have?',
      answer: '67',
      hint: 'Linear(4, 8) has 4·8 + 8 parameters; Linear(8, 3) has 8·3 + 3. ReLU has none.',
      explanation: 'The first layer has 4·8 + 8 = 40 parameters, the second 8·3 + 3 = 27, and ReLU has none, so the total is 40 + 27 = 67.',
      label: 'Parameters:',
    },
    {
      kind: 'code',
      prompt: 'Implement a miniature version of PyTorch’s module system with NumPy. `Linear(W, b)` applies `x @ W + b`, `ReLU()` applies `np.maximum(0, x)`, and `Sequential(*layers)` applies its layers in order. Every module is callable (`module(x)`) and has `parameters()` returning a list of its parameter arrays (`[W, b]` for Linear, `[]` for ReLU, and the concatenation, in order, for Sequential).',
      starter: `import numpy as np

class Linear:
    ...

class ReLU:
    ...

class Sequential:
    ...
`,
      solution: `import numpy as np


class Linear:
    def __init__(self, W, b):
        self.W = np.asarray(W, dtype=float)
        self.b = np.asarray(b, dtype=float)

    def __call__(self, x):
        return np.asarray(x, dtype=float) @ self.W + self.b

    def parameters(self):
        return [self.W, self.b]


class ReLU:
    def __call__(self, x):
        return np.maximum(0.0, np.asarray(x, dtype=float))

    def parameters(self):
        return []


class Sequential:
    def __init__(self, *layers):
        self.layers = list(layers)

    def __call__(self, x):
        for layer in self.layers:
            x = layer(x)
        return x

    def parameters(self):
        params = []
        for layer in self.layers:
            params.extend(layer.parameters())
        return params
`,
      tests: `import numpy as np

W1 = np.array([[1.0, -1.0], [2.0, 0.5]])
b1 = np.array([0.0, -1.0])
W2 = np.array([[1.0], [1.0]])
b2 = np.array([0.5])
net = Sequential(Linear(W1, b1), ReLU(), Linear(W2, b2))

x = np.array([[1.0, 2.0], [-1.0, 0.0]])
h = np.maximum(0, x @ W1 + b1)
assert np.allclose(net(x), h @ W2 + b2)
assert net(x).shape == (2, 1)

params = net.parameters()
assert len(params) == 4
assert params[0] is net.layers[0].W and params[1] is net.layers[0].b
assert params[2] is net.layers[2].W and params[3] is net.layers[2].b
assert sum(p.size for p in params) == 4 + 2 + 2 + 1

assert ReLU().parameters() == []
assert np.array_equal(ReLU()(np.array([-1.0, 0.0, 2.0])), [0.0, 0.0, 2.0])
assert np.allclose(Linear(np.eye(2), np.zeros(2))(np.array([3.0, 4.0])), [3.0, 4.0])

nested = Sequential(Sequential(Linear(W1, b1), ReLU()), Linear(W2, b2))
assert np.allclose(nested(x), net(x)) and len(nested.parameters()) == 4
assert Sequential().parameters() == [] and np.array_equal(Sequential()(np.array([1.0])), [1.0])`,
      packages: ['numpy'],
      checks: ['`Linear`, `ReLU` and `Sequential` are callable and compute `x @ W + b`, `max(0, x)` and the chain of layers', '`parameters()` returns the actual arrays in order (`[W, b]`, `[]`, and the concatenation for `Sequential`)', 'Modules can be nested, and an empty `Sequential` is the identity'],
      hint: 'Give each class a `__call__` method (the forward pass) and a `parameters` method. `Sequential` stores its layers in a list, loops over them in `__call__`, and `extend`s one list with each layer’s parameters.',
      explanation: 'This is the idea behind `nn.Module`: modules are callable, and a container discovers its children’s parameters by asking them recursively. The real class adds registration of attributes, hooks, device movement and saving, but `optimizer = SGD(model.parameters())` works because of exactly this small interface.',
    },
    {
      kind: 'code',
      prompt: 'Write `bce_with_logits(logits, targets)` returning the mean binary cross-entropy computed from raw logits `z` and 0/1 targets `y` in a numerically stable way, using the identity `loss = max(z, 0) − z·y + log(1 + exp(−|z|))` for each element. Inputs are NumPy arrays (or lists) of the same shape; return a Python float.',
      starter: `import numpy as np

def bce_with_logits(logits, targets):
    ...
`,
      solution: `import numpy as np


def bce_with_logits(logits, targets):
    z = np.asarray(logits, dtype=float)
    y = np.asarray(targets, dtype=float)
    loss = np.maximum(z, 0.0) - z * y + np.log1p(np.exp(-np.abs(z)))
    return float(np.mean(loss))
`,
      tests: `import numpy as np

z = np.array([0.3, 2.0, -1.0])
y = np.array([0.0, 1.0, 1.0])
naive = -np.mean(y * np.log(1 / (1 + np.exp(-z))) + (1 - y) * np.log(1 - 1 / (1 + np.exp(-z))))
out = bce_with_logits(z, y)
assert type(out) is float and abs(out - naive) < 1e-12
assert abs(out - 0.7648) < 1e-4

assert abs(bce_with_logits([0.0], [1.0]) - np.log(2)) < 1e-12
assert abs(bce_with_logits([1000.0], [1.0])) < 1e-12
assert abs(bce_with_logits([-1000.0], [1.0]) - 1000.0) < 1e-9
assert abs(bce_with_logits([1000.0], [0.0]) - 1000.0) < 1e-9
assert np.isfinite(bce_with_logits([-800.0, 800.0], [1.0, 0.0]))
assert abs(bce_with_logits([[0.0, 0.0], [0.0, 0.0]], [[1, 0], [0, 1]]) - np.log(2)) < 1e-12

zz = np.array([5.0, -5.0])
good = bce_with_logits(zz, np.array([1.0, 0.0]))
bad = bce_with_logits(zz, np.array([0.0, 1.0]))
assert good < 0.01 < 4.9 < bad
z0 = z.copy()
bce_with_logits(z, y)
assert np.array_equal(z, z0)`,
      packages: ['numpy'],
      checks: ['Computes the mean of `max(z, 0) − z·y + log(1 + exp(−|z|))` and returns a plain float', 'Matches the naive sigmoid formula for moderate logits, and stays finite for huge ones (±1000)', 'Works for arrays of any shape (and lists) and does not modify its inputs'],
      hint: 'Use `np.maximum(z, 0) - z * y + np.log1p(np.exp(-np.abs(z)))` element-wise and average with `np.mean`. Because the exponent is always negative, nothing overflows.',
      explanation: 'The naive formula `log(sigmoid(z))` underflows: for `z = −1000` the sigmoid is exactly 0 and `log(0)` is `−inf`. The rearranged version only ever exponentiates a non-positive number, so it is stable. This is precisely what `nn.BCEWithLogitsLoss` does (and why it beats `Sigmoid` followed by `BCELoss`).',
    },
    {
      kind: 'code',
      prompt: 'Write `dropout(x, p, training, seed)` implementing *inverted* dropout with NumPy. If `training` is false (or `p == 0`) return a copy of `x` unchanged. Otherwise draw `u = np.random.default_rng(seed).random(x.shape)`, keep the entries where `u >= p`, zero the rest, and scale the survivors by `1 / (1 - p)`. Raise `ValueError` unless `0 <= p < 1`.',
      starter: `import numpy as np

def dropout(x, p, training, seed):
    ...
`,
      solution: `import numpy as np


def dropout(x, p, training, seed):
    if not 0 <= p < 1:
        raise ValueError("p must satisfy 0 <= p < 1")
    x = np.asarray(x, dtype=float)
    if not training or p == 0:
        return x.copy()
    keep = np.random.default_rng(seed).random(x.shape) >= p
    return x * keep / (1.0 - p)
`,
      tests: `import numpy as np

x = np.arange(1, 7, dtype=float)
assert np.array_equal(dropout(x, 0.5, False, 0), x)
assert dropout(x, 0.5, False, 0) is not x
assert np.array_equal(dropout(x, 0.0, True, 0), x)

out = dropout(x, 0.5, True, 3)
assert out.shape == x.shape
assert all(o == 0 or abs(o - 2 * xi) < 1e-12 for o, xi in zip(out, x))
assert np.array_equal(out, dropout(x, 0.5, True, 3))

big = np.ones(100000)
d = dropout(big, 0.3, True, 1)
assert abs(np.mean(d == 0) - 0.3) < 0.01
assert abs(d.mean() - 1.0) < 0.02
assert set(np.unique(np.round(d, 6))) == {0.0, round(1 / 0.7, 6)}

m = np.ones((4, 5))
assert dropout(m, 0.5, True, 0).shape == (4, 5)
assert np.array_equal(m, np.ones((4, 5)))
for bad_p in (1.0, -0.1, 1.5):
    try:
        dropout(x, bad_p, True, 0)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      packages: ['numpy'],
      checks: ['In eval mode (or `p == 0`) returns an unchanged copy', 'In training mode zeroes about a fraction `p` and scales the survivors by `1/(1−p)` so the expected value is unchanged', 'Deterministic for a given seed, works for any shape, and raises `ValueError` for `p` outside `[0, 1)`'],
      hint: 'Make a boolean mask `keep = rng.random(x.shape) >= p`, then return `x * keep / (1 - p)`. Check `training` and `p` first.',
      explanation: 'Dividing by `1 − p` during training (“inverted” dropout) keeps the *average* activation the same, so at evaluation time you simply switch dropout off with no rescaling. That is why `model.eval()` is all PyTorch needs, and why forgetting it adds noise to your predictions.',
    },
  ],
  takeaways: [
    'A **`nn.Module`** owns parameters and sub-modules. `nn.Linear` is `x @ Wᵀ + b` (weight shape `(out, in)`), activations are modules, and `nn.Sequential` chains them; `sum(p.numel() for p in model.parameters())` counts the parameters.',
    'A custom model subclasses `nn.Module`: call `super().__init__()`, create layers as attributes (use `nn.ModuleList` for variable lists, never a plain list), and write `forward` in ordinary Python. Run it with `model(x)`, not `model.forward(x)`.',
    '`named_parameters()`, `state_dict()` and `named_children()` inspect a model; `p.requires_grad_(False)` freezes parameters, the basis of transfer learning.',
    '`model.train()` and `model.eval()` switch **dropout** (random zeroing, off at evaluation) and **batch norm** (batch statistics versus running averages). Evaluate with both `model.eval()` and `torch.no_grad()`.',
    '`CrossEntropyLoss` wants raw logits and `int64` class indices; `BCEWithLogitsLoss` raw logits and float 0/1 targets; `MSELoss` numbers. Leave softmax/sigmoid out of the model: applying them before these losses is a classic silent bug.',
  ],
  reading: [
    { title: 'PyTorch: Build the Neural Network', url: 'https://docs.pytorch.org/tutorials/beginner/basics/buildmodel_tutorial.html', source: 'tutorial', note: 'Official tutorial: nn.Module, layers, Sequential and parameters.' },
    { title: 'PyTorch documentation: torch.nn', url: 'https://docs.pytorch.org/docs/stable/nn.html', source: 'docs', note: 'The catalogue of every layer, activation and loss.' },
    { title: 'PyTorch: What is torch.nn really?', url: 'https://docs.pytorch.org/tutorials/beginner/nn_tutorial.html', source: 'tutorial', note: 'Builds up from raw tensors to nn.Module, optim and DataLoader, step by step.' },
    { title: 'Dive into Deep Learning: Builders’ Guide (Layers and Modules)', url: 'https://d2l.ai/chapter_builders-guide/model-construction.html', source: 'book', note: 'Custom layers, parameter management and initialization in PyTorch.' },
  ],
};
