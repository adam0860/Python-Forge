import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-history',
  title: 'A History of AI and Machine Learning',
  summary: 'From Turing’s question and the perceptron to AI winters, the deep-learning explosion, game-playing agents and large language models — the ideas behind every tool in this course.',
  minutes: 18,
  objectives: [
    'Describe the founding moments of AI: Turing (1950), the Dartmouth workshop (1956) and the perceptron (1958)',
    'Explain why AI went through "winters", and what the XOR problem showed about single-layer networks',
    'Identify the three ingredients of the deep-learning boom: data, GPUs and better algorithms',
    'Recognize the landmark game-playing systems — TD-Gammon, Deep Blue, DQN, AlphaGo, OpenAI Five, AlphaStar — and what each proved',
    'Place transformers, LLMs and today’s Python tools on the timeline',
  ],
  steps: [
    {
      kind: 'concept',
      title: '"Can machines think?"',
      blocks: [
        {
          type: 'p',
          text: 'In 1950, the British mathematician **Alan Turing** published *Computing Machinery and Intelligence*. Instead of arguing about the slippery question "can machines think?", he proposed a test: if a machine can hold a text conversation that a human judge can’t tell apart from a person’s, we should credit it with intelligence. The **Turing test** framed the field for decades.',
        },
        {
          type: 'p',
          text: 'Even earlier, in 1943, **Warren McCulloch and Walter Pitts** described a simplified mathematical model of a brain neuron: it adds up weighted inputs and "fires" if the total passes a threshold. Every neural network you’ll build in this course — including the ones inside ChatGPT and game-playing bots — descends from that idea.',
        },
        {
          type: 'p',
          text: 'In the summer of 1956, John McCarthy, Marvin Minsky, Claude Shannon and Nathaniel Rochester organized a workshop at **Dartmouth College**. Their proposal coined the term **[[artificial-intelligence|artificial intelligence]]** and boldly conjectured that learning, and every other feature of intelligence, could in principle be described precisely enough for a machine to simulate it. Dartmouth is usually counted as AI’s birth.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'The first "machine learning"',
          text: 'In 1959, IBM’s **Arthur Samuel** coined the phrase *machine learning* for his checkers program, which improved by playing thousands of games against itself — a remarkably modern idea. Games have been AI’s favorite laboratory ever since, which is good news for anyone who wants to build game AI.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why study the history?',
          text: 'Modern AI is built from ideas that were invented, abandoned and rediscovered several times. Knowing *why* the perceptron failed explains why networks have hidden layers; knowing why 2012 was a turning point explains why everyone wants GPUs. The history is a map of the concepts you’re about to learn.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which event is usually considered the founding of artificial intelligence as a field, and coined its name?',
      options: [
        { text: 'The 1956 Dartmouth summer workshop', correct: true, why: 'Right — the 1955 proposal for the workshop introduced the term "artificial intelligence".' },
        { text: 'The release of ChatGPT in 2022', why: 'ChatGPT made AI a household word, but the field is almost 70 years older.' },
        { text: 'Deep Blue beating Kasparov in 1997', why: 'A famous milestone, but four decades after the field began.' },
        { text: 'The invention of the transistor in 1947', why: 'Important for computing, but not the founding of AI.' },
      ],
      explanation: 'The Dartmouth Summer Research Project on Artificial Intelligence (1956) gathered the field’s founders, and its proposal coined the name. Turing’s 1950 paper set the question; Dartmouth set the agenda.',
    },
    {
      kind: 'concept',
      title: 'The perceptron: a machine that learns',
      blocks: [
        {
          type: 'p',
          text: 'In 1958, psychologist **Frank Rosenblatt** built the **[[perceptron]]**: a McCulloch–Pitts neuron that could *learn* its weights from examples. Show it an input, compare its answer with the right one, and nudge each weight a little in the direction that reduces the error. Repeat. Here is Rosenblatt’s learning rule, in a few lines of plain Python, learning the logical OR function:',
        },
        {
          type: 'code',
          title: 'perceptron.py',
          runnable: true,
          code: 'data = [((0, 0), 0), ((0, 1), 1), ((1, 0), 1), ((1, 1), 1)]   # OR\nw1, w2, bias = 0.0, 0.0, 0.0\nlr = 0.1   # learning rate: how big each nudge is\n\nfor epoch in range(1, 11):\n    mistakes = 0\n    for (x1, x2), target in data:\n        output = 1 if w1 * x1 + w2 * x2 + bias > 0 else 0\n        error = target - output\n        if error != 0:\n            w1 += lr * error * x1\n            w2 += lr * error * x2\n            bias += lr * error\n            mistakes += 1\n    print(f"epoch {epoch}: {mistakes} mistake(s)")\n    if mistakes == 0:\n        break\n\nprint("w1 =", round(w1, 2), " w2 =", round(w2, 2), " bias =", round(bias, 2))',
          output: 'epoch 1: 1 mistake(s)\nepoch 2: 2 mistake(s)\nepoch 3: 1 mistake(s)\nepoch 4: 0 mistake(s)\nw1 = 0.1  w2 = 0.1  bias = 0.0',
          annotations: [
            { lines: 1, text: 'The training data: each input pair with its correct answer (the *label*).' },
            { lines: 2, text: 'The model’s **parameters**: two weights and a bias, starting at zero. Learning means finding good values for these.' },
            { lines: 5, text: 'An **epoch** is one pass through all the training data.' },
            { lines: 8, text: 'The neuron: a weighted sum plus bias, then a threshold — fire (1) or not (0).' },
            { lines: '10-13', text: 'The learning rule: if wrong, move each weight in proportion to its input and the error. Inputs that were 0 didn’t contribute, so their weights don’t change.' },
          ],
        },
        {
          type: 'p',
          text: 'After four epochs it makes no mistakes. Nobody wrote an `if` for OR — the program found weights that implement it. That shift, **from writing rules to learning them from data**, is the core idea of [[machine-learning|machine learning]].',
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'Rosenblatt’s perceptron was a physical machine, the Mark I, with a 20×20 grid of light sensors and weights stored in motor-driven potentiometers. The press predicted machines that would soon walk, talk and be conscious. The hype would not age well.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'A perceptron has weights `w1 = 0.5`, `w2 = -1.0` and `bias = 0.2`. What does this code print?',
      code: 'w1, w2, bias = 0.5, -1.0, 0.2\nfor x1, x2 in [(1, 0), (1, 1), (0, 0)]:\n    total = w1 * x1 + w2 * x2 + bias\n    print(1 if total > 0 else 0)',
      answer: '1\n0\n1',
      hint: 'Compute the weighted sum plus bias for each input pair, then apply the threshold: positive → 1, otherwise 0.',
      explanation: '(1, 0): $0.5 + 0 + 0.2 = 0.7 > 0$ → `1`. (1, 1): $0.5 - 1.0 + 0.2 = -0.3$ → `0`. (0, 0): just the bias, $0.2 > 0$ → `1`. A single neuron is nothing more than this weighted sum and threshold.',
    },
    {
      kind: 'concept',
      title: 'Winters: when the hype ran out',
      blocks: [
        {
          type: 'p',
          text: 'In 1969, Marvin Minsky and Seymour Papert published *Perceptrons*, a rigorous analysis of what single-layer perceptrons can and cannot do. The famous example is **XOR** ("one or the other, but not both"). No single straight line separates XOR’s true cases from its false ones, so a single neuron can never learn it — no matter how long it trains:',
        },
        {
          type: 'table',
          headers: ['x1', 'x2', 'OR', 'XOR'],
          rows: [
            ['0', '0', '0', '0'],
            ['0', '1', '1', '1'],
            ['1', '0', '1', '1'],
            ['1', '1', '1', '**0**'],
          ],
          caption: 'Change the last label of the training data in perceptron.py to 0 and run it: the mistakes never reach zero.',
        },
        {
          type: 'p',
          text: 'The fix was known in principle — stack neurons in **layers**, so hidden neurons can combine simple boundaries into complex ones — but nobody had a good way to *train* multi-layer networks. Combined with over-promising and disappointing results across AI, funding collapsed in the mid-1970s: the first **AI winter**. A second one followed in the late 1980s, when "expert systems" built from thousands of hand-written rules proved brittle and expensive to maintain.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why layers solve XOR',
          text: 'XOR = (x1 OR x2) AND NOT (x1 AND x2). One hidden neuron can learn OR, another can learn AND, and an output neuron can combine them. Each neuron draws one straight line; layers let the network combine lines into regions of any shape. That is the whole reason deep networks are *deep*.',
        },
        {
          type: 'callout',
          variant: 'history',
          text: 'The missing training method, **backpropagation**, was worked out several times and popularized in 1986 by David Rumelhart, Geoffrey Hinton and Ronald Williams. It uses the chain rule from calculus to work out how every weight in every layer affected the error. You’ll implement it from scratch in the Neural Networks unit.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Given enough training epochs, a single-layer perceptron can learn the XOR function.',
      answer: false,
      explanation: 'False. A single neuron can only separate inputs with one straight line (a hyperplane), and XOR’s true cases (0,1) and (1,0) sit diagonally opposite each other — no line separates them from (0,0) and (1,1). It takes at least one hidden layer, trained with backpropagation.',
    },
    {
      kind: 'concept',
      title: 'Games as AI’s proving ground',
      blocks: [
        {
          type: 'p',
          text: 'Games have clear rules, clear scores and endless opponents, so they’ve been AI’s benchmark from Samuel’s checkers onward. Each milestone below showed something new was possible:',
        },
        {
          type: 'table',
          headers: ['Year', 'System', 'What it proved'],
          rows: [
            ['1992', 'TD-Gammon (IBM)', 'A neural network trained by **[[reinforcement-learning|reinforcement learning]]** and self-play reached world-class backgammon'],
            ['1997', 'Deep Blue (IBM)', 'Beat world chess champion Garry Kasparov — with massive search and hand-tuned evaluation, not learning'],
            ['2013–15', 'DQN (DeepMind)', 'One network learned dozens of Atari games from raw pixels and the score alone'],
            ['2016', 'AlphaGo (DeepMind)', 'Beat Lee Sedol at Go, long thought a decade away, combining deep networks with tree search'],
            ['2017', 'AlphaZero', 'Mastered chess, shogi and Go from the rules alone, by self-play'],
            ['2019', 'OpenAI Five, AlphaStar', 'Beat world champions at Dota 2; reached Grandmaster level in StarCraft II — real-time, team-based, partially observable games'],
            ['2022', 'GT Sophy (Sony AI)', 'Outraced top human drivers in Gran Turismo Sport'],
          ],
          caption: 'In 2024, Andrew Barto and Richard Sutton received the Turing Award — computing’s highest honor — for the foundations of reinforcement learning.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Where you come in',
          text: 'Today, anyone with a gaming PC can train agents with the same algorithms: Gymnasium environments, PPO from Stable-Baselines3, Unity ML-Agents, and **RLGym**, a community framework for training Rocket League bots. The AI for Games unit at the end of this course builds exactly that.',
        },
      ],
    },
    {
      kind: 'order',
      prompt: 'Put these game-AI milestones in chronological order.',
      lines: [
        'Arthur Samuel’s checkers program learns by self-play',
        'TD-Gammon reaches world-class backgammon',
        'Deep Blue defeats Garry Kasparov at chess',
        'AlphaGo defeats Lee Sedol at Go',
        'OpenAI Five beats the Dota 2 world champions',
      ],
      explanation: 'Samuel’s checkers (1950s) → TD-Gammon (1992) → Deep Blue (1997) → AlphaGo (2016) → OpenAI Five (2019). Notice the swing from hand-crafted search (Deep Blue) back to learning (everything after it).',
    },
    {
      kind: 'concept',
      title: '2012: the deep-learning big bang',
      blocks: [
        {
          type: 'p',
          text: 'Neural networks stayed a niche interest until three ingredients came together in the late 2000s:',
        },
        {
          type: 'steps',
          items: [
            { title: 'Data', text: 'The internet produced labeled data at a new scale. **ImageNet** (Fei-Fei Li’s team, 2009) offered over a million labeled images in a thousand categories, with a yearly competition.' },
            { title: 'Compute', text: 'GPUs, built to push pixels for games, turned out to be perfect for the matrix multiplications at the heart of neural networks. NVIDIA’s CUDA (2007) made them programmable for general work.' },
            { title: 'Algorithms', text: 'Better activation functions (ReLU), regularization (dropout), weight initialization and architectures such as convolutional networks — pioneered by Yann LeCun around 1989 — made deep networks trainable.' },
          ],
        },
        {
          type: 'p',
          text: 'In 2012, **AlexNet** — by Alex Krizhevsky, Ilya Sutskever and Geoffrey Hinton, trained on two gaming GPUs — won ImageNet by a huge margin, cutting the error rate by around ten percentage points. Within a few years nearly every image, speech and translation system switched to [[deep-learning|deep learning]]. Hinton, LeCun and Yoshua Bengio received the 2018 Turing Award, and in 2024 Hinton shared the Nobel Prize in Physics with John Hopfield for foundational work on neural networks.',
        },
        {
          type: 'callout',
          variant: 'analogy',
          text: 'Video games paid for the AI revolution. Decades of gamers buying ever-faster graphics cards funded the hardware that made deep learning practical — and the GPU in your gaming PC is a perfectly good machine-learning workstation.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which combination best explains why deep learning took off around 2012?',
      options: [
        { text: 'Large labeled datasets, GPUs for fast matrix math, and training tricks that made deep networks learn', correct: true, why: 'Right — data, compute and algorithms arrived together; AlexNet showed what they could do.' },
        { text: 'The invention of the neuron model in 2012', why: 'The artificial neuron dates from 1943, and the perceptron from 1958.' },
        { text: 'Python became faster than C++', why: 'It didn’t. Python orchestrates the work; GPU kernels written in CUDA/C++ do the heavy lifting.' },
        { text: 'Computers finally became conscious', why: 'No. The breakthroughs were engineering and mathematics, not consciousness.' },
      ],
      explanation: 'Deep learning needed all three: big datasets (ImageNet), cheap parallel compute (gaming GPUs with CUDA), and algorithmic improvements (ReLU, dropout, good initialization, convolutional architectures). AlexNet in 2012 combined them and won decisively.',
    },
    {
      kind: 'concept',
      title: 'Transformers, LLMs and the Python takeover',
      blocks: [
        {
          type: 'p',
          text: 'In 2017, a Google team published **"Attention Is All You Need"**, introducing the **[[transformer]]**: an architecture that lets every word (or image patch, or game state) look at every other through a mechanism called *attention*. Transformers train efficiently on enormous datasets, and they scale: make them bigger, give them more data, and they keep improving.',
        },
        {
          type: 'list',
          items: [
            '**2018–2020** — BERT and the GPT series show that models pre-trained on huge amounts of text can be adapted to almost any language task. GPT-3 (2020) has 175 billion parameters.',
            '**2020** — AlphaFold 2 predicts protein structures with near-experimental accuracy (its creators shared the 2024 Nobel Prize in Chemistry).',
            '**2022** — Image generators such as Stable Diffusion appear, and **ChatGPT** (November 2022) brings [[llm|large language models]] to hundreds of millions of people.',
            '**Today** — LLMs write code, reason through problems and act as agents that use tools. The same transformer ideas power vision, speech, robotics and game agents.',
          ],
        },
        {
          type: 'p',
          text: 'Along the way, **Python** became the language of AI. Theano and Torch (in Lua) were early frameworks; Google released **TensorFlow** in 2015 and Facebook’s AI lab released **PyTorch** in 2016. PyTorch’s Pythonic, run-it-line-by-line style won over researchers, and it now underpins most AI research and many products — governed since 2022 by the PyTorch Foundation, part of the Linux Foundation.',
        },
        {
          type: 'callout',
          variant: 'under',
          text: 'Remember the two-language pattern from the Python course: an LLM training run is Python on the surface and enormous amounts of CUDA and C++ underneath. Python’s job is to describe the model and the experiment clearly; the GPU kernels do the arithmetic.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the timeline.',
      template: 'In 1958, Rosenblatt’s ___ learned its weights from examples. In 1986, ___ made multi-layer networks trainable. In 2012, ___ won ImageNet using GPUs. In 2017, the ___ architecture introduced attention.',
      blanks: [{ answers: ['perceptron'] }, { answers: ['backpropagation'] }, { answers: ['AlexNet'] }, { answers: ['transformer'] }],
      wordBank: ['perceptron', 'backpropagation', 'AlexNet', 'transformer', 'Deep Blue', 'ChatGPT'],
      explanation: 'The perceptron (1958) learned single-neuron weights; backpropagation (popularized 1986) trained multi-layer networks; AlexNet (2012) launched the deep-learning boom; and the transformer (2017) is the architecture behind modern LLMs. Deep Blue (1997) used search rather than learning, and ChatGPT (2022) is built on transformers.',
    },
    {
      kind: 'code',
      prompt: 'XOR is famous because one neuron can’t learn it — but **two layers of hand-wired neurons** can compute it. Using the `neuron` helper, complete the network so it prints the XOR truth table:\n\n```\n0 0 -> 0\n0 1 -> 1\n1 0 -> 1\n1 1 -> 0\n```\n\nIdea: `h_or` fires for OR, `h_and` fires for AND, and the output fires when `h_or` is on **and** `h_and` is off.',
      starter: 'def neuron(inputs, weights, bias):\n    total = sum(x * w for x, w in zip(inputs, weights)) + bias\n    return 1 if total > 0 else 0\n\nfor x1, x2 in [(0, 0), (0, 1), (1, 0), (1, 1)]:\n    h_or = neuron((x1, x2), (1, 1), -0.5)    # fires if x1 OR x2\n    h_and = neuron((x1, x2), (1, 1), -1.5)   # fires if x1 AND x2\n    out = neuron((h_or, h_and), (0, 0), 0)   # fix these weights and bias\n    print(x1, x2, "->", out)\n',
      solution: 'def neuron(inputs, weights, bias):\n    total = sum(x * w for x, w in zip(inputs, weights)) + bias\n    return 1 if total > 0 else 0\n\nfor x1, x2 in [(0, 0), (0, 1), (1, 0), (1, 1)]:\n    h_or = neuron((x1, x2), (1, 1), -0.5)    # fires if x1 OR x2\n    h_and = neuron((x1, x2), (1, 1), -1.5)   # fires if x1 AND x2\n    out = neuron((h_or, h_and), (1, -1), -0.5)\n    print(x1, x2, "->", out)\n',
      tests: 'for a, b, want in [(0, 0, 0), (0, 1, 1), (1, 0, 1), (1, 1, 0)]:\n    o = neuron((neuron((a, b), (1, 1), -0.5), neuron((a, b), (1, 1), -1.5)), (1, -1), -0.5)\n    assert o == want',
      expectOutput: '0 0 -> 0\n0 1 -> 1\n1 0 -> 1\n1 1 -> 0',
      checks: ['The output neuron uses a positive weight for `h_or` and a negative weight for `h_and`', 'Prints the XOR truth table'],
      hint: 'Try weights `(1, -1)`: OR adds 1, AND subtracts 1. Then pick a bias so the total is positive only when OR is on and AND is off (for example `-0.5`).',
      explanation: 'With weights `(1, -1)` and bias `-0.5`, the output’s total is `h_or - h_and - 0.5`: positive only when `h_or = 1` and `h_and = 0` — exactly XOR. The hidden layer turned an impossible problem into an easy one. Backpropagation lets a network discover weights like these by itself. (`def` defines a function; you’ll learn it properly in the Python course’s Functions unit.)',
    },
  ],
  takeaways: [
    'Turing (1950) asked whether machines can think; McCulloch and Pitts (1943) modeled the neuron; the 1956 Dartmouth workshop named "artificial intelligence"; Samuel coined "machine learning" (1959).',
    'Rosenblatt’s perceptron (1958) learned its weights from data — the shift from writing rules to learning them.',
    'Single-layer perceptrons can’t learn XOR (Minsky & Papert, 1969). Hidden layers can, and backpropagation (1986) made them trainable. Over-promising led to two AI winters.',
    'Deep learning took off in 2012 (AlexNet) when big data, GPUs and better algorithms combined.',
    'Games were the proving ground: TD-Gammon, Deep Blue, DQN, AlphaGo, AlphaZero, OpenAI Five, AlphaStar, GT Sophy. Sutton and Barto won the 2024 Turing Award for reinforcement learning.',
    'Transformers (2017) led to LLMs and ChatGPT (2022). Python — via PyTorch (2016) and TensorFlow (2015) — became AI’s language.',
  ],
  reading: [
    { title: 'Computing Machinery and Intelligence (A. M. Turing, 1950)', url: 'https://academic.oup.com/mind/article/LIX/236/433/986238', source: 'paper', note: 'Turing’s original paper — surprisingly readable, and still argued about today.' },
    { title: 'History of artificial intelligence', url: 'https://en.wikipedia.org/wiki/History_of_artificial_intelligence', source: 'wikipedia', note: 'A detailed, well-referenced account of the whole story, winters included.' },
    { title: 'Perceptron', url: 'https://en.wikipedia.org/wiki/Perceptron', source: 'wikipedia', note: 'The learning rule, the Mark I machine and the XOR controversy.' },
    { title: 'Attention Is All You Need (Vaswani et al., 2017)', url: 'https://arxiv.org/abs/1706.03762', source: 'paper', note: 'The paper that introduced the transformer — you’ll understand it fully by the Deep Learning unit.' },
    { title: 'Reinforcement Learning: An Introduction (Sutton & Barto)', url: 'https://incompleteideas.net/book/the-book-2nd.html', source: 'book', note: 'The standard RL textbook by the 2024 Turing Award winners, free online.' },
  ],
};
