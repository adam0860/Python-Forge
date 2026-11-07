import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-gymnasium',
  title: 'Gymnasium: The Standard Environment API',
  summary: 'How RL code talks to a game: reset, step, observation and action spaces, terminated versus truncated, wrappers and vectorized environments. Build a Gymnasium-style environment in plain Python, then use the real library on CartPole.',
  minutes: 26,
  objectives: [
    'Use the reset/step loop and unpack the five values returned by step()',
    'Read observation and action spaces (Discrete, Box and friends) and say what network shape they imply',
    'Explain terminated versus truncated and why the difference matters for learning',
    'Use wrappers to change an environment without touching its code, and vectorized environments to collect data faster',
    'Write a Gymnasium-style environment and wrappers from scratch',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'One interface for every environment',
      blocks: [
        {
          type: 'p',
          text: 'Every RL algorithm needs the same few things from a world: a way to start it, a way to act in it, and what comes back. [[gymnasium|Gymnasium]] is the Python library that fixes this contract. OpenAI released the original **Gym** in 2016 and it quickly became the shared language of RL research. In 2022 the Farama Foundation took over its maintenance as **Gymnasium**, and almost all RL libraries (Stable-Baselines3, CleanRL, RLlib and others) now expect environments that follow it. Because the interface is standard, an algorithm written once trains on CartPole, an Atari game, a robot simulator or your own game, and an environment written once can be trained with any algorithm.',
        },
        {
          type: 'steps',
          items: [
            { title: '`env = gym.make("CartPole-v1")`', text: 'Create an environment from a registered name (extra options such as `render_mode="human"` are passed here).' },
            { title: '`obs, info = env.reset(seed=42)`', text: 'Start a new [[episode|episode]]. Returns the first observation and a dictionary of extra information. The seed makes the start reproducible.' },
            { title: '`obs, reward, terminated, truncated, info = env.step(action)`', text: 'Apply one action. **Five** values come back: the next observation, the reward, whether the episode truly ended, whether it was cut short by a time limit, and extra info.' },
            { title: '`env.close()`', text: 'Release windows, simulators and other resources when you are done.' },
          ],
        },
        {
          type: 'p',
          text: 'Two attributes describe the shapes of everything that crosses the interface. `env.observation_space` says what the observations look like and `env.action_space` says what actions are valid. These [[observation-space|spaces]] are also how you decide what kind of neural network to build.',
        },
        {
          type: 'table',
          headers: ['Space', 'Meaning', 'Example', 'Network implication'],
          rows: [
            ['`Discrete(n)`', 'One integer from 0 to n−1', 'CartPole action: push left or right (`Discrete(2)`)', 'Output n scores (Q-values or logits)'],
            ['`Box(low, high, shape)`', 'An array of real numbers within bounds', 'CartPole observation: 4 floats (`Box(..., (4,), float32)`)', 'Input size = number of floats; continuous actions output a mean (and spread)'],
            ['`MultiDiscrete([a, b, ...])`', 'Several independent integers', 'Controller with several buttons or dials', 'One output group per component'],
            ['`MultiBinary(n)`', 'n independent on/off flags', 'Which of n buttons are held', 'n independent sigmoid outputs'],
            ['`Dict` / `Tuple`', 'A structured combination of the above', 'Position array plus an inventory vector', 'Process each part, then combine'],
          ],
          caption: 'The common Gymnasium spaces.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'Gym, Gymnasium and the five-value step',
          text: 'Old tutorials return **four** values from `step`: `obs, reward, done, info`. In 2022 Gym 0.26 split `done` into `terminated` and `truncated`, and Gymnasium kept that design. Likewise `reset()` used to return only the observation and now returns `(obs, info)`, and seeding moved into `reset(seed=...)`. If a code snippet from the internet fails with "too many values to unpack" or "not enough values to unpack", it was written for the old API.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why a standard interface matters',
          text: 'RL research is a combinatorial product of algorithms and environments. A shared interface turns an M-by-N integration problem into M plus N: PPO and DQN each need only the `reset`/`step` contract, and each game needs only to implement it once. It also makes **your** game instantly usable by every library covered in this unit, and later by RLGym for Rocket League, which is a Gymnasium-like interface for exactly one game.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A training script written for an older tutorial crashes on `obs, reward, done, info = env.step(action)` with "too many values to unpack (expected 4)". What is the cause?',
      options: [
        { text: 'Gymnasium’s `step` returns five values: `obs, reward, terminated, truncated, info`', correct: true, why: 'Since the API change, `done` is split into `terminated` and `truncated`, so unpacking into four names fails.' },
        { text: 'The environment has no `reset` method', why: 'The error is about the number of values returned by `step`, not about a missing method.' },
        { text: 'The observation is a NumPy array and cannot be unpacked', why: 'The observation is a single value inside the returned tuple; the tuple itself has five items.' },
        { text: 'CartPole must be created with `render_mode="human"` first', why: 'Rendering options never change what `step` returns.' },
      ],
      explanation: 'Use `obs, reward, terminated, truncated, info = env.step(action)` and treat the episode as over when `terminated or truncated`.',
    },
    {
      kind: 'concept',
      title: 'Building the API from scratch',
      blocks: [
        {
          type: 'p',
          text: 'The best way to understand the interface is to implement it. Gymnasium-style environments are ordinary classes with `reset` and `step`, and a **wrapper** is a second object that holds an environment, exposes the same two methods and changes something on the way through. The program below builds a tiny corridor, a time-limit wrapper and a reward-scaling wrapper, then runs a policy on stacks of them. Real Gymnasium wrappers (`TimeLimit`, `TransformReward` and more) work exactly like this, and the real classes also inherit from `gym.Env` and declare their spaces, which the next lesson in Unit 10 adds for your own game.',
        },
        {
          type: 'code',
          title: 'mini_gym.py',
          runnable: true,
          code: `class Corridor:
    """A Gymnasium-style environment in plain Python: walk right to the end."""

    def __init__(self, length=5):
        self.length = length
        self.pos = 0

    def reset(self, seed=None):
        self.pos = 0
        return self.pos, {}

    def step(self, action):  # 0 = left, 1 = right
        self.pos = max(0, min(self.length, self.pos + (1 if action == 1 else -1)))
        terminated = self.pos == self.length
        reward = 1.0 if terminated else -0.01
        return self.pos, reward, terminated, False, {}


class TimeLimit:
    """Wrapper: ends the episode (truncated) after max_steps."""

    def __init__(self, env, max_steps):
        self.env, self.max_steps, self.t = env, max_steps, 0

    def reset(self, seed=None):
        self.t = 0
        return self.env.reset(seed=seed)

    def step(self, action):
        obs, reward, terminated, truncated, info = self.env.step(action)
        self.t += 1
        return obs, reward, terminated, truncated or self.t >= self.max_steps, info


class ScaleReward:
    """Wrapper: multiplies every reward by a constant."""

    def __init__(self, env, factor):
        self.env, self.factor = env, factor

    def reset(self, seed=None):
        return self.env.reset(seed=seed)

    def step(self, action):
        obs, reward, terminated, truncated, info = self.env.step(action)
        return obs, reward * self.factor, terminated, truncated, info


def rollout(env, policy):
    obs, info = env.reset(seed=0)
    total, steps = 0.0, 0
    while True:
        obs, reward, terminated, truncated, info = env.step(policy(obs))
        total, steps = total + reward, steps + 1
        if terminated or truncated:
            return steps, round(total, 2), terminated, truncated


right, left = (lambda obs: 1), (lambda obs: 0)
print(rollout(Corridor(), right))
print(rollout(TimeLimit(Corridor(), 8), left))
print(rollout(ScaleReward(TimeLimit(Corridor(), 20), 10), right))`,
          output: `(5, 0.96, True, False)
(8, -0.08, False, True)
(5, 9.6, True, False)`,
          annotations: [
            { lines: '1-6', text: 'An environment is a class with its state (`pos`) and settings (`length`). Nothing is special about it: no base class is required for this sketch.' },
            { lines: '8-10', text: '`reset` puts the world back at the start and returns the first observation and an `info` dict, exactly as Gymnasium does.' },
            { lines: '12-16', text: '`step` applies the action and returns **five** values. Reaching the end sets `terminated` and pays +1; every other step costs 0.01 to nudge the agent to hurry. `truncated` is always `False` here, because this environment has no time limit of its own.' },
            { lines: '19-23', text: 'A **wrapper** keeps the wrapped environment in `self.env` and counts steps.' },
            { lines: '25-27', text: 'Its `reset` clears the counter and forwards to the inner environment.' },
            { lines: '29-32', text: 'Its `step` forwards the action, counts, and sets **`truncated`** once the limit is reached. The inner environment never learns about the limit.' },
            { lines: '35-46', text: 'A second wrapper multiplies the reward. It has the same two methods, so wrappers can be **stacked** like Russian dolls.' },
            { lines: '49-56', text: '`rollout` is the generic interaction loop: it works with *any* object that follows the contract, base environment or stack of wrappers alike. It stops on `terminated or truncated`.' },
            { lines: '59-62', text: 'Always going right reaches the end in 5 steps (reward 1 minus four penalties of 0.01 gives 0.96, **terminated**). Always going left never gets anywhere, so the time limit stops it after 8 steps with 8 × (−0.01) = −0.08 (**truncated**). The third line stacks both wrappers: the reward is scaled by 10 (9.6) while the episode still ends by termination.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Terminated versus truncated, once more',
          text: '`terminated` is part of the **game**: the goal was reached, the car crashed, the match ended. The value of what comes next really is zero. `truncated` is part of the **harness**: a time limit or an external cut-off stopped an episode that could have continued. The future value is *not* zero, so a learning algorithm must keep bootstrapping from the next observation. Stable-Baselines3 and other libraries read these flags separately for exactly this reason. In the output above, the left-walking agent was truncated; the right-walking agent terminated.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'An episode that ends because it hit the time limit (`truncated = True`) should be treated by the learning algorithm exactly like one that ended in a goal or a death (`terminated = True`): no value is bootstrapped from the final observation.',
      answer: false,
      explanation: 'False. A time limit is not part of the game’s dynamics: the agent was not in a special end state, and it would normally have had a future. Only **termination** means the future value is zero. Treating timeouts as terminal teaches the value function that the last moments before every deadline are worthless.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the unpacking of Gymnasium’s `step` result.',
      template: `obs, reward, ___, ___, info = env.step(action)
done = terminated or truncated`,
      templateIsCode: true,
      blanks: [{ answers: ['terminated'] }, { answers: ['truncated'] }],
      wordBank: ['terminated', 'truncated', 'done', 'finished', 'timeout'],
      explanation: 'The third value says the episode truly ended (`terminated`) and the fourth that it was cut short (`truncated`). The second line combines them, because the *loop* must stop in either case.',
    },
    {
      kind: 'concept',
      title: 'The real library: CartPole, wrappers and vector environments',
      blocks: [
        {
          type: 'p',
          text: 'Everything in the mini version exists in Gymnasium, plus a large catalogue of ready-made worlds: toy text (FrozenLake, Taxi), classic control (CartPole, MountainCar, Pendulum), Box2D physics, MuJoCo robots and Atari. **CartPole** is the "hello world": balance a pole on a cart by pushing it left or right. The observation is four numbers (cart position, cart velocity, pole angle, pole angular velocity), the action is one of two pushes, and every step the pole stays up pays +1. The episode **terminates** if the pole tips too far or the cart leaves the track, and is **truncated** after 500 steps. The program below plays one episode with random actions. (Run it on your PC with `pip install gymnasium`.)',
        },
        {
          type: 'code',
          title: 'cartpole_random.py',
          desktopOnly: true,
          code: `import gymnasium as gym

env = gym.make("CartPole-v1")
print(env.observation_space)
print(env.action_space)
obs, info = env.reset(seed=42)
print(obs.shape, obs.dtype, info)
env.action_space.seed(42)
total, steps = 0.0, 0
while True:
    action = env.action_space.sample()
    obs, reward, terminated, truncated, info = env.step(action)
    total += reward
    steps += 1
    if terminated or truncated:
        break
print(steps, total, terminated, truncated)
print(env.spec.max_episode_steps, env.spec.reward_threshold)
env.close()`,
          output: `Box([-4.8               -inf -0.41887903        -inf], [4.8               inf 0.41887903        inf], (4,), float32)
Discrete(2)
(4,) float32 {}
30 30.0 True False
500 475.0`,
          annotations: [
            { lines: '3-5', text: '`make` builds the environment; its **spaces** are objects you can print. The observation is `Box` with shape `(4,)`: the position limit is ±4.8 and the pole angle ±0.419 radians (24°), while the two velocities are unbounded (±inf). The action is `Discrete(2)`.' },
            { lines: '6-7', text: '`reset(seed=42)` returns a 4-element `float32` array and an empty info dict.' },
            { lines: 8, text: 'The action space has its own random generator; seeding it makes `sample()` reproducible.' },
            { lines: '10-16', text: 'The interaction loop: sample a random action, step, add up the reward, stop on `terminated or truncated`.' },
            { lines: 17, text: 'A random agent keeps the pole up for only about 20 to 30 steps: here **30 steps, return 30.0**, ended by `terminated` (the pole fell), not by truncation.' },
            { lines: 18, text: '`env.spec` records the settings: at most **500** steps per episode, and a reward threshold of **475** at which the task counts as solved. Trained agents reach 500; random ones about 22.' },
          ],
        },
        {
          type: 'p',
          text: 'Real wrappers are used the same way as the toy ones. `RecordEpisodeStatistics` quietly adds episode length and return to `info`; `TransformReward` rescales rewards; others normalise observations, stack frames, clip actions, record video or enforce a time limit. A **vectorized environment** runs several copies in parallel and gives batched arrays: the observation becomes shape `(num_envs, 4)`, rewards and flags become arrays, and finished copies are reset for you. Batches of experience from many environments decorrelate the data and keep the GPU busy, and PPO, A2C and most modern algorithms use them.',
        },
        {
          type: 'code',
          title: 'wrappers_and_vector_envs.py',
          desktopOnly: true,
          code: `import gymnasium as gym
from gymnasium.wrappers import RecordEpisodeStatistics, TransformReward

envs = gym.make_vec("CartPole-v1", num_envs=4, vectorization_mode="sync")
obs, info = envs.reset(seed=0)
print("batched observations:", obs.shape)
print("one env's space:", envs.single_observation_space.shape, envs.single_action_space)
obs, rewards, terminated, truncated, info = envs.step(envs.action_space.sample())
print("rewards:", rewards, "terminated:", terminated)
envs.close()

env = TransformReward(RecordEpisodeStatistics(gym.make("CartPole-v1")), lambda r: r * 0.1)
env.reset(seed=1)
env.action_space.seed(1)
done = False
while not done:
    _, r, terminated, truncated, info = env.step(env.action_space.sample())
    done = terminated or truncated
print("scaled reward per step:", round(r, 2))
print("episode length:", int(info["episode"]["l"]), "raw return:", float(info["episode"]["r"]))`,
          output: `batched observations: (4, 4)
one env's space: (4,) Discrete(2)
rewards: [1. 1. 1. 1.] terminated: [False False False False]
scaled reward per step: 0.1
episode length: 29 raw return: 29.0`,
          annotations: [
            { lines: '1-2', text: 'Import the library and two built-in wrappers.' },
            { lines: '4-9', text: '`make_vec` builds 4 CartPole copies in one process (`"sync"`; use `"async"` for one process each). Observations are **batched**: shape `(4, 4)`. `single_observation_space` and `single_action_space` describe one copy, while `action_space` describes the whole batch. One `step` takes an array of 4 actions and returns arrays of 4 rewards and flags. Finished copies are reset by the vector environment itself.' },
            { lines: '12-14', text: 'Wrappers wrap from the inside out: `RecordEpisodeStatistics` is applied to the raw environment, then `TransformReward` scales every reward by 0.1 on top of it.' },
            { lines: '15-20', text: 'Each step now pays 0.1 (`scaled reward per step`), but the statistics wrapper sits *below* the scaling, so it still records the **raw** return 29.0 for the 29-step episode.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Wrapper order and seeds',
          text: 'Order matters: a normalising wrapper placed *outside* a reward-scaling wrapper sees scaled rewards, one placed *inside* sees raw ones. Seeds matter too: `reset(seed=...)` seeds the environment (initial states), while `env.action_space.seed(...)` seeds only `sample()`. Your own policy and network have their own random generators (`torch.manual_seed`, `numpy.random.default_rng`). For a reproducible experiment you must seed all of them.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this tiny hand-written environment run.',
      code: `class Counter:
    def __init__(self):
        self.n = 0

    def step(self, action):
        self.n += action
        return self.n, 1.0, self.n >= 3, False, {}

env = Counter()
total = 0.0
for a in [1, 1, 2, 5]:
    obs, reward, terminated, truncated, info = env.step(a)
    total += reward
    if terminated:
        break
print(obs, total)`,
      answer: '4 3.0',
      hint: 'The running count after each action is 1, 2, 4. When does it first reach 3 or more?',
      explanation: 'After the actions 1 and 1 the count is 2 (not terminated). The third action adds 2, making 4 ≥ 3, so `terminated` is true: the loop breaks with `obs = 4` after three steps, each paying 1.0, so `total = 3.0`. The final action 5 is never used.',
    },
    {
      kind: 'error',
      prompt: 'This snippet copied from an old tutorial crashes immediately with a `ValueError`. Tap the faulty line.',
      lines: [
        'env = gym.make("CartPole-v1")',
        'obs, info = env.reset(seed=0)',
        'obs, reward, done, info = env.step(env.action_space.sample())',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Gymnasium’s `step` returns **five** values, so unpacking into four fails with "too many values to unpack". Use `obs, reward, terminated, truncated, info = env.step(...)` and compute `done = terminated or truncated` if you need a single flag. (The `reset` line is already correct for the new API.)',
    },
    {
      kind: 'numeric',
      prompt: 'You run CartPole with 8 parallel copies in a vectorized environment. One call to `step` returns a batched observation array of shape `(8, 4)`. How many floating-point numbers does that array hold in total?',
      answer: '32',
      hint: 'Rows times columns: each of the 8 copies contributes a 4-number observation.',
      explanation: 'Shape `(8, 4)` means 8 × 4 = 32 numbers. A policy network would take this array as a batch of 8 inputs of size 4 and produce 8 actions at once.',
      label: 'Numbers:',
    },
    {
      kind: 'concept',
      title: 'A checklist before you train anything',
      blocks: [
        {
          type: 'p',
          text: 'Most "my agent does not learn" problems are environment problems, not algorithm problems. A short routine, done before a single training step, catches the majority of them.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Print the spaces', text: 'Check that `observation_space` and `action_space` are what you expect. A `Box` with unbounded or wildly different scales (positions in thousands, angles in radians) is a sign you will need normalisation.' },
            { title: 'Run a random agent', text: 'Sample random actions for a few episodes. Does it run without errors? Do episodes end? What is a typical return? This is your **baseline**: a trained agent that does not beat random is broken, and the number tells you what "improvement" means.' },
            { title: 'Check the termination logic', text: 'Make sure every episode eventually ends, and that real endings use `terminated` while time limits use `truncated`.' },
            { title: 'Check reproducibility', text: 'Reset with the same seed twice and compare the first observation. Different results mean hidden randomness you must find before comparing experiments.' },
            { title: 'Run the environment checker', text: 'Gymnasium ships `gymnasium.utils.env_checker.check_env` and Stable-Baselines3 ships its own `check_env`; both catch wrong dtypes, out-of-bounds observations and API mistakes in custom environments.' },
            { title: 'Speed-test it', text: 'RL needs millions of steps. If one `step` takes 5 ms, a million steps take over an hour of pure simulation. Vectorize, or simplify the simulation, before blaming the learner.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises build the pieces from this lesson: a reward-penalty wrapper, a frame-stacking wrapper (the standard fix for non-Markov observations from the MDP lesson) and the reset-on-finish logic that vectorized environments use.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write a wrapper class `StepPenalty(env, cost)`. It forwards `reset(seed=None)` to the wrapped environment unchanged (passing the seed on as a keyword argument, and returning its `(obs, info)`). Its `step(action)` calls the wrapped step and returns the same five values, except that the reward has `cost` subtracted.',
      starter: `class StepPenalty:
    def __init__(self, env, cost):
        ...

    def reset(self, seed=None):
        ...

    def step(self, action):
        ...
`,
      solution: `class StepPenalty:
    def __init__(self, env, cost):
        self.env = env
        self.cost = cost

    def reset(self, seed=None):
        return self.env.reset(seed=seed)

    def step(self, action):
        obs, reward, terminated, truncated, info = self.env.step(action)
        return obs, reward - self.cost, terminated, truncated, info
`,
      tests: `import math

class Stub:
    def __init__(self):
        self.last_seed = "unset"

    def reset(self, seed=None):
        self.last_seed = seed
        return 0, {"a": 1}

    def step(self, action):
        return action, 1.0, action == 3, action == 4, {"k": action}

stub = Stub()
env = StepPenalty(stub, 0.25)
assert env.reset() == (0, {"a": 1})
assert stub.last_seed is None
assert env.reset(seed=7) == (0, {"a": 1})
assert stub.last_seed == 7

obs, reward, terminated, truncated, info = env.step(2)
assert obs == 2 and math.isclose(reward, 0.75)
assert terminated is False and truncated is False and info == {"k": 2}

obs, reward, terminated, truncated, info = env.step(3)
assert terminated is True and truncated is False and math.isclose(reward, 0.75)
obs, reward, terminated, truncated, info = env.step(4)
assert terminated is False and truncated is True

env2 = StepPenalty(StepPenalty(Stub(), 0.5), 0.25)
assert math.isclose(env2.step(0)[1], 0.25)
assert math.isclose(StepPenalty(Stub(), -1.0).step(0)[1], 2.0)`,
      checks: ['`reset` forwards the seed and returns the wrapped environment’s `(obs, info)`', '`step` returns all five values with only the reward changed (`reward - cost`)', 'Wrappers can be stacked, including with a negative cost'],
      hint: 'Store `env` and `cost` in `__init__`. In `step`, unpack the five values from `self.env.step(action)` and return them with `reward - self.cost`.',
      explanation: 'This is the whole pattern behind every Gymnasium wrapper: hold the inner environment, forward the calls, change one thing. Because the wrapper has the same interface as the environment it wraps, you can stack as many as you like, and the inner environment never knows.',
    },
    {
      kind: 'code',
      prompt: 'Write a wrapper `StackObservations(env, k)` that returns the **last `k` observations** as a tuple (oldest first). `reset(seed=None)` returns `(tuple of k copies of the first observation, info)`. `step(action)` returns the stacked observations in place of the single one, and the reward, terminated, truncated and info unchanged. Resetting again must start a fresh stack. (Hint: `collections.deque(maxlen=k)` is handy.)',
      starter: `from collections import deque

class StackObservations:
    def __init__(self, env, k):
        ...

    def reset(self, seed=None):
        ...

    def step(self, action):
        ...
`,
      solution: `from collections import deque

class StackObservations:
    def __init__(self, env, k):
        self.env = env
        self.k = k
        self.frames = deque(maxlen=k)

    def reset(self, seed=None):
        obs, info = self.env.reset(seed=seed)
        self.frames.clear()
        for _ in range(self.k):
            self.frames.append(obs)
        return tuple(self.frames), info

    def step(self, action):
        obs, reward, terminated, truncated, info = self.env.step(action)
        self.frames.append(obs)
        return tuple(self.frames), reward, terminated, truncated, info
`,
      tests: `class Counter:
    def __init__(self):
        self.t = 0

    def reset(self, seed=None):
        self.t = 0
        return 0, {"reset": True}

    def step(self, action):
        self.t += 1
        return self.t, 0.5, self.t >= 5, False, {"t": self.t}

env = StackObservations(Counter(), 3)
obs, info = env.reset()
assert obs == (0, 0, 0) and info == {"reset": True}
assert isinstance(obs, tuple)

obs, reward, terminated, truncated, info = env.step(0)
assert obs == (0, 0, 1) and reward == 0.5 and terminated is False and info == {"t": 1}
assert env.step(0)[0] == (0, 1, 2)
assert env.step(0)[0] == (1, 2, 3)
assert env.step(0)[0] == (2, 3, 4)
obs, reward, terminated, truncated, info = env.step(0)
assert obs == (3, 4, 5) and terminated is True

obs, info = env.reset()
assert obs == (0, 0, 0)
assert env.step(0)[0] == (0, 0, 1)

single = StackObservations(Counter(), 1)
assert single.reset()[0] == (0,)
assert single.step(0)[0] == (1,)
assert single.step(0)[0] == (2,)`,
      checks: ['Reset returns `k` copies of the first observation as a tuple, oldest first', 'Each step appends the new observation and drops the oldest one', 'Reward, terminated, truncated and info pass through; a second reset starts a fresh stack'],
      hint: 'Create `self.frames = deque(maxlen=k)` in `__init__`. In `reset`, clear it and append the first observation `k` times; in `step`, just `append` the new observation (the deque drops the oldest automatically). Return `tuple(self.frames)`.',
      explanation: 'Stacking recent frames is how DQN learned Atari from pixels: a single image has no velocity, but several consecutive images do, which restores the Markov property you studied in the MDP lesson. `deque(maxlen=k)` makes the sliding window a one-liner.',
    },
    {
      kind: 'code',
      prompt: 'Write `step_all(envs, actions)` for a list of environments (each with Gymnasium-style `reset()` and `step(action)`). Step environment `i` with `actions[i]` and return four lists `(observations, rewards, terminated_flags, truncated_flags)`. If an environment finished (`terminated` or `truncated`), **reset it immediately** and put the observation returned by `reset()` into the list in place of the final one. The flags and reward still describe the step that just happened.',
      starter: `def step_all(envs, actions):
    ...
`,
      solution: `def step_all(envs, actions):
    observations, rewards, terminated_flags, truncated_flags = [], [], [], []
    for env, action in zip(envs, actions):
        obs, reward, terminated, truncated, info = env.step(action)
        if terminated or truncated:
            obs, info = env.reset()
        observations.append(obs)
        rewards.append(reward)
        terminated_flags.append(terminated)
        truncated_flags.append(truncated)
    return observations, rewards, terminated_flags, truncated_flags
`,
      tests: `class Line:
    def __init__(self, length):
        self.length = length
        self.pos = 0
        self.resets = 0

    def reset(self, seed=None):
        self.pos = 0
        self.resets += 1
        return self.pos, {}

    def step(self, action):
        self.pos += action
        done = self.pos >= self.length
        return self.pos, 1.0 if done else 0.0, done, False, {}

class Timeout:
    def __init__(self):
        self.t = 0

    def reset(self, seed=None):
        self.t = 0
        return -1, {}

    def step(self, action):
        self.t += 1
        return 10 + self.t, 0.0, False, self.t >= 2, {}

a, b = Line(2), Line(3)
a.reset(); b.reset()
obs, rew, term, trunc = step_all([a, b], [1, 1])
assert obs == [1, 1] and rew == [0.0, 0.0] and term == [False, False] and trunc == [False, False]
obs, rew, term, trunc = step_all([a, b], [1, 1])
assert obs == [0, 2]
assert rew == [1.0, 0.0] and term == [True, False] and trunc == [False, False]
assert a.resets == 2 and b.resets == 1

t = Timeout()
t.reset()
obs, rew, term, trunc = step_all([t], [0])
assert obs == [11] and trunc == [False]
obs, rew, term, trunc = step_all([t], [0])
assert obs == [-1] and trunc == [True] and term == [False]
assert t.t == 0

assert step_all([], []) == ([], [], [], [])
out = step_all([Line(1)], [1])
assert all(isinstance(x, list) for x in out)`,
      checks: ['Steps each environment with its own action and collects four lists in order', 'Resets any environment that terminated or truncated and reports the **reset** observation', 'Reward and flags still describe the step that just ended'],
      hint: 'Loop with `zip(envs, actions)`. After `env.step(action)`, `if terminated or truncated:` replace `obs` with `env.reset()[0]` (or unpack `obs, info = env.reset()`), then append to the four lists.',
      explanation: 'This is the heart of every vectorized environment. Collecting experience never has to pause for a reset: the batch keeps flowing, and each environment starts a new episode the moment it ends. (Libraries differ in the details: Stable-Baselines3 resets in the same step, as here, and also stores the true final observation in `info`; Gymnasium’s own vector environments by default perform the reset on the following step.)',
    },
  ],
  takeaways: [
    '**Gymnasium** is the standard interface between RL algorithms and environments: `obs, info = env.reset(seed=...)` and `obs, reward, terminated, truncated, info = env.step(action)`. Old Gym tutorials return four values and fail on the new API.',
    '`observation_space` and `action_space` (`Discrete`, `Box`, `MultiDiscrete`, ...) tell you what network to build: input size from the observation, output units (or Gaussian parameters) from the action.',
    '**terminated** is a real end of the game (the future is worth zero); **truncated** is a time limit (the future is not zero, so keep bootstrapping). Stop the loop on either one, learn differently from each.',
    '**Wrappers** change an environment without editing it (time limits, reward scaling, frame stacking, statistics) and stack like Russian dolls; **vectorized environments** run many copies at once, with batched arrays and automatic resets.',
    'Before training, **print the spaces, run a random-agent baseline, check endings and seeds, run the environment checker, and measure the step speed**. Most "the agent does not learn" bugs live in the environment.',
  ],
  reading: [
    { title: 'Gymnasium documentation: Basic usage', url: 'https://gymnasium.farama.org/introduction/basic_usage/', source: 'docs', note: 'The reset/step loop, spaces and the terminated/truncated distinction, from the maintainers.' },
    { title: 'Gymnasium documentation: Environment creation', url: 'https://gymnasium.farama.org/introduction/create_custom_env/', source: 'docs', note: 'Subclassing gym.Env, the pattern the next unit uses for your own game.' },
    { title: 'Towers et al.: Gymnasium, a standard interface for reinforcement learning environments (2024)', url: 'https://arxiv.org/abs/2407.17032', source: 'paper', note: 'The design of the API, its history and its wrappers.' },
    { title: 'Brockman et al.: OpenAI Gym (2016)', url: 'https://arxiv.org/abs/1606.01540', source: 'paper', note: 'The original paper that created the shared interface.' },
    { title: 'Hugging Face Deep RL Course: Unit 1', url: 'https://huggingface.co/learn/deep-rl-course/unit1/introduction', source: 'course', note: 'A hands-on first agent trained on a Gymnasium environment.' },
  ],
};
