import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-custom-env',
  title: 'Turning Your Own Game into an RL Environment',
  summary: 'Wrap a game in the Gymnasium interface: write a real gym.Env subclass, design observations that learn well, test it for reproducibility and speed, and learn the options for connecting a real game engine.',
  minutes: 27,
  objectives: [
    'Write a Gymnasium environment class with spaces, reset, step and render',
    'Design observations that are normalised, relative and sufficient for the decision',
    'Make an environment reproducible with seeding, and test it with check_env, baselines and invariants',
    'Choose a way to connect an existing game engine to Python and keep stepping fast',
    'Register an environment so it can be created with gym.make',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The anatomy of an environment',
      blocks: [
        {
          type: 'p',
          text: 'To train an agent in *your* game, the game has to speak the Gymnasium language you met two lessons ago. That means a class with `reset` and `step`, and two **spaces** declaring what goes in and out. The hard part is rarely the code. It is deciding what the agent sees, what it may do and how a step of the game maps to a step of the loop. Seven design decisions cover almost every environment.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Separate the simulation from the presentation', text: 'Game rules must run **headless**: no window, no sound, no frame limiter. Training needs thousands of steps per second, and a game locked to 60 frames per second yields only 60. Rendering is optional and happens only when asked.' },
            { title: 'Define the action space', text: 'What can the agent do? A few buttons give `Discrete(n)`; analog sticks and throttles give `Box`; several simultaneous choices give `MultiDiscrete`. Fewer, more meaningful actions learn faster.' },
            { title: 'Define the observation', text: 'What must the agent know to choose well? Include everything relevant (the Markov property), nothing it could cheat with, and express it in sensible units (next section).' },
            { title: 'Write the step logic', text: 'Apply the action, advance the simulation (possibly several game ticks per agent decision, "frame skip"), compute the new observation and the reward.' },
            { title: 'Define termination and truncation', text: '`terminated` for real endings (won, died); `truncated` for time limits so that episodes can never run forever.' },
            { title: 'Make `reset` produce varied starts', text: 'A fixed start teaches the agent to memorise one trajectory. Randomise starting positions, targets and opponents from the seeded generator, so that the policy has to generalise.' },
            { title: 'Seed all randomness', text: 'Every random choice must come from the environment’s own generator, so the same seed replays the same episode. Without this, bugs and results cannot be reproduced.' },
          ],
        },
        {
          type: 'p',
          text: 'Here is a complete environment following all seven. In **Catch**, a ball falls one row per step from a random column and the agent slides a paddle left or right (or stays) to be under it when it lands: +1 for a catch, −1 for a miss. It is tiny, but it is a real subclass of `gymnasium.Env`, accepted by every library in this unit. (Save it as `catch_env.py` and run with `pip install gymnasium numpy`.)',
        },
        {
          type: 'code',
          title: 'catch_env.py',
          desktopOnly: true,
          code: `import gymnasium as gym
import numpy as np
from gymnasium import spaces


class CatchEnv(gym.Env):
    """Move a paddle left or right to catch a falling ball."""

    metadata = {"render_modes": ["ansi"]}

    def __init__(self, width=7, height=8, render_mode=None):
        super().__init__()
        self.width, self.height = width, height
        self.render_mode = render_mode
        self.observation_space = spaces.Box(low=-1.0, high=1.0, shape=(4,), dtype=np.float32)
        self.action_space = spaces.Discrete(3)  # 0 = left, 1 = stay, 2 = right

    def _obs(self):
        w, h = self.width - 1, self.height - 1
        rel = (self.ball_x - self.paddle) / w
        return np.array([self.paddle / w, self.ball_x / w, self.ball_y / h, rel], dtype=np.float32)

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.paddle = self.width // 2
        self.ball_x = int(self.np_random.integers(self.width))
        self.ball_y = 0
        return self._obs(), {}

    def step(self, action):
        self.paddle = int(np.clip(self.paddle + int(action) - 1, 0, self.width - 1))
        self.ball_y += 1
        terminated = self.ball_y == self.height - 1
        reward = (1.0 if self.paddle == self.ball_x else -1.0) if terminated else 0.0
        return self._obs(), reward, terminated, False, {}

    def render(self):
        rows = [[" "] * self.width for _ in range(self.height)]
        rows[self.ball_y][self.ball_x] = "o"
        rows[-1][self.paddle] = "#" if self.ball_y == self.height - 1 and self.paddle == self.ball_x else "="
        return "\\n".join("|" + "".join(r) + "|" for r in rows)`,
          annotations: [
            { lines: '1-3', text: 'Gymnasium provides the base class and `spaces`; NumPy provides arrays.' },
            { lines: '6-9', text: 'Subclass **`gym.Env`**. The `metadata` dictionary declares which render modes exist (here a text rendering, `"ansi"`).' },
            { lines: '11-16', text: 'The constructor stores the board size and declares the two **spaces**. Observations are 4 floats between −1 and 1 (`Box`); actions are one of 3 integers (`Discrete(3)`: left, stay, right).' },
            { lines: '18-21', text: '`_obs` turns the internal state into the observation vector: paddle position, ball column, ball height (all scaled to 0–1) and the **relative** horizontal offset between ball and paddle (−1 to 1). The relative feature is what makes the problem easy to learn.' },
            { lines: '23-28', text: '`reset` first calls **`super().reset(seed=seed)`**, which creates the environment’s own random generator, `self.np_random`. The ball’s starting column is drawn from it, so every episode is different, yet seeded runs repeat exactly. Returns the first observation and an info dict.' },
            { lines: '30-35', text: '`step` applies the action (`action − 1` gives −1, 0 or +1, then clamped to the board), drops the ball one row, ends the episode when the ball reaches the bottom row, and pays +1 for a catch or −1 for a miss, and 0 on every earlier step. It returns the **five values** of the API; `truncated` is always `False` because the episode ends by itself after a fixed number of steps.' },
            { lines: '37-41', text: '`render` draws the board as text (`o` is the ball, `=` the paddle, `#` when the ball lands on the paddle). A real game would return an image array (`"rgb_array"`) or open a window (`"human"`).' },
          ],
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why does `reset` call `super().reset(seed=seed)` and draw random numbers from `self.np_random` instead of using Python’s global `random` module?',
      options: [
        { text: 'So the environment has its own seeded generator: the same seed then reproduces the same episode, independent of anything else in the program', correct: true, why: 'Gymnasium’s base class creates and seeds `self.np_random` from the seed you pass. All randomness drawn from it is reproducible, and does not interfere with, or depend on, other code using the global generator.' },
        { text: 'Because the global `random` module cannot generate integers', why: 'It can; the point is reproducibility and isolation, not capability.' },
        { text: 'Because `np_random` makes the environment run faster on a GPU', why: 'It is an ordinary NumPy generator on the CPU. Speed is not the reason.' },
        { text: 'Because Gymnasium forbids importing `random`', why: 'There is no such rule. The convention exists to make runs reproducible.' },
      ],
      explanation: 'Seeded, environment-owned randomness is what makes experiments reproducible and bugs replayable.',
    },
    {
      kind: 'concept',
      title: 'Designing the observation',
      blocks: [
        {
          type: 'p',
          text: 'The observation decides how hard the learning problem is. The same game can be easy or impossible depending on how you present it. A few rules cover most cases.',
        },
        {
          type: 'table',
          headers: ['Principle', 'Why it matters', 'Example'],
          rows: [
            ['**Normalise** to a small range', 'Networks learn poorly when inputs differ by orders of magnitude', 'Position divided by the board width, giving 0 to 1; health as a fraction, not 0 to 1000'],
            ['**Relative** over absolute', 'The decision depends on *where the target is compared with me*; handing it over directly saves the network from learning subtraction', 'Offset to the ball instead of two absolute positions'],
            ['Be **Markov**', 'The state must contain what is needed to predict what happens next', 'Add velocities, cooldown timers, or stack the last few frames'],
            ['Include **what a player knows**, nothing more', 'Hidden information the agent can see makes bots unfair and not transferable', 'Do not expose enemy positions behind walls unless a player could know them'],
            ['**Egocentric** frame where possible', 'Rotating and translating into the agent’s own frame makes the same situation look the same everywhere', 'Enemy position relative to my position and heading'],
            ['Keep the size **fixed**', 'Neural networks need a fixed input length', 'Nearest 5 enemies, padded with zeros, not "all enemies"'],
            ['Beware **unbounded** values', 'Huge or infinite values destabilise training', 'Clip or squash distances (for example `tanh(d / 1000)`)'],
          ],
          caption: 'Observation design principles.',
        },
        {
          type: 'p',
          text: 'The program below shows two of them at work. The same situation (the ball is a quarter of the board to the right of the paddle, at the same relative height) is described on a small board and a large one. The raw numbers differ, so a network would have to learn each board separately. The engineered observation is identical, so one policy works on both.',
        },
        {
          type: 'code',
          title: 'observation_design.py',
          runnable: true,
          code: `def raw_observation(paddle, ball_x, ball_y):
    return [paddle, ball_x, ball_y]

def engineered_observation(paddle, ball_x, ball_y, width, height):
    w, h = width - 1, height - 1
    return [round(paddle / w, 2), round(ball_x / w, 2), round(ball_y / h, 2), round((ball_x - paddle) / w, 2)]

small = dict(paddle=1, ball_x=2, ball_y=2, width=5, height=6)
large = dict(paddle=2, ball_x=4, ball_y=4, width=9, height=11)

for name, g in (("small board", small), ("large board", large)):
    raw = raw_observation(g["paddle"], g["ball_x"], g["ball_y"])
    eng = engineered_observation(**g)
    print(f"{name}: raw {raw}  engineered {eng}")`,
          output: `small board: raw [1, 2, 2]  engineered [0.25, 0.5, 0.4, 0.25]
large board: raw [2, 4, 4]  engineered [0.25, 0.5, 0.4, 0.25]`,
          annotations: [
            { lines: '1-2', text: 'The naive observation: raw grid coordinates.' },
            { lines: '4-6', text: 'The engineered one: positions divided by the largest possible index (so they land in 0 to 1), the height as a fraction, and the **relative offset** between ball and paddle.' },
            { lines: '8-9', text: 'The same geometric situation on a 5×6 board and a 9×11 board.' },
            { lines: '11-14', text: 'Raw numbers differ completely (`[1, 2, 2]` versus `[2, 4, 4]`), while the engineered vector is **identical** on both boards: `[0.25, 0.5, 0.4, 0.25]`. A policy trained on one board therefore also plays the other, and training generalises across level sizes and layouts.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why feature engineering still matters in the age of deep learning',
          text: 'In principle a big enough network could learn everything from raw coordinates. In practice every quantity the network has to *discover* (relative offsets, symmetry, scale) costs training steps, and RL training steps are expensive. Putting known structure into the observation is free and can cut training time by orders of magnitude. The same principle makes frame stacking, "distance and angle to target", and sensible scales standard in successful game bots. Image-based agents exist, but they need far more data than a well-designed feature vector.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'An environment’s `step` method should draw the full game graphics every call, so that the agent can see the screen; rendering to the display must never be skipped.',
      answer: false,
      explanation: 'False. For vector observations the agent never sees the screen, and drawing every frame is the single biggest waste of time in a training loop. Keep simulation and rendering separate: `step` should be as fast as possible, and `render` runs only when the user asks for it (`render_mode="human"` or `"rgb_array"`). Pixel-based agents do need frames, but they render small images, headlessly, at the lowest resolution that works.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the relative-offset feature in the observation function.',
      template: `rel = (self.ball_x - ___) / w`,
      templateIsCode: true,
      blanks: [{ answers: ['self.paddle'] }],
      wordBank: ['self.paddle', 'self.ball_y', 'self.width', 'w'],
      explanation: 'The offset between the ball and the paddle, `self.ball_x - self.paddle`, divided by the board span, is positive when the paddle must move right and negative when it must move left. That single number is almost the policy by itself.',
    },
    {
      kind: 'concept',
      title: 'Testing an environment before you train on it',
      blocks: [
        {
          type: 'p',
          text: 'Training on a broken environment wastes days, and the failure is silent: the agent just learns the wrong thing, or nothing. Test the environment like any other software, *before* you start training. The most valuable property to test is **reproducibility**: running the same seed twice must give the same episode. The program below shows an environment that passes this test and one that silently fails it.',
        },
        {
          type: 'code',
          title: 'reproducibility_test.py',
          runnable: true,
          code: `import random

class GoodEnv:
    def reset(self, seed=None):
        self.rng = random.Random(seed)
        self.x = 0
        return self.x, {}

    def step(self, action):
        self.x += action + (1 if self.rng.random() < 0.5 else 0)
        return self.x, 0.0, self.x >= 20, False, {}

class LeakyEnv(GoodEnv):
    def reset(self, seed=None):
        self.x = 0
        return self.x, {}

    def step(self, action):
        self.x += action + (1 if random.random() < 0.5 else 0)
        return self.x, 0.0, self.x >= 20, False, {}

def trajectory(env, seed):
    obs, _ = env.reset(seed=seed)
    path, done = [obs], False
    while not done:
        obs, reward, terminated, truncated, _ = env.step(0)
        path.append(obs)
        done = terminated or truncated
    return path

for cls in (GoodEnv, LeakyEnv):
    env = cls()
    print(f"{cls.__name__:<9} same seed gives the same trajectory: {trajectory(env, 7) == trajectory(env, 7)}")`,
          output: `GoodEnv   same seed gives the same trajectory: True
LeakyEnv  same seed gives the same trajectory: False`,
          annotations: [
            { lines: '3-11', text: '`GoodEnv` creates its own `random.Random(seed)` in `reset` and draws every random number from it, so the seed controls everything.' },
            { lines: '13-20', text: '`LeakyEnv` accepts the seed but then draws from the **global** `random` module, ignoring it. The bug is invisible in normal use: the environment works, it simply cannot be reproduced.' },
            { lines: '22-29', text: '`trajectory` plays one episode with a fixed action and records the observations.' },
            { lines: '31-33', text: 'The test: run the same seed twice and compare. `GoodEnv` passes. `LeakyEnv` fails, which means a result found with it can never be replayed, and an unexpectedly good or bad training run cannot be investigated.' },
          ],
        },
        {
          type: 'p',
          text: 'The next program tests the real `CatchEnv`. It runs Gymnasium’s own **`check_env`**, which validates spaces, dtypes, bounds and the API contract, and then compares two reference policies. These **baselines** are as important as any test: a random agent shows the score to beat, and a hand-written "follow the ball" policy shows that the task is solvable and the reward is right. If the scripted policy cannot score well, the environment (or its reward) is wrong, and no learning algorithm will fix that.',
        },
        {
          type: 'code',
          title: 'test_catch_env.py',
          desktopOnly: true,
          code: `from gymnasium.utils.env_checker import check_env

from catch_env import CatchEnv

env = CatchEnv()
check_env(env)
print("check_env passed")

def mean_return(policy, episodes=200):
    env.action_space.seed(0)
    total = 0.0
    for i in range(episodes):
        obs, _ = env.reset(seed=i)
        done = False
        while not done:
            obs, reward, terminated, truncated, _ = env.step(policy(obs))
            done = terminated or truncated
        total += reward
    return total / episodes

random_policy = lambda obs: env.action_space.sample()
follow_ball = lambda obs: 0 if obs[3] < 0 else 2 if obs[3] > 0 else 1
print("random policy mean return:", mean_return(random_policy))
print("follow-the-ball mean return:", mean_return(follow_ball))

obs, _ = env.reset(seed=3)
for _ in range(4):
    env.step(1)
print(env.render())`,
          output: `check_env passed
random policy mean return: -0.73
follow-the-ball mean return: 1.0
|       |
|       |
|       |
|       |
|     o |
|       |
|       |
|   =   |`,
          annotations: [
            { lines: '1-3', text: 'Import the checker and the environment from the file written above.' },
            { lines: '5-7', text: '`check_env` raises an error (or warns) if the environment breaks the API: wrong dtypes, observations outside the declared space, non-deterministic seeding and more. Always run it on a new environment.' },
            { lines: '9-19', text: '`mean_return` plays 200 episodes with seeds 0 to 199 and averages the final reward, so results are comparable between policies.' },
            { lines: '21-24', text: 'A random policy catches the ball only about 13% of the time (mean return **−0.73**). The scripted policy that moves towards the ball uses the relative-offset feature and scores a perfect **1.0**. The task is solvable, so a learning agent has a clear target between −0.73 and 1.0.' },
            { lines: '26-29', text: 'Render one frame after 4 steps: the ball (`o`) has fallen four rows and the paddle (`=`) is still in the middle.' },
          ],
        },
        {
          type: 'steps',
          items: [
            { title: 'Run `check_env`', text: 'Catches API and space mistakes immediately. Stable-Baselines3 has its own `check_env` in `stable_baselines3.common.env_checker`; run both.' },
            { title: 'Test reproducibility', text: 'Same seed, same episode. Also check that *different* seeds give different starts.' },
            { title: 'Play it yourself and with scripts', text: 'Drive the environment with random actions and with a scripted policy. Check the rewards by hand on a few steps.' },
            { title: 'Check invariants', text: 'Observations always inside the declared space; episodes always end (add a truncation limit); rewards finite; `reset` always possible.' },
            { title: 'Measure the speed', text: 'Time 10 000 steps. If you get under a few thousand steps per second, profile the simulation before training; slow environments dominate training time.' },
            { title: 'Try a short training run', text: 'A simple algorithm (PPO from the next lessons) should show clear improvement over the random baseline within a few minutes on an easy version of the task. If not, suspect the reward or observation, not the algorithm.' },
          ],
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this relative-offset feature for three situations.',
      code: `def rel_x(paddle, ball_x, width):
    return round((ball_x - paddle) / (width - 1), 2)

print(rel_x(3, 1, 5), rel_x(3, 4, 5), rel_x(2, 2, 5))`,
      answer: '-0.5 0.25 0.0',
      hint: 'The span is `width - 1 = 4`. Compute `(ball_x - paddle) / 4` for each pair.',
      explanation: '(1 − 3)/4 = −0.5 (the ball is to the left, so the paddle must move left); (4 − 3)/4 = 0.25 (a little to the right); (2 − 2)/4 = 0.0 (directly overhead). The sign tells the agent which way to move and the size how urgent it is.',
    },
    {
      kind: 'error',
      prompt: 'Training runs with this `reset` cannot be reproduced even when the same seed is passed. Tap the faulty line.',
      lines: [
        'def reset(self, seed=None, options=None):',
        '    self.paddle = self.width // 2',
        '    self.ball_x = random.randrange(self.width)',
        '    self.ball_y = 0',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The ball’s column comes from Python’s **global** `random` module, so the `seed` argument has no effect (and `super().reset(seed=seed)` is never called). Call `super().reset(seed=seed)` first and draw from the environment’s generator: `self.ball_x = int(self.np_random.integers(self.width))`.',
    },
    {
      kind: 'numeric',
      prompt: 'In `CatchEnv`, the ball starts in row 0 and falls one row per step, and the episode ends when it reaches the last row. How many steps does one episode last with `height = 12`?',
      answer: '11',
      hint: 'The ball moves from row 0 to row `height − 1`, one row per step.',
      explanation: 'The ball must travel from row 0 to row 11, which takes 11 steps (`ball_y` goes 1, 2, …, 11). For `height = 8` it was 7 steps. The episode length is always `height − 1`, so it can never run forever.',
      label: 'Steps:',
    },
    {
      kind: 'concept',
      title: 'Connecting a real game engine',
      blocks: [
        {
          type: 'p',
          text: 'Catch is a toy written in Python. Your real game is probably a Unity, Unreal, Godot or custom C++ project. There are four ways to get an RL environment out of it, and the right one depends on how fast stepping needs to be and how much of the game logic you can separate.',
        },
        {
          type: 'table',
          headers: ['Approach', 'How it works', 'Speed', 'Cost'],
          rows: [
            ['**Reimplement the rules** in Python (NumPy, Numba) or C++ with bindings', 'A lightweight copy of the game logic, no engine', 'Fastest: 10 000 to millions of steps per second', 'Duplicated logic can drift from the real game; the work of writing it'],
            ['**Headless engine plus bridge**', 'Run the real game without graphics, talk to it over sockets or gRPC. Unity ML-Agents, Godot RL Agents and Unreal plugins do this', 'Limited by the engine: speed up game time, run many instances in parallel', 'Exact game, but heavy; needs engine-specific setup'],
            ['**Use the game’s own API**', 'Some games ship a bot interface or research API (StarCraft II, Minecraft research wrappers, the Arcade Learning Environment for Atari)', 'Whatever the API allows', 'Only for games that offer it'],
            ['**Learn from recordings**', 'No simulator: use logged human play for imitation or offline RL (a later lesson)', 'Not applicable', 'Limited to what the data covers'],
          ],
          caption: 'Four ways to connect a game to Python.',
        },
        {
          type: 'p',
          text: 'Rocket League shows the trade-off clearly. The real game is far too slow and heavy to train on directly. The RLGym community therefore uses **RocketSim**, a fast C++ re-implementation of the game’s physics, which runs the simulation at many times real speed on a CPU with no graphics. That is approach one, and it is what makes training a Rocket League bot feasible on a home computer (the next lessons).',
        },
        {
          type: 'p',
          text: 'Once an environment works, register it with a name so that training scripts can create it with `gym.make`, and set a maximum episode length as a safety net. The program below registers Catch and creates it by name.',
        },
        {
          type: 'code',
          title: 'register_env.py',
          desktopOnly: true,
          code: `from catch_env import CatchEnv
import gymnasium as gym

gym.register(id="Catch-v0", entry_point=CatchEnv, max_episode_steps=100)

env = gym.make("Catch-v0")
print(env.spec.id, env.spec.max_episode_steps)`,
          output: `Catch-v0 100`,
          annotations: [
            { lines: 1, text: 'The environment class from the earlier file.' },
            { lines: 4, text: '`register` gives the environment a versioned id (`Catch-v0`; bump the version whenever behavior changes so that old results stay comparable), points at the class and adds a `max_episode_steps` limit. Gymnasium then wraps the environment in a `TimeLimit`, which sets `truncated` for you.' },
            { lines: '6-7', text: '`gym.make("Catch-v0")` now builds the environment anywhere, including inside Stable-Baselines3 and vectorized environments, which is exactly how the training scripts of the next lessons create theirs.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises rebuild the pieces in pure Python, so you can run and test them right here: the observation function, a complete Catch environment following the Gymnasium contract, and a policy-evaluation helper.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `make_observation(paddle_x, ball_x, ball_y, width, height)` returning a list of four floats: `paddle_x / (width - 1)`, `ball_x / (width - 1)`, `ball_y / (height - 1)` and the relative offset `(ball_x - paddle_x) / (width - 1)`. (Do not round.)',
      starter: `def make_observation(paddle_x, ball_x, ball_y, width, height):
    ...
`,
      solution: `def make_observation(paddle_x, ball_x, ball_y, width, height):
    w, h = width - 1, height - 1
    return [paddle_x / w, ball_x / w, ball_y / h, (ball_x - paddle_x) / w]
`,
      tests: `import math

obs = make_observation(1, 2, 2, 5, 6)
assert isinstance(obs, list) and len(obs) == 4
assert all(math.isclose(a, b) for a, b in zip(obs, [0.25, 0.5, 0.4, 0.25]))
obs = make_observation(2, 4, 4, 9, 11)
assert all(math.isclose(a, b) for a, b in zip(obs, [0.25, 0.5, 0.4, 0.25]))
assert make_observation(0, 0, 0, 5, 6) == [0.0, 0.0, 0.0, 0.0]
obs = make_observation(4, 0, 5, 5, 6)
assert all(math.isclose(a, b) for a, b in zip(obs, [1.0, 0.0, 1.0, -1.0]))
obs = make_observation(3, 3, 1, 7, 3)
assert math.isclose(obs[3], 0.0) and math.isclose(obs[2], 0.5)
assert all(-1.0 <= x <= 1.0 for x in make_observation(0, 6, 7, 7, 8))`,
      checks: ['The first three entries scale the positions by the board span (`width - 1`, `height - 1`)', 'The fourth entry is the signed offset `(ball_x - paddle_x) / (width - 1)`', 'The same relative situation on different board sizes gives the same vector'],
      hint: 'Let `w = width - 1` and `h = height - 1`, and return `[paddle_x / w, ball_x / w, ball_y / h, (ball_x - paddle_x) / w]`.',
      explanation: 'Dividing by `width - 1` (the largest possible index) maps the first column to 0 and the last to 1 exactly, and makes the relative offset lie between −1 and 1. This function is the interface between the game’s world and the neural network’s world, and it is worth writing and testing on its own.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `CatchEnv(width=5, height=6)` following the Gymnasium contract (in plain Python). `reset(seed=None)` creates `self.rng = random.Random(seed)`, puts the paddle at `width // 2`, draws the ball column with `self.rng.randrange(width)`, sets the ball row to 0 and returns `((paddle, ball_x, ball_y), {})`. `step(action)` (0 = left, 1 = stay, 2 = right) moves the paddle by `action - 1` clamped to `0..width-1`, drops the ball one row, and returns `(observation, reward, terminated, False, {})`. The episode terminates when the ball reaches row `height - 1`; the reward is then `1.0` if the paddle is under the ball, else `-1.0`; every earlier step has reward `0.0`. Observations are tuples `(paddle, ball_x, ball_y)`.',
      starter: `import random

class CatchEnv:
    def __init__(self, width=5, height=6):
        self.width = width
        self.height = height

    def reset(self, seed=None):
        ...

    def step(self, action):
        ...
`,
      solution: `import random

class CatchEnv:
    def __init__(self, width=5, height=6):
        self.width = width
        self.height = height

    def reset(self, seed=None):
        self.rng = random.Random(seed)
        self.paddle = self.width // 2
        self.ball_x = self.rng.randrange(self.width)
        self.ball_y = 0
        return (self.paddle, self.ball_x, self.ball_y), {}

    def step(self, action):
        self.paddle = max(0, min(self.width - 1, self.paddle + action - 1))
        self.ball_y += 1
        terminated = self.ball_y == self.height - 1
        reward = 0.0
        if terminated:
            reward = 1.0 if self.paddle == self.ball_x else -1.0
        return (self.paddle, self.ball_x, self.ball_y), reward, terminated, False, {}
`,
      tests: `import random

env = CatchEnv(5, 6)
obs, info = env.reset(seed=0)
assert obs == (2, random.Random(0).randrange(5), 0) and info == {}

def play(env, seed, policy):
    obs, _ = env.reset(seed=seed)
    steps, total, done = 0, 0.0, False
    while not done:
        obs, reward, terminated, truncated, info = env.step(policy(obs))
        assert truncated is False and info == {}
        steps += 1
        total += reward
        done = terminated
        if not done:
            assert reward == 0.0 and obs[2] == steps
    return steps, total

def follow(obs):
    paddle, ball, _ = obs
    return 0 if ball < paddle else 2 if ball > paddle else 1

for seed in range(20):
    assert play(CatchEnv(5, 6), seed, follow) == (5, 1.0)

for seed in range(20):
    ball = random.Random(seed).randrange(5)
    steps, total = play(CatchEnv(5, 6), seed, lambda obs: 1)
    assert steps == 5 and total == (1.0 if ball == 2 else -1.0)

env = CatchEnv(5, 6)
env.reset(seed=1)
for _ in range(4):
    obs, *_ = env.step(0)
assert obs[0] == 0
env.reset(seed=1)
for _ in range(4):
    obs, *_ = env.step(2)
assert obs[0] == 4

env = CatchEnv(7, 10)
assert env.reset(seed=3)[0][0] == 3
assert play(env, 4, follow)[0] == 9

first = [CatchEnv().reset(seed=s)[0][1] for s in range(10)]
assert first == [CatchEnv().reset(seed=s)[0][1] for s in range(10)]
assert len(set(first)) > 1`,
      checks: ['`reset` seeds `random.Random`, starts the paddle in the middle and returns `((paddle, ball_x, ball_y), {})`', '`step` moves the paddle (clamped), drops the ball, terminates at row `height - 1` and pays +1 or −1 only then', 'Seeded runs repeat exactly, different seeds give different ball columns, and `truncated` is always `False`'],
      hint: 'In `reset`: `self.rng = random.Random(seed)` and draw `self.ball_x = self.rng.randrange(self.width)`. In `step`: `self.paddle = max(0, min(self.width - 1, self.paddle + action - 1))`, then `self.ball_y += 1`, then compute `terminated` and the reward only if terminated.',
      explanation: 'Compare this with the real `gym.Env` subclass earlier: the structure is identical, and only the base class, the spaces and `np_random` are missing. Writing the game logic as a plain class first is good practice anyway: you can test it quickly without any RL library, and wrapping it in `gym.Env` afterwards takes a few lines.',
    },
    {
      kind: 'code',
      prompt: 'Write `evaluate_policy(env, policy, episodes, seed=0)` for any Gymnasium-style environment (`reset(seed=...)` returning `(obs, info)` and `step(action)` returning five values). Run `episodes` episodes, resetting episode `i` with `seed=seed + i`, choosing each action with `policy(obs)` and stopping when `terminated or truncated`. Return the **mean total reward per episode** as a float (0.0 if `episodes` is 0).',
      starter: `def evaluate_policy(env, policy, episodes, seed=0):
    ...
`,
      solution: `def evaluate_policy(env, policy, episodes, seed=0):
    if episodes == 0:
        return 0.0
    total = 0.0
    for i in range(episodes):
        obs, info = env.reset(seed=seed + i)
        done = False
        while not done:
            obs, reward, terminated, truncated, info = env.step(policy(obs))
            total += reward
            done = terminated or truncated
    return total / episodes
`,
      tests: `import math

class Rec:
    def __init__(self):
        self.seeds = []

    def reset(self, seed=None):
        self.seeds.append(seed)
        self.seed = seed
        self.t = 0
        return seed, {}

    def step(self, action):
        self.t += 1
        return self.seed, 1.0 if action == 1 else 0.0, self.t == 3, False, {}

env = Rec()
assert math.isclose(evaluate_policy(env, lambda obs: 1, 3, seed=10), 3.0)
assert env.seeds == [10, 11, 12]

env = Rec()
assert math.isclose(evaluate_policy(env, lambda obs: 0, 4), 0.0)
assert env.seeds == [0, 1, 2, 3]

env = Rec()
assert math.isclose(evaluate_policy(env, lambda obs: 1 if obs % 2 == 0 else 0, 4), 1.5)

class Timeout:
    def reset(self, seed=None):
        self.t = 0
        return 0, {}

    def step(self, action):
        self.t += 1
        return 0, 2.0, False, self.t == 2, {}

assert math.isclose(evaluate_policy(Timeout(), lambda obs: 0, 5), 4.0)
assert evaluate_policy(Rec(), lambda obs: 1, 0) == 0.0
assert isinstance(evaluate_policy(Rec(), lambda obs: 1, 2), float)`,
      checks: ['Episode `i` is reset with `seed + i`, and every action comes from `policy(obs)`', 'Episodes end on `terminated or truncated` (a time-limit truncation also ends them)', 'Returns the mean total reward per episode, and 0.0 for zero episodes'],
      hint: 'Loop `for i in range(episodes)`: `obs, info = env.reset(seed=seed + i)`, then step until `terminated or truncated`, adding every reward to a running total. Divide by `episodes` at the end (after handling zero).',
      explanation: 'Fixed, consecutive seeds make evaluations repeatable and comparable between policies: both see exactly the same 200 starting situations. Evaluating with a seed range *different* from the one used in training is the simplest honest test of generalisation. This is also the helper you will wrap around every trained bot.',
    },
  ],
  takeaways: [
    'A custom environment is a `gym.Env` subclass with `observation_space`, `action_space`, `reset(seed, options)` returning `(obs, info)` and `step(action)` returning `(obs, reward, terminated, truncated, info)`. Keep the simulation headless and fast; rendering is optional.',
    'Call `super().reset(seed=seed)` and draw all randomness from `self.np_random`, so the same seed replays the same episode. Randomise starts so the policy must generalise, and end every episode with `terminated` (real endings) or `truncated` (time limits).',
    'Design observations that are **normalised**, **relative** (offset to the target, egocentric), **Markov** (velocities, timers, stacked frames), of **fixed size**, and limited to what a player could know. Good features can cut training time by orders of magnitude.',
    'Test before training: `check_env`, reproducibility, random and scripted baselines (a scripted policy that scores well proves the task and reward are sound), invariants and step speed. Register with `gym.register` for `gym.make` and a `max_episode_steps` safety net.',
    'To connect a real game: reimplement the rules in fast Python or C++ (RocketSim for Rocket League), run the engine headless with a bridge (Unity ML-Agents, Godot RL Agents), use the game’s own research API, or learn from recordings with imitation learning.',
  ],
  reading: [
    { title: 'Gymnasium documentation: Make your own custom environment', url: 'https://gymnasium.farama.org/introduction/create_custom_env/', source: 'docs', note: 'The official tutorial for subclassing gym.Env, registering and wrapping.' },
    { title: 'Stable-Baselines3 documentation: Using custom environments', url: 'https://stable-baselines3.readthedocs.io/en/master/guide/custom_env.html', source: 'docs', note: 'Requirements an environment must meet to train with SB3, and its checker.' },
    { title: 'Unity ML-Agents Toolkit documentation', url: 'https://unity-technologies.github.io/ml-agents/', source: 'docs', note: 'Connecting a Unity game to Python for RL and imitation learning.' },
    { title: 'Godot RL Agents (repository)', url: 'https://github.com/edbeeching/godot_rl_agents', source: 'repo', note: 'A bridge between the Godot engine and Python RL libraries.' },
    { title: 'PettingZoo: multi-agent environments', url: 'https://pettingzoo.farama.org/', source: 'docs', note: 'The multi-agent counterpart of Gymnasium, for games with several players.' },
  ],
};
