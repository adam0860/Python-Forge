import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-unsupervised',
  title: 'Clustering and Dimensionality Reduction',
  summary: 'Learning without labels: group similar examples with k-means, choose the number of clusters, and compress many features into a few with PCA. Includes the from-scratch algorithms, scikit-learn, and uses in games.',
  minutes: 22,
  objectives: [
    'Explain unsupervised learning and how it differs from supervised learning',
    'Run the k-means algorithm step by step (assign, then update) and know why it converges',
    'Choose the number of clusters with inertia (the elbow) and the silhouette score, and name k-means’ limits',
    'Explain PCA as finding directions of maximum variance, and read explained variance ratios',
    'Apply clustering and PCA to realistic problems such as player segmentation, anomaly detection and visualization',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Unsupervised learning and k-means clustering',
      blocks: [
        {
          type: 'p',
          text: 'Everything so far in this unit was **[[supervised-learning|supervised]]**: every training example came with a label to predict. **[[unsupervised-learning|Unsupervised learning]]** has *no labels*; the goal is to find structure in the features alone. Two tasks dominate. **[[clustering]]** groups similar examples ("these players behave alike"). **[[dimensionality-reduction|Dimensionality reduction]]** summarizes many features with a few ("these 50 columns are really 3 independent things"). There is no accuracy to compute against a ground truth, so evaluating the result takes more judgement.',
        },
        {
          type: 'p',
          text: '**[[k-means]]** is the classic clustering algorithm. You choose the number of clusters `k`; the algorithm finds `k` **centroids** (cluster centres) so that every point is close to the centroid of its own cluster. It alternates two steps (Lloyd’s algorithm): **assign** each point to its nearest centroid, then **update** each centroid to the mean of the points assigned to it. Repeat until nothing changes. Each step can only lower the total squared distance (the **inertia**), which is why it always converges, though possibly to a local optimum that depends on the starting centroids.',
        },
        {
          type: 'math',
          tex: '\\text{inertia} = \\sum_{i} \\left\\lVert \\mathbf{x}_i - \\boldsymbol{\\mu}_{c(i)} \\right\\rVert^2 \\qquad c(i) = \\arg\\min_k \\left\\lVert \\mathbf{x}_i - \\boldsymbol{\\mu}_k \\right\\rVert^2 \\qquad \\boldsymbol{\\mu}_k = \\frac{1}{|C_k|}\\sum_{i \\in C_k} \\mathbf{x}_i',
          caption: 'The objective k-means minimizes: the total squared distance from each point to the centroid of its cluster, with each point assigned to its nearest centroid and each centroid the mean of its cluster.',
        },
        {
          type: 'p',
          text: 'Below, nine points form three obvious groups, but the starting centroids are chosen badly (two of them in the same group). Watch the algorithm recover:',
        },
        {
          type: 'code',
          title: 'kmeans_by_hand.py',
          runnable: true,
          code: `points = [(1, 1), (1.5, 2), (2, 1.5), (8, 8), (9, 8.5), (8.5, 9), (1, 8), (2, 9), (1.5, 8.5)]
centroids = [(1, 1), (1.5, 2), (8, 8)]

def dist2(p, c):
    return (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2

for step in range(1, 10):
    labels = [min(range(3), key=lambda k: dist2(p, centroids[k])) for p in points]
    new = []
    for k in range(3):
        members = [p for p, lab in zip(points, labels) if lab == k]
        if members:
            new.append((sum(m[0] for m in members) / len(members), sum(m[1] for m in members) / len(members)))
        else:
            new.append(centroids[k])
    inertia = sum(dist2(p, new[lab]) for p, lab in zip(points, labels))
    print(step, labels, round(inertia, 2))
    if new == centroids:
        break
    centroids = new
print([(round(x, 2), round(y, 2)) for x, y in centroids])`,
          output: `1 [0, 1, 1, 2, 2, 2, 1, 2, 1] 75.88
2 [0, 0, 0, 2, 2, 2, 1, 1, 1] 3.0
3 [0, 0, 0, 2, 2, 2, 1, 1, 1] 3.0
[(1.5, 1.5), (1.5, 8.5), (8.5, 8.5)]`,
          annotations: [
            { lines: '1-2', text: 'Nine 2-D points in three groups (bottom-left, top-right, top-left) and three starting centroids. The first two start in the *same* group, a deliberately poor start.' },
            { lines: '4-5', text: 'Squared distance between a point and a centroid. Comparing squared distances picks the same nearest centroid and avoids the square root.' },
            { lines: 8, text: '**Assign step**: each point gets the index of the nearest centroid (`min` over the indices, using the distance as the key).' },
            { lines: '9-15', text: '**Update step**: each new centroid is the mean of its members. If a cluster ends up with no members, keep its old centroid.' },
            { lines: 16, text: 'The inertia: total squared distance from the points to their (new) centroids.' },
            { lines: 17, text: 'Print the step number, the labels, and the inertia.' },
            { lines: '18-20', text: 'Stop when the centroids no longer move; otherwise continue with the new ones.' },
            { lines: 21, text: 'After the first round the labelling is still wrong (the inertia is 75.9): the poorly placed centroids split the points badly. After one more assign-and-update the inertia collapses to 3.0 and the labels match the three groups; the third round changes nothing, so it stops. The final centroids are the group means.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Starting points matter',
          text: 'Because k-means only reaches a *local* optimum, a bad start can give a bad clustering. The standard remedies: **k-means++** (choose initial centroids far apart, the scikit-learn default) and running several restarts (`n_init`), keeping the run with the lowest inertia.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which of these tasks is an example of unsupervised learning?',
      options: [
        { text: 'Grouping players into playstyle segments using only their gameplay statistics, with no predefined groups', correct: true, why: 'There is no label to predict: the algorithm discovers groups from the features alone, which is clustering.' },
        { text: 'Predicting tomorrow’s concurrent player count from past counts', why: 'The past data provides the target values (the actual counts), so this is supervised regression.' },
        { text: 'Classifying chat messages as toxic or not using messages labelled by moderators', why: 'The moderators’ labels are the targets, so this is supervised classification.' },
        { text: 'Training an agent by rewarding it for winning a match', why: 'Learning from rewards through interaction is reinforcement learning, a separate paradigm.' },
      ],
      explanation: 'Supervised learning needs labelled examples, reinforcement learning needs a reward signal from interaction, and unsupervised learning finds patterns in unlabelled data.',
    },
    {
      kind: 'concept',
      title: 'Choosing k, and what k-means cannot do',
      blocks: [
        {
          type: 'p',
          text: 'k-means asks *you* for `k`, but real data rarely announces how many clusters it has. Two practical tools help. The **elbow method** plots the inertia against `k`: it always falls as `k` grows (more centroids means shorter distances, down to zero when every point is its own cluster), so look for the "elbow" where adding clusters stops paying off. The **silhouette score** measures for each point how much closer it is to its own cluster than to the nearest other cluster, from −1 (probably in the wrong cluster) to +1 (clearly well placed); take the `k` with the highest average. Here is both on 300 points drawn from four noisy blobs:',
        },
        {
          type: 'code',
          title: 'choose_k.py',
          runnable: true,
          packages: ['scikit-learn', 'numpy'],
          code: `import numpy as np
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs
from sklearn.metrics import silhouette_score

X, _ = make_blobs(n_samples=300, centers=4, cluster_std=0.8, random_state=3)
for k in range(2, 8):
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X)
    print(k, round(km.inertia_, 1), round(silhouette_score(X, km.labels_), 2))`,
          output: `2 4627.2 0.64
3 1875.0 0.66
4 397.6 0.78
5 356.4 0.67
6 318.1 0.55
7 282.5 0.44`,
          outputVaries: true,
          annotations: [
            { lines: 6, text: '300 points around four centres (`make_blobs`); the throwaway `_` is the true cluster label, which we deliberately ignore.' },
            { lines: 7, text: 'Try every `k` from 2 to 7.' },
            { lines: 8, text: '`KMeans` with k-means++ initialization and 10 restarts, keeping the best. `.fit(X)` takes no labels at all.' },
            { lines: 9, text: 'Print `k`, the inertia and the average silhouette score. The inertia drops steeply until k = 4 (1875 to 398) and then barely improves (356, 318, 282): the **elbow** is at 4. The silhouette agrees: it peaks at 0.78 for k = 4 and falls afterwards. Both point to the four blobs we generated. Real data is rarely this clean, so treat the numbers as a guide, and ask whether the clusters make sense to a human.' },
          ],
        },
        {
          type: 'table',
          headers: ['Algorithm', 'Idea', 'Good for', 'Watch out'],
          rows: [
            ['**k-means**', 'k centroids, assign and update', 'Round, similar-sized groups; large data (fast)', 'Needs k; assumes spherical clusters; sensitive to outliers and scale'],
            ['**DBSCAN**', 'Dense regions separated by sparse ones', 'Arbitrary shapes, finds outliers (noise), no k needed', 'Needs a distance scale (`eps`); struggles with varying density'],
            ['**Hierarchical**', 'Repeatedly merge the closest clusters into a tree (dendrogram)', 'Small data, seeing structure at every scale', 'Slow for large data'],
            ['**Gaussian mixture**', 'Soft clusters modelled as overlapping bell curves', 'Elliptical clusters, probabilities of membership', 'Needs k; can be unstable'],
          ],
          caption: 'k-means is the default, not the only choice.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Scale first, and remember clusters are not truth',
          text: 'k-means uses plain distances, so a feature measured in thousands (gold earned) swamps one measured in fractions (win rate) unless you **standardize** the features. And whatever you do, k-means will happily return `k` clusters from pure noise. A cluster is a *hypothesis* about the data: check it with domain knowledge (do the segments mean something?), stability (does re-running or resampling give the same groups?) and usefulness (does it help a decision?).',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Because k-means and PCA are both based on distances and variances, features measured on very different scales should usually be standardized before using them.',
      answer: true,
      explanation: 'True. Without scaling, the feature with the largest numbers dominates the distances (k-means) and the variance (PCA), regardless of how informative it is. Standardizing to zero mean and unit variance puts all features on an equal footing.',
    },
    {
      kind: 'concept',
      title: 'Dimensionality reduction and PCA',
      blocks: [
        {
          type: 'p',
          text: 'Data with many columns is hard to visualize, slow to model and prone to overfitting, but the columns are usually *redundant*: height and arm length move together, and a dozen sensor readings may reflect two real quantities. **[[pca|Principal component analysis (PCA)]]** finds new axes, the **principal components**, built from combinations of the original features, ordered by how much of the data’s variance each captures. The first component points along the direction in which the data is most spread out; the second is the most spread direction perpendicular to the first; and so on. Keep only the first few and you have a compact summary with most of the information.',
        },
        {
          type: 'math',
          tex: 'C = \\frac{1}{n-1} X_c^{\\top} X_c \\qquad C\\,\\mathbf{v}_j = \\lambda_j \\mathbf{v}_j \\qquad Z = X_c V_k \\qquad \\text{explained ratio}_j = \\frac{\\lambda_j}{\\sum_m \\lambda_m}',
          caption: 'Centre the data (X_c), compute the covariance matrix C, and take its eigenvectors v_j (the component directions) and eigenvalues λ_j (the variance along each). Projecting onto the first k eigenvectors gives the reduced data Z.',
        },
        {
          type: 'p',
          text: 'The linear algebra from the NumPy unit does all the work. Below, three features: the first is a random signal, the second is half of it plus a little noise, and the third is almost pure noise. The data has three columns but essentially one dimension of real structure, and PCA finds that:',
        },
        {
          type: 'code',
          title: 'pca_by_hand.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

rng = np.random.default_rng(0)
t = rng.normal(size=200)
X = np.column_stack([t, 0.5 * t + 0.1 * rng.normal(size=200), 0.1 * rng.normal(size=200)])
Xc = X - X.mean(axis=0)
cov = Xc.T @ Xc / (len(X) - 1)
vals, vecs = np.linalg.eigh(cov)
order = np.argsort(vals)[::-1]
vals, vecs = vals[order], vecs[:, order]
print(np.round(vals, 3))
print(np.round(vals / vals.sum(), 3))
print(np.round(np.abs(vecs[:, 0]), 2))
Z = Xc @ vecs[:, :1]
back = Z @ vecs[:, :1].T
print(Z.shape, round(float(np.mean((back - Xc) ** 2)), 4))`,
          output: `[1.156 0.01  0.008]
[0.984 0.009 0.007]
[0.9  0.45 0.01]
(200, 1) 0.0061`,
          outputVaries: true,
          annotations: [
            { lines: '3-5', text: 'Three columns, but one hidden factor `t`: column 0 is `t`, column 1 is `0.5·t` plus a little noise, and column 2 is mostly noise.' },
            { lines: 6, text: 'Centre every column on zero: PCA describes spread *around the mean*.' },
            { lines: 7, text: 'The 3×3 covariance matrix of the features.' },
            { lines: '8-10', text: '`eigh` (for symmetric matrices) returns the eigenvalues and eigenvectors in *ascending* order; sort them in descending order so that the biggest variance comes first.' },
            { lines: '11-12', text: 'The eigenvalues are the variances along the components, and their fractions the **explained variance ratio**. The first component carries 98.4% of the total variance.' },
            { lines: 13, text: 'The first component’s direction (absolute values, since the sign is arbitrary): mostly column 0 (0.90), some column 1 (0.45) and almost nothing from the noise column: it has rediscovered the relation `column 1 ≈ 0.5 × column 0`.' },
            { lines: '14-16', text: 'Project onto that single component (200 numbers instead of 600), map back to three columns and measure the reconstruction error: only 0.006 per value. We compressed 3 features to 1 and lost almost nothing.' },
          ],
        },
        {
          type: 'p',
          text: 'In scikit-learn this is `PCA`. On the iris measurements (four columns), the first two components keep almost everything, and the effect of standardizing is visible: raw features let the one with the largest variance dominate the first component.',
        },
        {
          type: 'code',
          title: 'pca_iris.py',
          runnable: true,
          packages: ['scikit-learn', 'numpy'],
          code: `import numpy as np
from sklearn.datasets import load_iris
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

X = load_iris().data
for name, data in [("raw", X), ("standardized", StandardScaler().fit_transform(X))]:
    pca = PCA().fit(data)
    print(name, np.round(pca.explained_variance_ratio_, 3), round(float(pca.explained_variance_ratio_[:2].sum()), 3))
X2 = PCA(n_components=2).fit_transform(X)
print(X2.shape)`,
          output: `raw [0.925 0.053 0.017 0.005] 0.978
standardized [0.73  0.229 0.037 0.005] 0.958
(150, 2)`,
          outputVaries: true,
          annotations: [
            { lines: 6, text: 'The four iris measurements for 150 flowers.' },
            { lines: '7-8', text: 'Fit PCA with all components, once on the raw data and once on standardized data.' },
            { lines: 9, text: 'Print the variance ratios and the share kept by the first two components. Raw: the first component alone explains 92.5% (the petal length dominates through its large variance); standardized: 73.0%, spread more evenly, because every feature now counts equally. In both cases two components keep 96–98% of the information, so four dimensions can be drawn on a flat plot with little loss.' },
            { lines: '10-11', text: '`PCA(n_components=2).fit_transform(X)` returns the data in the 2-D component space: 150 rows, 2 columns, ready for a scatter plot coloured by species.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Choosing the number of components',
          text: 'Plot the cumulative explained variance and keep enough components to reach a target such as 90–95% (scikit-learn accepts `PCA(n_components=0.95)` to do exactly this). PCA is **linear**: it finds straight-line directions. For curved structure, visualization methods such as **t-SNE** and **UMAP** and neural **autoencoders** (the next units) can unfold the data, but they are for exploration, and their distances are less trustworthy than PCA’s.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the **update step** of k-means: each centroid becomes the mean of the points assigned to its cluster.',
      template: `centroids[k] = X[labels == k].___(axis=0)`,
      templateIsCode: true,
      blanks: [{ answers: ['mean', 'average'] }],
      wordBank: ['mean', 'sum', 'max', 'median'],
      explanation: 'The centroid is the **mean** of its members: `X[labels == k].mean(axis=0)` averages each feature across the cluster’s points. The mean is exactly the point that minimizes the sum of squared distances to the members, which is why the update step cannot increase the inertia.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program (one k-means assignment step).',
      code: `centroids = [(0, 0), (3, 3)]
p = (2, 0)
d = [(p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 for c in centroids]
print(d.index(min(d)), min(d))`,
      answer: '0 4',
      hint: 'Compute the squared distance from (2, 0) to each centroid, then find the smaller one and its index.',
      explanation: 'Squared distances: to (0, 0) it is 2² + 0² = 4; to (3, 3) it is 1² + 3² = 10. The smallest is 4 at index 0, so the point joins cluster 0.',
    },
    {
      kind: 'error',
      prompt: 'This k-means update step should move each centroid to the centre of its cluster, but the centroids drift away to huge values. Tap the faulty line.',
      lines: [
        'for k in range(K):',
        '    members = X[labels == k]',
        '    centroids[k] = members.sum(axis=0)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'A centroid is the **mean** of its members, not their sum: `members.mean(axis=0)`. A sum grows with the cluster size, so the centroids fly far from the data and almost every point then lands in the same cluster.',
    },
    {
      kind: 'concept',
      title: 'Using unsupervised learning in practice',
      blocks: [
        {
          type: 'p',
          text: 'Unsupervised methods are rarely the final product; they are *tools in a pipeline*. They shine whenever labels are scarce or expensive, which is common in games and in industry generally, where the logs are plentiful and the annotations are not.',
        },
        {
          type: 'table',
          headers: ['Use', 'How', 'Game example'],
          rows: [
            ['**Segmentation**', 'Cluster users or sessions on standardized behaviour features', 'Group players into explorers, completionists, competitors; tune content and offers per group'],
            ['**Anomaly detection**', 'Points far from every cluster or poorly reconstructed by PCA are suspicious', 'Flag accounts whose input statistics look unlike any normal player (possible bots or cheaters)'],
            ['**Visualization**', 'Project to 2 components (or t-SNE/UMAP) and scatter-plot', 'See whether levels, agents or replay states fall into recognizable families'],
            ['**Preprocessing**', 'Replace correlated features by a few components before a supervised model', 'Compress hundreds of telemetry columns into 20 inputs for a classifier'],
            ['**Compression and states**', 'Represent a big observation by a few numbers', 'Cluster game states into a small set of discrete “situations” for a tabular RL agent'],
          ],
          caption: 'Typical roles for clustering and PCA.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'The pipeline pattern',
          text: 'Scikit-learn chains these naturally: `make_pipeline(StandardScaler(), PCA(n_components=0.95), KMeans(n_clusters=5))` standardizes, compresses, then clusters in one fitted object. Putting the scaler and PCA inside the pipeline (rather than fitting them on all the data first) also avoids the **data leakage** from the data-preparation lesson when you cross-validate.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'This ends the classic-ML unit',
          text: 'You can now frame a problem, prepare data, fit linear, tree and ensemble models, evaluate them honestly, fight overfitting, and explore unlabelled data. These habits (a baseline first, a held-out test set, validation-driven tuning) transfer directly to neural networks. Next: how a single artificial neuron works, and then how to stack and train millions of them.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'PCA on some data gives variances along its three components of 6, 3 and 1. What fraction of the total variance do the first **two** components explain?',
      answer: '0.9',
      hint: 'The total variance is 6 + 3 + 1. Divide the sum of the first two by it.',
      explanation: 'The total is 10, and the first two components carry 6 + 3 = 9, so they explain 9 / 10 = 0.9, or 90%. Keeping two of the three dimensions loses only 10% of the variance.',
      label: 'Fraction:',
    },
    {
      kind: 'code',
      prompt: 'Write `kmeans_assign(points, centroids)` returning, for each point, the index of its nearest centroid by squared Euclidean distance. Points and centroids are sequences of numbers of any (equal) dimension. Ties go to the lowest index.',
      starter: `def kmeans_assign(points, centroids):
    ...
`,
      solution: `def kmeans_assign(points, centroids):
    labels = []
    for p in points:
        best_k, best_d = 0, None
        for k, c in enumerate(centroids):
            d = sum((a - b) ** 2 for a, b in zip(p, c))
            if best_d is None or d < best_d:
                best_k, best_d = k, d
        labels.append(best_k)
    return labels
`,
      tests: `assert kmeans_assign([(0, 0), (4, 4), (1, 0)], [(0, 0), (5, 5)]) == [0, 1, 0]
assert kmeans_assign([(2, 0)], [(0, 0), (3, 3)]) == [0]
assert kmeans_assign([(1, 1)], [(0, 1), (2, 1)]) == [0]
assert kmeans_assign([(1,), (9,), (5,)], [(0,), (10,)]) == [0, 1, 0]
assert kmeans_assign([(1, 2, 3)], [(9, 9, 9), (1, 2, 4), (0, 0, 0)]) == [1]
assert kmeans_assign([], [(0, 0)]) == []
assert kmeans_assign([(7, 7)], [(7, 7)]) == [0]
assert kmeans_assign([[0, 0], [10, 10]], [[0, 1], [9, 9]]) == [0, 1]

pts = [(0, 0), (3, 3)]
cts = [(1, 1), (2, 2)]
kmeans_assign(pts, cts)
assert pts == [(0, 0), (3, 3)] and cts == [(1, 1), (2, 2)]`,
      checks: ['Returns one index per point: the nearest centroid by squared Euclidean distance', 'A point exactly between two centroids goes to the lower index', 'Works for any dimension, for tuples or lists, and for an empty point list'],
      hint: 'For each point compute `sum((a - b) ** 2 for a, b in zip(p, c))` against every centroid and keep the index with the smallest value (use `<` so that the first one wins ties).',
      explanation: 'This is the **assign step**, the part of k-means that dominates its running time: every point against every centroid, every iteration. Libraries vectorize it with NumPy broadcasting (the broadcasting lesson’s pairwise-distance trick) so the loops run in compiled code.',
    },
    {
      kind: 'code',
      prompt: 'Write `kmeans_update(points, labels, centroids)` returning the new centroids as a list of lists of floats: the mean of the points labelled `k` for each `k` in `range(len(centroids))`. A cluster with no points keeps its old centroid (converted to a list).',
      starter: `def kmeans_update(points, labels, centroids):
    ...
`,
      solution: `def kmeans_update(points, labels, centroids):
    new = []
    for k, old in enumerate(centroids):
        members = [p for p, lab in zip(points, labels) if lab == k]
        if not members:
            new.append(list(old))
            continue
        dim = len(members[0])
        new.append([sum(m[i] for m in members) / len(members) for i in range(dim)])
    return new
`,
      tests: `pts = [(0, 0), (2, 2), (10, 10), (12, 14)]
out = kmeans_update(pts, [0, 0, 1, 1], [(5, 5), (5, 5)])
assert out == [[1.0, 1.0], [11.0, 12.0]]
assert all(isinstance(v, float) for c in out for v in c)

out = kmeans_update(pts, [0, 0, 0, 0], [(0, 0), (7, 7), (9, 9)])
assert out == [[6.0, 6.5], [7, 7], [9, 9]]
assert isinstance(out[1], list)

out = kmeans_update([(1,), (2,), (6,)], [1, 1, 0], [(0,), (0,)])
assert out == [[6.0], [1.5]]

assert kmeans_update([], [], [(1, 2)]) == [[1, 2]]
assert kmeans_update([(4, 4, 4)], [0], [(0, 0, 0)]) == [[4.0, 4.0, 4.0]]

orig = [(5, 5), (5, 5)]
labels = [0, 0, 1, 1]
kmeans_update(pts, labels, orig)
assert orig == [(5, 5), (5, 5)] and labels == [0, 0, 1, 1]`,
      checks: ['Each centroid becomes the feature-wise mean of the points with that label, as a list of floats', 'A cluster with no points keeps its old centroid (as a list)', 'Does not modify its inputs'],
      hint: 'For each `k`, collect `members = [p for p, lab in zip(points, labels) if lab == k]`. If it is empty keep `list(old)`; otherwise average each coordinate with `sum(m[i] for m in members) / len(members)`.',
      explanation: 'The **update step** moves each centroid to the mean of its members, the unique point minimizing the squared distances to them. The rule for empty clusters matters in practice: with a poor start a centroid can lose all its points, and libraries either keep it or re-seed it at a far-away point.',
    },
    {
      kind: 'code',
      prompt: 'Write `pca_variance_ratio(X)` for a 2-D array `X` (rows are samples). Centre the columns, compute the covariance matrix `XcᵀXc / (n − 1)`, and return its eigenvalues divided by their sum, as a NumPy array sorted from the largest to the smallest. Raise `ValueError` if the total variance is zero.',
      starter: `import numpy as np

def pca_variance_ratio(X):
    ...
`,
      solution: `import numpy as np


def pca_variance_ratio(X):
    X = np.asarray(X, dtype=float)
    Xc = X - X.mean(axis=0)
    cov = Xc.T @ Xc / (len(X) - 1)
    vals = np.linalg.eigvalsh(cov)[::-1]
    vals = np.clip(vals, 0.0, None)
    total = vals.sum()
    if total <= 1e-12:
        raise ValueError("no variance")
    return vals / total
`,
      tests: `import numpy as np

X = np.array([[-2, -1], [-2, 1], [2, -1], [2, 1]], dtype=float)
r = pca_variance_ratio(X)
assert isinstance(r, np.ndarray) and r.shape == (2,)
assert np.allclose(r, [0.8, 0.2])

t = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
r = pca_variance_ratio(np.column_stack([t, 2 * t]))
assert np.allclose(r, [1.0, 0.0], atol=1e-9)

rng = np.random.default_rng(1)
Y = rng.normal(size=(50, 4)) * np.array([5.0, 3.0, 1.0, 0.5])
r = pca_variance_ratio(Y)
assert abs(r.sum() - 1.0) < 1e-9
assert np.all(r[:-1] >= r[1:])
assert r.shape == (4,)

r1 = pca_variance_ratio(Y)
r2 = pca_variance_ratio(Y + 100.0)
assert np.allclose(r1, r2)

try:
    pca_variance_ratio(np.ones((5, 3)))
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")

Z = Y.copy()
pca_variance_ratio(Z)
assert np.array_equal(Z, Y)
assert np.allclose(pca_variance_ratio(Y.tolist()), r1)`,
      packages: ['numpy'],
      checks: ['Returns the covariance eigenvalues divided by their sum, largest first', 'Shifting all the data by a constant does not change the result (the data is centred)', 'Raises `ValueError` when there is no variance; accepts lists and does not modify its input'],
      hint: 'Centre with `X - X.mean(axis=0)`, form `cov = Xc.T @ Xc / (len(X) - 1)`, use `np.linalg.eigvalsh(cov)` (ascending, so reverse it with `[::-1]`), and divide by the sum.',
      explanation: 'These ratios are what scikit-learn reports as `explained_variance_ratio_`. They tell you how many components are worth keeping: a first ratio near 1 means the data is almost one-dimensional. `eigvalsh` is the right tool because a covariance matrix is symmetric, which guarantees real eigenvalues.',
    },
  ],
  takeaways: [
    '**Unsupervised learning** finds structure without labels. The two main tasks are **clustering** (grouping similar examples) and **dimensionality reduction** (compressing many features into few).',
    '**k-means** alternates *assign* (each point to its nearest centroid) and *update* (each centroid to the mean of its points). It always converges, but to a local optimum: use k-means++ and several restarts, and standardize features first.',
    'Choose `k` with the **elbow** in the inertia curve and the highest **silhouette score**, then sanity-check clusters against domain knowledge. k-means assumes round clusters; use DBSCAN, hierarchical or Gaussian mixtures for other shapes.',
    '**PCA** rotates the data onto orthogonal directions of decreasing variance (the eigenvectors of the covariance matrix). The **explained variance ratio** tells you how many components to keep; it is linear, scale-sensitive, and great for compression and visualization.',
    'In games, use them for player segmentation, cheat and bot detection, visualization of high-dimensional data, preprocessing, and discretizing states. Put scalers and PCA inside a pipeline to avoid leakage.',
  ],
  reading: [
    { title: 'scikit-learn: Clustering', url: 'https://scikit-learn.org/stable/modules/clustering.html', source: 'docs', note: 'Overview of k-means, DBSCAN, hierarchical clustering and how to evaluate them.' },
    { title: 'scikit-learn: Decomposing signals (PCA)', url: 'https://scikit-learn.org/stable/modules/decomposition.html#pca', source: 'docs', note: 'PCA and its variants, including incremental and randomized solvers for big data.' },
    { title: 'Visually Explained: Principal Component Analysis (Setosa.io)', url: 'https://setosa.io/ev/principal-component-analysis/', source: 'tutorial', note: 'An interactive explanation of what PCA does to a cloud of points.' },
    { title: 'Python Data Science Handbook (VanderPlas): In Depth, k-Means and PCA', url: 'https://jakevdp.github.io/PythonDataScienceHandbook/05.11-k-means.html', source: 'book', note: 'Worked examples with code and plots; free online.' },
  ],
};
