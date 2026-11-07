import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-trees-ensembles',
  title: 'Decision Trees, Random Forests and Gradient Boosting',
  summary: 'The most successful family of models for tabular data: how a tree chooses its questions with Gini impurity, why a single tree overfits, and how bagging (random forests) and boosting (XGBoost-style) turn many weak trees into a strong model.',
  minutes: 22,
  objectives: [
    'Explain how a decision tree splits data and compute Gini impurity by hand',
    'Describe why single deep trees overfit and how depth limits help',
    'Explain bagging and how a random forest reduces variance',
    'Explain gradient boosting as repeatedly fitting trees to residuals, and the role of the learning rate',
    'Choose between trees, forests, boosting and neural networks for a tabular problem',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Decision trees: learning a flowchart',
      blocks: [
        {
          type: 'p',
          text: 'A **[[decision-tree|decision tree]]** is a flowchart of yes/no questions about the features: "is petal width ≤ 0.8?", "is the player’s health below 30?". Each question splits the data in two, the answer sends an example down one branch, and the **leaf** where it ends holds the prediction (the majority class, or the average value for regression). Trees need no feature scaling, handle non-linear relationships and mixed feature types, and are easy to read: it is a model made of if/else statements that the *computer* writes by examining the data.',
        },
        {
          type: 'p',
          text: 'How does it choose its questions? It tries candidate splits and keeps the one that makes the two halves as **pure** as possible, meaning each half is mostly one class. Purity is measured by **[[gini-impurity|Gini impurity]]**: for a node where a fraction `pₖ` of the examples belong to class `k`,',
        },
        {
          type: 'math',
          tex: 'G = 1 - \\sum_k p_k^2 \\qquad\\qquad \\text{split score} = \\frac{n_{\\text{left}}}{n}\\,G_{\\text{left}} + \\frac{n_{\\text{right}}}{n}\\,G_{\\text{right}}',
          caption: 'A pure node (all one class) has G = 0; a 50/50 node of two classes has the maximum G = 0.5. The best split minimizes the size-weighted impurity of its two children.',
        },
        {
          type: 'graph',
          caption: 'Gini impurity of a two-class node as the fraction p of class 1 changes. A pure node (p = 0 or 1) scores 0; an even mix scores the maximum 0.5. Drag p and read the impurity.',
          x: [0, 1],
          y: [0, 0.6],
          functions: [{ expr: '2*x*(1-x)', label: 'Gini impurity', color: 'green' }],
          points: [{ x: 'p', y: '2*p*(1-p)', color: 'red' }],
          sliders: [{ name: 'p', min: 0, max: 1, step: 0.01, value: 0.5, label: 'fraction of class 1 (p)' }],
          readouts: [{ label: 'Gini', expr: '2*p*(1-p)', digits: 3 }],
          height: 280,
        },
        {
          type: 'p',
          text: 'Here is that split search written out by hand for one feature. Eight students studied between 1 and 8 hours and either passed (1) or failed (0). The code tries a threshold halfway between each pair of neighbouring values and scores it:',
        },
        {
          type: 'code',
          title: 'best_split.py',
          runnable: true,
          code: `def gini(labels):
    n = len(labels)
    if n == 0:
        return 0.0
    return 1 - sum((labels.count(c) / n) ** 2 for c in set(labels))

# hours studied -> passed the exam?
hours = [1, 2, 3, 4, 5, 6, 7, 8]
passed = [0, 0, 0, 0, 1, 0, 1, 1]

print("parent gini", round(gini(passed), 3))
best = None
for t in [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5]:
    left = [p for h, p in zip(hours, passed) if h <= t]
    right = [p for h, p in zip(hours, passed) if h > t]
    score = (len(left) * gini(left) + len(right) * gini(right)) / len(passed)
    print(t, round(score, 3))
    if best is None or score < best[1]:
        best = (t, score)
print("best split: hours <=", best[0])`,
          output: `parent gini 0.469
1.5 0.429
2.5 0.375
3.5 0.3
4.5 0.188
5.5 0.367
6.5 0.208
7.5 0.357
best split: hours <= 4.5`,
          annotations: [
            { lines: '1-5', text: 'Gini impurity of a list of labels: one minus the sum of squared class fractions. An empty node counts as pure (0).' },
            { lines: '7-9', text: 'A tiny dataset: hours studied and whether the student passed.' },
            { lines: 11, text: 'Before any split the node holds 3 passes and 5 fails, an impurity of 1 − (0.375² + 0.625²) = 0.469.' },
            { lines: '12-15', text: 'Try each threshold between neighbouring hours, and split the labels into a left group (`≤ t`) and a right group (`> t`).' },
            { lines: 16, text: 'The score is the **weighted average** of the children’s impurities: bigger groups count more.' },
            { lines: '17-19', text: 'Print each score and remember the lowest one with its threshold.' },
            { lines: 20, text: 'The winner is `hours <= 4.5` (impurity 0.188, down from 0.469): everyone below five hours failed, and the rest mostly passed. A real tree repeats exactly this search for *every feature* at *every node*, then recurses on each half until a stopping rule applies.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'A tree is greedy',
          text: 'At each node the tree picks the best split *for that node alone*, never planning ahead. That makes training fast (this is the CART algorithm), but it does not guarantee the best possible tree. It also explains the next problem: left alone, a tree keeps splitting until every leaf is pure.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A node contains 10 training examples, all belonging to the same class. What is its Gini impurity, and will a tree split it further?',
      options: [
        { text: 'Gini = 0: the node is pure, so the tree makes it a leaf', correct: true, why: 'With one class, pₖ = 1 and G = 1 − 1² = 0. There is nothing left to separate, so growing stops here.' },
        { text: 'Gini = 1: maximum impurity, so it is split further', why: 'Gini impurity never reaches 1, and a single class gives the *lowest* value, not the highest.' },
        { text: 'Gini = 0.5: the usual value for any node', why: '0.5 is the maximum for two classes, reached only by an even 50/50 mix.' },
        { text: 'Gini = 0.1: one over the number of examples', why: 'Gini depends on class fractions, not on the number of examples.' },
      ],
      explanation: 'Impurity is 0 for a pure node and largest for an even mix. Tree training keeps splitting nodes that are impure and turns pure ones into leaves.',
    },
    {
      kind: 'concept',
      title: 'Trees in scikit-learn, and why one tree overfits',
      blocks: [
        {
          type: 'p',
          text: 'scikit-learn provides `DecisionTreeClassifier` and `DecisionTreeRegressor`. On the famous iris flower data, using only the two petal measurements, a depth-2 tree finds a short readable rule set and `export_text` prints it:',
        },
        {
          type: 'code',
          title: 'iris_tree.py',
          runnable: true,
          packages: ['scikit-learn'],
          code: `from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, export_text

iris = load_iris()
X, y = iris.data[:, 2:], iris.target
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)

tree = DecisionTreeClassifier(max_depth=2, random_state=0).fit(X_tr, y_tr)
print(export_text(tree, feature_names=["petal length", "petal width"]))
print("train", round(tree.score(X_tr, y_tr), 3), "test", round(tree.score(X_te, y_te), 3))`,
          output: `|--- petal width <= 0.80
|   |--- class: 0
|--- petal width >  0.80
|   |--- petal width <= 1.75
|   |   |--- class: 1
|   |--- petal width >  1.75
|   |   |--- class: 2

train 0.962 test 0.956`,
          outputVaries: true,
          annotations: [
            { lines: '5-6', text: 'The iris data: 150 flowers of three species. We keep columns 2 and 3 (petal length and width) as features.' },
            { lines: 7, text: 'A stratified 70/30 split (the classification lesson) so every species appears in both parts.' },
            { lines: 9, text: '`max_depth=2` limits the tree to two levels of questions: the most important regularization control for trees.' },
            { lines: 10, text: 'The learned rules: setosa is the flowers with petal width ≤ 0.8; among the rest, width ≤ 1.75 means versicolor and larger means virginica. Two questions, three classes.' },
            { lines: 11, text: 'Accuracy of about 96% on both parts: simple, readable and not overfitted.' },
          ],
        },
        {
          type: 'p',
          text: 'The danger appears when you do *not* limit the tree. By default scikit-learn grows it until every leaf is pure, and a leaf can end up holding one single, possibly noisy, example. That is memorization, the overfitting of the previous lesson: tree models have **high variance** (a slightly different training sample produces a quite different tree). The controls are all complexity limits: `max_depth`, `min_samples_leaf` (a leaf must contain at least this many examples), `min_samples_split` and `max_leaf_nodes`; **pruning** removes branches that do not help on validation data.',
        },
        {
          type: 'table',
          headers: ['Strength of a single tree', 'Weakness'],
          rows: [
            ['Readable, can be drawn as a flowchart', 'Unstable: small data changes can change the whole tree'],
            ['No scaling or one-hot trick needed for ordered features; handles interactions', 'Overfits easily unless depth is limited'],
            ['Fast to train and to predict', 'Predicts in steps, so it cannot extrapolate beyond the training range'],
          ],
          caption: 'Trees are a great building block, rarely the final model.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'The fix for variance is averaging',
          text: 'If one tree is noisy but unbiased on average, then the *average of many different trees* is much steadier: the random errors cancel. That is the entire idea behind forests and the reason ensembles win competitions. The only requirement is that the trees differ, so each must be trained a little differently.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A random forest reduces overfitting by training many deep trees on different random samples of the data and averaging (voting on) their predictions.',
      answer: true,
      explanation: 'True. Individually the deep trees have low bias but high variance; averaging a crowd of decorrelated trees keeps the low bias and cancels much of the variance. This is called **bagging** (bootstrap aggregating) plus random feature subsets.',
    },
    {
      kind: 'concept',
      title: 'Random forests: a crowd of different trees',
      blocks: [
        {
          type: 'p',
          text: 'A **[[random-forest|random forest]]** builds many trees and makes them differ in two ways. First, each tree trains on a **bootstrap sample**: `n` examples drawn *with replacement* from the `n` available, so about a third of the data is left out of any one tree and some examples appear twice. Second, at every split the tree may look at only a random subset of the features (for classification typically √d of them), which stops one dominant feature from making all trees look alike. To predict, every tree votes (or, for regression, the predictions are averaged). It is an **[[ensemble]]** of weak-to-moderate learners that is strong together.',
        },
        {
          type: 'code',
          title: 'bagging_by_hand.py',
          runnable: true,
          code: `import random

rng = random.Random(0)
data = list(range(10))
for tree in range(3):
    sample = sorted(rng.choice(data) for _ in data)
    left_out = sorted(set(data) - set(sample))
    print("tree", tree, sample, "left out", left_out)`,
          output: `tree 0 [0, 4, 4, 5, 6, 6, 6, 7, 7, 8] left out [1, 2, 3, 9]
tree 1 [1, 2, 2, 3, 4, 4, 8, 8, 9, 9] left out [0, 5, 6, 7]
tree 2 [1, 1, 1, 2, 4, 5, 5, 7, 8, 9] left out [0, 3, 6]`,
          outputVaries: true,
          annotations: [
            { lines: 3, text: 'A seeded random generator, so the example is repeatable.' },
            { lines: '4-5', text: 'Ten items to sample from, and one loop iteration per tree.' },
            { lines: 6, text: 'The bootstrap sample: ten draws **with replacement**, so some items repeat (in the first tree 6 appears three times and 4 and 7 twice, while 1, 2, 3 and 9 never appear).' },
            { lines: '7-8', text: 'The examples a tree never saw are its **out-of-bag** set. Scoring each example only with the trees that did not train on it gives a free validation estimate (`oob_score=True` in scikit-learn). The exact numbers shown depend on the random stream.' },
          ],
        },
        {
          type: 'p',
          text: 'Now compare a single unlimited tree, a random forest and a gradient-boosted model on the same noisy two-moons problem (two interleaved crescents with a lot of noise, so a perfect training fit must be memorization):',
        },
        {
          type: 'code',
          title: 'compare_trees.py',
          runnable: true,
          packages: ['scikit-learn', 'numpy'],
          code: `from sklearn.datasets import make_moons
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

X, y = make_moons(n_samples=600, noise=0.4, random_state=5)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, random_state=0)
models = {
    "single deep tree": DecisionTreeClassifier(random_state=0),
    "random forest": RandomForestClassifier(n_estimators=200, random_state=0),
    "gradient boosting": GradientBoostingClassifier(n_estimators=100, max_depth=2, random_state=0),
}
for name, model in models.items():
    model.fit(X_tr, y_tr)
    print(f"{name:18s} train {model.score(X_tr, y_tr):.2f} test {model.score(X_te, y_te):.2f}")`,
          output: `single deep tree   train 1.00 test 0.76
random forest      train 1.00 test 0.82
gradient boosting  train 0.91 test 0.85`,
          outputVaries: true,
          annotations: [
            { lines: 6, text: 'Noisy crescent data: 600 points, two classes. `noise=0.4` makes the classes overlap.' },
            { lines: 8, text: 'A dictionary of models to compare with identical data.' },
            { lines: 9, text: 'The default tree: unlimited depth, so it memorizes.' },
            { lines: 10, text: 'A forest of 200 bagged trees, also unlimited in depth.' },
            { lines: 11, text: 'Boosting with 100 *shallow* trees (depth 2); we meet it in the next section.' },
            { lines: '13-14', text: 'Fit each model and print the training and test accuracy.' },
            { lines: 15, text: 'The single tree scores a perfect 1.00 on training but only 0.76 on test: classic overfitting. The forest also memorizes the training set (1.00) yet generalizes better (0.82), because its voters make different mistakes. Boosting does not fit the training set perfectly (0.91) and generalizes best here (0.85). Exact numbers vary with the library version; the ordering is the lesson.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Random forests are the safe default',
          text: 'A forest with default settings is hard to get badly wrong: it needs little tuning (mainly `n_estimators`, more is better until it plateaus, and `max_depth` or `min_samples_leaf`), tolerates unscaled and irrelevant features, handles non-linearities, and gives out-of-bag scores and **feature importances** for free. It is an excellent first model to beat before anything fancier.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the bootstrap sample for bagging: draw `n` indices from the `n` available, **with** replacement.',
      template: `idx = rng.choice(n, size=n, ___=True)`,
      templateIsCode: true,
      blanks: [{ answers: ['replace'] }],
      wordBank: ['replace', 'shuffle', 'p', 'axis'],
      explanation: 'NumPy’s `rng.choice(n, size=n, replace=True)` draws indices with replacement, so some repeat and others are missed. The missed ones are the out-of-bag examples. Without replacement, you would just get a shuffled copy of the whole dataset and every tree would be identical.',
    },
    {
      kind: 'concept',
      title: 'Gradient boosting: each tree fixes the last one’s mistakes',
      blocks: [
        {
          type: 'p',
          text: 'A forest trains its trees *independently* and averages them. **[[gradient-boosting|Gradient boosting]]** trains them **in sequence**, and each new small tree is trained to correct what the ensemble so far still gets wrong. Start with a trivial model (the mean of the targets). Compute the **residuals** (target minus current prediction). Fit a small tree to those residuals. Add a *fraction* of its output to the prediction. Repeat. For squared error the residual is exactly the negative gradient of the loss with respect to the prediction, which is where the name comes from: this is gradient descent, but in the space of functions, taking a small step with every tree.',
        },
        {
          type: 'math',
          tex: 'F_0(x) = \\bar y \\qquad F_m(x) = F_{m-1}(x) + \\eta \\, h_m(x), \\qquad h_m \\ \\text{fit to}\\ \\ r_i = y_i - F_{m-1}(x_i)',
          caption: 'Each round adds a shallow tree h_m, fitted to the current residuals and scaled by the learning rate η (0 < η ≤ 1). Small η with many trees generalizes best.',
        },
        {
          type: 'p',
          text: 'The smallest possible tree is a **stump**: one split. The code below boosts stumps to fit a sine wave, printing the squared error after a few rounds. No library is needed, just NumPy:',
        },
        {
          type: 'code',
          title: 'boosting_by_hand.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

x = np.linspace(0, 6, 60)
y = np.sin(x)

def fit_stump(x, r):
    best = None
    for t in (x[:-1] + x[1:]) / 2:
        left, right = r[x <= t], r[x > t]
        err = ((left - left.mean()) ** 2).sum() + ((right - right.mean()) ** 2).sum()
        if best is None or err < best[0]:
            best = (err, t, left.mean(), right.mean())
    return best[1:]

pred = np.full_like(y, y.mean())
lr = 0.3
for step in range(1, 31):
    t, left_v, right_v = fit_stump(x, y - pred)
    pred = pred + lr * np.where(x <= t, left_v, right_v)
    if step in (1, 5, 10, 30):
        print(step, round(float(np.mean((pred - y) ** 2)), 4))`,
          output: `1 0.2976
5 0.0755
10 0.0426
30 0.0103`,
          annotations: [
            { lines: '3-4', text: 'Target: one period of a sine wave sampled at 60 points. A single split can only draw a two-step staircase, but many steps can approximate the curve.' },
            { lines: '6-13', text: '`fit_stump` tries every threshold midway between neighbouring `x` values, and for each one predicts the mean residual on each side. It keeps the threshold with the smallest total squared error and returns `(threshold, left value, right value)`.' },
            { lines: '15-16', text: 'Start from the mean of `y` (a constant prediction) and use a learning rate of 0.3.' },
            { lines: '17-19', text: 'Each round: fit a stump to the **residuals** `y - pred`, then add 0.3 times its two-step output to the prediction.' },
            { lines: 20, text: 'Report the mean squared error at a few checkpoints.' },
            { lines: 21, text: 'The error falls from 0.30 after one tree to 0.0755 after five and 0.0103 after thirty: thirty trivial one-question trees together trace a smooth curve. Run it with more rounds and the error keeps dropping, a warning that boosting *can* overfit if you do not stop (use validation and early stopping).' },
          ],
        },
        {
          type: 'table',
          headers: ['Aspect', 'Random forest (bagging)', 'Gradient boosting'],
          rows: [
            ['Trees are trained', 'independently, in parallel', 'one after another, each on the residuals'],
            ['Typical tree', 'deep (low bias, high variance)', 'shallow (high bias; boosting reduces it)'],
            ['Main benefit', 'cuts variance by averaging', 'cuts bias by adding corrections'],
            ['Overfitting risk', 'low; more trees rarely hurts', 'higher; tune learning rate, depth, number of trees'],
            ['Tuning effort', 'little', 'more, but usually the best accuracy'],
          ],
          caption: 'Two ensemble strategies attacking the two halves of the bias–variance tradeoff.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'From AdaBoost to XGBoost',
          text: 'Boosting began with **AdaBoost** (Freund and Schapire, 1997), which reweights misclassified examples. Jerome Friedman’s *gradient boosting machine* (2001) generalized it to any differentiable loss. Fast, regularized implementations (**XGBoost**, 2014, then **LightGBM** and **CatBoost**) made boosted trees the dominant method on tabular data and the usual winners of data-science competitions for years.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program (the Gini impurity function from the lesson).',
      code: `def gini(labels):
    n = len(labels)
    return 1 - sum((labels.count(c) / n) ** 2 for c in set(labels))

print(gini([0, 0, 1, 1]), gini([1, 1, 1]), gini([0, 1, 1, 1]))`,
      answer: '0.5 0.0 0.375',
      hint: 'Class fractions: 1/2 and 1/2; then just 1; then 1/4 and 3/4.',
      explanation: 'An even two-class mix: 1 − (0.25 + 0.25) = 0.5. A pure node: 1 − 1 = 0.0. A 1:3 mix: 1 − (0.0625 + 0.5625) = 0.375. The more lopsided the node, the lower its impurity.',
    },
    {
      kind: 'error',
      prompt: 'This boosting loop is meant to add trees that correct the ensemble’s mistakes, but it does not improve after the first round. Tap the faulty line.',
      lines: [
        'pred = np.full(len(y), y.mean())',
        'for _ in range(50):',
        '    stump.fit(X, y)',
        '    pred = pred + lr * stump.predict(X)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Each tree must be fitted to the **residuals**: `stump.fit(X, y - pred)`. Fitting the original `y` every time trains the same tree 50 times, so the ensemble just adds the same thing again and again instead of correcting its remaining errors.',
    },
    {
      kind: 'numeric',
      prompt: 'A tree node holds 8 examples: 6 of class A and 2 of class B. What is its Gini impurity `1 − Σ pₖ²`?',
      answer: '0.375',
      hint: 'The class fractions are 6/8 = 0.75 and 2/8 = 0.25. Square them and subtract from 1.',
      explanation: '0.75² = 0.5625 and 0.25² = 0.0625, so G = 1 − 0.625 = 0.375.',
      label: 'Gini:',
    },
    {
      kind: 'concept',
      title: 'Using tree ensembles in practice',
      blocks: [
        {
          type: 'p',
          text: 'In practice you rarely write trees yourself: use `RandomForestClassifier`, `HistGradientBoostingClassifier` (scikit-learn’s fast boosting) or the dedicated **XGBoost / LightGBM / CatBoost** libraries, which share the familiar `fit` / `predict` interface. Their key hyperparameters mirror what you have learned: `n_estimators` (number of trees), `learning_rate` (η), `max_depth` (tree size), `subsample` (a fraction of rows per tree), and `early_stopping_rounds` (stop adding trees when the validation score stalls: the early stopping of the last lesson).',
        },
        {
          type: 'code',
          title: 'feature_importance.py',
          runnable: true,
          packages: ['scikit-learn'],
          code: `from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier

iris = load_iris()
forest = RandomForestClassifier(n_estimators=200, random_state=0).fit(iris.data, iris.target)
for name, imp in sorted(zip(iris.feature_names, forest.feature_importances_), key=lambda p: -p[1]):
    print(f"{name:20s} {imp:.2f}")`,
          output: `petal width (cm)     0.44
petal length (cm)    0.44
sepal length (cm)    0.10
sepal width (cm)     0.03`,
          outputVaries: true,
          annotations: [
            { lines: 5, text: 'Fit a forest on all of iris with 200 trees.' },
            { lines: 6, text: 'Every fitted forest exposes `feature_importances_`: how much each feature reduced impurity, averaged over all trees and normalized to sum to 1. Sort them from most to least important.' },
            { lines: 7, text: 'The petal measurements carry about 88% of the importance; the sepal measurements barely matter. Use this to understand the data, to drop useless features and to sanity-check the model (a surprisingly important ID column or timestamp often means **data leakage**).' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Importances can mislead',
          text: 'Impurity-based importances favour features with many distinct values and share credit unpredictably between correlated features. For more reliable answers use **permutation importance** (shuffle one feature on validation data and measure how much the score drops: `sklearn.inspection.permutation_importance`) or SHAP values.',
        },
        {
          type: 'table',
          headers: ['Situation', 'Reach for'],
          rows: [
            ['Tabular data (rows and columns: player stats, logs, sensor tables)', 'Gradient-boosted trees (XGBoost/LightGBM), with a random forest as a quick baseline'],
            ['Images, audio, raw text, or anything with spatial or sequential structure', 'Neural networks (the next units)'],
            ['You need to explain each decision to a person', 'A shallow decision tree, or a linear model'],
            ['Tiny dataset (a few hundred rows)', 'Regularized linear models or a small forest'],
            ['Extrapolating a trend beyond the training range', 'Linear models: trees predict a flat value outside the range they saw'],
          ],
          caption: 'A rule of thumb that holds up remarkably well.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Trees in games',
          text: 'Games use trees in two unrelated ways. **Behaviour trees** are hand-authored decision structures for NPC logic (nothing is learned). **Learned** tree ensembles are used on tabular telemetry: predicting player churn or difficulty spikes, matchmaking skill estimates, anti-cheat anomaly scores, and quick evaluators for game states with a handful of numeric features. For raw pixels or an agent that must *act* in an environment, you will need the neural-network and reinforcement-learning units that follow.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `gini(labels)` returning the Gini impurity `1 − Σ pₖ²` of a list of class labels (any hashable values). An empty list is considered pure and returns `0.0`.',
      starter: `def gini(labels):
    ...
`,
      solution: `def gini(labels):
    n = len(labels)
    if n == 0:
        return 0.0
    counts = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1
    return 1.0 - sum((c / n) ** 2 for c in counts.values())
`,
      tests: `assert gini([]) == 0.0
assert gini([1, 1, 1]) == 0.0
assert abs(gini([0, 1]) - 0.5) < 1e-12
assert abs(gini([0, 0, 1, 1]) - 0.5) < 1e-12
assert abs(gini([0, 1, 1, 1]) - 0.375) < 1e-12
assert abs(gini(["a", "b", "c"]) - (1 - 3 * (1 / 3) ** 2)) < 1e-12
assert abs(gini(["x", "x", "y", "z"]) - 0.625) < 1e-12
labels = [1, 0, 1]
gini(labels)
assert labels == [1, 0, 1]
assert isinstance(gini([1, 2]), float)`,
      checks: ['A pure node gives `0.0`, an even two-class mix gives `0.5`', 'Works for any number of classes and for non-numeric labels', 'An empty list gives `0.0` and the input list is not modified'],
      hint: 'Count how many times each label appears (a dictionary or `collections.Counter`), divide by `n` to get the fractions and return `1 - sum(fraction ** 2)`.',
      explanation: 'This is the exact quantity a tree evaluates millions of times while training. Counting once with a dictionary is faster than the `labels.count` calls in the lesson’s snippet, which rescan the list for every class.',
    },
    {
      kind: 'code',
      prompt: 'Write `best_split(xs, ys)` for one numeric feature. Candidate thresholds are the midpoints between consecutive **distinct** sorted values of `xs`. For each, send examples with `x <= threshold` left and the rest right, and score it as the size-weighted Gini of the two sides. Return `(threshold, score)` for the lowest score (the lowest threshold wins ties). Raise `ValueError` if `xs` has fewer than two distinct values. `xs` and `ys` may be unsorted.',
      starter: `def gini(labels):
    n = len(labels)
    if n == 0:
        return 0.0
    return 1 - sum((labels.count(c) / n) ** 2 for c in set(labels))

def best_split(xs, ys):
    ...
`,
      solution: `def gini(labels):
    n = len(labels)
    if n == 0:
        return 0.0
    return 1 - sum((labels.count(c) / n) ** 2 for c in set(labels))


def best_split(xs, ys):
    values = sorted(set(xs))
    if len(values) < 2:
        raise ValueError("need at least two distinct values")
    n = len(ys)
    best = None
    for a, b in zip(values, values[1:]):
        t = (a + b) / 2
        left = [y for x, y in zip(xs, ys) if x <= t]
        right = [y for x, y in zip(xs, ys) if x > t]
        score = (len(left) * gini(left) + len(right) * gini(right)) / n
        if best is None or score < best[1] - 1e-12:
            best = (t, score)
    return best
`,
      tests: `t, s = best_split([1, 2, 3, 4, 5, 6, 7, 8], [0, 0, 0, 0, 1, 0, 1, 1])
assert t == 4.5 and abs(s - 0.1875) < 1e-9

t, s = best_split([1, 2, 3, 4], [0, 0, 1, 1])
assert t == 2.5 and abs(s) < 1e-12

t, s = best_split([4, 1, 3, 2], [1, 0, 1, 0])
assert t == 2.5 and abs(s) < 1e-12

t, s = best_split([1, 1, 2, 2], [0, 0, 1, 1])
assert t == 1.5 and abs(s) < 1e-12

t, s = best_split([1, 2, 3, 4], [0, 1, 0, 1])
assert t == 1.5 and abs(s - 1 / 3) < 1e-9

try:
    best_split([5, 5, 5], [0, 1, 0])
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")

xs, ys = [3, 1, 2], [1, 0, 0]
best_split(xs, ys)
assert xs == [3, 1, 2] and ys == [1, 0, 0]`,
      checks: ['Tries only midpoints between consecutive distinct sorted values', 'Scores each split by the size-weighted Gini impurity of the two sides and returns `(threshold, score)` of the best; ties go to the lowest threshold', 'Works with unsorted inputs and repeated values; raises `ValueError` when no split is possible'],
      hint: 'Get `sorted(set(xs))`, loop over neighbouring pairs with `zip(values, values[1:])`, build the `left` and `right` label lists for the midpoint, then keep the first threshold whose score is strictly better.',
      explanation: 'This is the core of the CART algorithm for a single feature. A real implementation does it for every feature at every node, and sorts once and updates running class counts so the whole search costs O(n log n) instead of O(n²). Libraries add many more optimizations (histograms in LightGBM and HistGradientBoosting), but the logic is what you just wrote.',
    },
    {
      kind: 'code',
      prompt: 'Write `majority_vote(predictions)` where `predictions` is a list with one inner list per tree, each holding that tree’s predicted label for every sample. Return a list with the winning label for each sample (the label with the most votes; ties go to the smallest label). Raise `ValueError` if there are no trees.',
      starter: `def majority_vote(predictions):
    ...
`,
      solution: `def majority_vote(predictions):
    if not predictions:
        raise ValueError("no trees")
    result = []
    for votes in zip(*predictions):
        counts = {}
        for v in votes:
            counts[v] = counts.get(v, 0) + 1
        top = max(counts.values())
        result.append(min(label for label, c in counts.items() if c == top))
    return result
`,
      tests: `assert majority_vote([[0, 1, 1], [0, 0, 1], [1, 0, 1]]) == [0, 0, 1]
assert majority_vote([[0, 1], [1, 0]]) == [0, 0]
assert majority_vote([[2, 2, 0]]) == [2, 2, 0]
assert majority_vote([[1, 2], [2, 2], [1, 3], [1, 3], [3, 3]]) == [1, 3]
assert majority_vote([["b", "a"], ["b", "b"], ["a", "a"]]) == ["b", "a"]
assert majority_vote([[], []]) == []

try:
    majority_vote([])
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")

votes = [[0, 1], [1, 1], [0, 0]]
majority_vote(votes)
assert votes == [[0, 1], [1, 1], [0, 0]]`,
      checks: ['For each sample, returns the label that most trees voted for', 'Ties go to the smallest label', 'Raises `ValueError` for an empty list of trees and does not modify its input'],
      hint: 'Use `zip(*predictions)` to get the votes for each sample together. Count them in a dictionary, find the highest count, and take the `min` label among those that reach it.',
      explanation: 'This is how a random forest classifier combines its trees (scikit-learn actually averages the trees’ class probabilities, a "soft" vote that behaves similarly). Regression forests simply average the numeric predictions. The simplicity is the point: the power comes from the diversity of the voters, not from a clever combiner.',
    },
  ],
  takeaways: [
    'A **decision tree** asks a sequence of yes/no questions about features; each split is chosen to minimize the size-weighted **Gini impurity** (0 = pure, 0.5 = even two-class mix) of the two halves. It is greedy, readable, scale-free, and needs no feature engineering for non-linearity.',
    'A single unlimited tree **overfits** (high variance). Limit `max_depth` / `min_samples_leaf`, or prune; or, better, average many trees.',
    '**Random forests** train deep trees independently on bootstrap samples with random feature subsets and vote: a strong, low-tuning baseline that cuts variance and gives out-of-bag scores and feature importances.',
    '**Gradient boosting** adds shallow trees one at a time, each fitted to the current residuals (the negative gradient) and scaled by a small learning rate; it cuts bias and often gives the best accuracy on tabular data (XGBoost, LightGBM, CatBoost) but needs more tuning and early stopping.',
    'For tabular data start with a forest, then boosting; for images, audio and sequences use neural networks; for explanations use a shallow tree or a linear model.',
  ],
  reading: [
    { title: 'scikit-learn: Decision Trees', url: 'https://scikit-learn.org/stable/modules/tree.html', source: 'docs', note: 'Algorithms, controls, pruning and tips for using trees well.' },
    { title: 'scikit-learn: Ensembles (forests, gradient boosting)', url: 'https://scikit-learn.org/stable/modules/ensemble.html', source: 'docs', note: 'Bagging, random forests, HistGradientBoosting and their parameters.' },
    { title: 'XGBoost documentation: Introduction to Boosted Trees', url: 'https://xgboost.readthedocs.io/en/stable/tutorials/model.html', source: 'docs', note: 'A clear derivation of gradient tree boosting from the library authors.' },
    { title: 'MLU-Explain: Decision Trees', url: 'https://mlu-explain.github.io/decision-tree/', source: 'tutorial', note: 'A beautiful interactive visual walk-through of how a tree splits.' },
  ],
};
