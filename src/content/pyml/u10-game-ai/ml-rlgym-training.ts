import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-rlgym-training',
  title: 'Training a Rocket League Bot',
  summary: 'Turn an RLGym environment into a trained bot: the parallel training pipeline, the community rlgym-ppo trainer, a do-it-yourself Stable-Baselines3 route you can run today, how to pick gamma and tick skip, and how to read training curves and avoid classic failures.',
  minutes: 30,
  objectives: [
    'Describe how large-scale PPO training collects experience with many simulator processes and one learner',
    'Train a policy on an RLGym environment with Stable-Baselines3 through a Gymnasium wrapper, and with rlgym-ppo',
    'Choose a discount factor from a time horizon and a tick skip, and explain why batch size matters',
    'Estimate the compute a training run needs from measured simulator throughput',
    'Normalise observations and returns correctly, including at deployment time',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The training pipeline and its scale',
      blocks: [
        {
          type: 'p',
          text: 'You now have an environment (the previous two lessons) and an algorithm ([[ppo|PPO]]). Training a Rocket League bot is the job of connecting them efficiently, and the main obstacle is **scale**. Learning to drive, hit the ball and score from nothing but a reward takes a *very* large amount of experience: hobby bots start to look competent after hundreds of millions of steps, and the strongest community bots have seen billions. So the whole design of a trainer is about turning CPU time into experience as fast as possible.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Many simulator workers', text: 'RocketSim is CPU-bound and single-threaded, so the trainer starts one worker process per physical core. Each worker owns its own `RLGym` environment and plays matches continuously.' },
            { title: 'Batched inference', text: 'Workers send their observations to the learner, which runs the policy network once on a whole *batch* of observations (on a GPU if there is one) and sends the actions back. One big matrix multiplication is far cheaper than many small ones.' },
            { title: 'A rollout buffer', text: 'The experience (observation, action, reward, done, log-probability) is collected until a fixed number of timesteps has been gathered, for example 50 000 per iteration.' },
            { title: 'A PPO update', text: 'The learner computes advantages (GAE), then runs a few epochs of minibatch gradient steps with PPO’s clipped objective, updating the policy and the value network.' },
            { title: 'Repeat, log and checkpoint', text: 'The new weights go back to the workers and the cycle repeats. Metrics (mean reward, entropy, value loss, steps per second) are logged, and the model is saved every N timesteps so you can resume, compare and test checkpoints.' },
          ],
        },
        {
          type: 'p',
          text: 'How fast is the simulation? The program below measures it on your own machine: it steps a 1v1 environment with random actions for five seconds and extrapolates to all your cores. RocketSim does roughly ten thousand agent-steps per second *per core* on a typical CPU, so a machine with 16 cores can generate a few hundred thousand steps per second, which is a billion steps in an hour or two of pure simulation. In practice the learner (network updates and communication) is often the real bottleneck.',
        },
        {
          type: 'code',
          title: 'measure_throughput.py',
          lang: 'python',
          desktopOnly: true,
          outputVaries: true,
          code: `import time
import os

import numpy as np
from rlgym.api import RLGym
from rlgym.rocket_league.action_parsers import LookupTableAction, RepeatAction
from rlgym.rocket_league.done_conditions import AnyCondition, GoalCondition, NoTouchTimeoutCondition, TimeoutCondition
from rlgym.rocket_league.obs_builders import DefaultObs
from rlgym.rocket_league.reward_functions import CombinedReward, GoalReward, TouchReward
from rlgym.rocket_league.sim import RocketSimEngine
from rlgym.rocket_league.state_mutators import FixedTeamSizeMutator, KickoffMutator, MutatorSequence


def make_env():
    return RLGym(
        state_mutator=MutatorSequence(FixedTeamSizeMutator(blue_size=1, orange_size=1), KickoffMutator()),
        obs_builder=DefaultObs(zero_padding=None),
        action_parser=RepeatAction(LookupTableAction(), repeats=8),
        reward_fn=CombinedReward((GoalReward(), 10.0), (TouchReward(), 0.1)),
        termination_cond=GoalCondition(),
        truncation_cond=AnyCondition(TimeoutCondition(300.0), NoTouchTimeoutCondition(30.0)),
        transition_engine=RocketSimEngine(),
    )


def run(seconds):
    env = make_env()
    rng = np.random.default_rng()
    env.reset()
    steps, start = 0, time.perf_counter()
    while time.perf_counter() - start < seconds:
        obs, rewards, terminated, truncated = env.step({a: rng.integers(90, size=1) for a in env.agents})
        steps += 1
        if any(terminated.values()) or any(truncated.values()):
            env.reset()
    env.close()
    return steps * len(env.agents) / seconds  # agent-steps per second


single = run(5.0)
cores = os.cpu_count()
print(f"1 process : {single:,.0f} agent-steps per second")
print(f"{cores} cores    : about {single * cores:,.0f} per second if it scales linearly")
print(f"1 billion steps would take about {1e9 / (single * cores) / 3600:.0f} hours of pure simulation")`,
          output: `1 process : 13,874 agent-steps per second
2 cores    : about 27,749 per second if it scales linearly
1 billion steps would take about 10 hours of pure simulation`,
          annotations: [
            { lines: '14-23', text: '`make_env` builds the same stock 1v1 environment as in the previous lesson. Every worker process of a real trainer does exactly this once.' },
            { lines: '26-30', text: '`run` plays random actions for a fixed number of seconds and counts how many environment steps it completed.' },
            { lines: '31-36', text: 'When an episode ends (goal or timeout), reset and carry on, so the timer measures sustained throughput including resets.' },
            { lines: 37, text: 'Each step produces experience for *both* cars, so agent-steps per second is the number of steps times the number of agents. The self-play lesson explains why both cars’ experience can train one policy.' },
            { lines: '40-44', text: 'Multiply by the core count (this assumes linear scaling, which is optimistic) to estimate how long a billion steps takes. The numbers shown are from a small 2-core machine and will differ on yours.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Budget before you start',
          text: '**Always do this arithmetic first**: `hours = target_steps / (steps_per_second × 3600)`. If your measured end-to-end speed is 20 000 steps per second, 500 million steps take about 7 hours, while a billion takes about 14. Decide whether your goal (a bot that just drives to the ball, or one that plays a whole game) fits your hardware and your patience, and start with the smallest experiment that can answer your question.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A trainer runs 24 RocketSim worker processes on a 24-core CPU, plus one learner process with a GPU. Why does the learner collect observations from all workers and run the neural network on them *as one batch*?',
      options: [
        { text: 'A single large matrix multiplication on the GPU is far cheaper per observation than many tiny ones, and the workers (which are CPU-bound) never have to touch the network', correct: true, why: 'Batched inference is the central efficiency trick: the GPU is good at big batches and poor at one observation at a time, while the simulator workers stay free to simulate.' },
        { text: 'PPO is mathematically invalid unless all workers act on the same observation', why: 'The workers have different games and observations. PPO only needs the experience to be collected under the current policy.' },
        { text: 'RocketSim can only simulate one match at a time per machine', why: 'Each worker process runs its own independent simulation; that is the point of using many processes.' },
        { text: 'It makes the policy deterministic, which PPO requires', why: 'PPO needs a *stochastic* policy to explore. Batching does not change what the policy computes, only where and when.' },
      ],
      explanation: 'The pipeline is built around two facts: simulation is CPU-bound and parallelises across processes, and neural-network inference is most efficient in big batches. One learner serves many workers.',
    },
    {
      kind: 'concept',
      title: 'Route A: rlgym-ppo, the community trainer',
      blocks: [
        {
          type: 'p',
          text: '**rlgym-ppo** is a community-built PPO trainer designed exactly for the pipeline above. It manages the worker processes, batched inference, the PPO update, checkpointing and logging (including optional Weights & Biases dashboards), so your part is to supply a function that builds one environment. It is not on PyPI: you install it from its GitHub repository (`pip install git+https://github.com/AechPro/rlgym-ppo`), after installing a PyTorch build that matches your GPU. Its repository includes an RLGym v2 example, which is the best starting point; the code below follows that example in shape, but the project is under active development, so check the example for the current argument names before you copy it.',
        },
        {
          type: 'code',
          title: 'train_with_rlgym_ppo.py',
          lang: 'python',
          desktopOnly: true,
          code: `from rlgym.api import RLGym
from rlgym.rocket_league.action_parsers import LookupTableAction, RepeatAction
from rlgym.rocket_league.done_conditions import GoalCondition, NoTouchTimeoutCondition
from rlgym.rocket_league.obs_builders import DefaultObs
from rlgym.rocket_league.reward_functions import CombinedReward, GoalReward, TouchReward
from rlgym.rocket_league.sim import RocketSimEngine
from rlgym.rocket_league.state_mutators import FixedTeamSizeMutator, KickoffMutator, MutatorSequence
from rlgym_ppo import Learner
from rlgym_ppo.util import RLGymV2GymWrapper


def build_env():
    """Each worker process calls this to make its own environment."""
    env = RLGym(
        state_mutator=MutatorSequence(FixedTeamSizeMutator(blue_size=1, orange_size=1), KickoffMutator()),
        obs_builder=DefaultObs(zero_padding=None),
        action_parser=RepeatAction(LookupTableAction(), repeats=8),
        reward_fn=CombinedReward((GoalReward(), 10.0), (TouchReward(), 0.1)),
        termination_cond=GoalCondition(),
        truncation_cond=NoTouchTimeoutCondition(timeout_seconds=10.0),
        transition_engine=RocketSimEngine(),
    )
    return RLGymV2GymWrapper(env)


if __name__ == "__main__":  # required: the learner starts worker processes
    n_proc = 16
    learner = Learner(
        build_env,
        n_proc=n_proc,
        min_inference_size=max(1, int(round(n_proc * 0.9))),
        ts_per_iteration=50_000,
        exp_buffer_size=150_000,
        ppo_batch_size=50_000,
        ppo_minibatch_size=25_000,
        ppo_epochs=2,
        ppo_ent_coef=0.001,
        standardize_returns=True,
        standardize_obs=False,
        save_every_ts=1_000_000,
        timestep_limit=1_000_000_000,
        log_to_wandb=False,
    )
    learner.learn()`,
          annotations: [
            { lines: '12-13', text: 'The learner calls `build_env` once in every worker process, so the function must create a fresh environment each time. Nothing is shared between processes.' },
            { lines: '14-22', text: 'The same components as in the first RLGym lesson: a 1v1 match, kickoff starts, 8-tick repeat, goal and touch rewards, a goal terminates the episode and 10 seconds without a touch truncates it.' },
            { lines: 23, text: '`RLGymV2GymWrapper` adapts the dictionary-based RLGym API to the interface the trainer expects.' },
            { lines: 26, text: 'The `if __name__ == "__main__"` guard is mandatory: worker processes re-import this file, and without the guard each one would try to launch a learner of its own.' },
            { lines: '27-31', text: '`n_proc` workers run in parallel (use roughly your number of physical cores). `min_inference_size` is how many workers must have an observation ready before the learner runs one batched forward pass; about 90% of `n_proc` is typical.' },
            { lines: '32-33', text: '`ts_per_iteration` is how many timesteps to collect before each update; `exp_buffer_size` is how much past experience the buffer keeps for the update.' },
            { lines: '34-36', text: 'PPO settings: the batch size for one update, the minibatch size for each gradient step (smaller minibatches give more steps per batch) and the number of passes (epochs) over the batch.' },
            { lines: 37, text: '`ppo_ent_coef` is the entropy bonus: it keeps the policy from becoming deterministic too early. Small values (0.001 to 0.01) are usual.' },
            { lines: '38-39', text: '`standardize_returns` rescales the value targets using running statistics, which keeps value learning stable whatever the reward scale. Observation standardisation is off because `DefaultObs` is already normalised.' },
            { lines: '40-41', text: 'Save a checkpoint every million timesteps, and stop after a billion.' },
            { lines: 44, text: '`learn()` runs until the timestep limit or until you stop it with Ctrl+C; it saves and can be resumed from its latest checkpoint.' },
          ],
        },
        {
          type: 'table',
          headers: ['Setting', 'What it controls', 'Rule of thumb'],
          rows: [
            ['`n_proc`', 'Number of simulator worker processes', 'About your physical core count; more processes than cores only add overhead'],
            ['`ts_per_iteration`, `ppo_batch_size`', 'Experience gathered per update, and the batch the update uses', 'Large (tens of thousands or more): Rocket League rewards are noisy, so big batches give steadier gradients'],
            ['`ppo_minibatch_size`', 'Samples per gradient step', 'Smaller means more steps per batch, but noisier ones'],
            ['`ppo_epochs`', 'Passes over the batch per update', 'Few (1 to 3): more passes drift the policy far from the one that collected the data, which PPO’s clip then wastes'],
            ['`ppo_ent_coef`', 'Entropy bonus (exploration)', 'Start around 0.01 and lower it as the bot improves; too high and it never commits'],
            ['`gamma`', 'Discount factor', 'Derived from a time horizon and the tick skip (next section)'],
            ['Learning rate', 'Size of each gradient step', 'Around 1e-4 to 3e-4 is a common start; lower it if training is unstable'],
            ['Network size', 'Policy and value network width and depth', 'Rocket League bots often use a few layers of 256 to 2048 units; start small and grow'],
          ],
          caption: 'Settings that matter most when training. Treat the values as starting points: change one at a time and compare against a baseline run.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'When an RLGym episode is cut off by a timeout (truncation), PPO should treat the final state as a terminal state whose value is zero.',
      answer: false,
      explanation: 'False. A timeout is an artefact of the time limit, not part of the task: the car would have kept playing, so the final state still has a real value. Treating it as terminal teaches the value network that "being at the end of a time limit" is worth nothing, which biases learning. Correct implementations bootstrap from the value of the last state when an episode is *truncated*, and use zero only when it is *terminated* (a goal). This is why RLGym separates the two done conditions.',
    },
    {
      kind: 'fill',
      prompt: 'Which PPO argument adds a bonus for keeping the policy random, so that the agent keeps exploring?',
      template: `model = PPO("MlpPolicy", env, gamma=0.99, ___=0.01)`,
      templateIsCode: true,
      blanks: [{ answers: ['ent_coef'] }],
      wordBank: ['ent_coef', 'n_steps', 'batch_size', 'clip_range'],
      explanation: '`ent_coef` is the **entropy coefficient**. The entropy of a policy measures how spread out its action probabilities are; adding `ent_coef × entropy` to the objective rewards the policy for staying exploratory. Too little and the policy collapses to a few actions early; too much and it never settles.',
    },
    {
      kind: 'concept',
      title: 'Route B: Stable-Baselines3 on a Gymnasium wrapper',
      blocks: [
        {
          type: 'p',
          text: 'You do not need a special trainer to start. Stable-Baselines3 (the library from the PPO lesson) trains on any Gymnasium environment, and a small wrapper turns a single-agent RLGym setup into one: one blue car, the ball, no opponent. The class below does exactly that. Its `reset` and `step` translate between Gymnasium’s single values and RLGym’s dictionaries keyed by agent id. It runs on one process, so it is far slower than `rlgym-ppo`, but it is simple and easy to debug, which makes it a good way to **test a reward function before scaling up**.',
        },
        {
          type: 'code',
          title: 'train_with_sb3.py',
          lang: 'python',
          desktopOnly: true,
          outputVaries: true,
          code: `import random
import time

import gymnasium as gym
import numpy as np
from gymnasium import spaces
from stable_baselines3 import PPO

from rlgym.api import RLGym, RewardFunction
from rlgym.rocket_league.action_parsers import LookupTableAction, RepeatAction
from rlgym.rocket_league.common_values import CAR_MAX_SPEED
from rlgym.rocket_league.done_conditions import AnyCondition, GoalCondition, NoTouchTimeoutCondition, TimeoutCondition
from rlgym.rocket_league.obs_builders import DefaultObs
from rlgym.rocket_league.reward_functions import CombinedReward, GoalReward, TouchReward
from rlgym.rocket_league.sim import RocketSimEngine
from rlgym.rocket_league.state_mutators import FixedTeamSizeMutator, KickoffMutator, MutatorSequence


class SpeedTowardBallReward(RewardFunction):
    def reset(self, agents, initial_state, shared_info):
        pass

    def get_rewards(self, agents, state, is_terminated, is_truncated, shared_info):
        rewards = {}
        for agent in agents:
            car = state.cars[agent].physics
            to_ball = state.ball.position - car.position
            direction = to_ball / (np.linalg.norm(to_ball) + 1e-6)
            rewards[agent] = float(np.clip(np.dot(car.linear_velocity, direction) / CAR_MAX_SPEED, -1.0, 1.0))
        return rewards


class SoloRocketLeague(gym.Env):
    """One blue car, one ball, no opponent: a single-agent Gymnasium view of RLGym."""

    def __init__(self):
        self.rlgym = RLGym(
            state_mutator=MutatorSequence(FixedTeamSizeMutator(blue_size=1, orange_size=0), KickoffMutator()),
            obs_builder=DefaultObs(zero_padding=None),
            action_parser=RepeatAction(LookupTableAction(), repeats=8),
            reward_fn=CombinedReward((SpeedTowardBallReward(), 0.05), (TouchReward(), 0.5), (GoalReward(), 10.0)),
            termination_cond=GoalCondition(),
            truncation_cond=AnyCondition(TimeoutCondition(30.0), NoTouchTimeoutCondition(10.0)),
            transition_engine=RocketSimEngine(),
        )
        self.agent = "blue-0"
        obs_size = len(self.rlgym.reset()[self.agent])  # DefaultObs without padding only knows its size after a reset
        self.observation_space = spaces.Box(-np.inf, np.inf, shape=(obs_size,), dtype=np.float32)
        self.action_space = spaces.Discrete(self.rlgym.action_space(self.agent)[1])

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        obs = self.rlgym.reset()
        return obs[self.agent].astype(np.float32), {}

    def step(self, action):
        obs, rewards, terminated, truncated = self.rlgym.step({self.agent: np.array([action])})
        return (obs[self.agent].astype(np.float32), rewards[self.agent],
                bool(terminated[self.agent]), bool(truncated[self.agent]), {})

    def close(self):
        self.rlgym.close()


def evaluate(env, policy, episodes=20):
    """Average episode return of a policy (a function from observation to action)."""
    total = 0.0
    for _ in range(episodes):
        obs, _ = env.reset()
        done = False
        while not done:
            obs, reward, terminated, truncated, _ = env.step(policy(obs))
            total += reward
            done = terminated or truncated
    return total / episodes


random.seed(0)
env = SoloRocketLeague()
rng = np.random.default_rng(0)
print(f"random policy : mean return {evaluate(env, lambda o: int(rng.integers(90))):.2f}")

model = PPO("MlpPolicy", env, n_steps=2048, batch_size=256, gamma=0.99, ent_coef=0.01, seed=0, verbose=0)
start = time.time()
model.learn(total_timesteps=100_000)
print(f"100,000 training steps took {time.time() - start:.0f} seconds")
print(f"trained policy: mean return {evaluate(env, lambda o: int(model.predict(o, deterministic=True)[0])):.2f}")
env.close()`,
          output: `random policy : mean return -0.08
100,000 training steps took 82 seconds
trained policy: mean return 0.36`,
          annotations: [
            { lines: '19-30', text: 'A dense reward: speed towards the ball, normalised to [−1, 1] (the custom reward from the previous lesson).' },
            { lines: 33, text: 'The wrapper subclasses `gym.Env`, so any Gymnasium-compatible trainer can use it.' },
            { lines: '37-45', text: 'One blue car and no orange car. The reward is a weighted sum: a small dense term (0.05), a touch bonus (0.5) and the big goal reward (10): the hierarchy of scales from the reward-design lesson. A 30-second limit and a 10-second no-touch limit truncate episodes.' },
            { lines: '46-49', text: 'The wrapper declares the Gymnasium spaces. `DefaultObs` without padding only knows its length after a first reset, so we reset once to measure it; the action space is the 90-action lookup table.' },
            { lines: '51-54', text: '`reset` returns the single agent’s observation, converted to the `float32` array Stable-Baselines3 expects.' },
            { lines: '56-59', text: '`step` wraps the action in the dictionary RLGym expects (`{agent: np.array([action])}`) and unwraps the dictionaries it returns: observation, reward, terminated, truncated.' },
            { lines: '65-75', text: 'A small evaluation helper: play episodes with a policy (any function from observation to action) and average the total reward.' },
            { lines: '78-81', text: 'Seed the generators, then measure a random policy first: a baseline tells you whether training achieved anything.' },
            { lines: '83-85', text: 'Standard PPO with `gamma=0.99` and a small entropy bonus, trained for 100 000 steps (about 82 seconds here).' },
            { lines: '86-87', text: 'The random policy averages roughly zero return. After 100 000 steps the trained one has learned to drive towards the ball (return about 0.36). That is a smoke test, not a good bot: real skill (hitting the ball towards the goal, using boost and aerials) takes hundreds of millions of steps. Exact numbers vary from run to run.' },
          ],
        },
        {
          type: 'p',
          text: 'Two details deserve a closer look. First, **gamma**. The discount factor sets the agent’s effective planning horizon: about `1 / (1 − γ)` *decisions*. With tick skip 8 the agent decides 15 times per second, so γ = 0.99 corresponds to about 100 decisions, or 6.7 seconds of game time. That is a sensible horizon for “drive to the ball, hit it, follow through”. A γ of 0.9 would see only about 0.7 seconds ahead (too short to plan a shot), while 0.999 would look 67 seconds ahead (too long, and the value targets become noisy). When you change the tick skip you should change γ with it so that the horizon *in seconds* stays the same.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why a huge batch helps in Rocket League',
          text: 'Policy-gradient updates are noisy because each reward depends on long chains of random events: where the ball bounced, what the opponent did. Averaging over tens of thousands of timesteps cancels much of that noise, so each gradient points more reliably in a useful direction, and you can take it with a larger learning rate. The cost is that every update needs more experience, which is affordable only because simulation is cheap and parallel. On a small budget, smaller batches give more (noisier) updates per hour and can be the better trade.',
        },
        {
          type: 'p',
          text: 'Second, **normalisation**. Neural networks learn best from inputs and targets of moderate size. `DefaultObs` already divides positions and velocities by their maximum values, so observations are roughly within ±1. If you build your own observation, either scale it yourself or keep a **running mean and variance** and standardise with it. The statistics are part of the model: at deployment time you must apply the *same* standardisation as in training, so save them with the network. Forgetting this is one of the most common reasons why a bot that trained well plays like a stranger in the real game.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output: the effective horizon of γ = 0.99 in decisions and, at 15 decisions per second, in seconds.',
      code: `gamma = 0.99
decisions_per_second = 15
horizon = 1 / (1 - gamma)
print(round(horizon), round(horizon / decisions_per_second, 1))`,
      answer: '100 6.7',
      hint: '1 / (1 − 0.99) = 100 decisions.',
      explanation: '1 / (1 − 0.99) = 100 decisions (with a tiny floating-point error that `round` removes), and 100 / 15 = 6.67 seconds, which `round(..., 1)` prints as `6.7`. The horizon in seconds is what you want to think about; γ is just the knob that sets it for a given decision rate.',
    },
    {
      kind: 'error',
      prompt: 'A bot trains well with standardised observations, but after export it plays terribly in a test match. Tap the faulty line.',
      lines: [
        'norm = RunningNorm(72)',
        'norm.update(rollout_obs)',
        'train_policy(norm.normalize(rollout_obs))',
        'save_policy(policy, "bot.pt")',
        'action = policy(live_obs)',
      ],
      linesAreCode: true,
      errorLines: [5],
      explanation: 'During training the network only ever saw *standardised* observations, but line 5 feeds it raw ones at play time, so its inputs are on a completely different scale. The live observation must go through the same normaliser (`policy(norm.normalize(live_obs))`), which means the running mean and variance have to be saved together with the network weights in line 4.',
    },
    {
      kind: 'numeric',
      prompt: 'A training machine sustains **20 000** timesteps per second end to end. How many **hours** does it take to collect **720 million** timesteps?',
      answer: '10',
      hint: '720 000 000 / 20 000 = 36 000 seconds. Divide by 3600.',
      explanation: '720 000 000 / 20 000 = 36 000 seconds, and 36 000 / 3600 = **10 hours**. This calculation, done before you start, tells you whether a plan is realistic: at that speed a billion steps would take about 14 hours, and ten billion almost six days.',
      label: 'Hours:',
    },
    {
      kind: 'concept',
      title: 'Reading the curves and avoiding classic failures',
      blocks: [
        {
          type: 'p',
          text: 'A training run produces curves. Learning to read them is how you notice a problem on hour two instead of day four. The most useful ones are the **mean episode return** (and each reward term separately, from the reward-design lesson), the **policy entropy**, the **value loss**, the **episode length**, and the number of **timesteps per second**.',
        },
        {
          type: 'table',
          headers: ['Symptom', 'Likely cause', 'What to try'],
          rows: [
            ['Return never rises from zero', 'Reward too sparse, or an observation or action bug', 'Test the reward with scripted agents; add a dense term; start with an easy curriculum'],
            ['Return rises, goals do not', 'A small term is being farmed (reward hacking)', 'Log the terms separately; reduce or remove the exploited term; use potential-based shaping'],
            ['Entropy collapses to nearly zero early', 'Entropy bonus too small, learning rate too high, or an early good-enough habit', 'Raise `ent_coef`, lower the learning rate, increase the batch size'],
            ['Value loss explodes or oscillates', 'Reward scale too large or unnormalised returns', 'Standardise returns; scale rewards; lower the learning rate'],
            ['Bot is good in training, bad in the real game', 'Missing observation normalisation at deployment, a different tick rate or action mapping, or the sim-to-real gap', 'Save the normaliser, test the exact exported model, compare behaviour frame by frame'],
            ['Progress plateaus after an early gain', 'A local optimum; opponent too easy or too similar', 'Self-play with a pool of past versions (next lesson); curriculum; reward tweaks'],
            ['Steps per second suddenly drops', 'The learner or inference is the bottleneck, or workers are starved', 'Profile; match `n_proc` to cores; increase batch and inference sizes'],
          ],
          caption: 'A troubleshooting table for RL training. Change one thing at a time and keep a baseline.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Evaluate against fixed opponents, not just the training reward',
          text: 'The training reward changes as the opponent changes, so it tells you little about progress in self-play. Keep a small **test bench**: scripted opponents (do nothing, drive at the ball, a simple ball-chaser), and saved checkpoints of your own bot. Every so often play the newest model against them for a fixed number of games and record the win rate. A rising win rate against *fixed* opponents is the honest sign of progress.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises implement training utilities: choosing gamma from a horizon, a running normaliser, and PPO minibatch splitting.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `gamma_for_horizon(seconds, decisions_per_second)`. The effective horizon of a discount factor γ is `1 / (1 - γ)` decisions. Return the γ whose horizon is `seconds` of game time at `decisions_per_second` decisions per second: `1 - 1 / (seconds * decisions_per_second)`. Raise `ValueError` if the horizon would be shorter than one decision (that is, `seconds * decisions_per_second <= 1`).',
      starter: `def gamma_for_horizon(seconds, decisions_per_second):
    ...
`,
      solution: `def gamma_for_horizon(seconds, decisions_per_second):
    horizon = seconds * decisions_per_second
    if horizon <= 1:
        raise ValueError("horizon must be longer than one decision")
    return 1.0 - 1.0 / horizon
`,
      tests: `import math

assert math.isclose(gamma_for_horizon(6.0, 15), 1 - 1 / 90)
assert math.isclose(gamma_for_horizon(10, 10), 0.99)
assert math.isclose(gamma_for_horizon(1, 120), 1 - 1 / 120)
assert math.isclose(gamma_for_horizon(2.0, 1.0), 0.5)
assert 0.0 < gamma_for_horizon(1.5, 2) < 1.0
assert gamma_for_horizon(100, 100) > gamma_for_horizon(10, 100)

# round trip: the horizon implied by the result is the one requested
g = gamma_for_horizon(6.0, 15)
assert math.isclose(1 / (1 - g) / 15, 6.0)

for bad in [(1, 1), (0.5, 1), (0.01, 10)]:
    try:
        gamma_for_horizon(*bad)
        raise SystemExit("expected ValueError for %r" % (bad,))
    except ValueError:
        pass`,
      checks: ['Returns `1 - 1 / (seconds * decisions_per_second)`', 'The implied horizon `1 / (1 - gamma)` equals the requested one', 'Raises `ValueError` when the horizon is one decision or shorter'],
      hint: 'Compute `horizon = seconds * decisions_per_second` first, check `horizon <= 1`, then return `1.0 - 1.0 / horizon`.',
      explanation: 'This is the calculation to run whenever you change the tick skip. At 15 decisions per second a six-second horizon needs γ ≈ 0.9889; if you halve the tick skip to 4 (30 decisions per second) you need γ ≈ 0.9944 to keep the same six seconds. Thinking in seconds rather than in raw γ values keeps experiments comparable.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `RunningNorm(size)` that keeps a running mean and variance of vectors using batches. `update(batch)` takes a NumPy array of shape `(n, size)` and merges it into the statistics (the result must equal the mean and population variance of **all** rows seen so far, however they were split into batches). `normalize(x, clip=10.0)` returns `(x - mean) / sqrt(var + 1e-8)` clipped to `[-clip, clip]`. Start with mean 0 and variance 1 (and a count of 0).',
      starter: `import numpy as np


class RunningNorm:
    def __init__(self, size):
        ...

    def update(self, batch):
        ...

    def normalize(self, x, clip=10.0):
        ...
`,
      solution: `import numpy as np


class RunningNorm:
    def __init__(self, size):
        self.mean = np.zeros(size)
        self.var = np.ones(size)
        self.count = 0

    def update(self, batch):
        batch = np.asarray(batch, dtype=float)
        n = batch.shape[0]
        if n == 0:
            return
        batch_mean = batch.mean(axis=0)
        batch_var = batch.var(axis=0)
        total = self.count + n
        delta = batch_mean - self.mean
        new_mean = self.mean + delta * n / total
        m_a = self.var * self.count
        m_b = batch_var * n
        m2 = m_a + m_b + delta ** 2 * self.count * n / total
        self.mean = new_mean
        self.var = m2 / total
        self.count = total

    def normalize(self, x, clip=10.0):
        z = (np.asarray(x, dtype=float) - self.mean) / np.sqrt(self.var + 1e-8)
        return np.clip(z, -clip, clip)
`,
      packages: ['numpy'],
      tests: `import numpy as np

rng = np.random.default_rng(1)
data = rng.normal(loc=[5.0, -3.0, 100.0], scale=[2.0, 0.5, 30.0], size=(1000, 3))

norm = RunningNorm(3)
assert norm.count == 0
assert np.allclose(norm.mean, 0.0) and np.allclose(norm.var, 1.0)

for chunk in (data[:1], data[1:300], data[300:301], data[301:]):
    norm.update(chunk)

assert norm.count == 1000
assert np.allclose(norm.mean, data.mean(axis=0))
assert np.allclose(norm.var, data.var(axis=0))

z = norm.normalize(data)
assert z.shape == (1000, 3)
assert np.allclose(z.mean(axis=0), 0.0, atol=1e-6)
assert np.allclose(z.std(axis=0), 1.0, atol=1e-3)

big = np.array([1e9, -1e9, 0.0])
out = norm.normalize(big)
assert out[0] == 10.0 and out[1] == -10.0
assert np.allclose(norm.normalize(big, clip=3.0)[:2], [3.0, -3.0])
assert norm.normalize(data[0]).shape == (3,)

other = RunningNorm(3)
other.update(data)
assert np.allclose(other.mean, norm.mean) and np.allclose(other.var, norm.var)
other.update(np.empty((0, 3)))
assert other.count == 1000`,
      checks: ['`update` merges batches exactly: the result equals the mean and population variance of all rows, however they were split', '`normalize` standardises with `sqrt(var + 1e-8)` and clips to `[-clip, clip]`', 'Starts with mean 0, variance 1 and count 0, and ignores an empty batch'],
      hint: 'Merge the batch statistics with the standard parallel formula: `delta = batch_mean - mean`, `new_mean = mean + delta * n / total`, and `m2 = var*count + batch_var*n + delta**2 * count * n / total`, then `var = m2 / total`.',
      explanation: 'Merging statistics batch by batch, without keeping all the data, is the Chan–Golub–LeVeque parallel variance algorithm; it is how RL libraries keep running observation and return statistics (SB3’s `VecNormalize` and `rlgym-ppo`’s standardisation are built on it). Remember that these statistics belong with the model: saving the network without them is the bug in the error question above.',
    },
    {
      kind: 'code',
      prompt: 'Write `minibatches(n, size, seed)` for a PPO update. It returns a list of lists of indices: a random permutation of `range(n)` (shuffled with `random.Random(seed)`) split into consecutive chunks of `size` indices; the last chunk may be shorter. Every index in `range(n)` must appear exactly once. `n = 0` gives an empty list; raise `ValueError` if `size < 1`.',
      starter: `import random


def minibatches(n, size, seed):
    ...
`,
      solution: `import random


def minibatches(n, size, seed):
    if size < 1:
        raise ValueError("size must be at least 1")
    order = list(range(n))
    random.Random(seed).shuffle(order)
    return [order[i:i + size] for i in range(0, n, size)]
`,
      tests: `batches = minibatches(10, 4, seed=0)
assert [len(b) for b in batches] == [4, 4, 2]
flat = [i for b in batches for i in b]
assert sorted(flat) == list(range(10))

assert minibatches(10, 4, seed=0) == minibatches(10, 4, seed=0)
assert minibatches(50, 7, seed=1) != minibatches(50, 7, seed=2)
assert minibatches(50, 7, seed=1) != [list(range(i, min(i + 7, 50))) for i in range(0, 50, 7)]

assert [len(b) for b in minibatches(12, 4, seed=3)] == [4, 4, 4]
assert [len(b) for b in minibatches(3, 10, seed=3)] == [3]
assert minibatches(0, 5, seed=0) == []
assert minibatches(5, 1, seed=0) != [] and len(minibatches(5, 1, seed=0)) == 5

big = minibatches(1000, 64, seed=9)
assert sum(len(b) for b in big) == 1000 and len(set(i for b in big for i in b)) == 1000
assert all(isinstance(i, int) for b in big for i in b)

try:
    minibatches(10, 0, seed=0)
    raise SystemExit("expected ValueError")
except ValueError:
    pass`,
      checks: ['Shuffles all indices with `random.Random(seed)` so the same seed gives the same batches', 'Splits them into consecutive chunks of `size`, the last one possibly shorter, with every index used exactly once', 'Returns `[]` for `n = 0` and raises `ValueError` for `size < 1`'],
      hint: 'Make `order = list(range(n))`, shuffle it with `random.Random(seed).shuffle(order)`, then slice it: `[order[i:i + size] for i in range(0, n, size)]`.',
      explanation: 'This is how a PPO update uses a collected batch: shuffle it (so each gradient step sees a decorrelated sample, not consecutive frames from one game), cut it into minibatches, and repeat for several epochs. A fixed seed makes experiments reproducible. Using a `random.Random(seed)` object, instead of the global generator, means that your shuffling cannot be disturbed by other code that also draws random numbers.',
    },
  ],
  takeaways: [
    'Large-scale PPO is a pipeline: **many simulator workers** (one per core) feed a **batched inference** server, experience fills a rollout buffer, a **PPO update** improves the network, and the new weights go back to the workers. Scale is the central challenge: bots need hundreds of millions to billions of steps.',
    '**rlgym-ppo** (installed from GitHub) implements that pipeline and needs only a function that builds an environment, plus settings such as `n_proc`, `ts_per_iteration`, the PPO batch sizes, `ppo_ent_coef` and `standardize_returns`. **Stable-Baselines3** through a small Gymnasium wrapper is slower but simple, and ideal for testing a reward before scaling up.',
    '**Choose gamma from a time horizon**: the effective horizon is `1 / (1 − γ)` decisions, so γ = 0.99 at 15 decisions per second looks about 6.7 seconds ahead. Change γ whenever you change the tick skip. Treat timeouts as *truncation* (bootstrap from the last state’s value), not as terminal.',
    '**Normalise** observations and returns using running statistics, and **save the statistics with the model**: a bot that trains well and plays badly is very often missing its normaliser at deployment.',
    'Budget compute first (`hours = steps / (steps per second × 3600)`), read the **curves** (return per reward term, entropy, value loss), and judge progress by win rate against **fixed opponents and old checkpoints**, not by the training reward alone.',
  ],
  reading: [
    { title: 'rlgym-ppo on GitHub', url: 'https://github.com/AechPro/rlgym-ppo', source: 'repo', note: 'The community trainer, with an RLGym v2 example script and an installation guide.' },
    { title: 'RLGym documentation', url: 'https://rlgym.org', source: 'docs', note: 'Guides for building environments and connecting them to training libraries.' },
    { title: 'Stable-Baselines3: PPO and custom environments', url: 'https://stable-baselines3.readthedocs.io/en/master/modules/ppo.html', source: 'docs', note: 'Reference for the PPO arguments used in this lesson.' },
    { title: 'Andrychowicz et al.: What Matters in On-Policy Reinforcement Learning? (2020)', url: 'https://arxiv.org/abs/2006.05990', source: 'paper', note: 'A large empirical study of PPO implementation choices: normalisation, batch size, entropy and more.' },
    { title: 'Huang et al.: The 37 Implementation Details of PPO', url: 'https://iclr-blog-track.github.io/2022/03/25/ppo-implementation-details/', source: 'article', note: 'A readable catalogue of the details that make PPO work in practice.' },
  ],
};
