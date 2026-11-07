import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-transfer-learning',
  title: 'Transfer Learning and Pretrained Models',
  summary: 'Start from a model that already knows something. Learn feature extraction versus fine-tuning, freezing layers and per-layer learning rates, partial weight loading, and how to adapt pretrained image and language models to your own game data.',
  minutes: 24,
  objectives: [
    'Explain why features learned on one task help on another, and when they do not',
    'Choose between feature extraction, fine-tuning and training from scratch from the size and similarity of your data',
    'Freeze parameters, replace a model’s head and load pretrained weights partially in PyTorch',
    'Use smaller learning rates for pretrained layers and keep preprocessing consistent with the pretrained model',
    'Outline how to adapt a pretrained vision model (torchvision) and a language model (Hugging Face) to a new task',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Why starting from a pretrained model works',
      blocks: [
        {
          type: 'p',
          text: 'Training a modern network from scratch needs enormous data and compute: ImageNet has 1.2 million labelled images, and a large language model reads trillions of words. You almost never have that. But you do not have to start from zero. **Transfer learning** takes a model already trained on a large *source* task and adapts it to your small *target* task. It works because the early and middle layers of a network learn **general** features (edges, textures and shapes for images; grammar and word meanings for text) that are useful far beyond the task they were trained on. Only the last layers are specific to the original labels.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why features transfer',
          text: 'Recall what a CNN’s layers learn: edges, then textures, then parts, then whole objects. An edge detector trained on photographs of dogs works just as well on photographs of game items, and parts such as wheels, eyes or text strokes recur in countless categories. Language models likewise learn spelling, syntax and common-sense facts while predicting the next word, all useful for classifying game reviews. Your target problem needs only a *small adjustment on top of* these general features, which is why a few hundred labelled examples can be enough where training from scratch would need millions.',
        },
        {
          type: 'table',
          headers: ['Strategy', 'What you train', 'Use when', 'Cost'],
          rows: [
            ['**Feature extraction** (frozen backbone)', 'Only a new output layer (the head) on top of fixed features', 'Little data (tens to hundreds of examples), or target similar to the source', 'Very cheap; you can even cache the features once'],
            ['**Fine-tuning**', 'The head first, then *all* layers with a small learning rate', 'A moderate amount of data (hundreds to thousands) or a target that differs somewhat', 'Moderate; risk of forgetting if the rate is too high'],
            ['**Train from scratch**', 'Everything, from random weights', 'A lot of data, or a domain very unlike any pretrained model (spectrograms, unusual sensors, your own game’s state vector)', 'Highest'],
            ['**Parameter-efficient tuning (LoRA)**', 'Small added matrices while the big model stays frozen', 'Adapting very large language models on modest hardware', 'Small; the standard way to adapt big LLMs'],
          ],
          caption: 'Which transfer strategy to choose. When in doubt, start with feature extraction (a strong baseline in minutes) and only then try fine-tuning.',
        },
        {
          type: 'p',
          text: 'Where do pretrained models come from? **torchvision** ships ResNets, EfficientNets and vision transformers trained on ImageNet; the **Hugging Face Hub** hosts hundreds of thousands of pretrained language, vision and audio models, among them BERT, Llama and CLIP; reinforcement-learning libraries offer pretrained agents; and you can pretrain your own model on a large pile of unlabelled game logs and adapt it to several small tasks. In every case the recipe is the same: **load the weights, replace the head, decide what to freeze, train gently**.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You have 300 labelled screenshots from your game (6 kinds of items) and want a classifier. Which approach is the best first attempt?',
      options: [
        { text: 'Take an ImageNet-pretrained CNN, replace its final layer with a 6-way head and train just that head (feature extraction), then try fine-tuning', correct: true, why: 'With so few examples the general pretrained features carry almost all the knowledge. Training only a small head is fast, cheap and hard to overfit; fine-tuning can then add a little more.' },
        { text: 'Train a large CNN from scratch on the 300 images', why: 'A big network will memorize 300 images and generalize poorly; learning good low-level features from scratch needs far more data.' },
        { text: 'Use a pretrained model but retrain all of its layers at the normal learning rate of 0.1', why: 'A large learning rate quickly destroys the useful pretrained features (catastrophic forgetting). Fine-tuning needs a small rate, often 10 to 100 times lower for the backbone.' },
        { text: 'Collect 10 million more screenshots before trying anything', why: 'Unnecessary and expensive: transfer learning exists precisely so that small datasets can work.' },
      ],
      explanation: 'With little data, reuse general pretrained features: train a new head first (feature extraction), and consider gentle fine-tuning afterwards.',
    },
    {
      kind: 'concept',
      title: 'Mechanics: heads, freezing and partial loading',
      blocks: [
        {
          type: 'p',
          text: 'Three PyTorch operations make up almost all of transfer learning. **Replace the head**: the pretrained network ends in a layer for the *source* classes (for example 1,000 ImageNet categories); swap it for a new `nn.Linear` with *your* number of outputs, which starts with fresh random weights. **Freeze**: set `p.requires_grad = False` on the parameters you want to keep fixed, so autograd skips them, and give the optimizer only the trainable ones. **Load partially**: `load_state_dict(..., strict=False)` copies every weight whose name and shape match, and reports the rest as `missing_keys`. The demonstration below uses tiny networks so you can check each step with numbers.',
        },
        {
          type: 'code',
          title: 'transfer_mechanics.py',
          desktopOnly: true,
          code: `import copy
import torch
from torch import nn

torch.manual_seed(0)

def make(num_classes):
    return nn.Sequential(nn.Linear(8, 16), nn.ReLU(), nn.Linear(16, 16), nn.ReLU(), nn.Linear(16, num_classes))

pretrained = make(10)
new = make(3)
body = {k: v for k, v in pretrained.state_dict().items() if not k.startswith("4.")}
result = new.load_state_dict(body, strict=False)
print(sorted(result.missing_keys), result.unexpected_keys)
print(torch.equal(new[0].weight, pretrained[0].weight), torch.equal(new[2].weight, pretrained[2].weight))

for p in new[:4].parameters():
    p.requires_grad = False
print(sum(p.numel() for p in new.parameters() if p.requires_grad), sum(p.numel() for p in new.parameters()))

before = copy.deepcopy(new.state_dict())
opt = torch.optim.Adam([p for p in new.parameters() if p.requires_grad], lr=0.01)
x, y = torch.randn(32, 8), torch.randint(0, 3, (32,))
for _ in range(20):
    loss = nn.functional.cross_entropy(new(x), y)
    opt.zero_grad(); loss.backward(); opt.step()
after = new.state_dict()
print(sorted(k for k in before if not torch.equal(before[k], after[k])))`,
          output: `['4.bias', '4.weight'] []
True True
51 467
['4.bias', '4.weight']`,
          annotations: [
            { lines: '6-9', text: 'A factory for a small network with a configurable number of outputs. `pretrained` has a 10-class head (the "source task"); `new` has a 3-class head (the "target task"). Their bodies have identical shapes.' },
            { lines: '10-12', text: 'Copy only the body: filter out the head’s keys (`4.weight`, `4.bias`) from the pretrained state dict and load with `strict=False`. The result lists the **missing keys** (the new head, which keeps its random initial values) and no unexpected ones. Loading everything would fail with a size mismatch on the head.' },
            { lines: 13, text: 'Confirm the first two linear layers now hold exactly the pretrained values.' },
            { lines: '15-17', text: 'Freeze the body (layers 0 to 3): their parameters stop receiving gradients. Only the head remains trainable: **51 of 467 parameters** (`16×3 + 3`).' },
            { lines: '19-25', text: 'Train. The optimizer receives only the trainable parameters (a frozen parameter has no `.grad`, so passing it would be harmless but wasteful).' },
            { lines: '26-27', text: 'After training, the *only* tensors that changed are the head’s: the frozen body is bit-for-bit what we loaded. Checking this on a toy run is an excellent habit before an expensive one.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Frozen is not the same as in eval mode',
          text: '`requires_grad = False` stops weight updates, but a **batch-norm** layer in `train()` mode still updates its *running statistics* from your new data, and dropout still drops units. When you freeze a backbone, also put its batch-norm layers in `eval()` mode (loop over `model.modules()` and call `.eval()` on each `BatchNorm`), otherwise the "frozen" features quietly drift. This is the most common transfer-learning bug, and it is invisible in the weights, because running statistics are buffers, not parameters.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If you set `requires_grad = False` on all parameters of a backbone that contains batch-norm layers and then call `model.train()`, the batch-norm running statistics still change as you feed new data.',
      answer: true,
      explanation: 'True. Running mean and variance are *buffers*, not parameters, so `requires_grad` does not affect them. In `train()` mode batch norm keeps updating them from every batch. To keep a backbone truly fixed, also call `.eval()` on its batch-norm layers.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the loop that freezes every parameter of a pretrained backbone.',
      template: `for p in backbone.parameters():
    p.___ = False`,
      templateIsCode: true,
      blanks: [{ answers: ['requires_grad'] }],
      wordBank: ['requires_grad', 'grad', 'trainable', 'frozen'],
      explanation: 'Setting `requires_grad = False` tells autograd not to compute gradients for that tensor, so the optimizer never changes it. `grad` holds the gradient values themselves, and there are no `trainable` or `frozen` attributes on a parameter.',
    },
    {
      kind: 'concept',
      title: 'Real pretrained models: vision and language',
      blocks: [
        {
          type: 'p',
          text: 'Here is the standard recipe for images with **torchvision**. The pretrained weights download automatically on first use (about 45 MB for ResNet-18) and are cached; this needs an internet connection, which is why the listing is for your PC rather than the in-app editor. Note `weights.transforms()`: a pretrained model expects its inputs prepared *exactly* as in its original training (image size, crop, and the ImageNet colour mean and standard deviation), and this object does it for you.',
        },
        {
          type: 'code',
          title: 'resnet_feature_extraction.py',
          desktopOnly: true,
          code: `import torch
from torch import nn
from torchvision import models

weights = models.ResNet18_Weights.DEFAULT
model = models.resnet18(weights=weights)
preprocess = weights.transforms()

for p in model.parameters():
    p.requires_grad = False
model.fc = nn.Linear(model.fc.in_features, 6)

optimizer = torch.optim.AdamW(model.fc.parameters(), lr=1e-3)

def train_mode_keep_bn_frozen(model):
    model.train()
    for m in model.modules():
        if isinstance(m, nn.BatchNorm2d):
            m.eval()`,
          annotations: [
            { lines: '5-7', text: 'Load ResNet-18 with its ImageNet weights, and fetch the matching **preprocessing** pipeline. Apply `preprocess` to every training *and* test image; mismatched preprocessing silently ruins the features.' },
            { lines: '9-11', text: 'Freeze everything, then replace `fc` (the final layer, 512 → 1000 classes) by a fresh `Linear(512, 6)`. Because it is created *after* the freeze loop, the new head is trainable by default: only its 3,078 parameters learn.' },
            { lines: 13, text: 'The optimizer receives just the head’s parameters, with an ordinary learning rate (1e-3) because the head starts from random weights.' },
            { lines: '15-19', text: 'The batch-norm fix from the warning above: use this instead of a plain `model.train()` at the start of every epoch, so the frozen body’s normalization statistics stay fixed.' },
          ],
        },
        {
          type: 'p',
          text: 'Once the head has converged, you can try **fine-tuning**: unfreeze the body and train everything, but with a much smaller learning rate for the pretrained layers than for the head. Two **parameter groups** in the optimizer express that. Language models work the same way through the Hugging Face `transformers` library: `from_pretrained` loads the tokenizer and the weights, and `num_labels` attaches a freshly initialized classification head on top of the pretrained body.',
        },
        {
          type: 'code',
          title: 'fine_tune_groups.py',
          desktopOnly: true,
          code: `for p in model.parameters():
    p.requires_grad = True
optimizer = torch.optim.AdamW([
    {"params": model.fc.parameters(), "lr": 1e-3},
    {"params": [p for n, p in model.named_parameters() if not n.startswith("fc.")], "lr": 1e-5},
])`,
          annotations: [
            { lines: '1-2', text: 'Unfreeze every parameter for fine-tuning (continuing from the previous listing).' },
            { lines: '3-6', text: 'Two **parameter groups**: the new head learns at `1e-3` and the pretrained body at `1e-5`, one hundred times slower. The small rate nudges the general features towards your task without erasing them.' },
          ],
        },
        {
          type: 'code',
          title: 'huggingface_classifier.py',
          desktopOnly: true,
          code: `from transformers import AutoTokenizer, AutoModelForSequenceClassification

name = "distilbert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(name)
model = AutoModelForSequenceClassification.from_pretrained(name, num_labels=3)
batch = tokenizer(["great fight!", "so laggy"], padding=True, return_tensors="pt")
logits = model(**batch).logits
print(logits.shape)`,
          output: `torch.Size([2, 3])`,
          annotations: [
            { lines: '3-5', text: 'Load the tokenizer and a pretrained DistilBERT (about 66 million parameters) with a new 3-class head. The library prints a warning that the classifier weights are **newly initialized**: exactly the "replace the head" step, done for you.' },
            { lines: '6-8', text: 'Tokenize two sentences into a padded batch of tensors and run the model: one row of 3 class scores for each sentence, `(2, 3)`. Training then follows the ordinary loop from the previous lessons (or the library’s `Trainer`). The first call downloads the weights (needs internet).' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'When transfer does not help',
          text: 'Transfer learning is no magic wand. We tried it on the small 8×8 digits dataset used in this course (pretraining on one digit task and adapting to another with 10 to 50 labelled examples) and found **no real gain** over training from scratch: tiny, easy images are quickly learned directly. Transfer pays off when the features are *hard to learn* (natural photographs, language) and the labelled data is scarce. It also helps less when the target domain differs strongly from the source (medical scans, spectrograms, your game’s own state vector). **Always keep a from-scratch baseline** and compare, and for small state-vector RL tasks expect to train from scratch.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output (trainable and total parameter counts after freezing the first layer).',
      code: `from torch import nn

net = nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 3))
for p in net[0].parameters():
    p.requires_grad = False
print(sum(p.numel() for p in net.parameters() if p.requires_grad), sum(p.numel() for p in net.parameters()))`,
      answer: '27 67',
      hint: '`Linear(4, 8)` has `4·8 + 8 = 40` parameters and `Linear(8, 3)` has `8·3 + 3 = 27`. Only the second layer is still trainable.',
      explanation: 'The frozen first layer holds 40 parameters and the trainable head holds 27, so the output is `27 67`: 27 trainable out of 67 in total.',
    },
    {
      kind: 'error',
      prompt: 'This code crashes with a size mismatch when adapting a pretrained 1000-class model to 10 classes. Tap the faulty line.',
      lines: [
        'model = Net(num_classes=1000)',
        'model.load_state_dict(torch.load("pretrained.pt", weights_only=True))',
        'model.head = nn.Linear(64, 10)',
        'model.load_state_dict(torch.load("pretrained.pt", weights_only=True))',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'Line 4 tries to load the pretrained weights *again* after the head has been replaced by a 10-class layer, but the file’s head has 1000 outputs, so `load_state_dict` fails with a size mismatch. Load the weights **before** replacing the head (line 2 is the right place), or use `strict=False` with the head’s keys filtered out.',
    },
    {
      kind: 'numeric',
      prompt: 'ResNet-18’s final layer takes a 512-number feature vector. You replace it with `nn.Linear(512, 10)` for a 10-class problem and freeze everything else. How many trainable parameters (weights plus biases) remain?',
      answer: '5130',
      hint: 'Weights: 512 × 10. Biases: 10.',
      explanation: '512 × 10 = 5,120 weights plus 10 biases = 5,130 trainable parameters, about 0.05% of the network’s 11.7 million. This is why feature extraction is so fast and hard to overfit.',
      label: 'Trainable parameters:',
    },
    {
      kind: 'concept',
      title: 'A practical recipe, and pitfalls',
      blocks: [
        {
          type: 'steps',
          items: [
            { title: 'Pick a pretrained model close to your domain', text: 'ImageNet models for photographs, a language model for text, an audio model for sound. Smaller models (ResNet-18, DistilBERT, MobileNet) are easier to train and to ship in a game.' },
            { title: 'Match the preprocessing exactly', text: 'Same image size, colour order and normalization numbers (or the same tokenizer) as in pretraining. Use the transforms the library provides.' },
            { title: 'Start with feature extraction', text: 'Freeze the backbone, put its batch norm in eval mode, train a new head. It is a fast, strong baseline, and it tells you whether the features suit your task.' },
            { title: 'Then fine-tune gently', text: 'Unfreeze, use a learning rate 10 to 100 times smaller for the backbone, and a few epochs. For deep models, **gradually unfreeze** from the top layers down, which keeps the early, general layers stable.' },
            { title: 'Augment and validate honestly', text: 'Use data augmentation on the training images only, keep a validation set from your own game’s data, and compare with a from-scratch baseline and with the frozen version.' },
            { title: 'Export with the preprocessing', text: 'Ship the same preprocessing with the exported model (the previous unit’s checklist), and make sure the final license of the pretrained weights allows your use.' },
          ],
        },
        {
          type: 'table',
          headers: ['Pitfall', 'Symptom', 'Fix'],
          rows: [
            ['Wrong preprocessing', 'Poor accuracy although training seems fine', 'Use the library’s transforms; check image size, channel order and normalization'],
            ['Learning rate too high when fine-tuning', 'Accuracy drops below the frozen baseline (**catastrophic forgetting**)', 'Use 1e-5 to 1e-4 for the backbone, with warm-up'],
            ['Batch norm updated while "frozen"', 'Validation results drift between epochs', '`.eval()` on the batch-norm layers of a frozen backbone'],
            ['Domain gap', 'Pretrained features barely help', 'Fine-tune more layers, use more data, or train from scratch'],
            ['Leaky evaluation', 'Great scores, poor real-world behaviour', 'The pretrained model may have seen your test data; use clearly held-out data'],
            ['Untrusted weights', 'Security risk', 'Load only from sources you trust, with `weights_only=True` or safetensors'],
          ],
          caption: 'Common transfer-learning problems and their remedies.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Transfer in game AI',
          text: 'Pretrained vision encoders can act as a **frozen eyes module** for agents that learn from pixels: run each frame through a pretrained CNN once and train the policy on the compact feature vector, which makes RL far cheaper. Another important pattern, which later units build on, is **pretraining by imitation**: first train a policy to copy recorded human play (supervised learning, fast and stable), then continue with reinforcement learning to surpass it. And language models can be fine-tuned (or prompted) to give NPCs a voice. All of these are the same idea: start from something that already knows something.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises rebuild the bookkeeping: counting trainable versus frozen parameters, computing per-layer learning rates for gradual fine-tuning, and copying matching weights from a pretrained state into a new model.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `trainable_summary(layers)`. `layers` is a list of `(name, n_params, trainable)` tuples. Return a dict with the integer counts `"trainable"`, `"frozen"` and `"total"`, and `"percent"`: the percentage of trainable parameters rounded to 1 decimal place (use `0.0` if the total is 0).',
      starter: `def trainable_summary(layers):
    ...
`,
      solution: `def trainable_summary(layers):
    trainable = sum(n for _, n, flag in layers if flag)
    total = sum(n for _, n, _ in layers)
    percent = round(100 * trainable / total, 1) if total else 0.0
    return {"trainable": trainable, "frozen": total - trainable, "total": total, "percent": percent}
`,
      tests: `layers = [("conv1", 1728, False), ("layer1", 147968, False), ("fc", 5130, True)]
s = trainable_summary(layers)
assert s == {"trainable": 5130, "frozen": 149696, "total": 154826, "percent": 3.3}
assert trainable_summary([("a", 40, False), ("b", 27, True)]) == {"trainable": 27, "frozen": 40, "total": 67, "percent": 40.3}
assert trainable_summary([("a", 10, True), ("b", 10, True)])["percent"] == 100.0
assert trainable_summary([("a", 10, False)]) == {"trainable": 0, "frozen": 10, "total": 10, "percent": 0.0}
assert trainable_summary([]) == {"trainable": 0, "frozen": 0, "total": 0, "percent": 0.0}
assert trainable_summary([("z", 0, True)])["percent"] == 0.0
t = trainable_summary([("a", 3, True), ("b", 9, False)])
assert t["trainable"] + t["frozen"] == t["total"] and isinstance(t["percent"], float)`,
      checks: ['Sums the parameters of trainable layers, of frozen layers and of all layers', '`percent` is `100 * trainable / total` rounded to one decimal, and `0.0` when there are no parameters', 'Works for an empty list and returns plain integers for the counts'],
      hint: '`trainable = sum(n for _, n, flag in layers if flag)` and `total = sum(n for _, n, _ in layers)`. Guard the division with `if total`.',
      explanation: 'PyTorch users compute exactly this with `sum(p.numel() for p in model.parameters() if p.requires_grad)`. Printing the trainable fraction before every run is a cheap sanity check: after feature extraction it should be a tiny percentage, and if it shows 100% your freeze loop did not work.',
    },
    {
      kind: 'code',
      prompt: 'Write `layerwise_lrs(n_layers, top_lr, factor)` for **discriminative fine-tuning**: return a list of `n_layers` learning rates, one per layer from the first (most general) to the last, where the last layer uses `top_lr` and each earlier layer uses the next layer’s rate divided by `factor`. For example `layerwise_lrs(3, 1e-2, 10)` is `[1e-4, 1e-3, 1e-2]`. Raise `ValueError` if `n_layers < 1`, `top_lr <= 0` or `factor < 1`.',
      starter: `def layerwise_lrs(n_layers, top_lr, factor):
    ...
`,
      solution: `def layerwise_lrs(n_layers, top_lr, factor):
    if n_layers < 1 or top_lr <= 0 or factor < 1:
        raise ValueError("need n_layers >= 1, top_lr > 0 and factor >= 1")
    return [top_lr / factor ** (n_layers - 1 - i) for i in range(n_layers)]
`,
      tests: `import math

lrs = layerwise_lrs(3, 1e-2, 10)
assert len(lrs) == 3 and all(math.isclose(a, b) for a, b in zip(lrs, [1e-4, 1e-3, 1e-2]))
assert layerwise_lrs(1, 0.5, 10) == [0.5]
assert layerwise_lrs(4, 1.0, 2) == [0.125, 0.25, 0.5, 1.0]
assert layerwise_lrs(3, 0.01, 1) == [0.01, 0.01, 0.01]
lrs = layerwise_lrs(5, 3e-3, 2.6)
assert all(a < b for a, b in zip(lrs, lrs[1:])) and lrs[-1] == 3e-3
for args in [(0, 1e-2, 10), (-1, 1e-2, 10), (3, 0, 10), (3, -1e-3, 10), (3, 1e-2, 0.5)]:
    try:
        layerwise_lrs(*args)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      checks: ['The last layer gets `top_lr`; each earlier layer gets the next one’s rate divided by `factor`', 'Rates increase from the first layer to the last (equal when `factor == 1`)', 'Raises `ValueError` for `n_layers < 1`, a non-positive `top_lr` or `factor < 1`'],
      hint: 'Layer `i` (0-based) is `n_layers - 1 - i` steps below the top, so its rate is `top_lr / factor ** (n_layers - 1 - i)`.',
      explanation: 'The earliest layers hold the most general features (edges, spelling), so they should change least; the later, more task-specific layers can change more. This "discriminative learning rate" trick comes from the ULMFiT paper and is easy to express with one optimizer parameter group per layer, each with its own `lr`.',
    },
    {
      kind: 'code',
      prompt: 'Write `transfer_weights(source, target)` that mimics `load_state_dict(strict=False)`. Both arguments map names to NumPy arrays. Return `(new_state, copied, skipped)`: `new_state` is a **new** dict with all of `target`’s names, where every name that also exists in `source` with the **same shape** holds a *copy* of the source array, and every other name keeps `target`’s array unchanged. `copied` is the sorted list of copied names, and `skipped` the sorted list of target names that were not copied. Do not modify either input.',
      starter: `import numpy as np

def transfer_weights(source, target):
    ...
`,
      solution: `import numpy as np


def transfer_weights(source, target):
    new_state = {}
    copied, skipped = [], []
    for name, arr in target.items():
        if name in source and np.shape(source[name]) == np.shape(arr):
            new_state[name] = np.array(source[name], copy=True)
            copied.append(name)
        else:
            new_state[name] = arr
            skipped.append(name)
    return new_state, sorted(copied), sorted(skipped)
`,
      tests: `import numpy as np

source = {"conv.w": np.ones((3, 3)), "fc.w": np.ones((5, 10)), "fc.b": np.ones(10), "old": np.ones(2)}
target = {"conv.w": np.zeros((3, 3)), "fc.w": np.zeros((5, 3)), "fc.b": np.zeros(3), "extra": np.zeros(1)}
src_before = {k: v.copy() for k, v in source.items()}
tgt_before = {k: v.copy() for k, v in target.items()}

new_state, copied, skipped = transfer_weights(source, target)
assert copied == ["conv.w"]
assert skipped == ["extra", "fc.b", "fc.w"]
assert set(new_state) == set(target)
assert np.array_equal(new_state["conv.w"], np.ones((3, 3)))
assert new_state["fc.w"].shape == (5, 3) and not new_state["fc.w"].any()
assert not new_state["extra"].any() and "old" not in new_state

new_state["conv.w"][0, 0] = 99
assert source["conv.w"][0, 0] == 1
for k in source:
    assert np.array_equal(source[k], src_before[k])
for k in target:
    assert np.array_equal(target[k], tgt_before[k])

same = {"a": np.arange(4.0), "b": np.eye(2)}
ns, c, s = transfer_weights(same, {"a": np.zeros(4), "b": np.zeros((2, 2))})
assert c == ["a", "b"] and s == [] and np.array_equal(ns["b"], np.eye(2))
ns, c, s = transfer_weights({}, {"a": np.zeros(2)})
assert c == [] and s == ["a"]
assert transfer_weights({"a": np.ones(2)}, {}) == ({}, [], [])`,
      packages: ['numpy'],
      checks: ['Copies (not aliases) source arrays whose name exists in the target with an identical shape', 'Names that are missing from the source or have a different shape keep the target’s own array and appear in `skipped`', 'Returns sorted `copied` and `skipped` lists, a new dict, and leaves both inputs unchanged'],
      hint: 'Loop over `target.items()`. If `name in source and np.shape(source[name]) == np.shape(arr)`, store `np.array(source[name], copy=True)` and record the name as copied; otherwise keep `arr` and record it as skipped.',
      explanation: 'This is what `model.load_state_dict(pretrained, strict=False)` does for you: copy the matching body, leave the freshly initialized head alone, and report what was skipped. Inspecting the `skipped` list is how you confirm that *only* the layers you intended to replace were left out; an unexpected name in it usually means a renamed layer or a different architecture.',
    },
  ],
  takeaways: [
    '**Transfer learning** reuses a model trained on a big source task: early layers learn general features (edges, grammar) that help almost any related task, so a small dataset can be enough. Always keep a from-scratch baseline, because transfer helps little for easy problems or very different domains.',
    '**Feature extraction** freezes the backbone and trains a new head (cheap, safe with little data); **fine-tuning** then unfreezes the body with a **much smaller learning rate** (10 to 100 times lower), ideally gradually from the top layers down.',
    'In PyTorch: replace the head with a new `nn.Linear`, freeze with `p.requires_grad = False`, pass only trainable parameters (or parameter groups with different `lr`) to the optimizer, and load partially with `load_state_dict(strict=False)`.',
    'Use the pretrained model’s **exact preprocessing**, put frozen **batch-norm layers in eval mode** (their running statistics are buffers that `requires_grad` does not protect), and load weights only from trusted sources.',
    'For games: frozen pretrained vision encoders for pixel agents, **imitation pretraining followed by RL**, and fine-tuned language models for NPC text. Pretrained weights usually need internet the first time they are downloaded.',
  ],
  reading: [
    { title: 'PyTorch: Transfer Learning for Computer Vision Tutorial', url: 'https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html', source: 'tutorial', note: 'Official tutorial: fine-tuning and feature extraction with a pretrained ResNet.' },
    { title: 'torchvision models and pretrained weights', url: 'https://docs.pytorch.org/vision/stable/models.html', source: 'docs', note: 'The catalogue of pretrained image models, their accuracies, sizes and transforms.' },
    { title: 'Hugging Face LLM Course: fine-tuning a pretrained model', url: 'https://huggingface.co/learn/llm-course/chapter3/1', source: 'course', note: 'Fine-tune pretrained language models with the transformers library.' },
    { title: 'CS231n: Transfer Learning and Fine-tuning CNNs', url: 'https://cs231n.github.io/transfer-learning/', source: 'course', note: 'Clear rules of thumb for which layers to freeze and how to set learning rates.' },
    { title: 'Universal Language Model Fine-tuning for Text Classification (ULMFiT)', url: 'https://arxiv.org/abs/1801.06146', source: 'paper', note: 'Introduced discriminative learning rates and gradual unfreezing.' },
  ],
};
