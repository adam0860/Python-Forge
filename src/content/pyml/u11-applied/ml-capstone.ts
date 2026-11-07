import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-capstone',
  title: 'Capstone: An End-to-End AI Project',
  summary: 'Run the whole workflow on one small game: frame the problem and build baselines first, train an agent, measure honestly whether it is better, export it to ONNX, serve it over HTTP and play games through the service, then see how each step scales to real projects like a Rocket League bot.',
  minutes: 32,
  objectives: [
    'Frame an AI project with a goal, a metric, a baseline and a stopping rule before training anything',
    'Build a fixed-seed evaluation harness and compare a hand-written rule, a random policy and a trained agent',
    'Explain why small test sets mislead, and compute a standard error to judge whether a difference is real',
    'Export a trained policy, check it against the original, and serve it behind a validated HTTP endpoint',
    'Map every step of the workflow to the lessons of this course and plan the next project',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Step 1: Frame the project and build the baselines first',
      blocks: [
        {
          type: 'p',
          text: 'Beginners start an AI project by training a model. Experienced engineers start by writing down *what success means* and *what is the cheapest thing that might already work*. This capstone uses the smallest game that still has every ingredient: **Catch**. A ball falls down a 7-column field, a paddle on the bottom row can move left, stay or right once per step, and at the moment the ball lands you score +1 if the paddle is underneath it and -1 if not. It is the environment from the custom environment lesson; here we run the full project around it.',
        },
        {
          type: 'table',
          headers: ['Question', 'Answer for this project', 'Why you write it down'],
          rows: [
            ['**Goal**', 'A policy that catches the ball', 'Keeps the project from drifting'],
            ['**Metric**', 'Win rate (share of games with a catch) over 300 fixed-seed games, with its standard error', 'Without a number you cannot tell progress from luck'],
            ['**Baselines**', 'Stay put, random moves, and a hand-written rule', 'The model must beat the cheapest alternatives to be worth shipping'],
            ['**Target**', 'At least 95 percent, and no worse than the best rule', 'A stopping rule: when you reach it, you are done'],
            ['**Budget**', 'Training under a few minutes on a laptop CPU; answers in under 10 ms', 'Constraints decide the method, not the other way round'],
            ['**Deployment**', 'An HTTP service that a game client can call', 'Decides the export format and the preprocessing you must ship'],
          ],
          caption: 'A one-page project brief. Filling in this table first takes ten minutes and prevents weeks of aimless training.',
        },
        {
          type: 'p',
          text: 'The program below is a complete evaluation harness in plain Python: a version of the game, an `evaluate` function with fixed seeds that reports the mean return, the win rate and the standard error, and three baselines. It runs right here in the app.',
        },
        {
          type: 'code',
          title: 'baselines.py',
          runnable: true,
          code: `import math
import random

WIDTH, HEIGHT = 7, 8


def play(policy, seed):
    """One game of Catch: +1 if the paddle is under the ball when it lands, otherwise -1."""
    rng = random.Random(seed)
    paddle, ball_x, ball_y = WIDTH // 2, rng.randrange(WIDTH), 0
    while True:
        action = policy(paddle, ball_x, ball_y)             # 0 = left, 1 = stay, 2 = right
        paddle = min(max(paddle + action - 1, 0), WIDTH - 1)
        ball_y += 1
        if ball_y == HEIGHT - 1:
            return 1 if paddle == ball_x else -1


def evaluate(policy, episodes=300, seed=1000):
    """Mean return, win rate and the standard error of the mean over many games with fixed seeds."""
    results = [play(policy, seed + i) for i in range(episodes)]
    mean = sum(results) / episodes
    variance = sum((r - mean) ** 2 for r in results) / (episodes - 1)
    return mean, results.count(1) / episodes, math.sqrt(variance / episodes)


def make_random_policy(seed):
    rng = random.Random(seed)
    return lambda paddle, ball_x, ball_y: rng.randrange(3)


def stay_put(paddle, ball_x, ball_y):
    return 1


def chaser(paddle, ball_x, ball_y):
    """Hand-written rule: step toward the ball's column."""
    return 0 if ball_x < paddle else 2 if ball_x > paddle else 1


for name, policy in [("stay put", stay_put), ("random", make_random_policy(0)), ("chaser", chaser)]:
    mean, wins, error = evaluate(policy)
    print(f"{name:9s} mean return {mean:+.2f} +/- {error:.2f}   win rate {wins:.0%}")`,
          output: `stay put  mean return -0.67 +/- 0.04   win rate 17%
random    mean return -0.70 +/- 0.04   win rate 15%
chaser    mean return +1.00 +/- 0.00   win rate 100%`,
          annotations: [
            { lines: '7-16', text: 'One game. The ball’s column comes from a random generator created from the game’s **seed**, so game number 1000 is the same game for every policy and on every run. The paddle moves by `action - 1` (so 0, 1, 2 mean left, stay, right) and is kept inside the field.' },
            { lines: '19-24', text: '`evaluate` plays `episodes` games with consecutive seeds, then computes the mean return, the win rate and the **standard error** of the mean: the sample standard deviation divided by the square root of the number of games. Fixed seeds make comparisons fair and repeatable.' },
            { lines: '27-29', text: 'A random policy with its own seeded generator, so its results are reproducible too.' },
            { lines: '32-33', text: 'The laziest baseline: never move. It wins when the ball happens to fall in the middle column.' },
            { lines: '36-38', text: 'A hand-written rule in three lines: step toward the ball’s column. Cheap to write, and it already catches every ball (a ball can never be further away than the paddle can travel in the time it takes to fall).' },
            { lines: '41-43', text: 'The scoreboard. Staying put and random moves win about one game in seven, as chance predicts (7 columns). The rule wins every game.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why you always build the baseline first',
          text: 'The chaser rule solves Catch perfectly, in three lines, with no training. That is a **real result**: if a trivial rule meets your target, the correct engineering decision is usually to ship the rule, which is faster, fully understandable and never surprises you. Reinforcement learning earns its cost only where no good rule is known (a Rocket League bot, a strategy game, a character that must adapt). We continue with Catch because it is a perfect *practice* problem: we know the right answer, so we can check that every step of the pipeline is correct before facing a problem where nobody knows it.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A teammate trains a neural network for a game task and reports 91 percent accuracy. You discover that a one-line rule gets 93 percent on the same test. What is the right conclusion?',
      options: [
        { text: 'The model has not justified itself yet: it must beat the simple rule (or offer something the rule cannot) before it is worth shipping', correct: true, why: 'A baseline is the price of admission. A model that loses to a trivial rule adds cost, risk and opacity for no benefit, so you either improve it or ship the rule.' },
        { text: 'The model is better, because neural networks are more advanced than rules', why: 'Sophistication is not a result. Only the measured score on the same test matters, and here the rule wins.' },
        { text: 'The test set must be wrong, because a rule cannot beat a model', why: 'Rules beat models regularly when the task is simple or the data is small. Do not blame the test without evidence; check it, but assume the numbers are real.' },
        { text: 'Train the model for longer until it scores above 99 percent', why: 'More training might help, or might not. Deciding to train longer before understanding why it loses (data, features, evaluation) is guesswork, not a plan.' },
      ],
      explanation: 'Every project needs a baseline and a stopping rule. If the baseline already meets the target, you are finished; if not, the baseline tells you how much a model must add.',
    },
    {
      kind: 'concept',
      title: 'Step 2: Train the agent',
      blocks: [
        {
          type: 'p',
          text: 'With the target and baselines fixed, training is the short part. The script below trains a [[ppo|PPO]] agent from [[stable-baselines3|Stable-Baselines3]] on the `CatchEnv` class from the custom environment lesson (saved as `catch_env.py` next to the script), with 8 copies of the environment running side by side, and then compares it with a random policy on 300 fixed-seed games that it never trained on.',
        },
        {
          type: 'code',
          title: 'train.py',
          lang: 'python',
          desktopOnly: true,
          code: `import numpy as np
from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env

from catch_env import CatchEnv

env = make_vec_env(CatchEnv, n_envs=8, seed=0)
model = PPO("MlpPolicy", env, n_steps=64, batch_size=128, learning_rate=3e-4, seed=0, verbose=0)
model.learn(total_timesteps=60_000)
model.save("catch_ppo")


def win_rate(policy, episodes=300, seed=1000):
    wins = 0
    env = CatchEnv()
    for episode in range(episodes):
        obs, _ = env.reset(seed=seed + episode)
        done = False
        while not done:
            obs, reward, done, _, _ = env.step(policy(obs))
        wins += reward > 0
    return wins / episodes


rng = np.random.default_rng(0)
print("random:", win_rate(lambda obs: int(rng.integers(3))))
print("PPO:   ", win_rate(lambda obs: int(model.predict(obs, deterministic=True)[0])))`,
          output: `random: 0.19
PPO:    1.0`,
          annotations: [
            { lines: '1-5', text: 'NumPy, the PPO algorithm, a helper for running several environments at once, and our own environment from `catch_env.py`.' },
            { lines: 7, text: '`make_vec_env` creates 8 copies of the game and gives each its own random seed derived from `seed=0`. Several copies give PPO more varied experience per update.' },
            { lines: 8, text: 'A small policy network (`MlpPolicy`). `n_steps` and `batch_size` are chosen small to suit a tiny, fast environment; `seed` makes the run repeatable.' },
            { lines: '9-10', text: '60 000 steps of experience take about 15 seconds on a laptop CPU. The trained model is saved to `catch_ppo.zip` for the next steps.' },
            { lines: '13-22', text: 'The evaluation function: play games with seeds from 1000 upward (far from anything seen in training), always reading the final reward to see a catch or a miss.' },
            { lines: '25-27', text: 'A random policy wins about one game in five or six, and the trained agent wins them all, using `deterministic=True` so that it always picks its best action instead of sampling.' },
          ],
        },
        {
          type: 'table',
          headers: ['Decision', 'What we did', 'Where it was covered'],
          rows: [
            ['**Observation**', '4 numbers scaled to the range -1 to 1: paddle position, ball column, ball height, and the ball’s offset from the paddle', 'Custom environments: normalise, and include what the agent needs'],
            ['**Reward**', 'Sparse: +1 for a catch and -1 for a miss, only when the ball lands', 'Reward design: simple, hard to exploit'],
            ['**Episode end**', '`terminated` when the ball lands; a 100-step cap as `truncated`', 'Gymnasium: terminated versus truncated'],
            ['**Algorithm**', 'PPO with a small MLP and 8 parallel environments', 'Reinforcement learning units'],
            ['**Seeds**', 'One seed for training, different seeds for evaluation', 'Evaluation and reproducibility'],
          ],
          caption: 'The design decisions in this project and the lessons where each one was explained. A capstone mostly reuses ideas you already know.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'A perfect score is a reason to check, not to celebrate',
          text: 'The agent wins 100 percent. Before believing it, ask whether the test is meaningful (are the evaluation games different from the training games? are there enough of them?) and whether it matches the rule that is already perfect. Here it does: the rule and the agent are both optimal, so the result is plausible. On a harder task, a 100 percent score would more likely signal a leak or a bug.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Because the trained agent and the hand-written chaser rule both win 100 percent of the games, the project shows that reinforcement learning is the right tool for Catch.',
      answer: false,
      explanation: 'False. It shows that the *pipeline works* (the agent learned a perfect policy), but the rule is just as good, simpler and needs no training, so for Catch itself the rule is the better engineering choice. Reinforcement learning is justified when no strong rule exists. Catch is the practice ground where we can verify that the tools behave correctly.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the evaluation call so that the trained agent always picks its single best action instead of sampling.',
      template: `action, _ = model.predict(obs, ___=True)`,
      templateIsCode: true,
      blanks: [{ answers: ['deterministic'] }],
      wordBank: ['deterministic', 'greedy', 'training', 'seed'],
      explanation: '`model.predict(obs, deterministic=True)` returns the most probable action. Without it the policy *samples* from its action probabilities, which is right during training (it explores) but adds avoidable randomness when you evaluate or deploy.',
    },
    {
      kind: 'concept',
      title: 'Step 3: Is it really better? Evaluation you can trust',
      blocks: [
        {
          type: 'p',
          text: 'Every measurement from a finite number of games is *noisy*: play another 20 games and the win rate changes. The noise is measured by the **[[standard-error|standard error]]**: for a win rate *p* over *n* games it is about the square root of *p(1 - p) / n*. With 10 games and a true win rate of 50 percent it is about 16 percentage points, so “55 percent against 45 percent” means nothing. A common rule: treat a difference as real only if it is larger than about **two** combined standard errors.',
        },
        {
          type: 'p',
          text: 'The simulation below makes this concrete. Policy B is *really* a little better than policy A (it steps toward the ball 8 percent of the time and moves randomly otherwise). We repeat the whole comparison 20 times with different seeds and count how often B *looks* better, using 10, 100 and 1 000 games per policy.',
        },
        {
          type: 'code',
          title: 'how_many_games.py',
          runnable: true,
          code: `import random

WIDTH, HEIGHT = 7, 8


def play(policy, seed):
    rng = random.Random(seed)
    paddle, ball_x, ball_y = WIDTH // 2, rng.randrange(WIDTH), 0
    while True:
        paddle = min(max(paddle + policy(paddle, ball_x, ball_y) - 1, 0), WIDTH - 1)
        ball_y += 1
        if ball_y == HEIGHT - 1:
            return 1 if paddle == ball_x else -1


def make_policy(skill, seed):
    """With probability skill step toward the ball, otherwise move at random."""
    rng = random.Random(seed)

    def policy(paddle, ball_x, ball_y):
        if rng.random() < skill:
            return 0 if ball_x < paddle else 2 if ball_x > paddle else 1
        return rng.randrange(3)

    return policy


def win_rate(skill, games, trial):
    policy = make_policy(skill, trial)
    return sum(play(policy, trial * 100_000 + g) == 1 for g in range(games)) / games


print("policy B (skill 0.08) is really, but only slightly, better than policy A (skill 0.0).")
for games in (10, 100, 1000):
    correct = sum(win_rate(0.08, games, trial) > win_rate(0.0, games, trial + 1000) for trial in range(20))
    print(f"{games:3d} games each: B looked better in {correct} of 20 repeated experiments")`,
          output: `policy B (skill 0.08) is really, but only slightly, better than policy A (skill 0.0).
 10 games each: B looked better in 12 of 20 repeated experiments
100 games each: B looked better in 19 of 20 repeated experiments
1000 games each: B looked better in 20 of 20 repeated experiments`,
          annotations: [
            { lines: '6-13', text: 'The same game as before, shortened: one seeded game that returns +1 for a catch and -1 for a miss.' },
            { lines: '16-25', text: '`make_policy` builds a policy of a given *skill*: with that probability it steps toward the ball, otherwise it moves randomly. Skill 0 is a pure random policy.' },
            { lines: '28-30', text: '`win_rate` plays `games` seeded games and returns the share of catches. Each repeated experiment (`trial`) uses different games and different policy randomness.' },
            { lines: '33-35', text: 'For each number of games, run 20 independent experiments and count how many times the genuinely better policy B also had the higher measured win rate.' },
            { lines: 36, text: 'With **10 games** B looks better only 12 times out of 20, barely better than a coin flip, so any conclusion would be a guess. With **100 games** it is 19 of 20, and with **1 000** it is every time. The same small difference becomes visible only when the sample is large enough.' },
          ],
        },
        {
          type: 'table',
          headers: ['Rule', 'Why'],
          rows: [
            ['**Fix the seeds** and use the same games for every policy being compared', 'Differences then come from the policies, not from lucky games'],
            ['**Keep evaluation seeds apart from training seeds**, and never tune against your final test games', 'Otherwise you measure memorisation and your score is optimistic'],
            ['**Play enough games**, and report the standard error with the mean', 'A number without its uncertainty invites false conclusions'],
            ['**Evaluate the deployed behaviour**: deterministic actions, the same preprocessing, the same environment settings', 'The policy you measure must be the policy you ship'],
            ['**Always show the baselines in the same table**', 'It is the only way to know if the model is worth having'],
            ['**Look at the failures**, not just the average', 'Watch a few lost games; a bug or a shortcut is easier to see than to infer from a number'],
            ['**Repeat training with a few different seeds** for stochastic methods such as RL', 'A single lucky training run can mislead; report the spread across runs'],
          ],
          caption: 'Evaluation rules that apply to every project in this course, from a classifier to a Rocket League bot.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output: the standard error of a win rate of 0.5 measured over 100 games.',
      code: `import math

p = 0.5
n = 100
print(round(math.sqrt(p * (1 - p) / n), 3))`,
      answer: '0.05',
      hint: 'p(1 - p) = 0.25, and 0.25 / 100 = 0.0025.',
      explanation: 'The square root of 0.0025 is 0.05, so a win rate measured as 50 percent over 100 games is uncertain by about 5 percentage points either way. Two standard errors (10 points) is a reasonable margin: a measured 55 percent against 45 percent over 100 games each is not convincing.',
    },
    {
      kind: 'error',
      prompt: 'This evaluation reports a score that is too optimistic. Tap the faulty line.',
      lines: [
        'train_seeds = range(0, 1000)',
        'test_seeds = range(0, 200)',
        'results = [play(policy, seed) for seed in test_seeds]',
        'print(sum(r == 1 for r in results) / len(results))',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The test seeds 0 to 199 are also among the training seeds 0 to 999, so the agent is evaluated on games it has already practised on. Evaluation seeds must be disjoint from training seeds (for example `range(1000, 1200)`), the same principle as keeping a test set apart in supervised learning.',
    },
    {
      kind: 'numeric',
      prompt: 'You expect a win rate near 0.5 and want its standard error to be 0.01 (one percentage point). How many games must you play? (Use n = p(1 - p) / SE².)',
      answer: '2500',
      hint: '0.25 / (0.01 × 0.01) = 0.25 / 0.0001.',
      explanation: 'n = 0.25 / 0.0001 = 2 500 games. Halving the standard error needs four times as many games, because the error shrinks only with the square root of the sample size. That is why careful comparisons of close results are expensive, and why a fast environment matters.',
      label: 'Games:',
    },
    {
      kind: 'concept',
      title: 'Step 4: Export, serve and ship',
      blocks: [
        {
          type: 'p',
          text: 'The agent works in Python. To use it from a game it must leave the training environment. The export script wraps the trained network’s *actor* (the half that produces one score per action) in a small PyTorch module, writes it to an [[onnx|ONNX]] file, and then does the step that is most often skipped: it **checks the exported file against the original** on 200 real observations. This is how you catch [[training-serving-skew|training-serving skew]] before players do.',
        },
        {
          type: 'code',
          title: 'export.py',
          lang: 'python',
          desktopOnly: true,
          code: `import contextlib
import io

import numpy as np
import onnxruntime as ort
import torch
from stable_baselines3 import PPO

from catch_env import CatchEnv

model = PPO.load("catch_ppo", device="cpu")


class ActorScores(torch.nn.Module):
    """The actor half of the network: observation in, one score per action out."""

    def __init__(self, policy):
        super().__init__()
        self.mlp_extractor = policy.mlp_extractor
        self.action_net = policy.action_net

    def forward(self, obs):
        latent_pi, _ = self.mlp_extractor(obs)
        return self.action_net(latent_pi)


actor = ActorScores(model.policy).eval()
example = torch.zeros(1, 4)
with contextlib.redirect_stdout(io.StringIO()):
    torch.onnx.export(actor, (example,), "catch_policy.onnx", input_names=["obs"], output_names=["scores"],
                      dynamic_shapes=({0: torch.export.Dim("batch")},))

# Compare the exported file with the original model on observations from the real environment.
env = CatchEnv()
observations = []
for seed in range(200):
    obs, _ = env.reset(seed=seed)
    observations.append(obs)
observations = np.array(observations, dtype=np.float32)

session = ort.InferenceSession("catch_policy.onnx")
onnx_actions = session.run(["scores"], {"obs": observations})[0].argmax(axis=1)
sb3_actions = model.predict(observations, deterministic=True)[0]
print("ONNX and SB3 choose the same action:", bool((onnx_actions == sb3_actions).all()))`,
          output: `ONNX and SB3 choose the same action: True`,
          annotations: [
            { lines: 11, text: 'Load the saved agent on the CPU.' },
            { lines: '14-24', text: 'Stable-Baselines3 keeps the actor in `mlp_extractor` (shared layers) and `action_net` (the final layer that makes one score per action). The wrapper runs just those two parts: observation in, scores out. Sampling and value estimates are not needed at game time.' },
            { lines: '27-31', text: 'Put the wrapper in evaluation mode, give the exporter an example input, and write the file with a named input and output and a variable batch size. The exporter’s progress messages are silenced.' },
            { lines: '33-39', text: 'Collect 200 real observations from the environment, as float32 arrays, for the comparison.' },
            { lines: '41-44', text: 'Run the same observations through ONNX Runtime and through the original model and compare the chosen actions. Only when they agree is the file allowed to ship. The check compares *actions*, which is what the game uses, not just numbers.' },
          ],
        },
        {
          type: 'p',
          text: 'Now serve it. The service below loads the ONNX file once, exposes a health check and an `/act` endpoint that takes an observation and returns an action and the model version, and validates that the observation has exactly 4 numbers. The last lines act as a game client would: they play 100 complete games, asking the service for every single move over HTTP (here through FastAPI’s test client, which needs no network).',
        },
        {
          type: 'code',
          title: 'serve.py',
          lang: 'python',
          desktopOnly: true,
          code: `import numpy as np
import onnxruntime as ort
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field

from catch_env import CatchEnv

MODEL_VERSION = "catch-ppo-1"
session = ort.InferenceSession("catch_policy.onnx")          # loaded once, when the server starts
app = FastAPI(title="Catch policy service")


class Observation(BaseModel):
    values: list[float] = Field(min_length=4, max_length=4)


@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}


@app.post("/act")
def act(observation: Observation):
    obs = np.array([observation.values], dtype=np.float32)
    scores = session.run(["scores"], {"obs": obs})[0][0]
    return {"action": int(scores.argmax()), "model_version": MODEL_VERSION}


# Play 100 complete games, asking the service for every move, exactly as a game client would.
client = TestClient(app)
print(client.get("/health").json())

env = CatchEnv()
wins = 0
for episode in range(100):
    obs, _ = env.reset(seed=5000 + episode)
    done = False
    while not done:
        action = client.post("/act", json={"values": obs.tolist()}).json()["action"]
        obs, reward, done, _, _ = env.step(action)
    wins += reward > 0
print("games won through the service:", wins, "of 100")
print("bad request:", client.post("/act", json={"values": [0.1, 0.2]}).status_code)`,
          output: `{'status': 'ok', 'model_version': 'catch-ppo-1'}
games won through the service: 100 of 100
bad request: 422`,
          annotations: [
            { lines: '9-11', text: 'The model is loaded **once** at startup and tagged with a version string that appears in every response.' },
            { lines: '14-15', text: 'The request is declared as exactly 4 floats. Anything else is rejected with a `422` before the model runs.' },
            { lines: '18-20', text: 'A health endpoint that reports the model version, for monitors and launchers.' },
            { lines: '23-27', text: 'The action endpoint: convert to a `float32` batch of one, run ONNX Runtime, and return the highest-scoring action.' },
            { lines: '30-32', text: 'The test client calls the service in-process. Replace it with a real HTTP client and a running `uvicorn` server in production.' },
            { lines: '34-43', text: 'The end-to-end test: a real environment, a real HTTP-shaped service and 100 full games decided by the exported model. 100 of 100 means the whole chain (training, export, serving, observation handling) is intact.' },
            { lines: 44, text: 'An invalid request, with only 2 numbers, is refused with status 422.' },
          ],
        },
        {
          type: 'table',
          headers: ['Stage', 'This capstone', 'The same stage in a bigger project'],
          rows: [
            ['**Frame**', 'Brief, metric, baselines, target', 'Same, plus a budget for engineering time and a plan for what happens if the model fails'],
            ['**Environment**', 'A 40-line Gymnasium environment', 'A game bridge or a simulator such as RLGym with RocketSim: bots, state setters, reward functions, observation builders'],
            ['**Train**', 'PPO for 60 000 steps, 15 seconds', 'Millions to billions of steps, GPU or many CPU cores, self-play against a pool of past opponents, curriculum'],
            ['**Evaluate**', '300 fixed-seed games and a standard error', 'Matches against reference bots, Elo ratings over many games, and a review of replays'],
            ['**Export**', 'Actor to ONNX, checked on 200 observations', 'Same, plus observation parity checks between the training code and the game engine, and tick-skip handling'],
            ['**Serve**', 'FastAPI plus ONNX Runtime, called from a test client', 'In-engine inference (C++ or C#), or containers with monitoring, versioning and rollbacks'],
            ['**Monitor**', 'Version in every response', 'Latency percentiles, input and output drift, player feedback and a fallback behaviour'],
          ],
          caption: 'The workflow is the same at every scale; only the size of each stage changes.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Where to go from here',
          text: 'Pick one of your own games and repeat these steps. A good first target is a small decision with a clear metric: a pathfinding choice, an enemy that learns from a human’s moves (imitation learning), an NPC that answers questions from your lore with retrieval, or a tool that classifies screenshots. Write the brief and the baseline first, and stop when the baseline is good enough.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises build the small functions that every project of this kind contains: a generic evaluation harness, a test for whether one policy is significantly better than another, and the action chooser of a policy server.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `evaluate_policy(policy, make_env, episodes, seed=0)`. For each game number `i` in `range(episodes)`: create a new environment with `env = make_env()`, call `obs = env.reset(seed + i)`, then repeat `obs, reward, done = env.step(policy(obs))`, adding up the rewards until `done` is true. The result of the game is the sum of its rewards. Return `(mean, stderr)`: the mean of the game results and the **standard error of the mean** (the sample standard deviation with `n - 1` in the denominator, divided by the square root of the number of games). With a single game the standard error is `0.0`. Raise `ValueError` if `episodes < 1`.',
      starter: `import math


def evaluate_policy(policy, make_env, episodes, seed=0):
    ...
`,
      solution: `import math


def evaluate_policy(policy, make_env, episodes, seed=0):
    if episodes < 1:
        raise ValueError("episodes must be at least 1")
    results = []
    for i in range(episodes):
        env = make_env()
        obs = env.reset(seed + i)
        total = 0.0
        done = False
        while not done:
            obs, reward, done = env.step(policy(obs))
            total += reward
        results.append(total)
    mean = sum(results) / episodes
    if episodes == 1:
        return mean, 0.0
    variance = sum((r - mean) ** 2 for r in results) / (episodes - 1)
    return mean, math.sqrt(variance / episodes)
`,
      tests: `class FakeEnv:
    created = 0

    def __init__(self):
        FakeEnv.created += 1
        self.seed = None
        self.steps = 0

    def reset(self, seed):
        self.seed = seed
        self.steps = 0
        return seed

    def step(self, action):
        self.steps += 1
        reward = 1.0 if action == self.seed % 2 else 0.0
        return self.seed, reward, True


mean, stderr = evaluate_policy(lambda obs: 0, FakeEnv, 4, seed=10)
assert FakeEnv.created == 4
assert mean == 0.5
assert math.isclose(stderr, math.sqrt(1 / 12))

mean, stderr = evaluate_policy(lambda obs: obs % 2, FakeEnv, 6, seed=3)
assert mean == 1.0 and stderr == 0.0

mean, stderr = evaluate_policy(lambda obs: 0, FakeEnv, 1, seed=11)
assert mean == 0.0 and stderr == 0.0


class TwoStep:
    def reset(self, seed):
        self.t = 0
        return 0

    def step(self, action):
        self.t += 1
        return 0, 2.0 if self.t == 1 else -0.5, self.t == 2


mean, stderr = evaluate_policy(lambda obs: 0, TwoStep, 5)
assert mean == 1.5 and stderr == 0.0

seeds = []


class Recorder:
    def reset(self, seed):
        seeds.append(seed)
        return 0

    def step(self, action):
        return 0, 1.0, True


evaluate_policy(lambda obs: 0, Recorder, 3, seed=100)
assert seeds == [100, 101, 102]

for bad in (0, -3):
    try:
        evaluate_policy(lambda obs: 0, FakeEnv, bad)
        raise SystemExit("expected ValueError")
    except ValueError:
        pass`,
      checks: ['Creates a new environment per game, resets it with `seed + i` and sums the rewards until `done`', 'Returns the mean of the game results and the standard error with `n - 1` in the variance', 'Returns a standard error of `0.0` for a single game and raises `ValueError` when `episodes < 1`'],
      hint: 'Collect one total per game in a list. The mean is `sum(results) / n`. The variance is `sum((r - mean) ** 2 for r in results) / (n - 1)`, and the standard error is `math.sqrt(variance / n)`. Handle `n == 1` before dividing by `n - 1`.',
      explanation: 'This is the same shape as the harness used all through the course. Using `seed + i` makes the games reproducible and identical for every policy you compare; creating the environment inside the loop is a safe default, and passing a factory (`make_env`) rather than an environment keeps it flexible. Returning the standard error along with the mean is what makes the number honest.',
    },
    {
      kind: 'code',
      prompt: 'Write `significantly_better(a, b)`. `a` and `b` are lists of per-game results of two policies (each with at least 2 values; otherwise raise `ValueError`). Compute each list’s mean and standard error (sample variance with `n - 1`, divided by `n`, square-rooted). Return `True` only if `mean(a) - mean(b)` is **strictly greater than twice the combined standard error**, where the combined standard error is `sqrt(se_a ** 2 + se_b ** 2)`.',
      starter: `import math


def significantly_better(a, b):
    ...
`,
      solution: `import math


def _mean_and_se(values):
    n = len(values)
    mean = sum(values) / n
    variance = sum((v - mean) ** 2 for v in values) / (n - 1)
    return mean, math.sqrt(variance / n)


def significantly_better(a, b):
    if len(a) < 2 or len(b) < 2:
        raise ValueError("need at least 2 results per policy")
    mean_a, se_a = _mean_and_se(a)
    mean_b, se_b = _mean_and_se(b)
    return mean_a - mean_b > 2 * math.sqrt(se_a ** 2 + se_b ** 2)
`,
      tests: `a = [1, 0] * 50
b = [1, 0, 0, 0] * 25
assert significantly_better(a, b) is True
assert significantly_better(b, a) is False
assert significantly_better(a, a) is False

c = [1, 0] * 49 + [0, 0]
assert significantly_better(a, c) is False
assert significantly_better(c, a) is False

assert significantly_better([1.0] * 10, [0.0] * 10) is True
assert significantly_better([1.0] * 10, [1.0] * 10) is False
assert significantly_better([0.0] * 10, [1.0] * 10) is False

small_a = [1, 0, 1, 1]
small_b = [0, 0, 1, 0]
assert significantly_better(small_a, small_b) is False

big_a = [1] * 90 + [0] * 10
big_b = [1] * 60 + [0] * 40
assert significantly_better(big_a, big_b) is True

for args in [([1], [1, 0]), ([1, 0], [1]), ([], [])]:
    try:
        significantly_better(*args)
        raise SystemExit("expected ValueError")
    except ValueError:
        pass
assert a == [1, 0] * 50`,
      checks: ['Computes each list’s mean and standard error with the sample variance (`n - 1`)', 'Returns `True` only when the difference of means exceeds two combined standard errors (strictly)', 'Raises `ValueError` when either list has fewer than 2 values'],
      hint: 'Write a helper that returns `(mean, se)` for a list. Then compare `mean_a - mean_b` with `2 * math.sqrt(se_a ** 2 + se_b ** 2)`. Standard errors of independent samples combine as the square root of the sum of their squares.',
      explanation: 'This is a rough but useful rule of thumb (about a 95 percent confidence test); a formal test such as Welch’s t-test refines it. Notice the two cases at the end of the tests: a 4-game comparison is not significant even with a visible difference, while 90 percent against 60 percent over 100 games each is clearly real. The function turns “it looks better” into a decision rule that you can apply the same way every time.',
    },
    {
      kind: 'code',
      prompt: 'Write `choose_action(scores, legal=None)` for a policy server. `scores` is a list of numbers, one per action. `legal` is `None` (every action is allowed) or a list of booleans of the same length. Return the **index of the highest score among the legal actions**; when scores tie, return the lowest index. Raise `ValueError` if `scores` is empty, if `legal` has a different length, or if no action is legal. Do not modify the inputs.',
      starter: `def choose_action(scores, legal=None):
    ...
`,
      solution: `def choose_action(scores, legal=None):
    if len(scores) == 0:
        raise ValueError("no scores")
    if legal is None:
        legal = [True] * len(scores)
    if len(legal) != len(scores):
        raise ValueError("legal must have one entry per action")
    best = None
    for index, score in enumerate(scores):
        if legal[index] and (best is None or score > scores[best]):
            best = index
    if best is None:
        raise ValueError("no legal action")
    return best
`,
      tests: `assert choose_action([0.1, 0.9, 0.5]) == 1
assert choose_action([3, 2, 1]) == 0
assert choose_action([-3.0, -1.0, -2.0]) == 1
assert choose_action([1, 1, 0]) == 0
assert choose_action([2, 5, 5]) == 1
assert choose_action([7]) == 0

assert choose_action([0.1, 0.9, 0.5], [True, False, True]) == 2
assert choose_action([0.1, 0.9, 0.5], [True, True, True]) == 1
assert choose_action([5, 5, 5], [False, True, True]) == 1
assert choose_action([9, 1, 1], [False, True, True]) == 1
assert choose_action([-5, -9, -7], [False, True, True]) == 2

scores = [1, 2, 3]
legal = [True, False, True]
choose_action(scores, legal)
assert scores == [1, 2, 3] and legal == [True, False, True]

for args in [([], None), ([1, 2], [True]), ([1, 2], [False, False]), ([1], [False]), ([1, 2, 3], [True, True])]:
    try:
        choose_action(*args)
        raise SystemExit("expected ValueError for %r" % (args,))
    except ValueError:
        pass`,
      checks: ['Returns the index of the highest score among the legal actions, with ties going to the lowest index', 'Treats `legal=None` as all actions allowed', 'Raises `ValueError` for empty scores, a mask of the wrong length, or no legal action'],
      hint: 'Walk through `enumerate(scores)` and keep the index of the best legal score seen so far, replacing it only when a score is strictly greater (so ties keep the earlier index). If no index was ever legal, raise `ValueError`.',
      explanation: 'A trained policy outputs scores for *all* actions, but a game often forbids some of them (an ability on cooldown, a move into a wall). Masking illegal actions on the server (or in the engine) is far safer than hoping the network learned the rules, and it also guards against a corrupted model suggesting nonsense. Using `>` rather than `>=` makes tie-breaking deterministic, which matters when you want a test to give the same answer every time.',
    },
  ],
  takeaways: [
    '**Frame first**: write the goal, the metric, the baselines, the target and the budget before training. Build the **cheapest baselines** (do nothing, random, a hand-written rule) and put them in the same table as the model. If a rule meets the target, ship the rule.',
    'Train with a fixed seed, but **evaluate on different, fixed-seed games** with deterministic actions, so that results are repeatable and not simply memorised. A perfect score on a hard task is a reason to look for a leak or a bug.',
    'Every measurement is noisy: report the **standard error** (about the square root of p(1 - p) / n for a win rate), treat a difference as real only beyond about **two combined standard errors**, and remember that halving the error needs four times the games.',
    '**Export and verify**: write the actor to ONNX, then compare the exported file with the original on real observations before shipping. **Serve** it with a validated input, a model loaded once, a health check, a version in every response, and an end-to-end test that plays real games through the service.',
    'The same workflow scales from Catch to a Rocket League bot or an LLM-powered NPC: **frame, environment, train, evaluate, export, serve, monitor**. Only the size of each stage changes, so start your own project small, with a baseline and a stopping rule.',
  ],
  reading: [
    { title: 'Google: Rules of Machine Learning', url: 'https://developers.google.com/machine-learning/guides/rules-of-ml', source: 'article', note: 'Practical advice for the whole life cycle, starting with “do not be afraid to launch a product without machine learning”.' },
    { title: 'Stable-Baselines3 documentation', url: 'https://stable-baselines3.readthedocs.io', source: 'docs', note: 'Algorithms, tips on evaluation, and the export guide used in this lesson.' },
    { title: 'Henderson et al.: Deep Reinforcement Learning that Matters', url: 'https://arxiv.org/abs/1709.06560', source: 'paper', note: 'Why RL results are noisy, how much seeds matter, and how to report them honestly.' },
    { title: 'Gymnasium documentation: writing your own environment', url: 'https://gymnasium.farama.org/introduction/create_custom_env/', source: 'docs', note: 'The environment API used by the project.' },
    { title: 'RLGym documentation', url: 'https://rlgym.org', source: 'docs', note: 'The framework for taking the same workflow to Rocket League bots.' },
  ],
};
