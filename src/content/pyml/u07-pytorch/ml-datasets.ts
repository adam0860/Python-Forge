import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-datasets',
  title: 'Datasets and DataLoaders',
  summary: 'Feed data to a model the PyTorch way: write a Dataset, batch and shuffle with a DataLoader, split without leaking, pad variable-length examples, rebalance classes and augment images.',
  minutes: 22,
  objectives: [
    'Write a map-style `Dataset` with `__len__` and `__getitem__`',
    'Use a `DataLoader` for batching, shuffling and parallel loading, and predict how many batches it yields',
    'Split data into train, validation and test sets and avoid data leakage when normalizing',
    'Use `collate_fn` for variable-length examples and a weighted sampler for imbalanced classes',
    'Explain where transforms and data augmentation belong in the pipeline',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Dataset: how PyTorch sees your data',
      blocks: [
        {
          type: 'p',
          text: 'So far we fed the network tensors we had sliced by hand. Real projects have too much data for that: millions of images on disk, text files, game logs, replay buffers. PyTorch separates two jobs. A **`Dataset`** answers one question, "give me example number `i`". A **[[dataloader|`DataLoader`]]** wraps a dataset and handles everything about *batches*: grouping examples, shuffling every epoch, and loading in background worker processes.',
        },
        {
          type: 'p',
          text: 'The simplest kind is a **map-style dataset**: any class with two methods. `__len__` returns the number of examples, and `__getitem__(i)` returns example `i`, usually a `(features, label)` pair of tensors. Because it is just Python, the data can come from anywhere: a NumPy array, a CSV file, a folder of images read from disk on demand, or even a function (like the squares below). For simple in-memory tensors, `TensorDataset(X, y)` does all of this for you.',
        },
        {
          type: 'code',
          title: 'squares_dataset.py',
          desktopOnly: true,
          code: `import torch
from torch.utils.data import Dataset, DataLoader

class SquaresDataset(Dataset):
    def __init__(self, n):
        self.n = n
    def __len__(self):
        return self.n
    def __getitem__(self, i):
        x = torch.tensor([float(i)])
        return x, x ** 2

ds = SquaresDataset(10)
print(len(ds), ds[3])
loader = DataLoader(ds, batch_size=4, shuffle=False)
for xb, yb in loader:
    print(xb.shape, yb.flatten().tolist())`,
          output: `10 (tensor([3.]), tensor([9.]))
torch.Size([4, 1]) [0.0, 1.0, 4.0, 9.0]
torch.Size([4, 1]) [16.0, 25.0, 36.0, 49.0]
torch.Size([2, 1]) [64.0, 81.0]`,
          annotations: [
            { lines: '4-6', text: 'A dataset class: store whatever describes the data (here only its size; in practice a file list or an array). Inherit from `Dataset`.' },
            { lines: '7-8', text: '`__len__` tells the DataLoader how many examples there are, so it knows when an epoch ends.' },
            { lines: '9-11', text: '`__getitem__(i)` builds example `i` *on demand*: here `x = i` and the target is `x²`. A real dataset would open image `i` or look up row `i`, which is why datasets can be larger than memory.' },
            { lines: '13-14', text: 'You can index a dataset like a list, and `len()` works because of the two methods.' },
            { lines: '15-17', text: 'The loader stacks examples into batches: 4, 4, and a final batch of 2 (10 examples do not divide evenly). Each batch tensor gets a new leading **batch dimension**, so `xb` has shape `(4, 1)`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'analogy',
          title: 'Dataset is the library, DataLoader is the librarian',
          text: 'The dataset knows how to fetch one book by its number. The DataLoader is the librarian who, on request, brings a **trolley of 32 books** (a batch), picks them in a fresh random order each day (shuffling), and has several assistants fetch them in parallel (workers). Your training loop only ever asks for the next trolley.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which two methods must a map-style PyTorch `Dataset` implement?',
      options: [
        { text: '`__len__` and `__getitem__`', correct: true, why: 'The size lets the DataLoader plan an epoch; indexing returns one example, which the DataLoader then groups into batches.' },
        { text: '`__iter__` and `__next__`', why: 'Those define an iterator, which is the other, iterable-style kind of dataset (`IterableDataset`) used for streams. A map-style dataset is indexed instead.' },
        { text: '`forward` and `backward`', why: 'Those belong to a model (`nn.Module`) and to autograd; a dataset has no learnable parameters.' },
        { text: '`load` and `save`', why: 'There are no such required methods. Loading logic goes inside `__getitem__` (or `__init__`), saving is unrelated.' },
      ],
      explanation: 'A map-style dataset needs `__len__` (how many examples) and `__getitem__(i)` (example `i`).',
    },
    {
      kind: 'concept',
      title: 'DataLoader options and honest splits',
      blocks: [
        {
          type: 'p',
          text: 'A DataLoader takes a handful of options that matter in practice. **`batch_size`** is the number of examples per batch. **`shuffle=True`** reshuffles at the start of every epoch for the training loader (never needed for evaluation). **`drop_last=True`** discards a final short batch, which keeps every batch the same size (useful for batch norm and for steady loss curves). **`num_workers=N`** loads batches in `N` background processes so the GPU is not waiting on the disk or on slow augmentation, and **`pin_memory=True`** speeds up the copy to a CUDA GPU. Use `num_workers=0` while debugging, because errors inside workers are harder to read.',
        },
        {
          type: 'table',
          headers: ['Option', 'Typical value', 'What it does'],
          rows: [
            ['`batch_size`', '16 to 256', 'Examples per update; bigger batches are smoother and faster per example but need more memory'],
            ['`shuffle`', '`True` for training, `False` for validation and test', 'New random order every epoch, which avoids ordering effects'],
            ['`drop_last`', '`True` for training when batch size must be constant', 'Drops an incomplete final batch'],
            ['`num_workers`', '0 while debugging, then 2 to 8', 'Parallel background loading and preprocessing'],
            ['`collate_fn`', 'default, or your own function', 'How a list of examples becomes one batch (needed for variable-length data)'],
            ['`sampler`', 'default, or e.g. `WeightedRandomSampler`', 'Which examples are drawn, and how often'],
          ],
          caption: 'The DataLoader knobs you will actually turn.',
        },
        {
          type: 'p',
          text: 'The next job is splitting your data. You need a **training set** to fit the weights, a **validation set** to choose hyperparameters and decide when to stop, and a **test set** you touch only once at the very end (the evaluation lesson explained why). `torch.utils.data.random_split` makes such splits from any dataset, taking lengths and an optional seeded `Generator` for repeatability.',
        },
        {
          type: 'code',
          title: 'split_and_batch.py',
          desktopOnly: true,
          code: `import torch
from torch.utils.data import TensorDataset, DataLoader, random_split

X = torch.arange(20, dtype=torch.float32).reshape(10, 2)
y = torch.arange(10)
ds = TensorDataset(X, y)
gen = torch.Generator().manual_seed(0)
train, val = random_split(ds, [8, 2], generator=gen)
print(len(train), len(val))
print(sorted(train.indices + val.indices) == list(range(10)))
loader = DataLoader(train, batch_size=3, shuffle=True, drop_last=True, generator=gen)
print(len(loader))
for xb, yb in loader:
    print(tuple(xb.shape), tuple(yb.shape))`,
          output: `8 2
True
2
(3, 2) (3,)
(3, 2) (3,)`,
          annotations: [
            { lines: '4-6', text: '`TensorDataset` pairs the rows of `X` (10 examples, 2 features) with the matching labels in `y`.' },
            { lines: '7-8', text: 'Split into 8 training and 2 validation examples. A seeded `Generator` makes the split reproducible; `random_split` returns `Subset` views, not copies.' },
            { lines: '9-10', text: 'Check the split is a clean **partition**: the two index lists together cover every example exactly once, with no overlap.' },
            { lines: '11-12', text: 'Batches of 3 with `drop_last=True`: 8 examples give 2 full batches (the leftover 2 are dropped), so `len(loader)` is 2.' },
            { lines: '13-14', text: 'Each batch has features of shape `(3, 2)` and labels of shape `(3,)`: the batch dimension comes first.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Data leakage: the silent cheat',
          text: 'Any information from the validation or test examples that reaches training makes your scores too good and your real-world results worse. The most common leak is **preprocessing**: if you standardize with the mean and standard deviation of the *whole* dataset, the training data has "seen" the test set’s statistics. Always **split first**, compute normalization statistics on the training set only, then apply those same numbers to validation and test data. The same rule applies to feature selection, vocabulary building and duplicate removal: duplicates that land on both sides of the split (or consecutive frames of the same game) are leaks too, so split by episode or by user, not by row.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Normalization statistics (the mean and standard deviation) should be computed on the training set only, and then applied unchanged to the validation and test sets.',
      answer: true,
      explanation: 'True. The test set must stand in for data the model has never seen. Computing statistics on it, even just a mean, lets information leak backwards into training. At deployment you will only ever have the training statistics anyway.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the two methods that make this class a map-style dataset.',
      template: `class Points(Dataset):
    def ___(self):
        return len(self.data)
    def ___(self, i):
        return self.data[i]`,
      templateIsCode: true,
      blanks: [{ answers: ['__len__'] }, { answers: ['__getitem__'] }],
      wordBank: ['__len__', '__getitem__', '__iter__', '__call__'],
      explanation: '`__len__` returns the number of examples and `__getitem__(i)` returns example `i`. `__iter__` belongs to iterable-style datasets, and `__call__` makes an object callable.',
    },
    {
      kind: 'concept',
      title: 'Variable-length data and unbalanced classes',
      blocks: [
        {
          type: 'p',
          text: 'The default batching simply stacks tensors, which only works when every example has the same shape. Sentences, action sequences and game replays have different lengths. The fix is a **`collate_fn`**: a function that receives a *list of examples* and returns one batch. The standard recipe is to **pad** the short sequences with a filler value up to the longest in the batch, and also return the true lengths (or a mask) so the model can ignore the padding.',
        },
        {
          type: 'code',
          title: 'padding_collate.py',
          desktopOnly: true,
          code: `import torch
from torch.nn.utils.rnn import pad_sequence
from torch.utils.data import DataLoader

data = [([1, 2, 3], 1), ([4, 5], 0), ([6], 1), ([7, 8, 9, 10], 0)]

def collate(batch):
    seqs = [torch.tensor(s) for s, _ in batch]
    labels = torch.tensor([l for _, l in batch])
    lengths = torch.tensor([len(s) for s in seqs])
    return pad_sequence(seqs, batch_first=True, padding_value=0), lengths, labels

loader = DataLoader(data, batch_size=2, collate_fn=collate)
for padded, lengths, labels in loader:
    print(padded.tolist(), lengths.tolist(), labels.tolist())`,
          output: `[[1, 2, 3], [4, 5, 0]] [3, 2] [1, 0]
[[6, 0, 0, 0], [7, 8, 9, 10]] [1, 4] [1, 0]`,
          annotations: [
            { lines: 5, text: 'Four examples, each a `(sequence, label)` pair with a different sequence length. A plain list works as a dataset because it has `len()` and indexing.' },
            { lines: '7-11', text: 'The collate function receives the list of examples chosen for one batch. It makes tensors, records each true length, and **pads** the sequences with zeros to the longest one using `pad_sequence`.' },
            { lines: 13, text: 'Hand the function to the loader with `collate_fn`.' },
            { lines: '14-15', text: 'Batch one is padded to length 3, batch two to length 4. The `lengths` tensor tells the model where the real data ends, so zeros are not mistaken for content.' },
          ],
        },
        {
          type: 'p',
          text: 'Another common problem is **[[class-imbalance|class imbalance]]**. If 90% of the examples are one class, the model can reach 90% accuracy by always predicting it. Besides class weights in the loss (the evaluation lesson) you can change *what the loader draws*: a `WeightedRandomSampler` gives every example a weight, here the inverse of its class frequency, and samples with replacement so that each epoch sees the classes in roughly equal numbers.',
        },
        {
          type: 'code',
          title: 'balanced_sampler.py',
          desktopOnly: true,
          outputVaries: true,
          code: `import torch
from torch.utils.data import WeightedRandomSampler, DataLoader, TensorDataset

labels = torch.tensor([0] * 90 + [1] * 10)
class_w = 1.0 / torch.bincount(labels).float()
sample_w = class_w[labels]
torch.manual_seed(0)
sampler = WeightedRandomSampler(sample_w, num_samples=len(labels), replacement=True)
ds = TensorDataset(torch.arange(100).float().unsqueeze(1), labels)
loader = DataLoader(ds, batch_size=100, sampler=sampler)
xb, yb = next(iter(loader))
print(round(yb.float().mean().item(), 1))`,
          output: `0.5`,
          annotations: [
            { lines: '4-6', text: 'A 90/10 dataset. `bincount` counts the classes (90 and 10); each example’s weight is the inverse of its class count, so every rare example is 9 times as likely to be drawn.' },
            { lines: '7-8', text: 'Seed, then build a sampler that draws 100 examples **with replacement** using those weights.' },
            { lines: '9-10', text: 'Give the sampler to the loader (do not also set `shuffle=True`; the sampler already decides the order).' },
            { lines: '11-12', text: 'The batch now contains about half class 1 (the printed fraction is near 0.5), although class 1 is only 10% of the data. Rare examples are repeated, which is why this can overfit them; use it with augmentation or compare with loss weights. (The exact value varies slightly with the version.)' },
          ],
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output (a DataLoader over the integers 0 to 9 that drops the last incomplete batch).',
      code: `from torch.utils.data import DataLoader

loader = DataLoader(list(range(10)), batch_size=4, drop_last=True)
print(len(loader), [b.tolist() for b in loader])`,
      answer: '2 [[0, 1, 2, 3], [4, 5, 6, 7]]',
      hint: '10 examples in batches of 4 make two full batches and a leftover of 2, which `drop_last` removes. Without `shuffle` the order is preserved.',
      explanation: 'Two full batches of four remain and the leftover `[8, 9]` is dropped, so `len(loader)` is 2. The default collate function turns the integers of each batch into a tensor, which `.tolist()` converts back for printing.',
    },
    {
      kind: 'error',
      prompt: 'This preprocessing leaks information from the test set into training. Tap the faulty line.',
      lines: [
        'X_train, X_test = X[:800], X[800:]',
        'mean, std = X.mean(0), X.std(0)',
        'X_train = (X_train - mean) / std',
        'X_test = (X_test - mean) / std',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'Line 2 computes the mean and standard deviation from `X`, which includes the test rows, so the training data is scaled with statistics the model should never have seen. It should be `X_train.mean(0), X_train.std(0)`. Lines 3 and 4 are right to reuse the *same* numbers for both sets.',
    },
    {
      kind: 'numeric',
      prompt: 'A dataset has 1,050 examples. You keep 80% for training and use `DataLoader(train, batch_size=64)` with the default `drop_last=False`. How many batches does one epoch have?',
      answer: '14',
      hint: 'Training size = 0.8 × 1050 = 840. Divide by 64 and round **up**, since the last batch is smaller but still used.',
      explanation: '840 / 64 = 13.125, so 13 full batches plus one partial batch of 8 examples: 14 batches (and 14 optimizer steps) per epoch.',
      label: 'Batches:',
    },
    {
      kind: 'concept',
      title: 'Transforms, augmentation and the whole pipeline',
      blocks: [
        {
          type: 'p',
          text: 'Preprocessing belongs in the dataset, applied inside `__getitem__`, so it runs lazily and, with `num_workers`, in parallel. There are two kinds. **Deterministic transforms** such as resizing, converting to a tensor and normalizing must be applied identically to training, validation and test data. **[[data-augmentation|Data augmentation]]** applies *random* changes (flips, crops, small rotations and colour jitter for images; noise, time shifts or mirrored game levels for other data) to make one example look like many. Augment **training data only**: evaluation must use the clean, untouched inputs, otherwise your scores become random.',
        },
        {
          type: 'code',
          title: 'standardize_train_only.py',
          desktopOnly: true,
          code: `import torch

train = torch.tensor([[1.0, 100.0], [2.0, 200.0], [3.0, 300.0]])
test = torch.tensor([[4.0, 400.0]])
mean, std = train.mean(dim=0), train.std(dim=0)
print(((train - mean) / std).tolist())
print(((test - mean) / std).tolist())`,
          output: `[[-1.0, -1.0], [0.0, 0.0], [1.0, 1.0]]
[[2.0, 2.0]]`,
          annotations: [
            { lines: '3-4', text: 'A tiny training set of three examples with two features on very different scales (1 to 3 and 100 to 300), and one test example.' },
            { lines: 5, text: 'Compute the mean `[2, 200]` and standard deviation `[1, 100]` from the **training data only**.' },
            { lines: 6, text: 'Standardizing the training set puts both features on the same scale: `-1, 0, 1` in each column.' },
            { lines: 7, text: 'The test example is scaled with the **training** numbers, not its own, giving `2.0` in both columns: two training standard deviations above the mean.' },
          ],
        },
        {
          type: 'table',
          headers: ['Stage', 'Training data', 'Validation and test data'],
          rows: [
            ['Split', 'Done first, with a fixed seed (and by episode or user where needed)', 'Never mixed back into training'],
            ['Normalization', 'Fit the statistics here', 'Apply the training statistics'],
            ['Augmentation', 'Yes, random each time it is loaded', 'No'],
            ['Shuffling', '`shuffle=True`', '`shuffle=False`'],
            ['Final check', 'Look at a few real batches: shapes, ranges, labels', 'Same: print a batch before training'],
          ],
          caption: 'The checklist for a trustworthy data pipeline.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Look at a batch before you train',
          text: 'Print `xb.shape`, `xb.min()`, `xb.max()` and the label counts of one batch (or plot a few images). A surprising share of "my model will not learn" bugs are visible in the very first batch: unscaled pixel values in 0 to 255, labels off by one, or images and labels shuffled independently. Now rebuild the batching, splitting and padding machinery yourself.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write the generator `batches(data, batch_size, shuffle=False, seed=0, drop_last=False)` that mimics a DataLoader: it yields successive lists of `batch_size` items from `data`. If `shuffle` is true, first shuffle the *order* with `random.Random(seed)` (do not modify `data`). If `drop_last` is true, skip a final incomplete batch. Raise `ValueError` if `batch_size < 1`.',
      starter: `import random

def batches(data, batch_size, shuffle=False, seed=0, drop_last=False):
    ...
`,
      solution: `import random


def batches(data, batch_size, shuffle=False, seed=0, drop_last=False):
    if batch_size < 1:
        raise ValueError("batch_size must be at least 1")
    order = list(range(len(data)))
    if shuffle:
        random.Random(seed).shuffle(order)
    for start in range(0, len(order), batch_size):
        idx = order[start:start + batch_size]
        if drop_last and len(idx) < batch_size:
            return
        yield [data[i] for i in idx]
`,
      tests: `data = list(range(10))
assert list(batches(data, 4)) == [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]]
assert list(batches(data, 4, drop_last=True)) == [[0, 1, 2, 3], [4, 5, 6, 7]]
assert list(batches(data, 5, drop_last=True)) == [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]]
assert list(batches([], 3)) == []
assert list(batches(data, 100)) == [data]

shuffled = list(batches(data, 3, shuffle=True, seed=7))
flat = [x for b in shuffled for x in b]
assert sorted(flat) == data and flat != data
assert [len(b) for b in shuffled] == [3, 3, 3, 1]
assert list(batches(data, 3, shuffle=True, seed=7)) == shuffled
assert list(batches(data, 3, shuffle=True, seed=8)) != shuffled
assert data == list(range(10))

words = ["a", "b", "c"]
assert list(batches(words, 2)) == [["a", "b"], ["c"]]
for bad in (0, -2):
    try:
        list(batches(data, bad))
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      checks: ['Yields consecutive batches of `batch_size`, with a shorter final batch unless `drop_last` is set', 'With `shuffle=True` the order is a seeded permutation (reproducible, nothing lost or duplicated) and `data` is not modified', 'Raises `ValueError` for a batch size below 1; works for empty data'],
      hint: 'Make a list of indices `order = list(range(len(data)))`, shuffle that list with `random.Random(seed).shuffle(order)` when asked, then slice it `batch_size` at a time and `yield [data[i] for i in idx]`.',
      explanation: 'This is, in miniature, what `DataLoader(dataset, batch_size, shuffle, drop_last)` does: shuffle a list of **indices** (never the data itself), cut it into batches, and fetch the examples by index. The real thing adds collation into tensors and parallel workers.',
    },
    {
      kind: 'code',
      prompt: 'Write `split_indices(n, fractions, seed)` that shuffles the indices `0 … n-1` with `random.Random(seed)` and cuts them into consecutive groups, one per fraction. Each group except the last has `int(n * fraction)` indices; the **last group takes everything that remains**. Return a list of lists. Raise `ValueError` if the fractions do not add up to 1 (within `1e-9`) or if any is negative.',
      starter: `import random

def split_indices(n, fractions, seed):
    ...
`,
      solution: `import random


def split_indices(n, fractions, seed):
    if any(f < 0 for f in fractions) or abs(sum(fractions) - 1.0) > 1e-9:
        raise ValueError("fractions must be non-negative and sum to 1")
    order = list(range(n))
    random.Random(seed).shuffle(order)
    groups = []
    start = 0
    for f in fractions[:-1]:
        size = int(n * f)
        groups.append(order[start:start + size])
        start += size
    groups.append(order[start:])
    return groups
`,
      tests: `tr, va, te = split_indices(100, (0.7, 0.15, 0.15), seed=0)
assert (len(tr), len(va), len(te)) == (70, 15, 15)
assert sorted(tr + va + te) == list(range(100))
assert not (set(tr) & set(va)) and not (set(tr) & set(te)) and not (set(va) & set(te))
assert tr != sorted(tr)

a, b = split_indices(10, (0.8, 0.2), seed=3)
assert (len(a), len(b)) == (8, 2) and sorted(a + b) == list(range(10))
assert split_indices(10, (0.8, 0.2), seed=3) == [a, b]
assert split_indices(10, (0.8, 0.2), seed=4) != [a, b]

x, y = split_indices(7, (0.7, 0.3), seed=1)
assert (len(x), len(y)) == (4, 3)
assert split_indices(5, (1.0,), seed=0)[0] != [] and len(split_indices(5, (1.0,), seed=0)[0]) == 5
assert split_indices(0, (0.5, 0.5), seed=0) == [[], []]

for bad in [(0.5, 0.4), (0.6, 0.6), (1.5, -0.5)]:
    try:
        split_indices(10, bad, 0)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      checks: ['Shuffles the indices with `random.Random(seed)` and cuts consecutive groups of `int(n * fraction)`', 'The last group takes the remainder, so every index appears in exactly one group (a clean partition)', 'Deterministic for a given seed; `ValueError` for fractions that are negative or do not sum to 1'],
      hint: 'Check the fractions first, then `order = list(range(n))` and shuffle it. Loop over `fractions[:-1]`, slicing `order[start:start + int(n * f)]`, and finally append `order[start:]`.',
      explanation: 'Letting the last group take the remainder guarantees nothing is lost to rounding, which is exactly how `random_split` behaves with fractions. Shuffling indices (not data) keeps the split cheap and reproducible. Remember to split *before* you normalize or augment.',
    },
    {
      kind: 'code',
      prompt: 'Write `pad_batch(seqs, pad=0)`, the heart of a padding `collate_fn`. Given a list of lists, return `(padded, lengths)`: `padded` is a new list of lists, each right-padded with `pad` to the length of the longest sequence, and `lengths` is the list of the original lengths. For an empty input return `([], [])`. Do not modify the input.',
      starter: `def pad_batch(seqs, pad=0):
    ...
`,
      solution: `def pad_batch(seqs, pad=0):
    lengths = [len(s) for s in seqs]
    longest = max(lengths, default=0)
    padded = [list(s) + [pad] * (longest - len(s)) for s in seqs]
    return padded, lengths
`,
      tests: `padded, lengths = pad_batch([[1, 2, 3], [4, 5], [6]])
assert padded == [[1, 2, 3], [4, 5, 0], [6, 0, 0]]
assert lengths == [3, 2, 1]
assert pad_batch([[7, 8, 9, 10], [1]]) == ([[7, 8, 9, 10], [1, 0, 0, 0]], [4, 1])
assert pad_batch([["a"], ["b", "c"]], pad="<pad>") == ([["a", "<pad>"], ["b", "c"]], [1, 2])
assert pad_batch([]) == ([], [])
assert pad_batch([[], [1]]) == ([[0], [1]], [0, 1])

orig = [[1], [2, 3]]
out, _ = pad_batch(orig)
assert orig == [[1], [2, 3]]
assert all(len(row) == 2 for row in out)
out[0].append(99)
assert orig[0] == [1]`,
      checks: ['Pads every sequence on the right to the length of the longest, using the `pad` value', 'Returns the original lengths so a model can mask the padding', 'Handles an empty batch, empty sequences and does not modify the input lists'],
      hint: 'Compute `lengths = [len(s) for s in seqs]` and `longest = max(lengths, default=0)`. Each padded row is `list(s) + [pad] * (longest - len(s))`.',
      explanation: 'PyTorch’s `pad_sequence` does the same for tensors. Returning the lengths (or a boolean mask) is essential: without it a recurrent network or transformer would treat the padding as real input. Padding to the longest in each *batch* (not the whole dataset) wastes far less computation.',
    },
  ],
  takeaways: [
    'A **`Dataset`** returns one example by index (`__len__`, `__getitem__`); a **`DataLoader`** turns it into shuffled mini-batches, optionally with parallel `num_workers`. `TensorDataset` covers in-memory tensors.',
    'Shuffle the training loader, not the evaluation loaders. `len(loader)` is `ceil(n / batch_size)` unless `drop_last=True` (then `floor`).',
    '**Split first** (train / validation / test, seeded, by episode or user when examples are correlated), then fit normalization on the training set only. Anything else is **data leakage**.',
    'Use a **`collate_fn`** to pad variable-length examples (and return lengths or a mask), and a **`WeightedRandomSampler`** (or loss weights) for imbalanced classes.',
    '**Augmentation** is random and training-only; deterministic preprocessing is applied identically everywhere. Always inspect a real batch before training.',
  ],
  reading: [
    { title: 'PyTorch: Datasets & DataLoaders', url: 'https://docs.pytorch.org/tutorials/beginner/basics/data_tutorial.html', source: 'tutorial', note: 'Official tutorial on built-in and custom datasets and loaders.' },
    { title: 'PyTorch: Writing Custom Datasets, DataLoaders and Transforms', url: 'https://docs.pytorch.org/tutorials/beginner/data_loading_tutorial.html', source: 'tutorial', note: 'A worked example of a custom Dataset with transforms.' },
    { title: 'PyTorch documentation: torch.utils.data', url: 'https://docs.pytorch.org/docs/stable/data.html', source: 'docs', note: 'Reference for DataLoader options, samplers, collate_fn, random_split and IterableDataset.' },
    { title: 'scikit-learn: Common pitfalls (data leakage)', url: 'https://scikit-learn.org/stable/common_pitfalls.html', source: 'docs', note: 'Clear examples of preprocessing leakage and how pipelines prevent it.' },
  ],
};
