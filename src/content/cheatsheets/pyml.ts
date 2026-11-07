import type { CheatSheet } from '../types';

export const pymlCheatSheets: CheatSheet[] = [
  {
    id: 'ml-math',
    title: 'Math for ML',
    course: 'pyml',
    icon: '∑',
    description: 'The formulas behind most of machine learning: vectors, matrices, derivatives, probability and the loss functions, in one place.',
    sections: [
      {
        title: 'Vectors and matrices',
        items: [
          { label: 'Dot product', tex: '\\mathbf{a}\\cdot\\mathbf{b} = \\sum_i a_i b_i = \\lVert \\mathbf{a}\\rVert\\,\\lVert \\mathbf{b}\\rVert \\cos\\theta' },
          { label: 'Length (L2 norm)', tex: '\\lVert \\mathbf{a}\\rVert = \\sqrt{\\sum_i a_i^2}' },
          { label: 'Cosine similarity', tex: '\\cos(\\mathbf{a},\\mathbf{b}) = \\frac{\\mathbf{a}\\cdot\\mathbf{b}}{\\lVert \\mathbf{a}\\rVert\\,\\lVert \\mathbf{b}\\rVert}' },
          { label: 'Matrix product shape rule', text: 'An `(m, n)` matrix times an `(n, p)` matrix gives `(m, p)`. The inner sizes must match. Entry `(i, j)` is row `i` of the first dotted with column `j` of the second.' },
          { label: 'Linear layer', tex: '\\mathbf{y} = W\\mathbf{x} + \\mathbf{b}' },
        ],
      },
      {
        title: 'Calculus',
        items: [
          { label: 'Common derivatives', tex: '\\frac{d}{dx}x^n = n x^{n-1},\\quad \\frac{d}{dx}e^x = e^x,\\quad \\frac{d}{dx}\\ln x = \\frac{1}{x}' },
          { label: 'Chain rule', tex: '\\frac{dL}{dx} = \\frac{dL}{dy}\\cdot\\frac{dy}{dx}' },
          { label: 'Gradient', tex: '\\nabla L = \\left(\\frac{\\partial L}{\\partial w_1},\\dots,\\frac{\\partial L}{\\partial w_n}\\right)' },
          { label: 'Gradient descent step', tex: '\\mathbf{w} \\leftarrow \\mathbf{w} - \\eta\\,\\nabla L(\\mathbf{w})' },
          { label: 'Learning rate', text: 'Too small: slow. Too large: the loss bounces or explodes. A first try is `0.001` for Adam and `0.01` to `0.1` for plain SGD, then tune by watching the loss curve.' },
        ],
      },
      {
        title: 'Probability and statistics',
        items: [
          { label: 'Mean, variance, standard deviation', tex: '\\mu = \\frac{1}{n}\\sum_i x_i,\\qquad \\sigma^2 = \\frac{1}{n}\\sum_i (x_i-\\mu)^2,\\qquad \\sigma = \\sqrt{\\sigma^2}' },
          { label: 'Bayes rule', tex: 'P(A\\mid B) = \\frac{P(B\\mid A)\\,P(A)}{P(B)}' },
          { label: 'Standard error of a mean', tex: '\\mathrm{SE} = \\frac{s}{\\sqrt{n}}' },
          { label: 'Standard error of a win rate', tex: '\\mathrm{SE} \\approx \\sqrt{\\frac{p(1-p)}{n}}' },
          { label: 'Rule of thumb', text: 'Treat a difference as real only if it is larger than about two combined standard errors. Halving the error needs four times the data.' },
        ],
      },
      {
        title: 'Activations and losses',
        items: [
          { label: 'Sigmoid and softmax', tex: '\\sigma(z) = \\frac{1}{1+e^{-z}},\\qquad \\mathrm{softmax}(\\mathbf{z})_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}' },
          { label: 'ReLU', tex: '\\mathrm{ReLU}(z) = \\max(0, z)' },
          { label: 'Mean squared error', tex: '\\mathrm{MSE} = \\frac{1}{n}\\sum_i (y_i-\\hat{y}_i)^2' },
          { label: 'Cross-entropy (one example)', tex: 'L = -\\sum_k y_k \\ln \\hat{y}_k = -\\ln \\hat{y}_{\\text{true class}}' },
          { label: 'Numerically stable softmax', code: 'z = z - z.max()           # subtract the max before exp\np = np.exp(z) / np.exp(z).sum()', lang: 'python' },
        ],
      },
    ],
  },
  {
    id: 'ml-numpy',
    title: 'NumPy',
    course: 'pyml',
    icon: '▦',
    description: 'Arrays, shapes, indexing, broadcasting and the vectorised idioms that replace Python loops.',
    sections: [
      {
        title: 'Creating arrays',
        items: [
          { label: 'From data', code: 'import numpy as np\na = np.array([1, 2, 3])            # dtype int64\nb = np.array([[1, 2], [3, 4]], dtype=float)', lang: 'python' },
          { label: 'Filled arrays', code: 'np.zeros((3, 4))   np.ones(5)   np.full((2, 2), 7)\nnp.eye(3)          np.empty((2, 3))   # empty = uninitialised', lang: 'python' },
          { label: 'Ranges', code: 'np.arange(0, 10, 2)        # 0 2 4 6 8 (step)\nnp.linspace(0, 1, 5)        # 5 points, both ends included', lang: 'python' },
          { label: 'Random numbers', code: 'rng = np.random.default_rng(42)       # use a seeded Generator\nrng.random(3)   rng.normal(0, 1, (2, 2))   rng.integers(0, 10, 5)\nrng.choice(items, size=3, replace=False)   rng.permutation(10)', lang: 'python' },
        ],
      },
      {
        title: 'Shape and type',
        items: [
          { label: 'Inspect', code: 'a.shape  a.ndim  a.size  a.dtype', lang: 'python' },
          { label: 'Reshape', code: 'a.reshape(2, 3)      a.reshape(-1, 1)    # -1 = work it out\na.ravel()            a.T                 # flatten, transpose', lang: 'python' },
          { label: 'Add or remove an axis', code: 'a[:, np.newaxis]     a.reshape(-1, 1)    # column vector\nnp.squeeze(b)        np.expand_dims(a, axis=0)', lang: 'python' },
          { label: 'Combine', code: 'np.concatenate([a, b], axis=0)   np.stack([a, b])   np.vstack([a, b])   np.hstack([a, b])', lang: 'python' },
          { label: 'Convert type', code: 'a.astype(np.float32)   # PyTorch and ONNX expect float32', lang: 'python' },
        ],
      },
      {
        title: 'Indexing',
        items: [
          { label: 'Slices', code: 'a[1:4]   a[::-1]   m[0, :]   m[:, 1]   m[1:3, 0:2]    # slices are views, not copies', lang: 'python' },
          { label: 'Boolean mask', code: 'a[a > 0]                 # keep the positive values\na[(a > 0) & (a < 10)]    # use & | ~ with parentheses', lang: 'python' },
          { label: 'Fancy indexing', code: 'a[[0, 2, 4]]            # these positions\nm[rows, cols]            # pick individual elements', lang: 'python' },
          { label: 'Where', code: 'np.where(a > 0, a, 0)     # choose element by element\nnp.argmax(a)  np.argmin(a)  np.argsort(a)', lang: 'python' },
        ],
      },
      {
        title: 'Math and broadcasting',
        items: [
          { label: 'Element-wise', code: 'a + b   a * b   a ** 2   np.sqrt(a)   np.exp(a)   np.log(a)   np.clip(a, 0, 1)', lang: 'python' },
          { label: 'Broadcasting rule', text: 'Compare shapes from the **right**. Two sizes are compatible if they are equal or one of them is 1 (or missing). A `(3, 4)` array plus a `(4,)` row works; plus a `(3,)` does not, but `(3, 1)` does.' },
          { label: 'Aggregate along an axis', code: 'm.sum()   m.sum(axis=0)    # one value per column\nm.mean(axis=1)             # one value per row\nm.max(axis=0, keepdims=True)', lang: 'python' },
          { label: 'Linear algebra', code: 'a @ b            # matrix product (also np.dot)\nnp.linalg.norm(a)  np.linalg.inv(m)  np.linalg.solve(m, y)\nu, s, vt = np.linalg.svd(m, full_matrices=False)', lang: 'python' },
          { label: 'Compare floats', code: 'np.allclose(a, b)      # never use == on floats', lang: 'python' },
        ],
      },
      {
        title: 'Habits that save time',
        items: [
          { label: 'Vectorise', text: 'Replace `for` loops over elements with whole-array expressions: they are 10 to 100 times faster.' },
          { label: 'Normalise', code: 'z = (x - x.mean(axis=0)) / x.std(axis=0)        # fit on the training data only', lang: 'python' },
          { label: 'Unit vectors and cosine', code: 'unit = v / np.linalg.norm(v, axis=-1, keepdims=True)\nscores = docs_unit @ query_unit        # cosine similarity of every row', lang: 'python' },
        ],
      },
    ],
  },
  {
    id: 'ml-pandas-viz',
    title: 'pandas and Matplotlib',
    course: 'pyml',
    icon: '▤',
    description: 'Loading, cleaning and summarising tables with pandas, and the plots you reach for first.',
    sections: [
      {
        title: 'Loading and looking',
        items: [
          { label: 'Read and write', code: 'import pandas as pd\ndf = pd.read_csv("players.csv")\ndf.to_csv("clean.csv", index=False)', lang: 'python' },
          { label: 'First look', code: 'df.head()  df.shape  df.dtypes  df.info()  df.describe()\ndf["class"].value_counts()    df.isna().sum()', lang: 'python' },
        ],
      },
      {
        title: 'Selecting',
        items: [
          { label: 'Columns and rows', code: 'df["hp"]   df[["hp", "level"]]\ndf.loc[0:3, "hp"]      # by label (end included)\ndf.iloc[0:3, 1]        # by position (end excluded)', lang: 'python' },
          { label: 'Filter', code: 'df[df["level"] >= 10]\ndf[(df["class"] == "mage") & (df["hp"] > 50)]\ndf.query("level >= 10 and class == \'mage\'")', lang: 'python' },
          { label: 'Sort', code: 'df.sort_values("level", ascending=False).head(5)', lang: 'python' },
        ],
      },
      {
        title: 'Cleaning and new columns',
        items: [
          { label: 'Missing values', code: 'df.dropna(subset=["hp"])\ndf["hp"] = df["hp"].fillna(df["hp"].median())', lang: 'python' },
          { label: 'Add or change a column', code: 'df["power"] = df["attack"] * df["level"]\ndf["tier"] = pd.cut(df["level"], [0, 10, 30, 100], labels=["low", "mid", "high"])', lang: 'python' },
          { label: 'Duplicates and types', code: 'df = df.drop_duplicates()\ndf["class"] = df["class"].astype("category")\ndf["date"] = pd.to_datetime(df["date"])', lang: 'python' },
          { label: 'Apply a function', code: 'df["name_len"] = df["name"].str.len()      # vectorised string methods\ndf["x"] = df["x"].map({"a": 1, "b": 2})', lang: 'python' },
        ],
      },
      {
        title: 'Summarising',
        items: [
          { label: 'Group and aggregate', code: 'df.groupby("class")["hp"].mean()\ndf.groupby("class").agg(avg_hp=("hp", "mean"), n=("hp", "size"))', lang: 'python' },
          { label: 'Join tables', code: 'pd.merge(players, guilds, on="guild_id", how="left")\npd.concat([a, b], axis=0, ignore_index=True)', lang: 'python' },
          { label: 'Cross-tab and pivot', code: 'pd.crosstab(df["class"], df["won"])\ndf.pivot_table(values="hp", index="class", columns="tier", aggfunc="mean")', lang: 'python' },
          { label: 'To NumPy for a model', code: 'X = df[["hp", "level"]].to_numpy(dtype="float32")\ny = df["won"].to_numpy()', lang: 'python' },
        ],
      },
      {
        title: 'Matplotlib',
        items: [
          { label: 'Line and scatter', code: 'import matplotlib.pyplot as plt\nfig, ax = plt.subplots(figsize=(6, 4))\nax.plot(steps, loss, label="train")\nax.scatter(x, y, s=10, alpha=0.5)\nax.set_xlabel("step"); ax.set_ylabel("loss"); ax.legend()\nfig.savefig("loss.png", dpi=150); plt.show()', lang: 'python' },
          { label: 'Histogram and bar', code: 'ax.hist(df["hp"], bins=20)\nax.bar(names, counts)', lang: 'python' },
          { label: 'Several plots', code: 'fig, axes = plt.subplots(1, 2, figsize=(10, 4))\naxes[0].plot(a)\naxes[1].plot(b)\nfig.tight_layout()', lang: 'python' },
          { label: 'Always label', text: 'Every plot needs axis labels, a title or caption and units. Plot training and validation curves **together** to spot overfitting.' },
        ],
      },
    ],
  },
  {
    id: 'ml-sklearn',
    title: 'scikit-learn',
    course: 'pyml',
    icon: '⚙',
    description: 'The standard workflow for classical machine learning: split, pipeline, cross-validate, tune, save.',
    sections: [
      {
        title: 'The basic workflow',
        items: [
          { label: 'Split the data first', code: 'from sklearn.model_selection import train_test_split\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.2, random_state=0, stratify=y)', lang: 'python' },
          { label: 'Fit, predict, score', code: 'from sklearn.ensemble import RandomForestClassifier\nmodel = RandomForestClassifier(n_estimators=200, random_state=0)\nmodel.fit(X_train, y_train)\nmodel.score(X_test, y_test)        # accuracy\nmodel.predict(X_test)  model.predict_proba(X_test)', lang: 'python' },
          { label: 'Golden rule', text: 'Anything that **learns from data** (a scaler, an imputer, feature selection) must be fitted on the training set only. A `Pipeline` does this for you.' },
        ],
      },
      {
        title: 'Pipelines',
        items: [
          { label: 'Preprocess and model together', code: 'from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\npipe = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))\npipe.fit(X_train, y_train)', lang: 'python' },
          { label: 'Mixed column types', code: 'from sklearn.compose import ColumnTransformer\nfrom sklearn.preprocessing import OneHotEncoder\nprep = ColumnTransformer([\n    ("num", StandardScaler(), ["hp", "level"]),\n    ("cat", OneHotEncoder(handle_unknown="ignore"), ["class"]),\n])\npipe = make_pipeline(prep, model)', lang: 'python' },
        ],
      },
      {
        title: 'Evaluating and tuning',
        items: [
          { label: 'Cross-validation', code: 'from sklearn.model_selection import cross_val_score\nscores = cross_val_score(pipe, X, y, cv=5, scoring="f1")\nprint(scores.mean(), scores.std())', lang: 'python' },
          { label: 'Grid search', code: 'from sklearn.model_selection import GridSearchCV\nsearch = GridSearchCV(pipe, {"randomforestclassifier__max_depth": [3, 6, None]}, cv=5)\nsearch.fit(X_train, y_train)\nsearch.best_params_  search.best_score_', lang: 'python' },
          { label: 'Report', code: 'from sklearn.metrics import classification_report, confusion_matrix\nprint(classification_report(y_test, pred))\nconfusion_matrix(y_test, pred)', lang: 'python' },
          { label: 'Touch the test set once', text: 'Tune on cross-validation scores, then evaluate on the test set **one time** at the end. Repeated peeking turns the test set into a training set.' },
        ],
      },
      {
        title: 'Choosing a model',
        items: [
          { label: 'Quick guide', text: 'Linear or logistic regression: fast, a strong baseline, explainable. Decision tree: readable but overfits. Random forest and gradient boosting (`HistGradientBoostingClassifier`): best first choice for tables. k-nearest neighbours: simple, slow on big data. k-means: finding groups without labels. PCA: reduce dimensions and visualise.' },
          { label: 'Unsupervised', code: 'from sklearn.cluster import KMeans\nfrom sklearn.decomposition import PCA\nlabels = KMeans(n_clusters=4, n_init="auto", random_state=0).fit_predict(X)\nX2 = PCA(n_components=2).fit_transform(X)', lang: 'python' },
          { label: 'Feature importance', code: 'model.feature_importances_            # trees\nfrom sklearn.inspection import permutation_importance\npermutation_importance(model, X_test, y_test, n_repeats=10, random_state=0)', lang: 'python' },
        ],
      },
      {
        title: 'Saving',
        items: [
          { label: 'Persist and reload', code: 'import joblib\njoblib.dump(pipe, "model.joblib")\npipe = joblib.load("model.joblib")      # only load files you created yourself', lang: 'python' },
        ],
      },
    ],
  },
  {
    id: 'ml-metrics',
    title: 'Metrics and Diagnostics',
    course: 'pyml',
    icon: '✔',
    description: 'Which metric to use, what the numbers mean, and how to tell underfitting from overfitting.',
    sections: [
      {
        title: 'Classification metrics',
        items: [
          { label: 'Confusion matrix terms', text: '`TP` true positives, `FP` false alarms, `FN` misses, `TN` true negatives. Rows are the true class, columns the predicted class in scikit-learn.' },
          { label: 'Accuracy', tex: '\\mathrm{accuracy} = \\frac{TP+TN}{TP+TN+FP+FN}' },
          { label: 'Precision and recall', tex: '\\mathrm{precision} = \\frac{TP}{TP+FP},\\qquad \\mathrm{recall} = \\frac{TP}{TP+FN}' },
          { label: 'F1 score', tex: 'F_1 = 2\\cdot\\frac{\\mathrm{precision}\\cdot\\mathrm{recall}}{\\mathrm{precision}+\\mathrm{recall}}' },
          { label: 'Which one?', text: 'Balanced classes: accuracy is fine. Rare positives (cheaters, bugs): look at **precision, recall, F1** or ROC-AUC. Missing a case is expensive: favour recall. False alarms are expensive: favour precision.' },
          { label: 'Imbalance trap', text: 'If 95 percent of samples are negative, always answering “negative” scores 95 percent accuracy. Always compare with a **baseline** such as `DummyClassifier`.' },
        ],
      },
      {
        title: 'Regression metrics',
        items: [
          { label: 'MAE and RMSE', tex: '\\mathrm{MAE} = \\frac{1}{n}\\sum_i |y_i-\\hat{y}_i|,\\qquad \\mathrm{RMSE} = \\sqrt{\\frac{1}{n}\\sum_i (y_i-\\hat{y}_i)^2}' },
          { label: 'R squared', tex: 'R^2 = 1 - \\frac{\\sum_i (y_i-\\hat{y}_i)^2}{\\sum_i (y_i-\\bar{y})^2}' },
          { label: 'Which one?', text: 'MAE is in the target’s own units and robust to outliers; RMSE punishes large errors more. `R²` of 0 means “no better than predicting the mean”.' },
        ],
      },
      {
        title: 'Diagnosing a model',
        items: [
          { label: 'Underfitting (high bias)', text: 'Training **and** validation error are both high. Fix: a more flexible model, better features, less regularisation, train longer.' },
          { label: 'Overfitting (high variance)', text: 'Training error is low but validation error is much higher. Fix: more data, simpler model, regularisation (weight decay, dropout), early stopping, data augmentation.' },
          { label: 'Learning curves', text: 'Plot the loss on training and validation data against training steps. A widening gap means overfitting; two high flat lines mean underfitting.' },
          { label: 'Data leakage checklist', text: 'Scaling or imputing before the split · duplicates or near-copies across train and test · features that contain the answer (or are known only afterwards) · splitting by row when you should split by player, match or video.' },
        ],
      },
      {
        title: 'Trustworthy evaluation',
        items: [
          { label: 'Splits', text: 'Train fits the model, **validation** tunes choices, **test** gives the final honest number, used once.' },
          { label: 'Cross-validation', text: '`cv=5` trains five times on different folds and reports the spread. Use `StratifiedKFold` for imbalanced classes and `GroupKFold` when samples from one source are related.' },
          { label: 'Uncertainty', text: 'Report the mean **and** the spread (or standard error). A small difference on a small test set is noise.' },
        ],
      },
    ],
  },
  {
    id: 'ml-pytorch',
    title: 'PyTorch',
    course: 'pyml',
    icon: '🔥',
    description: 'Tensors, autograd, models, the training loop, saving and the mistakes that cause most errors.',
    sections: [
      {
        title: 'Tensors',
        items: [
          { label: 'Create', code: 'import torch\nx = torch.tensor([[1.0, 2.0], [3.0, 4.0]])\ntorch.zeros(2, 3)  torch.ones(2, 3)  torch.randn(2, 3)  torch.arange(10)', lang: 'python' },
          { label: 'Inspect', code: 'x.shape  x.dtype  x.device  x.ndim', lang: 'python' },
          { label: 'NumPy bridge', code: 'a = x.numpy()                  # shares memory (CPU only)\nt = torch.from_numpy(arr)       # float64 arrays give float64 tensors\nt = torch.as_tensor(arr, dtype=torch.float32)', lang: 'python' },
          { label: 'Move and cast', code: 'device = "cuda" if torch.cuda.is_available() else "cpu"\nx = x.to(device)       x = x.float()       idx = idx.long()', lang: 'python' },
          { label: 'Shape tools', code: 'x.view(-1, 4)  x.reshape(2, -1)  x.unsqueeze(0)  x.squeeze()  x.permute(0, 2, 1)\ntorch.cat([a, b], dim=0)   torch.stack([a, b])', lang: 'python' },
          { label: 'Math', code: 'a @ b   a * b   x.sum(dim=0)   x.mean()   x.argmax(dim=1)   torch.softmax(x, dim=1)', lang: 'python' },
        ],
      },
      {
        title: 'Autograd',
        items: [
          { label: 'Gradients', code: 'w = torch.tensor(2.0, requires_grad=True)\nloss = (3 * w - 1) ** 2\nloss.backward()\nw.grad          # tensor(30.)', lang: 'python' },
          { label: 'Switch gradients off', code: 'with torch.no_grad():\n    prediction = model(x)        # evaluation: faster, less memory\nlogits = model(x).detach()       # cut one tensor from the graph', lang: 'python' },
          { label: 'Gradients accumulate', text: '`backward()` **adds** to `.grad`. Call `optimizer.zero_grad()` every step or the gradients pile up.' },
        ],
      },
      {
        title: 'Building a model',
        items: [
          { label: 'Sequential', code: 'from torch import nn\nmodel = nn.Sequential(\n    nn.Linear(10, 64), nn.ReLU(),\n    nn.Linear(64, 3),             # raw scores (logits) for 3 classes\n)', lang: 'python' },
          { label: 'A custom module', code: 'class Net(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.body = nn.Sequential(nn.Linear(10, 64), nn.ReLU())\n        self.head = nn.Linear(64, 3)\n\n    def forward(self, x):\n        return self.head(self.body(x))', lang: 'python' },
          { label: 'Count parameters', code: 'sum(p.numel() for p in model.parameters())', lang: 'python' },
        ],
      },
      {
        title: 'The training loop',
        items: [
          { label: 'Data in batches', code: 'from torch.utils.data import TensorDataset, DataLoader\nloader = DataLoader(TensorDataset(X, y), batch_size=64, shuffle=True)', lang: 'python' },
          { label: 'One epoch', code: 'loss_fn = nn.CrossEntropyLoss()\noptimizer = torch.optim.Adam(model.parameters(), lr=1e-3)\nmodel.train()\nfor xb, yb in loader:\n    xb, yb = xb.to(device), yb.to(device)\n    optimizer.zero_grad()\n    loss = loss_fn(model(xb), yb)\n    loss.backward()\n    optimizer.step()', lang: 'python' },
          { label: 'Evaluate', code: 'model.eval()\nwith torch.no_grad():\n    acc = (model(X_val).argmax(dim=1) == y_val).float().mean().item()', lang: 'python' },
          { label: 'The five lines', text: 'zero the gradients → forward pass → loss → `backward()` → `step()`. Every PyTorch training loop is this.' },
        ],
      },
      {
        title: 'Saving and loading',
        items: [
          { label: 'Weights only', code: 'torch.save(model.state_dict(), "model.pt")\nmodel = Net()\nmodel.load_state_dict(torch.load("model.pt", weights_only=True))\nmodel.eval()', lang: 'python' },
          { label: 'Reproducibility', code: 'torch.manual_seed(0)       # also seed NumPy and `random` if you use them', lang: 'python' },
        ],
      },
      {
        title: 'Common errors',
        items: [
          { label: 'Shape mismatch', text: 'Print `x.shape` after each layer. `mat1 and mat2 shapes cannot be multiplied` means the `Linear` input size does not match the previous output.' },
          { label: 'Wrong dtype', text: '`CrossEntropyLoss` wants float logits and **long** class indices. Mixed `float64` and `float32` raises an error: use `.float()`.' },
          { label: 'Forgot eval / no_grad', text: 'Dropout and batch norm behave differently in `model.train()` and `model.eval()`. Evaluating in train mode gives noisy scores.' },
          { label: 'Memory growing', text: 'Keeping `loss` (not `loss.item()`) in a list keeps the whole graph alive. Store numbers, not tensors.' },
        ],
      },
    ],
  },
  {
    id: 'ml-deep-learning',
    title: 'Deep Learning',
    course: 'pyml',
    icon: '🧠',
    description: 'Layers, losses, optimisers, regularisation, CNN shape arithmetic and a training checklist.',
    sections: [
      {
        title: 'Layers',
        items: [
          { label: 'Linear', text: '`nn.Linear(in, out)` has `in × out + out` parameters. The default building block.' },
          { label: 'Convolution', text: '`nn.Conv2d(in_ch, out_ch, k)` has `out_ch × in_ch × k × k + out_ch` parameters, whatever the image size. Input shape `(batch, channels, height, width)`.' },
          { label: 'Output size of a convolution or pool', tex: 'n_{\\text{out}} = \\left\\lfloor \\frac{n + 2p - k}{s} \\right\\rfloor + 1' },
          { label: 'Normalisation', text: '`BatchNorm` normalises over the batch (CNNs, big batches). `LayerNorm` normalises over features (transformers). Both speed up and stabilise training.' },
          { label: 'Dropout', text: '`nn.Dropout(0.1 to 0.5)` randomly zeroes activations during training only. A cheap regulariser.' },
          { label: 'Sequences and text', text: '`nn.Embedding` turns integer ids into vectors. `nn.LSTM`/`nn.GRU` read sequences step by step. A **transformer** uses attention to let every position look at every other one.' },
        ],
      },
      {
        title: 'Losses',
        items: [
          { label: 'Choose by task', text: 'Regression: `nn.MSELoss` (or `nn.L1Loss`, `nn.HuberLoss` for outliers). Multi-class: `nn.CrossEntropyLoss` with logits and class indices. Binary or multi-label: `nn.BCEWithLogitsLoss` with logits.' },
          { label: 'Do not add softmax yourself', text: '`CrossEntropyLoss` already applies log-softmax. Feeding it probabilities gives a worse, flatter gradient.' },
          { label: 'Logits to probabilities', code: 'probs = torch.softmax(logits, dim=1)       # classes\nprobs = torch.sigmoid(logits)               # binary', lang: 'python' },
        ],
      },
      {
        title: 'Optimisers and schedules',
        items: [
          { label: 'Defaults that work', code: 'opt = torch.optim.Adam(model.parameters(), lr=1e-3)\nopt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)\nopt = torch.optim.SGD(model.parameters(), lr=0.05, momentum=0.9)', lang: 'python' },
          { label: 'Learning-rate schedule', code: 'sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)\n# call sched.step() once per epoch', lang: 'python' },
          { label: 'Gradient clipping', code: 'loss.backward()\ntorch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)\nopt.step()', lang: 'python' },
        ],
      },
      {
        title: 'Fighting overfitting',
        items: [
          { label: 'Toolbox', text: 'More data · data augmentation · dropout · weight decay · a smaller model · **early stopping** (keep the weights with the best validation loss) · transfer learning.' },
          { label: 'Transfer learning', code: 'from torchvision import models\nnet = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)\nfor p in net.parameters():\n    p.requires_grad = False          # freeze\nnet.fc = nn.Linear(net.fc.in_features, n_classes)   # new trainable head', lang: 'python' },
        ],
      },
      {
        title: 'Training checklist',
        items: [
          { label: 'Before training', text: 'Scale inputs (mean 0, spread 1, or 0 to 1 for pixels) · check shapes with one batch · check labels are what you think · split by source to avoid leakage.' },
          { label: 'First test', text: 'Make the model **overfit one small batch** to near-zero loss. If it cannot, there is a bug (wrong loss, labels, learning rate, zero_grad).' },
          { label: 'While training', text: 'Log training and validation loss every epoch, plot them, and save the best checkpoint. The loss should fall within the first few steps.' },
          { label: 'Symptoms', text: 'Loss is `nan`: learning rate too high or bad input values. Loss does not move: learning rate too low, frozen weights, or labels shuffled apart from inputs. Training good and validation bad: overfitting.' },
        ],
      },
    ],
  },
  {
    id: 'ml-rl',
    title: 'Reinforcement Learning',
    course: 'pyml',
    icon: '🎮',
    description: 'The vocabulary, the key formulas, the Gymnasium loop and Stable-Baselines3 in one page.',
    sections: [
      {
        title: 'Vocabulary',
        items: [
          { label: 'The loop', text: 'An **agent** sees an **observation**, picks an **action**, the **environment** returns a **reward** and a new observation. The agent learns a **policy** (observation to action) that maximises the total future reward.' },
          { label: 'Episode end', text: '`terminated`: the task really ended (goal, death). `truncated`: a time limit cut it short. Value estimates may continue (bootstrap) after truncation, but not after termination.' },
          { label: 'Exploration vs exploitation', text: 'Try new things to find better actions, but use what you know to score. Common tools: epsilon-greedy, entropy bonus, random action noise.' },
          { label: 'On-policy and off-policy', text: 'On-policy (PPO) learns from data collected by the current policy. Off-policy (DQN, SAC) can reuse older experience from a replay buffer.' },
        ],
      },
      {
        title: 'Key formulas',
        items: [
          { label: 'Discounted return', tex: 'G_t = \\sum_{k=0}^{\\infty} \\gamma^{k}\\, r_{t+k+1},\\qquad 0\\le\\gamma\\le 1' },
          { label: 'Q-learning update', tex: 'Q(s,a) \\leftarrow Q(s,a) + \\alpha\\left[r + \\gamma \\max_{a\\prime} Q(s\\prime,a\\prime) - Q(s,a)\\right]' },
          { label: 'Advantage', tex: 'A(s,a) = Q(s,a) - V(s)' },
          { label: 'PPO clipped objective', tex: 'L = \\mathbb{E}\\left[\\min\\left(\\rho_t A_t,\\ \\mathrm{clip}(\\rho_t, 1-\\epsilon, 1+\\epsilon)\\,A_t\\right)\\right],\\quad \\rho_t = \\frac{\\pi_{\\text{new}}(a_t\\mid s_t)}{\\pi_{\\text{old}}(a_t\\mid s_t)}' },
          { label: 'Discount factor intuition', text: '`gamma = 0.99` looks about 100 steps ahead; `0.9` about 10. Higher gamma needs longer training and gives more far-sighted behaviour.' },
        ],
      },
      {
        title: 'Gymnasium',
        items: [
          { label: 'The standard loop', code: 'import gymnasium as gym\nenv = gym.make("CartPole-v1")\nobs, info = env.reset(seed=0)\ndone = False\nwhile not done:\n    action = env.action_space.sample()\n    obs, reward, terminated, truncated, info = env.step(action)\n    done = terminated or truncated\nenv.close()', lang: 'python' },
          { label: 'Spaces', code: 'from gymnasium import spaces\nspaces.Discrete(3)                                   # actions 0, 1, 2\nspaces.Box(low=-1, high=1, shape=(4,), dtype=np.float32)   # 4 numbers', lang: 'python' },
          { label: 'Custom environment skeleton', code: 'class MyEnv(gym.Env):\n    def __init__(self):\n        self.observation_space = spaces.Box(-1, 1, (4,), np.float32)\n        self.action_space = spaces.Discrete(3)\n    def reset(self, seed=None, options=None):\n        super().reset(seed=seed)\n        return obs, {}\n    def step(self, action):\n        return obs, reward, terminated, truncated, {}', lang: 'python' },
          { label: 'Check it', code: 'from gymnasium.utils.env_checker import check_env\ncheck_env(MyEnv())', lang: 'python' },
        ],
      },
      {
        title: 'Stable-Baselines3',
        items: [
          { label: 'Train, save, load', code: 'from stable_baselines3 import PPO\nmodel = PPO("MlpPolicy", env, seed=0, verbose=1)\nmodel.learn(total_timesteps=100_000)\nmodel.save("agent")\nmodel = PPO.load("agent")', lang: 'python' },
          { label: 'Act', code: 'action, _ = model.predict(obs, deterministic=True)     # greedy at test time', lang: 'python' },
          { label: 'Many environments at once', code: 'from stable_baselines3.common.env_util import make_vec_env\nenv = make_vec_env(MyEnv, n_envs=8, seed=0)', lang: 'python' },
          { label: 'Evaluate', code: 'from stable_baselines3.common.evaluation import evaluate_policy\nmean, std = evaluate_policy(model, MyEnv(), n_eval_episodes=100)', lang: 'python' },
          { label: 'Which algorithm', text: 'PPO: the reliable default (discrete or continuous). DQN: discrete actions, small problems. SAC or TD3: continuous control, sample-efficient.' },
        ],
      },
      {
        title: 'Reward and debugging checklist',
        items: [
          { label: 'Reward design', text: 'Reward the **goal**, add small dense hints only if learning stalls, and keep their total smaller than the goal reward. Look for ways the agent could cheat (**reward hacking**).' },
          { label: 'Observation design', text: 'Include everything needed to decide, scale it to about -1..1, make it relative (distance to the ball) rather than absolute when possible.' },
          { label: 'Evaluate honestly', text: 'Fixed evaluation seeds different from training, many episodes, deterministic actions, report mean and standard error, compare with a random and a hand-written baseline, and repeat training with several seeds.' },
          { label: 'When it does not learn', text: 'Check the environment by hand first (can a script solve it?), then rewards (is the signal reachable by chance?), then episode length, learning rate and the number of steps.' },
        ],
      },
    ],
  },
  {
    id: 'ml-rlgym',
    title: 'RLGym and Game Bots',
    course: 'pyml',
    icon: '🚗',
    description: 'RLGym v2 pieces, an environment you can copy, custom rewards and states, and training tips for game bots.',
    sections: [
      {
        title: 'The pieces of an RLGym environment',
        items: [
          { label: 'State mutator', text: 'Builds the starting state of each episode: team sizes, kickoff or custom positions, boost. Combine with `MutatorSequence(...)`. Write your own to make a **curriculum**.' },
          { label: 'Observation builder', text: 'Turns the state into one vector per agent. `DefaultObs` mirrors the field for orange so one policy can play both teams.' },
          { label: 'Action parser', text: 'Maps the policy’s choice to controller inputs. `LookupTableAction` gives 90 useful discrete actions; `RepeatAction(..., repeats=8)` holds each for 8 ticks (tick skip).' },
          { label: 'Reward function', text: 'Returns a reward per agent. `CombinedReward((GoalReward(), 10.0), (TouchReward(), 0.1))` mixes terms with weights.' },
          { label: 'Termination and truncation', text: '`GoalCondition()` ends on a goal. `AnyCondition(TimeoutCondition(300.0), NoTouchTimeoutCondition(30.0))` truncates idle or long episodes.' },
          { label: 'Transition engine', text: '`RocketSimEngine()` simulates the game physics in C++ without the game running, thousands of times faster than real time.' },
        ],
      },
      {
        title: 'A working environment',
        items: [
          { label: 'Build it', code: 'from rlgym.api import RLGym\nfrom rlgym.rocket_league.action_parsers import LookupTableAction, RepeatAction\nfrom rlgym.rocket_league.done_conditions import AnyCondition, GoalCondition, NoTouchTimeoutCondition, TimeoutCondition\nfrom rlgym.rocket_league.obs_builders import DefaultObs\nfrom rlgym.rocket_league.reward_functions import CombinedReward, GoalReward, TouchReward\nfrom rlgym.rocket_league.sim import RocketSimEngine\nfrom rlgym.rocket_league.state_mutators import FixedTeamSizeMutator, KickoffMutator, MutatorSequence\n\nenv = RLGym(\n    state_mutator=MutatorSequence(FixedTeamSizeMutator(blue_size=1, orange_size=1), KickoffMutator()),\n    obs_builder=DefaultObs(zero_padding=None),\n    action_parser=RepeatAction(LookupTableAction(), repeats=8),\n    reward_fn=CombinedReward((GoalReward(), 10.0), (TouchReward(), 0.1)),\n    termination_cond=GoalCondition(),\n    truncation_cond=AnyCondition(TimeoutCondition(300.0), NoTouchTimeoutCondition(30.0)),\n    transition_engine=RocketSimEngine(),\n)', lang: 'python' },
          { label: 'Step it', code: 'obs = env.reset()                       # dict: agent name -> observation\nactions = {agent: rng.integers(90, size=1) for agent in env.agents}\nobs, rewards, terminated, truncated = env.step(actions)   # all dicts\nenv.close()', lang: 'python' },
          { label: 'Install', code: 'pip install rlgym rlgym-rocket-league rocketsim', lang: 'shell' },
        ],
      },
      {
        title: 'Custom components',
        items: [
          { label: 'A reward function', code: 'from rlgym.api import RewardFunction\n\nclass MyReward(RewardFunction):\n    def reset(self, agents, initial_state, shared_info):\n        pass\n\n    def get_rewards(self, agents, state, is_terminated, is_truncated, shared_info):\n        return {agent: float(...) for agent in agents}', lang: 'python' },
          { label: 'A state mutator', code: 'from rlgym.api import StateMutator\n\nclass MyStart(StateMutator):\n    def apply(self, state, shared_info):\n        state.ball.position = np.array([0, 1000, 100], dtype=np.float32)', lang: 'python' },
          { label: 'Reward principles', text: 'Sparse goal reward as the anchor, small **dense** shaping (speed toward the ball, touches) with weights that decay as the bot improves, and no reward that can be farmed by doing nothing useful.' },
        ],
      },
      {
        title: 'Training a bot',
        items: [
          { label: 'Scale', text: 'Rocket League bots need millions to billions of steps: many parallel environments, big batches, and a GPU for the network. Start with a 1v0 task to check that learning works at all.' },
          { label: 'Curriculum', text: 'Start easy (ball near the goal, car facing it) and widen the starting states as the success rate rises.' },
          { label: 'Self-play', text: 'Play against a **pool of past versions** (not only the latest) to avoid forgetting how to beat older strategies. Rate versions with Elo.' },
          { label: 'Imitation first', text: 'Behavioural cloning on recorded replays gives a warm start; fine-tune with RL, and add DAgger-style corrections where the clone drifts.' },
          { label: 'Ship it', text: 'Export the actor to ONNX, rebuild the observation builder exactly in the bot runtime, handle tick skip, and verify by comparing actions on recorded observations.' },
        ],
      },
    ],
  },
  {
    id: 'ml-llm-rag',
    title: 'LLM APIs, Embeddings and RAG',
    course: 'pyml',
    icon: '💬',
    description: 'Calling a language model, tool use, structured output, embeddings, semantic search and retrieval-augmented generation.',
    sections: [
      {
        title: 'A basic API call',
        items: [
          { label: 'Anthropic SDK', code: 'import anthropic\nclient = anthropic.Anthropic()        # key from ANTHROPIC_API_KEY\nresponse = client.messages.create(\n    model="claude-sonnet-5-5",         # check the current model names\n    max_tokens=300,\n    system="You are Brenna, a gruff blacksmith.",\n    messages=[{"role": "user", "content": "Do you sell swords?"}],\n)\nprint(response.content[0].text)\nprint(response.stop_reason, response.usage.input_tokens, response.usage.output_tokens)', lang: 'python' },
          { label: 'Stateless', text: 'The model remembers nothing between calls. Your program resends the whole history each time, so cost and latency grow with the conversation. Trim or summarise old turns.' },
          { label: 'Stop reasons', text: '`end_turn` finished normally · `max_tokens` was cut off · `tool_use` wants a function run.' },
        ],
      },
      {
        title: 'Tool use and structured output',
        items: [
          { label: 'Tool loop', text: 'Send tool descriptions → model replies with `tool_use` blocks → **your code runs them** → append the assistant message, then a user message with `tool_result` blocks → repeat until `end_turn`. Cap the number of rounds.' },
          { label: 'Tools are a boundary', text: 'Keep tools narrow, validate every argument, give least privilege, and confirm anything that spends or changes state.' },
          { label: 'Structured output', text: 'Ask for JSON, then **extract, parse, validate, retry with the list of problems**. Never trust the shape or the values. Use schema-constrained output if the API offers it.' },
          { label: 'Retry on transient errors', code: 'for attempt in range(retries + 1):\n    try:\n        return func()\n    except (TimeoutError, ConnectionError):\n        if attempt == retries:\n            raise\n        time.sleep(base_delay * 2 ** attempt)     # exponential backoff', lang: 'python' },
          { label: 'Prompt injection', text: 'Text from players or documents is **data**, not instructions. Keep secrets and powers out of the prompt and enforce rules in code.' },
        ],
      },
      {
        title: 'Embeddings and search',
        items: [
          { label: 'TF-IDF', tex: '\\mathrm{tfidf}(w,d) = \\mathrm{tf}(w,d)\\cdot\\ln\\frac{N}{\\mathrm{df}(w)}' },
          { label: 'Cosine similarity of all documents', code: 'doc_unit = docs / np.linalg.norm(docs, axis=1, keepdims=True)\nquery_unit = q / np.linalg.norm(q)\nscores = doc_unit @ query_unit\ntop = np.argsort(-scores)[:3]', lang: 'python' },
          { label: 'Real embeddings', code: 'from sentence_transformers import SentenceTransformer\nmodel = SentenceTransformer("all-MiniLM-L6-v2")\nvectors = model.encode(texts, normalize_embeddings=True)   # shape (n, 384)', lang: 'python' },
          { label: 'Rules', text: 'Use the **same** model for documents and queries, store its name with the vectors, and re-embed everything when you change it. A NumPy matrix is enough up to hundreds of thousands of vectors.' },
        ],
      },
      {
        title: 'RAG',
        items: [
          { label: 'Pipeline', text: '**Chunk** → **embed and index** → **retrieve** top k → **grounded prompt** (numbered sources, answer only from them, cite, say when unknown) → **generate**.' },
          { label: 'Chunking', text: 'A few sentences to a short paragraph (about 100 to 300 words), split on natural boundaries, 10 to 20 percent overlap.' },
          { label: 'Grounded prompt', code: 'prompt = ("Answer using ONLY the sources below. Cite them like [1]. "\n          "If they do not contain the answer, say you do not know.\\n\\n"\n          f"Sources:\\n{sources}\\n\\nQuestion: {question}")', lang: 'python' },
          { label: 'Measure retrieval alone', text: 'Write 20 to 100 real questions with the right source. Track **recall at k** (is a correct chunk in the top k?) after every change. If retrieval fails, no prompt can save the answer.' },
          { label: 'Improve', text: 'Metadata filters · hybrid keyword plus embedding search · better chunk size · a re-ranking step · adding the document title to each chunk.' },
        ],
      },
    ],
  },
  {
    id: 'ml-serving',
    title: 'Serving and Deploying Models',
    course: 'pyml',
    icon: '🚀',
    description: 'Saving models safely, a FastAPI service, ONNX, quantization, batching, percentiles and an operations checklist.',
    sections: [
      {
        title: 'Saving a model',
        items: [
          { label: 'Ship the preprocessing', text: 'The bundle is weights **plus** scaling statistics, image size, feature order, label names and a **version**. Use one preprocessing function for training and serving.' },
          { label: 'Formats', text: '**ONNX** portable inference · **safetensors** or `torch.load(..., weights_only=True)` for weights from outside · joblib/pickle only for files you made yourself (they can run code) · JSON for tiny models.' },
        ],
      },
      {
        title: 'FastAPI service',
        items: [
          { label: 'Skeleton', code: 'from fastapi import FastAPI\nfrom pydantic import BaseModel, Field\n\napp = FastAPI()\nMODEL = load_model("model.onnx")        # once, at startup\n\nclass Player(BaseModel):\n    hours: float = Field(ge=0, le=10_000)\n\n@app.get("/health")\ndef health():\n    return {"status": "ok", "model_version": "1"}\n\n@app.post("/predict")\ndef predict(player: Player):\n    return {"risk": MODEL.predict(player.hours)}', lang: 'python' },
          { label: 'Run', code: 'pip install fastapi uvicorn\nuvicorn service:app --port 8000          # docs at http://127.0.0.1:8000/docs', lang: 'shell' },
          { label: 'Test without a network', code: 'from fastapi.testclient import TestClient\nclient = TestClient(app)\nassert client.post("/predict", json={"hours": -1}).status_code == 422', lang: 'python' },
        ],
      },
      {
        title: 'ONNX',
        items: [
          { label: 'Export a PyTorch model', code: 'model.eval()\ntorch.onnx.export(model, (torch.zeros(1, 8),), "policy.onnx",\n                  input_names=["obs"], output_names=["scores"],\n                  dynamic_shapes=({0: torch.export.Dim("batch")},))', lang: 'python' },
          { label: 'Run it', code: 'import onnxruntime as ort\nsession = ort.InferenceSession("policy.onnx")\nscores = session.run(["scores"], {"obs": obs.astype(np.float32)})[0]', lang: 'python' },
          { label: 'Always verify', text: 'Compare the ONNX output with the original model on real inputs (`np.allclose`, or compare the chosen actions) before shipping.' },
        ],
      },
      {
        title: 'Speed',
        items: [
          { label: 'Quantization', text: 'Store weights as 8-bit integers: about **4 times smaller**, often faster, a small accuracy cost. Re-measure accuracy afterwards.' },
          { label: 'Micro-batching', text: 'Hold requests a few milliseconds and run them as one batch to share the fixed cost per call. Raises throughput, adds a little latency.' },
          { label: 'Capacity arithmetic', tex: '\\text{requests/s} = \\frac{\\text{batch size}}{\\text{overhead}+\\text{batch size}\\times\\text{per item}}' },
          { label: 'Cache repeats', text: 'Cache by input (LRU) and include the **model version** in the cache key.' },
        ],
      },
      {
        title: 'Operating it',
        items: [
          { label: 'Latency', text: 'Track **percentiles** (p50, p95, p99), not the average. Set timeouts and have a cheap fallback answer.' },
          { label: 'Releases', text: 'Version every model, return the version with each answer, roll out to a small share first (canary), compare against the old model on the same inputs (shadow), and keep rollback one switch away.' },
          { label: 'Monitor and protect', text: 'Watch input and output distributions for drift. Add authentication, rate limits and a maximum request size. Never expose model files or internal errors.' },
          { label: 'Where to run it', text: 'Inside the game (ONNX Runtime) for per-frame decisions and offline play · local server for Python-only models · remote server for big models and central updates · hosted API for the largest models · on-device runtimes for phones.' },
        ],
      },
    ],
  },
];
