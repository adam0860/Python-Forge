import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-overfitting',
  title: 'Overfitting, Regularization and the Bias–Variance Tradeoff',
  summary: 'The central struggle of machine learning: fitting the training data too well. See overfitting happen, learn the bias–variance picture, and fix it with L2/L1 regularization, more data, simpler models and early stopping.',
  minutes: 22,
  objectives: [
    'Recognize underfitting and overfitting from training versus validation error',
    'Explain the bias–variance tradeoff and what controls model complexity',
    'Apply L2 (ridge) and L1 (lasso) regularization and describe how they differ',
    'Choose a regularization strength by validation error',
    'Use early stopping with a patience setting and name other remedies for overfitting',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Overfitting: when memorizing beats learning',
      blocks: [
        {
          type: 'p',
          text: 'The goal of machine learning is **generalization**: doing well on data the model has *never seen*. A model with enough flexibility can drive its training error to zero simply by memorizing the examples, noise included. That is **[[overfitting]]**: excellent on the training data, poor on new data. The opposite failure, **[[underfitting]]**, is a model too simple to capture the real pattern: poor on *both*. Polynomials make the effect easy to see: fit curves of rising degree to twelve noisy samples of a sine wave, and compare the error on the training points with the error on fresh points from the true curve.',
        },
        {
          type: 'code',
          title: 'polynomial_overfit.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

noise = np.array([0.2, -0.3, 0.25, -0.15, 0.3, -0.25, 0.1, -0.3, 0.2, -0.1, 0.25, -0.2])
x_train = np.linspace(0, 1, 12)
y_train = np.sin(2 * np.pi * x_train) + noise
x_test = np.linspace(0.04, 0.96, 12)
y_test = np.sin(2 * np.pi * x_test)

def fit_poly(x, y, degree):
    return np.linalg.lstsq(np.vander(x, degree + 1), y, rcond=None)[0]

def mse(x, y, w):
    return float(np.mean((np.vander(x, len(w)) @ w - y) ** 2))

for degree in (1, 3, 5, 11):
    w = fit_poly(x_train, y_train, degree)
    print(degree, round(mse(x_train, y_train, w), 3), round(mse(x_test, y_test, w), 3))`,
          output: `1 0.293 0.204
3 0.074 0.009
5 0.038 0.008
11 0.0 16.578`,
          annotations: [
            { lines: '3-5', text: 'The training data: a sine wave plus a fixed pattern of noise, twelve points between 0 and 1.' },
            { lines: '6-7', text: 'The test points sit *between* the training points, and their targets are the noise-free sine: the best possible measure of whether the model learned the real pattern.' },
            { lines: '9-10', text: '`np.vander(x, d + 1)` builds the columns `x^d … x^1, 1`, so this is a least-squares fit of a polynomial of the given degree (the feature-engineering trick from the linear regression lesson).' },
            { lines: '12-13', text: 'The mean squared error of a fitted polynomial on any set of points.' },
            { lines: '15-16', text: 'Fit four models and print `degree, training error, test error`.' },
            { lines: 17, text: 'Degree 1 (a straight line) **underfits**: high error on both sets (0.29 and 0.20). Degrees 3 and 5 fit well: both errors are small and similar (the test error 0.009 is the best). Degree 11 passes *exactly* through all twelve noisy points (training error 0.0) but swings wildly between them, so its test error explodes to 16.6, nearly 2000 times worse than degree 3. A perfect training score here is a warning sign, not a success.' },
          ],
        },
        {
          type: 'graph',
          caption: 'The classic picture, stylized. As the model gets more flexible (moving right), the training error (blue) keeps falling, while the validation error (red) falls and then rises again. The best model is at the bottom of the red U, not where the training error is lowest. Left of it the model underfits; right of it, it overfits.',
          x: [0, 12],
          y: [0, 3.2],
          functions: [
            { expr: '3*exp(-0.45*x)+0.1', label: 'training error', color: 'blue' },
            { expr: '3*exp(-0.45*x)+0.1+0.015*x^2', label: 'validation error', color: 'red' },
          ],
          vlines: [{ x: 5.2, label: 'best complexity', color: 'green', dashed: true }],
          height: 320,
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'The gap is the signal',
          text: 'You cannot detect overfitting from the training score. You detect it from the **gap** between the training and the validation score. High error on both: underfitting (use a more flexible model, better features, train longer). Low training error but much higher validation error: overfitting (the rest of this lesson). The learning curves from the visualization lesson show the same thing along the time axis, epoch by epoch.',
        },
        {
          type: 'callout',
          variant: 'analogy',
          title: 'Memorizing the answer sheet',
          text: 'A student who memorizes last year’s exam answers scores 100% on that exam and fails the new one: they learned the *answers*, not the *subject*. Overfitting is the model doing the same thing with its training examples. Validation data is the unseen exam, and regularization is a teacher who says "explain it simply", penalizing needlessly elaborate answers.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'After training, your model scores training error 0.01 but validation error 0.50. What is happening, and what should you try?',
      options: [
        { text: 'It is overfitting: gather more data, simplify the model, add regularization or stop training earlier', correct: true, why: 'A tiny training error with a large validation error is the signature of high variance: the model memorized the training set. All four remedies reduce that.' },
        { text: 'It is underfitting: make the model bigger and train longer', why: 'Underfitting shows up as high error on the *training* data too. Here the training error is already almost zero, so a bigger model would only overfit more.' },
        { text: 'The model is perfect; the validation set must be wrong', why: 'A large gap between training and validation error is the most common real finding in ML, and the validation set is the one telling the truth.' },
        { text: 'The learning rate is exactly right', why: 'The learning rate affects how fast training converges; it does not explain a gap between training and validation performance.' },
      ],
      explanation: 'Compare the two errors. Both high: underfitting. Low on training but high on validation: overfitting. Both low and close: you have a good model. The remedy follows from the diagnosis.',
    },
    {
      kind: 'concept',
      title: 'Bias, variance and the complexity dial',
      blocks: [
        {
          type: 'p',
          text: 'Why does the validation error form a U? Two kinds of error trade off. **Bias** is the error from a model being too simple to represent the truth (a line cannot bend): it is *consistently wrong in the same way*, whatever data it sees. **Variance** is the error from a model being so flexible that it follows the particular noise in its training sample: train it on another sample and you get a very different curve. Simple models have high bias and low variance; flexible models have low bias and high variance. This is the **[[bias-variance-tradeoff|bias–variance tradeoff]]**, and the total error is roughly bias² + variance + irreducible noise.',
        },
        {
          type: 'table',
          headers: ['Symptom', 'Underfitting (high bias)', 'Good fit', 'Overfitting (high variance)'],
          rows: [
            ['Training error', 'high', 'low', 'very low'],
            ['Validation error', 'high (≈ training)', 'low (close to training)', 'high (≫ training)'],
            ['Model', 'too simple for the pattern', 'matches the pattern', 'fits noise too'],
            ['Try', 'more features, a bigger model, less regularization, train longer', 'stop and ship', 'more data, regularization, simpler model, early stopping, dropout, augmentation'],
          ],
          caption: 'Diagnose first, then pick the remedy.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Modern deep learning bends the classic picture',
          text: 'Huge neural networks have far more parameters than training examples and can memorize anything, yet with large data and the right training they often generalize *better* as they grow (“double descent”). The U-curve is still the right mental model for classic ML, and the symptoms (a growing validation gap) and remedies (regularization, more data, early stopping) carry over to deep learning, but the best size is often bigger than the classic picture suggests.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'More data is the most reliable cure for variance',
          text: 'With more examples the noise averages out and memorizing becomes harder than learning the pattern. If you can collect, label or *generate* more data (data augmentation: flipping, cropping or jittering images, adding noise, simulating more game episodes), do so before anything else. In reinforcement learning, the simulator gives you fresh data for free, which is one reason RL agents rarely overfit in the classical sense (although they can overfit to their particular training levels).',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'L1 regularization can drive some weights to exactly zero, while L2 regularization only shrinks weights toward zero without usually making them exactly zero.',
      answer: true,
      explanation: 'True. The L1 penalty (sum of absolute values) has a sharp corner at zero that traps weights there, so it also selects features. The smooth L2 penalty (sum of squares) shrinks all weights smoothly, spreading importance among correlated features.',
    },
    {
      kind: 'concept',
      title: 'Regularization: penalizing complexity',
      blocks: [
        {
          type: 'p',
          text: '**[[regularization|Regularization]]** keeps a flexible model from overfitting by making large weights *expensive*. The idea is to add a penalty to the loss: `loss = error + λ · penalty(weights)`. The strength **λ** (lambda, also written `alpha` in scikit-learn) is a **hyperparameter** you set. With **[[l2-regularization|L2]]** (ridge) the penalty is the sum of squared weights, `λ·Σw²`; with **[[l1-regularization|L1]]** (lasso) it is the sum of absolute values, `λ·Σ|w|`. The bias term is normally left unpenalized. A huge weight is the model’s way of bending the curve to chase a single noisy point, so charging for large weights forces smoother, simpler solutions.',
        },
        {
          type: 'math',
          tex: '\\text{ridge: } \\ L(\\mathbf{w}) = \\frac{1}{n}\\sum_i (\\hat y_i - y_i)^2 + \\lambda \\sum_j w_j^2 \\qquad\\qquad \\hat{\\mathbf{w}} = (X^{\\top}X + \\lambda I)^{-1} X^{\\top} \\mathbf{y} \\ \\text{(centered data)}',
          caption: 'The ridge loss, and its closed-form solution: adding λ to the diagonal also makes the matrix well-conditioned and invertible. (With the 1/n convention for the error the matching constant changes by a factor n; the effect is the same.)',
        },
        {
          type: 'p',
          text: 'Here is ridge regression applied to the degree-9 polynomial from before, with features `x, x², …, x⁹`. Without regularization such a model overfits wildly. Watch what happens to the sum of the absolute weights, the training error and the test error as λ grows:',
        },
        {
          type: 'code',
          title: 'ridge_sweep.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

noise = np.array([0.2, -0.3, 0.25, -0.15, 0.3, -0.25, 0.1, -0.3, 0.2, -0.1, 0.25, -0.2])
x_train = np.linspace(0, 1, 12)
y_train = np.sin(2 * np.pi * x_train) + noise
x_test = np.linspace(0.04, 0.96, 12)
y_test = np.sin(2 * np.pi * x_test)

def features(x, degree=9):
    return np.column_stack([x ** k for k in range(1, degree + 1)])

def ridge(X, y, lam):
    xm, ym = X.mean(axis=0), y.mean()
    Xc = X - xm
    w = np.linalg.solve(Xc.T @ Xc + lam * np.eye(X.shape[1]), Xc.T @ (y - ym))
    return w, ym - xm @ w

Xtr, Xte = features(x_train), features(x_test)
for lam in (1e-3, 1e-2, 1e-1, 1.0, 10.0):
    w, b = ridge(Xtr, y_train, lam)
    train_mse = np.mean((Xtr @ w + b - y_train) ** 2)
    test_mse = np.mean((Xte @ w + b - y_test) ** 2)
    print(lam, round(float(np.abs(w).sum()), 1), round(float(train_mse), 3), round(float(test_mse), 3))`,
          output: `0.001 48.4 0.06 0.007
0.01 13.5 0.132 0.058
0.1 5.3 0.187 0.111
1.0 2.1 0.281 0.222
10.0 0.5 0.416 0.382`,
          annotations: [
            { lines: '9-10', text: 'The feature matrix: columns `x¹ … x⁹`. A flexible model: nine weights for twelve points.' },
            { lines: '12-16', text: 'Closed-form ridge. Centre the data (subtract the column means and the target mean) so that the bias is not penalized, then solve `(XcᵀXc + λI) w = Xcᵀ(y − ȳ)`. The bias is recovered afterwards as `ȳ − x̄·w`.' },
            { lines: 18, text: 'Training and test features for the degree-9 model.' },
            { lines: '19-22', text: 'Each row: λ, the total size of the weights, the training MSE and the test MSE.' },
            { lines: 23, text: 'As λ grows the weights shrink from 48 down to 0.5, and the training error rises steadily (0.06 to 0.42): the model is being held back. The **test** error is best at the *smallest* λ shown here (0.007, versus 16.6 for the unregularized degree-11 fit earlier), then rises again as the model becomes too stiff and underfits. The best λ lies in the middle of the range: you find it by trying several values on validation data.' },
          ],
        },
        {
          type: 'p',
          text: 'In scikit-learn the same ideas are `Ridge(alpha=...)` and `Lasso(alpha=...)`. The difference between them shows when only a few features really matter. Below, six features are available but the target depends on only the first two. Ordinary least squares and ridge keep small non-zero weights on the irrelevant four; lasso sets them to exactly zero, performing **feature selection** as a side effect.',
        },
        {
          type: 'code',
          title: 'ridge_vs_lasso.py',
          runnable: true,
          packages: ['scikit-learn', 'numpy'],
          code: `import numpy as np
from sklearn.linear_model import Lasso, LinearRegression, Ridge

rng = np.random.default_rng(0)
X = rng.normal(size=(40, 6))
y = 3 * X[:, 0] - 2 * X[:, 1] + 0.3 * rng.normal(size=40)
for name, model in [("ols", LinearRegression()), ("ridge", Ridge(alpha=10.0)), ("lasso", Lasso(alpha=0.2))]:
    model.fit(X, y)
    print(name, np.round(model.coef_, 1) + 0.0, int(np.sum(np.abs(model.coef_) > 1e-8)))`,
          output: `ols [ 3.  -2.1  0.1  0.   0.   0. ] 6
ridge [ 2.3 -1.5  0.1 -0.1  0.   0.1] 6
lasso [ 2.8 -1.8  0.  0.  0.  0. ] 2`,
          outputVaries: true,
          annotations: [
            { lines: '4-6', text: 'Forty examples with six random features. The target is `3·x₀ − 2·x₁` plus noise: only two features are truly useful.' },
            { lines: 7, text: 'Three models side by side. `alpha` is the regularization strength (the λ of the formulas).' },
            { lines: 9, text: 'Each line prints the learned weights (rounded) and how many are non-zero. OLS recovers 3 and −2 closely but keeps tiny non-zero weights on the four useless features. **Ridge** shrinks *every* weight toward zero (2.3 and −1.5 instead of 3 and −2). **Lasso** zeroes all four irrelevant weights (only 2 non-zero) while keeping the two real ones, shrunk a little (2.8 and −1.8). The random numbers may differ slightly between NumPy versions, but the pattern holds.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Scale the features before regularizing',
          text: 'The penalty treats all weights alike, but a weight’s size depends on its feature’s units: a feature measured in metres needs a weight 1000 times larger than the same quantity in millimetres, and would be penalized much more. **Standardize the features first** (the data-preparation lesson). And choose λ on validation data: too small does nothing, too large underfits.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Weight decay is the same idea in deep learning',
          text: 'Neural-network optimizers have a `weight_decay` option: it is L2 regularization, shrinking weights a little at every step. Other regularizers you will meet: **dropout** (randomly switching neurons off during training), **data augmentation**, **batch normalization** and **early stopping**, covered next. They all attack variance by making it harder for the model to memorize.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Early stopping and the practical recipe',
      blocks: [
        {
          type: 'p',
          text: 'For models trained by gradient descent there is a cheap, powerful regularizer: **[[early-stopping|early stopping]]**. Watch the validation loss each epoch and stop when it has not improved for a while, keeping the weights from the *best* epoch. You wait for a number of epochs called the **patience**, because the validation loss is noisy and may rise briefly before improving again. Short training acts like a penalty on weight size, since weights start small and grow as training continues.',
        },
        {
          type: 'code',
          title: 'early_stopping.py',
          runnable: true,
          code: `val_losses = [1.00, 0.80, 0.62, 0.55, 0.57, 0.54, 0.56, 0.58, 0.60, 0.59, 0.55]
patience = 3
best, best_epoch, wait = float("inf"), 0, 0
for epoch, loss in enumerate(val_losses):
    if loss < best:
        best, best_epoch, wait = loss, epoch, 0
    else:
        wait += 1
        if wait >= patience:
            print("stop at epoch", epoch)
            break
print("best epoch", best_epoch, "loss", best)`,
          output: `stop at epoch 8
best epoch 5 loss 0.54`,
          annotations: [
            { lines: 1, text: 'A recorded validation curve: it improves, wobbles around epoch 4, bottoms out at epoch 5 (0.54), then drifts upward: the overfitting signature.' },
            { lines: '2-3', text: 'The patience, and the state: the best loss so far, the epoch it happened in, and how many epochs we have waited without improvement.' },
            { lines: '4-6', text: 'Loop over the epochs. A new best resets the waiting counter and remembers the epoch (in a real run, you would also save the model weights here).' },
            { lines: '7-11', text: 'Otherwise count one more epoch without improvement. When the count reaches the **patience** (3), training stops.' },
            { lines: 12, text: 'Stopping happened at epoch 8, and the model to use is the one from epoch 5 (loss 0.54). The late dip to 0.55 at epoch 10 would have been missed, a price of finite patience: a larger patience tolerates more noise but wastes more training.' },
          ],
        },
        {
          type: 'steps',
          items: [
            { title: 'Start simple and measure', text: 'Fit a baseline (a linear model or a small network) and note its training and validation scores.' },
            { title: 'Diagnose with the gap', text: 'Both errors high: underfitting, so add capacity or features. Large gap: overfitting, so continue below.' },
            { title: 'Get more data or augment it', text: 'The most dependable fix for variance. Generate it if you can.' },
            { title: 'Regularize', text: 'Add L2/weight decay (and L1 if you want sparsity), use dropout in networks, and tune the strength on validation data.' },
            { title: 'Simplify or stop early', text: 'Use a smaller model, fewer features or fewer epochs, and keep the best-validation checkpoint.' },
            { title: 'Evaluate once on the test set', text: 'Only after all decisions are made, report the test score a single time.' },
          ],
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the L2-regularized loss: the error plus a penalty on the squared weights, scaled by the strength `lam`.',
      template: `loss = mse + ___ * np.sum(w ** 2)`,
      templateIsCode: true,
      blanks: [{ answers: ['lam', 'lambda_', 'alpha', 'lmbda'] }],
      wordBank: ['lam', 'mse', 'w', 'b'],
      explanation: 'The penalty is `lam * np.sum(w ** 2)`: the strength `lam` (λ) times the sum of squared weights. A larger `lam` makes big weights more expensive and pulls the solution toward simpler models.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `import numpy as np

w = np.array([3.0, -4.0])
lam = 0.5
print(lam * np.sum(w ** 2), lam * np.sum(np.abs(w)))`,
      answer: '12.5 3.5',
      hint: 'L2 squares the weights first (9 and 16); L1 takes absolute values (3 and 4).',
      explanation: 'The L2 penalty is 0.5 · (9 + 16) = 12.5. The L1 penalty is 0.5 · (3 + 4) = 3.5. Large weights are punished far more by L2 because of the squaring.',
    },
    {
      kind: 'error',
      prompt: 'This regularized loss should discourage large weights, but it actually rewards them. Tap the faulty line.',
      lines: [
        'mse = np.mean((X @ w + b - y) ** 2)',
        'penalty = lam * np.sum(w ** 2)',
        'loss = mse - penalty',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The penalty must be **added**: `loss = mse + penalty`. Subtracting it means that the larger the weights, the lower the loss, so optimization pushes the weights to infinity.',
    },
    {
      kind: 'numeric',
      prompt: 'A model has weights `w = [1, 2, 2]` and uses L2 regularization with `λ = 0.1`. What is the penalty term `λ · Σ w²`?',
      answer: '0.9',
      hint: 'Square each weight: 1, 4, 4. Add them up, then multiply by 0.1.',
      explanation: 'The sum of squares is 1 + 4 + 4 = 9, so the penalty is 0.1 × 9 = 0.9.',
      label: 'Penalty:',
    },
    {
      kind: 'code',
      prompt: 'Write `ridge_fit(X, y, lam)` for a 2-D feature array `X` (shape `(n, d)`) and targets `y`. Centre the data, solve `(XcᵀXc + lam·I) w = Xcᵀ(y − ȳ)` with `np.linalg.solve`, and return `(w, b)` where `b = ȳ − x̄·w`. `w` is a NumPy array and `b` a float.',
      starter: `import numpy as np

def ridge_fit(X, y, lam):
    ...
`,
      solution: `import numpy as np


def ridge_fit(X, y, lam):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    xm = X.mean(axis=0)
    ym = y.mean()
    Xc = X - xm
    d = X.shape[1]
    w = np.linalg.solve(Xc.T @ Xc + lam * np.eye(d), Xc.T @ (y - ym))
    b = float(ym - xm @ w)
    return w, b
`,
      tests: `import numpy as np

X = np.array([[1, 2], [2, 1], [3, 5], [4, 3], [5, 8], [6, 4]], dtype=float)
y = 2 * X[:, 0] - X[:, 1] + 3

w, b = ridge_fit(X, y, 0.0)
assert isinstance(w, np.ndarray) and w.shape == (2,)
assert np.allclose(w, [2.0, -1.0], atol=1e-8) and abs(b - 3.0) < 1e-8
assert type(b) is float

w_big, b_big = ridge_fit(X, y, 1e9)
assert np.all(np.abs(w_big) < 1e-3) and abs(b_big - y.mean()) < 1e-3

norms = [np.linalg.norm(ridge_fit(X, y, lam)[0]) for lam in (0.1, 1.0, 10.0, 100.0)]
assert all(a > c for a, c in zip(norms, norms[1:]))

for lam in (0.5, 5.0):
    w, b = ridge_fit(X, y, lam)
    assert abs(np.mean(X @ w + b) - y.mean()) < 1e-9

Xo, yo = X.copy(), y.copy()
ridge_fit(Xo, yo, 1.0)
assert np.array_equal(Xo, X) and np.array_equal(yo, y)
w1, b1 = ridge_fit([[0.0], [1.0], [2.0]], [1.0, 3.0, 5.0], 0.0)
assert abs(w1[0] - 2.0) < 1e-9 and abs(b1 - 1.0) < 1e-9`,
      packages: ['numpy'],
      checks: ['With `lam = 0` it recovers the exact least-squares line; a huge `lam` drives the weights to 0 and `b` to the mean of `y`', 'Larger `lam` gives smaller weights', 'The bias is not penalized, and the inputs are not modified'],
      hint: 'Compute the column means `xm = X.mean(axis=0)` and `ym = y.mean()`, centre `X`, solve the linear system with `lam * np.eye(d)` added to `Xc.T @ Xc`, then `b = ym - xm @ w`.',
      explanation: 'Centering lets the intercept be fitted separately and left unpenalized, which is the standard convention. Notice how little code real regularization needs: one extra term on the diagonal. It also guarantees the system is solvable even when features are strongly correlated.',
    },
    {
      kind: 'code',
      prompt: 'Write `early_stopping_epoch(val_losses, patience)` returning the index of the **best** epoch when early stopping would halt. Walk through the losses; a loss strictly lower than the best so far is an improvement (reset the wait counter). Stop as soon as `patience` epochs in a row have not improved. Raise `ValueError` for an empty list.',
      starter: `def early_stopping_epoch(val_losses, patience):
    ...
`,
      solution: `def early_stopping_epoch(val_losses, patience):
    if not val_losses:
        raise ValueError("no losses")
    best = float("inf")
    best_epoch = 0
    wait = 0
    for epoch, loss in enumerate(val_losses):
        if loss < best:
            best, best_epoch, wait = loss, epoch, 0
        else:
            wait += 1
            if wait >= patience:
                break
    return best_epoch
`,
      tests: `assert early_stopping_epoch([1.0, 0.8, 0.6, 0.7, 0.65, 0.9, 0.5], 3) == 2
assert early_stopping_epoch([1.0, 0.8, 0.6, 0.7, 0.65, 0.9, 0.5], 4) == 6
assert early_stopping_epoch([1.00, 0.80, 0.62, 0.55, 0.57, 0.54, 0.56, 0.58, 0.60, 0.59, 0.55], 3) == 5
assert early_stopping_epoch([3, 2, 1, 0.5], 2) == 3
assert early_stopping_epoch([3, 2, 2.5, 1], 1) == 1
assert early_stopping_epoch([1, 1, 1], 2) == 0
assert early_stopping_epoch([0.7], 5) == 0
assert early_stopping_epoch([1.0, 2.0, 3.0, 0.1], 2) == 0

try:
    early_stopping_epoch([], 3)
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")

losses = [0.9, 0.5, 0.6]
early_stopping_epoch(losses, 2)
assert losses == [0.9, 0.5, 0.6]
assert isinstance(early_stopping_epoch([1.0, 0.9], 1), int)`,
      checks: ['Returns the epoch with the lowest validation loss seen before stopping', 'Stops after `patience` consecutive epochs without a strict improvement (losses seen later are ignored)', 'Raises `ValueError` for an empty list and does not modify the input'],
      hint: 'Track `best`, `best_epoch` and `wait`. On an improvement update all three (with `wait = 0`); otherwise increase `wait` and `break` when it reaches `patience`.',
      explanation: 'This is the logic of `EarlyStopping` callbacks in Keras, PyTorch Lightning and others. Note the subtle case in the first two tests: the same curve gives epoch 2 or epoch 6 depending on the patience, so patience is a hyperparameter to tune (and that late improvement at epoch 6 is the price of a short patience).',
    },
    {
      kind: 'code',
      prompt: 'Write `regularized_mse(X, y, w, b, lam, kind="l2")` returning the mean squared error of the linear model `X @ w + b` plus the penalty: `lam * sum(w**2)` for `kind="l2"` or `lam * sum(abs(w))` for `kind="l1"`. The bias is not penalized. Raise `ValueError` for any other `kind`.',
      starter: `import numpy as np

def regularized_mse(X, y, w, b, lam, kind="l2"):
    ...
`,
      solution: `import numpy as np


def regularized_mse(X, y, w, b, lam, kind="l2"):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    w = np.asarray(w, dtype=float)
    mse = float(np.mean((X @ w + b - y) ** 2))
    if kind == "l2":
        penalty = lam * float(np.sum(w ** 2))
    elif kind == "l1":
        penalty = lam * float(np.sum(np.abs(w)))
    else:
        raise ValueError(f"unknown kind: {kind!r}")
    return mse + penalty
`,
      tests: `import numpy as np

X = [[1, 2], [3, 4]]
y = [1, 2]
w = [2, -1]
assert abs(regularized_mse(X, y, w, 0.5, 0.0) - 0.25) < 1e-12
assert abs(regularized_mse(X, y, w, 0.5, 0.5, "l2") - 2.75) < 1e-12
assert abs(regularized_mse(X, y, w, 0.5, 0.5, "l1") - 1.75) < 1e-12
assert abs(regularized_mse(X, y, w, 0.5, 0.5) - 2.75) < 1e-12
assert abs(regularized_mse(X, y, [0, 0], 0.0, 10.0) - 2.5) < 1e-12

try:
    regularized_mse(X, y, w, 0.5, 1.0, "l3")
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")

base = regularized_mse(np.array(X), np.array(y), np.array(w), 0.5, 0.0)
more = regularized_mse(np.array(X), np.array(y), np.array(w), 0.5, 1.0, "l2")
assert more > base
assert type(regularized_mse(X, y, w, 0.5, 0.1)) is float`,
      packages: ['numpy'],
      checks: ['Adds `lam * sum(w**2)` (L2) or `lam * sum(abs(w))` (L1) to the mean squared error', 'The bias `b` is used in the prediction but not penalized', 'Raises `ValueError` for an unknown `kind` and returns a plain float'],
      hint: 'Compute `mse = np.mean((X @ w + b - y) ** 2)` first. Then choose the penalty with `if kind == "l2": ... elif kind == "l1": ... else: raise ValueError(...)`.',
      explanation: 'This is the objective that ridge and lasso minimize. Because `b` is excluded from the penalty, shifting every prediction by a constant is free, which is what you want: the model should not be punished for the overall level of its output.',
    },
  ],
  takeaways: [
    '**Overfitting** is memorizing noise: very low training error, much higher validation error. **Underfitting** is a model too simple for the pattern: high error on both. Diagnose with the *gap* between training and validation scores.',
    '**Bias** (too simple) and **variance** (too flexible, follows the noise) trade off as complexity grows; the best validation error sits at the bottom of the U, not at zero training error.',
    '**Regularization** adds `λ·penalty(weights)` to the loss. **L2/ridge** (`Σw²`) shrinks all weights smoothly; **L1/lasso** (`Σ|w|`) zeroes some of them (feature selection). Standardize features first and choose λ on validation data.',
    '**Early stopping** halts training when validation loss has not improved for `patience` epochs and keeps the best checkpoint. Other cures: more or augmented data, a simpler model, dropout, weight decay.',
    'Keep the test set untouched until the very end: all tuning (degree, λ, patience) happens on validation data or cross-validation folds.',
  ],
  reading: [
    { title: 'scikit-learn: Underfitting vs. Overfitting', url: 'https://scikit-learn.org/stable/auto_examples/model_selection/plot_underfitting_overfitting.html', source: 'docs', note: 'The polynomial example of this lesson, with plots.' },
    { title: 'scikit-learn: Ridge and Lasso regression', url: 'https://scikit-learn.org/stable/modules/linear_model.html#ridge-regression-and-classification', source: 'docs', note: 'The models, their solvers and how to choose alpha with cross-validation.' },
    { title: 'MLU-Explain: The Bias–Variance Tradeoff', url: 'https://mlu-explain.github.io/bias-variance/', source: 'tutorial', note: 'A beautiful interactive visual explanation.' },
    { title: 'Deep Learning Book (Goodfellow, Bengio, Courville), chapter 7: Regularization', url: 'https://www.deeplearningbook.org/contents/regularization.html', source: 'book', note: 'The full treatment of weight decay, early stopping, dropout and augmentation; free online.' },
  ],
};
