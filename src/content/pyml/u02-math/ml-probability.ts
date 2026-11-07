import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-probability',
  title: 'Probability and Statistics for ML',
  summary: 'The probability toolkit a model builder needs: distributions, expected value and variance, the normal curve, why sampling works, Bayes’ theorem for updating beliefs, and how softmax and cross-entropy turn scores into probabilities and a loss.',
  minutes: 22,
  objectives: [
    'Compute expected value, variance and standard deviation of a set of outcomes',
    'Describe the normal distribution and what its mean and standard deviation control',
    'Explain why averaging many random samples gives a stable estimate (law of large numbers)',
    'Use Bayes’ theorem to update a probability after seeing evidence',
    'Implement softmax and explain how cross-entropy loss measures a classifier’s mistakes',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Random quantities, mean and spread',
      blocks: [
        {
          type: 'p',
          text: 'Machine learning is built on uncertainty: noisy data, random weight initialization, shuffled batches, an environment that responds differently each time, and a classifier that says "80% cat". The language for all of it is probability. A **[[probability-distribution]]** lists every possible outcome of a random quantity with its probability; the probabilities are never negative and **add up to 1**. A fair die is the simplest example: six outcomes, each with probability 1/6.',
        },
        {
          type: 'p',
          text: 'Two numbers summarize a distribution. The **[[expected-value]]** (the mean) is the probability-weighted average: what you get *on average* over many repetitions. The **[[variance]]** is the average squared distance from that mean, and its square root, the **[[standard-deviation]]**, is the typical spread in the original units. A small spread means outcomes cluster tightly around the mean; a large spread means they scatter.',
        },
        {
          type: 'math',
          tex: '\\mu = \\mathbb{E}[X] = \\sum_i p_i\\, x_i, \\qquad \\sigma^2 = \\mathbb{E}\\big[(X - \\mu)^2\\big] = \\sum_i p_i\\,(x_i - \\mu)^2, \\qquad \\sigma = \\sqrt{\\sigma^2}',
          caption: 'Mean μ, variance σ² and standard deviation σ of a discrete distribution.',
        },
        {
          type: 'code',
          title: 'die_stats.py',
          runnable: true,
          code: `rolls = [1, 2, 3, 4, 5, 6]
mean = sum(rolls) / len(rolls)
var = sum((r - mean) ** 2 for r in rolls) / len(rolls)
print(mean, round(var, 4), round(var ** 0.5, 4))`,
          output: `3.5 2.9167 1.7078`,
          annotations: [
            { lines: 2, text: 'All six faces are equally likely, so the expected value is just their plain average: 3.5. You can never roll a 3.5, yet it is the long-run average.' },
            { lines: 3, text: 'Variance: the average of the squared distances from the mean. Squaring makes every distance positive and punishes big deviations more.' },
            { lines: 4, text: 'The standard deviation `var ** 0.5` is about 1.71: a typical roll lands roughly 1.7 away from 3.5.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why ML cares about mean and spread',
          text: 'Training uses averages everywhere: the loss is the *mean* error over a batch, and a gradient is an *estimate* of an expected value. The spread tells you how noisy that estimate is. Input data is also **normalized** (subtract the mean, divide by the standard deviation) so that every feature has a similar scale, which makes gradient descent far better behaved.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Population vs. sample variance',
          text: 'The formula above divides by `n` (the **population** variance, right when you have the whole distribution). When you estimate the spread of a larger population from a *sample*, statisticians divide by `n − 1` instead (`statistics.variance`, and NumPy with `ddof=1`). PyTorch’s `.var()` also uses `n − 1` by default. With thousands of samples the difference is negligible, but remember it when comparing numbers from different libraries.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Two models have the same average error, but model A has a standard deviation of 0.1 and model B a standard deviation of 2.0. What does that tell you?',
      options: [
        { text: 'Model A’s errors are much more consistent; model B’s vary widely from case to case', correct: true, why: 'The standard deviation measures typical distance from the mean. A small value means the errors cluster tightly around the average; a large one means they are scattered.' },
        { text: 'Model B is more accurate because its number is bigger', why: 'The standard deviation measures spread, not quality. A bigger spread usually means less predictable behavior.' },
        { text: 'The two models must be identical', why: 'Equal means do not imply equal distributions. The spreads show they behave very differently.' },
        { text: 'Model A’s average error must be wrong', why: 'The mean and the standard deviation are independent summaries; both can be correct at once.' },
      ],
      explanation: 'Mean and standard deviation answer different questions: "where is the center?" and "how spread out is it?". Always look at both, since an average can hide wildly inconsistent behavior.',
    },
    {
      kind: 'concept',
      title: 'The normal distribution and the power of sampling',
      blocks: [
        {
          type: 'p',
          text: 'The most important continuous distribution is the **[[normal-distribution]]** (Gaussian), the "bell curve". Two numbers define it: the mean μ sets where the bell is centered, and the standard deviation σ sets how wide it is. About 68% of the values fall within one σ of the mean and about 95% within two. It appears whenever many small independent effects add up (measurement noise, heights, the sum of many dice) and it is used everywhere in ML: initializing weights, adding exploration noise to an agent’s actions, modelling errors.',
        },
        {
          type: 'graph',
          caption: 'The normal density. Move μ to slide the bell left and right; make σ small for a tall, narrow bell and large for a flat, wide one. The total area under the curve is always 1.',
          x: [-6, 6],
          y: [0, 1.1],
          functions: [{ expr: 'exp(-((x-m)^2)/(2*s^2))/(s*sqrt(2*pi))', label: 'normal density', color: 'blue' }],
          vlines: [{ x: 'm', label: 'mean', color: 'red', dashed: true }],
          sliders: [
            { name: 'm', min: -3, max: 3, step: 0.1, value: 0, label: 'mean μ' },
            { name: 's', min: 0.4, max: 3, step: 0.1, value: 1, label: 'standard deviation σ' },
          ],
          readouts: [
            { label: 'peak height', expr: '1/(s*sqrt(2*pi))', digits: 3 },
            { label: 'one-σ range from', expr: 'm-s', digits: 2 },
            { label: 'to', expr: 'm+s', digits: 2 },
          ],
          height: 320,
        },
        {
          type: 'p',
          text: 'You almost never compute a probability exactly in ML; you **sample**. Draw many random outcomes, average them, and trust the result. The **[[law-of-large-numbers]]** guarantees this works: the more independent samples you average, the closer the average gets to the true expected value. The same principle lets a *mini-batch* of 64 examples stand in for the whole dataset when estimating a gradient, and lets a reinforcement-learning agent estimate the value of a state by playing it out many times.',
        },
        {
          type: 'code',
          title: 'law_of_large_numbers.py',
          runnable: true,
          code: `import random

rng = random.Random(42)
for n in (10, 100, 10000):
    heads = sum(rng.random() < 0.5 for _ in range(n))
    print(n, heads / n)`,
          output: `10 0.6
100 0.49
10000 0.4989`,
          annotations: [
            { lines: 3, text: 'A dedicated generator seeded with 42. A **seed** makes the "random" sequence reproducible: the same seed always gives the same numbers, which is essential for debugging experiments and comparing models.' },
            { lines: 4, text: 'Flip a fair coin 10, then 100, then 10 000 times.' },
            { lines: 5, text: '`rng.random() < 0.5` is `True` about half the time; `sum` counts the `True` values (each counts as 1), so `heads` is the number of heads.' },
            { lines: 6, text: 'With 10 flips the fraction of heads (0.6) is noticeably off from the true probability 0.5; with 10 000 flips it is 0.4989, almost exact. More samples, less noise.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Always seed your experiments',
          text: 'Weight initialization, data shuffling and exploration noise are all random, so two runs of the same training script give different curves. Fixing the seed (`random.seed(0)`, `numpy.random.seed(0)`, `torch.manual_seed(0)`) makes a run repeatable. Better still, run a few different seeds and report the mean and spread, because a result from one lucky seed proves little. This is especially true in reinforcement learning, where variance between runs is large.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Averaging more independent random samples generally makes the sample average a more reliable estimate of the true mean.',
      answer: true,
      explanation: 'True: that is the law of large numbers. The noise in the average shrinks roughly like 1/√n, so 100 times more samples cut it by a factor of about 10. It is why bigger batches give smoother gradient estimates.',
    },
    {
      kind: 'concept',
      title: 'Bayes’ theorem: updating beliefs with evidence',
      blocks: [
        {
          type: 'p',
          text: 'You start with a **prior** belief, observe some evidence, and want the **posterior**: your updated belief. **[[bayes-theorem]]** tells you exactly how. It is the reason a positive result on a good test may still be unlikely to mean you have the condition when the condition is rare: the prior matters as much as the test.',
        },
        {
          type: 'math',
          tex: 'P(H \\mid E) = \\frac{P(E \\mid H)\\,P(H)}{P(E)}, \\qquad P(E) = P(E \\mid H)\\,P(H) + P(E \\mid \\neg H)\\,P(\\neg H)',
          caption: 'Posterior = (likelihood × prior) / evidence. The evidence P(E) is the total probability of seeing E, whether or not H is true.',
        },
        {
          type: 'code',
          title: 'bayes_update.py',
          runnable: true,
          code: `def bayes(prior, hit_rate, false_alarm):
    evidence = prior * hit_rate + (1 - prior) * false_alarm
    return prior * hit_rate / evidence

print(round(bayes(0.01, 0.95, 0.05), 4))
print(round(bayes(0.5, 0.95, 0.05), 4))
print(round(bayes(0.01, 0.99, 0.001), 4))`,
          output: `0.161
0.95
0.9091`,
          annotations: [
            { lines: 2, text: 'The denominator `P(E)`: the chance of a positive result is the true positives (`prior * hit_rate`) plus the false alarms among the people who do *not* have it (`(1 - prior) * false_alarm`).' },
            { lines: 3, text: 'The posterior is the true-positive share of all positives.' },
            { lines: 5, text: 'A condition affecting 1% of people, with a test that detects 95% of cases but also fires on 5% of healthy people. After a positive test the chance of really having it is only **16.1%**: of every 100 positives most are false alarms, because healthy people vastly outnumber sick ones.' },
            { lines: 6, text: 'If the condition were common (prior 50%) the same test would be far more convincing: 95%.' },
            { lines: 7, text: 'A much better test (99% hits, 0.1% false alarms) lifts the posterior to 90.9% even for the rare condition.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Where Bayes shows up in ML',
          text: 'A classifier is estimating `P(class | features)`, which is a posterior. Naive Bayes classifiers use the formula directly; spam filters work this way. The same "update beliefs with evidence" idea powers Bayesian optimization of hyperparameters, filters that track an object’s position from noisy sensors (Kalman filters), and the probabilistic view of regularization. More generally, it is a reminder to always ask: *how common is this to begin with?* A model that is 99% accurate on a task where 99% of examples are negative has learned nothing.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete Bayes’ theorem in code: the posterior is the likelihood times the prior, divided by the total probability of the evidence.',
      template: `posterior = prior * ___ / ___`,
      templateIsCode: true,
      blanks: [{ answers: ['hit_rate'] }, { answers: ['evidence'] }],
      wordBank: ['hit_rate', 'evidence', 'prior', 'false_alarm'],
      explanation: '`posterior = prior * hit_rate / evidence`, where `hit_rate` is P(E | H) and `evidence` is P(E). Forgetting to divide by the evidence is the classic mistake: the numerator alone is not a probability.',
    },
    {
      kind: 'concept',
      title: 'Softmax and cross-entropy: how classifiers speak probabilities',
      blocks: [
        {
          type: 'p',
          text: 'A neural-network classifier ends with a vector of raw numbers called **scores** (or *logits*), one per class: they can be negative or huge and do not add up to anything in particular. To read them as probabilities we apply **[[softmax]]**: exponentiate every score (making them all positive) and divide by their sum (making them add up to 1). The biggest score gets the biggest probability, and the exponential stretches the gaps between them.',
        },
        {
          type: 'math',
          tex: '\\operatorname{softmax}(z)_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}, \\qquad L = -\\log p_{\\text{correct}}',
          caption: 'Softmax turns scores into probabilities. The cross-entropy loss is the negative log of the probability given to the correct class.',
        },
        {
          type: 'p',
          text: 'To train the classifier we need a **loss**: a number that is small when the model gives high probability to the correct class and large when it does not. **[[cross-entropy]]** does exactly that with `−log(p)`. If the model gives the right class probability 1 the loss is 0. At probability 0.5 the loss is 0.69. And as the probability approaches 0 the loss shoots toward infinity, so confident mistakes are punished very hard.',
        },
        {
          type: 'code',
          title: 'softmax_cross_entropy.py',
          runnable: true,
          code: `import math

def softmax(scores):
    top = max(scores)
    exps = [math.exp(s - top) for s in scores]
    total = sum(exps)
    return [e / total for e in exps]

def cross_entropy(probs, target):
    return -math.log(probs[target])

probs = softmax([2.0, 1.0, 0.1])
print([round(p, 3) for p in probs], round(sum(probs), 6))
print(round(cross_entropy(probs, 0), 4), round(cross_entropy(probs, 2), 4))
print([round(p, 3) for p in softmax([1000.0, 1000.0])])`,
          output: `[0.659, 0.242, 0.099] 1.0
0.417 2.317
[0.5, 0.5]`,
          annotations: [
            { lines: '3-7', text: 'Softmax. The trick on lines 4-5 is **numerical stability**: subtracting the largest score before exponentiating changes nothing mathematically (the shift cancels in the ratio) but prevents `math.exp` from overflowing on big scores.' },
            { lines: '9-10', text: 'Cross-entropy for one example: look up the probability the model gave the correct class (`target` is its index) and take `-log`.' },
            { lines: '12-13', text: 'Scores 2.0, 1.0 and 0.1 become probabilities 0.659, 0.242 and 0.099, the biggest score winning the biggest share, and they add up to 1 as a distribution must.' },
            { lines: 14, text: 'If the correct class is 0 (probability 0.659) the loss is small, 0.417; if the correct class is 2 (probability 0.099) the loss is much bigger, 2.317. Learning pushes the correct class’s probability up and so this number down.' },
            { lines: 15, text: 'Scores of 1000 would overflow a naive `exp(1000)`, but the shifted version handles them: two equal scores give 50/50.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Do not apply softmax twice in PyTorch',
          text: 'PyTorch’s `nn.CrossEntropyLoss` already contains a (numerically stable) log-softmax, so you must feed it the **raw scores**, not probabilities. Adding your own softmax before it is a very common bug: training still runs but learns badly. Apply `softmax` yourself only when you need actual probabilities at prediction time. Frameworks also use the *log-sum-exp* trick internally for the same stability reason you just saw.',
        },
        {
          type: 'callout',
          variant: 'analogy',
          title: 'Cross-entropy as "surprise"',
          text: '`−log(p)` measures how *surprised* the model should be by what actually happened. Predicting the right answer with 99% confidence means almost no surprise (loss 0.01). Betting 1% on the right answer means a huge surprise (loss 4.6). Training teaches the model to be less surprised by the real data.',
        },
      ],
    },
    {
      kind: 'order',
      prompt: 'Put the lines of a numerically stable softmax in the right order.',
      lines: [
        'top = max(scores)',
        'exps = [math.exp(s - top) for s in scores]',
        'total = sum(exps)',
        'return [e / total for e in exps]',
      ],
      linesAreCode: true,
      explanation: 'Find the largest score, subtract it before exponentiating (so nothing overflows), add up the exponentials, and finally divide each by the total so the results sum to 1.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this program.',
      code: `data = [2, 4, 4, 4, 5, 5, 7, 9]
mean = sum(data) / len(data)
var = sum((x - mean) ** 2 for x in data) / len(data)
print(mean, var ** 0.5)`,
      answer: '5.0 2.0',
      hint: 'The sum is 40 over 8 values, so the mean is 5.0. The squared distances add up to 32.',
      explanation: 'The mean is 40 / 8 = 5.0. The squared deviations are 9, 1, 1, 1, 0, 0, 4, 16, which add up to 32, so the variance is 32 / 8 = 4.0 and the standard deviation is its square root, 2.0.',
    },
    {
      kind: 'error',
      prompt: 'This function should compute the posterior probability with Bayes’ theorem, but it gives wrong answers. Tap the faulty line.',
      lines: [
        'def posterior(prior, hit_rate, false_alarm):',
        '    evidence = prior * hit_rate + prior * false_alarm',
        '    return prior * hit_rate / evidence',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The false alarms come from the cases where the hypothesis is *false*, which have probability `1 - prior`, not `prior`. The line should be `prior * hit_rate + (1 - prior) * false_alarm`.',
    },
    {
      kind: 'numeric',
      prompt: 'A game pays 10 points with probability 0.2 and costs 2 points with probability 0.8. What is the expected value of one play, in points?',
      answer: '0.4',
      hint: 'Multiply each outcome by its probability and add: `10 × 0.2 + (−2) × 0.8`.',
      explanation: '10 × 0.2 = 2 and (−2) × 0.8 = −1.6, so the expected value is 2 − 1.6 = 0.4. A positive expected value means that on average the game pays off, which is the computation a reinforcement-learning agent does when comparing actions.',
      label: 'Expected value:',
    },
    {
      kind: 'code',
      prompt: 'Write `variance(values)` returning the **population variance**: the average of the squared distances from the mean (divide by `n`). Raise `ValueError` for an empty list.',
      starter: `def variance(values):
    ...
`,
      solution: `def variance(values):
    if not values:
        raise ValueError("variance of an empty list")
    mean = sum(values) / len(values)
    return sum((v - mean) ** 2 for v in values) / len(values)
`,
      tests: `def close(a, b, tol=1e-9):
    return abs(a - b) < tol

assert close(variance([1, 2, 3, 4, 5, 6]), 35 / 12)
assert close(variance([2, 4, 4, 4, 5, 5, 7, 9]), 4.0)
assert close(variance([5, 5, 5]), 0.0)
assert close(variance([3.5]), 0.0)
assert close(variance([-1, 1]), 1.0)
assert close(variance((0, 10)), 25.0)

try:
    variance([])
except ValueError:
    pass
else:
    raise AssertionError("expected ValueError")

data = [3, 1, 2]
variance(data)
assert data == [3, 1, 2]`,
      checks: ['Computes the mean, then the average squared deviation (dividing by `n`)', 'Raises `ValueError` for an empty list', 'Does not modify the input'],
      hint: 'First `mean = sum(values) / len(values)`. Then average `(v - mean) ** 2` over all the values. Check for an empty list at the start.',
      explanation: 'Variance is the mean of the squared deviations. Standard deviation is just `variance(values) ** 0.5`. Normalizing a feature (subtract the mean, divide by the standard deviation) uses exactly these two numbers.',
    },
    {
      kind: 'code',
      prompt: 'Write `bayes(prior, hit_rate, false_alarm)` returning the posterior probability `P(H | E)`, where `prior = P(H)`, `hit_rate = P(E | H)` and `false_alarm = P(E | not H)`.',
      starter: `def bayes(prior, hit_rate, false_alarm):
    ...
`,
      solution: `def bayes(prior, hit_rate, false_alarm):
    evidence = prior * hit_rate + (1 - prior) * false_alarm
    return prior * hit_rate / evidence
`,
      tests: `def close(a, b, tol=1e-9):
    return abs(a - b) < tol

assert close(bayes(0.01, 0.95, 0.05), 0.0095 / (0.0095 + 0.0495))
assert close(bayes(0.5, 0.95, 0.05), 0.95)
assert close(bayes(0.01, 0.99, 0.001), 0.0099 / (0.0099 + 0.00099))
assert close(bayes(0.0, 0.9, 0.1), 0.0)
assert close(bayes(1.0, 0.9, 0.1), 1.0)
assert close(bayes(0.3, 0.8, 0.0), 1.0)
assert close(bayes(0.2, 0.5, 0.5), 0.2)
assert 0 < bayes(0.1, 0.7, 0.2) < 1`,
      checks: ['Computes the evidence as `prior * hit_rate + (1 - prior) * false_alarm`', 'Returns `prior * hit_rate` divided by the evidence', 'Gives the prior back when the evidence is uninformative (`hit_rate == false_alarm`)'],
      hint: 'First find the total probability of a positive result (true positives plus false alarms), then divide the true-positive part by it.',
      explanation: 'When `hit_rate == false_alarm` the evidence tells you nothing, so the posterior equals the prior (a nice sanity check the tests use). Chaining the function, feeding each posterior in as the next prior, updates a belief over several pieces of evidence.',
    },
    {
      kind: 'code',
      prompt: 'Write a numerically stable `softmax(scores)` that returns a **new** list of probabilities. Subtract the largest score before exponentiating so that big scores do not overflow.',
      starter: `import math

def softmax(scores):
    ...
`,
      solution: `import math


def softmax(scores):
    top = max(scores)
    exps = [math.exp(s - top) for s in scores]
    total = sum(exps)
    return [e / total for e in exps]
`,
      tests: `def close(a, b, tol=1e-9):
    return abs(a - b) < tol

p = softmax([2.0, 1.0, 0.1])
assert len(p) == 3
assert close(sum(p), 1.0)
assert close(p[0], 0.6590011388859679, 1e-9)
assert p[0] > p[1] > p[2]

big = softmax([1000.0, 1000.0])
assert close(big[0], 0.5) and close(big[1], 0.5)

assert all(close(x, 0.25) for x in softmax([0, 0, 0, 0]))

a = softmax([1.0, 2.0, 3.0])
b = softmax([101.0, 102.0, 103.0])
assert all(close(x, y) for x, y in zip(a, b))

neg = softmax([-1000.0, 0.0])
assert close(neg[1], 1.0, 1e-9) and neg[0] >= 0

scores = [1.0, 2.0]
out = softmax(scores)
assert scores == [1.0, 2.0] and out is not scores
assert close(softmax([7.0])[0], 1.0)`,
      checks: ['Subtracts the maximum score before calling `math.exp`', 'Divides each exponential by their total so the result sums to 1', 'Returns a new list and leaves the input unchanged'],
      hint: 'Four steps: `top = max(scores)`, exponentiate `s - top` for each score, add the results up, then divide each by that total.',
      explanation: 'Softmax is shift-invariant, so subtracting the maximum changes no output but keeps every exponent at or below 0, so `exp` never overflows. This is the same trick `torch.softmax` uses. Pair this with `cross_entropy` and you have the loss of every classifier in the next units.',
    },
  ],
  takeaways: [
    'A **probability distribution** gives every outcome a probability; they add up to 1. **Expected value** is the probability-weighted average; **variance** (and its square root, the **standard deviation**) measures spread around it.',
    'The **normal distribution** is fixed by its mean and standard deviation. It is the default model for noise, and the usual source of random weight initializations.',
    'The **law of large numbers** is why sampling works: average enough random samples and the estimate converges. Seed your random generators for reproducibility and compare several seeds before trusting a result.',
    '**Bayes’ theorem** updates a prior with evidence: `posterior = likelihood × prior / evidence`. Always consider base rates; a rare event stays unlikely even after a good test.',
    '**Softmax** turns raw scores into a probability distribution and **cross-entropy** (`−log p` of the correct class) is the loss that trains a classifier. Use the max-subtraction trick for stability, and never apply softmax twice before `CrossEntropyLoss`.',
  ],
  reading: [
    { title: 'Seeing Theory: A visual introduction to probability and statistics', url: 'https://seeing-theory.brown.edu/', source: 'tutorial', note: 'Interactive demos of distributions, expectation, the law of large numbers and Bayesian inference.' },
    { title: 'Bayes’ theorem, the geometry of changing beliefs (3Blue1Brown)', url: 'https://www.3blue1brown.com/lessons/bayes-theorem', source: 'video', note: 'The clearest visual explanation of why the prior matters.' },
    { title: 'Mathematics for Machine Learning — Probability and Distributions', url: 'https://mml-book.com/', source: 'book', note: 'Chapter 6, the rigorous version of everything in this lesson.' },
    { title: 'Think Stats (Allen Downey)', url: 'https://greenteapress.com/wp/think-stats-2e/', source: 'book', note: 'A free, Python-based introduction to practical statistics.' },
  ],
};
