import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-visualization',
  title: 'Visualizing Data with matplotlib',
  summary: 'You cannot debug what you cannot see. Learn the matplotlib figure/axes model, which plot to pick for which question, how to read learning curves, and how to prepare noisy training data for plotting.',
  minutes: 20,
  objectives: [
    'Create figures with plt.subplots and draw line, scatter, bar, histogram and image plots on an Axes',
    'Choose the right plot type for a question about trends, relationships, distributions or categories',
    'Read learning curves to spot underfitting, overfitting and a good stopping point',
    'Compute histogram counts and smoothed curves (moving average and exponential smoothing) in code',
    'Label, scale and save figures so they are honest and reproducible',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Figures, axes and your first plot',
      blocks: [
        {
          type: 'p',
          text: 'Numbers hide problems that a picture shows in a second: a loss curve that stopped improving, two features that are nearly identical, an outlier that dominates everything. **matplotlib** is Python’s standard plotting library, and the one most ML tutorials, notebooks and libraries (including pandas and scikit-learn plotting helpers) build on. Its model has two key objects: a **Figure** (the whole canvas, which you can save as an image) and one or more **Axes** (a single plot with its own x and y axes, labels and title). The recommended style is explicit: create both with `fig, ax = plt.subplots()` and then call methods on `ax`.',
        },
        {
          type: 'code',
          title: 'learning_curve.py',
          desktopOnly: true,
          code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

epochs = np.arange(1, 21)
train_loss = 2.0 * np.exp(-0.3 * epochs) + 0.05
val_loss = 1.8 * np.exp(-0.3 * epochs) + 0.3 + 0.02 * epochs

fig, ax = plt.subplots(figsize=(6, 4))
ax.plot(epochs, train_loss, label="train")
ax.plot(epochs, val_loss, label="validation")
ax.set_xlabel("epoch")
ax.set_ylabel("loss")
ax.set_title("Learning curves")
ax.legend()
fig.savefig("loss_curve.png", dpi=150)
print("saved loss_curve.png", fig.get_size_inches().tolist())
print("best epoch:", int(epochs[val_loss.argmin()]))`,
          output: `saved loss_curve.png [6.0, 4.0]
best epoch: 11`,
          annotations: [
            { lines: '1-3', text: '`matplotlib.use("Agg")` selects a *file-only* backend that needs no window, which is right for scripts, servers and training machines. On your desktop or in a notebook, drop it and call `plt.show()` to open a window instead.' },
            { lines: '6-8', text: 'Fake loss values for 20 epochs: training loss keeps falling, while validation loss falls and then climbs again (the `+ 0.02 * epochs` term).' },
            { lines: 10, text: '`plt.subplots` returns the Figure and one Axes. `figsize` is in inches.' },
            { lines: '11-12', text: '`ax.plot(x, y, label=...)` draws a line for each curve. The labels feed the legend.' },
            { lines: '13-16', text: 'Always label the axes and give the plot a title; `ax.legend()` draws the legend from the labels. An unlabelled plot is useless to everyone, including you in a month.' },
            { lines: 17, text: '`fig.savefig` writes the image file (PNG here; PDF and SVG also work), the way to keep plots from long unattended training runs.' },
            { lines: 19, text: '`argmin` finds the epoch with the lowest validation loss: epoch 11, the point where training should have stopped.' },
          ],
        },
        {
          type: 'p',
          text: 'matplotlib needs a graphics environment to show or save figures, so the example above is shown for your PC. Here is the same picture drawn live in the app. The training curve keeps falling, but the validation curve turns around near epoch 11 and then rises: the model is starting to memorize the training data instead of learning general patterns.',
        },
        {
          type: 'graph',
          caption: 'Learning curves (the same formulas as the code). Training loss (blue) always improves; validation loss (red) bottoms out near epoch 11 and then gets worse. That gap is overfitting.',
          x: [0, 20],
          y: [0, 2.2],
          functions: [
            { expr: '2*exp(-0.3*x)+0.05', label: 'train loss', color: 'blue' },
            { expr: '1.8*exp(-0.3*x)+0.3+0.02*x', label: 'validation loss', color: 'red' },
          ],
          vlines: [{ x: 11, label: 'best epoch', color: 'green', dashed: true }],
          height: 320,
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'The learning curve is your main instrument',
          text: 'Plot **loss against epoch** for both the training and the validation data on every run. Both high and flat means *underfitting* (the model is too simple or the learning rate too small). Training falling while validation rises means *overfitting* (regularize, add data, or stop early). A curve that jumps wildly or becomes `nan` points to a learning rate that is too large. You will diagnose almost every training problem in this course from this one plot.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Training loss keeps decreasing for all 50 epochs, but validation loss reaches its minimum at epoch 18 and then slowly rises. What is the most sensible conclusion?',
      options: [
        { text: 'The model began to overfit after epoch 18; keep the epoch-18 checkpoint or stop training there', correct: true, why: 'Falling training loss with rising validation loss is the classic overfitting signature. Early stopping at the validation minimum gives the model that generalizes best.' },
        { text: 'The model is still improving, so train for many more epochs', why: 'Improvement on the training data alone is meaningless: the validation loss, which measures new data, got worse.' },
        { text: 'The plot must be wrong because the two losses should always move together', why: 'It is normal and common for the two curves to diverge; that divergence is the information the plot is there to show.' },
        { text: 'The learning rate is too small', why: 'A too-small learning rate shows up as both curves falling very slowly, not as the validation loss turning back up.' },
      ],
      explanation: 'Always judge a model by data it did not train on. The point where validation loss stops improving marks when the model starts memorizing, so save the best-validation checkpoint (a technique called early stopping).',
    },
    {
      kind: 'concept',
      title: 'Choosing the right plot',
      blocks: [
        {
          type: 'p',
          text: 'The plot type should match the question. Asking **"how did this change over time or epochs?"** calls for a line plot; **"is there a relationship between two variables?"** for a scatter plot; **"how are the values distributed?"** for a histogram; **"how do categories compare?"** for a bar chart; and **"what does this grid of numbers look like?"** (a confusion matrix, a correlation table, an image) for a heatmap.',
        },
        {
          type: 'table',
          headers: ['Question', 'Plot', 'matplotlib call', 'ML example'],
          rows: [
            ['How does it change over time?', 'line', '`ax.plot(x, y)`', 'loss and reward curves per epoch'],
            ['Do two variables relate?', '[[scatter-plot|scatter plot]]', '`ax.scatter(x, y)`', 'feature vs label; predictions vs truth'],
            ['How are values spread?', '[[histogram]]', '`ax.hist(values, bins=20)`', 'feature distributions; error sizes'],
            ['How do categories compare?', 'bar chart', '`ax.bar(names, heights)`', 'class balance; accuracy per class'],
            ['What is in this grid?', 'heatmap or image', '`ax.imshow(grid)`', 'confusion matrix; an image; attention weights'],
          ],
          caption: 'Pick the plot from the question. All of these are methods on an Axes.',
        },
        {
          type: 'code',
          title: 'plot_gallery.py',
          desktopOnly: true,
          code: `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

rng = np.random.default_rng(0)
x = rng.uniform(0, 10, 50)
y = 2 * x + rng.normal(0, 2, 50)
scores = rng.normal(50, 10, 1000)
confusion = np.array([[50, 2, 3], [4, 45, 6], [1, 5, 44]])

fig, axes = plt.subplots(2, 2, figsize=(8, 6))
axes[0, 0].scatter(x, y, s=12)
axes[0, 0].set_title("scatter")
axes[0, 1].hist(scores, bins=20)
axes[0, 1].set_title("histogram")
axes[1, 0].bar(["mage", "tank", "rogue"], [22, 58, 21])
axes[1, 0].set_title("bar")
im = axes[1, 1].imshow(confusion, cmap="Blues")
axes[1, 1].set_title("heatmap")
fig.colorbar(im, ax=axes[1, 1])
fig.tight_layout()
fig.savefig("overview.png")
print(axes.shape, len(fig.axes))`,
          output: `(2, 2) 5`,
          annotations: [
            { lines: '6-10', text: 'Synthetic data for four plots: points that follow a noisy line `y = 2x`, a thousand normally distributed scores, and a 3 × 3 confusion matrix (rows: true class, columns: predicted class).' },
            { lines: 12, text: '`plt.subplots(2, 2)` creates a 2 × 2 grid. `axes` is then a NumPy array of Axes, indexed `axes[row, col]`.' },
            { lines: '13-14', text: 'A **scatter** plot: one dot per `(x, y)`. It reveals the upward trend and its noise.' },
            { lines: '15-16', text: 'A **histogram** with 20 bins: the bell shape centred near 50.' },
            { lines: '17-18', text: 'A **bar chart** with category names on the x-axis, e.g. players per role.' },
            { lines: '19-21', text: '`imshow` draws a grid of numbers as coloured cells; the colour bar explains the scale. A strong diagonal (50, 45, 44) means most predictions are right.' },
            { lines: '22-24', text: '`tight_layout()` stops titles overlapping, and `savefig` writes the image. The figure has 5 axes: four plots plus the colour bar, which is an Axes of its own.' },
          ],
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Seeing a fit: error as a picture',
      blocks: [
        {
          type: 'p',
          text: 'You cannot display an image inside the app’s Python runner, but you *can* explore relationships interactively with the graph below. The five points are noisy measurements; drag the sliders to place a line `y = m·x + b` and watch the **mean squared error** (the average squared vertical gap between the line and the points). Making that number small is exactly what linear regression, and later every learning algorithm, does automatically.',
        },
        {
          type: 'graph',
          caption: 'Fit a line by hand. The error readout is the mean squared error of the line over the five points. The best line (found by least squares) is close to slope 1.99 and intercept 0.05; try to match it.',
          x: [0, 6],
          y: [0, 12],
          functions: [{ expr: 'm*x+b', label: 'y = m·x + b', color: 'red' }],
          points: [
            { x: 1, y: 2.1, color: 'blue' },
            { x: 2, y: 3.9, color: 'blue' },
            { x: 3, y: 6.2, color: 'blue' },
            { x: 4, y: 7.8, color: 'blue' },
            { x: 5, y: 10.1, color: 'blue' },
          ],
          sliders: [
            { name: 'm', min: 0, max: 4, step: 0.05, value: 1, label: 'slope m' },
            { name: 'b', min: -2, max: 4, step: 0.05, value: 0, label: 'intercept b' },
          ],
          readouts: [
            { label: 'mean squared error', expr: '((m*1+b-2.1)^2+(m*2+b-3.9)^2+(m*3+b-6.2)^2+(m*4+b-7.8)^2+(m*5+b-10.1)^2)/5', digits: 3 },
          ],
          height: 340,
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Plot your data before you model it',
          text: 'Draw a histogram of each feature and a scatter of the key pairs *before* training anything. You will spot skewed features (consider a log transform), constant columns, impossible values, class imbalance and leakage (a feature that predicts the label too perfectly). Ten minutes of plotting routinely saves days of debugging a model that was never going to work.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If the training loss keeps falling while the validation loss rises, the model is overfitting.',
      answer: true,
      explanation: 'True. The model is getting better at the examples it has seen and worse on new data: it is memorizing noise. Fixes include early stopping, more data, data augmentation, a smaller model, dropout or weight decay (regularization).',
    },
    {
      kind: 'concept',
      title: 'Preparing data for plotting: histograms and smoothing',
      blocks: [
        {
          type: 'p',
          text: 'A plot is just numbers drawn on a canvas, and you often need the numbers themselves. A histogram, for example, is a *table of counts*: split the range into equal **bins** and count how many values land in each. `np.histogram(values, bins=..., range=...)` returns the counts and the bin **edges** (one more edge than bins). The runnable example below prints the table as a text bar chart, so you can see a distribution without any graphics.',
        },
        {
          type: 'code',
          title: 'text_histogram.py',
          runnable: true,
          packages: ['numpy'],
          code: `import random
import numpy as np

rng = random.Random(3)
scores = [rng.gauss(50, 10) for _ in range(200)]
counts, edges = np.histogram(scores, bins=8, range=(10, 90))
for c, lo in zip(counts, edges[:-1]):
    print(f"{lo:4.0f}+ | {'#' * (int(c) // 4):<20} {int(c)}")
print(int(counts.sum()), len(edges))`,
          output: `  10+ |                      1
  20+ | ##                   9
  30+ | #####                22
  40+ | ##################### 85
  50+ | ###############      61
  60+ | ####                 18
  70+ | #                    4
  80+ |                      0
200 9`,
          annotations: [
            { lines: '4-5', text: '200 scores drawn from a normal distribution with mean 50 and standard deviation 10, using a seeded generator so the output is reproducible.' },
            { lines: 6, text: '`np.histogram` with 8 bins over the range 10 to 90 (each bin 10 wide) returns `counts` (8 numbers) and `edges` (9 numbers: each bin’s boundaries).' },
            { lines: '7-8', text: 'One text row per bin: the bin’s lower edge, a bar of `#` characters (one per 4 values) and the count. The bell shape is visible: the middle bins are full, the tails nearly empty.' },
            { lines: 9, text: 'The counts add up to 200, since every value fell inside the range. (Values outside `range` are silently ignored, so always check the total.) There is one more edge than there are bins.' },
          ],
        },
        {
          type: 'p',
          text: 'The other transformation you will use constantly is **smoothing**. Training and reinforcement-learning curves are noisy, because each point comes from one random batch or one random episode. Two simple smoothers: a **moving average** (the mean of the last `k` values) and the **exponential moving average (EMA)**, `s[t] = α·v[t] + (1 − α)·s[t−1]`, which weights recent values more and needs no window. TensorBoard’s smoothing slider is an EMA.',
        },
        {
          type: 'code',
          title: 'smoothing.py',
          runnable: true,
          code: `def ema(values, alpha):
    smooth = [values[0]]
    for v in values[1:]:
        smooth.append(alpha * v + (1 - alpha) * smooth[-1])
    return smooth

noisy = [10, 20, 10, 20, 10, 20]
print([round(s, 2) for s in ema(noisy, 0.5)])
print([round(s, 2) for s in ema(noisy, 0.1)])
print(ema([5, 5, 5], 0.3))`,
          output: `[10, 15.0, 12.5, 16.25, 13.12, 16.56]
[10, 11.0, 10.9, 11.81, 11.63, 12.47]
[5, 5.0, 5.0]`,
          annotations: [
            { lines: '1-5', text: 'Exponential smoothing in five lines: start from the first value, then blend each new value with the previous smoothed one. `alpha` is the weight of the new value.' },
            { lines: 8, text: 'With `alpha = 0.5` the smoothed curve still zig-zags but with less amplitude: it reacts quickly.' },
            { lines: 9, text: 'With `alpha = 0.1` it is much smoother (it hovers near the mean of 15) but lags behind real changes. Small `alpha` means more smoothing and more delay.' },
            { lines: 10, text: 'A constant signal stays constant: smoothing must not invent trends.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Smoothing and scales can mislead',
          text: 'Always show the raw curve faintly *behind* the smoothed one, so you can see the real noise. For RL, plot the mean and spread over several seeds (a shaded band) rather than one lucky run. Use a log scale (`ax.set_yscale("log")`) when values span orders of magnitude, such as losses falling from 100 to 0.01. And beware of truncated y-axes in bar charts: starting at 90% instead of 0 makes small differences look huge.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the matplotlib setup for one figure with one plot, drawing on the Axes object.',
      template: `fig, ax = plt.___(figsize=(6, 4))
ax.___(epochs, loss)`,
      templateIsCode: true,
      blanks: [{ answers: ['subplots'] }, { answers: ['plot'] }],
      wordBank: ['subplots', 'plot', 'figure', 'scatter'],
      explanation: '`plt.subplots()` returns the Figure and Axes; `ax.plot(x, y)` draws a line. `scatter` would draw unconnected dots, which is not the right choice for a curve over epochs.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `values = [10, 20, 30]
s = values[0]
out = [s]
for v in values[1:]:
    s = 0.5 * v + 0.5 * s
    out.append(s)
print(out)`,
      answer: '[10, 15.0, 22.5]',
      hint: 'Each new value is the average of the incoming value and the previous smoothed value. The first element stays an `int`.',
      explanation: 'The first element is the original `10` (an int). Then `0.5·20 + 0.5·10 = 15.0` and `0.5·30 + 0.5·15 = 22.5`. Floats appear once the arithmetic uses `0.5`.',
    },
    {
      kind: 'error',
      prompt: 'This code should plot the loss over three epochs but raises a `ValueError`. Tap the faulty line.',
      lines: [
        'import matplotlib.pyplot as plt',
        'fig, ax = plt.subplots()',
        'ax.plot([1, 2, 3], [0.9, 0.5])',
        'ax.set_title("loss")',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`plot` needs one y value for every x value: here 3 epochs but only 2 losses, so matplotlib raises "x and y must have same first dimension". Mismatched lengths are the commonest plotting bug, often because a metric was logged less often than the epoch counter.',
    },
    {
      kind: 'numeric',
      prompt: '`np.histogram(values, bins=10)` is called. How many bin **edges** does it return?',
      answer: '11',
      hint: 'Ten bins sit between the edges, like ten fence panels between the posts.',
      explanation: 'N bins need N + 1 edges: every bin has a left edge and the last bin also has a right edge. That is why code pairs `counts` with `edges[:-1]` (left edges).',
      label: 'Edges:',
    },
    {
      kind: 'code',
      prompt: 'Write `histogram_counts(values, bins, lo, hi)` returning a **list of integer counts**, one per equal-width bin covering the range from `lo` to `hi`. Values outside the range are ignored, and a value exactly equal to `hi` belongs to the **last** bin (as in `np.histogram`).',
      starter: `import numpy as np

def histogram_counts(values, bins, lo, hi):
    ...
`,
      solution: `import numpy as np


def histogram_counts(values, bins, lo, hi):
    counts, _ = np.histogram(values, bins=bins, range=(lo, hi))
    return [int(c) for c in counts]
`,
      tests: `import numpy as np

assert histogram_counts([1, 2, 3, 4], 2, 0, 4) == [1, 3]
assert histogram_counts([0, 1, 1, 2, 9], 3, 0, 9) == [4, 0, 1]
assert histogram_counts([5, 5, 5], 5, 0, 10) == [0, 0, 3, 0, 0]
assert histogram_counts([-5, 100, 3], 2, 0, 10) == [1, 0]
assert histogram_counts([], 3, 0, 1) == [0, 0, 0]
assert histogram_counts([10, 10], 2, 0, 10) == [0, 2]

res = histogram_counts(np.array([0.5, 1.5, 2.5, 2.6]), 3, 0.0, 3.0)
assert res == [1, 1, 2]
assert all(type(c) is int for c in res)
assert len(histogram_counts(list(range(100)), 7, 0, 100)) == 7
assert sum(histogram_counts(list(range(100)), 7, 0, 99)) == 100`,
      packages: ['numpy'],
      checks: ['Returns exactly one integer count per bin, as a plain list', 'Ignores values outside the range', 'A value equal to `hi` is counted in the last bin'],
      hint: '`np.histogram(values, bins=bins, range=(lo, hi))` returns `(counts, edges)`. Convert the counts to a list of Python ints.',
      explanation: 'Plotting libraries do exactly this before drawing the bars. Knowing the counts yourself lets you check class balance in text, log it, or compare two distributions numerically.',
    },
    {
      kind: 'code',
      prompt: 'Write `moving_average(values, window)` returning a list with the mean of every run of `window` consecutive values (so `len(values) - window + 1` numbers, "valid" windows only). If `window` is larger than the list, return an empty list.',
      starter: `def moving_average(values, window):
    ...
`,
      solution: `def moving_average(values, window):
    out = []
    for i in range(len(values) - window + 1):
        out.append(sum(values[i:i + window]) / window)
    return out
`,
      tests: `def close(a, b):
    return len(a) == len(b) and all(abs(x - y) < 1e-9 for x, y in zip(a, b))

assert close(moving_average([1, 2, 3, 4, 5], 2), [1.5, 2.5, 3.5, 4.5])
assert close(moving_average([1, 2, 3, 4, 5], 3), [2.0, 3.0, 4.0])
assert close(moving_average([4, 4, 4], 3), [4.0])
assert close(moving_average([10, 20], 1), [10.0, 20.0])
assert moving_average([1, 2], 5) == []
assert moving_average([], 2) == []
vals = [3, 1, 4, 1, 5]
moving_average(vals, 2)
assert vals == [3, 1, 4, 1, 5]
assert len(moving_average(list(range(100)), 10)) == 91`,
      checks: ['Each output is the mean of `window` consecutive inputs', 'The result has `len(values) - window + 1` entries (empty if the window is too large)', 'Does not modify the input list'],
      hint: 'Loop `i` over the start of each window: `range(len(values) - window + 1)`. The window is `values[i:i + window]`; take its sum and divide by `window`.',
      explanation: 'The moving average is the simplest smoother; the output is shorter than the input because the first `window - 1` points lack a full window. (NumPy can do it faster with `np.convolve(values, np.ones(window) / window, "valid")`.)',
    },
    {
      kind: 'code',
      prompt: 'Write `ema(values, alpha)` returning the exponentially smoothed list: the first output equals the first input, and then `s[t] = alpha * values[t] + (1 - alpha) * s[t-1]`. An empty input gives an empty list.',
      starter: `def ema(values, alpha):
    ...
`,
      solution: `def ema(values, alpha):
    smooth = []
    for v in values:
        if smooth:
            smooth.append(alpha * v + (1 - alpha) * smooth[-1])
        else:
            smooth.append(v)
    return smooth
`,
      tests: `def close(a, b):
    return len(a) == len(b) and all(abs(x - y) < 1e-9 for x, y in zip(a, b))

assert close(ema([10, 20, 30], 0.5), [10, 15.0, 22.5])
assert close(ema([10, 20, 10, 20], 1.0), [10, 20, 10, 20])
assert close(ema([10, 20, 10, 20], 0.0), [10, 10, 10, 10])
assert close(ema([5, 5, 5], 0.3), [5, 5, 5])
assert close(ema([1], 0.9), [1])
assert ema([], 0.5) == []
vals = [1.0, 2.0, 3.0]
res = ema(vals, 0.5)
assert vals == [1.0, 2.0, 3.0] and res is not vals
assert close(ema([0, 10], 0.1), [0, 1.0])`,
      checks: ['The first value is kept unchanged', 'Each later value blends the new value (weight `alpha`) with the previous smoothed value', 'Handles an empty list and does not modify its input'],
      hint: 'Keep a result list. For the first value append it unchanged; afterwards append `alpha * v + (1 - alpha) * smooth[-1]`.',
      explanation: '`alpha = 1` means no smoothing (the output equals the input) and `alpha = 0` freezes the first value; useful values are in between. Optimizers such as Adam use the same exponential average for their gradient statistics, so this little function reappears later in the course.',
    },
  ],
  takeaways: [
    'matplotlib draws on **Axes** inside a **Figure**: `fig, ax = plt.subplots()`, then `ax.plot / scatter / hist / bar / imshow`, always with axis labels and a title. Save with `fig.savefig(...)`; use the `Agg` backend on machines without a display.',
    'Pick the plot from the question: line for change over time, scatter for relationships, histogram for distributions, bar for categories, heatmap for grids such as confusion matrices.',
    '**Learning curves** (training and validation loss per epoch) diagnose training: both flat and high is underfitting, a rising validation loss is overfitting, wild or `nan` values mean a learning rate that is too high.',
    'A histogram is just counts per bin (`np.histogram`: N bins, N + 1 edges). Smooth noisy curves with a moving average or an exponential moving average, but keep the raw data visible.',
    'Plot data **before** modelling to catch skew, outliers, imbalance and leakage, and report mean and spread over several seeds rather than a single run.',
  ],
  reading: [
    { title: 'matplotlib Quick Start Guide', url: 'https://matplotlib.org/stable/users/explain/quick_start.html', source: 'docs', note: 'The official introduction to figures, axes and the explicit (object-oriented) style.' },
    { title: 'matplotlib plot gallery', url: 'https://matplotlib.org/stable/gallery/index.html', source: 'docs', note: 'Hundreds of examples with code: find a plot you like and adapt it.' },
    { title: 'Ten Simple Rules for Better Figures', url: 'https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1003833', source: 'article', note: 'Short, practical advice on making figures that communicate honestly.' },
    { title: 'seaborn tutorial', url: 'https://seaborn.pydata.org/tutorial.html', source: 'tutorial', note: 'A higher-level statistical plotting library built on matplotlib, pleasant for exploring DataFrames.' },
  ],
};
