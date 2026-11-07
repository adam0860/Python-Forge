import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-cnns',
  title: 'Convolutional Neural Networks',
  summary: 'How networks see images and game screens: sliding filters, weight sharing, pooling, channels and shape arithmetic. Write a convolution by hand, build and train a CNN in PyTorch, and learn why they power everything from digit readers to Atari-playing agents.',
  minutes: 25,
  objectives: [
    'Explain local connectivity and weight sharing, and why they suit images better than fully connected layers',
    'Compute a 2-D convolution by hand and with NumPy, and predict output sizes from kernel, stride and padding',
    'Build a Conv → ReLU → Pool CNN in PyTorch and track tensor shapes and parameter counts through it',
    'Explain receptive fields, feature maps and translation equivariance',
    'Name the landmark CNN architectures and where CNNs appear in games and reinforcement learning',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Why images need a different layer',
      blocks: [
        {
          type: 'p',
          text: 'An image is a grid of numbers: a 28×28 grayscale digit has 784 pixels, a 224×224 colour photo has 150,528 values, and a game screen of 84×84 pixels with four stacked frames has 28,224. A fully connected layer connects *every* input to *every* neuron, so a first layer of just 1,000 neurons on a 224×224 colour image already needs 150 million weights. Worse, it throws away the structure: it does not know that pixel (10, 10) sits next to pixel (10, 11), and a cat shifted two pixels to the right looks like a completely different input.',
        },
        {
          type: 'p',
          text: 'The **convolutional layer** builds in two assumptions that are true of almost all images. **Local connectivity**: useful patterns (an edge, a corner, a texture) are small, so each neuron looks at only a small window of the image. **Weight sharing**: a pattern that is useful in one place is useful everywhere, so the *same* small set of weights, called a **[[kernel|kernel]]** (or filter), is slid across the whole image. The result of applying one kernel at every position is a new grid called a **[[feature-map|feature map]]**, showing where that pattern was found.',
        },
        {
          type: 'p',
          text: 'The operation is simple: place the kernel over a patch, multiply each pixel by the matching kernel weight, and add everything up to produce one output number; then move one step and repeat. This is a **[[convolution|convolution]]** (strictly, deep-learning libraries compute *cross-correlation*, which is the same thing with the kernel not flipped; since the kernel is learned, the difference does not matter). Below, a 3×3 kernel with columns `-1, 0, +1` responds to **vertical edges**. We write the whole operation as two loops, exactly as the definition says.',
        },
        {
          type: 'code',
          title: 'conv_by_hand.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

img = np.zeros((6, 6))
img[:, 3:] = 9
kernel = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], dtype=float)

def conv2d(x, k):
    kh, kw = k.shape
    out = np.zeros((x.shape[0] - kh + 1, x.shape[1] - kw + 1))
    for i in range(out.shape[0]):
        for j in range(out.shape[1]):
            out[i, j] = (x[i:i + kh, j:j + kw] * k).sum()
    return out

result = conv2d(img, kernel)
print(result[0].astype(int).tolist(), result.shape)`,
          output: `[0, 27, 27, 0] (4, 4)`,
          annotations: [
            { lines: '3-4', text: 'A 6×6 image that is dark (0) on the left three columns and bright (9) on the right: a single **vertical edge** in the middle.' },
            { lines: 5, text: 'A vertical-edge kernel: it subtracts the pixels on its left from the pixels on its right.' },
            { lines: '7-12', text: 'The convolution: for every output position `(i, j)`, take the `3×3` patch of the image starting there, multiply element-wise by the kernel, and sum. The output shrinks to `(6 − 3 + 1) = 4` in each direction because the kernel must fit inside the image.' },
            { lines: '14-15', text: 'Each output is 0 over flat regions (left side minus left side) and **27** where the kernel straddles the edge (three rows × (9 − 0) = 27). The first row is `[0, 27, 27, 0]`: the feature map lights up exactly at the edge.' },
          ],
        },
        {
          type: 'code',
          title: 'conv_in_pytorch.py',
          desktopOnly: true,
          code: `import torch
import torch.nn.functional as F

img = torch.zeros(1, 1, 6, 6)
img[..., 3:] = 9
kernel = torch.tensor([[-1.0, 0.0, 1.0]] * 3).reshape(1, 1, 3, 3)
print(F.conv2d(img, kernel)[0, 0, 0].tolist())`,
          output: `[0.0, 27.0, 27.0, 0.0]`,
          annotations: [
            { lines: '4-6', text: 'PyTorch image tensors have shape **`(batch, channels, height, width)`**, written `NCHW`. Here: one image, one channel, 6×6. The kernel has shape `(out_channels, in_channels, kh, kw)`.' },
            { lines: 7, text: '`F.conv2d` gives the same row as our loops, but runs in optimized compiled code, in parallel over the whole batch and every channel.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Fewer weights, and better ones',
          text: 'A 3×3 kernel has just 9 weights no matter how big the image is. That is thousands of times fewer than a fully connected layer, so there is far less to overfit and far less memory to use. Weight sharing also makes the layer **translation equivariant**: shift the object in the input and the feature map shifts by the same amount. The network does not have to relearn "this is an edge" at every position. Convolution is a good example of an **inductive bias**: structural knowledge about the problem built into the model, so the data only has to teach the rest.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A 3×3 convolution kernel is applied at every position of a large image. What is the main benefit of using the *same* 3×3 weights at every position?',
      options: [
        { text: 'Far fewer parameters, and a pattern learned in one place is detected everywhere (translation equivariance)', correct: true, why: 'The layer has only 9 weights per input channel and filter regardless of image size, and the same detector fires wherever the pattern appears.' },
        { text: 'It makes every output pixel identical', why: 'The weights are shared, but the *inputs* under the kernel differ from place to place, so the outputs differ; that is what makes a feature map informative.' },
        { text: 'It lets the network ignore the image’s colours', why: 'Colour is handled by the channel dimension: a colour kernel has separate weights for the red, green and blue channels.' },
        { text: 'It removes the need for training', why: 'The kernel weights are still learned by gradient descent; sharing only reduces how many there are.' },
      ],
      explanation: 'Weight sharing slashes the parameter count and builds in the assumption that a useful pattern is useful anywhere in the image.',
    },
    {
      kind: 'concept',
      title: 'Channels, stride, padding and pooling',
      blocks: [
        {
          type: 'p',
          text: 'A single kernel finds one pattern. A convolutional layer applies **many kernels in parallel**, each producing its own feature map, and stacks them as **channels**. The input also has channels (3 for RGB), and each kernel spans all of them. So `nn.Conv2d(in_channels=3, out_channels=16, kernel_size=3)` holds 16 kernels, each of shape `3 × 3 × 3`, plus one bias per kernel: `16 × (3·3·3) + 16 = 448` parameters. The network’s output for each position is a 16-number description of what is there.',
        },
        {
          type: 'table',
          headers: ['Setting', 'Meaning', 'Effect on the output'],
          rows: [
            ['`kernel_size`', 'Width and height of the window (3 is the usual choice)', 'Larger kernels see more context but cost more weights'],
            ['`stride`', 'How many pixels the window moves each step', 'Stride 2 halves the width and height'],
            ['`padding`', 'Zeros added around the border', '`padding=1` with a 3×3 kernel keeps the size unchanged ("same")'],
            ['`out_channels`', 'Number of kernels = number of feature maps', 'More channels, more patterns, more parameters'],
            ['`MaxPool2d(2)`', 'Keep the largest value in each 2×2 block', 'Halves the width and height, no parameters'],
          ],
          caption: 'The settings of a convolutional layer and what they do to the shape.',
        },
        {
          type: 'math',
          tex: 'n_{\\text{out}} = \\left\\lfloor \\frac{n_{\\text{in}} + 2p - k}{s} \\right\\rfloor + 1',
          caption: 'Output size along one dimension for input size n, kernel k, padding p and stride s.',
        },
        {
          type: 'p',
          text: 'Check it: a 28-pixel input with `k=3, p=1, s=1` gives `(28 + 2 − 3)/1 + 1 = 28`; the same input with no padding gives 26; with `k=2, s=2` (a pooling layer) it gives `(28 − 2)/2 + 1 = 14`. **Pooling** shrinks the grid, which makes later layers cheaper and gives a little tolerance to small shifts. The standard CNN design is a repeating block: **Conv → ReLU → Pool**, where the spatial size keeps *shrinking* while the number of channels keeps *growing*, so the network trades "where" for "what". At the end, the feature maps are flattened into a vector and fed to ordinary `Linear` layers that make the decision.',
        },
        {
          type: 'code',
          title: 'cnn_shapes.py',
          desktopOnly: true,
          code: `import torch
from torch import nn

net = nn.Sequential(
    nn.Conv2d(1, 8, kernel_size=3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
    nn.Conv2d(8, 16, kernel_size=3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
    nn.Flatten(), nn.Linear(16 * 7 * 7, 10),
)
x = torch.zeros(4, 1, 28, 28)
for layer in net:
    x = layer(x)
    print(type(layer).__name__, tuple(x.shape))
print(sum(p.numel() for p in net.parameters()))`,
          output: `Conv2d (4, 8, 28, 28)
ReLU (4, 8, 28, 28)
MaxPool2d (4, 8, 14, 14)
Conv2d (4, 16, 14, 14)
ReLU (4, 16, 14, 14)
MaxPool2d (4, 16, 7, 7)
Flatten (4, 784)
Linear (4, 10)
9098`,
          annotations: [
            { lines: '4-8', text: 'A small CNN for 28×28 digit images: two Conv → ReLU → Pool blocks (8 then 16 channels), `Flatten`, and a linear classifier over 10 digits. `padding=1` keeps each convolution’s size unchanged, so only the pooling layers shrink the grid.' },
            { lines: 9, text: 'A dummy batch of 4 grayscale 28×28 images, in `NCHW` layout. Pushing a dummy tensor through is the easiest way to find the size the final `Linear` needs.' },
            { lines: '10-12', text: 'Print the shape after every layer: the grid shrinks 28 → 14 → 7 while the channels grow 1 → 8 → 16. `Flatten` turns `16 × 7 × 7` into 784 numbers per image, which is why the linear layer is `Linear(16 * 7 * 7, 10)`.' },
            { lines: 13, text: '**9,098 parameters in total**: the first conv has `8·(1·3·3)+8 = 80`, the second `16·(8·3·3)+16 = 1,168`, and the classifier `784·10+10 = 7,850`. Most of the weights sit in the final linear layer, not in the convolutions.' },
          ],
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'The number of parameters in a convolutional layer grows with the width and height of the input image, because there is one weight for every pixel.',
      answer: false,
      explanation: 'False. The kernels are shared across positions, so the parameter count depends only on the kernel size and the number of input and output channels. A 3×3 convolution with 16 filters over 3 channels has 448 parameters for a 32×32 image and for a 4,000×4,000 one. (The *output* gets bigger, and so would a fully connected layer after flattening.)',
    },
    {
      kind: 'fill',
      prompt: 'Complete the layer so that the 3×3 convolution keeps the image size unchanged (a "same" convolution).',
      template: `nn.Conv2d(in_channels=3, out_channels=16, kernel_size=3, ___=1)`,
      templateIsCode: true,
      blanks: [{ answers: ['padding'] }],
      wordBank: ['padding', 'stride', 'dilation', 'bias'],
      explanation: 'With a 3×3 kernel, `padding=1` adds a one-pixel border of zeros, so `(n + 2 − 3)/1 + 1 = n`. `stride` would move the window faster and shrink the output; `dilation` spreads the kernel out; `bias` toggles the per-filter offset.',
    },
    {
      kind: 'concept',
      title: 'Training a CNN, and what the layers learn',
      blocks: [
        {
          type: 'p',
          text: 'Nothing about the training loop changes: a CNN is an `nn.Module` like any other, so the five-step loop, cross-entropy loss and Adam all apply. Here is a complete example on the scikit-learn **digits** dataset (1,797 handwritten digits as 8×8 greyscale images), which loads offline and trains in seconds on a CPU. It uses the same shape recipe as above, shrunk to fit: 8×8 → 4×4 → 2×2.',
        },
        {
          type: 'code',
          title: 'cnn_digits.py',
          desktopOnly: true,
          outputVaries: true,
          code: `import torch
from torch import nn
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

torch.manual_seed(0)
d = load_digits()
X = torch.tensor(d.images / 16.0, dtype=torch.float32).unsqueeze(1)
y = torch.tensor(d.target)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0, stratify=y)

net = nn.Sequential(
    nn.Conv2d(1, 8, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
    nn.Conv2d(8, 16, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
    nn.Flatten(), nn.Linear(16 * 2 * 2, 10),
)
opt = torch.optim.Adam(net.parameters(), lr=0.01)
loss_fn = nn.CrossEntropyLoss()
for epoch in range(1, 21):
    net.train()
    order = torch.randperm(len(Xtr))
    for s in range(0, len(order), 64):
        idx = order[s:s + 64]
        loss = loss_fn(net(Xtr[idx]), ytr[idx])
        opt.zero_grad(); loss.backward(); opt.step()
    if epoch in (1, 5, 20):
        net.eval()
        with torch.no_grad():
            acc = (net(Xte).argmax(1) == yte).float().mean().item()
        print(f"epoch {epoch:2d}  test accuracy {acc:.3f}")
print(sum(p.numel() for p in net.parameters()))`,
          output: `epoch  1  test accuracy 0.578
epoch  5  test accuracy 0.938
epoch 20  test accuracy 0.978
1898`,
          annotations: [
            { lines: '3-4', text: 'scikit-learn supplies the data and a stratified split (every digit equally represented in train and test).' },
            { lines: '6-10', text: 'Scale pixel values from 0–16 to 0–1 and add the **channel dimension** with `unsqueeze(1)`: `(1797, 8, 8)` becomes `(1797, 1, 8, 8)`. Forgetting this is the most common CNN shape error.' },
            { lines: '12-16', text: 'The same Conv → ReLU → Pool recipe: `8×8 → 4×4 → 2×2` with 16 channels, so the classifier takes `16 · 2 · 2 = 64` inputs.' },
            { lines: '17-18', text: 'Adam and cross-entropy, exactly as in the training-loop lesson.' },
            { lines: '19-25', text: 'The familiar loop: shuffle, mini-batches of 64, forward, `zero_grad`, `backward`, `step`.' },
            { lines: '26-30', text: 'Evaluate on held-out digits in `eval()` mode under `no_grad`. Accuracy climbs from 58% to about **98%** after 20 epochs. (Exact values vary by version and machine.)' },
            { lines: 31, text: 'Only **1,898 parameters**. A plain MLP with a 64-unit hidden layer on the same data needs 4,810 and typically does no better; the gap widens enormously for larger images.' },
          ],
        },
        {
          type: 'p',
          text: 'What do the layers learn? Researchers have visualized trained networks and found a hierarchy. **Early layers** learn simple, generic detectors: edges at various angles and colour blobs (looking remarkably like the first stages of the visual cortex). **Middle layers** combine them into textures, corners and parts. **Late layers** respond to whole objects: a wheel, an eye, a face. Each neuron’s **[[receptive-field|receptive field]]**, the region of the *original* image that can influence it, grows with depth: one 3×3 layer sees 3×3 pixels, two stacked see 5×5, three see 7×7, and pooling or striding makes it grow even faster. Deep stacks of small kernels see as widely as one big kernel with fewer weights and more non-linearity.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'From LeNet to ResNet',
          text: '**LeNet-5** (Yann LeCun and colleagues, 1998) read handwritten digits on bank cheques and is the ancestor of every CNN. The idea then sat largely unused for a decade, until **AlexNet** (2012) won the ImageNet competition by a huge margin using GPUs, ReLU and dropout, which started the deep-learning boom. **VGG** (2014) showed that stacks of plain 3×3 kernels work well, and **ResNet** (2015) added **skip connections** (`output = x + F(x)`) that let gradients flow through over 100 layers, which made very deep networks trainable. The next lesson covers the tricks that made that possible.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'CNNs in games',
          text: 'The famous 2013–2015 DeepMind agent that learned Atari games from raw pixels was a small CNN: it took the last **four 84×84 frames stacked as channels** (so the network can see motion) and output a value for each joystick action. Any game AI that consumes the *screen* instead of a hand-built list of numbers (positions, health, distances) uses a convolutional front end. If your game exposes clean state variables, you do not need one: a plain MLP on those numbers is smaller, faster to train and often better. We will use both in the reinforcement-learning units.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output (the shape of a convolution applied to a batch of one RGB image of 32×32 pixels, using a 5×5 kernel with no padding).',
      code: `import torch
from torch import nn

conv = nn.Conv2d(3, 8, kernel_size=5)
print(conv(torch.zeros(1, 3, 32, 32)).shape)`,
      answer: 'torch.Size([1, 8, 28, 28])',
      hint: '`out_channels = 8`. The size is `(32 + 0 − 5) / 1 + 1`.',
      explanation: 'The batch size stays 1, the channels become the layer’s `out_channels` (8), and each spatial side shrinks to `(32 − 5)/1 + 1 = 28`.',
    },
    {
      kind: 'error',
      prompt: 'This network will crash with a shape mismatch: the final `Linear` layer does not match what comes out of the convolution and pooling. Tap the faulty line.',
      lines: [
        '# images are 3 x 32 x 32',
        'conv = nn.Conv2d(3, 16, kernel_size=3, padding=1)',
        'pool = nn.MaxPool2d(2)',
        'fc = nn.Linear(16 * 7 * 7, 10)',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'With `padding=1` the convolution keeps 32×32, and pooling halves it to 16×16, so the flattened vector has `16 × 16 × 16 = 4096` values, not `16 × 7 × 7`. The 7×7 came from the earlier 28×28 example with two poolings. Computing the size from the formula, or passing a dummy tensor through the layers, avoids this mistake.',
    },
    {
      kind: 'numeric',
      prompt: 'How many parameters (weights plus biases) does `nn.Conv2d(in_channels=3, out_channels=16, kernel_size=3)` have?',
      answer: '448',
      hint: 'Each of the 16 kernels has `3 × 3 × 3` weights (3 input channels), plus one bias per kernel.',
      explanation: 'Weights: 16 × 3 × 3 × 3 = 432. Biases: 16. Total 448, independent of the image size.',
      label: 'Parameters:',
    },
    {
      kind: 'concept',
      title: 'Putting shapes to work',
      blocks: [
        {
          type: 'p',
          text: 'Most CNN bugs are **shape bugs**, and the cure is bookkeeping you can do in your head. Keep this routine whenever you design or debug a convolutional network.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Know the layout', text: 'PyTorch wants `(N, C, H, W)`. Images from NumPy or PIL are usually `(H, W, C)`: permute them with `x.permute(2, 0, 1)` and add the batch dimension.' },
            { title: 'Track H and W', text: 'Use `floor((n + 2p − k)/s) + 1` for every conv or pool. A `same` conv (`k=3, p=1`) keeps the size, a `MaxPool2d(2)` halves it (rounding down).' },
            { title: 'Track C', text: 'Each conv sets the channel count to its `out_channels`; the next layer’s `in_channels` must equal it. Pooling keeps channels unchanged.' },
            { title: 'Size the classifier', text: '`Linear` input = `C × H × W` after the last pooling. Or end with `nn.AdaptiveAvgPool2d(1)` (**global average pooling**) so the classifier input is just `C`, whatever the image size.' },
            { title: 'Verify with a dummy tensor', text: 'Push `torch.zeros(1, C, H, W)` through the feature extractor and read the shape off, rather than computing it by hand.' },
          ],
        },
        {
          type: 'table',
          headers: ['Task', 'Typical architecture', 'Notes'],
          rows: [
            ['Small images, few classes', '2–4 Conv → ReLU → Pool blocks, then Linear', 'Fast on a CPU; try digits or small sprites first'],
            ['Larger images', 'Deeper, with batch norm and skip connections (ResNet)', 'Usually start from a **pretrained** network (transfer learning, a later lesson)'],
            ['Game screens (RL)', '3 conv layers on stacked frames, then Linear', 'The DQN recipe; use grayscale, small size, frame stacking'],
            ['1-D signals (audio, time series, text)', '`Conv1d` with the same ideas', 'The kernel slides along time instead of two axes'],
            ['Dense per-pixel output (segmentation)', 'Encoder-decoder (U-Net) with transposed convolutions', 'Output has the same H and W as the input'],
          ],
          caption: 'Where convolutional networks are used, and the usual starting recipe.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'The three exercises rebuild the machinery from scratch: a general convolution with stride and padding, a max-pooling layer, and the receptive-field calculation that tells you how much of the image a deep neuron really sees.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `conv2d(x, k, stride=1, padding=0)` for a 2-D NumPy array `x` and kernel `k`. Zero-pad `x` by `padding` on all four sides (`np.pad`), then slide the kernel with the given stride, summing the element-wise products (cross-correlation, no kernel flip). Return the output array. Use the size formula `(n + 2p − k) // s + 1`; if the kernel is larger than the padded input, raise `ValueError`.',
      starter: `import numpy as np

def conv2d(x, k, stride=1, padding=0):
    ...
`,
      solution: `import numpy as np


def conv2d(x, k, stride=1, padding=0):
    x = np.pad(np.asarray(x, dtype=float), padding)
    k = np.asarray(k, dtype=float)
    kh, kw = k.shape
    if kh > x.shape[0] or kw > x.shape[1]:
        raise ValueError("kernel is larger than the (padded) input")
    out_h = (x.shape[0] - kh) // stride + 1
    out_w = (x.shape[1] - kw) // stride + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            r, c = i * stride, j * stride
            out[i, j] = (x[r:r + kh, c:c + kw] * k).sum()
    return out
`,
      tests: `import numpy as np

img = np.zeros((6, 6))
img[:, 3:] = 9
edge = np.array([[-1, 0, 1]] * 3)
r = conv2d(img, edge)
assert r.shape == (4, 4) and r[0].tolist() == [0, 27, 27, 0]

x = np.arange(16).reshape(4, 4)
ones2 = np.ones((2, 2))
out = conv2d(x, ones2)
assert out.shape == (3, 3) and out[0, 0] == 10 and out[2, 2] == 50
assert conv2d(x, ones2, stride=2).tolist() == [[10, 18], [42, 50]]

same = conv2d(x, np.ones((3, 3)), padding=1)
assert same.shape == (4, 4) and same[0, 0] == 10 and same[1, 1] == 45

ident = np.zeros((3, 3)); ident[1, 1] = 1
assert np.array_equal(conv2d(x, ident, padding=1), x)
assert conv2d(x, np.ones((4, 4))).tolist() == [[120.0]]
assert conv2d(x, ones2, stride=3).shape == (1, 1)
assert conv2d(np.ones((7, 7)), np.ones((3, 3)), stride=2, padding=1).shape == (4, 4)

x_before = x.copy()
conv2d(x, ones2, padding=2)
assert np.array_equal(x, x_before)
try:
    conv2d(np.ones((2, 2)), np.ones((3, 3)))
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")`,
      packages: ['numpy'],
      checks: ['Zero-pads the input, then slides the kernel with the given stride summing element-wise products', 'Output size is `(n + 2p − k) // s + 1` in each dimension (e.g. a 3×3 kernel with `padding=1` keeps the size)', 'Raises `ValueError` when the kernel does not fit; does not modify the input'],
      hint: '`xp = np.pad(x, padding)`; compute `out_h` and `out_w` with the formula; for each `(i, j)` the patch is `xp[i*stride : i*stride + kh, j*stride : j*stride + kw]`.',
      explanation: 'This is exactly what `nn.Conv2d` computes for one input channel and one filter. The real layer repeats it for every input channel (summing the results) and every output channel, over the whole batch, with fast compiled code, and learns the kernel values by backpropagation.',
    },
    {
      kind: 'code',
      prompt: 'Write `max_pool2d(x, size=2)`: **non-overlapping** max pooling of a 2-D array. Each output cell is the maximum of a `size × size` block (stride equals `size`). If the height or width is not a multiple of `size`, ignore the leftover last rows and columns (as PyTorch does). Raise `ValueError` if `size < 1`. Return a NumPy array.',
      starter: `import numpy as np

def max_pool2d(x, size=2):
    ...
`,
      solution: `import numpy as np


def max_pool2d(x, size=2):
    if size < 1:
        raise ValueError("size must be at least 1")
    x = np.asarray(x)
    h, w = x.shape[0] // size, x.shape[1] // size
    out = np.empty((h, w), dtype=x.dtype)
    for i in range(h):
        for j in range(w):
            out[i, j] = x[i * size:(i + 1) * size, j * size:(j + 1) * size].max()
    return out
`,
      tests: `import numpy as np

x = np.arange(16).reshape(4, 4)
assert max_pool2d(x).tolist() == [[5, 7], [13, 15]]
y = np.arange(25).reshape(5, 5)
assert max_pool2d(y).tolist() == [[6, 8], [16, 18]]
z = np.arange(36).reshape(6, 6)
assert max_pool2d(z, size=3).tolist() == [[14, 17], [32, 35]]
assert max_pool2d(x, size=1).tolist() == x.tolist()
assert max_pool2d(x, size=4).tolist() == [[15]]

neg = -np.arange(16).reshape(4, 4)
assert max_pool2d(neg).tolist() == [[0, -2], [-8, -10]]
assert max_pool2d(np.ones((1, 1)), size=2).shape == (0, 0)

before = x.copy()
out = max_pool2d(x)
assert np.array_equal(x, before) and out.shape == (2, 2)
try:
    max_pool2d(x, 0)
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")`,
      packages: ['numpy'],
      checks: ['Each output cell is the maximum of a non-overlapping `size × size` block', 'Leftover rows and columns are ignored: output shape is `(h // size, w // size)`', 'Raises `ValueError` for `size < 1`; works with negative values; does not modify the input'],
      hint: 'The output is `(h // size, w // size)`. For each cell `(i, j)` take the block `x[i*size:(i+1)*size, j*size:(j+1)*size]` and its `.max()`.',
      explanation: 'Max pooling keeps the strongest response in each neighbourhood: it asks "was this feature present anywhere here?" and discards the exact position. That gives some tolerance to small shifts and quarters the amount of data for the next layer. Because it only picks values, it has no parameters to learn.',
    },
    {
      kind: 'code',
      prompt: 'Write `receptive_field(layers)`: `layers` is a list of `(kernel_size, stride)` pairs for a stack of conv or pooling layers (assume no dilation). Track the receptive field `rf` and the **jump** `j` (the distance in input pixels between neighbouring units of the current layer). Start with `rf = 1, j = 1`. For each layer: `rf += (kernel_size - 1) * j`, then `j *= stride`. Return `(rf, j)` as a tuple.',
      starter: `def receptive_field(layers):
    ...
`,
      solution: `def receptive_field(layers):
    rf, jump = 1, 1
    for kernel, stride in layers:
        rf += (kernel - 1) * jump
        jump *= stride
    return rf, jump
`,
      tests: `assert receptive_field([]) == (1, 1)
assert receptive_field([(3, 1)]) == (3, 1)
assert receptive_field([(3, 1), (3, 1)]) == (5, 1)
assert receptive_field([(3, 1)] * 3) == (7, 1)
assert receptive_field([(7, 2)]) == (7, 2)
assert receptive_field([(3, 1), (2, 2), (3, 1), (2, 2)]) == (10, 4)
assert receptive_field([(3, 2), (3, 2), (3, 2)]) == (15, 8)
assert receptive_field([(1, 1)] * 5) == (1, 1)
layers = [(3, 1), (2, 2)]
receptive_field(layers)
assert layers == [(3, 1), (2, 2)]
rf, j = receptive_field([(5, 1), (5, 1)])
assert rf == 9 and j == 1
assert isinstance(receptive_field([(3, 2)]), tuple)`,
      checks: ['Starts from `rf = 1, jump = 1` and, for each layer, adds `(kernel - 1) * jump` to `rf` before multiplying `jump` by the stride', 'Stacked 3×3, stride-1 layers give 3, 5, 7… (each adds 2); strides make later layers add more', 'Returns a `(rf, jump)` tuple and does not modify the input list'],
      hint: 'Loop over the layers in order. The update order matters: first `rf += (kernel - 1) * jump` using the *old* jump, then `jump *= stride`.',
      explanation: 'The receptive field tells you how much of the image one late neuron can possibly "see". Two 3×3 layers see 5×5, three see 7×7, and downsampling (stride 2) makes every later layer widen the view much faster. If an object is larger than the network’s final receptive field, the network cannot recognize it as a whole, which is one reason deep networks and pooling are needed.',
    },
  ],
  takeaways: [
    'A **convolution** slides a small learned **kernel** over the image, giving a **feature map** of where its pattern occurs. **Local connectivity** and **weight sharing** make it use thousands of times fewer weights than a fully connected layer and make it translation equivariant.',
    'Image tensors are `(N, C, H, W)`. A `Conv2d(in, out, k)` has `out × in × k × k + out` parameters, independent of the image size. Output size is `floor((n + 2p − k) / s) + 1`; `padding=1` with a 3×3 kernel keeps the size.',
    'The standard design repeats **Conv → ReLU → Pool**, shrinking the grid while growing the channels, then flattens into `Linear` layers. Track shapes with a dummy tensor, and remember the channel dimension when loading images.',
    '**Receptive fields** grow with depth (two 3×3 layers see 5×5), and earlier layers learn edges and colours while later layers learn parts and objects. Landmarks: LeNet (1998), AlexNet (2012), VGG, ResNet with skip connections (2015).',
    'Use a CNN when the input is a **grid** (images, game screens, spectrograms; `Conv1d` for signals). If your game provides clean numeric state, a plain MLP is usually simpler and better.',
  ],
  reading: [
    { title: 'CS231n: Convolutional Neural Networks for Visual Recognition (course notes)', url: 'https://cs231n.github.io/convolutional-networks/', source: 'course', note: 'The standard explanation of convolutional layers, pooling and architectures, with clear diagrams.' },
    { title: 'PyTorch: Training a Classifier (a CNN on CIFAR-10)', url: 'https://docs.pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html', source: 'tutorial', note: 'The official end-to-end CNN tutorial: data loading, network, training, evaluation.' },
    { title: 'A guide to convolution arithmetic for deep learning', url: 'https://arxiv.org/abs/1603.07285', source: 'paper', note: 'Dumoulin and Visin: every shape and padding rule, with animations.' },
    { title: 'Distill: Feature Visualization', url: 'https://distill.pub/2017/feature-visualization/', source: 'article', note: 'Beautiful, interactive look at what the layers of a trained CNN respond to.' },
    { title: 'Deep Residual Learning for Image Recognition (ResNet)', url: 'https://arxiv.org/abs/1512.03385', source: 'paper', note: 'The paper that introduced skip connections and made very deep networks trainable.' },
  ],
};
