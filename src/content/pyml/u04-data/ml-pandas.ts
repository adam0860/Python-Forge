import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-pandas',
  title: 'pandas DataFrames',
  summary: 'Most ML projects start with a table. Learn to build, inspect, select, filter, summarize and join tabular data with pandas, and hand the result to NumPy.',
  minutes: 22,
  objectives: [
    'Build a DataFrame and inspect it with shape, head, describe and column selection',
    'Select rows and columns with loc, iloc and boolean filters, and add computed columns',
    'Summarize data with groupby, agg and value_counts',
    'Find and handle missing values, and merge two tables on a key',
    'Convert a column or table to a NumPy array for modelling',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'DataFrames: tables in Python',
      blocks: [
        {
          type: 'p',
          text: 'Real data rarely arrives as a clean numeric matrix. It arrives as a *table*: rows are examples (players, matches, images), columns are named properties of different types (a name, a level, a gold balance). **pandas** is the Python library for tables. Its main object is the **[[dataframe|DataFrame]]**, built on NumPy arrays but adding column names, an index of row labels, mixed types, missing-value handling and a rich set of table operations. A single column is a **[[series|Series]]**.',
        },
        {
          type: 'code',
          title: 'first_dataframe.py',
          runnable: true,
          packages: ['pandas'],
          code: `import pandas as pd

df = pd.DataFrame({
    "player": ["ana", "bo", "cy", "di", "ed", "flo"],
    "role": ["mage", "tank", "mage", "rogue", "tank", "rogue"],
    "level": [12, 30, 25, 18, 41, 22],
    "gold": [150.0, 900.5, 420.0, None, 1300.0, 275.0],
    "wins": [8, 25, 14, 9, 33, 12],
    "games": [20, 40, 30, 22, 50, 31],
})
print(df.shape, df.columns.tolist())
print(df.head(3))
print(df["level"].mean(), df["gold"].mean())
print(df.describe().loc[["count", "mean", "max"], ["level", "gold"]])`,
          output: `(6, 6) ['player', 'role', 'level', 'gold', 'wins', 'games']
  player  role  level   gold  wins  games
0    ana  mage     12  150.0     8     20
1     bo  tank     30  900.5    25     40
2     cy  mage     25  420.0    14     30
24.666666666666668 609.1
           level    gold
count   6.000000     5.0
mean   24.666667   609.1
max    41.000000  1300.0`,
          annotations: [
            { lines: '3-10', text: 'A DataFrame is created from a dictionary: each key is a column name and each value a list holding that column. Columns can have different types: text, whole numbers, floats. `None` in the numeric `gold` column becomes a **missing value** (`NaN`).' },
            { lines: 11, text: '`shape` is `(rows, columns)`, exactly like a NumPy array, and `columns` lists the names.' },
            { lines: 12, text: '`head(n)` shows the first `n` rows, the quickest way to eyeball a table. The bold-looking left column is the **index**: row labels, here 0 to 5.' },
            { lines: 13, text: 'A column is selected with `df["level"]` and returns a Series, which has the usual statistics. Notice the `gold` mean (609.1) divides by 5, not 6: the missing value is skipped.' },
            { lines: 14, text: '`describe()` summarizes every numeric column. Here we pick three of its rows with `.loc`. The `count` for `gold` is 5, revealing the gap. Always check the counts before trusting an average.' },
          ],
        },
        {
          type: 'p',
          text: 'Real tables usually come from files: `pd.read_csv("matches.csv")` is the most common way to load data, and `df.to_csv(...)` saves it. Two inspection calls to run on every new dataset: `df.info()` (column types and non-missing counts) and `df.describe()` (statistics). They take seconds and prevent hours of confusion.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why explore data before modelling?',
          text: 'A model can only learn what is in the data, including its mistakes: a column of ages containing -1, two spellings of the same category, a feature that is missing for 40% of the rows, or labels that are shuffled. Looking at the table first (shapes, types, counts, ranges, a few raw rows) catches these problems when they are cheap to fix. Experienced practitioners spend more time on the data than on the model.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A DataFrame has the default index `0, 1, 2, 3, 4, 5`. How many rows do `df.loc[1:3]` and `df.iloc[1:3]` return?',
      options: [
        { text: '`loc` returns 3 rows (labels 1, 2, 3) and `iloc` returns 2 rows (positions 1 and 2)', correct: true, why: '`loc` selects by **label** and includes both ends of a slice; `iloc` selects by **position** and, like normal Python slicing, excludes the end.' },
        { text: 'Both return 2 rows', why: 'Label slices in `loc` include the stop label, so `loc[1:3]` is 3 rows. Only `iloc` follows the usual stop-excluded rule.' },
        { text: 'Both return 3 rows', why: '`iloc[1:3]` is a positional slice and excludes position 3, so it gives only 2 rows.' },
        { text: '`loc` returns 2 rows and `iloc` returns 3', why: 'It is the other way round: `loc` includes its end label and `iloc` excludes its end position.' },
      ],
      explanation: 'Remember: **loc = label, inclusive; iloc = integer position, exclusive at the end.** This trips up everybody at least once, particularly after rows have been filtered or shuffled and labels no longer match positions.',
    },
    {
      kind: 'concept',
      title: 'Selecting, filtering and creating columns',
      blocks: [
        {
          type: 'p',
          text: 'Selection in pandas mirrors NumPy, but with labels. `df["col"]` gives a column; `df[["a", "b"]]` (a list) gives a smaller DataFrame; `df.loc[rows, cols]` selects by label and `df.iloc[rows, cols]` by position. The most useful selector in practice is the **boolean filter**: build a True/False Series from comparisons and index the frame with it. As in NumPy, combine conditions with `&`, `|` and `~` and wrap each comparison in parentheses.',
        },
        {
          type: 'code',
          title: 'select_filter.py',
          runnable: true,
          packages: ['pandas'],
          code: `import pandas as pd

df = pd.DataFrame({
    "player": ["ana", "bo", "cy", "di", "ed", "flo"],
    "role": ["mage", "tank", "mage", "rogue", "tank", "rogue"],
    "level": [12, 30, 25, 18, 41, 22],
    "wins": [8, 25, 14, 9, 33, 12],
    "games": [20, 40, 30, 22, 50, 31],
})
print(df.loc[1, "player"], df.iloc[1, 0])
print(df.loc[2:3, ["player", "level"]])
strong = df[(df["level"] > 20) & (df["wins"] >= 14)]
print(strong["player"].tolist())
df["win_rate"] = (df["wins"] / df["games"]).round(3)
print(df.sort_values("win_rate", ascending=False)[["player", "win_rate"]].head(3))`,
          output: `bo bo
  player  level
2     cy     25
3     di     18
['bo', 'cy', 'ed']
  player  win_rate
4     ed     0.660
1     bo     0.625
2     cy     0.467`,
          annotations: [
            { lines: 10, text: 'The same cell reached two ways: by label (`loc[1, "player"]`) and by position (`iloc[1, 0]`: row 1, column 0). Both give `bo`.' },
            { lines: 11, text: 'A label slice of rows `2:3` (both included) and a *list* of column names. The result keeps the original index labels 2 and 3.' },
            { lines: '12-13', text: 'A **boolean filter**: players above level 20 *and* with at least 14 wins. Each comparison produces a True/False Series; `&` combines them element-wise; indexing the frame with the result keeps only the `True` rows.' },
            { lines: 14, text: 'A **new column** is created by assigning to a new name. The right-hand side is a vectorized Series operation (`wins / games`), computed for all rows at once with no loop.' },
            { lines: 15, text: '`sort_values` orders the rows (here best win rate first), `[[...]]` keeps two columns and `head(3)` the top three. Notice how the index labels travel with their rows.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Use & and |, never and / or',
          text: 'Writing `df[df["level"] > 20 and df["wins"] > 5]` raises `ValueError: The truth value of a Series is ambiguous`, for the same reason as in NumPy: `and` wants a single True/False. Use `&`, `|` and `~`, and put each comparison in its own parentheses (`&` binds tighter than `>`).',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Prefer returning new frames',
          text: 'Operations like `fillna`, `sort_values`, `drop` and `merge` return a **new** DataFrame instead of changing the old one. That is safer for experiments: you can always go back to the raw data. When you really want to alter a frame, assign the result back (`df = df.fillna(0)`). Avoid chained assignments such as `df[df.x > 0]["y"] = 1`; they may change a temporary copy and do nothing, so use `df.loc[df.x > 0, "y"] = 1`.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Calling `df["gold"].mean()` on a column that contains a missing value (`NaN`) raises an error.',
      answer: false,
      explanation: 'False. By default pandas statistics **skip** missing values, so the mean is taken over the non-missing entries. That convenience can also hide problems, which is why you should check `df.isna().sum()` and the counts from `describe()`.',
    },
    {
      kind: 'concept',
      title: 'Summarizing with groupby and handling missing values',
      blocks: [
        {
          type: 'p',
          text: 'The most powerful table operation is **[[groupby|group-by]]**: split the rows into groups that share a key, compute a summary for each group, and combine the results. `df.groupby("role")` does the splitting; `.agg(...)` names the summaries you want, each as `new_name=("column", "function")`. For counting categories, `value_counts()` is a shortcut. Both are how you answer questions such as "does each class of character have a similar win rate?" or "is my dataset balanced?".',
        },
        {
          type: 'code',
          title: 'groupby_missing.py',
          runnable: true,
          packages: ['pandas'],
          code: `import pandas as pd

df = pd.DataFrame({
    "player": ["ana", "bo", "cy", "di", "ed", "flo"],
    "role": ["mage", "tank", "mage", "rogue", "tank", "rogue"],
    "level": [12, 30, 25, 18, 41, 22],
    "gold": [150.0, 900.5, 420.0, None, 1300.0, 275.0],
    "wins": [8, 25, 14, 9, 33, 12],
})
by_role = df.groupby("role").agg(
    players=("player", "count"),
    avg_level=("level", "mean"),
    total_wins=("wins", "sum"),
)
print(by_role)
print(df["role"].value_counts().sort_index().to_dict())
print(df["gold"].isna().sum(), df["gold"].fillna(df["gold"].median()).tolist())
print(len(df.dropna()))`,
          output: `       players  avg_level  total_wins
role                                 
mage         2       18.5          22
rogue        2       20.0          21
tank         2       35.5          58
{'mage': 2, 'rogue': 2, 'tank': 2}
1 [150.0, 900.5, 420.0, 420.0, 1300.0, 275.0]
5`,
          annotations: [
            { lines: '10-14', text: '**Group-by with named aggregations.** Rows are grouped by `role`; for each group we count the players, average the levels and add up the wins. The result is a new table with one row per role, and the group key becomes its index.' },
            { lines: 15, text: 'Tanks in this sample are far higher level (35.5) than mages (18.5), the kind of pattern you want to know about before training a model.' },
            { lines: 16, text: '`value_counts()` counts rows per category (here two of each: a balanced dataset). `sort_index()` fixes the order and `to_dict()` converts to a plain dictionary.' },
            { lines: 17, text: '`isna().sum()` counts the missing values per column (here one). `fillna(value)` replaces them; filling with the column **median** is a common, outlier-resistant choice. The gap now holds 420.0.' },
            { lines: 18, text: '`dropna()` removes every row that has any missing value: 5 rows survive. Dropping is simple but loses data, so check how many rows you can afford to lose.' },
          ],
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Merging tables and handing data to NumPy',
      blocks: [
        {
          type: 'p',
          text: 'Data usually lives in several tables, so you need to **merge** them on a shared key, like a database join. `left.merge(right, on="key", how="left")` keeps every row of the left table and attaches the matching columns of the right table, filling `NaN` where no match exists. Finally, remember the destination: models take **arrays**. `df["col"].to_numpy()` and `df.to_numpy()` give you the NumPy arrays (all one dtype) to feed into the next lessons.',
        },
        {
          type: 'code',
          title: 'merge_to_numpy.py',
          runnable: true,
          packages: ['pandas'],
          code: `import io
import pandas as pd

csv_text = """player,score
ana,10
bo,7
cy,12
"""
scores = pd.read_csv(io.StringIO(csv_text))
extra = pd.DataFrame({"player": ["ana", "cy", "zed"], "team": ["red", "blue", "red"]})
merged = scores.merge(extra, on="player", how="left")
print(merged)
print(merged["team"].isna().tolist())
arr = scores["score"].to_numpy()
print(type(arr).__name__, arr.dtype.kind, arr.mean())`,
          output: `  player  score  team
0    ana     10   red
1     bo      7   NaN
2     cy     12  blue
[False, True, False]
ndarray i 9.666666666666666`,
          annotations: [
            { lines: '4-8', text: 'A CSV file is just text. `io.StringIO` lets us pretend a string is a file, so the example needs no file on disk. With a real file you would write `pd.read_csv("scores.csv")`.' },
            { lines: 9, text: '`read_csv` parses the header row into column names and infers each column’s type (here `score` becomes integers).' },
            { lines: 10, text: 'A second table that describes teams. Note that it contains `zed`, who has no score, and lacks `bo`.' },
            { lines: 11, text: 'A **left merge** on `player`: every row of `scores` is kept; `bo` has no team, so pandas fills `NaN`. (`zed` is dropped because he is only in the right table; `how="outer"` would keep him.)' },
            { lines: 13, text: 'Checking for gaps after a merge catches mismatched keys, e.g. a name spelled differently in the two tables.' },
            { lines: '14-15', text: '`to_numpy()` hands over the column as a NumPy array of integers (`kind` `i`), ready for array maths. This is the bridge to the next units: a DataFrame for exploring and cleaning, an array or tensor for learning.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Why pandas is fast enough (and when it is not)',
          text: 'Each pandas column is a NumPy array, so vectorized column operations run in compiled code. The thing to avoid is a Python loop over rows (`for row in df.iterrows()`), which is typically 100× slower than a column operation. If a table outgrows memory (tens of gigabytes), look at chunked reading (`read_csv(chunksize=...)`), Parquet files, or libraries such as Polars and DuckDB with the same ideas.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the group-by to get the **total** number of wins for each role.',
      template: `totals = df.groupby("role")["wins"].___()`,
      templateIsCode: true,
      blanks: [{ answers: ['sum'] }],
      wordBank: ['sum', 'mean', 'count', 'max'],
      explanation: '`.sum()` adds the wins within each group. `mean` would give the average wins per player, `count` the number of rows and `max` the best single value.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `import pandas as pd

s = pd.Series([4, 8, 15, 16, 23, 42])
print(s[s > 10].sum(), s.iloc[-1], s.loc[2])`,
      answer: '96 42 15',
      hint: 'Filter to the values above 10 first. `loc[2]` is the label 2 and `iloc[-1]` the last position.',
      explanation: '`s > 10` keeps 15, 16, 23 and 42, which add up to 96. `s.iloc[-1]` is the last element, 42. `s.loc[2]` is the element with label 2, which is 15.',
    },
    {
      kind: 'error',
      prompt: 'This filter should keep the players with level above 20 **and** more than 5 wins, but it raises a `ValueError`. Tap the faulty line.',
      lines: [
        'import pandas as pd',
        'df = pd.DataFrame({"level": [5, 25, 40], "wins": [1, 9, 20]})',
        'pro = df[df["level"] > 20 and df["wins"] > 5]',
        'print(pro)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`and` needs a single True/False, but each comparison is a whole Series. Write `df[(df["level"] > 20) & (df["wins"] > 5)]`: the element-wise `&`, with each comparison in parentheses.',
    },
    {
      kind: 'numeric',
      prompt: 'What does `pd.Series([2, 4, None, 6]).mean()` return?',
      answer: '4',
      hint: 'Missing values are skipped, so divide by the number of values that are present.',
      explanation: 'The `None` becomes `NaN` and is skipped: (2 + 4 + 6) / 3 = 4. If it had counted as a zero, the answer would have been 3.',
      label: 'Mean:',
    },
    {
      kind: 'code',
      prompt: 'Write `best_by_role(df, column)` returning a **dictionary** that maps each `role` to the `player` with the highest value of `column` in that role. (There are no ties in the tests.)',
      starter: `import pandas as pd

def best_by_role(df, column):
    ...
`,
      solution: `import pandas as pd


def best_by_role(df, column):
    best = df.loc[df.groupby("role")[column].idxmax()]
    return dict(zip(best["role"], best["player"]))
`,
      tests: `import pandas as pd

df = pd.DataFrame({
    "player": ["ana", "bo", "cy", "di", "ed", "flo"],
    "role": ["mage", "tank", "mage", "rogue", "tank", "rogue"],
    "level": [12, 30, 25, 18, 41, 22],
    "wins": [8, 25, 14, 9, 33, 12],
})
assert best_by_role(df, "level") == {"mage": "cy", "tank": "ed", "rogue": "flo"}
assert best_by_role(df, "wins") == {"mage": "cy", "tank": "ed", "rogue": "flo"}

small = pd.DataFrame({"player": ["x", "y", "z"], "role": ["a", "a", "b"], "score": [3, 9, 1]})
assert best_by_role(small, "score") == {"a": "y", "b": "z"}
assert isinstance(best_by_role(small, "score"), dict)

shuffled = small.iloc[[2, 0, 1]].reset_index(drop=True)
assert best_by_role(shuffled, "score") == {"a": "y", "b": "z"}
assert list(small.columns) == ["player", "role", "score"] and len(small) == 3`,
      packages: ['pandas'],
      checks: ['Returns a plain dict of `{role: player}`', 'Picks the player with the maximum of the given column within each role', 'Does not depend on row order or modify the frame'],
      hint: '`df.groupby("role")[column].idxmax()` gives the index label of the best row in each group. Use `df.loc[...]` with those labels, then build the dictionary from the `role` and `player` columns.',
      explanation: '`idxmax` returns *labels*, which `loc` turns back into whole rows, a very common pandas pattern for "the row with the best value per group". `zip` pairs the two columns into dictionary items.',
    },
    {
      kind: 'code',
      prompt: 'Write `fill_median(df, column)` returning a **new** DataFrame in which the missing values of `column` are replaced by that column’s median. The original DataFrame must keep its missing values.',
      starter: `import pandas as pd

def fill_median(df, column):
    ...
`,
      solution: `import pandas as pd


def fill_median(df, column):
    out = df.copy()
    out[column] = out[column].fillna(out[column].median())
    return out
`,
      tests: `import pandas as pd

df = pd.DataFrame({"a": [1.0, None, 3.0, 100.0], "b": [10.0, 20.0, None, 40.0]})
out = fill_median(df, "a")
assert out["a"].tolist() == [1.0, 3.0, 3.0, 100.0]
assert out["b"].isna().sum() == 1
assert df["a"].isna().sum() == 1
assert out is not df

out2 = fill_median(df, "b")
assert out2["b"].isna().sum() == 0
assert out2["b"].tolist() == [10.0, 20.0, 20.0, 40.0]
assert df["b"].isna().sum() == 1

full = pd.DataFrame({"a": [1.0, 2.0, 3.0]})
assert fill_median(full, "a")["a"].tolist() == [1.0, 2.0, 3.0]
assert out.shape == df.shape and list(out.columns) == ["a", "b"]`,
      packages: ['pandas'],
      checks: ['Missing values in the chosen column are replaced with its median', 'Other columns are untouched and the shape is unchanged', 'The original DataFrame still contains its missing values'],
      hint: 'Make a copy first with `df.copy()`. Then assign `out[column] = out[column].fillna(out[column].median())`.',
      explanation: 'The median ignores the missing values when computed and is robust to extreme values (here 100.0), which is why it is the usual default for filling numeric gaps. Computing it on a copy leaves the raw data intact, so you can try other strategies.',
    },
    {
      kind: 'code',
      prompt: 'Write `mean_by_group(df, key, value)` returning a pandas **Series** of the mean of `value` for each distinct `key`, sorted from the largest mean to the smallest.',
      starter: `import pandas as pd

def mean_by_group(df, key, value):
    ...
`,
      solution: `import pandas as pd


def mean_by_group(df, key, value):
    return df.groupby(key)[value].mean().sort_values(ascending=False)
`,
      tests: `import pandas as pd

df = pd.DataFrame({
    "role": ["mage", "tank", "mage", "rogue", "tank", "rogue"],
    "level": [12, 30, 25, 18, 41, 22],
})
res = mean_by_group(df, "role", "level")
assert isinstance(res, pd.Series)
assert res.index.tolist() == ["tank", "rogue", "mage"]
assert res.round(2).tolist() == [35.5, 20.0, 18.5]

d2 = pd.DataFrame({"g": ["a", "b", "a", "b", "c"], "v": [1.0, 5.0, 3.0, 7.0, 4.0]})
r2 = mean_by_group(d2, "g", "v")
assert r2.index.tolist() == ["b", "c", "a"]
assert r2.tolist() == [6.0, 4.0, 2.0]
assert len(d2) == 5 and list(d2.columns) == ["g", "v"]`,
      packages: ['pandas'],
      checks: ['Returns a Series with one mean per distinct key', 'Sorted from the largest mean to the smallest', 'Does not change the DataFrame'],
      hint: 'Chain three calls: `df.groupby(key)[value]`, then `.mean()`, then `.sort_values(ascending=False)`.',
      explanation: 'Group-by, aggregate, sort: the most common three-step shape in exploratory analysis. The same pattern answers "which map has the highest win rate?" or "which feature is most correlated with the label?".',
    },
  ],
  takeaways: [
    'A **DataFrame** is a table of named, typed columns plus a row index; a column is a **Series**. Inspect every new table with `shape`, `head`, `info` and `describe` before doing anything else.',
    '`loc` selects by label (slice ends **included**), `iloc` by position (end excluded). Filter rows with boolean conditions combined using `&`, `|`, `~` and parentheses.',
    'Create columns with vectorized expressions (`df["rate"] = df["wins"] / df["games"]`) and avoid Python loops over rows.',
    '`groupby(...).agg(...)` and `value_counts()` summarize by category; `isna()`, `fillna()` and `dropna()` manage missing values; `merge` joins tables on a key.',
    'Most pandas methods return new objects; copy before changing data you may need again. Finish with `to_numpy()` to hand clean data to NumPy, scikit-learn or PyTorch.',
  ],
  reading: [
    { title: '10 minutes to pandas', url: 'https://pandas.pydata.org/docs/user_guide/10min.html', source: 'docs', note: 'The official quick tour of the main operations.' },
    { title: 'pandas getting-started tutorials', url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html', source: 'tutorial', note: 'Short task-oriented tutorials: selecting, filtering, plotting, reshaping, merging.' },
    { title: 'Python Data Science Handbook (Jake VanderPlas): Data Manipulation with pandas', url: 'https://jakevdp.github.io/PythonDataScienceHandbook/03.00-introduction-to-pandas.html', source: 'book', note: 'A free book chapter with clear explanations of the index, groupby and merge.' },
    { title: 'Python for Data Analysis (Wes McKinney)', url: 'https://wesmckinney.com/book/', source: 'book', note: 'Written by the creator of pandas; free to read online.' },
  ],
};
