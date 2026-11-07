import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-evaluation',
  title: 'Evaluating Models: Metrics and Cross-Validation',
  summary: 'How do you know a model is good? Learn the confusion matrix, accuracy, precision, recall and F1, why accuracy lies on imbalanced data, how thresholds trade errors against each other, and how cross-validation and baselines keep you honest.',
  minutes: 22,
  objectives: [
    'Build a confusion matrix and compute accuracy, precision, recall and F1 from its counts',
    'Explain why accuracy misleads on imbalanced data and choose a metric to match the cost of mistakes',
    'Show how moving the classification threshold trades precision against recall',
    'Use k-fold cross-validation to estimate performance and its variability',
    'Compare every model with a trivial baseline and avoid tuning on the test set',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The confusion matrix and the four metrics',
      blocks: [
        {
          type: 'p',
          text: 'A model predicts; evaluation counts how it was right and wrong. For a yes/no problem (say, "is this account a cheater?") every prediction falls in one of four boxes of the **[[confusion-matrix|confusion matrix]]**: **true positives** (TP: flagged, and really a cheater), **false positives** (FP: flagged, but innocent), **false negatives** (FN: missed a real cheater) and **true negatives** (TN: correctly left alone). All the usual metrics are ratios of these four counts.',
        },
        {
          type: 'table',
          headers: ['Metric', 'Formula', 'Answers the question', 'Matters most when…'],
          rows: [
            ['[[accuracy]]', '`(TP + TN) / all`', 'How often is the model right?', 'classes are balanced and mistakes cost the same'],
            ['[[precision]]', '`TP / (TP + FP)`', 'Of the ones flagged, how many were real?', 'false alarms are expensive (banning innocent players)'],
            ['[[recall]]', '`TP / (TP + FN)`', 'Of the real ones, how many did we find?', 'misses are expensive (letting cheaters through)'],
            ['[[f1-score|F1]]', '`2PR / (P + R)`', 'A single score balancing precision and recall', 'both kinds of mistake matter and classes are skewed'],
          ],
          caption: 'The four classification metrics. Precision and recall pull in opposite directions.',
        },
        {
          type: 'code',
          title: 'metrics_by_hand.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

y_true = np.array([1] * 10 + [0] * 90)
y_pred = np.array([1] * 6 + [0] * 4 + [1] * 5 + [0] * 85)
tp = int(np.sum((y_pred == 1) & (y_true == 1)))
fp = int(np.sum((y_pred == 1) & (y_true == 0)))
fn = int(np.sum((y_pred == 0) & (y_true == 1)))
tn = int(np.sum((y_pred == 0) & (y_true == 0)))
accuracy = (tp + tn) / len(y_true)
precision = tp / (tp + fp)
recall = tp / (tp + fn)
f1 = 2 * precision * recall / (precision + recall)
print(tp, fp, fn, tn)
print(accuracy, round(precision, 3), recall, round(f1, 3))
print(np.mean(np.zeros(100, dtype=int) == y_true))`,
          output: `6 5 4 85
0.91 0.545 0.6 0.571
0.9`,
          annotations: [
            { lines: '3-4', text: '100 players of whom 10 are cheaters (`1`). The model flags 11: it catches 6 cheaters, misses 4, and wrongly flags 5 innocent players.' },
            { lines: '5-8', text: 'Each box of the confusion matrix is a count of rows where a condition on the prediction and on the truth are both true. `&` combines the two boolean masks; `np.sum` counts the `True`s.' },
            { lines: 9, text: '**Accuracy** = (6 + 85) / 100 = 0.91. It sounds excellent...' },
            { lines: 10, text: '**Precision** = 6 / 11 = 0.545: when the model flags someone, it is right barely half the time.' },
            { lines: 11, text: '**Recall** = 6 / 10 = 0.6: the model finds only 60% of the cheaters.' },
            { lines: 12, text: '**F1** = 0.571, the harmonic mean of the two. It is dragged toward the *lower* of the two numbers, so it cannot hide a weakness.' },
            { lines: 15, text: '...and here is why accuracy alone misleads. A "model" that never flags anyone (all zeros) scores 0.90 accuracy while catching *no one*. With class imbalance, accuracy mostly measures how common the majority class is.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Pick the metric from the cost of each mistake',
          text: 'There is no universally best metric: it depends on what a wrong answer costs. A cancer screen should favour **recall** (a miss is far worse than a false alarm that a second test clears). A system that automatically bans players should favour **precision** (a wrongful ban is costly). F1 is a reasonable default when both matter. Decide this *before* training, with the people who will use the model, and write the metric down.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Regression has its own metrics',
          text: 'For numeric targets use **MAE** (mean absolute error: the typical miss in the target’s own units, robust to outliers), **RMSE** (the square root of MSE: also in the target’s units, but dominated by large misses) and **R²**. As always, compare against a baseline such as "always predict the mean".',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A system automatically bans players it flags as cheaters, and wrongly banning an innocent player is considered very costly. Which metric should you prioritize?',
      options: [
        { text: 'Precision, so that the players who are flagged are very likely to be real cheaters', correct: true, why: 'Precision is the fraction of flagged players that are real cheaters. Maximizing it minimizes false positives, i.e. wrongful bans.' },
        { text: 'Recall, so that no cheater is missed', why: 'Recall protects against *misses*. Here the expensive mistake is a false alarm, so recall alone would encourage banning too many people.' },
        { text: 'Accuracy, because it counts all correct answers', why: 'If cheaters are rare, accuracy hides both kinds of error and says little about wrongful bans.' },
        { text: 'The number of training epochs', why: 'That is a training setting, not an evaluation metric.' },
      ],
      explanation: 'Choose the metric that matches the costly error. Wrongful bans are false positives, which precision measures. In practice you would also look at recall to see how many cheaters escape.',
    },
    {
      kind: 'concept',
      title: 'Thresholds: trading precision for recall',
      blocks: [
        {
          type: 'p',
          text: 'Most classifiers output a *score* or probability, and the **[[classification-threshold|threshold]]** decides what counts as "positive". Lowering it flags more cases: more real positives are found (recall rises) but more false alarms creep in (precision falls). Raising it does the opposite. The threshold is therefore a knob you set according to the costs, not a fixed 0.5.',
        },
        {
          type: 'code',
          title: 'threshold_sweep.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

y_true = np.array([0, 0, 0, 0, 1, 0, 1, 1, 1, 1])
scores = np.array([0.1, 0.2, 0.3, 0.55, 0.4, 0.6, 0.65, 0.7, 0.8, 0.9])
for t in (0.3, 0.5, 0.7):
    pred = (scores >= t).astype(int)
    tp = int(np.sum((pred == 1) & (y_true == 1)))
    fp = int(np.sum((pred == 1) & (y_true == 0)))
    fn = int(np.sum((pred == 0) & (y_true == 1)))
    print(t, "precision", round(tp / (tp + fp), 2), "recall", round(tp / (tp + fn), 2))`,
          output: `0.3 precision 0.62 recall 1.0
0.5 precision 0.67 recall 0.8
0.7 precision 1.0 recall 0.6`,
          annotations: [
            { lines: '3-4', text: 'Ten examples, five of them positive, with the model’s probability for each. The scores are imperfect: a negative scored 0.55 and 0.6, and a positive only 0.4.' },
            { lines: 5, text: 'Try three thresholds.' },
            { lines: 6, text: 'Turn scores into labels: `scores >= t` is a boolean array, `astype(int)` makes it 0/1.' },
            { lines: '7-9', text: 'Count true positives, false positives and false negatives at this threshold.' },
            { lines: 10, text: 'A **low** threshold of 0.3 catches every positive (recall 1.0) but flags many negatives too (precision 0.62). A **high** threshold of 0.7 flags only sure cases (precision 1.0) but misses two of the five positives (recall 0.6). 0.5 sits in between. No threshold gives both perfect numbers, because the model’s scores overlap.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Precision–recall curves and ROC–AUC',
          text: 'Sweeping the threshold across all values and plotting the pairs gives the **precision–recall curve**, and plotting the true-positive rate against the false-positive rate gives the **ROC curve**. The area under the ROC curve (**AUC**) summarizes how well the model *ranks* positives above negatives, independent of any single threshold: 1.0 is perfect, 0.5 is random guessing. scikit-learn provides `roc_auc_score`, `precision_recall_curve` and `roc_curve`. For rare positives, the precision–recall curve is the more informative of the two.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A classifier with 99% accuracy is always a good model.',
      answer: false,
      explanation: 'False. If 99% of the examples are negative, a model that always answers "negative" gets 99% accuracy while never finding a single positive. Always check precision and recall (or the confusion matrix) and compare with a baseline.',
    },
    {
      kind: 'concept',
      title: 'scikit-learn metrics',
      blocks: [
        {
          type: 'p',
          text: 'You rarely code these formulas by hand: `sklearn.metrics` provides `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `confusion_matrix`, `classification_report` (a full per-class table) and, for regression, `mean_squared_error`, `mean_absolute_error` and `r2_score`. Note the argument order: **true labels first, predictions second**. The matrix rows are the true classes and the columns the predicted ones, so for two classes `[[TN, FP], [FN, TP]]`.',
        },
        {
          type: 'code',
          title: 'sklearn_metrics.py',
          runnable: true,
          packages: ['scikit-learn', 'numpy'],
          code: `import numpy as np
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score

y_true = np.array([1] * 10 + [0] * 90)
y_pred = np.array([1] * 6 + [0] * 4 + [1] * 5 + [0] * 85)
print(confusion_matrix(y_true, y_pred))
print(accuracy_score(y_true, y_pred), round(precision_score(y_true, y_pred), 3))
print(recall_score(y_true, y_pred), round(f1_score(y_true, y_pred), 3))`,
          output: `[[85  5]
 [ 4  6]]
0.91 0.545
0.6 0.571`,
          annotations: [
            { lines: 6, text: 'The confusion matrix of the same predictions as before. Row 0 holds the real negatives (85 correct, 5 false alarms) and row 1 the real positives (4 missed, 6 found). The diagonal is the correct answers.' },
            { lines: '7-8', text: 'The library values match the hand-computed ones from the first step: 0.91, 0.545, 0.6 and 0.571. Writing the formulas yourself once is worth it: you now know exactly what the functions mean.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Multi-class and averaging',
          text: 'With more than two classes, precision, recall and F1 are computed per class and then combined: `average="macro"` (every class counts equally, so rare classes matter), `"weighted"` (by class size) or `"micro"` (pooled counts). Report which you used, since the numbers differ a lot on imbalanced data. The confusion matrix is the best way to see *which* classes get mixed up.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Cross-validation and baselines',
      blocks: [
        {
          type: 'p',
          text: 'One train/test split is a single roll of the dice: a lucky or unlucky split can make a model look better or worse than it is, and with small data the test set is tiny. **[[cross-validation|k-fold cross-validation]]** gives a sturdier estimate. Split the data into `k` folds; train on `k − 1` of them and test on the remaining one; repeat so that each fold is the test set once; then look at the `k` scores, their **mean** (the estimate) and their **spread** (how much to trust it). Always compare with a **[[baseline]]**: scikit-learn’s `DummyClassifier` and `DummyRegressor` implement the trivial strategies (most frequent class, the mean).',
        },
        {
          type: 'code',
          title: 'cross_validation.py',
          runnable: true,
          packages: ['scikit-learn', 'numpy'],
          code: `import numpy as np
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_score

x = np.linspace(0, 10, 40)
X = x.reshape(-1, 1)
y = (x > 5).astype(int)
y[[3, 17, 25, 36]] = 1 - y[[3, 17, 25, 36]]
clf = LogisticRegression()
print(np.round(cross_val_score(clf, X, y, cv=KFold(5)), 2))
strat = StratifiedKFold(5, shuffle=True, random_state=0)
scores = cross_val_score(clf, X, y, cv=strat)
base = cross_val_score(DummyClassifier(strategy="most_frequent"), X, y, cv=strat)
print(len(scores), bool(scores.mean() > 0.8), bool(base.mean() < 0.6))
print(round(float(y.mean()), 2))`,
          output: `[0.88 1.   0.62 0.88 0.88]
5 True True
0.5`,
          annotations: [
            { lines: '6-9', text: 'Forty points on a line; the label is 1 for `x > 5`, except that four labels are deliberately flipped to simulate noise. Exactly half the labels are 1.' },
            { lines: 11, text: '`cross_val_score` does the whole loop: split, fit, score, repeat. Plain `KFold(5)` cuts the data into five contiguous blocks. Even so, the five accuracies range from 0.62 to 1.0, a **single split could have told you any of these**. This spread is information.' },
            { lines: '12-13', text: '`StratifiedKFold` keeps each fold’s class proportions equal to the whole dataset, and `shuffle=True` randomizes which examples go where (fix `random_state` for reproducibility). For classification, prefer it.' },
            { lines: 14, text: 'The **baseline**: a classifier that always predicts the most frequent class, evaluated with the same folds.' },
            { lines: 15, text: 'Five scores; the real model’s mean accuracy beats 0.8 while the baseline stays below 0.6. The model beats the trivial answer by a wide margin.' },
            { lines: 16, text: 'The reason the baseline sits near 0.5: the classes are balanced, so always guessing one class is right about half of the time.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Do not tune on the test set',
          text: 'Cross-validation (or a separate validation set) is where you compare models and tune settings such as the threshold or learning rate. The **test set** is looked at once, at the end. Every time you adjust something because of the test score, the test set leaks into your decisions, and your final number becomes optimistic. For time-ordered data, use time-aware splits (`TimeSeriesSplit`) so you never train on the future.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Report mean ± spread, and compare with a baseline',
          text: 'Write results as "F1 0.78 ± 0.04 (5-fold), baseline 0.40". A difference smaller than the spread is likely just noise. In reinforcement learning the same principle applies to *seeds*: report the mean and spread over several training runs rather than the best one.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the formula for recall: of all the real positives, the fraction the model found.',
      template: `recall = tp / (tp + ___)`,
      templateIsCode: true,
      blanks: [{ answers: ['fn'] }],
      wordBank: ['fn', 'fp', 'tn', 'tp'],
      explanation: 'Recall divides the true positives by *all real positives*, which are the found ones (`tp`) plus the missed ones (`fn`). Precision is the one with `fp` in the denominator.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `tp, fp, fn = 8, 2, 4
precision = tp / (tp + fp)
recall = tp / (tp + fn)
print(precision, round(recall, 3), round(2 * precision * recall / (precision + recall), 3))`,
      answer: '0.8 0.667 0.727',
      hint: 'Precision is 8 / 10. Recall is 8 / 12. F1 lies between them, closer to the smaller one.',
      explanation: 'Precision is 8/10 = 0.8 and recall is 8/12 ≈ 0.667. F1 = 2 · 0.8 · 0.667 / (0.8 + 0.667) ≈ 0.727, between the two values but pulled toward the lower one.',
    },
    {
      kind: 'error',
      prompt: 'The goal is an honest estimate of the final model’s performance. Tap the line where the evaluation protocol is broken.',
      lines: [
        'X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)',
        'best_t = max(thresholds, key=lambda t: f1_at(t, X_test, y_test))',
        'final_score = f1_at(best_t, X_test, y_test)',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The threshold is chosen by looking at the **test** set, then the test set is used to report the final score: the number is optimistically biased because the test data influenced a decision. Choose the threshold on a validation split (or by cross-validation on the training data) and use the test set only for the final report.',
    },
    {
      kind: 'numeric',
      prompt: 'A classifier produces TP = 30, FP = 10, FN = 20 and TN = 40. What is its recall, as a percentage?',
      answer: '60',
      hint: 'Recall = TP / (TP + FN).',
      explanation: 'There are 30 + 20 = 50 real positives, and the model found 30 of them: 30 / 50 = 0.6, i.e. 60%. (Precision would be 30 / 40 = 75%, and accuracy 70 / 100 = 70%.)',
      label: 'Recall (%):',
    },
    {
      kind: 'code',
      prompt: 'Write `confusion_counts(y_true, y_pred)` for two sequences of 0/1 labels. Return the tuple `(tp, fp, fn, tn)` of plain integers, where class `1` is "positive".',
      starter: `def confusion_counts(y_true, y_pred):
    ...
`,
      solution: `def confusion_counts(y_true, y_pred):
    tp = fp = fn = tn = 0
    for t, p in zip(y_true, y_pred):
        if p == 1 and t == 1:
            tp += 1
        elif p == 1 and t == 0:
            fp += 1
        elif p == 0 and t == 1:
            fn += 1
        else:
            tn += 1
    return tp, fp, fn, tn
`,
      tests: `assert confusion_counts([1, 0, 1, 0], [1, 0, 0, 1]) == (1, 1, 1, 1)
assert confusion_counts([1, 1, 1], [1, 1, 1]) == (3, 0, 0, 0)
assert confusion_counts([0, 0], [0, 0]) == (0, 0, 0, 2)
assert confusion_counts([1] * 10 + [0] * 90, [1] * 6 + [0] * 4 + [1] * 5 + [0] * 85) == (6, 5, 4, 85)
assert confusion_counts([], []) == (0, 0, 0, 0)
assert confusion_counts((1, 0), (0, 1)) == (0, 1, 1, 0)
res = confusion_counts([1, 0, 1], [1, 1, 0])
assert isinstance(res, tuple) and all(type(v) is int for v in res)
assert sum(confusion_counts([1, 0, 0, 1, 1], [0, 0, 1, 1, 1])) == 5`,
      checks: ['Counts each example in exactly one of the four boxes', 'Returns the tuple `(tp, fp, fn, tn)` in that order, as plain integers', 'Works on lists, tuples and an empty input'],
      hint: 'Loop over `zip(y_true, y_pred)` and use `if`/`elif` on the (prediction, truth) pair to bump the right counter.',
      explanation: 'Every other classification metric is a ratio of these four numbers, so getting them right (and in the right order) is half the job. The four counts always add up to the number of examples, a handy check.',
    },
    {
      kind: 'code',
      prompt: 'Write `precision_recall_f1(y_true, y_pred)` for 0/1 labels (class 1 positive) returning the tuple `(precision, recall, f1)` of floats. If a denominator would be zero (nothing flagged, or no real positives), that metric is `0.0`; F1 is `0.0` when precision plus recall is 0.',
      starter: `def precision_recall_f1(y_true, y_pred):
    ...
`,
      solution: `def precision_recall_f1(y_true, y_pred):
    tp = fp = fn = 0
    for t, p in zip(y_true, y_pred):
        if p == 1 and t == 1:
            tp += 1
        elif p == 1 and t == 0:
            fp += 1
        elif p == 0 and t == 1:
            fn += 1
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return precision, recall, f1
`,
      tests: `def close(a, b):
    return all(abs(x - y) < 1e-9 for x, y in zip(a, b))

y_true = [1] * 10 + [0] * 90
y_pred = [1] * 6 + [0] * 4 + [1] * 5 + [0] * 85
assert close(precision_recall_f1(y_true, y_pred), (6 / 11, 0.6, 2 * (6 / 11) * 0.6 / (6 / 11 + 0.6)))
assert close(precision_recall_f1([1, 1, 0, 0], [1, 1, 0, 0]), (1.0, 1.0, 1.0))
assert precision_recall_f1([1, 1, 0], [0, 0, 0]) == (0.0, 0.0, 0.0)
assert precision_recall_f1([0, 0, 0], [1, 1, 0]) == (0.0, 0.0, 0.0)
assert precision_recall_f1([0, 0], [0, 0]) == (0.0, 0.0, 0.0)
assert close(precision_recall_f1([1, 0, 1, 0], [1, 1, 1, 1]), (0.5, 1.0, 2 / 3))
p, r, f = precision_recall_f1([1, 1, 1, 0], [1, 0, 0, 0])
assert abs(p - 1.0) < 1e-9 and abs(r - 1 / 3) < 1e-9 and abs(f - 0.5) < 1e-9
assert all(type(v) is float for v in precision_recall_f1([1, 0], [1, 0]))`,
      checks: ['Precision is TP/(TP+FP) and recall is TP/(TP+FN)', 'F1 is their harmonic mean `2PR/(P+R)`', 'Returns `0.0` instead of dividing by zero'],
      hint: 'Count `tp`, `fp` and `fn` in a loop. Then guard each division with `... if denominator else 0.0` and compute F1 from the two results.',
      explanation: 'The zero-division guards matter in practice: a model that flags nothing has undefined precision, and scikit-learn warns (`zero_division`) for the same reason. Returning 0.0 is the conservative convention.',
    },
    {
      kind: 'code',
      prompt: 'Write `kfold_indices(n, k)` returning a list of `k` pairs `(train_indices, test_indices)` of lists, using contiguous folds without shuffling. The first `n % k` folds get one extra example, so fold sizes differ by at most 1. Each test fold is a block of consecutive indices, and the train indices are all the others (in order).',
      starter: `def kfold_indices(n, k):
    ...
`,
      solution: `def kfold_indices(n, k):
    base, extra = divmod(n, k)
    folds = []
    start = 0
    for i in range(k):
        size = base + (1 if i < extra else 0)
        test = list(range(start, start + size))
        train = [j for j in range(n) if j < start or j >= start + size]
        folds.append((train, test))
        start += size
    return folds
`,
      tests: `folds = kfold_indices(10, 5)
assert len(folds) == 5
assert [t for _, t in folds] == [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]]
assert folds[0][0] == [2, 3, 4, 5, 6, 7, 8, 9]
assert folds[4][0] == [0, 1, 2, 3, 4, 5, 6, 7]

folds = kfold_indices(10, 3)
assert [len(t) for _, t in folds] == [4, 3, 3]
assert folds[0][1] == [0, 1, 2, 3] and folds[1][1] == [4, 5, 6] and folds[2][1] == [7, 8, 9]

for n, k in [(7, 7), (20, 4), (11, 2), (9, 4)]:
    fs = kfold_indices(n, k)
    assert len(fs) == k
    all_test = sorted(i for _, t in fs for i in t)
    assert all_test == list(range(n))
    for train, test in fs:
        assert set(train).isdisjoint(test)
        assert sorted(train + test) == list(range(n))
        assert train == sorted(train)

assert kfold_indices(2, 2) == [([1], [0]), ([0], [1])]`,
      checks: ['Returns `k` pairs; every index is in exactly one test fold', 'Fold sizes differ by at most 1, the first `n % k` folds being larger', 'Train indices are everything not in the test fold, in ascending order'],
      hint: 'Use `base, extra = divmod(n, k)`. Fold `i` has `base + 1` examples if `i < extra`, otherwise `base`. Track the `start` position as you go.',
      explanation: 'This is `sklearn.model_selection.KFold(k)` without shuffling. Real code usually shuffles (or stratifies) first, because data files are often sorted by class or time, which would make contiguous folds unrepresentative.',
    },
  ],
  takeaways: [
    'The **confusion matrix** (TP, FP, FN, TN) is the raw material: **precision** = TP/(TP+FP), **recall** = TP/(TP+FN), **F1** is their harmonic mean and **accuracy** = (TP+TN)/all.',
    '**Accuracy lies on imbalanced data**: a model that never finds a positive can score 99%. Choose the metric from the cost of each kind of mistake, and decide it before you train.',
    'The **threshold** is a knob: lower it for higher recall and more false alarms, raise it for higher precision and more misses. ROC-AUC and precision–recall curves summarize all thresholds.',
    '**Cross-validation** gives `k` scores: report their mean and spread. Use stratified, shuffled folds for classification and time-aware splits for sequences.',
    'Always compare against a **baseline** (most frequent class, the mean) and never tune on the test set: use validation data or cross-validation to choose, and the test set once to report.',
  ],
  reading: [
    { title: 'scikit-learn: Model evaluation (metrics and scoring)', url: 'https://scikit-learn.org/stable/modules/model_evaluation.html', source: 'docs', note: 'Every metric, with formulas and guidance on when to use which.' },
    { title: 'scikit-learn: Cross-validation', url: 'https://scikit-learn.org/stable/modules/cross_validation.html', source: 'docs', note: 'k-fold, stratified, time-series and grouped splitting explained.' },
    { title: 'Google ML Crash Course: Classification metrics', url: 'https://developers.google.com/machine-learning/crash-course/classification', source: 'course', note: 'Interactive lessons on thresholds, accuracy, precision, recall and ROC/AUC.' },
    { title: 'StatQuest: The Confusion Matrix and Sensitivity/Specificity', url: 'https://www.youtube.com/watch?v=Kdsp6soqA7o', source: 'video', note: 'A patient visual walk-through of the four boxes and the metrics built on them.' },
  ],
};
