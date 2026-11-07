import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-dqn',
  title: 'Deep Q-Networks (DQN)',
  summary: 'Replace the Q-table with a neural network, then keep it stable with a replay buffer and a target network. Train a real DQN on CartPole in PyTorch, and learn Double DQN, the Rainbow add-ons and when value-based methods are the right tool.',
  minutes: 28,
  objectives: [
    'Explain how a neural network replaces the Q-table and what its loss function is',
    'Explain the two instabilities of naive deep Q-learning and how the replay buffer and target network fix them',
    'Read and run a complete DQN training loop in PyTorch',
    'Compute DQN and Double DQN targets, and explain overestimation bias',
    'Decide when DQN is appropriate (discrete actions) and when policy methods are better',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From a table to a network',
      blocks: [
        {
          type: 'p',
          text: 'Last lesson ended with a wall: a Q-table needs a cell for every state, and real games have effectively infinitely many. The **Deep Q-Network (DQN)** from DeepMind (Mnih et al., 2013 and the 2015 *Nature* paper) took the obvious step: replace the table with a neural network. The network takes the state as input and outputs **one Q-value per action**. Choosing an action is a forward pass and an `argmax`. Because similar states produce similar outputs, experience in one situation improves behaviour in nearby ones, which a table can never do. With a convolutional network reading raw 84×84 pixels, the same algorithm learned dozens of Atari games to human level with no game-specific knowledge.',
        },
        {
          type: 'p',
          text: 'Training turns the Q-learning update into a regression problem. The network is the prediction, the Bellman target is the label, and we minimise the squared gap. The weights of the network that computes the target are written `θ⁻` for a reason that will become clear in a moment.',
        },
        {
          type: 'math',
          tex: '\\mathcal{L}(\\theta) = \\mathbb{E}_{(s,a,r,s^{\\prime},d)\\sim\\mathcal{D}}\\Bigl[\\,\\bigl(\\underbrace{r + \\gamma\\,(1-d)\\,\\max_{a^{\\prime}} Q(s^{\\prime}, a^{\\prime}; \\theta^{-})}_{\\text{target}} - Q(s, a; \\theta)\\bigr)^{2}\\Bigr]',
          caption: 'The DQN loss: mean squared TD error over transitions sampled from a memory D. d is 1 for a terminal step (no bootstrapping). In practice the Huber loss replaces the square, to tame huge errors.',
        },
        {
          type: 'p',
          text: 'This looks like ordinary supervised learning, but two things are different, and **naive deep Q-learning without fixes often diverges**. First, in supervised learning the examples are independent and the labels are fixed. Here the examples come from an agent walking along a trajectory, so consecutive samples are almost identical (**correlated data**), and the distribution shifts every time the policy changes. Second, the label itself is computed from the network we are training, so every update moves the target too: a **moving target**, like a dog chasing its own tail. Together with function approximation and off-policy learning, this is sometimes called the "deadly triad" of RL.',
        },
        {
          type: 'definition',
          term: 'Deep Q-network',
          text: 'Q-learning where Q(s, a) is a neural network, trained by gradient descent on the TD error. DQN adds two stabilizers: a **replay buffer** (train on random batches of past transitions) and a **target network** (a slowly updated copy of the network that computes the targets).',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You train a Q-network on transitions in the exact order the agent experienced them, one at a time. Learning is erratic and the agent keeps forgetting early behaviour. What is the standard fix, and why does it work?',
      options: [
        { text: 'Store transitions in a replay buffer and train on random mini-batches from it, which breaks the correlation between consecutive samples and reuses old data', correct: true, why: 'Random batches resemble independent examples drawn from a broad distribution, as gradient descent assumes, and older experience is revisited instead of being forgotten.' },
        { text: 'Train with a much larger learning rate so the network adapts faster', why: 'A larger rate makes the instability worse: the updates overshoot and the moving target moves further.' },
        { text: 'Remove the discount factor so only immediate rewards matter', why: 'That changes the problem being solved and does not address correlated training data.' },
        { text: 'Switch to a Q-table', why: 'A table cannot represent a continuous or huge state space, which is why the network was introduced.' },
      ],
      explanation: 'Experience replay decorrelates the training data and reuses it. It is only possible because Q-learning is off-policy.',
    },
    {
      kind: 'concept',
      title: 'Replay buffer, target network and exploration',
      blocks: [
        {
          type: 'p',
          text: 'The **replay buffer** (idea from Long-Ji Lin, 1992) is a fixed-size memory of transitions `(s, a, r, s′, done)`, implemented as a ring buffer so the oldest entries fall out as new ones arrive. At every step the agent adds its newest transition, then trains on a **random mini-batch** (32 to 256 transitions) drawn from the whole memory. Because those transitions come from many different moments, they are nearly independent, and each is typically reused many times before it is overwritten, which makes learning far more sample-efficient. The program below shows the decorrelation numerically.',
        },
        {
          type: 'code',
          title: 'why_replay.py',
          runnable: true,
          code: `import random

rng = random.Random(0)
states = [t / 100 for t in range(100)]
latest = states[-8:]
sampled = sorted(states, key=lambda s: rng.random())[:8]

def spread(xs):
    return round(max(xs) - min(xs), 2)

print("latest 8 steps:", [round(x, 2) for x in latest], "spread", spread(latest))
print("random 8 steps:", sorted(round(x, 2) for x in sampled), "spread", spread(sampled))`,
          output: `latest 8 steps: [0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99] spread 0.07
random 8 steps: [0.25, 0.35, 0.4, 0.52, 0.56, 0.71, 0.75, 0.97] spread 0.72`,
          annotations: [
            { lines: '3-4', text: 'A toy trajectory of 100 states, drifting steadily upwards as the agent walks along a corridor.' },
            { lines: 5, text: 'Training on the latest steps: eight nearly identical states.' },
            { lines: 6, text: 'A replay-style batch: eight states drawn at random from all of memory (sorting by a random key picks a random subset reproducibly).' },
            { lines: '8-9', text: 'A helper measuring how spread out a batch is.' },
            { lines: '11-12', text: 'The latest steps cover a spread of 0.07, the replayed batch 0.72, ten times more diverse. A network trained on the first would fit only the corner of the world where the agent is *right now* and forget the rest; trained on the second, it keeps its knowledge of the whole trajectory.' },
          ],
        },
        {
          type: 'p',
          text: 'The **target network** attacks the moving target. Keep a second copy of the Q-network, `θ⁻`, that is used **only to compute targets** and is frozen between updates. Every `N` steps (hundreds to thousands) copy the main network’s weights into it (or blend them in slowly with a small factor `τ`, a "soft" update). For a while the labels hold still, so regression has a stable goal to fit; then they jump to a better position and the cycle repeats.',
        },
        {
          type: 'p',
          text: 'Finally, exploration. DQN is almost always **ε-greedy** with a schedule that starts with ε = 1 (pure randomness, so the buffer fills with varied experience) and decays to a small floor such as 0.05 or 0.01. The shape is a design choice: linear over the first few thousand steps is common, and exponential decay is smoother. Play with the schedule below.',
        },
        {
          type: 'graph',
          caption: 'An exponential ε schedule: ε(t) = 0.05 + 0.95·exp(−t/τ). Slow decay (large τ) keeps exploring for longer, which suits sparse rewards; fast decay trusts the network sooner. The red point marks step 3000.',
          x: [0, 15000],
          y: [0, 1.05],
          functions: [{ expr: '0.05+0.95*exp(-x/k)', label: 'ε(t)', color: 'blue' }],
          points: [{ x: 3000, y: '0.05+0.95*exp(-3000/k)', color: 'red' }],
          sliders: [{ name: 'k', min: 500, max: 5000, step: 100, value: 2000, label: 'decay time τ (steps)' }],
          readouts: [
            { label: 'ε at step 3000', expr: '0.05+0.95*exp(-3000/k)', digits: 3 },
            { label: 'steps until ε drops to 0.1', expr: 'k*ln(19)', digits: 0 },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why the buffer only works because Q-learning is off-policy',
          text: 'The transitions in the buffer were produced by *older* versions of the policy (and by random exploration). A method that learns the value of the policy that generated the data (SARSA, REINFORCE, PPO) cannot use them without correction. Q-learning’s target uses `max Q(s′, ·)`, the value of the *best* policy regardless of how the data was collected, so old data is perfectly valid. This reuse is DQN’s main strength: it squeezes a lot of learning out of each costly environment step, which is why value-based methods are popular when simulation is slow.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'In DQN, the target network is updated by gradient descent on the TD loss at every training step, just like the main Q-network.',
      answer: false,
      explanation: 'False. The target network receives **no gradients**. It is a frozen copy that is overwritten with the main network’s weights every N steps (or blended in with a small factor in the soft-update variant). Being updated far more slowly than the main network is the whole point.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the vectorised DQN target for a batch (NumPy arrays), masking out terminal transitions.',
      template: `target = rewards + gamma * (1 - ___) * next_q.max(axis=1)`,
      templateIsCode: true,
      blanks: [{ answers: ['dones', 'done', 'd'] }],
      wordBank: ['dones', 'rewards', 'gamma', 'next_q', 'actions'],
      explanation: '`(1 - dones)` is 0 for terminal transitions (so no future value is added) and 1 otherwise. `next_q.max(axis=1)` takes the best next-state value per row, i.e. per transition.',
    },
    {
      kind: 'concept',
      title: 'A complete DQN in PyTorch',
      blocks: [
        {
          type: 'p',
          text: 'Here is the whole algorithm in about fifty lines, trained on CartPole with Gymnasium. Every piece from the lesson is visible: the two networks, the ring-buffer memory, ε-greedy with decay, the sampled mini-batch, the target computed from the frozen network, and a periodic weight copy. (Run it on your PC; it needs `pip install torch gymnasium numpy` and takes under a minute on a CPU.)',
        },
        {
          type: 'code',
          title: 'dqn_cartpole.py',
          desktopOnly: true,
          outputVaries: true,
          code: `import random
from collections import deque

import gymnasium as gym
import numpy as np
import torch
from torch import nn

random.seed(0)
torch.manual_seed(0)
env = gym.make("CartPole-v1")

def make_net():
    return nn.Sequential(nn.Linear(4, 64), nn.ReLU(), nn.Linear(64, 64), nn.ReLU(), nn.Linear(64, 2))

q_net, target_net = make_net(), make_net()
target_net.load_state_dict(q_net.state_dict())
optimizer = torch.optim.Adam(q_net.parameters(), lr=1e-3)
buffer = deque(maxlen=20_000)
gamma, batch_size, sync_every = 0.99, 64, 250
eps_start, eps_end, eps_steps = 1.0, 0.05, 5_000

obs, _ = env.reset(seed=0)
episode_return, returns = 0.0, []
for step in range(15_000):
    eps = max(eps_end, eps_start - (eps_start - eps_end) * step / eps_steps)
    if random.random() < eps:
        action = env.action_space.sample()
    else:
        with torch.no_grad():
            action = int(q_net(torch.as_tensor(obs)).argmax())
    next_obs, reward, terminated, truncated, _ = env.step(action)
    buffer.append((obs, action, reward, next_obs, float(terminated)))
    obs, episode_return = next_obs, episode_return + reward
    if terminated or truncated:
        returns.append(episode_return)
        obs, _ = env.reset()
        episode_return = 0.0

    if len(buffer) >= 1_000:
        batch = random.sample(buffer, batch_size)
        s, a, r, s2, d = (torch.as_tensor(np.array(x), dtype=torch.float32) for x in zip(*batch))
        q = q_net(s).gather(1, a.long().unsqueeze(1)).squeeze(1)
        with torch.no_grad():
            target = r + gamma * (1 - d) * target_net(s2).max(dim=1).values
        loss = nn.functional.smooth_l1_loss(q, target)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    if step % sync_every == 0:
        target_net.load_state_dict(q_net.state_dict())
    if (step + 1) % 3_000 == 0:
        print(f"step {step + 1:>6}: mean return of last 10 episodes = {np.mean(returns[-10:]):.0f}")`,
          output: `step   3000: mean return of last 10 episodes = 88
step   6000: mean return of last 10 episodes = 190
step   9000: mean return of last 10 episodes = 102
step  12000: mean return of last 10 episodes = 112
step  15000: mean return of last 10 episodes = 142`,
          annotations: [
            { lines: '1-7', text: 'Python’s `random` and a `deque` for the memory, Gymnasium for the world, NumPy and PyTorch for the network.' },
            { lines: '9-11', text: 'Seed everything you can, and create CartPole.' },
            { lines: '13-14', text: 'The Q-network: 4 inputs (the observation), two hidden layers of 64, **2 outputs** (the Q-value of each action).' },
            { lines: '16-17', text: 'Two networks with identical weights: the online `q_net` that learns and the frozen `target_net`.' },
            { lines: '18-21', text: 'Adam optimizer, a ring buffer holding the last 20 000 transitions, and the hyperparameters: discount 0.99, batches of 64, sync every 250 steps, and an ε that falls from 1.0 to 0.05 over 5000 steps.' },
            { lines: '23-24', text: 'Start the first episode and keep track of returns.' },
            { lines: '25-26', text: 'The main loop, one environment step per iteration, with the **linear ε decay** computed from the step number.' },
            { lines: '27-31', text: '**ε-greedy**: a random action, or the `argmax` of the network’s outputs. `torch.no_grad()` is used because acting needs no gradients.' },
            { lines: '32-34', text: 'Step the environment and **store the transition**. Note `float(terminated)`: only a true termination, not a truncation, switches off bootstrapping.' },
            { lines: '35-38', text: 'At the end of an episode, log its return and reset.' },
            { lines: '40-42', text: 'Once the buffer holds 1000 transitions, **sample a random batch** and turn each column (states, actions, rewards, next states, dones) into a tensor.' },
            { lines: 43, text: 'The network’s prediction: all Q-values for the batch, then `gather` picks the value of the action that was actually taken.' },
            { lines: '44-45', text: 'The **target**, computed from the frozen network with no gradient: reward plus discounted best next value, zeroed for terminal transitions.' },
            { lines: '46-49', text: 'The Huber loss between prediction and target, then the usual three PyTorch steps: zero the gradients, backpropagate, update.' },
            { lines: '50-51', text: 'Every 250 steps, **copy** the online weights into the target network.' },
            { lines: '52-53', text: 'Progress every 3000 steps. A random agent scores about 22; here the mean climbs to 100 to 190. DQN learning curves are famously **noisy**: they rise, fall and rise again. Longer training, tuning and averaging over seeds smooth them (your numbers will differ).' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'What to watch while it trains',
          text: 'Plot the average return per episode (the main signal), the loss (it need not fall to zero; a loss that explodes means something is wrong), and the **average Q-value** of the network. In CartPole with γ = 0.99 and rewards of 1 per step, true Q-values are bounded by 1/(1−γ) = 100; if your network predicts thousands, it is overestimating. Compare against a random-agent baseline and run several seeds before trusting any conclusion.',
        },
        {
          type: 'p',
          text: 'Plain DQN has a known flaw: it **overestimates** values. The target uses `max` over noisy estimates, and the maximum of noisy numbers is biased upwards (the largest of several noisy guesses is, on average, too large). **Double DQN** (van Hasselt et al., 2015) separates the two jobs the max performs: the *online* network **chooses** the best next action, and the *target* network **evaluates** it. The program below computes both on the same batch.',
        },
        {
          type: 'code',
          title: 'double_dqn_targets.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

gamma = 0.9
rewards = np.array([1.0, 0.0, 0.0, 5.0])
dones = np.array([0.0, 0.0, 0.0, 1.0])
next_q_online = np.array([[1.0, 4.0], [2.0, 1.0], [3.0, 3.5], [9.0, 9.0]])
next_q_target = np.array([[1.5, 2.0], [2.5, 0.5], [3.2, 2.0], [9.0, 9.0]])

dqn = rewards + gamma * (1 - dones) * next_q_target.max(axis=1)

best = next_q_online.argmax(axis=1)
chosen = next_q_target[np.arange(len(best)), best]
double = rewards + gamma * (1 - dones) * chosen

print("DQN targets   :", np.round(dqn, 2))
print("Double targets:", np.round(double, 2))
print("difference    :", np.round(dqn - double, 2))`,
          output: `DQN targets   : [2.8  2.25 2.88 5.  ]
Double targets: [2.8  2.25 1.8  5.  ]
difference    : [0.   0.   1.08 0.  ]`,
          annotations: [
            { lines: '3-7', text: 'A batch of 4 transitions with their rewards, done flags (the last one is terminal), and the Q-values for the two actions in each next state according to the online and the target network.' },
            { lines: 9, text: '**DQN target**: take the *largest* value according to the target network, `max`, then mask terminals.' },
            { lines: '11-13', text: '**Double DQN target**: the online network picks the action (`argmax`), the target network supplies *its* value for that action. The two networks must agree that an action is good, so a lucky spike in one is not enough.' },
            { lines: '15-17', text: 'In the third transition the two networks disagree: the target network’s own favourite (3.2) is not the action the online network prefers (3.5), whose target value is only 2.0. DQN’s target is 2.88, Double DQN’s 1.8, an overestimate of **1.08** removed. For transitions where they agree, nothing changes.' },
          ],
        },
        {
          type: 'table',
          headers: ['Improvement', 'Idea', 'Effect'],
          rows: [
            ['**Double DQN**', 'Online net chooses the action, target net evaluates it', 'Less overestimation, more stable values'],
            ['**Dueling networks**', 'Separate heads for the state value V(s) and the advantage A(s, a)', 'Learns faster when many actions have similar values'],
            ['**Prioritized replay**', 'Sample transitions with large TD error more often', 'Learns from surprising events faster'],
            ['**n-step returns**', 'Use the next n rewards before bootstrapping', 'Faster reward propagation'],
            ['**Noisy networks**', 'Learned noise in the weights replaces ε-greedy', 'State-dependent exploration'],
            ['**Distributional RL (C51)**', 'Predict the whole distribution of returns, not just its mean', 'Richer learning signal'],
            ['**Rainbow** (2018)', 'All of the above combined in one agent', 'State of the art for value-based Atari'],
          ],
          caption: 'The DQN family. Rainbow showed the improvements are complementary.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this TD-target calculation for a batch of two transitions.',
      code: `rewards = [1.0, 0.0]
dones = [0, 1]
next_best = [4.0, 7.0]
gamma = 0.5
print([r + gamma * (1 - d) * q for r, d, q in zip(rewards, dones, next_best)])`,
      answer: '[3.0, 0.0]',
      hint: 'The second transition is terminal (`done = 1`), so its bootstrap term vanishes.',
      explanation: 'First: 1.0 + 0.5 × (1 − 0) × 4.0 = 3.0. Second: 0.0 + 0.5 × (1 − 1) × 7.0 = 0.0, since the episode ended and there is no future value to add.',
    },
    {
      kind: 'error',
      prompt: 'This training loop was meant to use a target network, but the agent diverges just like a naive version. Tap the line that defeats the purpose of the target network.',
      lines: [
        'for step in range(total_steps):',
        '    train_on_batch(q_net, target_net, buffer)',
        '    target_net.load_state_dict(q_net.state_dict())',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Copying the online weights into the target network on **every** step makes the target identical to the network being trained, so the labels move with every update and nothing is stabilised. The copy belongs under `if step % sync_every == 0:` (hundreds to thousands of steps apart), or should be a slow soft update.',
    },
    {
      kind: 'numeric',
      prompt: 'How many trainable parameters (weights and biases) does the CartPole Q-network `Linear(4, 64) → ReLU → Linear(64, 64) → ReLU → Linear(64, 2)` have?',
      answer: '4610',
      hint: 'A `Linear(n_in, n_out)` has `n_in × n_out` weights plus `n_out` biases. Add the three layers.',
      explanation: 'Layer 1: 4×64 + 64 = 320. Layer 2: 64×64 + 64 = 4160. Layer 3: 64×2 + 2 = 130. Total 320 + 4160 + 130 = **4610**. Even a tiny network like this stores more than a Q-table could for the continuous CartPole state space.',
      label: 'Parameters:',
    },
    {
      kind: 'concept',
      title: 'When to use DQN, and what goes wrong',
      blocks: [
        {
          type: 'p',
          text: 'DQN is a natural fit when the actions are **discrete** (a few buttons or moves) because the network has one output per action and the `max` over actions is trivial. It is **sample-efficient** thanks to replay, which matters when stepping the environment is expensive. It struggles with **continuous actions** (a steering angle, a thrust amount): taking a `max` over infinitely many actions is no longer a simple operation, and policy-based or actor–critic methods such as PPO and SAC are used instead. It is also more fragile than PPO: it is sensitive to the learning rate, the buffer size, the target update rate and the reward scale.',
        },
        {
          type: 'table',
          headers: ['Symptom', 'Likely cause', 'First thing to try'],
          rows: [
            ['Return never improves from the random baseline', 'Not enough exploration, or a bug in the reward or terminal flags', 'Slow the ε decay; check one hand-made transition end to end'],
            ['Return rises, then collapses', 'Moving targets or catastrophic forgetting', 'Larger buffer, slower target sync (or smaller τ), lower learning rate'],
            ['Q-values grow without bound', 'Overestimation, or `done` not masking terminals', 'Double DQN, check the `(1 - done)` factor, clip rewards'],
            ['Loss explodes', 'Reward scale too large or learning rate too high', 'Huber loss, gradient clipping, scale rewards to about [−1, 1]'],
            ['Works for one seed only', 'High variance, which is normal for DQN', 'Run 5+ seeds and report the average'],
          ],
          caption: 'Debugging a DQN agent.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises build the data structures and targets of a DQN agent in plain Python and NumPy, so they run right here: a ring-buffer replay memory, the batched DQN target, and the Double DQN target.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write a class `ReplayBuffer(capacity)` with `push(transition)` (store one item; when full, the **oldest** item is discarded), `__len__()` (the number of stored items) and `sample(n, rng)` (return a list of `n` **distinct** stored items chosen with the `random.Random` object `rng`; raise `ValueError` if fewer than `n` items are stored). Sampling must not remove items.',
      starter: `class ReplayBuffer:
    def __init__(self, capacity):
        ...

    def push(self, transition):
        ...

    def __len__(self):
        ...

    def sample(self, n, rng):
        ...
`,
      solution: `from collections import deque

class ReplayBuffer:
    def __init__(self, capacity):
        self.items = deque(maxlen=capacity)

    def push(self, transition):
        self.items.append(transition)

    def __len__(self):
        return len(self.items)

    def sample(self, n, rng):
        return rng.sample(list(self.items), n)
`,
      tests: `import random

buf = ReplayBuffer(3)
assert len(buf) == 0
for t in range(5):
    buf.push(("s", t))
assert len(buf) == 3
assert sorted(x[1] for x in buf.sample(3, random.Random(0))) == [2, 3, 4]

picked = buf.sample(2, random.Random(1))
assert len(picked) == 2 and len(set(picked)) == 2
assert all(x in [("s", 2), ("s", 3), ("s", 4)] for x in picked)
assert len(buf) == 3

try:
    buf.sample(4, random.Random(0))
    raised = False
except ValueError:
    raised = True
assert raised

big = ReplayBuffer(100)
for i in range(10):
    big.push(i)
assert len(big) == 10
assert sorted(big.sample(10, random.Random(2))) == list(range(10))
assert big.sample(0, random.Random(3)) == []

one = ReplayBuffer(1)
one.push("a")
one.push("b")
assert len(one) == 1 and one.sample(1, random.Random(0)) == ["b"]`,
      checks: ['Keeps at most `capacity` items and discards the oldest when full', '`len()` reports the stored count', '`sample` returns `n` distinct stored items using the given `rng`, raises `ValueError` when too few are stored, and does not remove anything'],
      hint: 'A `collections.deque(maxlen=capacity)` drops the oldest item automatically on `append`. For sampling, `rng.sample(list(self.items), n)` already picks distinct items and raises `ValueError` if `n` is too large.',
      explanation: 'This is the data structure at the heart of DQN. Real implementations store NumPy arrays instead of tuples for speed, and prioritized replay samples with unequal probabilities, but the ring-buffer-plus-random-sample design is the same. `deque(maxlen=...)` gives you the ring behaviour for free.',
    },
    {
      kind: 'code',
      prompt: 'Write `td_targets(rewards, next_q, dones, gamma)` with NumPy. `rewards` has shape `(B,)`, `next_q` has shape `(B, A)` (the target network’s Q-values for every action in each next state), and `dones` has shape `(B,)` holding 0/1 or booleans. Return the DQN targets `rewards + gamma * (1 - dones) * max over actions of next_q`, as an array of shape `(B,)`. Do not modify the inputs.',
      starter: `import numpy as np

def td_targets(rewards, next_q, dones, gamma):
    ...
`,
      solution: `import numpy as np

def td_targets(rewards, next_q, dones, gamma):
    rewards = np.asarray(rewards, dtype=float)
    dones = np.asarray(dones, dtype=float)
    best_next = np.asarray(next_q, dtype=float).max(axis=1)
    return rewards + gamma * (1.0 - dones) * best_next
`,
      packages: ['numpy'],
      tests: `import numpy as np

r = np.array([1.0, 0.0, 0.0, 5.0])
d = np.array([0.0, 0.0, 0.0, 1.0])
q = np.array([[1.5, 2.0], [2.5, 0.5], [3.2, 2.0], [9.0, 9.0]])
out = td_targets(r, q, d, 0.9)
assert out.shape == (4,)
assert np.allclose(out, [2.8, 2.25, 2.88, 5.0])

assert np.allclose(td_targets([1.0, 0.0], [[4.0, 1.0], [7.0, 2.0]], [0, 1], 0.5), [3.0, 0.0])
assert np.allclose(td_targets(np.array([0.0, 1.0]), np.array([[1.0, 2.0, 3.0], [-1.0, -2.0, -3.0]]), np.array([True, False]), 1.0), [0.0, 0.0])
assert np.allclose(td_targets(np.array([2.0]), np.array([[10.0, 20.0]]), np.array([1.0]), 0.99), [2.0])
assert np.allclose(td_targets(np.array([1.0]), np.array([[10.0, 20.0]]), np.array([0.0]), 0.0), [1.0])

r2, q2, d2 = r.copy(), q.copy(), d.copy()
td_targets(r2, q2, d2, 0.9)
assert (r2 == r).all() and (q2 == q).all() and (d2 == d).all()`,
      checks: ['Takes the maximum over the action axis (`axis=1`) of `next_q`', 'Zeroes the bootstrap term for terminal transitions (`dones` of 1 or `True`)', 'Returns an array of shape `(B,)` and leaves the inputs unchanged'],
      hint: 'Convert to float arrays, take `next_q.max(axis=1)`, and combine as `rewards + gamma * (1 - dones) * best_next`.',
      explanation: 'This single vectorised line replaces a Python loop over the batch and is exactly what runs inside every DQN implementation. Converting `dones` to float matters because `1 - dones` on a boolean array is a common source of subtle errors.',
    },
    {
      kind: 'code',
      prompt: 'Write `double_dqn_targets(rewards, next_q_online, next_q_target, dones, gamma)` with NumPy. For each transition, the **online** Q-values choose the best next action (`argmax`), and the **target** Q-values supply the value of that action. Return `rewards + gamma * (1 - dones) * chosen_value` as an array of shape `(B,)`. All Q arrays have shape `(B, A)`.',
      starter: `import numpy as np

def double_dqn_targets(rewards, next_q_online, next_q_target, dones, gamma):
    ...
`,
      solution: `import numpy as np

def double_dqn_targets(rewards, next_q_online, next_q_target, dones, gamma):
    rewards = np.asarray(rewards, dtype=float)
    dones = np.asarray(dones, dtype=float)
    online = np.asarray(next_q_online, dtype=float)
    target = np.asarray(next_q_target, dtype=float)
    best_actions = online.argmax(axis=1)
    chosen = target[np.arange(len(best_actions)), best_actions]
    return rewards + gamma * (1.0 - dones) * chosen
`,
      packages: ['numpy'],
      tests: `import numpy as np

r = np.array([1.0, 0.0, 0.0, 5.0])
d = np.array([0.0, 0.0, 0.0, 1.0])
online = np.array([[1.0, 4.0], [2.0, 1.0], [3.0, 3.5], [9.0, 9.0]])
target = np.array([[1.5, 2.0], [2.5, 0.5], [3.2, 2.0], [9.0, 9.0]])
out = double_dqn_targets(r, online, target, d, 0.9)
assert out.shape == (4,)
assert np.allclose(out, [2.8, 2.25, 1.8, 5.0])

# when both networks agree, it equals the ordinary DQN target
same = np.array([[1.0, 5.0], [4.0, 2.0]])
plain = np.array([1.0, 0.0]) + 0.9 * same.max(axis=1)
assert np.allclose(double_dqn_targets([1.0, 0.0], same, same, [0, 0], 0.9), plain)

# it can never exceed the plain DQN target
rng = np.random.default_rng(0)
o, t = rng.normal(size=(20, 4)), rng.normal(size=(20, 4))
rr = rng.normal(size=20)
dd = np.zeros(20)
assert (double_dqn_targets(rr, o, t, dd, 0.9) <= rr + 0.9 * t.max(axis=1) + 1e-12).all()

assert np.allclose(double_dqn_targets([2.0], [[0.0, 5.0]], [[100.0, 1.0]], [True], 0.9), [2.0])
assert np.allclose(double_dqn_targets([0.0], [[0.0, 5.0]], [[100.0, 1.0]], [False], 1.0), [1.0])`,
      checks: ['Chooses each next action with the **online** Q-values (`argmax` along axis 1)', 'Reads that action’s value from the **target** Q-values and masks terminal transitions', 'Matches the ordinary DQN target when both networks agree, and never exceeds it'],
      hint: '`best = next_q_online.argmax(axis=1)` gives one action per row. Pick the matching target values with `next_q_target[np.arange(len(best)), best]`, then apply the same formula as the DQN target.',
      explanation: 'The fancy index `target[np.arange(B), best]` picks one value per row. Because the target network’s value for the online network’s choice can never exceed the target network’s own maximum, the Double DQN target is always less than or equal to the DQN target. That is how it counters the upward bias of the max over noisy estimates.',
    },
  ],
  takeaways: [
    '**DQN** replaces the Q-table with a network mapping a state to one Q-value per action, trained to minimise the (Huber) TD error `(r + γ(1−d)·max Q(s′, ·; θ⁻) − Q(s, a; θ))²`.',
    'Naive deep Q-learning is unstable because of **correlated data** and a **moving target**. The **replay buffer** (random mini-batches from a ring buffer of past transitions) and the **target network** (a frozen copy synced every N steps) fix them. Replay is possible only because Q-learning is **off-policy**.',
    'A typical agent: ε-greedy acting with a decaying ε, one gradient step per environment step after a warm-up, a periodic target sync, and reward and Q-value monitoring. Always compare with a random baseline and several seeds, since DQN curves are noisy.',
    '**Double DQN** (online net picks, target net evaluates) removes the max’s overestimation. Dueling heads, prioritized replay, n-step returns, noisy nets and distributional values were combined in **Rainbow**.',
    'DQN suits **discrete** actions and expensive simulations; for continuous actions or more robust training, policy-gradient and actor–critic methods (next lessons) are the usual choice.',
  ],
  reading: [
    { title: 'Mnih et al.: Human-level control through deep reinforcement learning (Nature, 2015)', url: 'https://www.nature.com/articles/nature14236', source: 'paper', note: 'The DQN paper: replay, target network and Atari results.' },
    { title: 'Mnih et al.: Playing Atari with Deep Reinforcement Learning (2013)', url: 'https://arxiv.org/abs/1312.5602', source: 'paper', note: 'The original workshop paper that started deep RL.' },
    { title: 'Hessel et al.: Rainbow: Combining Improvements in Deep Reinforcement Learning', url: 'https://arxiv.org/abs/1710.02298', source: 'paper', note: 'How Double, Dueling, prioritized, n-step, noisy and distributional ideas fit together.' },
    { title: 'PyTorch tutorial: Reinforcement Learning (DQN)', url: 'https://docs.pytorch.org/tutorials/intermediate/reinforcement_q_learning.html', source: 'tutorial', note: 'An official DQN on CartPole with soft target updates.' },
    { title: 'Stable-Baselines3 documentation: DQN', url: 'https://stable-baselines3.readthedocs.io/en/master/modules/dqn.html', source: 'docs', note: 'A tested implementation and its hyperparameters.' },
    { title: 'Hugging Face Deep RL Course: Deep Q-Learning', url: 'https://huggingface.co/learn/deep-rl-course/unit3/introduction', source: 'course', note: 'A beginner-friendly treatment with Atari hands-on.' },
  ],
};
