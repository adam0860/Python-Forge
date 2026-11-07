import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-ecosystem',
  title: 'The Python ML Ecosystem',
  summary: 'A map of the libraries you’ll use — NumPy, pandas, scikit-learn, PyTorch, Hugging Face, Gymnasium, Stable-Baselines3, RLGym, ONNX — how they stack on top of each other, and which one to reach for when.',
  minutes: 16,
  objectives: [
    'Draw the layers of the Python ML stack, from NumPy up to deployment tools',
    'Pick the right library for a task: data, classic ML, deep learning, reinforcement learning, language models or deployment',
    'Recognize the common APIs: NumPy array math, scikit-learn’s `fit`/`predict`, PyTorch tensors and Gymnasium’s `reset`/`step`',
    'Explain how RLGym trains Rocket League bots without running the game',
    'Estimate the size of tensors and the parameter count of a small network',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A stack of libraries',
      blocks: [
        {
          type: 'p',
          text: 'Python became the language of AI not because of one library, but because of an **ecosystem** that builds layer upon layer. Each layer uses the ones beneath it, and almost all of them hand the heavy number-crunching to C, C++ or CUDA.',
        },
        {
          type: 'table',
          headers: ['Layer', 'Libraries', 'What they give you'],
          rows: [
            ['Arrays', '**NumPy**', 'Fast multi-dimensional arrays and vectorized math — the foundation of everything above'],
            ['Data and plots', '**pandas**, **matplotlib**, seaborn, Polars', 'Tables of data (DataFrames), cleaning, charts'],
            ['Classic ML', '**scikit-learn**, XGBoost, LightGBM', 'Regression, classification, clustering, evaluation — with one consistent API'],
            ['Deep learning', '**PyTorch**, JAX, TensorFlow/Keras', '[[tensor|Tensors]] on GPUs, automatic gradients, neural-network building blocks'],
            ['Domain libraries', 'torchvision, **Hugging Face** (transformers, datasets)', 'Pretrained models and datasets for vision, language, audio'],
            ['Reinforcement learning', '**Gymnasium**, **Stable-Baselines3**, PettingZoo, **RLGym**', 'Environments and ready-made RL algorithms like PPO'],
            ['Deployment', '**ONNX** / ONNX Runtime, ExecuTorch, game-engine runtimes', 'Run trained models in apps, servers, phones and game engines'],
          ],
          caption: 'Bold libraries are the ones this course uses most.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why is everything built on NumPy?',
          text: 'Interoperability. Because nearly every library accepts and returns NumPy-style arrays, you can load data with pandas, preprocess with scikit-learn, train with PyTorch and plot with matplotlib, passing arrays between them with little or no conversion. A shared data type is what turned a pile of libraries into an ecosystem.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You have a spreadsheet of 50,000 matches and want to predict whether a player will quit the game next month using a decision tree. Which library is the natural first choice?',
      options: [
        { text: 'scikit-learn', correct: true, why: 'Right — tabular data and classic models like decision trees are scikit-learn’s home turf.' },
        { text: 'Gymnasium', why: 'Gymnasium provides reinforcement-learning environments, not tabular prediction.' },
        { text: 'ONNX Runtime', why: 'ONNX Runtime runs already-trained models; it doesn’t train them.' },
        { text: 'matplotlib', why: 'matplotlib draws charts — useful for exploring the data, but it doesn’t build models.' },
      ],
      explanation: 'For tabular data — rows of examples with columns of features — start with pandas to load and clean it and scikit-learn (or a gradient-boosting library) to model it. Deep learning is usually overkill for this kind of data.',
    },
    {
      kind: 'concept',
      title: 'NumPy, pandas and scikit-learn',
      blocks: [
        {
          type: 'p',
          text: '**NumPy** replaces Python loops over numbers with whole-array operations that run in C. Updating every particle in a simulation becomes one line:',
        },
        {
          type: 'code',
          title: 'particles.py',
          desktopOnly: true,
          code: 'import numpy as np\n\npositions = np.array([[0.0, 0.0], [5.0, 2.0], [3.0, -1.0]])\nvelocities = np.array([[1.0, 0.5], [-2.0, 0.0], [0.0, 3.0]])\ndt = 0.5\n\npositions += velocities * dt   # every particle at once\nprint(positions)',
          output: '[[0.5  0.25]\n [4.   2.  ]\n [3.   0.5 ]]',
          annotations: [
            { lines: '3-4', text: '3×2 arrays: one row per particle, columns x and y.' },
            { lines: 7, text: 'No loop: NumPy multiplies and adds element by element in compiled code. With a million particles this is hundreds of times faster than a Python loop. NumPy lessons later in this course run right in the app.' },
          ],
        },
        {
          type: 'p',
          text: '**scikit-learn** gives every model the same three-step API — create, `fit`, `predict` — so swapping a decision tree for a random forest is a one-line change:',
        },
        {
          type: 'code',
          title: 'churn.py',
          desktopOnly: true,
          code: 'from sklearn.tree import DecisionTreeClassifier\n\nX = [[1, 300], [2, 250], [8, 40], [9, 20], [3, 200], [7, 60]]  # [deaths, damage dealt]\ny = ["good", "good", "bad", "bad", "good", "bad"]               # labels\n\nmodel = DecisionTreeClassifier(random_state=0).fit(X, y)\nprint(model.predict([[2, 280], [10, 15]]))',
          output: "['good' 'bad']",
          annotations: [
            { lines: '3-4', text: 'Convention: `X` holds the features (one row per example), `y` the labels.' },
            { lines: 6, text: '`fit` learns from the data. `random_state` makes the result reproducible.' },
            { lines: 7, text: '`predict` answers for new examples.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          text: 'The convention `import numpy as np` (and `import pandas as pd`, `import matplotlib.pyplot as plt`) is universal. Follow it — every tutorial, Stack Overflow answer and colleague expects those names.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Deep learning frameworks',
      blocks: [
        {
          type: 'p',
          text: 'A deep-learning framework does three jobs: store numbers in **tensors** that can live on a [[gpu|GPU]], compute **gradients automatically** for any calculation you write, and provide **building blocks** — layers, loss functions, optimizers.',
        },
        {
          type: 'table',
          headers: ['Framework', 'Backed by', 'Known for'],
          rows: [
            ['**PyTorch**', 'Meta, now the PyTorch Foundation', 'Feels like ordinary Python; dominant in research, widely used in industry and RL. This course’s main framework.'],
            ['**JAX**', 'Google', 'NumPy-like functional API with powerful compilation; popular for large-scale research'],
            ['**TensorFlow / Keras**', 'Google', 'Mature production tooling; Keras 3 can run on TensorFlow, JAX or PyTorch backends'],
          ],
        },
        {
          type: 'code',
          title: 'first_tensor.py',
          desktopOnly: true,
          code: 'import torch\n\nx = torch.tensor([[1.0, 2.0], [3.0, 4.0]])\nprint(x * 2)\nprint(x.sum().item())\n\ndevice = "cuda" if torch.cuda.is_available() else "cpu"\nx = x.to(device)   # move the tensor to the GPU if there is one',
          output: 'tensor([[2., 4.],\n        [6., 8.]])\n10.0',
          annotations: [
            { lines: 3, text: 'A 2×2 tensor — PyTorch’s version of a NumPy array.' },
            { lines: 5, text: '`.item()` turns a one-element tensor into a plain Python number.' },
            { lines: '7-8', text: 'The one-line pattern you’ll write in every PyTorch program: use the GPU when available.' },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'PyTorch can’t run inside this app (it needs native code and, ideally, your GPU), so PyTorch examples are marked **Run on your PC**. The concepts behind them — gradients, training loops, even a whole neural network — are taught first in pure Python and NumPy, which do run here.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'A batch of 64 color images, each 224 × 224 pixels with 3 color channels, is stored as a tensor of shape `(64, 3, 224, 224)`. How many numbers does the tensor hold?',
      answer: '9633792',
      answerTex: '9{,}633{,}792',
      hint: 'Multiply the sizes of all four dimensions.',
      explanation: '$64 \\times 3 \\times 224 \\times 224 = 9{,}633{,}792$ numbers. At 4 bytes each (`float32`) that’s about 38.5 MB for one batch — which is why GPU memory, batch size and number precision matter so much in deep learning.',
      label: 'Elements:',
    },
    {
      kind: 'concept',
      title: 'Reinforcement learning and game AI',
      blocks: [
        {
          type: 'p',
          text: 'Reinforcement learning needs two things: an **environment** (the game) and an **algorithm** (the learner). The ecosystem standardizes the connection between them:',
        },
        {
          type: 'list',
          items: [
            '**Gymnasium** (from the Farama Foundation, successor to OpenAI Gym) defines the standard environment API: `reset()` starts an episode, `step(action)` returns the next observation, the [[reward]] and whether the episode ended. It ships classic tasks like CartPole and LunarLander.',
            '**Stable-Baselines3** provides reliable PyTorch implementations of algorithms like PPO, DQN and SAC that work with any Gymnasium environment.',
            '**PettingZoo** extends the API to multiple agents; **Unity ML-Agents** connects Unity games to Python trainers.',
            '**RLGym** is a framework for Rocket League bots. It uses **RocketSim**, a re-implementation of Rocket League’s physics, so bots can practice thousands of times faster than real time without the game running. Its companion **RLGym-PPO** trains them.',
          ],
        },
        {
          type: 'code',
          title: 'cartpole_ppo.py',
          desktopOnly: true,
          code: 'import gymnasium as gym\nfrom stable_baselines3 import PPO\n\nenv = gym.make("CartPole-v1")\nmodel = PPO("MlpPolicy", env, verbose=0)\nmodel.learn(total_timesteps=50_000)        # train\n\nobs, info = env.reset(seed=42)\nfor _ in range(500):\n    action, _ = model.predict(obs, deterministic=True)\n    obs, reward, terminated, truncated, info = env.step(action)\n    if terminated or truncated:\n        obs, info = env.reset()\nenv.close()',
          annotations: [
            { lines: 4, text: 'CartPole: balance a pole on a moving cart. The "hello world" of RL.' },
            { lines: '5-6', text: 'Three lines to train a PPO agent with a small neural network policy.' },
            { lines: '8-13', text: 'The standard Gymnasium loop: the agent picks an action from the observation, the environment steps. Every RL environment in this course — including RLGym — follows this shape.' },
          ],
        },
        {
          type: 'code',
          lang: 'shell',
          title: 'Installing RLGym (from its quick-start guide)',
          code: 'pip install rlgym[rl-sim]\npip install git+https://github.com/AechPro/rlgym-ppo',
          annotations: [
            { lines: 1, text: 'RLGym with the RocketSim engine.' },
            { lines: 2, text: 'RLGym-PPO, the learner most Rocket League bot projects start from. You’ll set this up properly in the AI for Games unit.' },
          ],
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'To train a Rocket League bot with RLGym, you must run the actual Rocket League game in real time for every training match.',
      answer: false,
      explanation: 'False. RLGym’s recommended setup uses **RocketSim**, a standalone simulation of Rocket League’s physics, so many matches can run in parallel, much faster than real time, without the game. You only need the real game to watch or play against the finished bot.',
    },
    {
      kind: 'concept',
      title: 'Language models, notebooks and deployment',
      blocks: [
        {
          type: 'p',
          text: '**Hugging Face** hosts hundreds of thousands of pretrained models and datasets, and its `transformers` library loads them in a couple of lines. For the largest language models you’ll often call a hosted API instead, through a provider’s Python SDK.',
        },
        {
          type: 'code',
          title: 'sentiment.py',
          desktopOnly: true,
          code: 'from transformers import pipeline\n\nclassifier = pipeline("sentiment-analysis")\nprint(classifier("This boss fight is amazing!"))',
          output: "[{'label': 'POSITIVE', 'score': 0.9998}]",
          annotations: [
            { lines: 3, text: 'Downloads a small pretrained model the first time. The exact score varies slightly with the model version.' },
          ],
        },
        {
          type: 'p',
          text: 'Around the libraries sit the tools of the trade:',
        },
        {
          type: 'list',
          items: [
            '**[[jupyter|Jupyter notebooks]]** (in VS Code, JupyterLab or Google Colab’s free cloud GPUs) for exploring data and prototyping.',
            '**TensorBoard** and **Weights & Biases** for watching training curves.',
            '**ONNX** — an open file format for trained models. Export from PyTorch, then run the model with ONNX Runtime from C++, C#, Python or JavaScript, or inside game engines: Unity’s inference engine and Unreal’s Neural Network Engine (NNE) both load ONNX models.',
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Train in Python, ship in the engine',
          text: 'This is the pipeline that matters for a game programmer: prototype and train in Python, export to ONNX, and run inference every frame from the engine’s C++ or C# code. Python never ships with the game — only the trained model does.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'A little helper maps tasks to libraries. What does it print?',
      code: 'stack = {\n    "arrays": "NumPy",\n    "tables": "pandas",\n    "classic ML": "scikit-learn",\n    "deep learning": "PyTorch",\n    "RL environments": "Gymnasium",\n}\nfor task in ["tables", "deep learning", "deployment"]:\n    print(task, "->", stack.get(task, "ONNX"))',
      answer: 'tables -> pandas\ndeep learning -> PyTorch\ndeployment -> ONNX',
      hint: '`dict.get(key, default)` returns the default when the key isn’t in the dictionary.',
      explanation: '"tables" and "deep learning" are keys in the dictionary, so `get` returns `pandas` and `PyTorch`. "deployment" isn’t a key, so `get` returns the default, `ONNX` — which also happens to be the right answer.',
    },
    {
      kind: 'code',
      prompt: 'A fully connected neural network has layers of sizes `[4, 16, 16, 2]`. Each connection between consecutive layers has `inputs × outputs` weights plus `outputs` biases. Compute the total number of parameters in `param_count` and print:\n\n```\nParameters: 386\n```',
      starter: 'layers = [4, 16, 16, 2]\n\nparam_count = 0\n# loop over consecutive pairs of layer sizes\n\nprint("Parameters:", param_count)\n',
      solution: 'layers = [4, 16, 16, 2]\n\nparam_count = 0\nfor n_in, n_out in zip(layers, layers[1:]):\n    param_count += n_in * n_out + n_out\n\nprint("Parameters:", param_count)\n',
      tests: 'assert param_count == 386, f"Expected 386 parameters, got {param_count}"',
      expectOutput: 'Parameters: 386',
      checks: ['Adds `inputs × outputs + outputs` for each pair of consecutive layers'],
      hint: '`zip(layers, layers[1:])` gives the pairs (4, 16), (16, 16), (16, 2).',
      explanation: '$(4 \\times 16 + 16) + (16 \\times 16 + 16) + (16 \\times 2 + 2) = 80 + 272 + 34 = 386$. PyTorch reports the same number with `sum(p.numel() for p in model.parameters())`. The bots you’ll train have a few thousand to a few million parameters; large language models have billions.',
    },
    {
      kind: 'fill',
      prompt: 'Choose the library for each job.',
      template: 'Load and clean a CSV of match stats: ___. Train a random forest on it: ___. Build and train a neural network on a GPU: ___. Provide a standard RL environment API: ___. Run a trained model inside a C++ game engine: ___.',
      blanks: [{ answers: ['pandas'] }, { answers: ['scikit-learn'] }, { answers: ['PyTorch'] }, { answers: ['Gymnasium'] }, { answers: ['ONNX Runtime'] }],
      wordBank: ['pandas', 'scikit-learn', 'PyTorch', 'Gymnasium', 'ONNX Runtime', 'matplotlib'],
      explanation: 'pandas for tables, scikit-learn for classic models, PyTorch for neural networks on GPUs, Gymnasium for the environment API, and ONNX Runtime (or an engine’s own ONNX-based runtime) for running the trained model in your game. matplotlib would draw the charts along the way.',
    },
  ],
  takeaways: [
    'The stack: NumPy (arrays) → pandas/matplotlib (data, plots) → scikit-learn (classic ML) → PyTorch/JAX/TensorFlow (deep learning) → domain libraries → deployment (ONNX).',
    'NumPy arrays are the shared currency; vectorized operations run in C instead of Python loops.',
    'scikit-learn models share `fit`/`predict`; PyTorch provides GPU tensors, automatic gradients and layers.',
    'Gymnasium defines `reset`/`step`; Stable-Baselines3 provides PPO and friends; RLGym trains Rocket League bots with the RocketSim simulator and RLGym-PPO.',
    'Hugging Face supplies pretrained models; notebooks, TensorBoard and W&B support experiments.',
    'Game pipeline: train in Python, export to ONNX, run inference in the engine (Unity, Unreal NNE, ONNX Runtime).',
  ],
  reading: [
    { title: 'NumPy: the absolute basics for beginners', url: 'https://numpy.org/doc/stable/user/absolute_beginners.html', source: 'docs', note: 'The official gentle introduction to arrays.' },
    { title: 'scikit-learn: Getting Started', url: 'https://scikit-learn.org/stable/getting_started.html', source: 'docs', note: 'The fit/predict API, pipelines and evaluation in a few pages.' },
    { title: 'PyTorch: Learn the Basics', url: 'https://docs.pytorch.org/tutorials/beginner/basics/intro.html', source: 'tutorial', note: 'The official step-by-step PyTorch tutorial.' },
    { title: 'Gymnasium documentation', url: 'https://gymnasium.farama.org/', source: 'docs', note: 'The standard RL environment API and its built-in environments.' },
    { title: 'RLGym documentation', url: 'https://rlgym.org/', source: 'docs', note: 'Quick start and guides for building and training Rocket League bots.' },
    { title: 'ONNX', url: 'https://onnx.ai/', source: 'docs', note: 'The open model format used to move models from Python into engines and apps.' },
  ],
};
