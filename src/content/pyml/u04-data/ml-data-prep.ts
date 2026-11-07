import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-data-prep',
  title: 'Cleaning, Splitting and Scaling Data',
  summary: 'Models are only as good as their data. Learn to clean messy tables, handle outliers, scale features, encode categories, and split data into train, validation and test sets without leaking information.',
  minutes: 22,
  objectives: [
    'Clean a messy table: normalize text, remove duplicates and impossible values, and fill gaps',
    'Detect outliers with the IQR rule and explain how they affect scaling',
    'Standardize or min-max scale features using statistics from the training data only',
    'Split data into training, validation and test sets and recognize data leakage',
    'Encode categorical features as one-hot vectors',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Cleaning: fix the data before the model sees it',
      blocks: [
        {
          type: 'p',
          text: '"Garbage in, garbage out" is the first law of machine learning. Raw data has inconsistent spelling (`"Tank"`, `"tank"`, `"tank "`), duplicated rows, impossible values (a level of -1), and gaps. A model treats each spelling as a different category and each bad value as a real signal, so cleaning is not a chore to rush: it is where a large share of the quality of a project is decided. The usual steps are: **normalize** text, **deduplicate**, **filter** impossible values, and handle **[[missing-value|missing values]]** by dropping rows or **[[imputation|imputing]]** (filling) them.',
        },
        {
          type: 'code',
          title: 'clean_table.py',
          runnable: true,
          packages: ['pandas'],
          code: `import pandas as pd

raw = pd.DataFrame({
    "player": ["Ana", "bo ", "BO", "cy", "cy", "Di", "ed"],
    "role": ["Mage", "tank", "Tank", "ROGUE", "rogue", "mage", "tank"],
    "level": [12, 30, 30, 25, 25, -1, 41],
    "gold": [150.0, 900.5, 900.5, 420.0, 420.0, 275.0, None],
})
clean = raw.copy()
clean["player"] = clean["player"].str.strip().str.lower()
clean["role"] = clean["role"].str.lower()
clean = clean.drop_duplicates()
clean = clean[clean["level"] > 0]
clean["gold"] = clean["gold"].fillna(clean["gold"].median())
print(len(raw), len(clean))
print(clean.reset_index(drop=True))`,
          output: `7 4
  player   role  level   gold
0    ana   mage     12  150.0
1     bo   tank     30  900.5
2     cy  rogue     25  420.0
3     ed   tank     41  420.0`,
          annotations: [
            { lines: '3-8', text: 'A deliberately messy table: mixed capitalization, a trailing space in `"bo "`, `bo` and `cy` each recorded twice, an impossible level of -1 and a missing gold value.' },
            { lines: 9, text: 'Work on a **copy** so the raw data stays available if a cleaning step turns out to be wrong.' },
            { lines: '10-11', text: '`.str.strip().str.lower()` normalizes text: it removes stray whitespace and lowercases. Now `"bo "`, `"BO"` and `"Tank"`, `"tank"` match.' },
            { lines: 12, text: '`drop_duplicates()` removes rows that are identical in every column. It only finds the duplicates *after* normalization, which is why the order of steps matters.' },
            { lines: 13, text: 'Rows that violate a known rule (a level must be positive) are filtered out with a boolean condition. Dropping `Di` is a decision: here it is bad data; elsewhere you might correct it.' },
            { lines: 14, text: 'The one missing gold value is filled with the **median** of the known values (420). The median is a safe default because extreme values barely move it.' },
            { lines: '15-16', text: 'Seven raw rows became four clean ones. Always report how many rows each step removed: silently losing half the data is a serious finding.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Missing is information too',
          text: 'Why a value is missing can matter: gold might be missing exactly for players who never opened the shop. Before filling, consider adding a column `gold_missing = df["gold"].isna()` so the model can use the fact itself. Only drop rows when few are affected and the gaps look random, and never fill the **label** you want to predict.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Put cleaning in a function, not in your head',
          text: 'Write cleaning as a function (or a script) that takes the raw table and returns the clean one. You will need to apply *exactly the same steps* to future data when the model is used for real, and a reproducible function turns "I think I removed the weird rows" into something you can rerun, test and review.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Your table has `"Mage"`, `"mage"` and `"mage "` in a role column. Why should you normalize them before training?',
      options: [
        { text: 'Otherwise the model sees three separate categories for what is really one', correct: true, why: 'Models compare exact values. Without normalization the three spellings become three unrelated categories, splitting the evidence and confusing the model.' },
        { text: 'Because machine learning libraries refuse to run with capital letters', why: 'They run fine; the problem is silent: the results are just worse than they should be.' },
        { text: 'To save memory', why: 'The effect on memory is negligible. The reason is correctness, not size.' },
        { text: 'Because lowercase text is faster to process', why: 'Speed is not the issue; treating one real category as three is.' },
      ],
      explanation: 'Real data is inconsistent in ways you would never notice by eye. Normalizing text (`strip`, `lower`) and checking `value_counts()` on every categorical column makes sure each real category appears exactly once.',
    },
    {
      kind: 'concept',
      title: 'Outliers and feature scaling',
      blocks: [
        {
          type: 'p',
          text: 'An **[[outlier]]** is a value far from the rest. It might be an error (a typo, a broken sensor) or a rare but real event, and you must decide which. A standard detector is the **IQR rule**: compute the first and third quartiles `Q1` and `Q3` (25th and 75th percentiles) and the spread `IQR = Q3 − Q1`; anything below `Q1 − 1.5·IQR` or above `Q3 + 1.5·IQR` is flagged. It does not assume a bell-shaped distribution and is not itself distorted by the outlier.',
        },
        {
          type: 'p',
          text: 'Then **scale** the features. Features measured in very different units (a level from 1 to 100, gold from 0 to 100 000) make gradient descent crawl, because the loss is far steeper in one direction than the other. Two common fixes: **[[standardization]]** (`(x − mean) / std`, giving mean 0 and spread 1) and **[[min-max-scaling|min-max scaling]]** (`(x − min) / (max − min)`, mapping to the range 0 to 1). Watch what one outlier does to each:',
        },
        {
          type: 'code',
          title: 'outliers_scaling.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

x = np.array([12.0, 15.0, 14.0, 13.0, 16.0, 95.0])
q1, q3 = np.percentile(x, [25, 75])
iqr = q3 - q1
mask = (x >= q1 - 1.5 * iqr) & (x <= q3 + 1.5 * iqr)
print(q1, q3, x[~mask])
z = (x - x.mean()) / x.std()
mm = (x - x.min()) / (x.max() - x.min())
print(np.round(z, 2))
print(np.round(mm, 2))`,
          output: `13.25 15.75 [95.]
[-0.51 -0.41 -0.45 -0.48 -0.38  2.23]
[0.   0.04 0.02 0.01 0.05 1.  ]`,
          annotations: [
            { lines: '4-5', text: '`np.percentile(x, [25, 75])` returns both quartiles at once: 13.25 and 15.75, so the IQR is only 2.5. Most values sit in a tight band.' },
            { lines: 6, text: 'The fences are `13.25 − 3.75 = 9.5` and `15.75 + 3.75 = 19.5`. `mask` is `True` for values inside them.' },
            { lines: 7, text: '`x[~mask]` selects the values outside: only 95.0 is flagged. (`~` inverts a boolean mask.)' },
            { lines: 8, text: 'Standardization: subtract the mean and divide by the standard deviation.' },
            { lines: 9, text: 'Min-max scaling: map the smallest value to 0 and the largest to 1.' },
            { lines: '10-11', text: 'Compare the two lines: the outlier (last entry) is 2.23 standard deviations out under z-scoring, while under min-max it takes the value 1.0 and squashes the five normal values into the narrow range 0 to 0.05, which destroys most of their resolution. Handle outliers *before* min-max scaling, or prefer standardization.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Remove, cap or keep?',
          text: 'Do not delete an outlier just because it is awkward. A 95 might be a typo for 15 (fix it), a sensor glitch (drop it), or a real boss fight that matters (keep it, perhaps with a log transform). Options include **removing** the row, **capping** (clipping) values to the fences, or using a robust model. Whatever you choose, apply the same rule to training and new data and write it down.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Why scaling helps gradient descent',
          text: 'Imagine a loss bowl that is 1000 times steeper along the gold axis than along the level axis. A learning rate small enough to be stable along the steep axis moves painfully slowly along the shallow one, and a larger rate diverges. Putting all features on a similar scale makes the bowl rounder, so one learning rate suits every direction. Tree-based models (a later lesson) do not care about scaling at all; neural networks and anything distance-based do.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'It is fine to compute the mean and standard deviation on the **entire** dataset before splitting it into training and test sets, because the labels are not involved.',
      answer: false,
      explanation: 'False. This is **[[data-leakage|data leakage]]**: statistics of the test examples leak into the training process, so the test score becomes slightly optimistic. Fit scalers (and imputers, encoders…) on the training data only, then apply them to validation and test data.',
    },
    {
      kind: 'concept',
      title: 'Train, validation and test splits, and leakage',
      blocks: [
        {
          type: 'p',
          text: 'A model must be judged on data it has never seen, otherwise you measure memory, not learning. So you divide the dataset (usually after shuffling) into three parts: a **training set** (typically 60–80%) that the model learns from, a **[[validation-set|validation set]]** (10–20%) that you use *while developing* to compare designs and tune settings such as the learning rate, and a **test set** (10–20%) that you touch **once**, at the very end, for an honest estimate of real-world performance. This is the **[[train-test-split]]**. If you tune on the test set, it quietly becomes a second validation set and the final number lies.',
        },
        {
          type: 'p',
          text: 'The golden rule that prevents leakage: **anything learned from data (means, standard deviations, category lists, imputation values) is computed on the training set only** and then *applied* to the other sets. The example below does it by hand; the NumPy `permutation` from the earlier lesson shuffles the indices.',
        },
        {
          type: 'code',
          title: 'split_and_scale.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

rng = np.random.default_rng(0)
data = np.arange(100, dtype=float).reshape(50, 2)
idx = rng.permutation(50)
train, val, test = idx[:30], idx[30:40], idx[40:]
mean, std = data[train].mean(axis=0), data[train].std(axis=0)

def scale(a):
    return (a - mean) / std

print(len(train), len(val), len(test), len(set(train) & set(test)))
print(bool(np.allclose(scale(data[train]).mean(axis=0), 0)))
print(bool(abs(scale(data[test]).mean()) > 1e-9))`,
          output: `30 10 10 0
True
True`,
          annotations: [
            { lines: '3-5', text: 'Fifty examples with two features; `rng.permutation(50)` shuffles the numbers 0 to 49, which we use as row indices.' },
            { lines: 6, text: 'Cut the shuffled indices into 30 training, 10 validation and 10 test examples. Each example lands in exactly one set.' },
            { lines: 7, text: 'The scaling statistics come from the **training rows only**. `data[train]` selects those rows with an index array (fancy indexing).' },
            { lines: '9-10', text: 'One `scale` function, using the training statistics, will be applied to every set. At deployment time the same stored `mean` and `std` must be applied to new data.' },
            { lines: 12, text: 'Sizes 30, 10 and 10, and zero indices shared between training and test.' },
            { lines: 13, text: 'On the training set the scaled mean is (numerically) zero, as expected.' },
            { lines: 14, text: 'On the test set it is *not* exactly zero, and that is correct and honest: the test data are scaled with training statistics, just like genuinely new data would be.' },
          ],
        },
        {
          type: 'p',
          text: 'In practice you rarely write this by hand: scikit-learn provides `train_test_split`, `StandardScaler`, `MinMaxScaler` and `OneHotEncoder`, which follow a consistent **fit / transform** pattern: `fit` learns the statistics from the training data, `transform` applies them to any data. `stratify=y` keeps the proportion of each class the same in every split, important for imbalanced labels.',
        },
        {
          type: 'code',
          title: 'sklearn_split.py',
          runnable: true,
          packages: ['scikit-learn', 'numpy'],
          code: `import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X = np.arange(40, dtype=float).reshape(20, 2)
y = np.array([0, 1] * 10)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=0, stratify=y
)
scaler = StandardScaler().fit(X_train)
print(X_train.shape, X_test.shape, abs(y_test.mean() - 0.5) <= 0.1)
print(bool(np.allclose(scaler.transform(X_train).mean(axis=0), 0)))
print(bool(np.abs(scaler.transform(X_test).mean()) > 1e-9))`,
          output: `(15, 2) (5, 2) True
True
True`,
          annotations: [
            { lines: '7-9', text: '`train_test_split` shuffles and splits both `X` and `y` in the same way, so each row stays paired with its label. `test_size=0.25` holds back a quarter; `random_state=0` makes the split reproducible; `stratify=y` keeps the label balance.' },
            { lines: 10, text: '`StandardScaler().fit(X_train)` learns the mean and standard deviation of each training column. Never fit it on `X_test`.' },
            { lines: 11, text: 'Shapes `(15, 2)` and `(5, 2)`, and the test set still has about half of each class thanks to stratification.' },
            { lines: '12-13', text: '`scaler.transform(...)` applies the stored training statistics to any array: the training data end up with mean 0, the test data do not. That is the correct behaviour.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Other forms of leakage',
          text: 'Leakage is subtle. Duplicate or near-duplicate examples that land in both train and test inflate scores. For **time series and game logs**, shuffle-splitting lets the model "see the future": split by time instead (train on the past, test on the future). A feature built from the label (or recorded after the outcome, such as "match duration" when predicting who wins) is a leak. If a result looks too good to be true, suspect leakage before celebrating.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Encoding categories',
      blocks: [
        {
          type: 'p',
          text: 'Models do arithmetic, so every feature must be a number. The naive fix, numbering the categories (`mage = 0, tank = 1, rogue = 2`), invents a fake order and distances: it tells the model that a rogue is "twice" a tank. **[[one-hot-encoding|One-hot encoding]]** removes the problem by giving each category its own 0/1 column: exactly one column is 1 per row. Plain integer codes are fine for the *label* you predict (class 0, 1, 2) and for features with a real order (bronze < silver < gold).',
        },
        {
          type: 'code',
          title: 'one_hot.py',
          runnable: true,
          packages: ['pandas'],
          code: `import pandas as pd

roles = pd.Series(["mage", "tank", "rogue", "tank"])
onehot = pd.get_dummies(roles, dtype=int)
print(onehot.columns.tolist())
print(onehot.to_numpy().tolist())
print(roles.map({"mage": 0, "tank": 1, "rogue": 2}).tolist())`,
          output: `['mage', 'rogue', 'tank']
[[1, 0, 0], [0, 0, 1], [0, 1, 0], [0, 0, 1]]
[0, 1, 2, 1]`,
          annotations: [
            { lines: 4, text: '`pd.get_dummies` builds one 0/1 column per distinct category, sorted alphabetically here. `dtype=int` asks for integers rather than booleans.' },
            { lines: 5, text: 'The columns are `mage`, `rogue`, `tank`. Remember this order: it is part of the model’s input format.' },
            { lines: 6, text: 'Each row has a single 1: `mage` → `[1, 0, 0]`, `tank` → `[0, 0, 1]`, `rogue` → `[0, 1, 0]`, `tank` again → `[0, 0, 1]`.' },
            { lines: 7, text: 'The integer-code alternative, via `map` with a dictionary. Good for labels, risky for features because it implies `rogue > tank > mage`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Fix the categories on the training set',
          text: 'If a new example contains a role the training data never had, your encoder must decide what to do (error, an "unknown" column, or all zeros). With scikit-learn, `OneHotEncoder(handle_unknown="ignore")` is learned with `fit` on the training data and then reused, so the columns always have the same order in training and in production. Neural networks later replace one-hot vectors for very large vocabularies (words, items) by learned **embeddings**.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Scale the test data with the **training** statistics.',
      template: `mean = X_train.mean(axis=0)
std = X_train.std(axis=0)
X_test_scaled = (X_test - ___) / ___`,
      templateIsCode: true,
      blanks: [{ answers: ['mean'] }, { answers: ['std'] }],
      wordBank: ['mean', 'std', 'X_test', 'X_train'],
      explanation: 'The test set is scaled with the `mean` and `std` computed from `X_train`. Computing fresh statistics from `X_test` would be a form of leakage and would make the test set look different from real, unseen data.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `import numpy as np

x = np.array([1.0, 2.0, 3.0, 10.0])
print(((x - x.min()) / (x.max() - x.min())).round(2).tolist())`,
      answer: '[0.0, 0.11, 0.22, 1.0]',
      hint: 'The range is 10 − 1 = 9, so each value becomes `(x − 1) / 9`.',
      explanation: 'Min-max scaling maps 1 to 0 and 10 to 1. The values 2 and 3 become 1/9 ≈ 0.11 and 2/9 ≈ 0.22: the outlier 10 squeezes the rest into the bottom of the range.',
    },
    {
      kind: 'error',
      prompt: 'This code scales the data and then splits it. Tap the line that introduces **data leakage**.',
      lines: [
        'import numpy as np',
        'X = np.arange(20, dtype=float).reshape(10, 2)',
        'X = (X - X.mean(axis=0)) / X.std(axis=0)',
        'X_train, X_test = X[:8], X[8:]',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The mean and standard deviation are computed from **all** rows, including the 2 that will become the test set, so test information leaks into the training data. Split first, compute the statistics from `X[:8]` only, and then scale both parts with them.',
    },
    {
      kind: 'numeric',
      prompt: 'A feature has quartiles `Q1 = 10` and `Q3 = 20`. By the IQR rule, what is the **upper fence**, above which values are flagged as outliers?',
      answer: '35',
      hint: 'IQR = Q3 − Q1. The fence is Q3 + 1.5 · IQR.',
      explanation: 'IQR = 20 − 10 = 10, so the upper fence is 20 + 1.5 × 10 = 35. (The lower fence would be 10 − 15 = −5.)',
      label: 'Upper fence:',
    },
    {
      kind: 'code',
      prompt: 'Write `iqr_filter(values)` returning a NumPy array with the **outliers removed** according to the IQR rule: keep values from `Q1 - 1.5*IQR` to `Q3 + 1.5*IQR` inclusive (quartiles from `np.percentile`). Keep the original order.',
      starter: `import numpy as np

def iqr_filter(values):
    ...
`,
      solution: `import numpy as np


def iqr_filter(values):
    x = np.asarray(values, dtype=float)
    q1, q3 = np.percentile(x, [25, 75])
    iqr = q3 - q1
    keep = (x >= q1 - 1.5 * iqr) & (x <= q3 + 1.5 * iqr)
    return x[keep]
`,
      tests: `import numpy as np

out = iqr_filter([12, 15, 14, 13, 16, 95])
assert out.tolist() == [12.0, 15.0, 14.0, 13.0, 16.0]

out = iqr_filter([1, 2, 3, 4, 5, -100, 6, 7])
assert out.tolist() == [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]

same = iqr_filter([5, 6, 7, 8, 9])
assert same.tolist() == [5.0, 6.0, 7.0, 8.0, 9.0]

const = iqr_filter([4, 4, 4, 4])
assert const.tolist() == [4.0, 4.0, 4.0, 4.0]

both = iqr_filter(np.array([-50.0, 10.0, 11.0, 12.0, 13.0, 14.0, 90.0]))
assert both.tolist() == [10.0, 11.0, 12.0, 13.0, 14.0]

data = np.array([1.0, 2.0, 1000.0])
iqr_filter(data)
assert data.tolist() == [1.0, 2.0, 1000.0]
assert isinstance(same, np.ndarray)`,
      packages: ['numpy'],
      checks: ['Computes Q1 and Q3 with `np.percentile` and the fences `Q1 - 1.5·IQR` and `Q3 + 1.5·IQR`', 'Keeps the values inside the fences (inclusive) in their original order', 'Returns a NumPy array and does not modify the input'],
      hint: 'Get `q1, q3 = np.percentile(x, [25, 75])`, compute `iqr = q3 - q1`, build a boolean mask with two comparisons joined by `&`, and index the array with it.',
      explanation: 'A boolean mask built from two comparisons keeps the typical values. In a pipeline you would compute the fences on the **training** data and reuse them for new data, just like a scaler’s mean.',
    },
    {
      kind: 'code',
      prompt: 'Write `min_max_scale(train, test)`, which takes two 1-D lists of numbers and returns a tuple `(train_scaled, test_scaled)` of lists, both scaled using the **training** minimum and maximum: `(v - lo) / (hi - lo)`. If the training range is zero (all values equal), return zeros for both. Test values may fall outside 0..1.',
      starter: `def min_max_scale(train, test):
    ...
`,
      solution: `def min_max_scale(train, test):
    lo, hi = min(train), max(train)
    if hi == lo:
        return [0.0] * len(train), [0.0] * len(test)
    span = hi - lo
    return [(v - lo) / span for v in train], [(v - lo) / span for v in test]
`,
      tests: `def close(a, b):
    return len(a) == len(b) and all(abs(x - y) < 1e-9 for x, y in zip(a, b))

tr, te = min_max_scale([0, 5, 10], [2, 12, -5])
assert close(tr, [0.0, 0.5, 1.0])
assert close(te, [0.2, 1.2, -0.5])

tr, te = min_max_scale([10, 20], [15])
assert close(tr, [0.0, 1.0]) and close(te, [0.5])

tr, te = min_max_scale([7, 7, 7], [7, 9])
assert tr == [0.0, 0.0, 0.0] and te == [0.0, 0.0]

tr, te = min_max_scale([-1, 1], [])
assert close(tr, [0.0, 1.0]) and te == []

train = [3, 4, 5]
test = [10]
min_max_scale(train, test)
assert train == [3, 4, 5] and test == [10]
assert isinstance(min_max_scale([1, 2], [3]), tuple)`,
      checks: ['Both lists use the training minimum and maximum (never the test data’s)', 'Test values outside the training range map outside 0..1', 'A zero training range gives zeros and does not divide by zero'],
      hint: 'Compute `lo = min(train)` and `hi = max(train)` first. Handle `hi == lo` early, then apply `(v - lo) / (hi - lo)` to every value of both lists.',
      explanation: 'A test value of 12 scaling to 1.2 is *correct*: it tells you the new data lies outside what the model saw in training, a useful warning. Clipping it to 1 would hide that. The zero-range guard prevents a `ZeroDivisionError` on constant columns.',
    },
    {
      kind: 'code',
      prompt: 'Write `one_hot(labels, categories)` returning a list of lists. For each label, produce a list with `1` at the position of that label in `categories` and `0` elsewhere. Raise `ValueError` if a label is not in `categories`.',
      starter: `def one_hot(labels, categories):
    ...
`,
      solution: `def one_hot(labels, categories):
    index = {c: i for i, c in enumerate(categories)}
    rows = []
    for label in labels:
        if label not in index:
            raise ValueError(f"unknown label: {label!r}")
        row = [0] * len(categories)
        row[index[label]] = 1
        rows.append(row)
    return rows
`,
      tests: `cats = ["mage", "rogue", "tank"]
assert one_hot(["tank", "mage"], cats) == [[0, 0, 1], [1, 0, 0]]
assert one_hot([], cats) == []
assert one_hot(["rogue"], cats) == [[0, 1, 0]]
assert one_hot(["a", "a", "b"], ["a", "b"]) == [[1, 0], [1, 0], [0, 1]]
assert one_hot([2, 0], [0, 1, 2]) == [[0, 0, 1], [1, 0, 0]]
assert one_hot(["x"], ["x"]) == [[1]]

try:
    one_hot(["tank", "wizard"], cats)
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")

rows = one_hot(["mage", "mage"], cats)
rows[0][0] = 99
assert rows[1] == [1, 0, 0]
assert all(sum(r) == 1 for r in one_hot(["tank", "rogue", "mage"], cats))`,
      checks: ['Each row has a single 1 at the position of its label in `categories`', 'Raises `ValueError` for a label that is not in `categories`', 'Every row is its own separate list'],
      hint: 'Build a dictionary from category to position with `enumerate`. For each label create a fresh `[0] * len(categories)` list and set one entry to 1.',
      explanation: 'The fixed `categories` list defines the column order, which must be the same in training and production. Creating a fresh row for each label (not one shared list) avoids aliasing bugs, where changing one row would change them all.',
    },
  ],
  takeaways: [
    '**Clean first**: normalize text, remove duplicates (after normalizing), filter impossible values, and handle missing values by dropping or imputing (the median is a safe default). Do it in a reusable function and report how many rows each step removes.',
    'Flag **outliers** with the IQR rule (`Q1 − 1.5·IQR`, `Q3 + 1.5·IQR`) and decide deliberately whether to fix, cap or keep them; min-max scaling is especially sensitive to them.',
    '**Scale** features so that gradient descent works well: standardization (`(x − mean) / std`) or min-max. Neural networks and distance-based models need it; tree models do not.',
    'Split into **train / validation / test** sets (shuffle, or split by time for sequences). Tune on validation and touch the test set once. Compute **every learned statistic on the training set only** (fit on train, transform everything) to avoid **data leakage**.',
    'Encode categories with **one-hot vectors** rather than arbitrary integer codes (except for labels and truly ordered features), with a category list fixed from the training data.',
  ],
  reading: [
    { title: 'scikit-learn: Preprocessing data', url: 'https://scikit-learn.org/stable/modules/preprocessing.html', source: 'docs', note: 'Scalers, encoders and imputers with the fit/transform pattern.' },
    { title: 'scikit-learn: Common pitfalls and recommended practices (data leakage)', url: 'https://scikit-learn.org/stable/common_pitfalls.html', source: 'docs', note: 'Concrete examples of leakage and how pipelines prevent it.' },
    { title: 'Data Cleaning (Kaggle Learn)', url: 'https://www.kaggle.com/learn/data-cleaning', source: 'course', note: 'Short hands-on lessons on missing values, scaling, text and inconsistent data.' },
    { title: 'Hands-On Machine Learning (Aurélien Géron), chapter 2: End-to-End Project', url: 'https://github.com/ageron/handson-ml3', source: 'repo', note: 'A complete worked project covering cleaning, splitting and preprocessing; the notebooks are free.' },
  ],
};
