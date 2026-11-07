import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-engine-deploy',
  title: 'Shipping the Bot: Running a Trained Policy in a Game',
  summary: 'A trained network is useless until it runs inside your game. Export it to ONNX, run it from C++ or C#, or skip every runtime and write the forward pass yourself, and learn the integration traps (observation parity, tick skip, frame budget) that make a bot behave differently in the engine than in training.',
  minutes: 27,
  objectives: [
    'Compare the main ways to run a trained policy inside a game or bot framework',
    'Export a PyTorch policy to ONNX, run it with onnxruntime and verify it matches the original',
    'Implement a network’s forward pass in plain NumPy and in C++ with no dependencies',
    'Keep observations, normalisation and action mapping identical between training and deployment',
    'Budget inference time per frame and test an integration with golden input and output files',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From a training script to a running game',
      blocks: [
        {
          type: 'p',
          text: 'Everything so far happened in a Python training environment with PyTorch, plenty of CPU cores and no deadline. A shipping game is the opposite: usually C++ or C#, no Python interpreter, a **frame budget** of 16.7 milliseconds at 60 frames per second shared with rendering, physics and audio, and players on ordinary hardware. *Deployment* is the engineering that bridges the two, and a surprising share of failed AI projects fail here: the bot that was brilliant in training plays strangely in the game because something subtle differs.',
        },
        {
          type: 'table',
          headers: ['Approach', 'How it works', 'Good for', 'Watch out for'],
          rows: [
            ['**Python process next to the game**', 'The game (or a bot framework) sends the state to a Python program over a socket or pipe, and gets actions back. Examples: RLBot for Rocket League, the Unity ML-Agents and Godot RL Agents training connections', 'Prototypes, research, offline bots, anything where Python may run beside the game', 'Latency of the round trip; you must ship Python; not possible on consoles or phones'],
            ['**ONNX plus a runtime**', 'Export the network to the open ONNX format; a runtime inside the game loads and runs it. Options: ONNX Runtime (C, C++, C#, Java and more), Unity’s Inference Engine (formerly Sentis), Unreal’s NNE plugin, Godot through C#', 'Most commercial uses; many engines support it directly', 'Operator support differs per runtime; model size; versioning'],
            ['**Hand-written inference**', 'Export the weights to a plain file and write the matrix multiplications yourself (a few dozen lines for an MLP)', 'Small policies, embedded or console targets, zero dependencies, full control', 'Easy to get subtly wrong: always test against the original'],
            ['**Distil to a simpler model**', 'Train a small student (or a decision tree) to copy the big policy', 'Tight budgets, explainability, tiny devices', 'Some loss of quality'],
          ],
          caption: 'Four ways to deploy a policy. For a small multilayer perceptron, hand-written inference is very often the simplest.',
        },
        {
          type: 'p',
          text: '**ONNX** (Open Neural Network Exchange) is the common currency. An `.onnx` file contains the network as a *graph of operators* (matrix multiply, add, ReLU…) plus the trained weights, and nothing else: no Python and no PyTorch classes. Any runtime that understands the operators can execute it. That also means an ONNX file does *not* contain your code for building observations or choosing actions from scores; that glue you re-implement in the engine. The program below exports a small policy, loads it with `onnxruntime` as a game would, and checks that the answers match PyTorch. It also shows the third option: copying the weights out and running the network with NumPy alone.',
        },
        {
          type: 'code',
          title: 'export_policy_to_onnx.py',
          lang: 'python',
          desktopOnly: true,
          code: `import contextlib
import io
import os
import tempfile

import numpy as np
import onnxruntime as ort
import torch
from torch import nn

# A stand-in for a trained policy: 8 observations -> 32 hidden units -> 5 action scores.
torch.manual_seed(0)
policy = nn.Sequential(nn.Linear(8, 32), nn.ReLU(), nn.Linear(32, 5))
policy.eval()

# 1. Export to ONNX. The exporter prints progress messages; we silence them.
path = os.path.join(tempfile.mkdtemp(), "policy.onnx")
with contextlib.redirect_stdout(io.StringIO()):
    torch.onnx.export(
        policy, (torch.zeros(1, 8),), path,
        input_names=["obs"], output_names=["scores"],
        dynamic_shapes=({0: torch.export.Dim("batch")},),
    )

# 2. Load it with onnxruntime, the way a game would, and compare with PyTorch.
session = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
obs = np.random.default_rng(1).normal(size=(100, 8)).astype(np.float32)
onnx_scores = session.run(["scores"], {"obs": obs})[0]
with torch.no_grad():
    torch_scores = policy(torch.from_numpy(obs)).numpy()
print("input:", session.get_inputs()[0].name, session.get_inputs()[0].shape)
print("onnxruntime == PyTorch:", np.allclose(onnx_scores, torch_scores, atol=1e-5))

# 3. Or skip every runtime: copy the weights out and run the network with NumPy alone.
w1, b1, w2, b2 = (p.detach().numpy() for p in policy.parameters())
numpy_scores = np.maximum(obs @ w1.T + b1, 0.0) @ w2.T + b2
print("NumPy == PyTorch:", np.allclose(numpy_scores, torch_scores, atol=1e-5))
print("same chosen actions:", bool((onnx_scores.argmax(1) == numpy_scores.argmax(1)).all()))
print("parameters:", sum(p.numel() for p in policy.parameters()))`,
          output: `input: obs ['batch', 8]
onnxruntime == PyTorch: True
NumPy == PyTorch: True
same chosen actions: True
parameters: 453`,
          annotations: [
            { lines: '11-14', text: 'A stand-in for a trained policy: 8 observation numbers in, 32 hidden units, 5 action scores out. `policy.eval()` switches off training-only behavior (dropout and the like), which you must do before exporting.' },
            { lines: '16-23', text: '`torch.onnx.export` traces the model with an example input and writes the file. `input_names` and `output_names` give the graph’s inputs and outputs stable names for the engine side. The `dynamic_shapes` argument marks the first dimension (the batch size) as variable, so the same file serves one agent or a hundred. The exporter prints progress messages, which we silence.' },
            { lines: '26-30', text: 'Load the file with `onnxruntime` exactly as a game would, run a batch of 100 random observations, and compute the same batch with PyTorch. Inputs must be `float32`.' },
            { lines: '31-32', text: 'The graph reports its input name and shape (`batch` is a symbolic size), and the two outputs agree to within 1e-5. **Always run this check**: it is the cheapest way to catch export problems.' },
            { lines: '35-37', text: 'Option three: a network is only matrix multiplications. `p.detach().numpy()` copies each weight out, and the forward pass is two lines. Note the `.T`: PyTorch stores a linear layer’s weight as (outputs, inputs).' },
            { lines: '38-39', text: 'The three implementations choose the same actions, and the network has 8×32+32 + 32×5+5 = 453 parameters. The whole model is under 2 KB of numbers.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Export the logits, not the sampling',
          text: 'Export the network up to the **scores** (logits), and do the action choice in your own code: `argmax` for the strongest play, or sampling from a softmax with a game-controlled random seed when you want variety. Sampling inside the exported graph makes results non-reproducible and can use operators that some runtimes lack.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You need to run a small policy network (two hidden layers of 64 units) in a C++ game for a console, where you cannot ship a Python interpreter or a large third-party runtime. Which approach fits best?',
      options: [
        { text: 'Export the weights to a binary file and write the matrix multiplications in C++ (a few dozen lines), after checking them against PyTorch', correct: true, why: 'For a small MLP this is simple, fast, dependency-free and portable to any target. The essential extra step is verifying it against the original outputs.' },
        { text: 'Embed the Python interpreter and PyTorch in the game', why: 'This brings a huge dependency, a big memory and size cost, and is unavailable or impractical on consoles.' },
        { text: 'Retrain the policy inside the game at runtime', why: 'Training needs far more compute than a frame budget allows, and it would make behavior unpredictable for players.' },
        { text: 'Send each observation to a cloud server running PyTorch', why: 'Network latency (tens of milliseconds) would blow the frame budget, and the game would break offline.' },
      ],
      explanation: 'Match the deployment method to the size of the model and the target platform. Small networks: write them yourself. Larger ones, or many model types: use ONNX with a runtime your engine supports.',
    },
    {
      kind: 'concept',
      title: 'Writing the forward pass yourself',
      blocks: [
        {
          type: 'p',
          text: 'A multilayer perceptron is nothing but repeated `x = W·x + b` followed by a non-linearity. That is so little code that for small policies the lightest deployment is to copy the weights into a file and implement the loop in your engine’s language. The NumPy program below shows the whole workflow: a network, its weights **saved to a single binary file** and loaded back, a forward pass that handles one observation or a batch of 1000, and a check that nothing changed on the round trip.',
        },
        {
          type: 'code',
          title: 'numpy_policy_inference.py',
          runnable: true,
          packages: ['numpy'],
          code: `import io

import numpy as np

# A small policy network: 6 observations -> 16 -> 16 -> 4 action scores.
rng = np.random.default_rng(0)
sizes = [6, 16, 16, 4]
weights = {}
for i in range(3):
    weights[f"w{i}"] = rng.normal(0, 0.5, size=(sizes[i], sizes[i + 1]))
    weights[f"b{i}"] = np.zeros(sizes[i + 1])

# "Ship" the weights: write them to a single binary file (kept in memory here) and load them back.
file = io.BytesIO()
np.savez(file, **weights)
file.seek(0)
loaded = dict(np.load(file))


def policy_scores(obs, params):
    """Forward pass: ReLU on the hidden layers, raw scores on the output layer."""
    x = obs
    for i in range(3):
        x = x @ params[f"w{i}"] + params[f"b{i}"]
        if i < 2:
            x = np.maximum(x, 0.0)
    return x


obs = np.array([0.5, -0.2, 0.1, 0.0, 1.0, -1.0])
scores = policy_scores(obs, loaded)
print("parameters:", sum(a.size for a in loaded.values()))
print("scores:", np.round(scores, 3))
print("chosen action:", int(np.argmax(scores)))
print("identical after save and load:", np.array_equal(scores, policy_scores(obs, weights)))

batch = np.tile(obs, (1000, 1))
print("a batch of 1000 observations gives", policy_scores(batch, loaded).shape, "scores")`,
          output: `parameters: 452
scores: [-0.905  0.223 -1.138 -1.251]
chosen action: 1
identical after save and load: True
a batch of 1000 observations gives (1000, 4) scores`,
          annotations: [
            { lines: '5-11', text: 'A network with 6 inputs, two hidden layers of 16 units and 4 outputs. The weights are random here; in a real project they come from training. A *seeded* generator makes the output reproducible.' },
            { lines: '13-17', text: '`np.savez` writes all the arrays into one file and `np.load` reads them back. In a real project this is your *shipping format*: a small binary file next to the game. (A BytesIO object stands in for the file.)' },
            { lines: '20-27', text: 'The forward pass: multiply by the weight matrix, add the bias, apply ReLU on every layer except the last. The last layer outputs raw **scores** (logits), and choosing an action is the caller’s job.' },
            { lines: '30-35', text: 'One observation gives four scores and the action is the index of the largest. The loaded weights give *exactly* the same numbers as the originals.' },
            { lines: '37-38', text: 'The same function handles a whole batch (1000 observations at once) because matrix multiplication broadcasts over the first dimension. Batching is how you evaluate many agents cheaply in one frame.' },
          ],
        },
        {
          type: 'p',
          text: 'The same forward pass in C++ is hardly longer. This program is a complete, dependency-free implementation of a 3 → 4 → 2 network: one `Dense` struct holding a weight matrix (stored row by row, one row per output neuron) and a bias, a `forward` method and a `main` that runs one observation. It prints exactly what NumPy prints for the same weights (verified by compiling both), which is how you should test any hand-written port.',
        },
        {
          type: 'code',
          title: 'mlp_forward.cpp',
          lang: 'cpp',
          desktopOnly: true,
          code: `#include <algorithm>
#include <cstdio>
#include <vector>

// One fully connected layer: out = W * in + b, with W stored row by row (one row per output).
struct Dense {
    int in, out;
    std::vector<float> w, b;

    std::vector<float> forward(const std::vector<float>& x, bool relu) const {
        std::vector<float> y(out);
        for (int o = 0; o < out; ++o) {
            float sum = b[o];
            for (int i = 0; i < in; ++i) sum += w[o * in + i] * x[i];
            y[o] = relu ? std::max(0.0f, sum) : sum;
        }
        return y;
    }
};

int main() {
    // A 3 -> 4 -> 2 network. In a real project these numbers are exported from PyTorch.
    Dense layer1{3, 4, {0.5f, -1.0f, 0.25f,  1.0f, 0.5f, -0.5f,  -0.25f, 0.75f, 1.0f,  0.1f, 0.2f, 0.3f},
                       {0.0f, 0.1f, -0.1f, 0.2f}};
    Dense layer2{4, 2, {1.0f, -1.0f, 0.5f, 0.25f,  -0.5f, 1.5f, 0.0f, 1.0f},
                       {0.05f, -0.05f}};

    std::vector<float> observation{1.0f, 2.0f, -1.0f};
    std::vector<float> hidden = layer1.forward(observation, true);
    std::vector<float> scores = layer2.forward(hidden, false);

    int best = static_cast<int>(std::max_element(scores.begin(), scores.end()) - scores.begin());
    std::printf("scores: %.4f %.4f\\n", scores[0], scores[1]);
    std::printf("chosen action: %d\\n", best);
    return 0;
}`,
          output: `scores: -2.3750 4.2500
chosen action: 1`,
          annotations: [
            { lines: '5-19', text: 'A fully connected layer: `w` holds `out × in` weights row by row, so row `o` (starting at `o * in`) belongs to output neuron `o`. The inner loop computes the dot product plus the bias, and ReLU is applied on request.' },
            { lines: '22-26', text: 'The two layers. In a real project the numbers come from the weight file exported from PyTorch (`policy.parameters()` in order, with PyTorch’s (outputs, inputs) layout, which is exactly the row-by-row order used here).' },
            { lines: '28-30', text: 'The forward pass: ReLU on the hidden layer, raw scores on the output layer.' },
            { lines: '32-34', text: '`std::max_element` returns the index of the best score. Both the scores and the chosen action are the same as in the NumPy version of this network.' },
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Performance notes for C++ programmers',
          text: 'A 2×64 MLP takes a few microseconds, so for most game bots plain loops are fast enough. If you evaluate hundreds of agents, store all observations in one contiguous array and run each layer as a single matrix–matrix product (a BLAS call or SIMD intrinsics); that turns many small matrix–vector products into one cache-friendly one. Use `float`, not `double`: it halves memory traffic and matches PyTorch’s default. Quantising weights to 16-bit floats or 8-bit integers can shrink and speed up larger networks further, at some cost in precision that you must test.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'An exported ONNX file contains the trained weights and the network graph, but not the code that turns the game state into the observation vector.',
      answer: true,
      explanation: 'True. ONNX stores only the computation graph and the parameters. The observation builder (which numbers, in which order, with which scaling and which team perspective) and the action mapping live in *your* code, and re-creating them exactly in the engine is where most deployment bugs come from.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the export call so the graph’s output is called "scores".',
      template: `torch.onnx.export(policy, (example,), path, input_names=["obs"], ___=["scores"])`,
      templateIsCode: true,
      blanks: [{ answers: ['output_names'] }],
      wordBank: ['output_names', 'input_names', 'dynamic_shapes', 'opset_version'],
      explanation: '`output_names` names the graph outputs (and `input_names` its inputs). Stable names matter because the engine looks up inputs and outputs by name: `session.run(["scores"], {"obs": obs})`.',
    },
    {
      kind: 'concept',
      title: 'Integration: where deployed bots go wrong',
      blocks: [
        {
          type: 'p',
          text: 'Once the network runs, the difficult part begins: making the engine feed it *exactly* what training fed it. A network is a brittle function of its input; a different order of two numbers, a missing scale factor or a mirrored axis produces plausible-looking but wrong behavior. The following checklist covers the usual culprits, in rough order of how often they bite.',
        },
        {
          type: 'table',
          headers: ['Mismatch', 'Symptom', 'Prevention'],
          rows: [
            ['**Observation order and scale**', 'The bot acts randomly or “drunk”', 'Generate the observation from one shared specification (a list of named fields with scale factors) and write a test'],
            ['**Normalisation statistics**', 'Works in training, fails in game', 'Ship the running mean and variance (or the fixed scale constants) *with* the weights and apply them in the engine'],
            ['**Team perspective and coordinates**', 'Plays well as blue, terribly as orange; left and right swapped', 'Apply the same mirroring as in training; confirm the engine’s axes and handedness match the simulator’s'],
            ['**Tick skip and timing**', 'Twitchy or sluggish control', 'Decide every N ticks and *hold* the action in between, exactly as the training environment did'],
            ['**Data types and shapes**', 'Runtime error, or silently wrong numbers', '`float32`, a batch dimension, the right layout; check shapes once at load time'],
            ['**Recurrent state**', 'A bot with memory (an LSTM) forgets or goes wrong', 'Carry the hidden state between decisions and reset it at the start of each episode'],
            ['**Stochastic versus greedy**', 'Different play style than in evaluation', 'Choose deliberately: sampling for variety, `argmax` for strength, and always seed it'],
            ['**Sim-to-real gap**', 'A bot that is great in the simulator is mediocre in the real game', 'Test in the real game early, add noise or randomised physics in training, and fine-tune against the real thing if possible'],
          ],
          caption: 'Integration mismatches. Each of them has ruined a project that “worked in training”.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why a "golden test" beats debugging by eye',
          text: 'Behavior is hard to judge: a bot with a subtly wrong input may still *look* intelligent for minutes. A **golden test** removes the guesswork: in Python, save 50 or so real observations together with the scores your network produced for them (`np.savez("golden.npz", obs=..., scores=...)`). In the engine, load the same observations, run your deployed model and assert that the scores match to a small tolerance. If they do not, the problem is in the export or the port; if they do and the bot still misbehaves, the problem is in how the *engine* builds observations, and you can test that part separately by logging the engine’s observation for a known situation and comparing it with what Python builds for the same state.',
        },
        {
          type: 'p',
          text: 'The last practical constraint is **time**. At 60 frames per second a frame lasts 1000/60 ≈ 16.7 ms, shared by everything the game does. An AI budget of one or two milliseconds is typical, so a policy that costs 0.05 ms per agent per decision allows a few dozen agents *per frame* if they all decide every frame. In practice you save budget in three ways: let agents decide only every few ticks (tick skip, which also matches training), stagger the decisions so that not all agents think in the same frame, and batch the agents so the work is done as one matrix product.',
        },
        {
          type: 'p',
          text: 'For Rocket League specifically, bots run offline through the **RLBot** framework: your Python agent is a separate process that receives the game state about 120 times per second and returns controller inputs. There you simply load the PyTorch or ONNX model in the agent, rebuild the observation with the same observation builder used in training, and apply the same tick skip. Do not use bots in online matches; that is against the game’s rules.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this two-layer forward pass written without libraries (weights are given one row per output neuron).',
      code: `def dense(x, weights, bias):
    return [sum(xi * w for xi, w in zip(x, row)) + b for row, b in zip(weights, bias)]

relu = lambda v: [max(0.0, a) for a in v]

h = relu(dense([1.0, 2.0], [[1.0, 0.5], [-1.0, 0.5]], [0.0, 1.0]))
print(h, dense(h, [[2.0, -1.0]], [0.5]))`,
      answer: '[2.0, 1.0] [3.5]',
      hint: 'First neuron: 1·1 + 2·0.5 + 0 = 2. Second: −1·1 + 2·0.5 + 1 = 1.',
      explanation: 'Hidden layer: neuron 1 = 1.0×1.0 + 2.0×0.5 + 0.0 = 2.0; neuron 2 = 1.0×(−1.0) + 2.0×0.5 + 1.0 = 1.0; ReLU leaves both unchanged, so `h = [2.0, 1.0]`. Output: 2.0×2.0 + 1.0×(−1.0) + 0.5 = 3.5, printed as the one-element list `[3.5]`. This is the entire computation a deployed MLP performs.',
    },
    {
      kind: 'error',
      prompt: 'This game-side code builds an observation and asks the exported model for scores. It raises an error about the input type and shape. Tap the faulty line.',
      lines: [
        'obs = np.array(build_obs(state))',
        'obs = obs / 2300.0',
        'scores = session.run(None, {"obs": obs})[0]',
        'action = int(np.argmax(scores))',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The model was exported with a `float32` input of shape `(batch, features)`, but `np.array(...)` produces `float64` values with only one dimension. Line 3 must pass `obs.astype(np.float32)[None, :]` (a batch of one). onnxruntime is strict about types and shapes, which is good: a loud error beats silently wrong scores.',
    },
    {
      kind: 'numeric',
      prompt: 'A frame at 60 FPS lasts 1000/60 ≈ 16.7 ms. You give the AI 10% of that, and one agent’s network evaluation takes 0.05 ms. How many agents can decide in one frame? Give a whole number (round down).',
      answer: '33',
      hint: '10% of 16.67 ms is 1.667 ms; divide by 0.05 ms.',
      explanation: '10% of 16.667 ms = 1.667 ms, and 1.667 / 0.05 = 33.3, so **33** agents can decide in a single frame. With a tick skip of 4 and staggered decisions you could run about four times as many agents without exceeding the budget.',
      label: 'Agents:',
    },
    {
      kind: 'concept',
      title: 'Building the deployment toolkit',
      blocks: [
        {
          type: 'p',
          text: 'The exercises below implement three building blocks that appear in almost every deployed bot: the **forward pass** for an arbitrary stack of layers, a **tick-skip action holder** that decides only every N ticks, and a **temperature softmax sampler** that turns scores into an action with a controllable amount of randomness.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Write the generic MLP forward pass with NumPy, the action holder for tick skip, and the softmax sampling function.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `mlp_forward(x, layers)` with NumPy. `layers` is a list of `(weights, bias)` pairs where `weights` has shape `(inputs, outputs)`. Apply `x @ weights + bias` for every layer, using **ReLU** (`np.maximum(z, 0)`) after every layer **except the last**. `x` may be a single vector of shape `(n,)` or a batch of shape `(m, n)`. Return the final array (the raw scores).',
      starter: `import numpy as np


def mlp_forward(x, layers):
    ...
`,
      solution: `import numpy as np


def mlp_forward(x, layers):
    x = np.asarray(x, dtype=float)
    for i, (weights, bias) in enumerate(layers):
        x = x @ np.asarray(weights, dtype=float) + np.asarray(bias, dtype=float)
        if i < len(layers) - 1:
            x = np.maximum(x, 0.0)
    return x
`,
      packages: ['numpy'],
      tests: `import numpy as np

W1 = np.array([[1.0, -1.0], [0.5, 0.5]])
b1 = np.array([0.0, 1.0])
W2 = np.array([[2.0], [-1.0]])
b2 = np.array([0.5])
layers = [(W1, b1), (W2, b2)]

out = mlp_forward(np.array([1.0, 2.0]), layers)
assert out.shape == (1,) and np.allclose(out, [3.5])

batch = np.array([[1.0, 2.0], [-1.0, -2.0], [0.0, 0.0]])
outs = mlp_forward(batch, layers)
assert outs.shape == (3, 1)
assert np.allclose(outs[0], [3.5])
assert np.allclose(outs[1], mlp_forward(batch[1], layers))
assert np.allclose(outs[2], [-0.5])

# a single linear layer has no ReLU
lin = mlp_forward([1.0, -2.0], [(np.array([[1.0], [1.0]]), np.array([0.0]))])
assert np.allclose(lin, [-1.0])

# the last layer must not apply ReLU, so negative scores survive
neg = mlp_forward([1.0], [(np.array([[1.0, 1.0]]), np.array([0.0, 0.0])), (np.array([[-1.0], [-1.0]]), np.array([0.0]))])
assert np.allclose(neg, [-2.0])

rng = np.random.default_rng(0)
layers3 = [(rng.normal(size=(6, 8)), rng.normal(size=8)), (rng.normal(size=(8, 8)), rng.normal(size=8)), (rng.normal(size=(8, 4)), rng.normal(size=4))]
x = rng.normal(size=6)
h = np.maximum(x @ layers3[0][0] + layers3[0][1], 0)
h = np.maximum(h @ layers3[1][0] + layers3[1][1], 0)
assert np.allclose(mlp_forward(x, layers3), h @ layers3[2][0] + layers3[2][1])
assert mlp_forward(rng.normal(size=(10, 6)), layers3).shape == (10, 4)
assert mlp_forward([0.0] * 6, layers3).shape == (4,)`,
      checks: ['Applies `x @ weights + bias` for each layer, with ReLU after every layer except the last', 'Works for a single observation `(n,)` and a batch `(m, n)` alike', 'Leaves the last layer’s output untouched, so negative scores survive'],
      hint: 'Loop with `for i, (weights, bias) in enumerate(layers)`: set `x = x @ weights + bias`, and apply `np.maximum(x, 0.0)` only `if i < len(layers) - 1`.',
      explanation: 'This is the whole network. The matrix product broadcasts over a leading batch dimension, so one function evaluates one agent or a thousand. Not applying ReLU on the last layer matters: the outputs are *scores*, and clipping negative ones to zero would make every “bad” action look equally bad. Compare your function against PyTorch on random inputs, as in the lesson, whenever you port a model.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `ActionHolder(skip, policy)` for tick skip. `policy` is a function from an observation to an action. The method `act(obs)` is called **every tick**: on call number 0, `skip`, `2*skip`, … it calls `policy(obs)`, stores the result and returns it; on all other calls it returns the stored action **without calling the policy**. `reset()` forgets the stored action and restarts the counter, so the next `act` call decides again.',
      starter: `class ActionHolder:
    def __init__(self, skip, policy):
        ...

    def act(self, obs):
        ...

    def reset(self):
        ...
`,
      solution: `class ActionHolder:
    def __init__(self, skip, policy):
        self.skip = skip
        self.policy = policy
        self.reset()

    def act(self, obs):
        if self.tick % self.skip == 0:
            self.action = self.policy(obs)
        self.tick += 1
        return self.action

    def reset(self):
        self.tick = 0
        self.action = None
`,
      tests: `calls = []


def policy(obs):
    calls.append(obs)
    return obs * 10


holder = ActionHolder(3, policy)
out = [holder.act(t) for t in range(7)]
assert out == [0, 0, 0, 30, 30, 30, 60]
assert calls == [0, 3, 6]

holder.reset()
assert holder.act(100) == 1000
assert calls == [0, 3, 6, 100]
assert holder.act(101) == 1000
assert holder.act(102) == 1000
assert holder.act(103) == 1030

calls.clear()
every = ActionHolder(1, policy)
assert [every.act(t) for t in range(4)] == [0, 10, 20, 30]
assert calls == [0, 1, 2, 3]

seen = []
h8 = ActionHolder(8, lambda o: seen.append(o) or len(seen))
for t in range(20):
    h8.act(t)
assert seen == [0, 8, 16]

two = ActionHolder(2, lambda o: "L" if o % 4 < 2 else "R")
assert [two.act(t) for t in range(8)] == ["L", "L", "R", "R", "L", "L", "R", "R"]`,
      checks: ['Calls the policy only on every `skip`-th call, starting with the first, and returns the held action in between', '`reset()` clears the held action and the counter so the next call decides again', 'Works for any `skip >= 1` and for any kind of action value'],
      hint: 'Keep a counter `tick` and a stored `action`. In `act`: if `tick % skip == 0`, call the policy; then increase the counter and return the stored action. `reset` sets the counter to 0 and the action to `None`.',
      explanation: 'This is exactly what the `RepeatAction` wrapper did in training, moved into the game: the network decides 15 times per second, while the engine asks for a controller state every tick (120 per second). Calling `reset()` at the start of each match (or after a respawn) makes the first tick of the new episode decide immediately instead of reusing a stale action.',
    },
    {
      kind: 'code',
      prompt: 'Write `sample_action(scores, u, temperature=1.0)`. `scores` is a list of action scores (logits) and `u` is a uniform random number in `[0, 1)` supplied by the caller. If `temperature` is `0`, return the index of the largest score (the first one in a tie). Otherwise compute a softmax of `score / temperature` (subtract the maximum first, for numerical stability), then return the first index whose **cumulative probability is greater than `u`** (inverse-CDF sampling). If rounding leaves nothing above `u`, return the last index.',
      starter: `import math


def sample_action(scores, u, temperature=1.0):
    ...
`,
      solution: `import math


def sample_action(scores, u, temperature=1.0):
    if temperature == 0:
        return scores.index(max(scores))
    top = max(scores)
    exps = [math.exp((s - top) / temperature) for s in scores]
    total = sum(exps)
    cumulative = 0.0
    for index, e in enumerate(exps):
        cumulative += e / total
        if cumulative > u:
            return index
    return len(scores) - 1
`,
      tests: `scores = [1.0, 2.0, 3.0]

assert sample_action(scores, 0.99, temperature=0) == 2
assert sample_action([5.0, 5.0, 1.0], 0.1, temperature=0) == 0

# probabilities of softmax([0, 0]) are 0.5 and 0.5
assert sample_action([0.0, 0.0], 0.0) == 0
assert sample_action([0.0, 0.0], 0.49) == 0
assert sample_action([0.0, 0.0], 0.5) == 1
assert sample_action([0.0, 0.0], 0.999) == 1

# softmax([1, 2, 3]) = 0.0900, 0.2447, 0.6652
assert sample_action(scores, 0.05) == 0
assert sample_action(scores, 0.10) == 1
assert sample_action(scores, 0.33) == 1
assert sample_action(scores, 0.34) == 2
assert sample_action(scores, 0.999999) == 2

# low temperature concentrates on the best action, high temperature spreads out
assert sample_action(scores, 0.9, temperature=0.05) == 2
assert sample_action(scores, 0.01, temperature=0.05) == 2
assert sample_action(scores, 0.5, temperature=100.0) == 1
assert sample_action(scores, 0.2, temperature=100.0) == 0

# huge scores must not overflow
assert sample_action([1000.0, 1001.0], 0.5) == 1
assert sample_action([-1000.0, -1000.0, -1000.0], 0.7) == 2

# frequencies follow the probabilities
import random
rng = random.Random(0)
picks = [sample_action([0.0, 1.0], rng.random()) for _ in range(5000)]
assert 0.70 < picks.count(1) / 5000 < 0.76
assert sample_action([2.0], 0.5) == 0`,
      checks: ['Returns the `argmax` (first index in a tie) when `temperature` is 0', 'Applies a numerically stable softmax with temperature and picks the first index whose cumulative probability exceeds `u`', 'Falls back to the last index if rounding leaves no index above `u`'],
      hint: 'Subtract `max(scores)` before `math.exp((s - top) / temperature)`, divide by the total to get probabilities, then walk through them adding to a running total until it exceeds `u`.',
      explanation: 'Taking `u` as an argument makes sampling deterministic and testable: the game owns the random number generator and its seed, so replays and tests reproduce exactly. Temperature controls style: close to 0 it is greedy (strongest play), 1.0 is the distribution the network learned, and higher values make the bot more erratic, which can be a useful difficulty or personality knob for NPCs.',
    },
  ],
  takeaways: [
    '**Deployment** is its own discipline: the game has no Python, a tight **frame budget** (16.7 ms at 60 FPS, of which the AI may get a millisecond or two) and ordinary hardware. The main routes are a Python process beside the game (RLBot, ML-Agents training), **ONNX** with a runtime (ONNX Runtime, Unity’s Inference Engine, Unreal NNE, Godot via C#), and **hand-written inference** for small networks.',
    '**ONNX** stores the operator graph and weights, nothing else. Export with `policy.eval()`, named inputs and outputs and a dynamic batch dimension, export the **logits** rather than a sampled action, and **verify** the result against PyTorch on random inputs before you trust it.',
    'An MLP is just `x @ W + b` with ReLU between layers. You can run it with NumPy, or in about 20 lines of dependency-free C++ (weights stored row by row, one row per output neuron), as long as you test it against the original.',
    'Most deployed bots fail on **parity**: observation order and scale, normalisation statistics (ship them with the weights), team mirroring, tick skip, `float32` and batch shapes, recurrent state, and greedy versus sampled actions. A **golden test** (saved observations and expected scores) catches export and port bugs mechanically.',
    'Budget time per frame: decide every N ticks and **hold** the action (tick skip, as in training), stagger agents, and batch them into one matrix product. For Rocket League use RLBot offline only, never in online matches.',
  ],
  reading: [
    { title: 'ONNX: Open Neural Network Exchange', url: 'https://onnx.ai', source: 'docs', note: 'The format specification, the operator list and the tooling.' },
    { title: 'ONNX Runtime documentation', url: 'https://onnxruntime.ai/docs/', source: 'docs', note: 'Running ONNX models from C, C++, C#, Python, Java and more.' },
    { title: 'PyTorch: torch.onnx export documentation', url: 'https://docs.pytorch.org/docs/stable/onnx.html', source: 'docs', note: 'How to export models, dynamic shapes and the current exporter.' },
    { title: 'Unity ML-Agents: Inference Engine', url: 'https://docs.unity3d.com/Packages/com.unity.ml-agents@4.0/manual/Inference-Engine.html', source: 'docs', note: 'How a trained ONNX brain runs inside a Unity game.' },
    { title: 'RLBot: write and run Rocket League bots', url: 'https://rlbot.org', source: 'docs', note: 'The offline framework that runs your bot in the real game.' },
  ],
};
