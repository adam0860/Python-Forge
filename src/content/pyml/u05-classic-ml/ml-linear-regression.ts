import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-linear-regression',
  title: 'Linear Regression',
  summary: 'Your first real model. Fit a line to data with least squares, measure it with MSE and R², then learn the same line by gradient descent, which is exactly how neural networks learn.',
  minutes: 22,
  objectives: [
    'Describe linear regression as a weighted sum plus a bias and fit it with least squares',
    'Compute mean squared error and R² and interpret them',
    'Derive the gradients of the MSE and train a line with gradient descent',
    'Use scikit-learn’s LinearRegression with several features',
    'Recognize when a linear model underfits and how extra features can help',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The model: a weighted sum, fitted by least squares',
      blocks: [
        {
          type: 'p',
          text: '**Supervised learning** (see the landscape unit) learns a function from examples with known answers. When the answer is a *number* (damage dealt, price, time to finish a level) it is a **regression** problem, and the simplest model for it is **[[linear-regression|linear regression]]**: predict a weighted sum of the features plus a constant, `ŷ = w₁x₁ + w₂x₂ + … + b`. With one feature this is the line `ŷ = w·x + b`. The weights `w` say how much each feature moves the prediction and the bias `b` is the prediction when every feature is 0.',
        },
        {
          type: 'p',
          text: 'To choose `w` and `b` we need to say what a good line is. The standard measure is the **[[mean-squared-error|mean squared error]]**: the average of the squared gaps between the predictions and the true values. Squaring makes every gap positive and punishes big misses far more than small ones. The line that minimizes it is the **least-squares** fit, which NumPy finds directly. A second number, **[[r-squared|R²]]**, puts the score on an easy scale: it is the fraction of the variation in `y` that the model explains (1 is perfect, 0 is no better than always predicting the average).',
        },
        {
          type: 'math',
          tex: '\\text{MSE} = \\frac{1}{n}\\sum_{i=1}^{n}\\left(\\hat y_i - y_i\\right)^2, \\qquad R^2 = 1 - \\frac{\\sum_i (y_i - \\hat y_i)^2}{\\sum_i (y_i - \\bar y)^2}',
          caption: 'Mean squared error, and R² as one minus the model’s squared error relative to the squared error of always predicting the mean ȳ.',
        },
        {
          type: 'code',
          title: 'fit_damage.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

level = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
damage = np.array([12.0, 17.0, 21.0, 29.0, 32.0, 38.0])
X = np.column_stack([level, np.ones_like(level)])
(w, b), *_ = np.linalg.lstsq(X, damage, rcond=None)
pred = w * level + b
mse = np.mean((damage - pred) ** 2)
ss_res = np.sum((damage - pred) ** 2)
ss_tot = np.sum((damage - damage.mean()) ** 2)
print(round(w, 3), round(b, 3))
print(round(mse, 3), round(1 - ss_res / ss_tot, 4))
print(round(w * 10 + b, 1))`,
          output: `5.229 6.533
0.737 0.9908
58.8`,
          annotations: [
            { lines: '3-4', text: 'Six measurements: a weapon’s level and the damage it did. The relationship is roughly linear but noisy.' },
            { lines: '5-6', text: 'Least squares exactly as in the NumPy lesson: a design matrix with a column of ones for the bias, solved by `lstsq`. The result is `w = 5.229` damage per level and `b = 6.533`.' },
            { lines: 7, text: 'The fitted line’s predictions for every training point.' },
            { lines: 8, text: 'MSE: the mean of the squared gaps. 0.737 means a typical miss of about √0.737 ≈ 0.86 damage.' },
            { lines: '9-10', text: '`ss_res` is the squared error left over by the model; `ss_tot` is the squared error of the dumbest predictor, the mean.' },
            { lines: 12, text: 'R² = 1 − ss_res/ss_tot = 0.9908: the line explains 99.1% of the variation in damage.' },
            { lines: 13, text: 'The model can predict for new inputs, here a level-10 weapon (58.8 damage). That is *extrapolation* beyond the data (levels 1 to 6), and it assumes that the straight-line trend continues, which may not be true.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why start with a straight line?',
          text: 'Linear regression is fast, needs no tuning and is easy to interpret, which makes it the standard **baseline**: before building anything fancy, fit a linear model and note its score. If a neural network cannot clearly beat it, the extra complexity is not earning its keep. And every neuron you build later is exactly a linear regression followed by a non-linearity, so you are learning the building block, not a toy.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'A good R² is not a good model',
          text: 'R² on the **training** data only says how well the line fits the points it has seen. It never decreases when you add features, so it rewards overfitting. Judge a model on held-out data (see the evaluation lesson), plot the **residuals** (actual minus predicted: should look like random scatter, not a curve), and remember that correlation is not causation: a weapon’s level predicting its damage does not mean that nothing else matters.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A regression model has R² = 0 on some data. What does that tell you?',
      options: [
        { text: 'Its predictions are no better than always predicting the average of the target', correct: true, why: 'R² compares the model’s squared error with that of the mean predictor. Zero means they are equal: the model explains none of the variation.' },
        { text: 'All its predictions are exactly zero', why: 'R² is about explained variation, not the size of the predictions. A model can predict large numbers and still have R² of 0.' },
        { text: 'The model is perfect', why: 'A perfect model has R² = 1.' },
        { text: 'The data has no variation', why: 'If the target never varied the denominator of R² would be 0 and R² would be undefined; R² = 0 is a statement about the model.' },
      ],
      explanation: 'R² = 1 means a perfect fit, R² = 0 means no improvement over predicting the mean, and R² < 0 means the model is even worse than that, which can happen on test data.',
    },
    {
      kind: 'concept',
      title: 'Learning the line with gradient descent',
      blocks: [
        {
          type: 'p',
          text: 'For a straight line `lstsq` gives the answer in one step, but most models have no such formula. The general method is **gradient descent**: start with a guess for `w` and `b`, compute how the loss changes when each is nudged (its derivative), and step both a little downhill. Doing so for linear regression needs only the chain rule from the calculus lesson. The loss is `L = (1/n) Σ (w·xᵢ + b − yᵢ)²`; differentiate each squared term:',
        },
        {
          type: 'derivation',
          title: 'Gradients of the mean squared error',
          steps: [
            { tex: 'L = \\frac{1}{n}\\sum_i e_i^2, \\qquad e_i = w x_i + b - y_i', why: 'Write the loss in terms of the error of each example, `eᵢ = ŷᵢ − yᵢ`.' },
            { tex: '\\frac{\\partial L}{\\partial e_i} = \\frac{2}{n}\\, e_i', why: 'The power rule on the square. The factor 1/n comes from the mean.' },
            { tex: '\\frac{\\partial e_i}{\\partial w} = x_i, \\qquad \\frac{\\partial e_i}{\\partial b} = 1', why: 'The error depends linearly on `w` (with slope `xᵢ`) and on `b` (with slope 1).' },
            { tex: '\\frac{\\partial L}{\\partial w} = \\frac{2}{n}\\sum_i e_i\\, x_i, \\qquad \\frac{\\partial L}{\\partial b} = \\frac{2}{n}\\sum_i e_i', why: 'The chain rule: multiply the two local slopes and add up over the examples.' },
          ],
          result: 'w \\leftarrow w - \\eta\\,\\frac{2}{n}\\sum_i e_i x_i, \\qquad b \\leftarrow b - \\eta\\,\\frac{2}{n}\\sum_i e_i',
        },
        {
          type: 'code',
          title: 'linear_gd.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

level = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
damage = np.array([12.0, 17.0, 21.0, 29.0, 32.0, 38.0])
w, b, lr = 0.0, 0.0, 0.02
history = []
for step in range(3000):
    err = (w * level + b) - damage
    w -= lr * 2 * np.mean(err * level)
    b -= lr * 2 * np.mean(err)
    if step in (0, 9, 99, 2999):
        history.append(round(float(np.mean(err ** 2)), 2))
print(history)
print(round(w, 3), round(b, 3))`,
          output: `[697.17, 5.02, 1.88, 0.74]
5.229 6.533`,
          annotations: [
            { lines: 5, text: 'Start knowing nothing: `w = 0`, `b = 0`, and a learning rate of 0.02.' },
            { lines: '7-10', text: 'The training loop: compute the errors with the current line (`err`), then update both parameters with the two gradient formulas just derived. Each pass is one **step** of gradient descent over the whole dataset.' },
            { lines: '11-12', text: 'Record the loss at steps 1, 10, 100 and 3000 to watch it fall.' },
            { lines: 13, text: 'The loss drops from 697 (a flat line at zero) to 5.0 after ten steps, 1.9 after a hundred, and 0.74 at the end: a typical learning curve, fast at first then flattening out.' },
            { lines: 14, text: 'The learned line is the least-squares line: `w = 5.229`, `b = 6.533`, matching `lstsq` to three decimals. The loss of a linear model is a smooth bowl with a single minimum, so gradient descent is guaranteed to find the same answer.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'This loop is the heart of deep learning',
          text: 'Replace the line by a neural network with millions of weights, replace the hand-derived gradients by automatic differentiation (`loss.backward()` in PyTorch) and replace the full-dataset average by a small random batch, and you have the training loop of every model in this course. Make sure that you can read this 8-line loop; you will write many of its descendants.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'For linear regression with mean squared error, gradient descent with a small enough learning rate converges to the same line as the least-squares formula.',
      answer: true,
      explanation: 'True. The MSE of a linear model is a convex "bowl" with one global minimum, which least squares finds directly and gradient descent walks toward. (For neural networks the loss is not a simple bowl, and there is no such guarantee.)',
    },
    {
      kind: 'concept',
      title: 'Several features and scikit-learn',
      blocks: [
        {
          type: 'p',
          text: 'Real predictions use many features: here a weapon’s level *and* its armor-piercing rating. The model simply gains one weight per feature, `ŷ = w₁·level + w₂·armor + b`, and the fit is the same least-squares problem with one more column in `X`. In practice you will use **scikit-learn**, the standard library for classic machine learning. Every model there follows the same pattern: create the object, `.fit(X, y)` to learn from data, `.predict(X_new)` to use it and `.score(X, y)` to evaluate it (R² for regressors).',
        },
        {
          type: 'code',
          title: 'sklearn_linear.py',
          runnable: true,
          packages: ['scikit-learn', 'numpy'],
          code: `import numpy as np
from sklearn.linear_model import LinearRegression

level = np.array([1, 2, 3, 4, 5, 6, 7, 8], dtype=float)
armor = np.array([3, 1, 4, 1, 5, 9, 2, 6], dtype=float)
damage = 5 * level + 2 * armor + 10 + np.array([0.5, -0.4, 0.3, -0.2, 0.1, -0.5, 0.4, -0.2])
X = np.column_stack([level, armor])
model = LinearRegression().fit(X, damage)
print(np.round(model.coef_, 2), round(float(model.intercept_), 2))
print(round(model.score(X, damage), 4))
print(np.round(model.predict([[10.0, 5.0]]), 1))`,
          output: `[4.98 1.96] 10.21
0.9995
[69.9]`,
          annotations: [
            { lines: '4-6', text: 'Synthetic data built from a known rule, `damage = 5·level + 2·armor + 10`, plus a little noise, so we can check that the model recovers the rule.' },
            { lines: 7, text: '`X` has one row per example and one column per feature, shape `(8, 2)`: the standard layout of scikit-learn.' },
            { lines: 8, text: '`fit` learns the weights. No loop, no learning rate: for this model scikit-learn uses a least-squares solver.' },
            { lines: 9, text: '`coef_` holds one weight per feature (4.98 and 1.96, close to the true 5 and 2) and `intercept_` is the bias (10.21, close to 10). The trailing underscore marks attributes learned from data.' },
            { lines: 10, text: '`score` returns R² on the data given: 0.9995 here, but on the training data.' },
            { lines: 11, text: '`predict` takes a *2-D* array (a list of examples), even for a single example, and returns one prediction per row: about 69.9 for level 10 and armor 5 (true value 70).' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Scale features when you use gradient descent',
          text: 'The least-squares solvers do not care about feature scales, but **gradient descent does** (see the data-preparation lesson): a feature in the thousands next to one in the single digits makes the loss bowl a narrow valley. Standardize the features before training with gradient descent, and remember that after standardizing, a weight tells you the effect of a one-standard-deviation change, which makes the weights comparable across features.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'When a line is not enough',
      blocks: [
        {
          type: 'p',
          text: 'A linear model can only draw straight lines (or flat planes). If the true relationship curves, the model **[[underfitting|underfits]]**: its error is high even on the training data. The fix is not always a bigger model: often you can **engineer features**. Adding `x²` as an extra input column lets the *same linear machinery* fit a parabola, because the model is linear in its *weights*, not in the raw input. Compare the R² before and after:',
        },
        {
          type: 'code',
          title: 'polynomial_features.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

x = np.linspace(-3, 3, 13)
y = x ** 2 + 2 * x

def r_squared(features, y):
    X = np.column_stack(features + [np.ones_like(x)])
    w, *_ = np.linalg.lstsq(X, y, rcond=None)
    pred = X @ w
    return 1 - np.sum((y - pred) ** 2) / np.sum((y - y.mean()) ** 2)

print(round(r_squared([x], y), 3))
print(round(r_squared([x, x ** 2], y), 3))`,
          output: `0.593
1.0`,
          annotations: [
            { lines: '3-4', text: 'The target is a parabola, `x² + 2x`, which no straight line can follow.' },
            { lines: '6-10', text: 'A reusable helper: stack the given feature columns plus a column of ones, solve least squares and compute R².' },
            { lines: 12, text: 'With only `x` as a feature a straight line captures just 59% of the variation: clear underfitting.' },
            { lines: 13, text: 'Adding the column `x²` lets the linear model represent the parabola exactly, so R² is 1.0 (the data has no noise).' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Feature engineering vs. learned features',
          text: 'Choosing useful inputs by hand (squares, ratios such as `wins / games`, distances, angles) is called **feature engineering**, and it is how classic ML squeezes out performance. Neural networks automate it: their hidden layers *learn* the useful features from raw data. That is why deep learning dominates images, sound and text, where hand-made features are hard to design, but classic models with good features still win on many small tables.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'More features can mean worse generalization',
          text: 'Adding `x²`, `x³`, `x⁴` … keeps lowering the training error, until the curve wiggles through every training point and fails on new ones. That is overfitting, the subject of the next lessons, together with the cure (regularization) and the way to detect it (validation data).',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the two gradient formulas of linear regression inside the training loop.',
      template: `err = (w * x + b) - y
grad_w = 2 * np.mean(err * ___)
grad_b = 2 * np.mean(___)`,
      templateIsCode: true,
      blanks: [{ answers: ['x'] }, { answers: ['err'] }],
      wordBank: ['x', 'err', 'y', 'w'],
      explanation: 'The weight’s gradient multiplies each error by its input (`err * x`), because the weight scales `x`. The bias multiplies the error by 1, so its gradient is just the mean error.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `import numpy as np

y = np.array([2.0, 4.0, 6.0])
pred = np.array([3.0, 4.0, 4.0])
print(np.mean((y - pred) ** 2), np.mean(np.abs(y - pred)))`,
      answer: '1.6666666666666667 1.0',
      hint: 'The errors are 1, 0 and 2. Square them for the first value; take absolute values for the second.',
      explanation: 'The gaps are −1, 0 and 2. Squared they are 1, 0 and 4, whose mean is 5/3 = 1.666…. The absolute values 1, 0 and 2 have mean 1.0. Squaring weighs the large miss (2) much more heavily.',
    },
    {
      kind: 'error',
      prompt: 'This training loop makes the loss grow instead of shrink. Tap the faulty line.',
      lines: [
        'w, b, lr = 0.0, 0.0, 0.01',
        'for _ in range(100):',
        '    err = (w * x + b) - y',
        '    w = w + lr * 2 * np.mean(err * x)',
        '    b = b - lr * 2 * np.mean(err)',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'Gradient descent subtracts the gradient. The update for `w` adds it, so `w` climbs the loss and the line gets worse (while `b`, updated correctly on the next line, tries to compensate). Both updates need the same sign: `w = w - lr * ...`.',
    },
    {
      kind: 'numeric',
      prompt: 'The true values are `[3, 5, 7, 9]` and a model predicts `[2, 5, 8, 9]`. What is the mean squared error?',
      answer: '0.5',
      hint: 'The errors are −1, 0, +1 and 0. Square them, add, and divide by 4.',
      explanation: 'The squared errors are 1, 0, 1 and 0. Their sum is 2 and their mean is 2 / 4 = 0.5.',
      label: 'MSE:',
    },
    {
      kind: 'code',
      prompt: 'Write `mse(y_true, y_pred)` returning the mean squared error of two equal-length sequences as a plain `float`. Raise `ValueError` if their lengths differ.',
      starter: `import numpy as np

def mse(y_true, y_pred):
    ...
`,
      solution: `import numpy as np


def mse(y_true, y_pred):
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    if y_true.shape != y_pred.shape:
        raise ValueError("shapes differ")
    return float(np.mean((y_true - y_pred) ** 2))
`,
      tests: `import numpy as np

assert abs(mse([3, 5, 7, 9], [2, 5, 8, 9]) - 0.5) < 1e-12
assert mse([1.0, 2.0], [1.0, 2.0]) == 0.0
assert abs(mse([2.0, 4.0, 6.0], [3.0, 4.0, 4.0]) - 5 / 3) < 1e-12
assert abs(mse(np.array([0.0, 0.0]), np.array([3.0, 4.0])) - 12.5) < 1e-12
assert type(mse([1], [2])) is float

try:
    mse([1, 2, 3], [1, 2])
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")

a = np.array([1.0, 2.0])
b = np.array([2.0, 4.0])
mse(a, b)
assert a.tolist() == [1.0, 2.0] and b.tolist() == [2.0, 4.0]`,
      packages: ['numpy'],
      checks: ['Averages the squared differences', 'Returns a plain `float`', 'Raises `ValueError` when the lengths differ and leaves the inputs unchanged'],
      hint: 'Convert both inputs with `np.asarray(..., dtype=float)`, check that the shapes match, then compute `np.mean((y_true - y_pred) ** 2)` and wrap it in `float`.',
      explanation: 'Loss functions are the first thing you test in an ML project. Returning a plain float and validating shapes up front catches the classic bug where `(n,)` and `(n, 1)` arrays silently broadcast to an `(n, n)` matrix and give a wrong, plausible-looking number.',
    },
    {
      kind: 'code',
      prompt: 'Write `fit_line_gd(x, y, lr, steps)` that learns `y ≈ w·x + b` by gradient descent on the mean squared error. Start from `w = 0.0` and `b = 0.0` and perform `steps` updates using the full data each step. Return the tuple `(w, b)`.',
      starter: `def fit_line_gd(x, y, lr, steps):
    ...
`,
      solution: `def fit_line_gd(x, y, lr, steps):
    n = len(x)
    w, b = 0.0, 0.0
    for _ in range(steps):
        errors = [w * xi + b - yi for xi, yi in zip(x, y)]
        grad_w = 2 * sum(e * xi for e, xi in zip(errors, x)) / n
        grad_b = 2 * sum(errors) / n
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b
`,
      tests: `w, b = fit_line_gd([1, 2, 3, 4], [3, 5, 7, 9], 0.05, 4000)
assert abs(w - 2.0) < 1e-3 and abs(b - 1.0) < 1e-3

w, b = fit_line_gd([0, 1, 2], [4, 4, 4], 0.1, 3000)
assert abs(w) < 1e-3 and abs(b - 4.0) < 1e-3

assert fit_line_gd([1, 2, 3], [2, 4, 6], 0.1, 0) == (0.0, 0.0)

w, b = fit_line_gd([1, 2, 3, 4], [3, 5, 7, 9], 0.05, 1)
assert abs(w - 1.75) < 1e-9 and abs(b - 0.6) < 1e-9

w, b = fit_line_gd([1.0, 2.0, 3.0, 4.0, 5.0, 6.0], [12.0, 17.0, 21.0, 29.0, 32.0, 38.0], 0.02, 6000)
assert abs(w - 5.2286) < 0.01 and abs(b - 6.5333) < 0.03

xs = [1, 2, 3]
ys = [2, 4, 6]
fit_line_gd(xs, ys, 0.05, 10)
assert xs == [1, 2, 3] and ys == [2, 4, 6]
assert isinstance(fit_line_gd(xs, ys, 0.05, 5), tuple)`,
      checks: ['Starts from `w = 0` and `b = 0` and does exactly `steps` updates', 'Uses the gradients `2/n · Σ err·x` and `2/n · Σ err` and subtracts them', 'Returns the tuple `(w, b)` and does not modify its inputs'],
      hint: 'Inside the loop compute the list of errors `w * xi + b - yi`, then `grad_w = 2 * sum(err * x) / n` and `grad_b = 2 * sum(err) / n`, and subtract `lr` times each.',
      explanation: 'You have just implemented machine learning from scratch: a model (a line), a loss (MSE), gradients (the chain rule) and an update rule (gradient descent). Everything later is this same recipe at a larger scale and with better tooling.',
    },
    {
      kind: 'code',
      prompt: 'Write `r_squared(y_true, y_pred)` returning `1 - SS_res / SS_tot`, where `SS_res` is the sum of squared errors and `SS_tot` the sum of squared distances of `y_true` from its mean. If `SS_tot` is 0 (a constant target), return `1.0` for a perfect prediction and `0.0` otherwise.',
      starter: `import numpy as np

def r_squared(y_true, y_pred):
    ...
`,
      solution: `import numpy as np


def r_squared(y_true, y_pred):
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - y_true.mean()) ** 2)
    if ss_tot == 0:
        return 1.0 if ss_res == 0 else 0.0
    return float(1 - ss_res / ss_tot)
`,
      tests: `import numpy as np

assert abs(r_squared([1, 2, 3, 4], [1, 2, 3, 4]) - 1.0) < 1e-12
assert abs(r_squared([1, 2, 3, 4], [2.5, 2.5, 2.5, 2.5])) < 1e-12
assert abs(r_squared([1, 2, 3], [1, 2, 4]) - 0.5) < 1e-12
assert r_squared([1, 2, 3], [3, 2, 1]) < 0
assert abs(r_squared([12, 17, 21, 29, 32, 38], [11.76, 16.99, 22.22, 27.45, 32.68, 37.91]) - 0.9908) < 1e-3
assert r_squared([5, 5, 5], [5, 5, 5]) == 1.0
assert r_squared([5, 5, 5], [4, 5, 6]) == 0.0
assert type(r_squared([1, 2], [1, 2])) is float

y = np.array([1.0, 2.0, 3.0])
p = np.array([1.5, 2.0, 2.5])
r_squared(y, p)
assert y.tolist() == [1.0, 2.0, 3.0] and p.tolist() == [1.5, 2.0, 2.5]`,
      packages: ['numpy'],
      checks: ['Returns 1.0 for perfect predictions and 0.0 for always predicting the mean', 'Can be negative for predictions worse than the mean', 'Handles a constant target without dividing by zero'],
      hint: 'Compute `ss_res = np.sum((y_true - y_pred) ** 2)` and `ss_tot = np.sum((y_true - y_true.mean()) ** 2)`. Check `ss_tot == 0` before dividing.',
      explanation: 'A negative R² is a useful alarm: the model does worse than the trivial average predictor. This is the function behind `model.score` for regressors in scikit-learn (`sklearn.metrics.r2_score`).',
    },
  ],
  takeaways: [
    '**Linear regression** predicts a weighted sum of features plus a bias. Fit it by minimizing the **mean squared error**, in one step with least squares or iteratively with gradient descent.',
    '**R²** is the fraction of variance explained: 1 is perfect, 0 is no better than the mean, negative is worse. A high training R² alone does not prove a good model.',
    'The MSE gradients are `2/n Σ err·x` for each weight and `2/n Σ err` for the bias. The update `w ← w − η·grad` is the training loop behind all of deep learning.',
    'scikit-learn’s pattern is `fit(X, y)`, `predict(X_new)`, `score(X, y)`, with `X` shaped `(examples, features)`. Learned attributes end with an underscore (`coef_`, `intercept_`).',
    'A line **underfits** curved data; engineered features such as `x²` give a linear model more power. Always start with a simple baseline and compare.',
  ],
  reading: [
    { title: 'scikit-learn: Linear Models', url: 'https://scikit-learn.org/stable/modules/linear_model.html', source: 'docs', note: 'Ordinary least squares and its relatives (ridge, lasso) with the mathematics and caveats.' },
    { title: 'Machine Learning, Andrew Ng: Linear regression and gradient descent', url: 'https://www.coursera.org/learn/machine-learning', source: 'course', note: 'The classic course that popularized exactly this progression from a line to a neural network.' },
    { title: 'The Elements of Statistical Learning, chapter 3: Linear Methods for Regression', url: 'https://hastie.su.domains/ElemStatLearn/', source: 'book', note: 'The rigorous treatment; the PDF is free from the authors.' },
    { title: 'StatQuest: Linear Regression, Clearly Explained', url: 'https://www.youtube.com/watch?v=nk2CQITm_eo', source: 'video', note: 'A friendly visual explanation of least squares and R².' },
  ],
};
