import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-q-learning',
  title: 'Q-Learning: Learning Values from Experience',
  summary: 'The first real RL algorithm: temporal-difference learning without a model. Build a Q-table, update it one transition at a time, compare Q-learning with SARSA on a cliff, and meet the exploration problem on Gymnasium’s FrozenLake.',
  minutes: 27,
  objectives: [
    'Write the Q-learning update and explain each term (learning rate, discount, TD error, bootstrapping)',
    'Implement tabular Q-learning with ε-greedy exploration and correct terminal-state handling',
    'Explain the difference between off-policy Q-learning and on-policy SARSA, and see it on the cliff-walking task',
    'Choose α, γ and an ε schedule, and recognise why sparse rewards make exploration hard',
    'Explain why a Q-table does not scale and what replaces it (function approximation)',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From planning to learning: the temporal-difference update',
      blocks: [
        {
          type: 'p',
          text: 'Value iteration needed the whole model: for every state and action, the exact probabilities of every next state. Real games rarely hand you that. What the agent does have is **experience**: it takes an action and observes one sampled transition `(s, a, r, s′)`. **Q-learning**, introduced by Chris Watkins in 1989, learns the optimal action values `Q*(s, a)` from exactly such samples, one at a time, without ever being told the transition probabilities. It is **model-free**.',
        },
        {
          type: 'p',
          text: 'The idea is the Bellman optimality equation turned into an update. We keep a table `Q` with one number for each state-action pair (a **Q-table**). After each step we compare what we *believed* (`Q(s, a)`) with a better-informed guess built from what just happened: the reward we actually got plus the discounted value of the best action in the state we actually reached. We then nudge the belief a fraction `α` of the way towards that guess.',
        },
        {
          type: 'math',
          tex: 'Q(s, a) \\leftarrow Q(s, a) + \\alpha\\,\\Bigl[\\, \\underbrace{r + \\gamma \\max_{a^{\\prime}} Q(s^{\\prime}, a^{\\prime})}_{\\text{target}} - Q(s, a) \\,\\Bigr]',
          caption: 'The Q-learning update. The bracket is the temporal-difference (TD) error: target minus current estimate.',
        },
        {
          type: 'table',
          headers: ['Term', 'Meaning', 'Typical value'],
          rows: [
            ['`α` (learning rate)', 'How far to move towards the target each step. 1 overwrites the old value, small values average over many samples.', '0.1 to 0.5 in tables'],
            ['`γ` (discount)', 'How much the next state’s value counts.', '0.9 to 0.99'],
            ['**target**', '`r + γ·max Q(s′, ·)`: reward plus the best value available next. It is an *estimate built from another estimate*.', 'not a setting'],
            ['**TD error**', '`target − Q(s, a)`: how wrong the current belief was. Zero means the table already agrees with experience.', 'shrinks as it learns'],
            ['**terminal step**', 'If the episode ended at `s′`, there is no future, so the target is just `r`.', 'target = r'],
          ],
          caption: 'The pieces of the update.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why learning from guesses of guesses works',
          text: 'The target uses `Q(s′, ·)`, which is itself still being learned: the table **bootstraps** off its own estimates. That sounds circular, yet it works because every target contains one piece of *real* information, the reward `r` that was actually observed. Rewards near the goal become correct first, then flow backwards one step at a time through the updates, exactly as value iteration spread values outwards, except that here the sweeps are sampled episodes. With enough visits to every state-action pair and a suitably small learning rate, Q-learning is proven to converge to `Q*`.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'In C++ terms',
          text: 'A Q-table is just `float q[N_STATES][N_ACTIONS]`, and the whole algorithm is one line inside a game loop: `q[s][a] += alpha * (r + gamma * max_over(q[s2]) - q[s][a]);`. Everything else in this unit (neural networks, replay buffers, policy gradients) exists to replace that array when it no longer fits in memory or needs to generalise.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Q-learning is called **off-policy**. What does that mean in practice?',
      options: [
        { text: 'It learns the value of the greedy (best) policy even while it behaves with an exploratory, ε-greedy policy', correct: true, why: 'The update uses `max Q(s′, ·)`, the value of the best next action, regardless of which action the agent actually takes next. Behaviour and the policy being learned are different.' },
        { text: 'It does not use a policy at all, only rewards', why: 'There is a policy: the greedy policy derived from Q. Q-learning just does not require the *data-collecting* behaviour to be that policy.' },
        { text: 'It can only be trained once the episode has finished', why: 'It is the opposite: the update is applied after every single step, without waiting for the end of the episode.' },
        { text: 'It needs the transition probabilities of the game', why: 'That would be planning with a model. Q-learning is model-free and learns from sampled transitions only.' },
      ],
      explanation: 'Off-policy means the data-collecting policy and the learned policy differ. This is also what later allows replaying old experience (DQN).',
    },
    {
      kind: 'concept',
      title: 'Cliff walking: Q-learning versus SARSA',
      blocks: [
        {
          type: 'p',
          text: 'There is a one-letter change that turns Q-learning into **SARSA** (named after the tuple `s, a, r, s′, a′`). Instead of the *best* next action, SARSA’s target uses the next action the agent **actually chose**, exploratory moves included. Q-learning learns the value of the best policy; SARSA learns the value of the policy it is really following, wobbles and all. The classic test from Sutton and Barto is **cliff walking**: walk from the start (bottom-left) to the goal (bottom-right) along a cliff edge. Every step costs −1; stepping off the cliff costs −100 and sends you back to the start. The program below trains both algorithms on the same world with ε = 0.1 and compares the paths they learn.',
        },
        {
          type: 'code',
          title: 'cliff_walking.py',
          runnable: true,
          code: `import random

ROWS, COLS = 4, 8
START, GOAL = (3, 0), (3, 7)
CLIFF = {(3, c) for c in range(1, 7)}
MOVES = [(-1, 0), (0, 1), (1, 0), (0, -1)]

def step(s, a):
    r = min(max(s[0] + MOVES[a][0], 0), ROWS - 1)
    c = min(max(s[1] + MOVES[a][1], 0), COLS - 1)
    if (r, c) in CLIFF:
        return START, -100.0, False
    return (r, c), -1.0, (r, c) == GOAL

def train(algo, episodes=1000, alpha=0.5, eps=0.1, seed=0):
    rng = random.Random(seed)
    Q = {(r, c): [0.0] * 4 for r in range(ROWS) for c in range(COLS)}

    def act(s):
        if rng.random() < eps:
            return int(rng.random() * 4)
        return Q[s].index(max(Q[s]))

    returns = []
    for _ in range(episodes):
        s, a, done, total = START, act(START), False, 0.0
        while not done:
            s2, r, done = step(s, a)
            a2 = act(s2)
            nxt = max(Q[s2]) if algo == "q" else Q[s2][a2]
            Q[s][a] += alpha * (r + (0.0 if done else nxt) - Q[s][a])
            s, a, total = s2, a2, total + r
        returns.append(total)
    return Q, returns

def greedy_path(Q):
    s, path = START, [START]
    while s != GOAL and len(path) < 40:
        s, _, _ = step(s, Q[s].index(max(Q[s])))
        path.append(s)
    return path

def draw(path):
    for r in range(ROWS):
        print("".join("S" if (r, c) == START else "G" if (r, c) == GOAL else "C" if (r, c) in CLIFF
                      else "*" if (r, c) in path else "." for c in range(COLS)))

for algo in ("q", "sarsa"):
    Q, _ = train(algo)
    path = greedy_path(Q)
    print(f"{algo}: greedy path = {len(path) - 1} steps")
    draw(path)
    means = [sum(train(algo, seed=k)[1][-100:]) / 100 for k in range(10)]
    print(f"{algo}: mean online return over 10 runs = {sum(means) / 10:.1f}")`,
          output: `q: greedy path = 9 steps
........
........
********
SCCCCCCG
q: mean online return over 10 runs = -35.4
sarsa: greedy path = 13 steps
********
*......*
*......*
SCCCCCCG
sarsa: mean online return over 10 runs = -20.4`,
          annotations: [
            { lines: '1-6', text: 'The world: 4 rows by 8 columns, start bottom-left, goal bottom-right, and the cliff in between (bottom row). The four moves are up, right, down and left.' },
            { lines: '8-13', text: 'The **environment** as a function: given a state and an action it returns the next state, the reward and whether the episode is over. Falling off the cliff returns `START` with −100 but does *not* end the episode.' },
            { lines: '15-17', text: 'The **Q-table**: a dictionary mapping each grid square to a list of four action values, all starting at 0.' },
            { lines: '19-22', text: '**ε-greedy** action choice: with probability ε a random action, otherwise the action with the highest Q (ties go to the first).' },
            { lines: '24-27', text: 'One episode: reset to the start, choose the first action, and loop until the episode ends.' },
            { lines: '28-29', text: 'Take the step, then choose the *next* action immediately; SARSA needs it, Q-learning ignores it.' },
            { lines: 30, text: '**The only difference between the two algorithms.** Q-learning bootstraps from the best next value; SARSA from the value of the action it will really take.' },
            { lines: 31, text: 'The TD update. At a terminal step there is no next state, so the target is just the reward.' },
            { lines: '32-34', text: 'Move on, add up the return, and hand back both the table and the per-episode returns.' },
            { lines: '36-41', text: 'Follow the greedy policy (no exploration) from the start to read off the path the agent has learned.' },
            { lines: '43-46', text: 'Draw that path on the grid: `S` start, `G` goal, `C` cliff, `*` path.' },
            { lines: '48-52', text: 'Q-learning finds the **shortest path along the cliff edge** (9 steps, row just above the cliff). SARSA learns a **long detour along the top** (13 steps), as far from the cliff as possible.' },
            { lines: '53-54', text: 'But while *learning* (with ε = 0.1 random moves) Q-learning falls off the cliff more often: its average return is **−35.4** versus SARSA’s **−20.4**. The safe path pays off when your own exploration is taken into account.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Same world, two different answers, both correct',
          text: '**Q-learning** answers "what is the best possible policy?" and finds the risky edge. **SARSA** answers "what is the best policy *given that I sometimes act randomly*?" and keeps away from the cliff. If the agent will later act greedily (a trained game bot), Q-learning’s answer is the right one; if exploration noise stays in the deployed system, or mistakes are expensive while learning, SARSA’s caution is valuable. If you shrink ε towards 0 during training, SARSA also converges to the optimal edge path.',
        },
        {
          type: 'table',
          headers: ['Aspect', 'Q-learning', 'SARSA'],
          rows: [
            ['Target', '`r + γ · max Q(s′, ·)`', '`r + γ · Q(s′, a′)`, with a′ the action actually chosen'],
            ['Type', '**Off-policy**', '**On-policy**'],
            ['Learns', 'The optimal policy', 'The policy it is following, exploration included'],
            ['On the cliff', 'Shortest path, falls more while learning', 'Safe detour, fewer falls while learning'],
            ['Can reuse old data?', 'Yes (replay buffers)', 'No, data must come from the current policy'],
          ],
          caption: 'Two sibling algorithms.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If you keep ε fixed at 0.1 while training, a Q-learning agent’s greedy policy (ε = 0) can still be the optimal policy, even though its behaviour during training still takes random actions.',
      answer: true,
      explanation: 'True. Because Q-learning is off-policy, the table converges to Q* no matter how exploratory the behaviour is, provided every state-action pair keeps being visited. The greedy policy read from that table is then optimal. (How well the agent performs *while* training is a separate matter, as the cliff showed.)',
    },
    {
      kind: 'fill',
      prompt: 'Complete the Q-learning update for one transition.',
      template: `target = r + gamma * ___(Q[s2])
Q[s][a] += ___ * (target - Q[s][a])`,
      templateIsCode: true,
      blanks: [{ answers: ['max'] }, { answers: ['alpha'] }],
      wordBank: ['max', 'alpha', 'gamma', 'sum', 'min'],
      explanation: 'The target uses the **best** value available in the next state (`max`), and the difference between target and current estimate is scaled by the learning rate `alpha`. SARSA would replace `max(Q[s2])` with `Q[s2][a2]`.',
    },
    {
      kind: 'concept',
      title: 'Exploration, schedules and FrozenLake',
      blocks: [
        {
          type: 'p',
          text: 'Everything above assumed the agent eventually reaches the goal by accident. In many games the reward is **sparse**: nothing happens until you win. Gymnasium’s **FrozenLake** is the textbook example: a 4×4 grid, reward 1 only for reaching the goal, 0 for everything else, and holes that end the episode. With a Q-table full of zeros, the greedy action is always the first one (left), so a purely greedy agent walks into the wall forever and never sees a single reward. It must **explore first**, which is why serious implementations start with ε near 1 and **decay** it as the table fills in.',
        },
        {
          type: 'code',
          title: 'frozen_lake_q.py',
          desktopOnly: true,
          code: `import gymnasium as gym
import numpy as np

env = gym.make("FrozenLake-v1", is_slippery=False)
n_states, n_actions = env.observation_space.n, env.action_space.n
Q = np.zeros((n_states, n_actions))
rng = np.random.default_rng(0)
alpha, gamma = 0.8, 0.95

for episode in range(2000):
    eps = max(0.05, 1.0 - episode / 1000)
    s, _ = env.reset(seed=episode)
    done = False
    while not done:
        a = int(rng.integers(n_actions)) if rng.random() < eps else int(np.argmax(Q[s]))
        s2, r, terminated, truncated, _ = env.step(a)
        target = r + gamma * Q[s2].max() * (not terminated)
        Q[s, a] += alpha * (target - Q[s, a])
        s, done = s2, terminated or truncated

s, _ = env.reset(seed=0)
path, done = [s], False
while not done:
    s, r, terminated, truncated, _ = env.step(int(np.argmax(Q[s])))
    path.append(int(s))
    done = terminated or truncated
print("greedy path:", path)

wins = 0
for episode in range(100):
    s, _ = env.reset(seed=10_000 + episode)
    done = False
    while not done:
        s, r, terminated, truncated, _ = env.step(int(np.argmax(Q[s])))
        done = terminated or truncated
    wins += r
print("greedy success rate:", wins / 100)`,
          output: `greedy path: [0, 4, 8, 9, 13, 14, 15]
greedy success rate: 1.0`,
          annotations: [
            { lines: '1-2', text: 'Gymnasium provides the environment, NumPy the table. Both run on your PC (this block is display-only in the app).' },
            { lines: '4-8', text: 'A non-slippery FrozenLake. `observation_space.n` (16 squares) and `action_space.n` (4 moves) give the table its shape: a 16×4 array.' },
            { lines: '10-19', text: 'The training loop. `eps` **decays linearly** from 1.0 to 0.05 over the first 950 episodes. `terminated` (a real end: hole or goal) switches off bootstrapping, while `truncated` (the 100-step limit) does not.' },
            { lines: '21-27', text: 'Follow the learned greedy policy from the start: square 0 down to 4, 8, then 9, 13, 14, and the goal 15.' },
            { lines: '29-37', text: 'Test over 100 fresh episodes with no exploration. Success is 100%.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Terminated is not truncated',
          text: 'Gymnasium returns two flags. `terminated` means the episode reached a genuine end (goal, death): the future value is exactly zero. `truncated` means a **time limit** cut the episode short: the state is not special and has a normal future, so you must still bootstrap from `Q[s2]`. Treating a timeout as a terminal state teaches the agent that the final seconds of every level are worthless, a subtle and common bug.',
        },
        {
          type: 'table',
          headers: ['Hyperparameter', 'Too low', 'Too high', 'Starting point'],
          rows: [
            ['**α** (learning rate)', 'Learns very slowly', 'Estimates jump around; may never settle', '0.1 to 0.5 (smaller if the environment is noisy)'],
            ['**γ** (discount)', 'Short-sighted; ignores distant goals', 'Slow, noisy credit assignment', '0.95 to 0.99'],
            ['**ε** (exploration)', 'Gets stuck on early habits', 'Never exploits what it learned', 'Start near 1, decay to 0.01 to 0.1'],
            ['**Episodes**', 'Table not converged', 'Wasted time', 'Plot the return; stop when flat'],
          ],
          caption: 'Tuning tabular Q-learning.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of one Q-learning update.',
      code: `Q = {"A": [0.0, 0.0], "B": [2.0, 6.0]}
alpha, gamma = 0.5, 0.5
a, r = 0, 1.0
target = r + gamma * max(Q["B"])
Q["A"][a] += alpha * (target - Q["A"][a])
print(Q["A"])`,
      answer: '[2.0, 0.0]',
      hint: 'The target is `1 + 0.5 · 6 = 4`. Move halfway from 0 towards it.',
      explanation: '`max(Q["B"])` is 6.0, so the target is 1.0 + 0.5×6.0 = 4.0. The TD error is 4.0 − 0 = 4.0 and α = 0.5 moves the estimate by 2.0. Action 1 of state "A" is untouched.',
    },
    {
      kind: 'error',
      prompt: 'This loop replays recorded transitions, but the agent in the finished game ends up thinking that standing next to the goal is worth more than reaching it. One line is faulty. Tap it.',
      lines: [
        'for s, a, r, s2, done in transitions:',
        '    target = r + gamma * max(Q[s2])',
        '    Q[s][a] += alpha * (target - Q[s][a])',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The target ignores `done`. When the episode has ended at `s2` there is no future reward, so the target must be just `r`: `target = r + (0.0 if done else gamma * max(Q[s2]))`. Bootstrapping from a terminal state’s leftover table values adds value that does not exist.',
    },
    {
      kind: 'numeric',
      prompt: 'A transition has `Q(s, a) = 2.0`, reward `r = 1.0`, `γ = 0.9`, `α = 0.5`, a non-terminal next state whose best action has `Q = 4.0`. What is the new value of `Q(s, a)`?',
      answer: '3.3',
      hint: 'Target: `1 + 0.9 × 4 = 4.6`. TD error: `4.6 − 2.0 = 2.6`. Then `2.0 + 0.5 × 2.6`.',
      explanation: 'Target = 1.0 + 0.9×4.0 = 4.6. TD error = 4.6 − 2.0 = 2.6. New value = 2.0 + 0.5×2.6 = 3.3.',
      label: 'New Q:',
    },
    {
      kind: 'concept',
      title: 'Where tables stop working',
      blocks: [
        {
          type: 'p',
          text: 'A Q-table needs one cell per state-action pair, and every cell must be visited many times. The cliff has 32 squares and FrozenLake has 16, so that is easy. Now count the states of a real game. A Rocket League match has car positions, velocities, rotations, boost levels and the ball: dozens of **continuous** numbers, which means effectively infinitely many states. A chessboard has more positions than atoms in the observable universe. An Atari screen is 84×84 pixels, each with 256 values. The agent will **never** see the same state twice, so a table can never learn anything.',
        },
        {
          type: 'p',
          text: 'The fix is **function approximation**: replace the table lookup `Q[s][a]` with a parameterised function `Q(s, a; θ)`, a neural network that takes the state and outputs one value per action. Similar states get similar values automatically, so what is learned in one situation transfers to nearby ones. The update stays the same in spirit: move the output towards the TD target, but with a gradient step on `θ` instead of editing a cell. That is exactly the **Deep Q-Network (DQN)** of two lessons from now. Before that we need a standard way to talk to environments, which is Gymnasium, next.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Start tabular', text: 'If your game can be reduced to a few hundred discrete states, a Q-table is fast to write, easy to debug (you can print it) and converges reliably.' },
            { title: 'Discretise carefully', text: 'Binning continuous values (position into 10 buckets) can extend tables to modest problems, but the table grows exponentially with the number of variables.' },
            { title: 'Plot the return', text: 'The average return per episode is the main health signal. It should trend upward and then flatten; a flat line from the start means the agent never found a reward (explore more), and wild swings mean α is too large.' },
            { title: 'Check the Q-values', text: 'Print or visualise the table. Values should be higher nearer the goal and consistent with the discount. Sudden huge numbers usually mean a bug in the terminal handling or the reward.' },
            { title: 'Move to a network when the state is continuous or large', text: 'DQN keeps Q-learning’s update but needs a replay buffer and a target network to stay stable, which is the subject of the DQN lesson.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises build the pieces of a tabular agent: a single TD update, an offline trainer that replays recorded transitions, and the exploration schedule from FrozenLake.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `q_update(Q, s, a, r, s2, done, alpha, gamma)`. `Q` is a dict mapping each state to a **list** of action values. Apply one Q-learning update **in place** to `Q[s][a]` and return the TD error (`target - old value`). The target is `r` alone when `done` is true, otherwise `r + gamma * max(Q[s2])`.',
      starter: `def q_update(Q, s, a, r, s2, done, alpha, gamma):
    ...
`,
      solution: `def q_update(Q, s, a, r, s2, done, alpha, gamma):
    target = r if done else r + gamma * max(Q[s2])
    td_error = target - Q[s][a]
    Q[s][a] += alpha * td_error
    return td_error
`,
      tests: `import math

Q = {"A": [0.0, 0.0], "B": [2.0, 6.0]}
err = q_update(Q, "A", 0, 1.0, "B", False, 0.5, 0.5)
assert math.isclose(err, 4.0)
assert math.isclose(Q["A"][0], 2.0) and Q["A"][1] == 0.0
assert Q["B"] == [2.0, 6.0]

Q = {"A": [1.0, 0.0], "B": [9.0, 9.0]}
err = q_update(Q, "A", 0, 1.0, "B", True, 0.5, 0.9)
assert math.isclose(err, 0.0) and math.isclose(Q["A"][0], 1.0)

Q = {"S": [5.0, 1.0], "T": [0.0, 0.0]}
err = q_update(Q, "S", 1, -1.0, "T", False, 1.0, 0.9)
assert math.isclose(err, -2.0) and math.isclose(Q["S"][1], -1.0) and Q["S"][0] == 5.0

Q = {"S": [2.0, 0.0], "T": [4.0, 1.0]}
err = q_update(Q, "S", 0, 1.0, "T", False, 0.5, 0.9)
assert math.isclose(Q["S"][0], 3.3) and math.isclose(err, 2.6)

Q = {"S": [3.0], "T": [100.0]}
q_update(Q, "S", 0, 2.0, "T", True, 0.1, 0.99)
assert math.isclose(Q["S"][0], 2.9)
assert Q["T"] == [100.0]`,
      checks: ['Moves `Q[s][a]` by `alpha` times the TD error, changing nothing else in the table', 'Uses `r` alone as the target when `done` is true (no bootstrapping from the terminal state)', 'Returns the TD error `target - old value`'],
      hint: 'Compute `target` first: `r if done else r + gamma * max(Q[s2])`. Then `td_error = target - Q[s][a]`, add `alpha * td_error` and return it.',
      explanation: 'This is the entire learning rule of tabular Q-learning. Returning the TD error is a useful habit: its size over time is a direct measure of how much the agent is still learning, and some algorithms (prioritised replay) use it to decide which experiences to revisit.',
    },
    {
      kind: 'code',
      prompt: 'Write `train_offline(transitions, n_actions, sweeps, alpha, gamma)`. `transitions` is a list of `(s, a, r, s2, done)` tuples. Build a Q-table (dict from state to a list of `n_actions` zeros) that has a row for **every state that appears as `s` or `s2`**, then make `sweeps` passes over the transitions **in the given order**, applying the Q-learning update (target is `r` when `done`) after each one. Return the table.',
      starter: `def train_offline(transitions, n_actions, sweeps, alpha, gamma):
    ...
`,
      solution: `def train_offline(transitions, n_actions, sweeps, alpha, gamma):
    Q = {}
    for s, a, r, s2, done in transitions:
        Q.setdefault(s, [0.0] * n_actions)
        Q.setdefault(s2, [0.0] * n_actions)
    for _ in range(sweeps):
        for s, a, r, s2, done in transitions:
            target = r if done else r + gamma * max(Q[s2])
            Q[s][a] += alpha * (target - Q[s][a])
    return Q
`,
      tests: `import math

chain = [(0, 1, 0.0, 1, False), (1, 1, 0.0, 2, False), (2, 1, 1.0, 3, True)]
Q = train_offline(chain, 2, 3, 1.0, 0.9)
assert set(Q) == {0, 1, 2, 3}
assert math.isclose(Q[2][1], 1.0)
assert math.isclose(Q[1][1], 0.9)
assert math.isclose(Q[0][1], 0.81)
assert Q[0][0] == 0.0 and Q[3] == [0.0, 0.0]

Q1 = train_offline(chain, 2, 1, 1.0, 0.9)
assert math.isclose(Q1[2][1], 1.0) and Q1[1][1] == 0.0 and Q1[0][1] == 0.0

one = [(0, 0, 1.0, 1, True)]
assert math.isclose(train_offline(one, 1, 1, 0.5, 0.9)[0][0], 0.5)
assert math.isclose(train_offline(one, 1, 2, 0.5, 0.9)[0][0], 0.75)

better = [(0, 0, 1.0, 1, True), (0, 1, 3.0, 1, True)]
Q = train_offline(better, 2, 50, 0.5, 0.9)
assert Q[0][1] > Q[0][0]
assert math.isclose(Q[0][1], 3.0, rel_tol=1e-6)

assert train_offline([], 2, 5, 0.5, 0.9) == {}
copy = list(chain)
train_offline(chain, 2, 2, 0.5, 0.9)
assert copy == chain`,
      checks: ['Creates a zero row for every state seen as `s` or `s2`', 'Makes `sweeps` ordered passes, applying the update with the correct terminal handling', 'Reaches the exact chain values 1.0, 0.9 and 0.81 after three sweeps with `alpha = 1`'],
      hint: 'First loop over the transitions with `Q.setdefault(state, [0.0] * n_actions)` for both `s` and `s2`. Then `for _ in range(sweeps):` loop over the transitions again, applying `target = r if done else r + gamma * max(Q[s2])` and the update.',
      explanation: 'On the chain, the reward at the end reaches state 2 after sweep one, state 1 after sweep two and state 0 after sweep three: value flows backwards one step per pass, with the discount 0.9 applied once per step. This replaying of stored transitions is precisely the idea behind the replay buffer of DQN.',
    },
    {
      kind: 'code',
      prompt: 'Write `epsilon_at(episode, start, end, decay_episodes)` returning the exploration rate for a given episode: it falls **linearly** from `start` at episode 0 to `end` at episode `decay_episodes`, and stays at `end` afterwards.',
      starter: `def epsilon_at(episode, start, end, decay_episodes):
    ...
`,
      solution: `def epsilon_at(episode, start, end, decay_episodes):
    fraction = min(episode / decay_episodes, 1.0)
    return start + (end - start) * fraction
`,
      tests: `import math

assert math.isclose(epsilon_at(0, 1.0, 0.05, 1000), 1.0)
assert math.isclose(epsilon_at(500, 1.0, 0.05, 1000), 0.525)
assert math.isclose(epsilon_at(1000, 1.0, 0.05, 1000), 0.05)
assert math.isclose(epsilon_at(5000, 1.0, 0.05, 1000), 0.05)
assert math.isclose(epsilon_at(250, 0.5, 0.1, 100), 0.1)
assert math.isclose(epsilon_at(25, 0.5, 0.1, 100), 0.4)
vals = [epsilon_at(e, 1.0, 0.1, 10) for e in range(15)]
assert all(vals[i] >= vals[i + 1] for i in range(14))
assert math.isclose(epsilon_at(3, 0.0, 1.0, 6), 0.5)`,
      checks: ['Returns `start` at episode 0 and `end` from episode `decay_episodes` onwards', 'Interpolates linearly in between (episode 500 of 1000 from 1.0 to 0.05 gives 0.525)', 'Never goes beyond `end`, however large the episode number'],
      hint: 'The fraction of the way through is `min(episode / decay_episodes, 1.0)`. The result is `start + (end - start) * fraction`.',
      explanation: 'Linear decay is the simplest schedule; exponential decay (`end + (start - end) * exp(-episode / tau)`) is also popular. The important design decision is the same either way: explore a lot while the table is empty, then increasingly trust what it has learned. The `min(..., 1.0)` clamp is what holds ε at its floor after the decay finishes.',
    },
  ],
  takeaways: [
    '**Q-learning** learns action values from sampled transitions with no model: `Q(s, a) += α · (r + γ · max Q(s′, ·) − Q(s, a))`. The bracket is the **TD error**, and the target **bootstraps** from the table’s own estimate of the next state.',
    'At a **terminal** step the target is just `r`. In Gymnasium only `terminated` stops bootstrapping; `truncated` (a time limit) does not.',
    'Q-learning is **off-policy** (learns the best policy while behaving exploratorily); **SARSA** is **on-policy** (learns the value of the policy it follows). On the cliff, Q-learning finds the risky shortest path, SARSA the safe detour, and Q-learning falls more while training.',
    'With sparse rewards the agent must **explore** before it can exploit: start ε near 1 and decay it, and choose α and γ sensibly (0.1 to 0.5 and 0.95 to 0.99 are good starting points). Always plot the return per episode.',
    'A Q-table cannot cover continuous or huge state spaces. **Function approximation** (a neural network predicting Q) keeps the same update and leads to the DQN.',
  ],
  reading: [
    { title: 'Sutton and Barto: Reinforcement Learning: An Introduction, chapter 6', url: 'https://incompleteideas.net/book/the-book-2nd.html', source: 'book', note: 'Temporal-difference learning, SARSA, Q-learning and the cliff-walking example.' },
    { title: 'Hugging Face Deep RL Course: Introduction to Q-Learning', url: 'https://huggingface.co/learn/deep-rl-course/unit2/q-learning', source: 'course', note: 'A friendly walkthrough with a FrozenLake hands-on.' },
    { title: 'Gymnasium documentation: Frozen Lake', url: 'https://gymnasium.farama.org/environments/toy_text/frozen_lake/', source: 'docs', note: 'The environment’s observation, action and reward definitions.' },
    { title: 'Watkins and Dayan: Q-learning (Machine Learning, 1992)', url: 'https://link.springer.com/article/10.1007/BF00992698', source: 'paper', note: 'The convergence proof for Q-learning.' },
    { title: 'Wikipedia: Q-learning', url: 'https://en.wikipedia.org/wiki/Q-learning', source: 'wikipedia', note: 'Quick reference for the update rule and its variants.' },
  ],
};
