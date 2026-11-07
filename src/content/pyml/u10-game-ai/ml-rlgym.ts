import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-rlgym',
  title: 'RLGym: Rocket League as an RL Environment',
  summary: 'Meet the framework behind most Rocket League bots. See how RLGym v2 splits an environment into swappable parts (state mutator, observation builder, action parser, reward, done conditions and engine), run a real simulated match, and write your own reward and curriculum start.',
  minutes: 30,
  objectives: [
    'Describe the RLGym v2 architecture and what each of its components is responsible for',
    'Build and step a real RLGym environment backed by the RocketSim physics engine',
    'Explain tick skip, the lookup-table action parser and the team-perspective trick in the default observation',
    'Distinguish termination from truncation and combine done conditions',
    'Write a custom reward function and a custom state mutator',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'What RLGym is',
      blocks: [
        {
          type: 'p',
          text: '[[rlgym|RLGym]] (“Rocket League Gym”) is a Python library for building reinforcement-learning environments. It started as a way to train bots for *Rocket League*, the car-soccer game, and became the standard tool of that community: most of the strongest learned Rocket League bots, including the famous Nexto and Necto, were trained with it. The idea is the same as Gymnasium’s (an environment with `reset` and `step`), but a game like Rocket League has more moving parts than a CartPole, so RLGym splits the environment into small objects that you can swap independently.',
        },
        {
          type: 'p',
          text: 'Version 2 (the one installed by `pip install rlgym[rl]`) cleanly separates two packages. **rlgym-api** is a tiny, game-independent package that defines the interfaces and the `RLGym` class that wires them together. It has no dependencies, and nothing in it mentions Rocket League, so the same API could drive any game. **rlgym-rocket-league** contains the Rocket League specifics: the game-state classes, ready-made reward functions, observation builders, action parsers and done conditions, and a *transition engine* called [[rocketsim|RocketSim]].',
        },
        {
          type: 'p',
          text: 'RocketSim is a community re-implementation of Rocket League’s physics in C++ (by ZealanL). It runs headless, with no game window and no copy of Rocket League, and a single CPU core simulates thousands of times faster than real time. That speed is what makes learning possible at all: a good Rocket League bot needs on the order of *billions* of game steps, which would take years in the real game. Because it is a re-implementation, it is close to, but not identical to, the real game’s physics, so bots are normally checked in the real game (through RLBot, offline) before you trust them.',
        },
        {
          type: 'table',
          headers: ['Package', 'Contains', 'Needs the game?'],
          rows: [
            ['`rlgym-api`', 'The `RLGym` class and the abstract interfaces (`StateMutator`, `ObsBuilder`, `ActionParser`, `RewardFunction`, `DoneCondition`, `TransitionEngine`, `SharedInfoProvider`, `Renderer`)', 'No, and no Rocket League code at all'],
            ['`rlgym-rocket-league`', 'Game-state classes (`GameState`, `Car`, `PhysicsObject`), the ready-made components, constants, and `RocketSimEngine`', 'No: RocketSim simulates headless'],
            ['`rlgym` (the meta-package)', 'Installs the two above with the extras `rl`, `rl-sim` and `rl-rlviser`', 'No'],
            ['`rlviser` (optional)', 'A separate window that draws the simulated match so you can watch your bot', 'No'],
          ],
          caption: 'RLGym v2 is a family of packages. The interfaces are separate from the game, so you can reuse the pattern for your own game.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Online play and rules',
          text: 'Bots built with RLGym are for **offline** play (against other bots or in private matches through the RLBot framework). Do not connect a bot or any automation to online matchmaking: it breaks the game’s rules and anti-cheat, and can get an account banned. RLGym’s value for your own projects is the pattern, and RocketSim is a very good physics sandbox.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why does RLGym train on RocketSim instead of the real Rocket League game?',
      options: [
        { text: 'RocketSim runs headless and thousands of times faster than real time, and learning needs billions of steps', correct: true, why: 'Speed is the whole point. Real-time play would need years to collect the experience a bot needs, while a simulator can generate it in days on a modest machine.' },
        { text: 'Rocket League has no public way to read the game state', why: 'The real game can be read through frameworks such as RLBot, which is how finished bots are tested. It is just far too slow to train in.' },
        { text: 'RocketSim has exactly the same physics as the real game, so nothing ever needs checking', why: 'It is a very good re-implementation, but not identical to the original. That is why bots are checked in the real game before you trust them.' },
        { text: 'The real game cannot run more than one car at a time', why: 'The real game runs many cars. The limit is speed and automation, not car count.' },
      ],
      explanation: 'Simulation speed turns RL from impossible into practical. The price is a small gap between simulator and game (the sim-to-real gap), which you test for at the end.',
    },
    {
      kind: 'concept',
      title: 'The anatomy of an RLGym environment',
      blocks: [
        {
          type: 'p',
          text: 'You build an `RLGym` object from seven parts. Each is a small class with two or three methods, so replacing one (a new reward, a different observation) never touches the others. Everything is **multi-agent by default**: instead of single values, observations, actions, rewards and done flags are **dictionaries keyed by agent id** (such as `"blue-0"` and `"orange-0"`), even when you control only one car.',
        },
        {
          type: 'table',
          headers: ['Component', 'Job', 'Rocket League examples'],
          rows: [
            ['[[state-mutator|StateMutator]]', 'At every reset, edit the starting state', '`KickoffMutator`, `FixedTeamSizeMutator`, `MutatorSequence`'],
            ['[[observation-builder|ObsBuilder]]', 'Turn the state into each agent’s observation vector', '`DefaultObs`'],
            ['[[action-parser|ActionParser]]', 'Turn the policy’s action into engine controller inputs', '`LookupTableAction`, `RepeatAction`'],
            ['`RewardFunction`', 'Compute a reward for each agent each step', '`GoalReward`, `TouchReward`, `CombinedReward`'],
            ['`DoneCondition` (two of them)', 'Decide when the episode ends: one for *termination*, one for *truncation*', '`GoalCondition`, `TimeoutCondition`, `NoTouchTimeoutCondition`, `AnyCondition`, `AllCondition`'],
            ['[[transition-engine|TransitionEngine]]', 'Simulate the world forward', '`RocketSimEngine`'],
            ['`SharedInfoProvider` (optional)', 'A dictionary shared by all the components above, for passing information between them', 'Your own'],
          ],
          caption: 'The parts of an RLGym environment. All of them receive the shared_info dictionary, which is how a reward can read something the observation builder computed.',
        },
        {
          type: 'steps',
          items: [
            { title: 'reset()', text: 'Ask the engine for a blank base state, let the state mutators fill it in (cars, ball, boost), send it to the engine, then reset every component and return the first observation for each agent.' },
            { title: 'step(actions): parse', text: 'The action parser turns each agent’s action from the policy’s format into raw controller inputs (throttle, steer, yaw, pitch, roll, jump, boost, handbrake).' },
            { title: 'step(actions): simulate', text: 'The transition engine advances the game by the parsed actions and returns the new state. With a repeat parser that may be 8 physics ticks.' },
            { title: 'step(actions): observe and judge', text: 'The observation builder produces the new observations, then the termination and truncation conditions are evaluated on the new state.' },
            { title: 'step(actions): reward', text: 'Last, the reward function runs. It receives the done flags too, so it can pay a terminal bonus on the very step that ended the episode. `step` returns `(obs, rewards, terminated, truncated)`, each a dict.' },
          ],
        },
        {
          type: 'p',
          text: 'The **termination / truncation** split is the same one Gymnasium makes. *Terminated* means the episode ended because of something that is part of the task (a goal was scored), so the value of the next state really is zero. *Truncated* means it was cut off from outside (a 5-minute limit, or 30 seconds without anyone touching the ball), so the agent should still bootstrap from the value of the state it was in. Giving the two their own condition objects makes that explicit, and `AnyCondition` or `AllCondition` combine several conditions with OR or AND.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'In RLGym v2 you must write your own environment class for every Rocket League project; the library only provides a physics engine.',
      answer: false,
      explanation: 'False. You assemble an `RLGym` object from components, and the library ships working defaults for almost all of them (`DefaultObs`, `LookupTableAction`, `GoalReward`, `GoalCondition`, `KickoffMutator`, `RocketSimEngine`). You write a custom class only for the parts that make *your* bot different, usually the reward function and sometimes the state mutator.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the sentence about the action parser.',
      template: 'The action parser converts the policy’s choice into the ___ numbers (throttle, steer, yaw, pitch, roll, jump, boost, handbrake) that the engine needs.',
      templateIsCode: false,
      blanks: [{ answers: ['8', 'eight'] }],
      wordBank: ['8', '90', '3', '15'],
      explanation: 'A Rocket League controller state is **8 numbers**: five analog values in [−1, 1] (throttle, steer, yaw, pitch, roll) and three on/off buttons (jump, boost, handbrake). The policy chooses among, say, 90 discrete options; the parser expands each into those 8 numbers.',
    },
    {
      kind: 'concept',
      title: 'Running a real environment',
      blocks: [
        {
          type: 'p',
          text: 'The program below builds a one-versus-one environment from the stock components and takes three random steps. The reward is a `CombinedReward`, a weighted sum like the one from the previous lesson: 10 for a goal (+10 if our team scores, −10 if theirs does) and 0.1 for touching the ball. It uses the **tick-skip** wrapper `RepeatAction`, a **lookup-table** discrete action space, and *two* ways for an episode to be truncated.',
        },
        {
          type: 'code',
          title: 'rlgym_first_env.py',
          lang: 'python',
          desktopOnly: true,
          code: `import numpy as np
from rlgym.api import RLGym
from rlgym.rocket_league.action_parsers import LookupTableAction, RepeatAction
from rlgym.rocket_league.done_conditions import AnyCondition, GoalCondition, NoTouchTimeoutCondition, TimeoutCondition
from rlgym.rocket_league.obs_builders import DefaultObs
from rlgym.rocket_league.reward_functions import CombinedReward, GoalReward, TouchReward
from rlgym.rocket_league.sim import RocketSimEngine
from rlgym.rocket_league.state_mutators import FixedTeamSizeMutator, KickoffMutator, MutatorSequence

env = RLGym(
    state_mutator=MutatorSequence(FixedTeamSizeMutator(blue_size=1, orange_size=1), KickoffMutator()),
    obs_builder=DefaultObs(zero_padding=None),
    action_parser=RepeatAction(LookupTableAction(), repeats=8),
    reward_fn=CombinedReward((GoalReward(), 10.0), (TouchReward(), 0.1)),
    termination_cond=GoalCondition(),
    truncation_cond=AnyCondition(TimeoutCondition(300.0), NoTouchTimeoutCondition(30.0)),
    transition_engine=RocketSimEngine(),
)

obs = env.reset()
print("agents:", env.agents)
print("obs shape:", obs["blue-0"].shape)
print("action space:", env.action_space("blue-0"))

rng = np.random.default_rng(0)
for step in range(3):
    actions = {agent: rng.integers(90, size=1) for agent in env.agents}
    obs, rewards, terminated, truncated = env.step(actions)
    print(step, rewards, any(terminated.values()), any(truncated.values()))
env.close()`,
          output: `agents: ['blue-0', 'orange-0']
obs shape: (92,)
action space: ('discrete', 90)
0 {'blue-0': 0.0, 'orange-0': 0.0} False False
1 {'blue-0': 0.0, 'orange-0': 0.0} False False
2 {'blue-0': 0.0, 'orange-0': 0.0} False False`,
          annotations: [
            { lines: '2-8', text: 'Everything comes from two packages: the API (`rlgym.api`) and the Rocket League implementations (`rlgym.rocket_league...`).' },
            { lines: 11, text: '`MutatorSequence` runs mutators in order: first create one blue and one orange car, then place everything for a kickoff.' },
            { lines: 12, text: '`DefaultObs` builds each car’s view of the match. With `zero_padding=None` the vector length depends on the number of cars; here it is 92 numbers for a 1v1.' },
            { lines: 13, text: '`LookupTableAction` offers 90 useful controller combinations, and `RepeatAction` holds each choice for 8 ticks (tick skip).' },
            { lines: 14, text: '`CombinedReward` is a weighted sum: goal reward ×10, touch reward ×0.1. The big weight goes to the real objective.' },
            { lines: '15-16', text: 'A goal *terminates* the episode. Five minutes of game time, or 30 seconds without a touch, *truncates* it. `AnyCondition` means “whichever happens first”.' },
            { lines: 17, text: '`RocketSimEngine` is the headless physics simulation that actually moves the cars and the ball.' },
            { lines: '20-23', text: '`reset()` returns a dictionary of observations, one per agent. The spaces are tuples: `(kind, size)` such as `(\'discrete\', 90)`.' },
            { lines: '25-29', text: 'Every action, reward and done flag is a dictionary keyed by agent id. Rewards are 0.0 here because nobody has touched the ball or scored in three random steps.' },
            { lines: 30, text: '`close()` releases the engine. Always call it, especially if you create many environments.' },
          ],
        },
        {
          type: 'p',
          text: 'Three design choices in these stock components are worth understanding because they show up in every Rocket League bot.',
        },
        {
          type: 'table',
          headers: ['Idea', 'What it does', 'Why it matters'],
          rows: [
            ['**Tick skip** (`RepeatAction`, 8 repeats)', 'The engine runs at 120 ticks per second, but the policy chooses only every 8th tick, 15 times per second', 'Cuts the cost of every step, shortens the effective horizon (a 6-second plan is 90 decisions, not 720), and makes a single action visibly change the situation'],
            ['**Lookup-table actions** (`LookupTableAction`)', 'Collapses the 8-dimensional controller (1944 meaningful combinations after pruning impossible ones) to 90 useful ones, such as boost only while throttling', 'A small discrete action space is far easier to learn than an 8-dimensional continuous one, and removes silly combinations'],
            ['**Team perspective** (`DefaultObs`)', 'For orange cars, positions and velocities are mirrored (x and y negated) so that every car sees the field as if it were on the blue side', 'One policy can play both teams, because its own goal is always “behind it” in the same direction. It also doubles the data per network'],
            ['**Normalised observations**', 'Positions are divided by 2300, angles by π, boost by 100', 'Inputs of similar scale keep neural-network training stable'],
          ],
          caption: 'Defaults worth understanding. You can change all of them, but they are the result of years of community experience.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why mirroring beats learning two policies',
          text: 'If blue and orange needed different policies, you would have to train (and balance) two networks, and each would see only half the experience. Mirroring makes the game symmetric from each agent’s point of view: “the opponent’s goal is always in front”. A single network then learns from *both* sides of every match, and in self-play (next lessons) it is naturally playing against itself.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output: how often does an agent with tick skip 8 get to act, and how many decisions fit in a 300-second episode?',
      code: `TICKS_PER_SECOND = 120
repeats = 8
decisions_per_second = TICKS_PER_SECOND / repeats
episode_seconds = 300
print(decisions_per_second, int(episode_seconds * decisions_per_second))`,
      answer: '15.0 4500',
      hint: '120 ticks per second, one decision every 8 ticks.',
      explanation: '120 / 8 = 15 decisions per second (printed as `15.0`, because `/` always gives a float), and 300 × 15 = 4500 decisions in a five-minute episode. Without tick skip the same episode would be 36 000 steps, which is why tick skip is also a speed and horizon trick.',
    },
    {
      kind: 'error',
      prompt: 'This reward function should return one reward per agent as a dictionary, but the environment crashes on the first step. Tap the faulty line.',
      lines: [
        'rewards = {}',
        'for agent in agents:',
        '    car = state.cars[agent].physics',
        '    rewards = float(np.dot(car.linear_velocity, direction))',
        'return rewards',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'Line 4 *replaces* the dictionary with a single number on every pass of the loop, so the function returns a float instead of `{agent: reward}`. It must store the value under the agent’s key: `rewards[agent] = float(...)`. (RLGym is multi-agent throughout, so every component returns dictionaries.)',
    },
    {
      kind: 'numeric',
      prompt: '`DefaultObs` with `zero_padding=3` always produces an observation of length `52 + 20 × zero_padding × 2`: 52 numbers for the ball, boost pads and your own car’s extra state, plus 20 numbers for each of the `zero_padding` car slots on each of the two teams. What is the length?',
      answer: '172',
      hint: 'The padded slots are 3 allies slots and 3 enemy slots, so 6 × 20 numbers.',
      explanation: 'The formula in the code is `52 + 20 * zero_padding * 2` = 52 + 20 × 3 × 2 = **172**. Zero padding fills the unused car slots with zeros, so the same network can play 1v1, 2v2 or 3v3 without changing its input size. Without padding, a 1v1 observation is 92 numbers, as the program above printed.',
      label: 'Length:',
    },
    {
      kind: 'concept',
      title: 'Writing your own components',
      blocks: [
        {
          type: 'p',
          text: 'The stock parts are only a start. The two you will write most often are the **reward function** and the **state mutator**. A reward function implements `reset` (clear any per-episode memory) and `get_rewards` (return `{agent: reward}`). A state mutator implements one method, `apply(state, shared_info)`, that edits the state in place. Because mutators are chained, a custom one placed *after* `KickoffMutator` simply overrides part of the kickoff. That is how you build the curriculum from the last lesson: start with the ball near the goal and move it back as the agent improves.',
        },
        {
          type: 'code',
          title: 'custom_reward_and_mutator.py',
          lang: 'python',
          desktopOnly: true,
          code: `import numpy as np
from rlgym.api import RLGym, RewardFunction, StateMutator
from rlgym.rocket_league.action_parsers import LookupTableAction, RepeatAction
from rlgym.rocket_league.common_values import BLUE_TEAM, CAR_MAX_SPEED
from rlgym.rocket_league.done_conditions import GoalCondition, TimeoutCondition
from rlgym.rocket_league.obs_builders import DefaultObs
from rlgym.rocket_league.sim import RocketSimEngine
from rlgym.rocket_league.state_mutators import FixedTeamSizeMutator, KickoffMutator, MutatorSequence


class SpeedTowardBallReward(RewardFunction):
    """Dense reward in [-1, 1]: how fast the car moves directly towards the ball."""

    def reset(self, agents, initial_state, shared_info):
        pass

    def get_rewards(self, agents, state, is_terminated, is_truncated, shared_info):
        rewards = {}
        for agent in agents:
            car = state.cars[agent].physics
            to_ball = state.ball.position - car.position
            direction = to_ball / (np.linalg.norm(to_ball) + 1e-6)
            speed_towards = float(np.dot(car.linear_velocity, direction))
            rewards[agent] = float(np.clip(speed_towards / CAR_MAX_SPEED, -1.0, 1.0))
        return rewards


class BallNearGoalMutator(StateMutator):
    """Curriculum start: put the ball in front of the orange goal, with our car behind it."""

    def __init__(self, distance=1500.0):
        self.distance = distance

    def apply(self, state, shared_info):
        ball_y = 5120.0 - self.distance
        state.ball.position = np.array([0.0, ball_y, 100.0], dtype=np.float32)
        state.ball.linear_velocity = np.zeros(3, dtype=np.float32)
        for car in state.cars.values():
            if car.team_num == BLUE_TEAM:
                car.physics.position = np.array([0.0, ball_y - 800.0, 17.0], dtype=np.float32)
                car.physics.euler_angles = np.array([0.0, np.pi / 2, 0.0], dtype=np.float32)


env = RLGym(
    state_mutator=MutatorSequence(FixedTeamSizeMutator(blue_size=1, orange_size=0), KickoffMutator(), BallNearGoalMutator()),
    obs_builder=DefaultObs(zero_padding=None),
    action_parser=RepeatAction(LookupTableAction(), repeats=8),
    reward_fn=SpeedTowardBallReward(),
    termination_cond=GoalCondition(),
    truncation_cond=TimeoutCondition(10.0),
    transition_engine=RocketSimEngine(),
)

# the lookup-table index for "throttle forward + boost, no steering, no handbrake"
table = LookupTableAction.make_lookup_table()
forward_boost = next(i for i, a in enumerate(table) if a[0] == 1 and a[1] == 0 and a[6] == 1 and a[7] == 0)

env.reset()
total, steps, done = 0.0, 0, False
while not done:
    obs, rewards, terminated, truncated = env.step({"blue-0": np.array([forward_boost])})
    total += rewards["blue-0"]
    steps += 1
    done = terminated["blue-0"] or truncated["blue-0"]

print("decisions taken:", steps, "=", round(steps * 8 / 120, 2), "seconds of game time")
print("goal scored:", env.state.goal_scored)
print("total shaped reward:", round(total, 1))
env.close()`,
          output: `decisions taken: 26 = 1.73 seconds of game time
goal scored: True
total shaped reward: 11.3`,
          annotations: [
            { lines: '11-15', text: 'A custom reward subclasses `RewardFunction`. `reset` is empty because this reward keeps no memory between steps.' },
            { lines: '17-25', text: '`get_rewards` returns a dict. For each agent it measures the car’s speed *towards the ball*: the dot product of its velocity with the unit direction to the ball, divided by the maximum car speed and clipped to [−1, 1]. The `1e-6` avoids division by zero.' },
            { lines: '28-29', text: 'A custom mutator that implements the “easy start” of a curriculum.' },
            { lines: '34-41', text: '`apply` puts the ball 1500 units in front of the orange goal and our blue car 800 units behind the ball, facing the goal. It runs after `KickoffMutator`, so it overrides the kickoff positions.' },
            { lines: 45, text: 'The mutator chain: create a blue car (and no orange car), then set up a kickoff, then apply our curriculum start. Order matters.' },
            { lines: '54-56', text: 'The lookup table is an ordinary NumPy array of 8-number rows. We search it for the row meaning “throttle forward, boost, no steering, no handbrake”.' },
            { lines: '58-64', text: 'A scripted driver that always picks that action, to test the setup. The loop runs until the episode terminates (goal) or truncates (timeout).' },
            { lines: '66-68', text: 'Driving straight forward with boost scores in about 1.7 seconds of game time, and the speed-towards-ball reward adds up to about 11. If a scripted policy cannot earn the reward you intended, a learned one will not either.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Debugging tips for RLGym environments',
          text: '**Test with scripted agents first** (as above): confirm that “drive at the ball” earns the reward you expect and “do nothing” does not. **Print `env.state`** after a reset to check that your mutators produced the situation you intended. **Check the observation** ranges (most values should be within about ±1). **Watch a match** with the optional `rlviser` renderer before spending days on training. And remember that rewards are computed *after* the done flags, so terminal bonuses go in the step that ends the episode.',
        },
        {
          type: 'p',
          text: 'The pattern is not limited to Rocket League. To use RLGym’s API for your own game, you implement a `TransitionEngine` that wraps your simulation (it must provide the agent list, a way to set a desired state, and a `step`), a state type, and the other components, and then everything else (including the training libraries in the next lesson) works unchanged. For a single-agent game with an existing engine, a plain Gymnasium wrapper (as in the custom-environment lesson) is usually simpler; RLGym pays off when you have many agents, teams, or mirrored perspectives.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'The three exercises rebuild small pieces of RLGym with NumPy and plain Python: a speed-towards-ball reward, the team-perspective mirror, and combining done conditions.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `speed_toward_ball(car_pos, car_vel, ball_pos, max_speed=2300.0)` using NumPy. Return the component of the car’s velocity that points towards the ball, divided by `max_speed` and **clipped to [−1, 1]**, as a Python `float`. If the car is exactly at the ball’s position (distance 0), return `0.0`.',
      starter: `import numpy as np


def speed_toward_ball(car_pos, car_vel, ball_pos, max_speed=2300.0):
    ...
`,
      solution: `import numpy as np


def speed_toward_ball(car_pos, car_vel, ball_pos, max_speed=2300.0):
    to_ball = np.asarray(ball_pos, dtype=float) - np.asarray(car_pos, dtype=float)
    distance = np.linalg.norm(to_ball)
    if distance == 0.0:
        return 0.0
    speed = float(np.dot(np.asarray(car_vel, dtype=float), to_ball / distance))
    return float(np.clip(speed / max_speed, -1.0, 1.0))
`,
      packages: ['numpy'],
      tests: `import math

assert math.isclose(speed_toward_ball([0, 0, 0], [1150, 0, 0], [1000, 0, 0]), 0.5)
assert math.isclose(speed_toward_ball([0, 0, 0], [-1150, 0, 0], [1000, 0, 0]), -0.5)
assert math.isclose(speed_toward_ball([0, 0, 0], [0, 2000, 0], [1000, 0, 0]), 0.0, abs_tol=1e-12)
assert speed_toward_ball([0, 0, 0], [5000, 0, 0], [10, 0, 0]) == 1.0
assert speed_toward_ball([0, 0, 0], [-5000, 0, 0], [10, 0, 0]) == -1.0
assert speed_toward_ball([5, 5, 5], [100, 100, 100], [5, 5, 5]) == 0.0
assert math.isclose(speed_toward_ball([0, 0, 0], [300, 400, 0], [3, 4, 0]), 500 / 2300)
assert math.isclose(speed_toward_ball([0, 0, 0], [100, 0, 0], [0, 0, 50], max_speed=100.0), 0.0, abs_tol=1e-12)
r = speed_toward_ball([0, 0, 0], [1, 2, 3], [4, 5, 6])
assert type(r) is float`,
      checks: ['Projects the velocity onto the unit vector from the car to the ball', 'Divides by `max_speed` and clips to [−1, 1]', 'Returns `0.0` when the car is at the ball, and a plain Python float'],
      hint: 'Compute `to_ball = ball_pos - car_pos`, normalise it by its length (check for zero first), take `np.dot(car_vel, direction)`, divide by `max_speed` and clip with `np.clip`.',
      explanation: 'This is the reward from the lesson, written as a plain function that is easy to unit-test (a good habit for reward code). The dot product with a unit vector gives the speed in that direction: it is positive when driving towards the ball, negative when driving away and zero when moving sideways. Clipping keeps the reward in a fixed range, which keeps the learning signal well scaled.',
    },
    {
      kind: 'code',
      prompt: 'Write `to_team_perspective(vector, team)` for NumPy arrays. For team `0` (blue) return the vector unchanged. For team `1` (orange) return a **new** array with the **x and y components negated** and z unchanged (the field mirrored through its centre). The input may be a single vector of shape `(3,)` or several of shape `(n, 3)`. Never modify the input array.',
      starter: `import numpy as np


def to_team_perspective(vector, team):
    ...
`,
      solution: `import numpy as np

MIRROR = np.array([-1.0, -1.0, 1.0])


def to_team_perspective(vector, team):
    vector = np.asarray(vector, dtype=float)
    if team == 0:
        return vector.copy()
    return vector * MIRROR
`,
      packages: ['numpy'],
      tests: `import numpy as np

v = np.array([100.0, -200.0, 50.0])
assert np.array_equal(to_team_perspective(v, 0), v)
assert np.array_equal(to_team_perspective(v, 1), np.array([-100.0, 200.0, 50.0]))
assert np.array_equal(v, np.array([100.0, -200.0, 50.0]))
m = np.array([[1.0, 2.0, 3.0], [-4.0, 5.0, -6.0]])
out = to_team_perspective(m, 1)
assert out.shape == (2, 3)
assert np.array_equal(out, np.array([[-1.0, -2.0, 3.0], [4.0, -5.0, -6.0]]))
assert np.array_equal(m, np.array([[1.0, 2.0, 3.0], [-4.0, 5.0, -6.0]]))
out0 = to_team_perspective(m, 0)
out0[0, 0] = 99.0
assert m[0, 0] == 1.0
assert np.array_equal(to_team_perspective(to_team_perspective(v, 1), 1), v)
assert np.array_equal(to_team_perspective([1, 2, 3], 1), np.array([-1.0, -2.0, 3.0]))`,
      checks: ['Leaves blue (team 0) vectors unchanged and negates x and y for orange (team 1)', 'Works for both `(3,)` and `(n, 3)` inputs (broadcasting)', 'Never modifies the input array, and mirroring twice returns the original'],
      hint: 'Multiply by `np.array([-1, -1, 1])`: broadcasting applies it to every row of an `(n, 3)` array. For team 0 return a copy so callers cannot change your input by accident.',
      explanation: 'This is the trick behind `DefaultObs`: orange cars see everything mirrored, so a single policy can play both teams. The mirror is its own inverse (applying it twice returns the original), which is why mirrored actions can be translated back easily. Using NumPy broadcasting means the same two lines handle one vector or thousands.',
    },
    {
      kind: 'code',
      prompt: 'Write `combine_dones(results, mode="any")`. `results` is a list of dictionaries mapping agent ids to booleans (one dictionary per done condition, all with the same agents). Return one dictionary with the same agents: with `mode="any"` an agent is done if **any** condition says so (like `AnyCondition`); with `mode="all"` only if **all** do (like `AllCondition`). Raise `ValueError` for any other mode. An empty list gives an empty dictionary.',
      starter: `def combine_dones(results, mode="any"):
    ...
`,
      solution: `def combine_dones(results, mode="any"):
    if mode not in ("any", "all"):
        raise ValueError(f"unknown mode: {mode}")
    if not results:
        return {}
    combine = any if mode == "any" else all
    return {agent: combine(r[agent] for r in results) for agent in results[0]}
`,
      tests: `goal = {"blue": False, "orange": True}
timeout = {"blue": False, "orange": False}
touch = {"blue": True, "orange": True}

assert combine_dones([goal, timeout]) == {"blue": False, "orange": True}
assert combine_dones([goal, timeout], mode="all") == {"blue": False, "orange": False}
assert combine_dones([goal, touch], mode="all") == {"blue": False, "orange": True}
assert combine_dones([goal, touch, timeout], "any") == {"blue": True, "orange": True}
assert combine_dones([goal]) == goal
assert combine_dones([goal], mode="all") == goal
assert combine_dones([]) == {}
assert combine_dones([], mode="all") == {}

try:
    combine_dones([goal], mode="xor")
    raise SystemExit("expected ValueError")
except ValueError:
    pass

r = combine_dones([{"a": True}, {"a": False}])
assert r["a"] is True
assert all(type(v) is bool for v in combine_dones([goal, touch], "all").values())`,
      checks: ['`any` mode ORs the conditions per agent and `all` mode ANDs them', 'Returns a dictionary with exactly the agents of the inputs (empty list gives `{}`)', 'Raises `ValueError` for an unknown mode and returns plain booleans'],
      hint: 'Pick `any` or `all` as a function, then build `{agent: combine(r[agent] for r in results) for agent in results[0]}`. Check the mode and the empty list first.',
      explanation: 'This is exactly what `AnyCondition` and `AllCondition` do for dictionaries of per-agent flags. It is the typical use: `AnyCondition(TimeoutCondition(300), NoTouchTimeoutCondition(30))` truncates an episode when *either* limit is reached, while an `AllCondition` could require, say, both teams to be inactive. The built-in `any` and `all` functions accept a generator, which short-circuits as soon as the answer is known.',
    },
  ],
  takeaways: [
    '**RLGym v2** splits an environment into swappable parts: `StateMutator`, `ObsBuilder`, `ActionParser`, `RewardFunction`, two `DoneCondition`s and a `TransitionEngine`. The game-independent `rlgym-api` is separate from `rlgym-rocket-league`, which brings the defaults and the headless **RocketSim** engine.',
    'Everything is **multi-agent by default**: observations, actions, rewards and done flags are dictionaries keyed by agent id (`"blue-0"`, `"orange-0"`). `step` returns `(obs, rewards, terminated, truncated)`, and rewards are computed *after* the done flags.',
    '**Termination** (a goal scored) is part of the task; **truncation** (a time or no-touch limit) is imposed from outside, so the agent should still bootstrap from the value of the last state. `AnyCondition` and `AllCondition` combine conditions.',
    'The defaults encode community experience: **tick skip** of 8 (15 decisions per second), a **90-action lookup table** instead of 1944 raw combinations, **normalised** observations, and a **team-mirrored** view so one policy plays both sides.',
    'Customise with small classes: a **reward function** returns `{agent: reward}`, and a **state mutator** edits the start state in place and can implement a curriculum when chained after `KickoffMutator`. Test them with scripted agents before training, and only ever use bots offline.',
  ],
  reading: [
    { title: 'RLGym documentation', url: 'https://rlgym.org', source: 'docs', note: 'The official site: getting started, the API, and a guide to the Rocket League components.' },
    { title: 'RLGym on GitHub (rlgym-api and rlgym-rocket-league)', url: 'https://github.com/lucas-emery/rocket-league-gym', source: 'repo', note: 'Source code of the interfaces and the Rocket League components; the files are short and very readable.' },
    { title: 'RocketSim on GitHub', url: 'https://github.com/ZealanL/RocketSim', source: 'repo', note: 'The C++ physics simulator behind the headless training speed.' },
    { title: 'RLBot: write and run Rocket League bots', url: 'https://rlbot.org', source: 'docs', note: 'The framework used to run finished bots in the real game, offline.' },
    { title: 'Gymnasium: handling time limits (termination vs truncation)', url: 'https://gymnasium.farama.org/', source: 'docs', note: 'The idea behind RLGym’s two done conditions.' },
  ],
};
