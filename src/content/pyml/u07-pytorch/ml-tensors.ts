import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-tensors',
  title: 'Tensors and the GPU',
  summary: 'PyTorch’s core data structure: NumPy-style n-dimensional arrays with a dtype, a device (CPU or GPU) and optional gradient tracking. Create, combine, reshape and move tensors, and avoid the shape, dtype and device errors that trip everyone up.',
  minutes: 22,
  objectives: [
    'Explain what a tensor is and how PyTorch differs from NumPy',
    'Create tensors and read their shape, dtype and device',
    'Use arithmetic, matrix multiplication, broadcasting, reductions and indexing on tensors',
    'Reshape tensors with view, reshape, permute, unsqueeze and flatten, and know when memory is shared',
    'Move tensors between CPU and GPU, and convert to and from NumPy safely',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'What is a tensor, and why PyTorch?',
      blocks: [
        {
          type: 'p',
          text: 'In machine learning, a **[[tensor]]** is simply an n-dimensional array of numbers: a scalar (0-D), a vector (1-D), a matrix (2-D), a stack of matrices such as a batch of images (4-D) and so on. **PyTorch** is a Python library whose `torch.Tensor` looks and behaves like a NumPy array but adds two superpowers you have already met in theory: it can live on a **[[gpu|GPU]]** (hundreds of times faster for the matrix maths of neural networks), and it can record the operations applied to it so that gradients come out automatically (**autograd**, the next lesson).',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'Where PyTorch came from',
          text: 'PyTorch grew out of Torch, a Lua machine-learning library, and was released by Facebook (now Meta) AI Research in 2016 as a Python-first, *define-by-run* framework: your ordinary Python code *is* the network, so you can debug it with `print` and a debugger. That convenience, and its adoption by researchers, made it the dominant deep-learning framework (the PyTorch Foundation, under the Linux Foundation, now governs it). TensorFlow, Google’s earlier framework, started with static graphs; JAX is a newer Google library with a functional style. PyTorch 2 added `torch.compile` to recover the speed of compiled graphs without giving up eager Python.',
        },
        {
          type: 'p',
          text: 'Install PyTorch from pytorch.org, which generates the right `pip install` command for your system (CPU-only, or a CUDA version for an NVIDIA GPU on Windows or Linux). The examples in this unit use PyTorch, which the in-app Python runner cannot load, so they are marked **Run on your PC**: copy them into a script or notebook on your computer. The outputs shown were produced by running exactly this code. Tensors are created much as in NumPy, and every tensor carries three facts you will check constantly: its **shape**, its **dtype** (the number type) and its **device**.',
        },
        {
          type: 'code',
          title: 'creating_tensors.py',
          desktopOnly: true,
          code: `import torch

a = torch.tensor([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])
b = torch.arange(6)
c = torch.zeros(2, 3)
d = torch.linspace(0, 1, 5)
print(a.shape, a.dtype, a.device)
print(b.dtype, c.dtype, d)
print(a.ndim, a.numel(), a.size(0))
print(torch.tensor([1, 2, 3]).dtype, torch.tensor([1.5, 2]).dtype, torch.tensor([1, 2], dtype=torch.float32).dtype)`,
          output: `torch.Size([2, 3]) torch.float32 cpu
torch.int64 torch.float32 tensor([0.0000, 0.2500, 0.5000, 0.7500, 1.0000])
2 6 2
torch.int64 torch.float32 torch.float32`,
          annotations: [
            { lines: 3, text: '`torch.tensor(...)` builds a tensor from nested Python lists. Floats give the default `float32` dtype (NumPy would use 64-bit).' },
            { lines: '4-6', text: 'The usual factory functions, as in NumPy: `arange` (integers `0 … 5`), `zeros`, and `linspace` (5 evenly spaced points). Also `ones`, `full`, `eye`, and `rand`/`randn` for random numbers.' },
            { lines: 7, text: 'The three facts: **shape** `[2, 3]`, **dtype** `float32`, and **device** `cpu`.' },
            { lines: 8, text: '`arange` of integers makes an `int64` tensor, while `zeros` is `float32`.' },
            { lines: 9, text: '`ndim` is the number of dimensions (2), `numel()` the total element count (6), and `size(0)` the length of dimension 0 (2).' },
            { lines: 10, text: 'dtype follows the inputs: all-integer lists give `int64`, any float makes the whole tensor `float32`, and `dtype=` overrides. Mixing up integer and float tensors is a very common source of errors.' },
          ],
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What are the two main things a PyTorch tensor can do that a NumPy array cannot?',
      options: [
        { text: 'Live on a GPU for fast parallel maths, and track operations so gradients can be computed automatically', correct: true, why: 'GPU placement and autograd are the two reasons deep-learning frameworks use their own tensor type instead of plain NumPy arrays.' },
        { text: 'Store text strings and Python objects', why: 'Tensors hold numbers only (floats, integers, booleans, complex). NumPy object arrays can hold Python objects; tensors cannot.' },
        { text: 'Grow in size automatically like a Python list', why: 'Tensors have a fixed shape, as NumPy arrays do; you create a new tensor to change the size.' },
        { text: 'Run without installing any library', why: 'PyTorch has to be installed separately; it is not part of the standard library.' },
      ],
      explanation: 'A tensor is an n-dimensional array of numbers, like NumPy, but it can be placed on a GPU and it can record its history for automatic differentiation.',
    },
    {
      kind: 'concept',
      title: 'Operations: arithmetic, matmul, broadcasting, reductions',
      blocks: [
        {
          type: 'p',
          text: 'If you have used NumPy (the earlier unit), almost everything transfers. Arithmetic is **elementwise**; `@` is matrix multiplication; shapes **broadcast** by the same rules; reductions such as `sum` and `mean` take a `dim` argument (NumPy’s `axis`); and indexing and slicing work the same way, including boolean masks.',
        },
        {
          type: 'code',
          title: 'tensor_ops.py',
          desktopOnly: true,
          code: `import torch

x = torch.tensor([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])
w = torch.tensor([[1.0], [0.0], [-1.0]])
print(x * 2 + 1)
print(x @ w)
print(x + torch.tensor([10.0, 20.0, 30.0]))
print(x.sum(), x.sum(dim=0), x.mean(dim=1), x.max(dim=1).values)
print(x[:, 1], x[1, -1].item(), x[x > 3])`,
          output: `tensor([[ 3.,  5.,  7.],
        [ 9., 11., 13.]])
tensor([[-2.],
        [-2.]])
tensor([[11., 22., 33.],
        [14., 25., 36.]])
tensor(21.) tensor([5., 7., 9.]) tensor([2., 5.]) tensor([3., 6.])
tensor([2., 5.]) 6.0 tensor([4., 5., 6.])`,
          annotations: [
            { lines: '3-4', text: '`x` has shape `(2, 3)` (two examples, three features) and `w` is a `(3, 1)` column of weights.' },
            { lines: 5, text: 'Elementwise arithmetic: every element is doubled and incremented. A plain number is broadcast across the whole tensor.' },
            { lines: 6, text: '`x @ w` is a matrix product, `(2, 3) @ (3, 1) = (2, 1)`: each row dotted with the weights, exactly the linear layer of the previous unit (`1·1 + 2·0 + 3·(−1) = −2`).' },
            { lines: 7, text: '**Broadcasting**: the length-3 vector is added to *each row* of the `(2, 3)` tensor, because trailing dimensions line up.' },
            { lines: 8, text: 'Reductions: `sum()` of everything is `tensor(21.)`; `sum(dim=0)` collapses the rows (a sum per column); `mean(dim=1)` collapses the columns (a mean per row); `max(dim=1)` returns a named tuple, and `.values` are the maxima (the other field is `.indices`).' },
            { lines: 9, text: 'Slicing and masks: the second column, the last element of the second row as a Python float via `.item()`, and a boolean mask `x > 3` that picks the elements greater than 3 (a 1-D result).' },
          ],
        },
        {
          type: 'table',
          headers: ['Operation', 'NumPy', 'PyTorch'],
          rows: [
            ['Create from data', '`np.array(...)`', '`torch.tensor(...)`'],
            ['Sum along a dimension', '`a.sum(axis=0)`', '`a.sum(dim=0)` (`keepdim=True` keeps the dimension)'],
            ['Matrix product', '`A @ B`, `np.matmul`', '`A @ B`, `torch.matmul`'],
            ['Concatenate / stack', '`np.concatenate`, `np.stack`', '`torch.cat`, `torch.stack`'],
            ['Random normal', '`rng.normal(size=...)`', '`torch.randn(...)`'],
            ['Reshape', '`a.reshape(...)`', '`a.reshape(...)`, `a.view(...)`'],
            ['Swap/reorder axes', '`a.transpose(...)`', '`a.permute(...)`, `a.transpose(i, j)`, `a.T` (2-D)'],
          ],
          caption: 'A short translation table. The names differ only slightly, so NumPy knowledge carries over almost directly.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Names ending in an underscore work in place',
          text: '`x.add_(1)`, `x.zero_()`, `x.clamp_(0, 1)`: a trailing underscore means *modify this tensor in place* instead of returning a new one. In-place operations save memory but can break autograd if you overwrite a value the backward pass needs, so prefer the normal versions unless you have a reason (optimizers use the in-place ones internally).',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'In PyTorch, `x.sum(dim=0)` on a tensor of shape `(2, 3)` returns a tensor of shape `(3,)`: it collapses the dimension you name.',
      answer: true,
      explanation: 'True. Reducing over `dim=0` removes that dimension (the 2 rows are summed together), leaving one value per column: shape `(3,)`. `dim=1` would give shape `(2,)`. Pass `keepdim=True` to keep the reduced dimension as size 1.',
    },
    {
      kind: 'concept',
      title: 'Shapes: reshape, view, permute, squeeze',
      blocks: [
        {
          type: 'p',
          text: 'Most of the day-to-day work with tensors is getting the shapes right. `reshape` and `view` reinterpret the same numbers with a new shape (one dimension can be `-1`, meaning "work it out"); `permute` reorders the dimensions; `unsqueeze` adds a length-1 dimension and `squeeze` removes it; `flatten` merges dimensions. Crucially, `view`, `permute` and slicing return **views**: new shapes over the *same memory*. Writing through one changes the other. Use `clone()` for an independent copy.',
        },
        {
          type: 'code',
          title: 'shapes_and_views.py',
          desktopOnly: true,
          code: `import torch

x = torch.arange(24)
imgs = x.reshape(2, 3, 4)
print(imgs.shape, imgs.view(2, -1).shape, imgs.permute(2, 0, 1).shape)
print(imgs.unsqueeze(0).shape, imgs.unsqueeze(0).squeeze(0).shape, imgs.flatten(1).shape)
v = x.view(4, 6)
v[0, 0] = 99
print(x[0].item(), v.is_contiguous(), v.t().is_contiguous())
copy = x.clone()
copy[0] = -1
print(x[0].item(), copy[0].item())`,
          output: `torch.Size([2, 3, 4]) torch.Size([2, 12]) torch.Size([4, 2, 3])
torch.Size([1, 2, 3, 4]) torch.Size([2, 3, 4]) torch.Size([2, 12])
99 True False
99 -1`,
          annotations: [
            { lines: '3-4', text: 'Twenty-four numbers arranged as shape `(2, 3, 4)`, like 2 images with 3 rows and 4 columns each.' },
            { lines: 5, text: '`view(2, -1)` keeps dimension 0 and merges the rest, so `-1` is inferred as 12. `permute(2, 0, 1)` reorders the dimensions: the old dimension 2 comes first, giving `(4, 2, 3)`.' },
            { lines: 6, text: '`unsqueeze(0)` adds a new leading dimension of length 1 (a "batch of one"), `squeeze(0)` removes it again, and `flatten(1)` merges everything from dimension 1 onward into one, `(2, 12)`. These are how you turn a single image into a batch and feed a conv output into a linear layer.' },
            { lines: '7-9', text: '`v` is a *view* of `x`: writing `99` through `v` changed `x[0]` too. A transposed view (`v.t()`) is no longer **contiguous** in memory, which matters because `view` requires contiguous memory (use `reshape`, which copies when needed, or call `.contiguous()`).' },
            { lines: '10-12', text: '`clone()` makes an independent copy: changing it leaves `x` alone (`99` vs `−1`).' },
          ],
        },
        {
          type: 'table',
          headers: ['Data', 'Shape convention', 'Meaning'],
          rows: [
            ['Tabular batch', '`(N, features)`', 'N examples with a feature vector each'],
            ['Image batch (PyTorch)', '`(N, C, H, W)`', 'N images, C channels, H rows, W columns (**channels first**)'],
            ['Image batch (NumPy, PIL, OpenCV, TensorFlow)', '`(N, H, W, C)`', 'Channels last: you must `permute(0, 3, 1, 2)` to feed PyTorch'],
            ['Sequence batch', '`(N, T, features)` or `(T, N, features)`', 'N sequences of T steps; check each layer’s `batch_first` setting'],
            ['Single example', 'add a leading 1', 'Models expect a batch dimension, so use `x.unsqueeze(0)`'],
          ],
          caption: 'Keep these conventions in mind; many shape errors are one of these confusions.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Print shapes while you build',
          text: 'When a model crashes with "mat1 and mat2 shapes cannot be multiplied" or "expected input to have 3 channels but got 224", the fix is to print `x.shape` after every layer until you see where it diverges from what you expected. Put the expected shape in a comment next to each line (`# (N, 64, 28, 28)`) as you write, and the bugs mostly disappear.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Add a batch dimension of size 1 at the front of a single image tensor so that a model can accept it.',
      template: `batch = image.___(0)`,
      templateIsCode: true,
      blanks: [{ answers: ['unsqueeze'] }],
      wordBank: ['unsqueeze', 'squeeze', 'flatten', 'permute'],
      explanation: '`image.unsqueeze(0)` inserts a new dimension of length 1 at position 0, turning `(C, H, W)` into `(1, C, H, W)`. `squeeze` does the opposite, removing length-1 dimensions.',
    },
    {
      kind: 'concept',
      title: 'Dtypes and NumPy interoperability',
      blocks: [
        {
          type: 'p',
          text: 'PyTorch is strict about number types. The default float is **`float32`** (NumPy’s is `float64`), integers are **`int64`**, and many operations refuse to mix them. The conversions you will use constantly: `torch.from_numpy(arr)` and `t.numpy()` share memory with no copy (so writing to one changes the other), `torch.tensor(arr)` copies, `t.item()` extracts a single Python number, and `t.tolist()` gives nested Python lists.',
        },
        {
          type: 'code',
          title: 'numpy_interop.py',
          desktopOnly: true,
          code: `import numpy as np
import torch

arr = np.array([1.0, 2.0, 3.0])
t = torch.from_numpy(arr)
t[0] = 100.0
print(arr, t.dtype)
back = t.numpy()
print(type(back).__name__, back is arr, np.shares_memory(back, arr))
print(torch.tensor(arr).numpy() is arr, t.tolist())`,
          output: `[100.   2.   3.] torch.float64
ndarray False True
False [100.0, 2.0, 3.0]`,
          annotations: [
            { lines: '4-7', text: '`from_numpy` wraps the NumPy array’s memory *without copying*: assigning `100.0` through the tensor changed the original array. The dtype came along too: `float64`, which is *not* the usual PyTorch default (a model with `float32` weights will reject it).' },
            { lines: '8-9', text: '`t.numpy()` also shares memory (`shares_memory` is `True`), though it returns a new array object (`back is arr` is `False`).' },
            { lines: 10, text: '`torch.tensor(arr)` makes a **copy**, so its `.numpy()` is not `arr`. `tolist()` produces ordinary Python lists, and `.item()` a single Python number.' },
          ],
        },
        {
          type: 'table',
          headers: ['dtype', 'Used for', 'Notes'],
          rows: [
            ['`torch.float32`', 'Weights, activations, inputs', 'The default float. Good balance of range and speed'],
            ['`torch.float16` / `torch.bfloat16`', 'Mixed-precision training and inference', 'Half the memory and much faster on modern GPUs; `bfloat16` keeps float32’s range'],
            ['`torch.float64`', 'Scientific code that needs precision', 'Rarely needed in deep learning; slower, and a common accidental NumPy leak'],
            ['`torch.int64` (`long`)', 'Class labels, indices, token IDs', '`CrossEntropyLoss` wants `int64` class indices, not floats'],
            ['`torch.bool`', 'Masks', 'Result of comparisons such as `x > 0`'],
          ],
          caption: 'Convert with `t.float()`, `t.long()`, `t.to(torch.float16)` or `torch.tensor(..., dtype=...)`.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The classic dtype errors',
          text: '"Expected scalar type Float but found Double": a NumPy `float64` array reached a `float32` model, so call `.float()`. "Expected scalar type Long": class labels must be `int64`, not float or `int32`. "mat1 and mat2 must have the same dtype": an integer tensor met a float layer. When in doubt, print `x.dtype`.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `import torch

x = torch.arange(12).reshape(3, 4)
print(tuple(x.shape), x.sum(dim=0).tolist(), x[1, 2].item())`,
      answer: '(3, 4) [12, 15, 18, 21] 6',
      hint: '`arange(12)` reshaped to 3 rows of 4: [0,1,2,3], [4,5,6,7], [8,9,10,11]. `sum(dim=0)` adds the rows together, column by column.',
      explanation: 'The shape is (3, 4). Summing over dim 0 adds the three rows: 0+4+8 = 12, 1+5+9 = 15, 2+6+10 = 18, 3+7+11 = 21. `x[1, 2]` is row 1, column 2, which is 6.',
    },
    {
      kind: 'error',
      prompt: 'This code feeds an input to a linear layer, but it crashes with a dtype error. Tap the faulty line.',
      lines: [
        'model = torch.nn.Linear(4, 2)',
        'x = torch.tensor([1, 2, 3, 4])',
        'out = model(x)',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'A list of Python ints creates an `int64` tensor, but the layer’s weights are `float32`: "mat1 and mat2 must have the same dtype". Create floats: `torch.tensor([1.0, 2.0, 3.0, 4.0])`, or add `.float()`. Always check `dtype` when a layer rejects an input.',
    },
    {
      kind: 'concept',
      title: 'The GPU: moving tensors between devices',
      blocks: [
        {
          type: 'p',
          text: 'A CPU has a handful of fast cores; a **GPU** has thousands of slower ones built for doing the same arithmetic on huge arrays at once, which is precisely what matrix multiplication is. For large networks that makes training 10 to 100 times faster. PyTorch runs on NVIDIA GPUs through **CUDA** (Windows and Linux), on Apple silicon through **MPS**, and on AMD GPUs through ROCm. A tensor lives on one **device**, and `.to(device)` moves it. The one rule is that **all tensors in an operation must be on the same device**, so the model and every batch of data must be moved together.',
        },
        {
          type: 'code',
          title: 'devices.py',
          desktopOnly: true,
          outputVaries: true,
          code: `import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
x = torch.randn(1000, 1000, device=device)
y = torch.randn(1000, 1000).to(device)
z = (x @ y).sum()
print(device, z.device, z.item() != 0)
print(torch.cuda.is_available(), torch.backends.mps.is_available())`,
          output: `cpu cpu True
False False`,
          annotations: [
            { lines: 3, text: 'The standard idiom: use the GPU if there is one, otherwise the CPU. The code then runs everywhere, and the choice lives in one variable. (On a Mac, also check `torch.backends.mps.is_available()` and use `"mps"`.)' },
            { lines: '4-5', text: 'Two ways to put data on the device: create it there directly (`device=device`, which avoids a CPU-to-GPU copy) or move an existing tensor with `.to(device)`.' },
            { lines: 6, text: 'A 1000 × 1000 matrix product executes on whichever device holds the tensors. Both operands must be on the same one, or PyTorch raises an error.' },
            { lines: 7, text: '`z.item()` brings one number back to the CPU as a Python float (it forces the GPU to finish first, so avoid calling it every iteration in a hot loop).' },
            { lines: 8, text: 'The sample output is from a machine **without** a supported GPU, so everything runs on the CPU. On an NVIDIA machine you would see `cuda cuda:0 True` and `True False`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why data movement is the thing to watch',
          text: 'A GPU has its own memory, and copying data between it and the computer’s main memory crosses a comparatively slow link. The arithmetic on the GPU is so fast that the copy often dominates. The rule of thumb: **move the model once, move each batch once, and keep everything else on the device**. Convert results to Python numbers (`.item()`, `.cpu()`) only when you really need to look at them, such as when logging the loss every few hundred steps.',
        },
        {
          type: 'table',
          headers: ['Mistake', 'Error message (roughly)', 'Fix'],
          rows: [
            ['Model on GPU, batch on CPU', '"Expected all tensors to be on the same device"', 'Move the batch: `x = x.to(device)`'],
            ['Calling `.numpy()` on a GPU tensor', '"can’t convert cuda:0 device type tensor to numpy"', '`t.cpu().numpy()` (and `.detach()` if it requires grad)'],
            ['GPU runs out of memory', '"CUDA out of memory"', 'Smaller batch size, smaller model, mixed precision, `torch.no_grad()` for inference'],
            ['Constantly moving small tensors', 'No error, just slow', 'Keep data on the device; move whole batches, not single numbers'],
          ],
          caption: 'The three or four device problems you will actually meet.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'What about phones and games?',
          text: 'Training a network on an Android phone is impractical; you train on a PC (or cloud GPU) and then **export** the model for inference on the device with a lightweight runtime (ONNX Runtime Mobile, ExecuTorch or TensorFlow Lite), which a later lesson covers. Game agents can run inference on the CPU of a player’s machine; small policies take microseconds. Training is the part that needs the big GPU.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'A batch of 32 RGB images of size 224 × 224 is a tensor of shape `(32, 3, 224, 224)`. How many elements does it contain?',
      answer: '4816896',
      hint: 'Multiply all four dimensions: 32 × 3 × 224 × 224.',
      explanation: '32 × 3 = 96, and 224 × 224 = 50,176, so 96 × 50,176 = 4,816,896 elements. In `float32` (4 bytes each) that is about 19 MB for just one batch of input: memory, not just speed, limits the batch size you can use.',
      label: 'Elements:',
    },
    {
      kind: 'code',
      prompt: 'Write `broadcast_shape(a, b)` taking two shape tuples and returning the shape their elementwise combination would have under NumPy/PyTorch broadcasting. Align the shapes from the right; two sizes are compatible if they are equal or one of them is 1. Raise `ValueError` if they are not compatible.',
      starter: `def broadcast_shape(a, b):
    ...
`,
      solution: `def broadcast_shape(a, b):
    result = []
    for i in range(1, max(len(a), len(b)) + 1):
        da = a[-i] if i <= len(a) else 1
        db = b[-i] if i <= len(b) else 1
        if da != db and da != 1 and db != 1:
            raise ValueError(f"shapes {a} and {b} are not broadcastable")
        result.append(da if db == 1 else db)
    return tuple(reversed(result))
`,
      tests: `assert broadcast_shape((2, 3), (3,)) == (2, 3)
assert broadcast_shape((2, 3), (2, 3)) == (2, 3)
assert broadcast_shape((5, 1), (1, 4)) == (5, 4)
assert broadcast_shape((8, 1, 6, 1), (7, 1, 5)) == (8, 7, 6, 5)
assert broadcast_shape((), (3, 2)) == (3, 2)
assert broadcast_shape((4,), ()) == (4,)
assert broadcast_shape((32, 3, 224, 224), (3, 1, 1)) == (32, 3, 224, 224)
assert broadcast_shape((1,), (1,)) == (1,)
assert broadcast_shape((0, 3), (1, 3)) == (0, 3)
assert isinstance(broadcast_shape((2,), (2,)), tuple)

for bad in [((2, 3), (4,)), ((3, 2), (3,)), ((2, 3), (2,))]:
    try:
        broadcast_shape(*bad)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError for " + str(bad))`,
      checks: ['Aligns the shapes from the right; sizes must be equal or one of them 1', 'Returns the combined shape as a tuple (missing leading dimensions count as 1)', 'Raises `ValueError` for incompatible shapes'],
      hint: 'Loop `i` from 1 up to the longer length, reading `a[-i]` and `b[-i]` (use 1 when a shape is too short). They are compatible if equal or one is 1; the result dimension is the one that is not 1. Reverse the collected sizes at the end.',
      explanation: 'These are exactly the rules NumPy and PyTorch use, and the source of most "shapes cannot be broadcast" errors. A subtle trap the rules produce: `(3, 2)` plus `(3,)` fails (the trailing 2 and 3 clash) although it looks reasonable, whereas `(2, 3)` plus `(3,)` works. The fix is usually `unsqueeze` to line the dimensions up.',
    },
    {
      kind: 'code',
      prompt: 'Write `infer_shape(numel, new_shape)` mimicking `tensor.view(...)`: `numel` is the total number of elements and `new_shape` a tuple in which **at most one** entry may be `-1` (to be inferred). Return the full shape as a tuple. Raise `ValueError` if the sizes cannot multiply to `numel`, or if there is more than one `-1`.',
      starter: `def infer_shape(numel, new_shape):
    ...
`,
      solution: `def infer_shape(numel, new_shape):
    unknown = [i for i, s in enumerate(new_shape) if s == -1]
    if len(unknown) > 1:
        raise ValueError("only one dimension can be inferred")
    known = 1
    for s in new_shape:
        if s != -1:
            known *= s
    if unknown:
        if known == 0 or numel % known != 0:
            raise ValueError(f"cannot reshape {numel} elements into {new_shape}")
        shape = list(new_shape)
        shape[unknown[0]] = numel // known
        return tuple(shape)
    if known != numel:
        raise ValueError(f"cannot reshape {numel} elements into {new_shape}")
    return tuple(new_shape)
`,
      tests: `assert infer_shape(24, (2, -1)) == (2, 12)
assert infer_shape(24, (-1, 4, 3)) == (2, 4, 3)
assert infer_shape(24, (4, 6)) == (4, 6)
assert infer_shape(12, (-1,)) == (12,)
assert infer_shape(6, (1, -1, 1)) == (1, 6, 1)
assert infer_shape(1, ()) == ()
assert infer_shape(32 * 3 * 7 * 7, (32, -1)) == (32, 147)
assert isinstance(infer_shape(8, (2, -1)), tuple)

for args in [(24, (5, -1)), (24, (-1, -1)), (24, (4, 5)), (10, (3, -1)), (7, (2, 2))]:
    try:
        infer_shape(*args)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError for " + str(args))`,
      checks: ['Replaces a single `-1` by `numel` divided by the product of the other sizes', 'Returns a tuple, and checks the product when there is no `-1`', 'Raises `ValueError` for two `-1`s, for sizes that do not divide `numel`, and for a wrong product'],
      hint: 'Multiply the known (non-`-1`) sizes together. If there is a `-1`, the missing size is `numel // known` (it must divide evenly); otherwise the known product must equal `numel`.',
      explanation: 'This is what `x.view(32, -1)` does to flatten everything except the batch dimension, the standard step between convolutional and linear layers. The `-1` is a convenience: PyTorch works out the size so you do not have to compute (and get wrong) the number of features.',
    },
    {
      kind: 'code',
      prompt: 'Image libraries (PIL, OpenCV, matplotlib) give `uint8` arrays of shape `(N, H, W, C)`, but PyTorch models expect `float32` of shape `(N, C, H, W)`, scaled to `[0, 1]` and normalized per channel. Write `to_model_input(images, mean, std)` with NumPy returning `((images / 255) - mean) / std` with the channels moved to axis 1, as `float32`. `mean` and `std` are sequences with one value per channel.',
      starter: `import numpy as np

def to_model_input(images, mean, std):
    ...
`,
      solution: `import numpy as np


def to_model_input(images, mean, std):
    x = np.asarray(images, dtype=np.float32) / 255.0
    mean = np.asarray(mean, dtype=np.float32).reshape(1, 1, 1, -1)
    std = np.asarray(std, dtype=np.float32).reshape(1, 1, 1, -1)
    x = (x - mean) / std
    return np.ascontiguousarray(x.transpose(0, 3, 1, 2), dtype=np.float32)
`,
      tests: `import numpy as np

imgs = np.zeros((2, 4, 5, 3), dtype=np.uint8)
imgs[0, 1, 2] = [255, 0, 51]
out = to_model_input(imgs, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
assert out.shape == (2, 3, 4, 5) and out.dtype == np.float32
assert np.allclose(out[0, :, 1, 2], [1.0, -1.0, (51 / 255 - 0.5) / 0.5])
assert np.allclose(out[1], -1.0)

one = np.full((1, 2, 2, 3), 255, dtype=np.uint8)
res = to_model_input(one, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
assert np.allclose(res[0, 0, 0, 0], (1 - 0.485) / 0.229, atol=1e-6)
assert np.allclose(res[0, 2, 1, 1], (1 - 0.406) / 0.225, atol=1e-6)
assert res.shape == (1, 3, 2, 2)

gray = np.full((3, 6, 6, 1), 128, dtype=np.uint8)
g = to_model_input(gray, [0.0], [1.0])
assert g.shape == (3, 1, 6, 6) and np.allclose(g, 128 / 255, atol=1e-6)

before = imgs.copy()
to_model_input(imgs, [0, 0, 0], [1, 1, 1])
assert np.array_equal(imgs, before) and imgs.dtype == np.uint8
assert to_model_input(imgs, [0, 0, 0], [1, 1, 1]).flags["C_CONTIGUOUS"]`,
      packages: ['numpy'],
      checks: ['Scales to `[0, 1]`, subtracts the per-channel mean and divides by the per-channel std', 'Returns `float32` with shape `(N, C, H, W)` (channels moved to axis 1)', 'Works for any number of channels and does not modify its input'],
      hint: 'Convert to `float32` and divide by 255. Reshape `mean` and `std` to `(1, 1, 1, C)` so they broadcast over the last axis, normalize, then `transpose(0, 3, 1, 2)`.',
      explanation: 'This is precisely what `torchvision.transforms.ToTensor()` followed by `Normalize(mean, std)` does (the numbers 0.485, 0.456, 0.406 and 0.229, 0.224, 0.225 are the ImageNet statistics that pretrained models expect). Getting the layout, scaling and dtype wrong is the most frequent reason a pretrained model gives garbage predictions.',
    },
  ],
  takeaways: [
    'A **tensor** is an n-dimensional array with a **shape**, a **dtype** and a **device**. PyTorch tensors mimic NumPy arrays, plus GPU placement and automatic gradient tracking.',
    'Arithmetic is elementwise, `@` is matrix multiplication, shapes **broadcast** from the right, and reductions take `dim` (`keepdim=True` keeps it). A trailing underscore (`add_`) operates in place.',
    '`reshape`/`view` (with a `-1` to infer), `permute`, `unsqueeze`/`squeeze` and `flatten` change shapes; `view`, `permute` and slices share memory with the original, so use `clone()` for a copy. PyTorch images are `(N, C, H, W)`, channels first.',
    'The default float is `float32` and the default integer `int64`; class labels need `int64`; `from_numpy` and `.numpy()` share memory. Dtype mismatches are among the most common errors, so check `x.dtype`.',
    'Pick a device once (`"cuda" if torch.cuda.is_available() else "cpu"`), move the model and every batch with `.to(device)`, and remember that all tensors in an operation must share a device. Train on a GPU; export the finished model for phones and games.',
  ],
  reading: [
    { title: 'PyTorch: Tensors tutorial', url: 'https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html', source: 'tutorial', note: 'Official introduction: creation, operations, indexing, NumPy bridge and devices.' },
    { title: 'PyTorch: Get Started (installation selector)', url: 'https://pytorch.org/get-started/locally/', source: 'docs', note: 'Generates the right install command for your OS, package manager and CUDA version.' },
    { title: 'PyTorch documentation: torch.Tensor', url: 'https://docs.pytorch.org/docs/stable/tensors.html', source: 'docs', note: 'The full reference: every tensor method, dtype and the in-place variants.' },
    { title: 'Dive into Deep Learning: Data Manipulation', url: 'https://d2l.ai/chapter_preliminaries/ndarray.html', source: 'book', note: 'Tensor basics with runnable PyTorch code; free online.' },
  ],
};
