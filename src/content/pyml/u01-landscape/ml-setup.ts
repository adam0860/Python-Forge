import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-setup',
  title: 'Setting Up: GPUs, CUDA, Notebooks and Environments',
  summary: 'Get a machine-learning workstation running: what hardware you need, a clean project environment, PyTorch with CUDA on Windows, notebooks, reproducible random seeds — and fixes for the classic setup errors.',
  minutes: 16,
  objectives: [
    'Decide what hardware a project needs and check your NVIDIA GPU with `nvidia-smi`',
    'Create an isolated project environment and pin package versions',
    'Install PyTorch with the right CUDA build and verify that the GPU is used',
    'Use Jupyter notebooks in VS Code (and Colab) and know when to prefer scripts',
    'Make experiments reproducible with random seeds',
    'Diagnose common problems: CPU-only builds, version mismatches, out-of-memory errors and Windows multiprocessing',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Hardware: what you actually need',
      blocks: [
        {
          type: 'p',
          text: 'Everything in the first half of this course — NumPy, pandas, scikit-learn, small neural networks — runs comfortably on any modern laptop CPU, and much of it right inside this app. A **[[gpu|GPU]]** starts to matter when you train neural networks on images or text, or run reinforcement learning for hours.',
        },
        {
          type: 'table',
          headers: ['Hardware', 'Deep-learning support', 'Notes'],
          rows: [
            ['**NVIDIA GPU** (GeForce RTX etc.)', 'Best: [[cuda|CUDA]] on Windows and Linux', 'The standard. VRAM (GPU memory) limits model and batch size: 8 GB is workable, 12–16 GB+ is comfortable.'],
            ['**AMD GPU**', 'ROCm, mainly on Linux', 'Works with PyTorch’s ROCm builds on supported cards; check the compatibility list.'],
            ['**Apple Silicon**', '"MPS" backend on macOS', 'Good for learning and small models.'],
            ['**CPU only**', 'Always works', 'Fine for classic ML and small networks; RL simulation itself is often CPU-bound anyway.'],
            ['**Cloud** (Google Colab, Kaggle)', 'Free and paid GPUs in the browser', 'Great when your own machine has no suitable GPU.'],
          ],
        },
        {
          type: 'code',
          lang: 'shell',
          title: 'PowerShell — check your NVIDIA GPU',
          code: 'nvidia-smi',
          output: '+---------------------------------------------------------------------------+\n| NVIDIA-SMI 5xx.xx      Driver Version: 5xx.xx      CUDA Version: 12.x      |\n|   GPU  Name                     | Memory-Usage           | GPU-Util        |\n|   0    NVIDIA GeForce RTX ....  |  1024MiB / 12288MiB    |      3%         |\n+---------------------------------------------------------------------------+',
          annotations: [
            { lines: 1, text: '`nvidia-smi` ships with the NVIDIA driver. It shows your GPU, the driver version, the **highest CUDA version the driver supports**, memory use and utilization — keep it open while training to watch the GPU work. (Output trimmed and anonymized.)' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why do GPUs matter so much?',
          text: 'Training a neural network is mostly multiplying large matrices. A CPU has a handful of powerful cores; a GPU has thousands of simpler ones designed to do the same arithmetic on many numbers at once — exactly what a game does when it shades millions of pixels. For big matrix math, that’s often a 10–100× speed-up.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In PyTorch, which device name sends tensors to an NVIDIA GPU?',
      options: [
        { text: '`"gpu"`', why: 'Not a valid PyTorch device type — you’d get an error.' },
        { text: '`"cuda"`', correct: true, why: 'Right. `"cuda"` (or `"cuda:0"` for the first GPU) — named after NVIDIA’s CUDA platform. AMD’s ROCm builds reuse the same name.' },
        { text: '`"nvidia"`', why: 'Not a PyTorch device type.' },
        { text: '`"mps"`', why: '`"mps"` is Apple Silicon’s backend, not NVIDIA.' },
      ],
      explanation: 'PyTorch device strings are `"cpu"`, `"cuda"` (NVIDIA, and AMD via ROCm) and `"mps"` (Apple). The idiom `device = "cuda" if torch.cuda.is_available() else "cpu"` makes code run anywhere.',
    },
    {
      kind: 'concept',
      title: 'A clean environment per project',
      blocks: [
        {
          type: 'p',
          text: 'ML projects depend on many packages whose versions must agree — PyTorch with torchvision, Gymnasium with Stable-Baselines3, RLGym with its learner. Give every project its own [[virtual-environment|virtual environment]] and record exactly what’s installed.',
        },
        {
          type: 'code',
          lang: 'shell',
          title: 'PowerShell — a new project',
          code: 'mkdir rl-bot; cd rl-bot\npy list                          # which Pythons are installed?\npy -3.13 -m venv .venv           # use a version PyTorch supports\n.venv\\Scripts\\Activate.ps1\npython -m pip install --upgrade pip\npython -m pip install numpy pandas matplotlib scikit-learn jupyter\npython -m pip freeze > requirements.txt',
          annotations: [
            { lines: 3, text: 'New Python releases arrive every October; PyTorch adds support a little later. Check the "Python" note on pytorch.org’s install page and create the environment with a supported version.' },
            { lines: 7, text: '`pip freeze` writes every installed package with its exact version. Anyone (including future you) can recreate the environment with `pip install -r requirements.txt`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Or use uv',
          text: '`uv init rl-bot`, `uv add numpy pandas scikit-learn` and `uv run train.py` create the environment, record dependencies in `pyproject.toml` with a lock file, and run your script — and they’re very fast. uv can also install the Python version you ask for.',
        },
      ],
    },
    {
      kind: 'order',
      prompt: 'Put the steps for setting up a new ML project in order.',
      lines: [
        'Create a project folder',
        'Create a virtual environment with a Python version PyTorch supports',
        'Activate the environment',
        'Install PyTorch using the command from pytorch.org',
        'Verify that `torch.cuda.is_available()` is `True`',
        'Record the versions with `pip freeze > requirements.txt`',
      ],
      explanation: 'Folder → environment (with a supported Python) → activate → install PyTorch with the right CUDA build → verify the GPU → record exact versions. Verifying *before* writing any training code saves hours of wondering why training is slow.',
    },
    {
      kind: 'concept',
      title: 'Installing PyTorch with CUDA',
      blocks: [
        {
          type: 'p',
          text: 'PyTorch is published in several builds — CPU-only and one per supported CUDA version. Go to **pytorch.org → Get Started**, choose *Stable*, your OS, *Pip*, *Python* and a CUDA version, and run the command it shows. On Windows it looks like this (the `cuXXX` tag changes over time — copy the selector’s):',
        },
        {
          type: 'code',
          lang: 'shell',
          title: 'PowerShell (inside the activated environment)',
          code: 'python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128',
          annotations: [
            { lines: 1, text: '`--index-url` points pip at PyTorch’s own package server, where the CUDA builds live. The CUDA runtime is bundled — you need an up-to-date NVIDIA driver, but not a separate CUDA Toolkit install.' },
          ],
        },
        {
          type: 'code',
          title: 'check_gpu.py',
          desktopOnly: true,
          code: 'import torch\n\nprint("PyTorch", torch.__version__)\nprint("CUDA available:", torch.cuda.is_available())\nif torch.cuda.is_available():\n    print("GPU:", torch.cuda.get_device_name(0))\n    a = torch.randn(4096, 4096, device="cuda")\n    b = torch.randn(4096, 4096, device="cuda")\n    c = a @ b                  # a big matrix multiply on the GPU\n    torch.cuda.synchronize()   # wait for the GPU to finish\n    print("Result shape:", tuple(c.shape))',
          output: 'PyTorch 2.x.x+cu128\nCUDA available: True\nGPU: NVIDIA GeForce RTX ....\nResult shape: (4096, 4096)',
          outputVaries: true,
          annotations: [
            { lines: 3, text: 'A version ending in `+cu…` is a CUDA build; `+cpu` means you installed the CPU-only build.' },
            { lines: '7-8', text: '`device="cuda"` creates the tensors directly in GPU memory.' },
            { lines: 9, text: '`@` is matrix multiplication — about 137 billion floating-point operations here, finished in a fraction of a second on a modern GPU.' },
            { lines: 10, text: 'GPU work runs asynchronously; `synchronize` waits for it (important when timing code).' },
          ],
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'On Windows, a plain `pip install torch` (without PyTorch’s `--index-url`) is guaranteed to give you GPU support.',
      answer: false,
      explanation: 'False. The default package you get from PyPI may be a CPU-only build, depending on the platform — on Windows it historically has been. Use the exact command from pytorch.org’s selector, and confirm with `torch.cuda.is_available()` and a `torch.__version__` that ends in `+cu…`.',
    },
    {
      kind: 'concept',
      title: 'Notebooks and scripts',
      blocks: [
        {
          type: 'p',
          text: 'A **[[jupyter|Jupyter notebook]]** lets you run code a cell at a time, keep data in memory between cells, and see tables and charts inline. That’s ideal for exploring a dataset or trying ideas. In VS Code: install the Jupyter extension, `pip install ipykernel` in your environment, open a `.ipynb` file and pick your `.venv` as the kernel.',
        },
        {
          type: 'compare',
          left: {
            title: 'Notebooks are great for…',
            tone: 'good',
            text: 'Exploring data, plotting, quick experiments, teaching, sharing results with explanations.',
          },
          right: {
            title: 'Scripts are better for…',
            tone: 'good',
            text: 'Long training runs, code you’ll reuse or test, version control, multiprocessing (which RL trainers use heavily).',
          },
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Hidden state',
          text: 'Notebook cells can run in any order, so a notebook can work on your screen and fail for everyone else. Before trusting results, use *Restart and Run All*. Move code that works into `.py` modules and import it.',
        },
        {
          type: 'p',
          text: 'Training involves randomness everywhere — initial weights, data shuffling, exploration in RL. To make a run **reproducible**, set the random seeds:',
        },
        {
          type: 'code',
          title: 'seeds.py',
          desktopOnly: true,
          code: 'import random\nimport numpy as np\nimport torch\n\nSEED = 42\nrandom.seed(SEED)\nnp.random.seed(SEED)\ntorch.manual_seed(SEED)   # also seeds every CUDA device',
          annotations: [
            { lines: '6-8', text: 'Each library has its own random number generator, so seed all three. (Some GPU operations are still slightly nondeterministic; PyTorch’s reproducibility notes explain how to lock those down too.)' },
          ],
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'What does this print?',
      code: 'import random\nrandom.seed(7)\na = [random.randint(1, 6) for _ in range(5)]\nrandom.seed(7)\nb = [random.randint(1, 6) for _ in range(5)]\nrandom.seed(8)\nc = [random.randint(1, 6) for _ in range(5)]\nprint(a == b, a == c)',
      answer: 'True False',
      hint: 'A seeded random generator produces the same sequence every time it is given the same seed.',
      explanation: 'Seeding with 7 twice replays exactly the same "random" sequence, so `a == b` is `True`. A different seed (8) gives a different sequence, so `a == c` is `False`. Pseudo-random generators are deterministic given their seed — the basis of reproducible experiments.',
    },
    {
      kind: 'concept',
      title: 'Troubleshooting the classic problems',
      blocks: [
        {
          type: 'table',
          headers: ['Symptom', 'Likely cause', 'Fix'],
          rows: [
            ['`torch.cuda.is_available()` is `False`', 'CPU-only build installed, or an outdated NVIDIA driver', 'Reinstall with the pytorch.org command; update the driver'],
            ['`RuntimeError: CUDA out of memory`', 'Batch or model too large for your VRAM', 'Lower the batch size, use a smaller model or mixed precision; close other GPU programs'],
            ['Errors importing torchvision or similar', 'Mismatched versions of PyTorch libraries', 'Install them together from the same index URL'],
            ['`Expected all tensors to be on the same device`', 'One tensor on the GPU, another on the CPU', 'Move model *and* data with `.to(device)`'],
            ['A multiprocessing trainer crashes or restarts itself on Windows', 'Windows starts worker processes by re-importing your script', 'Put the training code under `if __name__ == "__main__":`'],
          ],
          caption: 'The last one bites almost everyone running RL trainers such as RLGym-PPO on Windows.',
        },
        {
          type: 'code',
          title: 'train.py',
          desktopOnly: true,
          code: 'def main():\n    # build environments, the learner, and start training here\n    ...\n\n\nif __name__ == "__main__":\n    main()',
          annotations: [
            { lines: '6-7', text: 'When a module is run as a script, `__name__` is `"__main__"`. When Windows worker processes import the file, it isn’t — so they don’t start training all over again.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'Get into the habit of printing your environment at the top of every training run — Python, PyTorch, CUDA and GPU name. When a result can’t be reproduced months later, that header is the first thing you’ll check.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This setup check crashes with `RuntimeError: Expected one of cpu, cuda, … device type at start of device string: gpu`. Tap the buggy line.',
      lines: ['import torch', 'use_gpu = torch.cuda.is_available()', 'device = "gpu" if use_gpu else "cpu"', 'x = torch.ones(3, device=device)', 'print(x.device)'],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'PyTorch doesn’t know a device called `"gpu"`; NVIDIA GPUs are `"cuda"`. Line 3 should be `device = "cuda" if use_gpu else "cpu"`.',
    },
    {
      kind: 'code',
      prompt: 'Write a function `pick_device(cuda_available, mps_available)` that returns the best device string: `"cuda"` if CUDA is available, otherwise `"mps"` if Apple’s MPS is available, otherwise `"cpu"`. The starter prints three test cases; the output should be:\n\n```\ncuda\nmps\ncpu\n```',
      starter: 'def pick_device(cuda_available, mps_available):\n    return "cpu"  # fix me\n\n\nprint(pick_device(True, False))\nprint(pick_device(False, True))\nprint(pick_device(False, False))\n',
      solution: 'def pick_device(cuda_available, mps_available):\n    if cuda_available:\n        return "cuda"\n    if mps_available:\n        return "mps"\n    return "cpu"\n\n\nprint(pick_device(True, False))\nprint(pick_device(False, True))\nprint(pick_device(False, False))\n',
      tests: 'assert pick_device(True, True) == "cuda", "CUDA should win when both are available"\nassert pick_device(True, False) == "cuda"\nassert pick_device(False, True) == "mps"\nassert pick_device(False, False) == "cpu"',
      expectOutput: 'cuda\nmps\ncpu',
      checks: ['Prefers CUDA, then MPS, then CPU', 'Returns the device name as a string'],
      hint: 'Check the options in order of preference and `return` as soon as one is available.',
      explanation: 'Returning early in order of preference keeps the logic flat: CUDA first, then MPS, then the always-available CPU. In real code the arguments come from `torch.cuda.is_available()` and `torch.backends.mps.is_available()`. A one-liner works too: `return "cuda" if cuda_available else "mps" if mps_available else "cpu"`.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the commands and code.',
      template: 'Check the GPU and driver: ___. Save exact package versions: pip ___ > requirements.txt. Make PyTorch’s randomness repeatable: torch.___(42).',
      blanks: [{ answers: ['nvidia-smi'] }, { answers: ['freeze'] }, { answers: ['manual_seed'] }],
      wordBank: ['nvidia-smi', 'freeze', 'manual_seed', 'list', 'seed', 'cuda'],
      explanation: '`nvidia-smi` reports the GPU, driver and supported CUDA version. `pip freeze` lists installed packages with exact versions. `torch.manual_seed(42)` seeds PyTorch’s generators (CPU and CUDA); Python’s `random` and NumPy have their own `seed` functions.',
    },
  ],
  takeaways: [
    'CPUs handle classic ML and small networks; an NVIDIA GPU with CUDA is the standard for deep learning (AMD via ROCm on Linux, Apple via MPS). VRAM limits model and batch size. `nvidia-smi` shows the GPU.',
    'One virtual environment per project, with a Python version PyTorch supports; record versions with `pip freeze` (or use uv’s lock file).',
    'Install PyTorch with the exact command from pytorch.org (with `--index-url` for CUDA builds) and verify with `torch.cuda.is_available()`.',
    'Notebooks for exploration, scripts for training and reuse; beware hidden notebook state.',
    'Seed `random`, NumPy and PyTorch for reproducible runs.',
    'Classic fixes: reinstall the CUDA build, lower the batch size, keep model and data on the same device, and guard training code with `if __name__ == "__main__":` on Windows.',
  ],
  reading: [
    { title: 'PyTorch: Start Locally', url: 'https://pytorch.org/get-started/locally/', source: 'docs', note: 'The install selector — always use its command for your OS and CUDA version.' },
    { title: 'PyTorch: Reproducibility', url: 'https://docs.pytorch.org/docs/stable/notes/randomness.html', source: 'docs', note: 'Everything that affects determinism, and how to control it.' },
    { title: 'Jupyter Notebooks in VS Code', url: 'https://code.visualstudio.com/docs/datascience/jupyter-notebooks', source: 'docs', note: 'Kernels, variables, plots and debugging notebooks in VS Code.' },
    { title: 'Google Colab', url: 'https://colab.research.google.com/', source: 'other', note: 'Free notebooks with GPUs in the browser — handy if your PC lacks a suitable GPU.' },
    { title: 'multiprocessing — the spawn start method', url: 'https://docs.python.org/3/library/multiprocessing.html#contexts-and-start-methods', source: 'docs', note: 'Why Windows needs the `if __name__ == "__main__":` guard.' },
  ],
};
