import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-saving-exporting',
  title: 'Saving, Loading and Exporting Models',
  summary: 'Keep what you trained: save a state_dict, build resumable checkpoints, load safely, and export to ONNX so a trained network can run inside a game engine or a C++ program.',
  minutes: 22,
  objectives: [
    'Save and load a model with its `state_dict`, and explain why that beats pickling the whole model',
    'Build a checkpoint that lets training resume exactly where it stopped',
    'Diagnose key and shape mismatches when loading, and load untrusted files safely',
    'Export a model to ONNX, run it with ONNX Runtime and verify it matches PyTorch',
    'List what must ship with a model for it to work outside your training script',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The state_dict: a model’s weights as a plain dictionary',
      blocks: [
        {
          type: 'p',
          text: 'A trained network is nothing more than its parameters (and a few buffers such as batch-norm running averages). PyTorch exposes them as a **[[state-dict|`state_dict`]]**: an ordered dictionary mapping each parameter’s *name* to its tensor. The names come from the module structure: in an `nn.Sequential` they are the layer index plus the parameter kind (`0.weight`, `0.bias`, `2.weight`…); in your own `nn.Module` they follow your attribute names (`encoder.fc1.weight`).',
        },
        {
          type: 'code',
          title: 'inspect_state_dict.py',
          desktopOnly: true,
          code: `import torch
from torch import nn

model = nn.Sequential(nn.Linear(3, 4), nn.ReLU(), nn.Linear(4, 2))
for name, p in model.state_dict().items():
    print(name, tuple(p.shape))
print(list(model.state_dict().keys()))`,
          output: `0.weight (4, 3)
0.bias (4,)
2.weight (2, 4)
2.bias (2,)
['0.weight', '0.bias', '2.weight', '2.bias']`,
          annotations: [
            { lines: 4, text: 'A small network: 3 inputs, 4 hidden units, 2 outputs.' },
            { lines: '5-6', text: 'Each entry has a name and a tensor. A `Linear(3, 4)` stores its weight as `(out, in) = (4, 3)` plus a bias of length 4.' },
            { lines: 7, text: 'Only layers *with parameters* appear: the ReLU at index 1 has none, so the names jump from `0.…` to `2.…`. The index keeps the position, which is why loading needs the same structure.' },
          ],
        },
        {
          type: 'p',
          text: 'Saving uses `torch.save(model.state_dict(), path)`; loading creates the model first, then fills it with `model.load_state_dict(torch.load(path))`. This is the **recommended approach** rather than `torch.save(model)`, which pickles the entire Python object and ties the file to your exact class and file layout, so it breaks the moment you rename a module or move a file. A state dict is just data: it survives refactoring and can be loaded by any code that builds the same architecture.',
        },
        {
          type: 'code',
          title: 'save_and_load.py',
          desktopOnly: true,
          code: `import os, tempfile
import torch
from torch import nn

def make():
    return nn.Sequential(nn.Linear(3, 4), nn.ReLU(), nn.Linear(4, 2))

torch.manual_seed(0)
a = make()
x = torch.randn(5, 3)
path = os.path.join(tempfile.mkdtemp(), "model.pt")
torch.save(a.state_dict(), path)

b = make()
print(torch.equal(a(x), b(x)))
b.load_state_dict(torch.load(path, weights_only=True))
b.eval()
print(torch.equal(a.eval()(x), b(x)))`,
          output: `False
True`,
          annotations: [
            { lines: '5-6', text: 'A factory function holds the **architecture**. The file stores only numbers, so the structure must live in code that you keep alongside it.' },
            { lines: '8-10', text: 'Seed, then build model `a` (random initial weights) and a batch of 5 inputs.' },
            { lines: '11-12', text: 'Write the weights to a temporary file. `.pt` or `.pth` are the usual extensions.' },
            { lines: '14-15', text: 'A freshly built model `b` has *different* random weights, so its outputs differ from `a`: `False`.' },
            { lines: '16-18', text: 'Load the saved weights into `b` (`weights_only=True` is the safe mode) and switch to eval mode: now both models give bit-identical outputs, `True`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'torch.load can run code: use weights_only=True',
          text: 'A `.pt` file is a Python **pickle**, and unpickling an untrusted file can execute arbitrary code on your machine. Treat model files downloaded from the internet like programs. Load tensors-only files with `torch.load(path, weights_only=True)` (the default in recent PyTorch versions), and prefer the **safetensors** format, which stores raw tensors and cannot run code. Use `map_location="cpu"` to load a GPU-trained file on a machine without a GPU.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why is `torch.save(model.state_dict(), path)` preferred over `torch.save(model, path)`?',
      options: [
        { text: 'It stores only the parameter tensors, so the file does not depend on your class definitions and survives code refactoring', correct: true, why: 'Pickling the whole model records module paths and class names; renaming a file or class later makes loading fail. A state dict is plain data keyed by parameter names.' },
        { text: 'It stores the model’s code, so no class is needed when loading', why: 'It is the opposite: only the numbers are stored, so you must rebuild the architecture in code before loading.' },
        { text: 'It makes the model run faster', why: 'The save format has no effect on inference speed; it only affects what is written to disk.' },
        { text: 'It encrypts the weights', why: 'No encryption happens. Treat the file as plain data (and as a pickle that deserves caution when it comes from elsewhere).' },
      ],
      explanation: 'The state dict decouples the weights from the code that defines the architecture, making files portable and robust to refactoring.',
    },
    {
      kind: 'concept',
      title: 'Checkpoints: stop and resume exactly',
      blocks: [
        {
          type: 'p',
          text: 'Long training runs crash, get preempted or run out of your allotted time. A **[[checkpoint|checkpoint]]** saves everything needed to *resume* rather than restart: the model weights, the **optimizer state** (Adam keeps two running averages per parameter, so without it the first steps after resuming are wrong), the scheduler, the epoch, and usually the best validation score. It is just a dictionary that you pass to `torch.save`. Save one every few epochs, and keep a separate "best" file (the early-stopping lesson’s best-validation weights).',
        },
        {
          type: 'code',
          title: 'checkpoint.py',
          desktopOnly: true,
          code: `import os, tempfile
import torch
from torch import nn

model = nn.Linear(2, 1)
opt = torch.optim.Adam(model.parameters(), lr=0.01)
ckpt = {"epoch": 7, "model": model.state_dict(), "optimizer": opt.state_dict(), "best_val": 0.123}
path = os.path.join(tempfile.mkdtemp(), "ckpt.pt")
torch.save(ckpt, path)
loaded = torch.load(path, weights_only=True)
print(sorted(loaded.keys()), loaded["epoch"], loaded["best_val"])
print(sorted(loaded["optimizer"].keys()))
wrong = nn.Linear(3, 1)
try:
    wrong.load_state_dict(loaded["model"])
except RuntimeError as e:
    print("RuntimeError", "size mismatch" in str(e))`,
          output: `['best_val', 'epoch', 'model', 'optimizer'] 7 0.123
['param_groups', 'state']
RuntimeError True`,
          annotations: [
            { lines: '5-7', text: 'A checkpoint is a plain dictionary: the epoch reached, the model’s state dict, the **optimizer’s** state dict and the best validation loss so far. You would add the scheduler’s `state_dict()` too.' },
            { lines: '8-9', text: 'Write it to disk with a single `torch.save`.' },
            { lines: '10-12', text: 'Read it back. The optimizer state has two parts: the hyperparameters (`param_groups`, such as the learning rate) and the per-parameter running statistics (`state`). To resume, call `model.load_state_dict(loaded["model"])`, `opt.load_state_dict(loaded["optimizer"])` and start the loop at `loaded["epoch"] + 1`.' },
            { lines: '13-17', text: 'Loading into a model with a **different architecture** (here 3 inputs instead of 2) raises a `RuntimeError` that reports the size mismatch, which is usually the first sign you loaded the wrong file or changed the model.' },
          ],
        },
        {
          type: 'table',
          headers: ['Loading error', 'Meaning', 'Fix'],
          rows: [
            ['`Missing key(s) in state_dict`', 'The model has parameters the file lacks', 'The architecture grew: load the right file, or `strict=False` to keep the new layers freshly initialized'],
            ['`Unexpected key(s) in state_dict`', 'The file has parameters the model lacks', 'The architecture shrank or names changed (for example a `module.` prefix from `DataParallel`)'],
            ['`size mismatch for …`', 'The name matches but the shape differs', 'A layer width or class count changed: rebuild the model with the original sizes'],
          ],
          caption: 'Reading `load_state_dict` errors. `strict=False` reports mismatches instead of raising, so check its return value and never use it to silence a mistake.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why the optimizer state is part of the checkpoint',
          text: 'Adam and momentum SGD remember a running average of past gradients for every parameter. If you resume with only the weights, those averages restart from zero, the effective step sizes jump, and the loss often spikes for a few hundred steps (sometimes it never fully recovers). Saving and restoring the optimizer state makes a resumed run behave as if it had never stopped. If you only need to *use* the model (inference, deployment), the weights alone are enough and the file is a third of the size.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Fine-tuning is partial loading',
          text: 'To reuse a pretrained network with a new output layer, load the weights with `strict=False` (the new head’s keys are "missing" and keep their random initialization), then train. Transfer learning, later in this course, is exactly this pattern.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A file made with `torch.save(model.state_dict(), "m.pt")` can be loaded into a model without writing or importing the model’s class, because the file contains the network’s code.',
      answer: false,
      explanation: 'False. The file holds only named tensors. You must construct a model with the same architecture first and then call `load_state_dict`; the structure lives in your code, not in the file.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the save and load lines using the recommended safe approach.',
      template: `torch.save(model.___(), "model.pt")
model.load_state_dict(torch.load("model.pt", ___=True))`,
      templateIsCode: true,
      blanks: [{ answers: ['state_dict'] }, { answers: ['weights_only'] }],
      wordBank: ['state_dict', 'weights_only', 'parameters', 'map_location'],
      explanation: '`state_dict()` returns the name-to-tensor dictionary to save, and `weights_only=True` makes `torch.load` refuse to run arbitrary pickled code. `parameters()` returns an iterator without names, and `map_location` selects the device to load onto.',
    },
    {
      kind: 'concept',
      title: 'Exporting to ONNX for games and C++',
      blocks: [
        {
          type: 'p',
          text: 'A PyTorch file needs Python and PyTorch to run, which is fine for research but awkward for shipping. A game engine, a C++ server or a phone app wants a small, language-neutral runtime. **[[onnx|ONNX]]** (Open Neural Network Exchange) is the standard answer: a file format describing the network as a graph of standard operators, with the weights embedded. You export once from PyTorch, then run the file anywhere an ONNX runtime exists: **ONNX Runtime** (Python, C++, C#, Java, mobile, web), Unity’s inference engine (formerly Barracuda and Sentis), Unreal Engine’s NNE, TensorRT on NVIDIA GPUs and more. For a C++ programmer this is the bridge: train in Python, deploy in your engine.',
        },
        {
          type: 'p',
          text: '`torch.onnx.export(model, example_inputs, path, …)` *traces* the model with an example input, so put the model in **`eval()` mode** first (dropout and batch norm must behave as at inference). Name the inputs and outputs, and declare **dynamic axes** for dimensions that vary, usually the batch size, otherwise the exported graph accepts only the example’s exact shape. Then verify: run the exported file in ONNX Runtime and compare it with PyTorch on the same inputs.',
        },
        {
          type: 'code',
          title: 'export_onnx.py',
          desktopOnly: true,
          outputVaries: true,
          code: `import numpy as np
import torch
from torch import nn
import onnxruntime as ort

torch.manual_seed(0)
model = nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 3)).eval()
dummy = torch.randn(1, 4)
torch.onnx.export(model, (dummy,), "policy.onnx", input_names=["obs"], output_names=["logits"],
                  dynamic_axes={"obs": {0: "batch"}, "logits": {0: "batch"}})

sess = ort.InferenceSession("policy.onnx", providers=["CPUExecutionProvider"])
x = np.random.default_rng(0).normal(size=(5, 4)).astype(np.float32)
out = sess.run(["logits"], {"obs": x})[0]
with torch.no_grad():
    ref = model(torch.from_numpy(x)).numpy()
print(out.shape, bool(np.allclose(out, ref, atol=1e-5)))`,
          output: `(5, 3) True`,
          annotations: [
            { lines: '6-8', text: 'A small *policy-like* network (4 observations in, 3 action scores out), switched to `eval()`, and a **dummy input** with batch size 1 that defines the shapes for tracing.' },
            { lines: '9-10', text: 'Export to `policy.onnx`. We name the input `obs` and the output `logits` (your engine code will use these names) and mark axis 0 as a dynamic `batch` dimension. Recent PyTorch versions also print progress messages while exporting.' },
            { lines: '12-14', text: 'Open the file with **ONNX Runtime** (no PyTorch needed for this part) and run it on 5 observations at once. Inputs must be `float32` NumPy arrays whose names match the export.' },
            { lines: '15-17', text: 'Compare against the original PyTorch model on the same inputs. `True` means the export is faithful to within `1e-5`. **Always run this parity check**: it catches unsupported operators and train/eval mistakes before they reach the game.' },
          ],
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output (the names of the entries in a model’s state dict).',
      code: `import torch
from torch import nn

m = nn.Sequential(nn.Linear(3, 4), nn.ReLU(), nn.Linear(4, 2))
print(list(m.state_dict().keys()))`,
      answer: "['0.weight', '0.bias', '2.weight', '2.bias']",
      hint: 'Names are the layer index plus `weight` or `bias`. The ReLU in position 1 has no parameters.',
      explanation: 'Only the two `Linear` layers (positions 0 and 2) have parameters, each contributing a `weight` and a `bias`, in that order. The ReLU leaves a gap in the numbering.',
    },
    {
      kind: 'error',
      prompt: 'This save does not store the weights as intended. Tap the faulty line.',
      lines: [
        'model = Net()',
        'train(model, loader)',
        'torch.save(model.state_dict, "policy.pt")',
        'print("saved")',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`model.state_dict` without parentheses is the *method itself*, not the dictionary it returns. The call must be `model.state_dict()`. Saving the method does not store the parameters in the portable form you expect, and loading it later fails or silently relies on pickled code.',
    },
    {
      kind: 'numeric',
      prompt: 'A model has 1,000,000 float32 parameters (4 bytes each). You save a full checkpoint containing the model weights and the **Adam optimizer state**, which keeps two extra tensors (running mean and running squared gradient) of the same size per parameter. About how many megabytes is the checkpoint? (1 MB = 1,000,000 bytes; ignore small overhead.)',
      answer: '12',
      hint: 'Model plus two Adam tensors makes three copies of the parameters. Each copy is 1,000,000 × 4 bytes.',
      explanation: 'The weights take 4 MB; Adam’s two state tensors take 4 MB each, so the checkpoint is about 3 × 4 = 12 MB. This is why a resumable checkpoint is about three times larger than the weights you ship for inference.',
      label: 'MB:',
    },
    {
      kind: 'concept',
      title: 'What must ship with a model',
      blocks: [
        {
          type: 'p',
          text: 'A set of weights alone is not a working product. Most "it worked on my laptop but not in the game" failures come from something that did not travel with the model. Use this checklist before you hand a model over.',
        },
        {
          type: 'table',
          headers: ['Must travel with the model', 'Why it matters'],
          rows: [
            ['**Preprocessing**: the normalization mean and standard deviation (from the *training* set), image size, tokenizer or observation scaling', 'The model only works on inputs prepared the way it was trained; the wrong scale quietly ruins every prediction'],
            ['**Input and output spec**: names, shapes, dtypes, and what each output index means (action order, class names)', 'The engine code has to interpret the numbers the same way as training'],
            ['**Postprocessing**: softmax or argmax, action masks, thresholds', 'Models output logits; the game needs a decision'],
            ['**Versions**: the model code revision, library versions, training data version, random seed, hyperparameters', 'So you can reproduce or debug a model months later'],
            ['**A parity test**: a few saved inputs with the expected outputs', 'Re-run it after every export or conversion to catch silent breakage'],
            ['**Quantization or half precision** (optional)', 'int8 or float16 weights shrink the file and speed up inference with a small accuracy cost: measure it'],
          ],
          caption: 'The shipping checklist. Store the preprocessing numbers in a small JSON file next to the model, or bake them into the exported graph.',
        },
        {
          type: 'table',
          headers: ['Format', 'Best for', 'Needs Python and PyTorch to run?'],
          rows: [
            ['`state_dict` (`.pt`)', 'Resuming training and sharing weights between PyTorch projects', 'Yes'],
            ['Checkpoint dictionary', 'Resuming exactly where training stopped', 'Yes'],
            ['safetensors', 'Safe distribution of weights (common for large models)', 'Needs a loader, but cannot run code'],
            ['TorchScript or `torch.export`', 'Running a PyTorch model from C++ (LibTorch) without Python', 'No Python, but needs the LibTorch library'],
            ['ONNX', 'Cross-platform deployment: game engines, C++, mobile, web', 'No (use ONNX Runtime or an engine’s own runtime)'],
          ],
          caption: 'Choosing a format. For games, ONNX is the usual target.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'From C++ you have two doors',
          text: 'In a C++ game you can link **ONNX Runtime** (a C/C++ API; load the `.onnx`, create a session, feed `float` buffers by name) or **LibTorch** (the C++ build of PyTorch, loading a TorchScript or exported-program file). ONNX Runtime is the lighter option and works with the exact model files you export in this lesson. Either way, the C++ code is only a thin wrapper: build the input array, run, read the output array, apply your postprocessing.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises follow in plain Python and NumPy: build the `state_dict` naming scheme yourself, write the checker behind a "missing / unexpected / size mismatch" error, and write the parity test you should run after every export.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `flatten_state(layers)` that mimics `Sequential.state_dict()` naming. `layers` is a list: `None` stands for a layer without parameters (like ReLU), and a dict such as `{"weight": ..., "bias": ...}` holds a layer’s parameters. Return a dict whose keys are `"<layer index>.<name>"` (in layer order, and within a layer in the dict’s own order) and whose values are the parameter values. The input must not be modified.',
      starter: `def flatten_state(layers):
    ...
`,
      solution: `def flatten_state(layers):
    state = {}
    for i, layer in enumerate(layers):
        if layer is None:
            continue
        for name, value in layer.items():
            state[f"{i}.{name}"] = value
    return state
`,
      tests: `layers = [{"weight": [[1, 2, 3]], "bias": [0]}, None, {"weight": [[4], [5]], "bias": [6, 7]}]
state = flatten_state(layers)
assert list(state) == ["0.weight", "0.bias", "2.weight", "2.bias"]
assert state["0.weight"] == [[1, 2, 3]] and state["2.bias"] == [6, 7]
assert flatten_state([]) == {}
assert flatten_state([None, None]) == {}
assert list(flatten_state([None, {"w": 1}, None, {"w": 2, "b": 3}])) == ["1.w", "3.w", "3.b"]
assert layers[1] is None and list(layers[0]) == ["weight", "bias"]
assert isinstance(state, dict)`,
      checks: ['Keys are `"<index>.<name>"`, in layer order and each layer’s own dict order', 'Layers that are `None` are skipped, but still count towards the index', 'Returns a new dict and does not modify the input'],
      hint: 'Loop with `enumerate(layers)` so the index counts every layer, skip `None`, and for each `(name, value)` in `layer.items()` set `state[f"{i}.{name}"] = value`.',
      explanation: 'This is why the keys of a Sequential jump from `0.` to `2.`: the index is the layer’s *position*, so parameter-free layers leave gaps. Nested modules extend the same idea with dotted paths like `encoder.fc1.weight`.',
    },
    {
      kind: 'code',
      prompt: 'Write `check_state(expected, loaded, strict=True)`. Both arguments map parameter names to shapes (tuples). Build a report dict with three **sorted** lists: `"missing"` (names in `expected` but not in `loaded`), `"unexpected"` (in `loaded` but not in `expected`) and `"mismatched"` (names in both whose shapes differ). If `strict` is true and any list is non-empty, raise `RuntimeError` instead of returning (the message should mention each non-empty category name). Otherwise return the report.',
      starter: `def check_state(expected, loaded, strict=True):
    ...
`,
      solution: `def check_state(expected, loaded, strict=True):
    report = {
        "missing": sorted(k for k in expected if k not in loaded),
        "unexpected": sorted(k for k in loaded if k not in expected),
        "mismatched": sorted(k for k in expected if k in loaded and expected[k] != loaded[k]),
    }
    if strict and any(report.values()):
        problems = [f"{name}: {keys}" for name, keys in report.items() if keys]
        raise RuntimeError("Error(s) loading state: " + "; ".join(problems))
    return report
`,
      tests: `expected = {"0.weight": (4, 3), "0.bias": (4,), "2.weight": (2, 4), "2.bias": (2,)}
same = dict(expected)
assert check_state(expected, same) == {"missing": [], "unexpected": [], "mismatched": []}

old = {"0.weight": (4, 3), "0.bias": (4,)}
rep = check_state(expected, old, strict=False)
assert rep == {"missing": ["2.bias", "2.weight"], "unexpected": [], "mismatched": []}

extra = dict(expected)
extra["module.x"] = (1,)
extra["a.b"] = (2,)
rep = check_state(expected, extra, strict=False)
assert rep["unexpected"] == ["a.b", "module.x"] and rep["missing"] == []

wrong = dict(expected)
wrong["0.weight"] = (4, 2)
assert check_state(expected, wrong, strict=False)["mismatched"] == ["0.weight"]

for bad, word in [(old, "missing"), (extra, "unexpected"), (wrong, "mismatched")]:
    try:
        check_state(expected, bad)
    except RuntimeError as e:
        assert word in str(e)
    else:
        raise AssertionError("expected RuntimeError")
assert check_state({}, {}, strict=True) == {"missing": [], "unexpected": [], "mismatched": []}`,
      checks: ['Reports sorted lists of missing, unexpected and shape-mismatched names', 'In strict mode raises `RuntimeError` naming each problem category; non-strict mode returns the report', 'Names that match with equal shapes appear in no list'],
      hint: 'Three comprehensions over the two dictionaries build the lists; `mismatched` needs `k in loaded and expected[k] != loaded[k]`. Then `if strict and any(report.values()): raise RuntimeError(...)`.',
      explanation: 'This is the logic behind `load_state_dict`’s error message. Returning the report in non-strict mode is how `strict=False` lets you do partial loading for fine-tuning while still *telling* you what was skipped, so you can confirm that only the layers you expected were left out.',
    },
    {
      kind: 'code',
      prompt: 'Write `parity_check(f, g, inputs, atol=1e-5, rtol=1e-4)`: the test you run after exporting a model. `f` and `g` are functions mapping a NumPy array to a NumPy array (the original and the exported model). Return `(ok, max_abs_diff)`, where `ok` is `np.allclose(a, b, atol=atol, rtol=rtol)` for the two outputs and `max_abs_diff` is the largest absolute difference as a Python float. If the output **shapes differ** return `(False, float("inf"))`.',
      starter: `import numpy as np

def parity_check(f, g, inputs, atol=1e-5, rtol=1e-4):
    ...
`,
      solution: `import numpy as np


def parity_check(f, g, inputs, atol=1e-5, rtol=1e-4):
    a = np.asarray(f(inputs))
    b = np.asarray(g(inputs))
    if a.shape != b.shape:
        return False, float("inf")
    ok = bool(np.allclose(a, b, atol=atol, rtol=rtol))
    diff = float(np.max(np.abs(a - b))) if a.size else 0.0
    return ok, diff
`,
      tests: `import numpy as np

W = np.array([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]])
x = np.array([[1.0, 0.0, -1.0], [0.5, 0.5, 0.5]])
f = lambda v: v @ W
g_same = lambda v: v @ W.astype(np.float32).astype(np.float64)
ok, d = parity_check(f, g_same, x)
assert ok is True and isinstance(d, float) and d < 1e-9

g_noisy = lambda v: v @ W + 1e-3
ok, d = parity_check(f, g_noisy, x)
assert ok is False and abs(d - 1e-3) < 1e-9
ok, d = parity_check(f, g_noisy, x, atol=1e-2)
assert ok is True

g_shape = lambda v: (v @ W)[:, :1]
assert parity_check(f, g_shape, x) == (False, float("inf"))

g_bad = lambda v: v @ W * 2
ok, d = parity_check(f, g_bad, x)
assert ok is False and d > 1.0
assert parity_check(f, f, np.zeros((0, 3))) == (True, 0.0)
assert parity_check(lambda v: v.tolist(), lambda v: v, x)[0] is True`,
      packages: ['numpy'],
      checks: ['Compares the two outputs with `np.allclose` using the given tolerances and returns a Python `bool`', 'Returns the maximum absolute difference as a Python `float` (0.0 for empty outputs)', 'Returns `(False, inf)` when the output shapes differ'],
      hint: 'Convert both outputs with `np.asarray`, compare `.shape` first, then `bool(np.allclose(a, b, atol=atol, rtol=rtol))` and `float(np.max(np.abs(a - b)))` (guard the empty case with `a.size`).',
      explanation: 'This is the check from the ONNX example, made reusable. Exact equality is the wrong test: different libraries add floats in a different order, so you need a small tolerance. Keep a handful of saved inputs and their expected outputs in your repository and run this test after every export, quantization or runtime upgrade.',
    },
  ],
  takeaways: [
    'A model’s weights are its **`state_dict`**: a name-to-tensor dictionary. Save with `torch.save(model.state_dict(), path)`; load by rebuilding the architecture, then `load_state_dict(torch.load(path, weights_only=True))`. Save the state dict, not the pickled model.',
    'A **checkpoint** adds the optimizer (and scheduler) state, the epoch and the best score so training can resume exactly. Expect it to be about three times the size of the weights for Adam.',
    '`torch.load` unpickles, so only load files you trust, with `weights_only=True`; prefer **safetensors** for sharing. Read `Missing key`, `Unexpected key` and `size mismatch` errors as architecture mismatches; `strict=False` is for deliberate partial loading.',
    'For deployment **export to ONNX** with `torch.onnx.export` (model in `eval()` mode, named inputs and outputs, dynamic batch axis), run it with ONNX Runtime or a game engine’s runtime, and **verify parity** with the PyTorch model.',
    'Ship the **preprocessing, input and output spec, postprocessing and versions** with the model, plus a parity test: that is what actually makes it work outside your training script.',
  ],
  reading: [
    { title: 'PyTorch: Save and Load the Model', url: 'https://docs.pytorch.org/tutorials/beginner/basics/saveloadrun_tutorial.html', source: 'tutorial', note: 'Official tutorial on state dicts, saving whole models and loading weights.' },
    { title: 'PyTorch: Saving and Loading a General Checkpoint', url: 'https://docs.pytorch.org/tutorials/recipes/recipes/saving_and_loading_a_general_checkpoint.html', source: 'tutorial', note: 'The checkpoint dictionary pattern for resuming training.' },
    { title: 'PyTorch: Export a model to ONNX', url: 'https://docs.pytorch.org/docs/stable/onnx.html', source: 'docs', note: 'torch.onnx reference: export options, dynamic axes and supported operators.' },
    { title: 'ONNX Runtime documentation', url: 'https://onnxruntime.ai/docs/', source: 'docs', note: 'Running ONNX models from Python, C++, C# and mobile, plus performance tuning and quantization.' },
    { title: 'safetensors', url: 'https://huggingface.co/docs/safetensors/index', source: 'docs', note: 'A simple, safe format for storing tensors that cannot execute code.' },
  ],
};
