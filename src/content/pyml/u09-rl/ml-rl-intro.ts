import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-rl-intro',
  title: 'Agents, Environments and Rewards',
  summary: 'The reinforcement-learning loop: an agent acts, the environment answers with a new state and a reward. Learn returns and discounting, the exploration–exploitation dilemma with a bandit you can run, and the map of RL algorithms this unit will walk through.',
  minutes: 24,
  objectives: [
    'Describe the agent–environment loop and its parts: state, action, reward, policy, episode',
    'Explain how reinforcement learning differs from supervised learning',
    'Compute the discounted return and explain what the discount factor γ controls',
    'Explain the exploration–exploitation trade-off and implement ε-greedy action selection',
    'Place the main RL algorithm families (value-based, policy-based, model-based) on a map',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Learning by trial and error',
      blocks: [
        {
          type: 'p',
          text: 'In supervised learning someone hands the model the right answer for every example. Most real decisions are not like that. Nobody can tell a game character the correct button press at every frame; all you can say, afterwards, is "that went well" or "that went badly". **Reinforcement learning (RL)** is learning to act from exactly that kind of feedback. An **[[agent]]** (the learner) interacts with an **environment** (everything else, such as the game). At each time step the agent sees the current **state**, chooses an **action**, and the environment responds with a new state and a number called the **[[reward]]**. The agent’s goal is to choose actions that maximize the *total reward over time*.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Observe', text: 'The agent receives the state `s` (or an observation of it): the positions of units, the pixels of the screen, the speed of the car.' },
            { title: 'Act', text: 'Its **policy** `π` maps the state to an action `a`: jump, turn left, build a barracks. The policy is the thing being learned.' },
            { title: 'Environment responds', text: 'The game applies the action and returns the next state `s′` and a **reward** `r` (+1 for scoring, −1 for dying, 0 most of the time).' },
            { title: 'Learn', text: 'The agent uses the experience `(s, a, r, s′)` to improve its policy, then the loop repeats until the **episode** ends (the match is over, the character died, a time limit hit).' },
          ],
        },
        {
          type: 'p',
          text: 'Reinforcement learning has three features that make it different from, and harder than, supervised learning. **No labels**: the agent is never told the correct action, only how well things went. **Delayed rewards**: the move that wins a chess game may have been made 40 moves before the reward arrives, so the agent must work out which earlier actions deserve the credit (the **credit assignment** problem). **The data depends on the agent**: what the agent experiences is determined by what it does, so a bad early policy collects bad data, and the agent must *explore* to discover better options. The code below is a complete (tiny) environment and the interaction loop, written by hand.',
        },
        {
          type: 'code',
          title: 'corridor_env.py',
          runnable: true,
          code: `import random

class Corridor:
    """Cells 0..4. Start in the middle. Reaching cell 4 pays +1, cell 0 pays 0; both end the episode."""
    def reset(self):
        self.pos = 2
        return self.pos

    def step(self, action):          # action: 0 = left, 1 = right
        self.pos += 1 if action == 1 else -1
        done = self.pos in (0, 4)
        reward = 1.0 if self.pos == 4 else 0.0
        return self.pos, reward, done

def run_episode(env, policy):
    state, total, steps, done = env.reset(), 0.0, 0, False
    while not done:
        state, reward, done = env.step(policy(state))
        total += reward
        steps += 1
    return total, steps

rng = random.Random(0)
random_policy = lambda s: 1 if rng.random() < 0.5 else 0
always_right = lambda s: 1
env = Corridor()
results = [run_episode(env, random_policy) for _ in range(2000)]
print(round(sum(r for r, _ in results) / len(results), 2), round(sum(n for _, n in results) / len(results), 2))
print(run_episode(env, always_right))`,
          output: `0.49 4.07
(1.0, 2)`,
          annotations: [
            { lines: '3-13', text: 'An **environment** is just an object with two methods. `reset()` starts an episode and returns the first state; `step(action)` applies the action and returns `(next_state, reward, done)`. This is the interface every RL library uses (Gymnasium, a later lesson, adds a few extras).' },
            { lines: '15-21', text: 'The **interaction loop**: observe the state, ask the policy for an action, step the environment, add up the reward, repeat until `done`. Nothing here learns yet; it only plays.' },
            { lines: '23-25', text: 'A **policy** is simply a function from state to action. The first flips a fair coin; the second always goes right.' },
            { lines: '26-28', text: 'Over 2,000 episodes the random policy earns an average reward of about **0.49** (it reaches the +1 end about half of the time) and an episode lasts about 4 steps.' },
            { lines: 29, text: 'The policy "always go right" earns 1.0 in 2 steps, every time. Finding such a policy *automatically*, in much bigger worlds, is the whole subject of reinforcement learning.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why rewards are the hard part',
          text: 'The reward is how *you* tell the agent what you want, and the agent will do exactly what maximizes it, not what you meant. Reward a racing bot for speed and it may drive in circles at a corner; reward a shooter bot for kills and it may camp. Writing the reward function is the main design job in game RL, and a full lesson later in this course is devoted to reward design. For now remember: **the agent optimizes the reward you wrote, not the goal in your head.**',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'From backgammon to Rocket League',
          text: 'Gerald Tesauro’s **TD-Gammon** (1992) taught a small neural network to play backgammon at expert level by playing against itself. In 2013–2015 DeepMind’s **DQN** learned dozens of Atari games from raw pixels. **AlphaGo** (2016) beat the world champion at Go; **OpenAI Five** (2019) beat the reigning Dota 2 world champions and **AlphaStar** (2019) reached Grandmaster level in StarCraft II. Hobbyists have used the same ideas for **Rocket League** bots built with the RLGym library, which a later unit covers. All of them are the loop you just wrote, scaled up.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What is the main difference between reinforcement learning and supervised learning?',
      options: [
        { text: 'RL gets no correct answers, only a (often delayed) reward, and the data it sees depends on its own actions', correct: true, why: 'There is no label saying "the right action was X". The agent must discover good behaviour from rewards, and because its actions shape what it sees, it has to explore.' },
        { text: 'RL uses neural networks and supervised learning does not', why: 'Both can use neural networks (or not): the difference is the kind of feedback, not the model. Tabular RL (next lessons) uses no network at all.' },
        { text: 'RL needs more data because its rewards are always negative', why: 'Rewards can be positive, negative or zero. RL is often data-hungry, but that is a consequence of weak feedback, not of negative numbers.' },
        { text: 'RL can only be used for games', why: 'Games are a convenient testbed, but RL also controls robots, data-center cooling, recommendation systems and chatbots tuned from human feedback.' },
      ],
      explanation: 'Supervised learning is told the right answer; RL only receives a scalar reward, usually delayed, and must explore because its own actions determine what data it collects.',
    },
    {
      kind: 'concept',
      title: 'Return and the discount factor',
      blocks: [
        {
          type: 'p',
          text: 'To compare behaviours the agent needs one number summarizing a whole episode: the **return**, the sum of the rewards from now on. But a reward received now is usually worth more than the same reward in 100 steps (it is certain, and the future is uncertain), and in tasks that never end the plain sum would be infinite. So we **discount** the future with a factor `γ` (gamma) between 0 and 1: a reward `k` steps away counts `γ^k` as much.',
        },
        {
          type: 'math',
          tex: 'G_t = r_{t+1} + \\gamma\\, r_{t+2} + \\gamma^{2} r_{t+3} + \\cdots = \\sum_{k=0}^{\\infty} \\gamma^{k}\\, r_{t+k+1}',
          caption: 'The discounted return G_t: the quantity an RL agent tries to maximize (in expectation).',
        },
        {
          type: 'p',
          text: 'The discount factor sets how far-sighted the agent is. With `γ = 0` it cares only about the next reward (greedy); with `γ` close to 1 it plans far ahead, but learning gets slower and noisier. A handy rule is the **effective horizon**, about `1/(1 − γ)` steps: `γ = 0.9` looks roughly 10 steps ahead, `γ = 0.99` about 100. Drag the slider to see how quickly the weight of future rewards fades.',
        },
        {
          type: 'graph',
          caption: 'The weight γ^k given to a reward k steps in the future. A small γ makes the curve collapse almost immediately (short-sighted); γ near 1 keeps the future relevant for a long time. The readout shows the effective horizon 1/(1−γ).',
          x: [0, 40],
          y: [0, 1.05],
          functions: [{ expr: 'g^x', label: 'weight γ^k', color: 'blue' }],
          points: [{ x: '1/(1-g)', y: 'g^(1/(1-g))', color: 'red' }],
          sliders: [{ name: 'g', min: 0.5, max: 0.99, step: 0.01, value: 0.9, label: 'discount γ' }],
          readouts: [
            { label: 'effective horizon 1/(1−γ)', expr: '1/(1-g)', digits: 1 },
            { label: 'weight after 10 steps', expr: 'g^10', digits: 3 },
          ],
        },
        {
          type: 'p',
          text: 'A useful identity is that the return satisfies a recursion: `G_t = r_{t+1} + γ·G_{t+1}`: the return from now is the next reward plus the discounted return from the next step on. It is the seed of nearly every RL algorithm, and it gives the easy way to compute returns: **work backwards** from the end of the episode.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'With a discount factor of γ = 0, the agent only cares about the immediate next reward and ignores everything that happens after it.',
      answer: true,
      explanation: 'True. With γ = 0 every term `γ^k` for k ≥ 1 vanishes, so the return equals the next reward alone: the agent is completely greedy. Values near 1 make it far-sighted, which usually needs more training.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the line that computes the discounted return of a list of rewards.',
      template: `G = sum(gamma ** k * r for k, r in ___(rewards))`,
      templateIsCode: true,
      blanks: [{ answers: ['enumerate'] }],
      wordBank: ['enumerate', 'zip', 'range', 'reversed'],
      explanation: '`enumerate(rewards)` yields pairs `(k, r)` with the step index `k`, which is exactly the exponent on `gamma`. `zip` would need a second sequence, `range` produces only numbers, and `reversed` would flip the order of the rewards.',
    },
    {
      kind: 'concept',
      title: 'Exploration versus exploitation',
      blocks: [
        {
          type: 'p',
          text: 'Imagine three slot machines whose win rates you do not know. If you keep pulling the one that has paid best so far (**exploitation**) you may never discover that another is better; if you keep trying all of them (**exploration**) you waste pulls on bad ones. This is the **exploration–exploitation dilemma**, and it appears in every RL problem. The simple stand-alone version is the **multi-armed bandit**, which has actions and rewards but no states. The simplest remedy is **ε-greedy**: with probability `ε` pick a random action, otherwise pick the action that currently looks best.',
        },
        {
          type: 'code',
          title: 'bandit.py',
          runnable: true,
          code: `import random

means = [0.2, 0.5, 0.8]
def run(epsilon, steps=2000, seed=0):
    rng = random.Random(seed)
    q, n = [0.0] * 3, [0] * 3
    total = 0.0
    for _ in range(steps):
        if rng.random() < epsilon:
            a = int(rng.random() * 3)
        else:
            a = max(range(3), key=lambda i: q[i])
        r = 1.0 if rng.random() < means[a] else 0.0
        n[a] += 1
        q[a] += (r - q[a]) / n[a]
        total += r
    return round(total / steps, 2), n

for eps in (0.0, 0.1, 1.0):
    print(eps, *run(eps))`,
          output: `0.0 0.2 [2000, 0, 0]
0.1 0.74 [144, 69, 1787]
1.0 0.49 [643, 672, 685]`,
          annotations: [
            { lines: 3, text: 'Three slot machines ("arms") that pay 1 with probabilities 0.2, 0.5 and 0.8. The agent does not know these numbers; the best arm is the last.' },
            { lines: '5-7', text: 'The agent’s **estimates** `q[a]` of each arm’s value, and counts `n[a]` of how often it pulled each. All estimates start at 0.' },
            { lines: '9-12', text: '**ε-greedy** choice: with probability ε pull a random arm; otherwise pull the arm with the highest estimate (`max(..., key=...)`).' },
            { lines: '13-16', text: 'Pull the arm, then update its estimate as a **running average**: `q += (r − q)/n` moves the estimate a little towards each new reward (this "step towards the target" form returns in Q-learning).' },
            { lines: '19-20', text: 'With **ε = 0** (pure exploitation) the agent pulls arm 0 forever: its first win gave it a positive estimate and it never tried the others. Average reward **0.2**. With **ε = 0.1** it finds the best arm and pulls it 1,787 times: **0.74**. With **ε = 1** (pure exploration) it pulls all arms equally: 0.49, the average of the three.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Explore a lot early, a little later',
          text: 'The right amount of exploration changes over time: at the start the agent knows nothing, so it should try everything; later it should mostly exploit what it has learned. A common recipe is to **decay ε** from 1.0 down to about 0.05 over the first part of training (the DQN lesson uses this). Policy-gradient methods explore differently: their policy is *stochastic*, and training gradually makes it more decisive.',
        },
        {
          type: 'table',
          headers: ['Idea', 'What it does', 'Where you will meet it'],
          rows: [
            ['**ε-greedy**', 'Random action with probability ε, otherwise the best-known one', 'Q-learning, DQN'],
            ['**Optimism**', 'Start estimates high so untried actions look attractive', 'Bandits, tabular RL'],
            ['**Softmax / stochastic policy**', 'Sample actions in proportion to their preference', 'Policy gradients, PPO'],
            ['**Entropy bonus**', 'Reward the policy for staying random while it is uncertain', 'PPO, SAC'],
            ['**Curiosity**', 'Reward visiting novel or surprising states', 'Sparse-reward games'],
          ],
          caption: 'Ways of exploring. ε-greedy is the simplest and is the one you will implement.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output (the discounted return of a reward that arrives only at the third step).',
      code: `rewards = [0, 0, 1]
gamma = 0.9
print(round(sum(gamma ** k * r for k, r in enumerate(rewards)), 2))`,
      answer: '0.81',
      hint: 'Only the last reward is non-zero, and it is two steps away: `0.9 ** 2`.',
      explanation: 'The first two terms are 0 and the third is `0.9² × 1 = 0.81`: a reward of 1 that arrives two steps later is worth 0.81 now.',
    },
    {
      kind: 'error',
      prompt: 'This code is meant to compute the discounted return using the recursion `G = r + γ·G`, but it gives the wrong answer. Tap the faulty line.',
      lines: [
        'G = 0.0',
        'for r in rewards:',
        '    G = r + gamma * G',
        'print(G)',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The recursion `G_t = r_{t+1} + γ·G_{t+1}` must be applied **backwards**, starting from the *last* reward, so that each earlier reward is added on top of the discounted future. The loop should be `for r in reversed(rewards):`. Going forwards discounts the *earlier* rewards instead of the later ones.',
    },
    {
      kind: 'numeric',
      prompt: 'With a discount factor γ = 0.99, roughly how many steps ahead does the agent effectively look? (Use the effective horizon `1 / (1 − γ)`.)',
      answer: '100',
      hint: '`1 − 0.99 = 0.01`.',
      explanation: '`1 / 0.01 = 100` steps. In a game running at 60 decisions per second that is under two seconds, a reminder that γ must be matched to how far ahead the task requires planning (or you must act less often, for example every 4th frame).',
      label: 'Steps:',
    },
    {
      kind: 'concept',
      title: 'A map of reinforcement-learning methods',
      blocks: [
        {
          type: 'p',
          text: 'The rest of this unit builds the main families of RL algorithms, each from the one before. Three questions organize them. **What does the agent learn?** A **value function** (how good is each state or action) from which the policy follows (*value-based*: Q-learning, DQN); the **policy itself** directly (*policy-based*: REINFORCE); or both together (*actor-critic*: PPO). **Does it learn a model of the environment?** Most game-playing work is **model-free** (it never learns the game’s rules, only what to do), while **model-based** methods also learn to predict what happens next and can plan inside that model (AlphaZero, with the rules supplied). **Can it learn from old experience?** **Off-policy** methods (DQN) can reuse stored past experience; **on-policy** methods (PPO) learn only from data produced by the current policy.',
        },
        {
          type: 'table',
          headers: ['Method', 'Learns', 'Actions', 'Uses', 'Lesson'],
          rows: [
            ['**Tabular Q-learning**', 'A table Q(s, a)', 'Discrete', 'Small state spaces, a first algorithm', 'Q-learning'],
            ['**DQN**', 'A neural network Q(s, a)', 'Discrete', 'Pixels and big state spaces: Atari-style games', 'Deep Q-Networks'],
            ['**REINFORCE / actor-critic**', 'A stochastic policy (plus a value baseline)', 'Discrete or continuous', 'Stable, general; the basis of modern methods', 'Policy gradients'],
            ['**PPO**', 'Actor-critic with a clipped, safe update', 'Discrete or continuous', 'The default algorithm for game AI and RLGym', 'PPO'],
            ['**SAC / TD3**', 'Off-policy actor-critic', 'Continuous', 'Robot-like control, vehicles', 'Mentioned only'],
            ['**AlphaZero-style**', 'Policy and value network plus tree search', 'Discrete, rules known', 'Board games', 'Mentioned only'],
          ],
          caption: 'The families of RL algorithms and where this course covers them. For a typical game with a handful of buttons, start with PPO.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Know when RL is the right tool',
          text: 'RL is powerful but expensive: it usually needs millions of simulated steps, a fast simulator, and a carefully designed reward. If the behaviour can be written down (patrol, chase, take cover), **classic game AI** (state machines, behaviour trees, pathfinding) is cheaper, predictable and easier to debug. If you have recordings of good play, **imitation learning** is far faster than RL. RL earns its place when the behaviour is too complex to script and you can simulate a lot of experience. A later lesson compares these options in detail.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises mirror this lesson: compute a discounted return, write ε-greedy action selection, and write a rollout function that plays one episode in any environment with the `reset` / `step` interface.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `discounted_return(rewards, gamma)` that returns the discounted return of a list of rewards: `r0 + gamma·r1 + gamma²·r2 + …`. Use the backward recursion `G = r + gamma·G` (iterate over `reversed(rewards)`). Raise `ValueError` unless `0 <= gamma <= 1`. An empty list has return `0.0`.',
      starter: `def discounted_return(rewards, gamma):
    ...
`,
      solution: `def discounted_return(rewards, gamma):
    if not 0 <= gamma <= 1:
        raise ValueError("gamma must be between 0 and 1")
    g = 0.0
    for r in reversed(rewards):
        g = r + gamma * g
    return g
`,
      tests: `import math

assert math.isclose(discounted_return([0, 0, 1], 0.9), 0.81)
assert math.isclose(discounted_return([1, 1, 1, 1], 0.5), 1.875)
assert discounted_return([5, 100, 100], 0.0) == 5.0
assert discounted_return([1, 2, 3], 1.0) == 6.0
assert discounted_return([], 0.9) == 0.0
assert discounted_return([7], 0.5) == 7.0
assert math.isclose(discounted_return([1, 0, 0, 0, 10], 0.9), 1 + 10 * 0.9 ** 4)
assert math.isclose(discounted_return([-1, -1], 0.5), -1.5)
assert isinstance(discounted_return([1, 2], 0.5), float)
rs = [1, 2, 3]
discounted_return(rs, 0.5)
assert rs == [1, 2, 3]
for bad in (-0.1, 1.5):
    try:
        discounted_return([1], bad)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      checks: ['Computes `r0 + γ·r1 + γ²·r2 + …` (backwards: `G = r + γ·G` over `reversed(rewards)`)', 'Handles γ = 0 (only the first reward), γ = 1 (plain sum) and an empty list (0.0)', 'Raises `ValueError` unless `0 <= gamma <= 1`; does not modify the list'],
      hint: 'Start with `g = 0.0` and loop over `reversed(rewards)`, updating `g = r + gamma * g`. After the loop `g` is the return from step 0.',
      explanation: 'Going backwards is both simpler and faster than computing `gamma ** k` for every term: it uses one multiplication per reward and mirrors the recursion `G_t = r_{t+1} + γ·G_{t+1}`. The same backward sweep computes the return at *every* step of an episode, which policy-gradient methods do in a later lesson.',
    },
    {
      kind: 'code',
      prompt: 'Write `epsilon_greedy(q_values, epsilon, rng)`: `q_values` is a list of action values and `rng` is a `random.Random`. With probability `epsilon` (when `rng.random() < epsilon`) return a uniformly random index `int(rng.random() * len(q_values))`; otherwise return the index of the largest value (the **lowest** index on ties). Raise `ValueError` if the list is empty or `epsilon` is outside `[0, 1]`.',
      starter: `import random

def epsilon_greedy(q_values, epsilon, rng):
    ...
`,
      solution: `import random


def epsilon_greedy(q_values, epsilon, rng):
    if not q_values:
        raise ValueError("q_values must not be empty")
    if not 0 <= epsilon <= 1:
        raise ValueError("epsilon must be between 0 and 1")
    if rng.random() < epsilon:
        return int(rng.random() * len(q_values))
    best = 0
    for i, q in enumerate(q_values):
        if q > q_values[best]:
            best = i
    return best
`,
      tests: `import random

rng = random.Random(0)
assert all(epsilon_greedy([0.1, 0.9, 0.5], 0.0, rng) == 1 for _ in range(100))
assert epsilon_greedy([1, 1, 1], 0.0, rng) == 0
assert epsilon_greedy([-5, -2, -9], 0.0, rng) == 1
assert epsilon_greedy([3.0], 0.5, rng) == 0

counts = [0, 0, 0, 0]
for _ in range(8000):
    counts[epsilon_greedy([0, 0, 0, 1], 1.0, rng)] += 1
assert all(1700 < c < 2300 for c in counts)

picks = [epsilon_greedy([0.0, 5.0, 1.0], 0.2, rng) for _ in range(10000)]
share_best = picks.count(1) / len(picks)
assert 0.80 < share_best < 0.89
assert set(picks) == {0, 1, 2}

a = [epsilon_greedy([0, 1, 2], 0.3, random.Random(5)) for _ in range(5)]
b = [epsilon_greedy([0, 1, 2], 0.3, random.Random(5)) for _ in range(5)]
assert a == b
for args in [([], 0.1), ([1, 2], -0.1), ([1, 2], 1.1)]:
    try:
        epsilon_greedy(args[0], args[1], rng)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      checks: ['With probability `epsilon` returns a uniformly random index, otherwise the index of the highest value (lowest index on ties)', 'With `epsilon = 0` it is purely greedy; with `epsilon = 1` all actions are chosen equally often', 'Raises `ValueError` for an empty list or an `epsilon` outside `[0, 1]`'],
      hint: 'Check the arguments first. Then `if rng.random() < epsilon:` return `int(rng.random() * len(q_values))`. Otherwise scan for the best index, only replacing it when a value is strictly larger so that ties keep the lowest index.',
      explanation: 'Note that a "random" action can still be the best one, so the greedy action is taken with probability `1 − ε + ε/n`. Q-learning and DQN use exactly this rule to pick actions during training; during evaluation you usually set `ε` to 0 (or a tiny value) to see how good the learned policy really is.',
    },
    {
      kind: 'code',
      prompt: 'Write `rollout(env, policy, gamma=1.0, max_steps=1000)` that plays **one episode** in an environment with `reset()` (returns the first state) and `step(action)` (returns `(state, reward, done)`), choosing each action with `policy(state)`. Stop when `done` is true or after `max_steps` steps. Return a tuple `(total_reward, discounted_return, steps)`, where the discounted return uses `gamma` and the first reward counts with weight 1.',
      starter: `def rollout(env, policy, gamma=1.0, max_steps=1000):
    ...
`,
      solution: `def rollout(env, policy, gamma=1.0, max_steps=1000):
    state = env.reset()
    total, discounted, weight, steps = 0.0, 0.0, 1.0, 0
    done = False
    while not done and steps < max_steps:
        state, reward, done = env.step(policy(state))
        total += reward
        discounted += weight * reward
        weight *= gamma
        steps += 1
    return total, discounted, steps
`,
      tests: `import math

class Corridor:
    def reset(self):
        self.pos = 2
        return self.pos
    def step(self, action):
        self.pos += 1 if action == 1 else -1
        done = self.pos in (0, 4)
        return self.pos, (1.0 if self.pos == 4 else 0.0), done

right = lambda s: 1
left = lambda s: 0
env = Corridor()
assert rollout(env, right) == (1.0, 1.0, 2)
t, d, n = rollout(env, right, gamma=0.9)
assert t == 1.0 and math.isclose(d, 0.9) and n == 2
assert rollout(env, left) == (0.0, 0.0, 2)

class Chain:
    def reset(self):
        self.t = 0
        return 0
    def step(self, action):
        self.t += 1
        return self.t, 1.0, self.t == 4

t, d, n = rollout(Chain(), lambda s: 0, gamma=0.5)
assert t == 4.0 and math.isclose(d, 1.875) and n == 4

class Forever:
    def reset(self):
        return 0
    def step(self, action):
        return 0, 1.0, False

t, d, n = rollout(Forever(), lambda s: 0, gamma=0.5, max_steps=10)
assert n == 10 and t == 10.0 and math.isclose(d, 2 - 2 ** -9)
assert rollout(Forever(), lambda s: 0, max_steps=0) == (0.0, 0.0, 0)

seen = []
def spy(state):
    seen.append(state)
    return 1
rollout(Corridor(), spy)
assert seen == [2, 3]`,
      checks: ['Plays one episode: reset, then `policy(state)` → `env.step(action)` until `done` or `max_steps`', 'Returns `(total_reward, discounted_return, steps)` with the first reward weighted 1, the next by `gamma`, and so on', 'Passes each new state to the policy (the first one comes from `reset`) and respects `max_steps`'],
      hint: 'Keep a running `weight = 1.0` that you multiply by `gamma` after each reward: `discounted += weight * reward`. The loop condition is `while not done and steps < max_steps`.',
      explanation: 'Every RL training loop is built on this rollout: collect episodes, compute returns, learn. Because it only needs `reset` and `step`, it works for the toy corridor, for a Gymnasium environment, or for your own game once you wrap it. Keeping a running weight avoids calling `gamma ** k` repeatedly, and the `max_steps` guard prevents an endless episode from hanging your training run.',
    },
  ],
  takeaways: [
    'In reinforcement learning an **agent** observes a **state**, picks an **action** with its **policy**, and the **environment** returns the next state and a **reward**; an **episode** is one run until the end. The agent is never told the right action, only how well it did, and the rewards are often **delayed**.',
    'The **return** is the discounted sum of future rewards `G = Σ γᵏ r`. The discount factor γ sets how far-sighted the agent is (effective horizon ≈ `1/(1−γ)`); compute returns backwards with `G = r + γ·G`.',
    'The agent optimizes **the reward you write**, not the goal you intended, so the reward function is the central design decision in game RL.',
    '**Exploration versus exploitation**: pure greedy choice gets stuck on the first thing that works, pure exploration never exploits. **ε-greedy** explores with probability ε (often decayed from 1.0 to about 0.05); stochastic policies explore by sampling.',
    'RL methods are organized by what they learn (**value**, **policy** or both), whether they learn a **model**, and whether they are **on-policy** or **off-policy**. For most game AI start with **PPO**; use classic AI for scriptable behaviour and imitation learning when you have recordings.',
  ],
  reading: [
    { title: 'Sutton and Barto: Reinforcement Learning: An Introduction (2nd edition, free online)', url: 'https://incompleteideas.net/book/the-book-2nd.html', source: 'book', note: 'The standard textbook; chapters 1 to 3 cover everything in this lesson and the next.' },
    { title: 'OpenAI Spinning Up: Key Concepts in RL', url: 'https://spinningup.openai.com/en/latest/spinningup/rl_intro.html', source: 'docs', note: 'A concise, practical introduction to states, actions, policies, returns and the RL problem.' },
    { title: 'Hugging Face Deep RL Course', url: 'https://huggingface.co/learn/deep-rl-course/', source: 'course', note: 'A free hands-on course from the basics to PPO, with Gymnasium and Stable-Baselines3.' },
    { title: 'David Silver: Introduction to Reinforcement Learning (lecture 1)', url: 'https://www.youtube.com/watch?v=2pWv7GOvuf0', source: 'video', note: 'DeepMind’s classic lecture series; the first lecture covers the RL problem and its vocabulary.' },
    { title: 'Playing Atari with Deep Reinforcement Learning', url: 'https://arxiv.org/abs/1312.5602', source: 'paper', note: 'The 2013 DQN paper that started the deep reinforcement learning boom.' },
  ],
};
