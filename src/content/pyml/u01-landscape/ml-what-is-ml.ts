import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-what-is-ml',
  title: 'What Machine Learning Actually Is',
  summary: 'Rules versus learning, the three kinds of machine learning, the anatomy of a model — features, labels, parameters, loss — a learning loop you can run, and why a model must work on data it has never seen.',
  minutes: 18,
  objectives: [
    'Contrast traditional programming (rules → answers) with machine learning (examples → rules)',
    'Classify problems as supervised (classification or regression), unsupervised or reinforcement learning',
    'Name the parts of a supervised model: features, labels, parameters, predictions and loss',
    'Trace a gradient-descent training loop that fits a line, and compute mean squared error',
    'Explain generalization, overfitting and why we hold out a test set',
    'Recognize problems where classic code beats machine learning',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Writing rules vs learning them',
      blocks: [
        {
          type: 'p',
          text: 'In traditional programming, *you* write the rules. To flag a suspicious login, you might code "if the country changed and the password failed three times, alert". You supply **rules + data**, and the program produces **answers**.',
        },
        {
          type: 'p',
          text: '[[machine-learning|Machine learning]] flips this around. You supply **data + answers** — thousands of past logins, each labeled "fraud" or "fine" — and an algorithm produces the **rules**: a [[model]] that maps new inputs to answers. You never write the decision logic yourself.',
        },
        {
          type: 'compare',
          left: {
            title: 'Traditional programming',
            tone: 'neutral',
            text: '**Rules + data → answers.** You write `if`/`else` logic. Great when you can state the rules precisely: physics, pathfinding, scoring, inventory.',
          },
          right: {
            title: 'Machine learning',
            tone: 'neutral',
            text: '**Data + answers → rules.** An algorithm fits a model to examples. Great when the rules are too complex or fuzzy to write down: recognizing faces, understanding speech, playing Rocket League.',
          },
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not just write the rules?',
          text: 'Try writing explicit rules for "is there a cat in this photo?" — pixel by pixel. Or "what should this car do in the next 1/120 of a second to score a goal?" The rules exist, but they’re far too complex for a person to write. Learning them from examples is the only practical way, and the same algorithm can learn very different tasks just by changing the data.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which task is a better fit for machine learning than for hand-written rules?',
      options: [
        { text: 'Calculating sales tax on an order', why: 'The rules are exact and known — just write the formula.' },
        { text: 'Recognizing which emote a player drew with their mouse', correct: true, why: 'Right: the "rules" for shapes drawn by thousands of different hands are fuzzy and complex — perfect for learning from examples.' },
        { text: 'Finding the shortest path through a maze', why: 'Classic algorithms like A* solve this exactly and efficiently.' },
        { text: 'Sorting a leaderboard by score', why: '`sorted()` does this perfectly; there is nothing to learn.' },
      ],
      explanation: 'Use ML when the mapping from input to output is real but too complex to write by hand, and you can collect examples. Tax, pathfinding and sorting have exact, efficient algorithms; recognizing hand-drawn gestures does not.',
    },
    {
      kind: 'concept',
      title: 'Three kinds of learning',
      blocks: [
        {
          type: 'table',
          headers: ['Kind', 'Learns from', 'Typical tasks', 'Game example'],
          rows: [
            ['**[[supervised-learning|Supervised]]**', 'Inputs paired with correct answers ([[label|labels]])', '**Classification** (pick a category) and **regression** (predict a number)', 'Predict whether a match is a smurf account; predict a player’s skill rating'],
            ['**[[unsupervised-learning|Unsupervised]]**', 'Inputs only — no labels', 'Clustering, compression, anomaly detection', 'Group players into play styles; spot unusual aim patterns that might be cheats'],
            ['**[[reinforcement-learning|Reinforcement]]**', 'Rewards from trial and error in an environment', 'Control, decision-making, playing games', 'Train a bot to drive, dodge and score in Rocket League'],
          ],
        },
        {
          type: 'p',
          text: 'A fourth term you’ll hear constantly is **self-supervised learning**: the labels come from the data itself. A language model learns by predicting the next word of real text — the "answer" is simply the word that actually came next. That trick lets [[llm|LLMs]] learn from trillions of words without anyone labeling them.',
        },
        {
          type: 'callout',
          variant: 'analogy',
          text: 'Supervised learning is studying with an answer key. Unsupervised learning is sorting a pile of photos into groups without being told the categories. Reinforcement learning is learning a video game by playing it: no one tells you the right button, but the score tells you how you’re doing.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Classify each task as supervised **classification**, supervised **regression**, **clustering** (unsupervised) or **reinforcement** learning.',
      template: 'Predicting how many minutes a match will last: ___. Deciding whether a chat message is toxic: ___. Grouping players by play style without labels: ___. Teaching a car to race by giving points for lap progress: ___.',
      blanks: [{ answers: ['regression'] }, { answers: ['classification'] }, { answers: ['clustering'] }, { answers: ['reinforcement'] }],
      wordBank: ['regression', 'classification', 'clustering', 'reinforcement', 'self-supervised'],
      explanation: 'Match length is a **number** → regression. Toxic or not is a **category** → classification. Grouping without labels → **clustering**. Learning from points earned through trial and error → **reinforcement** learning.',
    },
    {
      kind: 'concept',
      title: 'Anatomy of a model: fitting a line',
      blocks: [
        {
          type: 'p',
          text: 'Let’s see learning happen. A designer has measured how much damage a weapon does at levels 1–5 and wants to predict higher levels. The simplest model is a straight line, $\\hat{y} = w x + b$, with two **[[parameter|parameters]]**: the slope $w$ and the intercept $b$. Learning means finding the $w$ and $b$ that make predictions $\\hat{y}$ closest to the real values $y$.',
        },
        {
          type: 'list',
          items: [
            '**[[feature|Feature]]** $x$: the input (level). **[[label|Label]]** $y$: the correct answer (damage).',
            '**Prediction** $\\hat{y} = wx + b$: what the model says.',
            '**[[loss-function|Loss]]**: how wrong it is overall. Here, the **mean squared error** $\\text{MSE} = \\frac{1}{n}\\sum (\\hat{y} - y)^2$.',
            '**Training**: repeatedly nudge $w$ and $b$ in the direction that lowers the loss — **gradient descent**.',
          ],
        },
        {
          type: 'code',
          title: 'fit_line.py',
          runnable: true,
          code: 'levels = [1, 2, 3, 4, 5]\ndamage = [12, 15, 21, 24, 28]\n\nw, b = 0.0, 0.0     # parameters, starting from nothing\nlr = 0.02           # learning rate\n\nfor step in range(1, 3001):\n    grad_w = grad_b = 0.0\n    for x, y in zip(levels, damage):\n        error = (w * x + b) - y\n        grad_w += 2 * error * x / len(levels)\n        grad_b += 2 * error / len(levels)\n    w -= lr * grad_w\n    b -= lr * grad_b\n    if step in (1, 10, 100, 3000):\n        loss = sum(((w * x + b) - y) ** 2 for x, y in zip(levels, damage)) / len(levels)\n        print(f"step {step:4}: w = {w:.2f}, b = {b:.2f}, loss = {loss:.2f}")\n\nprint(f"Predicted damage at level 10: {w * 10 + b:.1f}")',
          output: 'step    1: w = 2.73, b = 0.80, loss = 125.50\nstep   10: w = 5.67, b = 2.00, loss = 6.29\nstep  100: w = 4.96, b = 4.61, loss = 2.12\nstep 3000: w = 4.10, b = 7.70, loss = 0.38\nPredicted damage at level 10: 48.7',
          annotations: [
            { lines: '1-2', text: 'The training data: five examples with features (levels) and labels (damage).' },
            { lines: 10, text: 'How far off is this prediction?' },
            { lines: '11-12', text: 'The **gradient**: how the loss would change if we nudged `w` or `b`. These formulas come from calculus (the derivative of the squared error); the Math unit explains them.' },
            { lines: '13-14', text: 'Step *against* the gradient — downhill — by a small amount. That’s gradient descent.' },
            { lines: 16, text: 'The loss falls fast at first, then settles as the line fits the data.' },
            { lines: 19, text: 'The learned line is about $4.1x + 7.7$, so level 10 predicts about 48.7.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          text: 'This loop — predict, measure the loss, compute gradients, update parameters — is *exactly* how a neural network with billions of parameters is trained. PyTorch computes the gradients for you (autograd) and runs the arithmetic on a GPU, but the shape of the loop is the same.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'A model predicts `[10, 20, 30]` for three examples whose true labels are `[12, 18, 33]`. What is the mean squared error? (Round to 2 decimal places.)',
      answer: '17/3',
      answerTex: '\\tfrac{17}{3} \\approx 5.67',
      hint: 'Square each difference: $(10-12)^2$, $(20-18)^2$, $(30-33)^2$. Then take the average.',
      explanation: 'The errors are $-2$, $2$ and $-3$, which square to $4$, $4$ and $9$. Their sum is $17$, and the mean over three examples is $17 / 3 \\approx 5.67$. Squaring makes every error positive and punishes big misses much more than small ones.',
      label: 'MSE =',
    },
    {
      kind: 'concept',
      title: 'Generalization: the whole point',
      blocks: [
        {
          type: 'p',
          text: 'A model is only useful if it works on **new** data it has never seen. A lookup table that memorized the five training points would have zero training error — and couldn’t say anything about level 10. The ability to perform well on unseen data is called **generalization**.',
        },
        {
          type: 'p',
          text: 'So we never judge a model by its training data alone. We split the [[dataset]]:',
        },
        {
          type: 'list',
          items: [
            '**Training set** (often ~70–80%) — the model learns from it.',
            '**Validation set** — used to compare models and tune settings like the learning rate (the [[hyperparameter|hyperparameters]]).',
            '**Test set** — locked away until the very end, for one honest measurement of performance on unseen data.',
          ],
        },
        {
          type: 'table',
          headers: ['Problem', 'Training error', 'Test error', 'What happened'],
          rows: [
            ['**Underfitting**', 'High', 'High', 'The model is too simple to capture the pattern (a straight line through a curve)'],
            ['**Good fit**', 'Low', 'Low (similar)', 'It learned the real pattern'],
            ['**[[overfitting|Overfitting]]**', 'Very low', 'High', 'It memorized the training data, noise included'],
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Data leakage',
          text: 'If test examples (or information about them) sneak into training, your test score lies — the model has effectively seen the answers. Classic leaks: duplicates across the split, normalizing with statistics computed on *all* the data, or splitting a time series randomly so the model trains on the future.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If a model reaches 100% accuracy on its training data, it is guaranteed to work well on new data.',
      answer: false,
      explanation: 'False. Perfect training accuracy is often a sign of **overfitting** — the model memorized the examples (including their noise) instead of learning the general pattern. Only performance on held-out validation and test data tells you how it will do on new data.',
    },
    {
      kind: 'concept',
      title: 'The machine-learning workflow',
      blocks: [
        {
          type: 'steps',
          items: [
            { title: 'Frame the problem', text: 'What exactly should be predicted or decided, and how will you measure success? "Reduce cheating" becomes "classify matches as suspicious, catching 90% of cheats with under 1% false accusations".' },
            { title: 'Collect data', text: 'Gather examples (and labels, for supervised learning) — or, for RL, build an environment to practice in.' },
            { title: 'Prepare the data', text: 'Clean it, handle missing values, turn raw inputs into numeric features, split into train/validation/test. This step often takes most of the time.' },
            { title: 'Choose and train a model', text: 'Start simple (linear models, decision trees), then try more powerful ones (gradient boosting, neural networks).' },
            { title: 'Evaluate', text: 'Measure on validation data, tune, and finally check once on the test set.' },
            { title: 'Deploy and monitor', text: 'Ship the model — inside an API, an app or a game engine — and watch it: real-world data drifts, and models go stale.' },
          ],
        },
        {
          type: 'p',
          text: 'This course follows that path: NumPy and pandas for data, scikit-learn for classic models and evaluation, PyTorch for neural networks, Gymnasium and RLGym for environments, and ONNX for deploying models into games.',
        },
      ],
    },
    {
      kind: 'order',
      prompt: 'Put the machine-learning workflow in order.',
      lines: [
        'Define what to predict and how to measure success',
        'Collect labeled examples',
        'Clean the data and split it into train, validation and test sets',
        'Train candidate models and tune them on the validation set',
        'Measure the final model once on the test set',
        'Deploy the model and monitor it',
      ],
      explanation: 'Frame → collect → prepare and split → train and tune (validation) → final test → deploy and monitor. The test set is used once, at the end, so it stays an honest estimate of real-world performance.',
    },
    {
      kind: 'concept',
      title: 'When not to use machine learning',
      blocks: [
        {
          type: 'p',
          text: 'Machine learning is powerful, but it costs data, compute, time and predictability. Prefer ordinary code when:',
        },
        {
          type: 'list',
          items: [
            '**The rules are known and exact** — damage formulas, physics, pathfinding (A*), sorting.',
            '**You need guarantees** — an ML model is right *most* of the time, which isn’t acceptable for a save system or a payment.',
            '**You can’t explain or debug it** — designers often need to know *why* an NPC did something. Behavior trees and state machines are transparent.',
            '**You have little data**, or the data doesn’t represent the real situation.',
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Game AI is usually hybrid',
          text: 'Most shipped games still drive NPCs with finite-state machines, behavior trees, utility AI and planners — predictable, tunable and cheap. ML is used where it shines: animation (motion matching), testing bots that play thousands of matches, matchmaking and anti-cheat, and increasingly agents for specific games. The AI for Games unit compares the approaches.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write the loss function yourself. Compute the **mean squared error** between `predictions` and `targets`, store it in `mse`, and print it rounded to 2 decimals:\n\n```\nMSE: 5.67\n```',
      starter: 'predictions = [10, 20, 30]\ntargets = [12, 18, 33]\n\nmse = 0  # fix me\n\nprint("MSE:", round(mse, 2))\n',
      solution: 'predictions = [10, 20, 30]\ntargets = [12, 18, 33]\n\ntotal = 0\nfor p, t in zip(predictions, targets):\n    total += (p - t) ** 2\nmse = total / len(targets)\n\nprint("MSE:", round(mse, 2))\n',
      tests: 'import math\nassert math.isclose(mse, 17 / 3), f"mse should be 17/3 ≈ 5.667, got {mse}"',
      expectOutput: 'MSE: 5.67',
      checks: ['Squares each prediction error', 'Divides the total by the number of examples'],
      hint: 'Loop over `zip(predictions, targets)`, add up `(p - t) ** 2`, then divide by `len(targets)`.',
      explanation: 'MSE is the average of squared errors: $\\frac{(10-12)^2 + (20-18)^2 + (30-33)^2}{3} = \\frac{17}{3} \\approx 5.67$. A one-line version: `sum((p - t) ** 2 for p, t in zip(predictions, targets)) / len(targets)`. NumPy will make this `((p - t) ** 2).mean()`.',
    },
    {
      kind: 'mcq',
      prompt: 'A cheat-detection model scores 99% on its training data but only 70% on matches it has never seen. What is the most likely problem?',
      options: [
        { text: 'Underfitting: the model is too simple', why: 'An underfit model does badly on the training data too.' },
        { text: 'Overfitting: it memorized the training matches instead of learning general patterns', correct: true, why: 'Right — the big gap between training and test performance is the signature of overfitting.' },
        { text: 'The learning rate is exactly right', why: 'The gap indicates a problem, not a well-tuned model.' },
        { text: 'Test data is always 30% harder, so this is normal', why: 'A well-generalizing model scores similarly on training and test data drawn from the same distribution.' },
      ],
      explanation: 'High training accuracy with much lower test accuracy means the model fits quirks of its training data that don’t carry over. Remedies — more data, simpler models, regularization, early stopping — are covered in the Classic Machine Learning unit.',
    },
  ],
  takeaways: [
    'Traditional code: rules + data → answers. Machine learning: data + answers → a model (the rules).',
    'Supervised learning uses labels (classification for categories, regression for numbers); unsupervised finds structure without labels; reinforcement learns from rewards; self-supervised makes labels from the data itself.',
    'A model has parameters (e.g. $w$, $b$); training minimizes a loss (e.g. mean squared error) with gradient descent: predict, measure, compute gradients, update.',
    'What matters is generalization to unseen data: split into training, validation and test sets, and watch for underfitting, overfitting and data leakage.',
    'Workflow: frame → collect → prepare → train → evaluate → deploy and monitor.',
    'Use plain code when rules are exact, guarantees or explainability matter, or data is scarce. Game AI is usually a hybrid.',
  ],
  reading: [
    { title: 'Google Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', source: 'course', note: 'A free, well-illustrated introduction to the core ideas of this lesson.' },
    { title: 'scikit-learn: Choosing the right estimator', url: 'https://scikit-learn.org/stable/machine_learning_map.html', source: 'docs', note: 'A famous flowchart for picking a model by problem type — you’ll use scikit-learn in Unit 5.' },
    { title: 'Machine learning', url: 'https://en.wikipedia.org/wiki/Machine_learning', source: 'wikipedia', note: 'Definitions, paradigms and history, with references to go deeper.' },
    { title: 'Neural Networks (3Blue1Brown)', url: 'https://www.3blue1brown.com/topics/neural-networks', source: 'video', note: 'Beautiful visual explanations of gradient descent and how networks learn.' },
  ],
};
