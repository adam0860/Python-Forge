import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-computer-vision-apps',
  title: 'Computer Vision for Games and Apps',
  summary: 'How a computer sees an image: arrays of pixels, convolution and edge detection written by hand, a convolutional neural network trained in PyTorch, classic OpenCV tools for finding objects on a screen, transfer learning, and the practical pitfalls of using vision in games and tools.',
  minutes: 31,
  objectives: [
    'Describe an image as an array, with its shape, data type and channel order, and say what a convolution computes',
    'Detect edges by implementing a 2D convolution with NumPy',
    'Build and train a small convolutional neural network in PyTorch and follow the shape of the data through each layer',
    'Choose between classic tools (colour masks, template matching), a trained classifier, transfer learning and a pretrained detector',
    'Implement convolution, intersection over union and connected-blob counting yourself',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Images are arrays, and convolution finds patterns',
      blocks: [
        {
          type: 'p',
          text: 'To a program an image is just numbers. A grayscale picture is a 2D array with one brightness value per pixel (0 = black, 255 = white, stored as 8-bit integers). A colour picture adds a third axis of *[[image-channel|channels]]*: red, green and blue values for each pixel. In NumPy the shape is **(height, width, channels)**, so a 480 by 640 photo has shape `(480, 640, 3)`. Careful with two conventions: OpenCV stores the channels in **BGR** order, not RGB, and PyTorch wants **(batch, channels, height, width)**.',
        },
        {
          type: 'p',
          text: 'Everything in computer vision starts from asking what pattern of numbers means something. An *edge* is a place where brightness changes sharply. The tool for finding such local patterns is the **[[convolution|convolution]]**: take a small grid of numbers called a **[[kernel|kernel]]** (or filter), place it over a patch of the image, multiply the overlapping numbers, add them up, and write the sum as one output pixel; then slide the kernel one pixel along and repeat. Different kernels respond to different patterns. The Sobel kernel below has negative numbers on its left and positive on its right, so it gives a large output exactly where the image gets brighter from left to right.',
        },
        {
          type: 'code',
          title: 'edges_by_hand.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

# A tiny 12x12 grayscale "screenshot": a bright 6x6 square (200) on a dark background (20).
image = np.full((12, 12), 20, dtype=np.uint8)
image[3:9, 3:9] = 200
print("shape:", image.shape, "dtype:", image.dtype, "range:", image.min(), "to", image.max())


def convolve(img, kernel):
    """Slide the kernel over the image; each output pixel is the sum of (patch * kernel)."""
    kh, kw = kernel.shape
    out = np.zeros((img.shape[0] - kh + 1, img.shape[1] - kw + 1))
    for r in range(out.shape[0]):
        for c in range(out.shape[1]):
            out[r, c] = np.sum(img[r:r + kh, c:c + kw] * kernel)
    return out


sobel_x = np.array([[-1, 0, 1],
                    [-2, 0, 2],
                    [-1, 0, 1]])           # responds to vertical edges (brightness changing left to right)
sobel_y = sobel_x.T                         # responds to horizontal edges

gx = convolve(image.astype(float), sobel_x)
gy = convolve(image.astype(float), sobel_y)
strength = np.hypot(gx, gy)

print("x-gradient, middle row:", gx[4].astype(int))
print("edge strength > 400:")
for row in strength:
    print("".join("#" if v > 400 else "." for v in row))`,
          output: `shape: (12, 12) dtype: uint8 range: 20 to 200
x-gradient, middle row: [   0  720  720    0    0    0    0 -720 -720    0]
edge strength > 400:
..........
..######..
.########.
.##....##.
.##....##.
.##....##.
.##....##.
.########.
..######..
..........`,
          annotations: [
            { lines: '3-6', text: 'A synthetic 12 by 12 grayscale image: a dark background (20) with a bright 6 by 6 square (200). The shape is `(rows, columns)` and the type is 8-bit unsigned.' },
            { lines: '9-16', text: 'The convolution. For every output position it takes the image patch under the kernel, multiplies it by the kernel element by element, and sums. With no padding the output is smaller than the input by `kernel size - 1` in each direction (12 - 3 + 1 = 10).' },
            { lines: '19-22', text: 'The Sobel kernel for horizontal change. Its transpose detects vertical change. Convolving with both gives the brightness gradient in two directions.' },
            { lines: '24-26', text: 'We convert to `float` first, because 8-bit integers would overflow (200 minus 20 does not fit if a result is negative). `np.hypot` combines the two gradients into one edge strength, the length of the gradient vector.' },
            { lines: 28, text: 'Along the middle row the x-gradient is +720 where the square begins (dark to bright), 0 inside and outside, and -720 where it ends (bright to dark). The sign tells you the direction of the change.' },
            { lines: '29-31', text: 'Thresholding the edge strength draws the outline of the square. The edge is two pixels thick because the 3 by 3 kernel looks one pixel to each side of its centre.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why vision uses convolution instead of one big layer',
          text: 'A 640 by 480 photo has 307 200 pixels. A fully connected layer with just 1 000 outputs would need over 300 million weights, and it would have to learn the same pattern (say, an edge) separately at every position. A convolution reuses the *same* few weights at every position: a 3 by 3 kernel has 9 numbers however large the picture is, and a pattern learned in one corner is automatically recognised everywhere. This **weight sharing** is what makes learning from images practical.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A screenshot loaded with OpenCV has the shape (1080, 1920, 3). What does that tell you?',
      options: [
        { text: '1080 rows (height), 1920 columns (width) and 3 colour channels, in blue-green-red order', correct: true, why: 'NumPy image arrays are (height, width, channels), and OpenCV orders the channels BGR. The picture is 1920 pixels wide and 1080 tall.' },
        { text: '1080 pixels wide, 1920 pixels tall and 3 images in a batch', why: 'The first axis is the number of rows, which is the height, and the last axis is the colour channels. A batch dimension would be an extra axis in front.' },
        { text: '3 frames of a video, each 1080 by 1920', why: 'A video would be a stack of frames with an extra axis. Here the 3 is the channel axis of a single image.' },
        { text: 'A grayscale image, because the array has three numbers', why: 'A grayscale image would have shape (1080, 1920), with no channel axis, or a channel axis of size 1.' },
      ],
      explanation: 'Remember the axis order: rows first (height), then columns (width), then channels. Mixing up width and height, or RGB and BGR, is the most common bug in a first vision program.',
    },
    {
      kind: 'concept',
      title: 'Convolutional neural networks',
      blocks: [
        {
          type: 'p',
          text: 'Sobel is a kernel somebody designed. A **[[cnn|convolutional neural network]]** *learns* its kernels. A convolution layer holds many filters whose numbers are parameters; training by [[gradient-descent|gradient descent]] adjusts them until they respond to whatever helps the task: edges and corners in the first layers, then textures and parts (an eye, a wheel), then whole objects in the later layers. The output of one filter over the whole image is a **[[feature-map|feature map]]**. A typical block is *convolution, then a non-linearity ([[relu|ReLU]]), then [[pooling|pooling]]*, which keeps the strongest response in each small block and so shrinks the image and makes the result less sensitive to small shifts. At the end, the maps are flattened and a linear layer produces one score per class.',
        },
        {
          type: 'table',
          headers: ['Layer', 'What it does', 'Shape after it (batch omitted)'],
          rows: [
            ['**Input**', '8 by 8 grayscale digit, values scaled to 0..1', '(1, 8, 8)'],
            ['**Conv2d(1, 8, 3, padding=1)**', '8 learned 3 by 3 filters; padding keeps the size', '(8, 8, 8)'],
            ['**ReLU**', 'Set negative values to 0', '(8, 8, 8)'],
            ['**MaxPool2d(2)**', 'Keep the largest of each 2 by 2 block: halves height and width', '(8, 4, 4)'],
            ['**Conv2d(8, 16, 3, padding=1)**', '16 filters, each looking at all 8 maps at once', '(16, 4, 4)'],
            ['**ReLU, MaxPool2d(2)**', 'Non-linearity, then shrink again', '(16, 2, 2)'],
            ['**Flatten, Linear(64, 10)**', 'Unroll to 64 numbers, one score for each digit', '(10)'],
          ],
          caption: 'The network in the program below. Following the shape through the layers is the best way to understand (and debug) a CNN.',
        },
        {
          type: 'code',
          title: 'digits_cnn.py',
          lang: 'python',
          desktopOnly: true,
          code: `import torch
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from torch import nn

torch.manual_seed(0)

digits = load_digits()                                   # 1797 images of handwritten digits, 8x8 pixels
images = digits.images / 16.0                            # pixel values 0..16 -> 0..1
x_train, x_test, y_train, y_test = train_test_split(images, digits.target, test_size=0.25, random_state=0, stratify=digits.target)

# (N, 8, 8) -> (N, 1, 8, 8): PyTorch images are (batch, channels, height, width)
x_train = torch.tensor(x_train, dtype=torch.float32).unsqueeze(1)
x_test = torch.tensor(x_test, dtype=torch.float32).unsqueeze(1)
y_train = torch.tensor(y_train)
y_test = torch.tensor(y_test)

model = nn.Sequential(
    nn.Conv2d(1, 8, kernel_size=3, padding=1),           # 8 learned 3x3 filters   -> (8, 8, 8)
    nn.ReLU(),
    nn.MaxPool2d(2),                                     # keep the strongest of each 2x2 block -> (8, 4, 4)
    nn.Conv2d(8, 16, kernel_size=3, padding=1),          # 16 filters over those 8 maps -> (16, 4, 4)
    nn.ReLU(),
    nn.MaxPool2d(2),                                     # -> (16, 2, 2)
    nn.Flatten(),                                        # -> 64 numbers
    nn.Linear(16 * 2 * 2, 10),                           # one score per digit
)
print("parameters:", sum(p.numel() for p in model.parameters()))
print("output shape:", tuple(model(x_train[:5]).shape))

loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
for epoch in range(30):
    order = torch.randperm(len(x_train))
    for start in range(0, len(order), 64):
        batch = order[start:start + 64]
        optimizer.zero_grad()
        loss = loss_fn(model(x_train[batch]), y_train[batch])
        loss.backward()
        optimizer.step()

with torch.no_grad():
    accuracy = (model(x_test).argmax(dim=1) == y_test).float().mean().item()
print("test accuracy above 0.9:", accuracy > 0.9)`,
          output: `parameters: 1898
output shape: (5, 10)
test accuracy above 0.9: True`,
          annotations: [
            { lines: 6, text: 'A fixed seed, so that the starting weights and the batch order are the same on every run.' },
            { lines: '8-10', text: 'scikit-learn ships a small dataset of 1 797 handwritten digits, 8 by 8 pixels each. The pixel values go from 0 to 16, so dividing by 16 scales them to 0..1, which helps training. We split off a quarter as a test set the network never trains on.' },
            { lines: '12-16', text: 'PyTorch convolutions expect `(batch, channels, height, width)`. The images are `(N, 8, 8)`, so `unsqueeze(1)` inserts the channel axis of size 1.' },
            { lines: '18-27', text: 'The network as a `Sequential` stack, with the shape after each layer in the comments. `padding=1` keeps a 3 by 3 convolution from shrinking the image, and each `MaxPool2d(2)` halves it.' },
            { lines: '28-29', text: 'Only 1 898 parameters: 80 in the first convolution, 1 168 in the second and 650 in the final layer. A single fully connected layer from 64 pixels to 1 000 outputs would already need 65 000. The test pass shows an output of 10 scores for each of 5 images.' },
            { lines: '31-40', text: 'The usual PyTorch training loop on shuffled mini-batches of 64: clear gradients, compute the loss, back-propagate, update. 30 passes over the data take a few seconds on a CPU.' },
            { lines: '42-44', text: 'Evaluation on the unseen test images with gradients switched off. The accuracy printed in one run was 98 percent, and the program prints only whether it is above 0.9, so the output does not depend on tiny numeric differences between machines. For comparison, a plain logistic regression on the raw pixels reaches about 97 percent on this easy dataset; the advantage of CNNs grows enormously on real photographs.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Read the shapes, not the code',
          text: 'The most common CNN errors are shape errors: a missing channel axis, a `Linear` layer whose input size does not match the flattened maps, or pixel values that are still 0..255. When something fails, print `x.shape` after each layer (or push a dummy batch through `model[:i]`) and compare it with the table.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A convolution layer applies the same small set of filter weights at every position of the image, which is why a CNN needs far fewer parameters than a fully connected network on the same image.',
      answer: true,
      explanation: 'True. The weights of a filter are shared across all positions, so the parameter count depends on the filter size and the number of filters, not on the image size. Sharing also builds in the assumption that a pattern means the same thing wherever it appears, which is usually right for images.',
    },
    {
      kind: 'fill',
      prompt: 'A convolution layer will receive ordinary colour images. Fill in its number of input channels.',
      template: `nn.Conv2d(in_channels=___, out_channels=8, kernel_size=3)`,
      templateIsCode: true,
      blanks: [{ answers: ['3'] }],
      wordBank: ['1', '3', '8', '256'],
      explanation: 'A colour image has 3 channels (red, green and blue), so the first layer must accept 3. A grayscale image would use 1. The `out_channels=8` is how many filters the layer learns, and becomes the input channel count of the next layer.',
    },
    {
      kind: 'concept',
      title: 'Tools for real images: OpenCV and pretrained models',
      blocks: [
        {
          type: 'p',
          text: 'You do not have to train a network for every vision task. For a fixed, clean source such as a game’s own screen, classic image processing is often faster, simpler and perfectly reliable. **OpenCV** (`pip install opencv-python`) is the standard toolbox. The program below builds a fake game screenshot and then (1) finds every yellow coin by converting to **HSV** colour space, where *hue* separates colours independently of brightness, keeping only yellow pixels and measuring the blobs, and (2) finds a sprite by **[[template-matching|template matching]]**, sliding the small picture over the screenshot and scoring each position.',
        },
        {
          type: 'code',
          title: 'find_things_on_screen.py',
          lang: 'python',
          desktopOnly: true,
          code: `import cv2
import numpy as np

# Build a fake game screenshot (BGR): green ground, three yellow coins and one red gem.
screen = np.full((120, 200, 3), (40, 120, 40), dtype=np.uint8)
for x, y in [(30, 30), (100, 70), (160, 40)]:
    cv2.circle(screen, (x, y), 10, (0, 215, 255), -1)             # yellow coin
cv2.circle(screen, (60, 95), 10, (0, 0, 220), -1)                 # red gem

hsv = cv2.cvtColor(screen, cv2.COLOR_BGR2HSV)                     # hue makes colour tests easy
mask = cv2.inRange(hsv, (20, 150, 150), (35, 255, 255))           # keep only yellow pixels
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

print("coins found:", len(contours))
for contour in sorted(contours, key=lambda c: cv2.boundingRect(c)[0]):
    x, y, w, h = cv2.boundingRect(contour)
    print(f"  box x={x} y={y} size={w}x{h} centre=({x + w // 2}, {y + h // 2})")

# Template matching: find a small sprite by sliding it over the screenshot.
sprite = screen[85:106, 50:71].copy()                             # a crop that contains the gem
scores = cv2.matchTemplate(screen, sprite, cv2.TM_CCOEFF_NORMED)
_, best, _, top_left = cv2.minMaxLoc(scores)
print(f"sprite best match {best:.2f} at {top_left}")`,
          output: `coins found: 3
  box x=20 y=20 size=21x21 centre=(30, 30)
  box x=90 y=60 size=21x21 centre=(100, 70)
  box x=150 y=30 size=21x21 centre=(160, 40)
sprite best match 1.00 at (50, 85)`,
          annotations: [
            { lines: '4-8', text: 'A synthetic screenshot built with NumPy and `cv2.circle`. Note the colours are **BGR**: `(0, 215, 255)` is yellow, `(0, 0, 220)` is red.' },
            { lines: '10-11', text: 'Convert to HSV and keep the pixels whose hue, saturation and value fall in the yellow range. The result, `mask`, is a black-and-white image: white where a pixel is yellow. The red gem and the green background are excluded.' },
            { lines: 12, text: '`findContours` traces the outline of each white blob. `RETR_EXTERNAL` keeps only outer outlines.' },
            { lines: '14-17', text: 'One contour per coin. `boundingRect` gives each blob’s box, from which we compute the centre, which is the position a bot or test script would click on. Radius 10 gives a 21 pixel box.' },
            { lines: '19-23', text: 'Template matching. We cut a patch containing the gem out of the screenshot and search for it. `TM_CCOEFF_NORMED` gives a similarity from -1 to 1, and `minMaxLoc` returns the best score (1.00, a perfect match) and its top-left position. In a real game you would load the sprite from a file and accept matches above a threshold such as 0.9.' },
          ],
        },
        {
          type: 'table',
          headers: ['Task', 'Reasonable approach', 'Why'],
          rows: [
            ['Find a known icon or UI element on a screen', '**Template matching**', 'The sprite is pixel-identical, so no training is needed. Breaks if the size, theme or rotation changes'],
            ['Find objects of one distinctive colour', '**HSV mask and contours**', 'Fast and transparent, but sensitive to lighting and similar colours in the background'],
            ['Classify a whole image (which card, which tile, damaged or fine)', '**Train a small CNN**, or **transfer learning**', 'Needs labelled examples, but handles variation that rules cannot'],
            ['Find and label several objects in photos or video', 'A **pretrained** [[object-detection|object detector]] (YOLO-family, DETR, or models from `torchvision`), fine-tuned on your classes if needed', 'Detection needs boxes as training data, which is expensive to label yourself; check each model’s licence for commercial use'],
            ['Track faces, hands or body pose from a webcam', 'A ready-made library such as **MediaPipe**', 'Solved and optimised; use it as a control input in a game'],
            ['Read text on screen', 'An OCR tool such as **Tesseract** or EasyOCR', 'A specialised pipeline; do not train your own'],
          ],
          caption: 'Pick the simplest tool that is reliable for your source. The further you go down the table, the more data and compute you need.',
        },
        {
          type: 'p',
          text: 'When a classifier is needed but you have only a few hundred labelled images, use **[[transfer-learning|transfer learning]]**. Take a network that was already trained on a huge photo collection (such as ImageNet), keep all its layers (they already detect edges, textures and shapes), **freeze** them, and replace only the final layer with a new one for your classes. Only that small layer is trained, so a few hundred examples and a few minutes on a CPU can be enough.',
        },
        {
          type: 'code',
          title: 'transfer_learning.py',
          lang: 'python',
          desktopOnly: true,
          code: `import torch
from torch import nn
from torchvision import models

weights = models.ResNet18_Weights.DEFAULT          # trained on 1.2 million ImageNet photos (downloaded once)
model = models.resnet18(weights=weights)
preprocess = weights.transforms()                   # the exact resize and normalisation this model expects

for parameter in model.parameters():
    parameter.requires_grad = False                 # freeze everything it already learned

model.fc = nn.Linear(model.fc.in_features, 4)       # a new final layer for our 4 classes (trainable by default)
optimizer = torch.optim.Adam(model.fc.parameters(), lr=1e-3)   # train only the new layer

# ...then loop over batches of (preprocess(image), label) exactly as in the digits example.`,
          annotations: [
            { lines: '1-3', text: '`torchvision` is the companion library of PyTorch, with datasets, image transforms and pretrained models. Install it with `pip install torchvision`.' },
            { lines: '5-7', text: 'Load a ResNet-18 with weights trained on ImageNet. The weights are downloaded once and cached, which is why this example needs an internet connection the first time. `weights.transforms()` returns the resize and normalisation the model was trained with; using different preprocessing quietly lowers accuracy.' },
            { lines: '9-10', text: 'Freezing: gradient descent will not change parameters with `requires_grad = False`, so the pretrained filters stay as they are.' },
            { lines: '12-13', text: 'Replace the last layer (`fc`) by a new `Linear` layer with one output per class (4 here). Its parameters are new, so they are trainable. The optimizer is given only these parameters.' },
            { lines: 15, text: 'The training loop is the same as in the digits program. Once the new layer has converged you can optionally unfreeze the last blocks and train them with a much smaller learning rate (fine-tuning).' },
          ],
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output: the width of an image after three layers (a convolution with kernel 3, stride 1, padding 1; a pooling layer with kernel 2, stride 2; and a convolution with kernel 3, stride 1, no padding).',
      code: `size = 28
for kernel, stride, pad in [(3, 1, 1), (2, 2, 0), (3, 1, 0)]:
    size = (size + 2 * pad - kernel) // stride + 1
print(size)`,
      answer: '12',
      hint: 'Apply the formula one layer at a time: 28, then the next size, and so on.',
      explanation: 'Layer 1: (28 + 2 - 3) / 1 + 1 = 28 (padding 1 preserves the size). Layer 2: (28 - 2) / 2 + 1 = 14 (pooling halves it). Layer 3: (14 - 3) / 1 + 1 = 12 (no padding shrinks it by 2). Knowing this formula lets you size the final `Linear` layer without trial and error.',
    },
    {
      kind: 'error',
      prompt: 'This preprocessing makes the reported test accuracy look better than it really is. Tap the faulty line.',
      lines: [
        'x_train, x_test, y_train, y_test = train_test_split(images, labels, random_state=0)',
        'mean, std = x_test.mean(), x_test.std()',
        'x_train = (x_train - mean) / std',
        'x_test = (x_test - mean) / std',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The normalisation statistics are computed from the **test** set, so information about the test data leaks into training and evaluation (see [[data-leakage|data leakage]]). Compute `mean` and `std` from `x_train` only, and then apply those same numbers to both sets. The same rule holds for every preprocessing step that learns something from data.',
    },
    {
      kind: 'numeric',
      prompt: 'How many parameters (weights and biases) does `nn.Conv2d(3, 16, kernel_size=3)` have?',
      answer: '448',
      hint: 'Each of the 16 filters has 3 × 3 × 3 weights (one 3 by 3 grid per input channel), plus one bias.',
      explanation: 'Each filter: 3 channels × 3 × 3 = 27 weights plus 1 bias = 28. With 16 filters, 16 × 28 = 448 parameters, whatever the size of the image it is applied to.',
      label: 'Parameters:',
    },
    {
      kind: 'concept',
      title: 'Vision in games: uses and pitfalls',
      blocks: [
        {
          type: 'p',
          text: 'Vision shows up in game work in several places. **Automated testing**: find a button or a health bar on screen, compare screenshots with a reference image to catch rendering regressions. **Pixel-based agents**: reinforcement learning from the raw screen, as in the famous Atari agents, uses a CNN as the *observation encoder* in front of the policy; frames are typically converted to grayscale, resized to 84 by 84 and stacked (the last 4 frames, so the agent can see motion). **Content tools**: classify or tag art assets, detect duplicates, check textures. **Player input**: head, hand or body tracking from a webcam. **Analysis**: read replays or streams to extract statistics.',
        },
        {
          type: 'p',
          text: 'Whenever you can get the game’s own state (positions, health, inventory) directly from the engine, use that instead of the pixels: it is exact, free and thousands of times smaller. Vision is the right tool when the pixels are all you have, when the thing you care about is the picture itself, or when you must work like a human player.',
        },
        {
          type: 'table',
          headers: ['Pitfall', 'What happens', 'Defence'],
          rows: [
            ['**Distribution shift**', 'Trained on one resolution, UI scale, theme or lighting, it fails on another', 'Train on varied data; use [[data-augmentation|data augmentation]] (random shifts, crops, brightness changes) and test on a truly different set'],
            ['**Data leakage**', 'Test images that are near-copies of training images (frames from the same video), or statistics computed on the test set', 'Split by *source* (by video, level or player), not by frame, and fit all preprocessing on the training set only'],
            ['**Shortcut learning**', 'The network learns a background cue instead of the object (every picture of a sword has a forge behind it)', 'Vary backgrounds, inspect failures, look at a [[confusion-matrix|confusion matrix]] and not only overall accuracy'],
            ['**Class imbalance**', '95 percent of images are “no enemy”, so predicting that always scores 95 percent', 'Use [[precision|precision]] and recall per class, balance the data or weight the loss'],
            ['**Preprocessing mismatch**', 'Different resize, colour order (BGR vs RGB) or scaling at inference than in training', 'Use one preprocessing function for both, and save it with the model'],
            ['**Latency and frame rate**', 'A heavy model cannot keep up with 60 frames per second', 'Use a smaller network, lower resolution, run it every few frames, or export to ONNX or TensorRT (see the serving lesson)'],
            ['**Privacy and consent**', 'Webcam or screen data can contain faces and personal information', 'Process locally when possible, ask for permission, and do not store what you do not need'],
          ],
          caption: 'Most vision projects fail because of the data and the evaluation, not because of the network architecture.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises implement building blocks that vision code relies on: a 2D convolution, intersection over union (the standard way to compare boxes) and counting connected blobs in a thresholded mask.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `convolve2d(image, kernel)` with NumPy. Both are 2D arrays. Return the **valid** convolution as a float array: for each position where the kernel fits entirely inside the image, the sum of `patch * kernel` (this is the "convolution" of deep learning: do **not** flip the kernel). The result has shape `(H - kh + 1, W - kw + 1)`. Raise `ValueError` if the kernel is larger than the image in either direction.',
      starter: `import numpy as np


def convolve2d(image, kernel):
    ...
`,
      solution: `import numpy as np


def convolve2d(image, kernel):
    image = np.asarray(image, dtype=float)
    kernel = np.asarray(kernel, dtype=float)
    kh, kw = kernel.shape
    h, w = image.shape
    if kh > h or kw > w:
        raise ValueError("kernel larger than image")
    out = np.zeros((h - kh + 1, w - kw + 1))
    for r in range(out.shape[0]):
        for c in range(out.shape[1]):
            out[r, c] = np.sum(image[r:r + kh, c:c + kw] * kernel)
    return out
`,
      tests: `image = np.arange(25).reshape(5, 5)
identity = np.array([[0, 0, 0], [0, 1, 0], [0, 0, 0]])
result = convolve2d(image, identity)
assert result.shape == (3, 3)
assert np.allclose(result, image[1:4, 1:4])
assert result.dtype == float

box = np.ones((2, 2))
assert np.allclose(convolve2d(np.arange(9).reshape(3, 3), box), [[8, 12], [20, 24]])

sobel_x = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]])
step = np.zeros((4, 6))
step[:, 3:] = 10
assert np.allclose(convolve2d(step, sobel_x), [[0, 40, 40, 0], [0, 40, 40, 0]])
assert np.allclose(convolve2d(step.T, sobel_x), 0)

asymmetric = np.array([[1, 2], [3, 4]])
assert np.allclose(convolve2d([[1, 0], [0, 0]], asymmetric), [[1]])
assert np.allclose(convolve2d([[0, 0], [0, 1]], asymmetric), [[4]])

whole = convolve2d(np.ones((3, 3)), np.ones((3, 3)))
assert whole.shape == (1, 1) and whole[0, 0] == 9
assert convolve2d([[5]], [[2]])[0, 0] == 10

for bad_image, bad_kernel in [(np.ones((2, 5)), np.ones((3, 3))), (np.ones((5, 2)), np.ones((3, 3)))]:
    try:
        convolve2d(bad_image, bad_kernel)
        raise SystemExit("expected ValueError")
    except ValueError:
        pass
assert image.shape == (5, 5)`,
      checks: ['Returns a float array of shape `(H - kh + 1, W - kw + 1)` with the sum of the patch times the kernel at each position', 'Does not flip the kernel (the deep-learning convention)', 'Raises `ValueError` when the kernel is larger than the image'],
      packages: ['numpy'],
      hint: 'Loop over the output rows `r` and columns `c`. At each position take `image[r:r + kh, c:c + kw]`, multiply by the kernel and use `np.sum`. Create the output with `np.zeros((h - kh + 1, w - kw + 1))`.',
      explanation: 'Two loops are enough to understand the idea, but they are slow for large images; libraries use optimised implementations (`scipy.signal.correlate2d`, `cv2.filter2D`, and `torch.nn.functional.conv2d` on the GPU). Strictly speaking, flipping the kernel is what *mathematicians* call convolution; what deep learning calls convolution is really cross-correlation, and since the kernels are learned, the flip makes no difference.',
    },
    {
      kind: 'code',
      prompt: 'Write `iou(a, b)`, the intersection over union of two axis-aligned boxes given as `(x1, y1, x2, y2)` with `x1 <= x2` and `y1 <= y2`. It is the area of their overlap divided by the area of their union, as a float. Boxes that do not overlap, or only touch along an edge, give `0.0`. If the union has zero area, return `0.0`.',
      starter: `def iou(a, b):
    ...
`,
      solution: `def iou(a, b):
    overlap_w = min(a[2], b[2]) - max(a[0], b[0])
    overlap_h = min(a[3], b[3]) - max(a[1], b[1])
    if overlap_w <= 0 or overlap_h <= 0:
        return 0.0
    inter = overlap_w * overlap_h
    area_a = (a[2] - a[0]) * (a[3] - a[1])
    area_b = (b[2] - b[0]) * (b[3] - b[1])
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0
`,
      tests: `import math

assert iou((0, 0, 10, 10), (0, 0, 10, 10)) == 1.0
assert math.isclose(iou((0, 0, 10, 10), (5, 5, 15, 15)), 25 / 175)
assert iou((0, 0, 10, 10), (10, 0, 20, 10)) == 0.0
assert iou((0, 0, 10, 10), (20, 20, 30, 30)) == 0.0
assert iou((0, 0, 10, 10), (0, 10, 10, 20)) == 0.0
assert math.isclose(iou((0, 0, 10, 10), (2, 2, 4, 4)), 4 / 100)
assert math.isclose(iou((2, 2, 4, 4), (0, 0, 10, 10)), 4 / 100)
assert math.isclose(iou((0, 0, 4, 4), (2, 0, 6, 4)), 8 / 24)
assert iou((0, 0, 0, 0), (0, 0, 0, 0)) == 0.0
assert iou((5, 5, 5, 5), (0, 0, 10, 10)) == 0.0
assert isinstance(iou((0, 0, 1, 1), (0, 0, 1, 1)), float)
assert math.isclose(iou((0.0, 0.0, 1.5, 1.5), (0.5, 0.5, 2.0, 2.0)), 1.0 / (2.25 + 2.25 - 1.0))`,
      checks: ['Computes the overlap width and height from the minimum of the right/bottom edges and the maximum of the left/top edges', 'Returns `0.0` when the boxes do not overlap or only touch', 'Divides the intersection by the union (the two areas minus the intersection) and returns `0.0` for a zero-area union'],
      hint: 'The overlap rectangle goes from `max(a[0], b[0])` to `min(a[2], b[2])` horizontally, and the same vertically. If either overlap side is not positive, return 0. The union is `area_a + area_b - intersection`.',
      explanation: 'IoU is the standard way to score a predicted box against the true one (a detection often counts as correct above 0.5) and to remove duplicates: *non-maximum suppression* keeps the most confident box and discards others that overlap it by more than a threshold. The “touching edges” case matters: two adjacent tiles share a border but have no overlapping area.',
    },
    {
      kind: 'code',
      prompt: 'Write `blob_sizes(grid)`. `grid` is a list of equal-length strings in which `"#"` marks an "on" cell (say, a pixel of an enemy sprite after thresholding) and any other character is empty. A **blob** is a group of "#" cells connected **up, down, left or right** (not diagonally). Return a list with the size of every blob, **largest first**. Do not modify the input, and do not use recursion (a large image would exceed the recursion limit).',
      starter: `def blob_sizes(grid):
    ...
`,
      solution: `def blob_sizes(grid):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    seen = set()
    sizes = []
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "#" or (r, c) in seen:
                continue
            seen.add((r, c))
            stack = [(r, c)]
            size = 0
            while stack:
                y, x = stack.pop()
                size += 1
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= ny < rows and 0 <= nx < cols and grid[ny][nx] == "#" and (ny, nx) not in seen:
                        seen.add((ny, nx))
                        stack.append((ny, nx))
            sizes.append(size)
    return sorted(sizes, reverse=True)
`,
      tests: `assert blob_sizes([]) == []
assert blob_sizes(["...", "..."]) == []
assert blob_sizes(["#"]) == [1]
assert blob_sizes(["##.#", "#..#", "..##"]) == [4, 3]
assert blob_sizes(["#.#", ".#.", "#.#"]) == [1, 1, 1, 1, 1]
assert blob_sizes(["###", "#.#", "###"]) == [8]
assert blob_sizes(["#.", ".#"]) == [1, 1]
assert blob_sizes(["#####"]) == [5]
assert blob_sizes(["#", "#", ".", "#"]) == [2, 1]
assert blob_sizes(["#.#.#", "#.#.#", "#.#.#"]) == [3, 3, 3]

big = ["#" * 300] * 300
assert blob_sizes(big) == [90000]

grid = ["##", ".#"]
assert blob_sizes(grid) == [3]
assert grid == ["##", ".#"]
assert blob_sizes(["#x#", "#x#"]) == [2, 2]
assert blob_sizes(["a#b", "###"]) == [4]`,
      checks: ['Counts groups of "#" cells connected up, down, left or right, but not diagonally', 'Returns the blob sizes sorted from largest to smallest, and `[]` when there are none', 'Uses a stack or queue instead of recursion, so a 300 by 300 blob works'],
      hint: 'Scan every cell. When you find an unvisited "#", start a flood fill: push it on a stack, and repeatedly pop a cell, count it, and push its unvisited "#" neighbours (mark them as seen when you push them). When the stack is empty, record the size.',
      explanation: 'This flood fill is the heart of *connected components*, which is what OpenCV’s `findContours` and `connectedComponents` do for you at speed. Marking cells as seen when they are *pushed*, not when popped, avoids adding the same cell several times. In a game bot, the sizes let you ignore specks of noise (tiny blobs) and keep the real objects.',
    },
  ],
  takeaways: [
    'An image is an array: **(height, width, channels)** in NumPy and OpenCV (with **BGR** channel order in OpenCV), **(batch, channels, height, width)** in PyTorch. Scale pixels to a sensible range and watch the data type: 8-bit arithmetic overflows.',
    'A **convolution** slides a small kernel over the image and sums patch times kernel at each position. Different kernels detect different patterns (Sobel finds edges). Its weights are shared across positions, which is why convolution suits images.',
    'A **CNN** learns its kernels: *convolution, ReLU, pooling* blocks build up from edges to parts to objects, then a linear layer scores the classes. Track the shape through the layers; the output size is `(size + 2 * padding - kernel) // stride + 1`.',
    'Use the simplest reliable tool: **template matching** or **HSV masks** for a fixed screen, a small **CNN** or **transfer learning** (freeze a pretrained network, train a new last layer) for classification with little data, a pretrained **detector** or a library such as MediaPipe for objects and bodies. If the engine can give you the game state, use that instead of pixels.',
    'Vision fails mostly on **data**: distribution shift, leakage (split by source, fit preprocessing on training data only), shortcuts, imbalance and preprocessing mismatch. Compare boxes with **IoU**, and evaluate with per-class metrics and a different set of images from the one you trained on.',
  ],
  reading: [
    { title: 'Stanford CS231n: Convolutional Neural Networks for Visual Recognition', url: 'https://cs231n.github.io', source: 'course', note: 'The classic course notes on convolution, CNN layers, shapes and transfer learning.' },
    { title: 'OpenCV-Python tutorials', url: 'https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html', source: 'tutorial', note: 'Colour spaces, thresholding, contours, template matching and many other classic tools.' },
    { title: 'PyTorch: Transfer learning for computer vision tutorial', url: 'https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html', source: 'tutorial', note: 'Fine-tuning and feature extraction with a pretrained ResNet, step by step.' },
    { title: 'Mnih et al.: Human-level control through deep reinforcement learning', url: 'https://www.nature.com/articles/nature14236', source: 'paper', note: 'The Atari agents: a CNN on stacked 84 by 84 frames as the observation encoder.' },
    { title: 'MediaPipe solutions guide', url: 'https://ai.google.dev/edge/mediapipe/solutions/guide', source: 'docs', note: 'Ready-made face, hand and pose tracking that runs on a PC or phone.' },
  ],
};
