import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-classification',
  title: 'Logistic Regression and Classification',
  summary: 'From predicting numbers to predicting categories. Squash a linear score through the sigmoid to get probabilities, train with cross-entropy loss, read the decision boundary, and extend to many classes.',
  minutes: 22,
  objectives: [
    'Explain how logistic regression turns a weighted sum into a probability with the sigmoid',
    'Describe the decision boundary and the effect of the classification threshold',
    'Compute binary cross-entropy and explain why confident mistakes are punished hard',
    'Train a logistic regression with gradient descent using the gradient (p − y)·x',
    'Use scikit-learn’s LogisticRegression for two or more classes and read predict_proba',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From a score to a probability',
      blocks: [
        {
          type: 'p',
          text: '**Classification** predicts a *category*: will this player quit (yes/no), is this email spam, which of ten digits is in the image. The classic starting point is **[[logistic-regression|logistic regression]]**, and the name is a trap: it is a *classification* model. It begins exactly like linear regression, with a weighted sum `z = w·x + b` (the raw **score**, which can be any number), and then squashes the score through the **[[sigmoid]]** function, `p = 1 / (1 + e^(−z))`, into a number between 0 and 1 that can be read as the probability of the positive class.',
        },
        {
          type: 'graph',
          caption: 'The logistic model for one feature x: probability = sigmoid(w·x + b). The weight w sets how sharply the probability switches, and the bias b slides the switch left or right. The dashed line marks the decision boundary, where the probability is exactly 0.5.',
          x: [-6, 10],
          y: [-0.1, 1.1],
          functions: [{ expr: '1/(1+exp(-(w*x+b)))', label: 'P(class = 1)', color: 'blue' }],
          hlines: [{ y: 0.5, color: 'gray', dashed: true }],
          vlines: [{ x: '-b/w', label: 'boundary', color: 'red', dashed: true }],
          sliders: [
            { name: 'w', min: 0.2, max: 3, step: 0.1, value: 1, label: 'weight w' },
            { name: 'b', min: -9, max: 3, step: 0.1, value: -3, label: 'bias b' },
          ],
          readouts: [
            { label: 'boundary x = −b/w', expr: '-b/w', digits: 2 },
            { label: 'P at x = 4', expr: '1/(1+exp(-(w*4+b)))', digits: 3 },
          ],
          height: 320,
        },
        {
          type: 'p',
          text: 'To get a hard answer, compare the probability with a **[[classification-threshold|threshold]]**, normally 0.5: above it the model says "positive". Since the sigmoid equals 0.5 exactly when its input is 0, the model switches class where `w·x + b = 0`. That set of points is the **[[decision-boundary|decision boundary]]**: a point for one feature, a straight line for two, a flat plane for more. Logistic regression can only separate classes with a straight (flat) boundary; curved boundaries need extra features or a different model (trees, neural networks).',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not just use linear regression on 0/1 labels?',
          text: 'A straight line predicts values below 0 and above 1, which are not probabilities, and a few far-away points can drag the whole line and move the boundary. Squashing through the sigmoid keeps outputs in 0 to 1 and saturates for extreme inputs, so one extreme example cannot dominate. It also pairs with a much better loss function, which is the next topic.',
        },
        {
          type: 'callout',
          variant: 'analogy',
          title: 'A neuron is a logistic regression',
          text: 'A single artificial neuron computes `σ(w·x + b)`: a weighted sum followed by a squashing function. So you are looking at the exact building block of every neural network. A network is many of these stacked in layers, each feeding the next, and its output layer is often just a logistic (or softmax) regression on the learned features.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A logistic model has weight `w = 2` and bias `b = −6` for a single feature `x`. At which `x` does the model predict a probability of exactly 0.5?',
      options: [
        { text: '`x = 3`', correct: true, why: 'The probability is 0.5 where the score is 0: `2x − 6 = 0` gives `x = 3`, which is `−b / w`.' },
        { text: '`x = −3`', why: 'Check the sign: `2·(−3) − 6 = −12`, not 0. The boundary is at `−b / w = 6 / 2 = 3`.' },
        { text: '`x = 6`', why: 'At `x = 6` the score is `2·6 − 6 = 6`, a probability of about 0.998.' },
        { text: '`x = 0.5`', why: '0.5 is the *probability* at the boundary, not the value of `x`.' },
      ],
      explanation: 'The sigmoid is 0.5 exactly when its input is 0. The boundary of a one-feature logistic model is therefore at `x = −b / w`; larger weights make the switch sharper, and the bias moves it.',
    },
    {
      kind: 'concept',
      title: 'Cross-entropy: the right loss for probabilities',
      blocks: [
        {
          type: 'p',
          text: 'Squared error works poorly for probabilities. The loss used for classification is **cross-entropy** (here for two classes, *binary* cross-entropy): if the true class is 1 the loss for the predicted probability `p` is `−ln(p)`, and if the true class is 0 it is `−ln(1 − p)`. In one formula, `L = −[ y·ln p + (1 − y)·ln(1 − p) ]`. It measures how *surprised* the model is by the truth: tiny when it was confident and right, and huge when it was confident and wrong.',
        },
        {
          type: 'graph',
          caption: 'The two halves of binary cross-entropy. If the true class is 1 (blue) the loss falls to 0 as p approaches 1 and shoots up as p approaches 0; if the true class is 0 (red) it is the mirror image. A confident wrong answer costs far more than an unsure one.',
          x: [0, 1],
          y: [0, 5],
          functions: [
            { expr: '-ln(x)', label: 'true class 1: −ln(p)', color: 'blue', domain: [0.007, 1] },
            { expr: '-ln(1-x)', label: 'true class 0: −ln(1−p)', color: 'red', domain: [0, 0.993] },
          ],
          height: 300,
        },
        {
          type: 'code',
          title: 'binary_cross_entropy.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

def bce(p, y):
    p = np.clip(p, 1e-12, 1 - 1e-12)
    return -(y * np.log(p) + (1 - y) * np.log(1 - p))

for p in (0.99, 0.6, 0.5, 0.1, 0.001):
    print(p, round(float(bce(p, 1)), 3), round(float(bce(p, 0)), 3))`,
          output: `0.99 0.01 4.605
0.6 0.511 0.916
0.5 0.693 0.693
0.1 2.303 0.105
0.001 6.908 0.001`,
          annotations: [
            { lines: 4, text: '`np.clip` keeps `p` strictly between 0 and 1. Without it a probability of exactly 0 or 1 would give `log(0) = -inf` and break training with `nan`s. Frameworks add this safety (or compute from the raw score) for you.' },
            { lines: 5, text: 'Binary cross-entropy: only one of the two terms is non-zero for any example, depending on the true label `y`.' },
            { lines: 7, text: 'Try five probabilities the model might assign to class 1, from very confident to very doubtful.' },
            { lines: 8, text: 'Each row shows the probability, the loss if the truth is 1, and the loss if the truth is 0. Reading down: at p = 0.99 and truth 1 the loss is a tiny 0.01, but if the truth had been 0 it would be 4.6. A coin-flip prediction (0.5) always costs 0.693 = ln 2. And at p = 0.001 a wrong answer costs 6.9, nearly 7000 times the loss of a correct one.' },
          ],
        },
        {
          type: 'derivation',
          title: 'The gradient of cross-entropy through a sigmoid',
          steps: [
            { tex: 'z = w x + b,\\quad p = \\sigma(z),\\quad L = -\\big[y\\ln p + (1-y)\\ln(1-p)\\big]', why: 'The model: a score, squashed to a probability, scored with cross-entropy.' },
            { tex: '\\frac{\\partial L}{\\partial p} = -\\frac{y}{p} + \\frac{1-y}{1-p} = \\frac{p - y}{p(1-p)}', why: 'Differentiate the two logarithms and combine the fractions.' },
            { tex: '\\frac{\\partial p}{\\partial z} = p(1-p)', why: 'The sigmoid’s derivative from the calculus lesson.' },
            { tex: '\\frac{\\partial L}{\\partial z} = \\frac{p-y}{p(1-p)}\\cdot p(1-p) = p - y', why: 'The chain rule. The awkward `p(1−p)` factors cancel completely.' },
            { tex: '\\frac{\\partial L}{\\partial w} = (p - y)\\,x, \\qquad \\frac{\\partial L}{\\partial b} = p - y', why: 'Since `z = wx + b`, the weight’s gradient is that error times the input.' },
          ],
          result: '\\nabla_w L = (p - y)\\,x',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'A beautiful coincidence (it is not one)',
          text: 'The gradient is just **prediction minus truth, times the input**, the same form as linear regression’s `(ŷ − y)·x`. This is no accident: sigmoid with cross-entropy (and, later, softmax with cross-entropy) are *matched* so that the awkward terms cancel. It also means a confidently wrong prediction produces a strong gradient (`p − y` close to ±1), so the model corrects its worst mistakes fastest, whereas squared error through a sigmoid would give almost no gradient exactly when the model is most wrong.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Logistic regression is a model for predicting continuous numbers such as prices.',
      answer: false,
      explanation: 'False. Despite its name, logistic regression is a **classification** model: it predicts the probability of a category. For continuous targets you use (linear) regression.',
    },
    {
      kind: 'concept',
      title: 'Training it with gradient descent',
      blocks: [
        {
          type: 'p',
          text: 'Training a logistic regression is the same loop as for linear regression, with the sigmoid and the cross-entropy gradient. Here is the whole algorithm in NumPy on six examples with one feature: low values are class 0 and high ones are class 1. Watch the loss fall and read off the learned boundary.',
        },
        {
          type: 'code',
          title: 'logistic_gd.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

X = np.array([[0.0], [1.0], [2.0], [3.0], [4.0], [5.0]])
y = np.array([0.0, 0.0, 0.0, 1.0, 1.0, 1.0])
w, b, lr = np.zeros(1), 0.0, 0.5
for step in range(2001):
    p = 1 / (1 + np.exp(-(X @ w + b)))
    loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
    if step in (0, 100, 2000):
        print(step, round(float(loss), 3))
    w -= lr * X.T @ (p - y) / len(y)
    b -= lr * np.mean(p - y)
print(round(float(w[0]), 2), round(float(b), 2), round(float(-b / w[0]), 2))
print((p > 0.5).astype(int).tolist(), float(np.mean((p > 0.5) == y)))`,
          output: `0 0.693
100 0.16
2000 0.025
5.12 -12.61 2.46
[0, 0, 0, 1, 1, 1] 1.0`,
          annotations: [
            { lines: '3-4', text: 'A feature matrix `X` of shape `(6, 1)` and labels `y` of 0.0 and 1.0. The classes are separated around x = 2.5.' },
            { lines: 5, text: 'Start at zero weights: every probability is 0.5, so the loss is ln 2 = 0.693 (a coin flip).' },
            { lines: '7-8', text: 'The forward pass: scores `X @ w + b`, squashed to probabilities, then the mean cross-entropy over the examples.' },
            { lines: '9-10', text: 'Print the loss at three moments: it falls from 0.693 to 0.16 after 100 steps and 0.025 after 2000.' },
            { lines: '11-12', text: 'The update, using the gradient just derived: `X.T @ (p - y) / n` is the average of `(p − y)·x` over the examples, a matrix product doing the sum. The bias gradient is the mean of `p − y`.' },
            { lines: 13, text: 'The learned model: weight 5.12 and bias −12.61, so the boundary `−b/w` is at x = 2.46, close to the midpoint 2.5 between the classes. (Because the classes are perfectly separable, the weights would keep growing with more steps to push the probabilities toward 0 and 1; regularization stops this.)' },
            { lines: 14, text: 'Thresholding at 0.5 gives the right class for all six points: an accuracy of 1.0.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Probabilities are the product, not just the label',
          text: 'Keep the probability, not just the yes/no decision. It lets you rank cases (which players are *most* likely to churn), choose a threshold to suit costs (flag at 0.3 when a miss is expensive, at 0.9 when false alarms are), and check **calibration** (when the model says 70%, is it right about 70% of the time?). Models that output only labels throw this information away.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'scikit-learn, thresholds and many classes',
      blocks: [
        {
          type: 'p',
          text: 'With scikit-learn the whole training loop is one call. `LogisticRegression().fit(X, y)` learns from the data (it adds a small amount of L2 regularization by default, and a better optimizer than plain gradient descent), `predict` returns class labels, and `predict_proba` returns the probability of every class: one column per class, each row summing to 1.',
        },
        {
          type: 'code',
          title: 'sklearn_logistic.py',
          runnable: true,
          packages: ['scikit-learn', 'numpy'],
          code: `import numpy as np
from sklearn.linear_model import LogisticRegression

X = np.array([[1, 1], [1, 2], [2, 1], [2, 2], [1.5, 1.5],
              [6, 5], [6, 6], [7, 5], [7, 6], [6.5, 5.5]])
y = np.array([0] * 5 + [1] * 5)
clf = LogisticRegression().fit(X, y)
print(clf.predict([[2, 2], [6, 6], [4, 3.5]]))
print(np.round(clf.predict_proba([[2, 2], [6, 6]])[:, 1], 2))
print(clf.score(X, y), clf.coef_.shape, bool((clf.coef_ > 0).all()))
proba = clf.predict_proba([[4, 3.5]])[0, 1]
print(0.3 < proba < 0.7, int(proba > 0.3), int(proba > 0.7))`,
          output: `[0 1 0]
[0.07 0.97]
1.0 (1, 2) True
True 1 0`,
          annotations: [
            { lines: '4-6', text: 'Two clusters of five points in two dimensions: class 0 near (1.5, 1.5) and class 1 near (6.5, 5.5).' },
            { lines: 7, text: '`fit` learns two weights (one per feature) and a bias.' },
            { lines: 8, text: 'Predictions for a point inside each cluster and one in the middle (4, 3.5). The middle point is assigned to class 0, narrowly.' },
            { lines: 9, text: '`predict_proba(...)[:, 1]` is the probability of class 1: 0.07 for a point in cluster 0 and 0.97 for one in cluster 1. (Default regularization keeps the model from being more extreme than the data justifies.)' },
            { lines: 10, text: '`score` is the accuracy (1.0 on this training data). `coef_` has shape `(1, 2)`: one row for the single decision, one weight per feature; both are positive, since both features increase with the class.' },
            { lines: '11-12', text: 'For the in-between point the probability sits between 0.3 and 0.7, so the *threshold* decides the answer: at 0.3 it would be flagged positive (1), at 0.7 it would not (0). Moving the threshold trades false alarms against misses.' },
          ],
        },
        {
          type: 'p',
          text: 'With **more than two classes** (which of three factions? which of ten digits?) the sigmoid generalizes to **softmax** from the probability lesson: the model has one weight vector per class, computes one score each, and turns all the scores into a probability distribution. The loss is the same cross-entropy, `−ln` of the probability given to the *true* class. scikit-learn handles this automatically, and the shape of `coef_` becomes `(classes, features)`.',
        },
        {
          type: 'code',
          title: 'three_classes.py',
          runnable: true,
          packages: ['scikit-learn', 'numpy'],
          code: `import numpy as np
from sklearn.linear_model import LogisticRegression

centers = np.array([[0.0, 0.0], [6.0, 0.0], [3.0, 6.0]])
offsets = np.array([[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5], [0.0, 0.0]])
X = np.vstack([c + offsets for c in centers])
y = np.repeat([0, 1, 2], 5)
clf = LogisticRegression(max_iter=1000).fit(X, y)
print(X.shape, clf.coef_.shape, clf.score(X, y))
print(clf.predict(centers).tolist())
print(np.round(clf.predict_proba([[3.0, 5.0]]).sum(), 3), int(clf.predict([[3.0, 5.0]])[0]))`,
          output: `(15, 2) (3, 2) 1.0
[0, 1, 2]
1.0 2`,
          annotations: [
            { lines: '4-7', text: 'Three tight clusters of five points around three centres, with labels 0, 1 and 2. `np.vstack` stacks the three groups into one array of shape `(15, 2)`.' },
            { lines: 8, text: '`max_iter=1000` gives the optimizer enough iterations. If scikit-learn warns that it did not converge, raise this or scale the features.' },
            { lines: 9, text: 'The weights now have shape `(3, 2)`: one weight vector per class. Training accuracy is 1.0.' },
            { lines: 10, text: 'The cluster centres are classified as their own classes: `[0, 1, 2]`.' },
            { lines: 11, text: 'For any input the three class probabilities sum to 1.0, and the point (3, 5), near the third cluster, goes to class 2.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Imbalanced classes make accuracy lie',
          text: 'If only 1% of examples are positive (fraud, a rare enemy type, a cheating player), a model that always answers "negative" is 99% accurate and completely useless. With **[[class-imbalance|imbalanced data]]** look beyond accuracy (precision and recall, next lesson), consider class weights (`LogisticRegression(class_weight="balanced")`), resampling and threshold tuning.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the forward pass of logistic regression: the probability from the score `z`.',
      template: `z = X @ w + b
p = 1 / (1 + np.exp(-___))`,
      templateIsCode: true,
      blanks: [{ answers: ['z'] }],
      wordBank: ['z', 'X', 'w', 'p'],
      explanation: 'The sigmoid is applied to the score: `p = 1 / (1 + np.exp(-z))`. It maps any score to a probability between 0 and 1, with `z = 0` giving exactly 0.5.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `import numpy as np

z = np.array([-2.0, 0.0, 2.0])
p = 1 / (1 + np.exp(-z))
print(np.round(p, 2).tolist(), (p > 0.5).tolist())`,
      answer: '[0.12, 0.5, 0.88] [False, False, True]',
      hint: 'The sigmoid is symmetric: `σ(−z) = 1 − σ(z)`, and `σ(0) = 0.5` exactly. Is 0.5 *greater than* 0.5?',
      explanation: '`σ(−2) ≈ 0.12`, `σ(0) = 0.5` and `σ(2) ≈ 0.88`. Comparing with a strict `> 0.5` the middle case is `False`, because 0.5 is not greater than 0.5. Where exactly you place the tie is a convention, which hardly matters for continuous scores.',
    },
    {
      kind: 'error',
      prompt: 'This binary cross-entropy function returns **negative** losses, which is impossible. Tap the faulty line.',
      lines: [
        'import math',
        'def bce(p, y):',
        '    p = min(max(p, 1e-12), 1 - 1e-12)',
        '    return y * math.log(p) + (1 - y) * math.log(1 - p)',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'Logarithms of probabilities are negative (or zero), so the bracket `y·ln p + (1 − y)·ln(1 − p)` is negative. Cross-entropy is the *negative* of it: `return -(y * math.log(p) + ...)`. Forgetting the minus sign makes gradient descent maximize the loss.',
    },
    {
      kind: 'numeric',
      prompt: 'A one-feature logistic model has weight `w = 4` and bias `b = −10`. At which value of `x` is its decision boundary? (Give the number.)',
      answer: '2.5',
      hint: 'Solve `w·x + b = 0` for `x`.',
      explanation: 'The score is zero at `x = −b / w = 10 / 4 = 2.5`. Inputs above 2.5 get a probability above 0.5 and are classified as positive.',
      label: 'Boundary x:',
    },
    {
      kind: 'code',
      prompt: 'Write `sigmoid(z)` for a number **or** a NumPy array, returning `1 / (1 + e^-z)`. It must not overflow for large negative `z`: write it with `np.logaddexp`, as `np.exp(-np.logaddexp(0, -z))`.',
      starter: `import numpy as np

def sigmoid(z):
    ...
`,
      solution: `import numpy as np


def sigmoid(z):
    z = np.asarray(z, dtype=float)
    return np.exp(-np.logaddexp(0, -z))
`,
      tests: `import numpy as np
import warnings

warnings.simplefilter("error")
assert abs(float(sigmoid(0)) - 0.5) < 1e-12
assert abs(float(sigmoid(2.0)) - 0.8807970779778823) < 1e-12
assert abs(float(sigmoid(-2.0)) - 0.11920292202211755) < 1e-12
out = sigmoid(np.array([-1000.0, 0.0, 1000.0]))
assert out.tolist() == [0.0, 0.5, 1.0]
z = np.array([-3.0, -1.0, 0.0, 1.0, 3.0])
assert np.allclose(sigmoid(z) + sigmoid(-z), 1.0)
assert sigmoid(z).shape == (5,)
assert np.all(np.diff(sigmoid(z)) > 0)
assert sigmoid([0.0, 1.0]).shape == (2,)`,
      packages: ['numpy'],
      checks: ['Returns 0.5 at 0 and values symmetric around it (`σ(−z) = 1 − σ(z)`)', 'Handles very large positive and negative scores without overflow warnings', 'Works for scalars, lists and arrays'],
      hint: '`np.logaddexp(0, -z)` computes `log(1 + e^-z)` without overflow. Then `np.exp(-that)` equals `1 / (1 + e^-z)`.',
      explanation: 'A naive `1 / (1 + np.exp(-z))` overflows for `z = -1000` (`exp(1000)` is infinite and NumPy emits a warning). `logaddexp` computes the same value in a numerically stable way. Frameworks use exactly this kind of trick internally.',
    },
    {
      kind: 'code',
      prompt: 'Write `binary_cross_entropy(y_true, p)` returning the **mean** binary cross-entropy as a plain float. Clip the probabilities to `[1e-12, 1 - 1e-12]` before taking logarithms.',
      starter: `import numpy as np

def binary_cross_entropy(y_true, p):
    ...
`,
      solution: `import numpy as np


def binary_cross_entropy(y_true, p):
    y_true = np.asarray(y_true, dtype=float)
    p = np.clip(np.asarray(p, dtype=float), 1e-12, 1 - 1e-12)
    losses = -(y_true * np.log(p) + (1 - y_true) * np.log(1 - p))
    return float(np.mean(losses))
`,
      tests: `import numpy as np
import math

assert abs(binary_cross_entropy([1, 0], [0.5, 0.5]) - math.log(2)) < 1e-12
assert abs(binary_cross_entropy([1], [0.99]) - (-math.log(0.99))) < 1e-12
assert abs(binary_cross_entropy([0], [0.1]) - (-math.log(0.9))) < 1e-12
assert abs(binary_cross_entropy([1, 0, 1], [0.9, 0.2, 0.6]) - (-(math.log(0.9) + math.log(0.8) + math.log(0.6)) / 3)) < 1e-12
perfect = binary_cross_entropy([1, 0], [1.0, 0.0])
assert 0 <= perfect < 1e-9
wrong = binary_cross_entropy([1], [0.0])
assert 20 < wrong < 40 and math.isfinite(wrong)
assert type(binary_cross_entropy([1], [0.5])) is float
assert binary_cross_entropy(np.array([1, 1]), np.array([0.9, 0.7])) < binary_cross_entropy(np.array([1, 1]), np.array([0.6, 0.5]))`,
      packages: ['numpy'],
      checks: ['Averages `-(y·ln p + (1−y)·ln(1−p))` over the examples', 'Clips probabilities so that 0 and 1 never produce infinities', 'Returns a plain float'],
      hint: 'Clip `p` first. Then compute `-(y * np.log(p) + (1 - y) * np.log(1 - p))` for every example and take the mean.',
      explanation: 'Clipping turns a catastrophic `log(0)` into a large but finite penalty (about 27.6), so one overconfident wrong prediction cannot make the entire loss `inf` or `nan`. A perfect model has loss 0; a model that always says 0.5 has 0.693.',
    },
    {
      kind: 'code',
      prompt: 'Write `train_logistic(X, y, lr, steps)` that trains a logistic regression by gradient descent. `X` has shape `(n, d)` and `y` holds 0/1 labels. Start from zero weights `w` (length `d`) and `b = 0.0`, and use the gradients `X.T @ (p - y) / n` and `mean(p - y)`. Return `(w, b)`, with `w` a NumPy array.',
      starter: `import numpy as np

def train_logistic(X, y, lr, steps):
    ...
`,
      solution: `import numpy as np


def train_logistic(X, y, lr, steps):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    n, d = X.shape
    w = np.zeros(d)
    b = 0.0
    for _ in range(steps):
        p = 1 / (1 + np.exp(-(X @ w + b)))
        w = w - lr * X.T @ (p - y) / n
        b = b - lr * np.mean(p - y)
    return w, b
`,
      tests: `import numpy as np

X = [[0], [1], [2], [3]]
y = [0, 0, 1, 1]
w, b = train_logistic(X, y, 0.5, 2000)
assert isinstance(w, np.ndarray) and w.shape == (1,)
p = 1 / (1 + np.exp(-(np.array(X, dtype=float) @ w + b)))
assert ((p > 0.5).astype(int) == np.array(y)).all()
assert w[0] > 0
assert 1.0 < -b / w[0] < 2.0

w0, b0 = train_logistic(X, y, 0.5, 0)
assert w0.tolist() == [0.0] and b0 == 0.0
w1, b1 = train_logistic(X, y, 0.5, 1)
assert abs(w1[0] - 0.25) < 1e-12 and abs(b1) < 1e-12

X2 = [[1, 1], [2, 1], [1, 2], [6, 6], [7, 6], [6, 7]]
y2 = [0, 0, 0, 1, 1, 1]
w2, b2 = train_logistic(X2, y2, 0.3, 3000)
assert w2.shape == (2,) and (w2 > 0).all()
p2 = 1 / (1 + np.exp(-(np.array(X2, dtype=float) @ w2 + b2)))
assert ((p2 > 0.5).astype(int) == np.array(y2)).all()

Xo = np.array([[0.0], [1.0]])
yo = np.array([0.0, 1.0])
train_logistic(Xo, yo, 0.1, 5)
assert Xo.tolist() == [[0.0], [1.0]] and yo.tolist() == [0.0, 1.0]`,
      packages: ['numpy'],
      checks: ['Starts from zeros and applies `steps` full-batch gradient descent updates', 'Uses the gradient `X.T @ (p - y) / n` for the weights and `mean(p - y)` for the bias', 'Returns `(w, b)` with `w` as a NumPy array and does not modify the inputs'],
      hint: 'Inside the loop: `p = 1 / (1 + np.exp(-(X @ w + b)))`, then `w = w - lr * X.T @ (p - y) / n` and `b = b - lr * np.mean(p - y)`. Convert `X` and `y` to float arrays first.',
      explanation: 'This is the entire training algorithm of logistic regression in nine lines, and structurally the same as the training loop of a neural network: forward pass, error signal `p − y`, gradient, update. The next units replace the hand-written gradient by automatic differentiation.',
    },
  ],
  takeaways: [
    '**Logistic regression** is a classifier: a weighted sum `z = w·x + b` squashed by the sigmoid into a probability. It is a single neuron, the building block of neural networks.',
    'The **decision boundary** is where `w·x + b = 0` (a line or plane); the **threshold** (default 0.5) turns probabilities into labels and can be moved to trade false alarms for misses.',
    '**Cross-entropy** loss, `−[y ln p + (1−y) ln(1−p)]`, punishes confident wrong answers severely. Its gradient through the sigmoid simplifies to `(p − y)·x`: the same shape as linear regression.',
    'scikit-learn: `LogisticRegression().fit(X, y)`, `predict`, `predict_proba` (one column per class) and `score` (accuracy). Multiple classes use softmax; weights get shape `(classes, features)`.',
    'Beware of **class imbalance**: accuracy can look excellent for a useless model. Keep the probabilities, tune the threshold, and use better metrics (next lesson).',
  ],
  reading: [
    { title: 'scikit-learn: Logistic regression', url: 'https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression', source: 'docs', note: 'The model, its regularization options and the solvers explained.' },
    { title: 'StatQuest: Logistic Regression', url: 'https://www.youtube.com/watch?v=yIYKR4sgzI8', source: 'video', note: 'A clear, friendly walk-through of the sigmoid, odds and how the fit works.' },
    { title: 'Google ML Crash Course: Logistic regression', url: 'https://developers.google.com/machine-learning/crash-course/logistic-regression', source: 'course', note: 'Short interactive lessons on probabilities, loss and thresholds.' },
    { title: 'Pattern Recognition and Machine Learning (Bishop), chapter 4', url: 'https://www.microsoft.com/en-us/research/publication/pattern-recognition-machine-learning/', source: 'book', note: 'The classic rigorous treatment of linear models for classification; the book is free from the author.' },
  ],
};
