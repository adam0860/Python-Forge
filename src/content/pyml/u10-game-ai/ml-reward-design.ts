import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-reward-design',
  title: 'Reward Design and Curriculum Learning',
  summary: 'The reward function is the specification of your bot. Learn sparse versus dense rewards, safe potential-based shaping, how agents exploit loopholes, and how curricula give hard problems a first success to learn from.',
  minutes: 27,
  objectives: [
    'Explain why the reward function defines behavior, and recognise reward hacking and Goodhart’s law',
    'Contrast sparse and dense rewards and say when each is appropriate',
    'Apply potential-based shaping and explain why it cannot change the optimal policy',
    'Combine several weighted reward terms and inspect their contributions',
    'Use curriculum learning, including an adaptive curriculum, to make hard tasks learnable',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The reward is the specification',
      blocks: [
        {
          type: 'p',
          text: 'In supervised learning you give the model the right answers. In RL you give it only a score, and the agent will find *whatever behavior maximizes that score*, which may not be what you meant. The [[reward-hacking|reward function]] is therefore the real specification of your bot, and writing it is the hardest and most creative part of applied RL. This is **Goodhart’s law** applied to machines: when a measure becomes a target, it ceases to be a good measure.',
        },
        {
          type: 'p',
          text: 'The examples are famous. In OpenAI’s *CoastRunners* boat racing game the reward was the in-game score, which comes from collecting targets as well as finishing. The trained agent discovered a lagoon where targets respawn, and circled there forever, crashing and catching fire, scoring about 20% *more* than human players while never finishing the race. DeepMind collected dozens of similar *specification gaming* cases: a robot rewarded for a stacking block\'s height flipped the block instead of stacking it, a simulated walker found physics glitches to move without walking, an evolved creature grew tall and fell over because "distance travelled" counted the fall. Each agent did exactly what the reward said, and nothing that the designer *meant*.',
        },
        {
          type: 'table',
          headers: ['Reward style', 'Example', 'Strength', 'Weakness'],
          rows: [
            ['**Sparse** (outcome only)', '+1 for scoring a goal, 0 otherwise', 'Exactly the goal; hard to exploit', 'Random exploration may never find a reward, so learning never starts'],
            ['**Dense** (progress signal)', 'A little reward each step for moving towards the ball', 'Easy to learn from', 'Easy to exploit; can pull the agent towards the wrong behavior'],
            ['**Event-based**', '+5 for touching the ball, +100 for a goal, −100 for conceding', 'Clear, interpretable', 'Can still be gamed (touch the ball repeatedly)'],
            ['**Shaped** (potential-based)', 'Dense progress reward of the form γΦ(s′) − Φ(s)', 'Dense *and* provably safe', 'Needs a sensible potential function Φ'],
            ['**Learned or imitation-based**', 'A discriminator or recorded human play defines "good"', 'Captures hard-to-describe style', 'Needs data; the learned reward itself can be exploited'],
          ],
          caption: 'Reward styles. Real bots usually combine a sparse core objective with carefully chosen dense terms.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Two questions to ask of every reward term',
          text: '**1. What is the cheapest way to earn this?** Imagine the laziest, most literal agent. If it can collect the reward in a way you would find silly (touching the ball every step, spinning in place, standing next to a respawning item), a trained agent will find it. **2. Does it reward the outcome or a proxy?** Rewarding the *outcome* you want (a goal scored) is robust; rewarding a *proxy* (moving towards the ball) works only as long as the proxy and the outcome stay correlated, and optimisation pressure breaks that correlation.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A racing bot is rewarded +1 for every checkpoint it touches, and checkpoints respawn after 10 seconds. After training, the car drives in tight circles around one checkpoint and never finishes a lap. What happened, and what is the best fix?',
      options: [
        { text: 'It found a reward loophole (reward hacking). Reward lap completion or progress along the track (and make each checkpoint count once per lap) instead of repeatable touches', correct: true, why: 'The reward as written is maximised by farming a respawning checkpoint. Tie the reward to *progress*, such as distance along the track or lap completion, so that circling earns nothing.' },
        { text: 'The learning rate was too high, so training should be repeated with a smaller one', why: 'The agent is not failing to optimise; it is optimising the reward very well. The specification is wrong, not the optimiser.' },
        { text: 'The network is too small to represent driving around a track', why: 'Circling a checkpoint is a harder-to-learn behavior than driving forward, if anything. The agent chose it because it pays better.' },
        { text: 'The discount factor was zero, so the agent could not plan a lap', why: 'With γ = 0 the agent would be short-sighted, but it would not discover a repeating circling strategy either. The root cause is the repeatable reward.' },
      ],
      explanation: 'When an agent behaves "stupidly" but scores well, suspect the reward, not the learner. Make rewards non-repeatable and tied to real progress.',
    },
    {
      kind: 'concept',
      title: 'Potential-based reward shaping',
      blocks: [
        {
          type: 'p',
          text: 'We want dense signals without changing what the agent is ultimately trying to do. The one family of extra rewards that is *guaranteed* safe is **potential-based shaping** (Ng, Harada and Russell, 1999). Choose any function `Φ(s)` of the state that estimates how promising it is, such as the negative distance to the goal, and add to every transition the bonus below.',
        },
        {
          type: 'math',
          tex: 'F(s, s^{\\prime}) = \\gamma\\,\\Phi(s^{\\prime}) - \\Phi(s), \\qquad r^{\\mathrm{shaped}} = r + F(s, s^{\\prime})',
          caption: 'Potential-based shaping. The bonus is positive when the agent moves to a state of higher potential and negative when it moves to a lower one. By convention Φ of a terminal state is 0.',
        },
        {
          type: 'derivation',
          steps: [
            { tex: '\\sum_{t=0}^{T-1} \\gamma^{t}\\, F(s_t, s_{t+1}) = \\sum_{t=0}^{T-1} \\gamma^{t}\\bigl(\\gamma\\,\\Phi(s_{t+1}) - \\Phi(s_t)\\bigr)', why: 'The total discounted shaping reward along an episode: apply the definition of F at every step.' },
            { tex: '= \\sum_{t=1}^{T} \\gamma^{t}\\,\\Phi(s_t) - \\sum_{t=0}^{T-1} \\gamma^{t}\\,\\Phi(s_t)', why: 'Move the factor γ inside: γ·γ^t·Φ(s_{t+1}) is γ^{t+1}·Φ(s_{t+1}), so the first sum runs over t+1 = 1…T.' },
            { tex: '= \\gamma^{T}\\,\\Phi(s_T) - \\Phi(s_0) = -\\Phi(s_0)', why: 'Almost all terms cancel (the sums telescope), leaving only the ends. With Φ of the terminal state equal to 0, what remains is −Φ(s₀).' },
          ],
          result: 'The total shaping reward depends only on the *starting* state, not on the path taken. It adds the same constant to every policy’s return from a given start, so it cannot change which policy is best. Wiggling back and forth earns nothing, because every gain is cancelled by the later loss.',
        },
        {
          type: 'p',
          text: 'Compare this with a plausible but *non*-potential-based bonus: "+1 whenever the agent gets closer to the goal than on the previous step". It sounds like the same idea, but it only pays the gains and never charges the losses, so an agent can step towards the goal and away again, earning +1 every second step, forever. The program below runs both on a number line with the goal at 10, a limit of 100 steps and +10 for reaching the goal, for an agent that walks straight to the goal and for one that wiggles back and forth.',
        },
        {
          type: 'code',
          title: 'reward_hacking_demo.py',
          runnable: true,
          code: `GOAL, MAX_STEPS, GAMMA = 10, 100, 1.0

def episode_return(actions, reward_fn):
    pos, total = 0, 0.0
    for t in range(MAX_STEPS):
        new = max(0, min(GOAL, pos + actions(t)))
        total += reward_fn(pos, new)
        pos = new
        if pos == GOAL:
            break
    return round(total, 2)

def flawed(old, new):
    reward = 1.0 if abs(new - GOAL) < abs(old - GOAL) else 0.0
    return reward + (10.0 if new == GOAL else 0.0)

def potential_based(old, new):
    phi = lambda p: -abs(p - GOAL)
    return GAMMA * phi(new) - phi(old) + (10.0 if new == GOAL else 0.0)

go_straight = lambda t: 1
wiggle = lambda t: 1 if t % 2 == 0 else -1

for name, reward_fn in (("flawed progress bonus", flawed), ("potential-based shaping", potential_based)):
    print(f"{name:<24} straight to goal: {episode_return(go_straight, reward_fn):>6}   wiggle forever: {episode_return(wiggle, reward_fn):>6}")`,
          output: `flawed progress bonus    straight to goal:   20.0   wiggle forever:   50.0
potential-based shaping  straight to goal:   20.0   wiggle forever:    0.0`,
          annotations: [
            { lines: 1, text: 'A number line: the agent starts at position 0, the goal is at 10, episodes last at most 100 steps and `GAMMA` is 1 so the algebra is exact.' },
            { lines: '3-11', text: '`episode_return` runs a scripted behavior (`actions(t)` gives the move at time `t`), adds up the rewards from the reward function and stops early at the goal.' },
            { lines: '13-15', text: 'The **flawed** reward: +1 for every step that gets closer to the goal, plus +10 for arriving. It looks like progress shaping but only pays gains.' },
            { lines: '17-19', text: 'The **potential-based** version: the potential `phi` is minus the distance to the goal, and the bonus is `γ·phi(new) − phi(old)`, plus the +10 for arrival.' },
            { lines: '21-22', text: 'Two scripted behaviors: walk straight towards the goal, or alternate one step forward and one back.' },
            { lines: '24-25', text: 'With the flawed bonus, wiggling for 100 steps (50 approaching steps) earns **50**, far more than the **20** for actually reaching the goal. An RL agent will find this. With potential-based shaping, wiggling earns **0**, because each gain is cancelled by the following loss, and reaching the goal still earns 20 (10 from shaping plus the 10 goal bonus).' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why shaping with γ < 1 is subtle',
          text: 'The cancellation above is exact only for γ = 1. With a discount below 1, staying put has a shaping value of `(γ − 1)·Φ(s)`, which is *positive* when Φ is negative, so an agent far from the goal gains a tiny reward for doing nothing. The effect vanishes at convergence (the theorem still holds), but early in training it can make the agent dawdle. If an agent seems to prefer standing still, try a potential that is non-negative and 0 at the goal, a small step penalty, or γ close to 1.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Adding a potential-based shaping reward γΦ(s′) − Φ(s) to an environment never changes which policy is optimal, no matter what function Φ you choose.',
      answer: true,
      explanation: 'True. This is the Ng, Harada and Russell theorem: the shaping rewards along any trajectory telescope to a term that depends only on the start state, so every policy’s return shifts by the same amount. A badly chosen Φ can still make learning slower, but it cannot change the best behavior. Non-potential bonuses carry no such guarantee, as the wiggling agent showed.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the potential-based shaping bonus for one transition.',
      template: `bonus = gamma * phi(next_state) - ___(state)`,
      templateIsCode: true,
      blanks: [{ answers: ['phi'] }],
      wordBank: ['phi', 'gamma', 'reward', 'distance'],
      explanation: 'The bonus is `γ·Φ(s′) − Φ(s)`: the potential of the state you arrive in (discounted) minus the potential of the state you left. Using the *same* function Φ at both ends is what makes the sums telescope.',
    },
    {
      kind: 'concept',
      title: 'Sparse rewards, shaping and curricula compared',
      blocks: [
        {
          type: 'p',
          text: 'Three strategies attack the "no signal" problem of sparse rewards. **Plain sparse** reward trusts exploration alone. **Shaping** adds a dense hint. **Curriculum learning** keeps the sparse reward but changes the *tasks*: start with easy versions where random behavior succeeds sometimes (the goal is a few steps away, the opponent is weak), and make them harder as the agent improves. The program below trains the same tabular Q-learning agent on a 12×12 grid with a goal in the far corner, a 60-step limit and a +1 reward at the goal, with each of the three strategies, over 5 seeds and 400 episodes.',
        },
        {
          type: 'code',
          title: 'sparse_vs_shaped_vs_curriculum.py',
          runnable: true,
          code: `import random

SIZE, GOAL, MAX_STEPS = 12, (11, 11), 60
MOVES = [(-1, 0), (1, 0), (0, -1), (0, 1)]

def distance(s):
    return abs(s[0] - GOAL[0]) + abs(s[1] - GOAL[1])

def step(s, a):
    r, c = s[0] + MOVES[a][0], s[1] + MOVES[a][1]
    return (min(max(r, 0), SIZE - 1), min(max(c, 0), SIZE - 1))

def greedy(q, rng):
    best = [i for i, v in enumerate(q) if v == max(q)]
    return best[int(rng.random() * len(best))]

def train(mode, episodes=400, seed=0, alpha=0.5, eps=0.1):
    rng = random.Random(seed)
    Q, first_success = {}, None
    for ep in range(episodes):
        s = (0, 0)
        if mode == "curriculum":
            reach = min(22, 1 + ep // 10)
            while True:
                s = (int(rng.random() * SIZE), int(rng.random() * SIZE))
                if 0 < distance(s) <= reach:
                    break
        for _ in range(MAX_STEPS):
            q = Q.setdefault(s, [0.0] * 4)
            a = int(rng.random() * 4) if rng.random() < eps else greedy(q, rng)
            s2 = step(s, a)
            done = s2 == GOAL
            reward = 1.0 if done else 0.0
            if mode == "shaped":
                reward += (-distance(s2) + distance(s)) / 22
            future = 0.0 if done else max(Q.setdefault(s2, [0.0] * 4))
            q[a] += alpha * (reward + future - q[a])
            s = s2
            if done:
                first_success = ep if first_success is None else first_success
                break
    return Q, first_success

def solves_from_corner(Q):
    s = (0, 0)
    for _ in range(MAX_STEPS):
        q = Q.get(s, [0.0] * 4)
        s = step(s, q.index(max(q)))
        if s == GOAL:
            return True
    return False

for mode in ("sparse", "shaped", "curriculum"):
    runs = [train(mode, seed=k) for k in range(5)]
    firsts = [400 if f is None else f for _, f in runs]
    solved = sum(solves_from_corner(Q) for Q, _ in runs)
    print(f"{mode:<10} first goal reached at episode {sum(firsts) / 5:>5.1f}   solves from the corner: {solved} of 5 runs")`,
          output: `sparse     first goal reached at episode 228.0   solves from the corner: 0 of 5 runs
shaped     first goal reached at episode   1.4   solves from the corner: 5 of 5 runs
curriculum first goal reached at episode   0.6   solves from the corner: 4 of 5 runs`,
          annotations: [
            { lines: '3-4', text: 'A 12×12 grid; the goal is the far corner, 22 steps from the start, and the agent has 60 steps per episode.' },
            { lines: '6-11', text: '`distance` is Manhattan distance to the goal and `step` moves one square, clamped to the grid.' },
            { lines: '13-15', text: 'Greedy action choice with **random tie-breaking**. Early on every Q-value is 0, so ties are everywhere and breaking them randomly is a form of exploration.' },
            { lines: '17-19', text: '`train` runs tabular Q-learning with ε-greedy exploration (ε = 0.1) in one of three `mode`s, and records the first episode in which the goal was reached.' },
            { lines: '21-27', text: 'Episodes normally start in the far corner. In **curriculum** mode the start is a random square whose distance to the goal is at most `reach`, which grows by one every 10 episodes: the agent first practises from next to the goal, then from further and further away.' },
            { lines: '28-31', text: 'The usual loop: choose an action, move, and check for the goal.' },
            { lines: '32-35', text: 'The reward is +1 at the goal. In **shaped** mode, add the potential-based bonus `Φ(s′) − Φ(s)` with `Φ = −distance/22` (γ is 1 here): positive for moving closer, negative for moving away.' },
            { lines: '36-41', text: 'The Q-learning update, with no bootstrapping at the goal, and bookkeeping of the first success.' },
            { lines: '44-51', text: 'The final test: follow the learned greedy policy from the far corner and see whether it reaches the goal within 60 steps.' },
            { lines: '53-57', text: '**Sparse**: a random walk almost never finds a goal 22 steps away, so on average it first gets there only around episode 228 (some runs never do in 400), and no run has learned a route. **Shaped**: the agent finds the goal almost immediately and all 5 runs solve it. **Curriculum**: the first success comes at once, since early starts are next to the goal, and 4 of 5 runs learn the full route in the same sparse reward. Each fix gives the agent early evidence to learn from.' },
          ],
        },
        {
          type: 'table',
          headers: ['Curriculum type', 'What changes', 'Example'],
          rows: [
            ['**Start-state** (reverse curriculum)', 'Starting positions move away from the goal', 'Rocket League: begin with the ball already near the goal, then farther away'],
            ['**Task difficulty**', 'Parameters of the problem', 'Faster balls, smaller goals, more obstacles'],
            ['**Opponent strength**', 'Quality of the opposition', 'Static dummy, then a scripted bot, then older copies of the agent (self-play)'],
            ['**Horizon**', 'Episode length', 'Short episodes first, longer ones later'],
            ['**Adaptive / automatic**', 'The system promotes or demotes the level from measured success', 'Move up at ≥ 80% success, back down at ≤ 20%'],
          ],
          caption: 'Ways to build a curriculum. Adaptive curricula need no hand-tuned schedule.',
        },
        {
          type: 'math',
          tex: 'R_{\\mathrm{total}} = \\sum_{i} w_{i}\\, r_{i}, \\qquad \\text{e.g. } R = 100\\,r_{\\mathrm{goal}} + 5\\,r_{\\mathrm{touch}} + 0.1\\,r_{\\mathrm{progress}} - 0.01\\,r_{\\mathrm{time}}',
          caption: 'A composite reward: a weighted sum of terms. The weights set the priorities, and their relative sizes matter more than their absolute values.',
        },
        {
          type: 'p',
          text: 'Most real bots use a composite reward like this. The rule of thumb is a **hierarchy of scales**: the true objective (goal scored) carries the largest weight, intermediate events smaller ones, and continuous shaping terms the smallest, so that no pile of small bonuses can outweigh a goal. Always **log each term separately** during training. If the total return climbs while the goal count stays flat, one of the small terms is being farmed.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output: the potential-based bonus for three moves, with potential Φ(x) = −|x − 5| and γ = 1.',
      code: `phi = lambda x: -abs(x - 5)
gamma = 1.0
moves = [(2, 3), (3, 2), (5, 5)]
print([gamma * phi(b) - phi(a) for a, b in moves])`,
      answer: '[1.0, -1.0, 0.0]',
      hint: 'Moving from 2 to 3 changes the potential from −3 to −2.',
      explanation: '2 → 3: Φ goes from −3 to −2, bonus = −2 − (−3) = +1.0. 3 → 2: Φ goes from −2 to −3, bonus = −3 − (−2) = −1.0 (moving away is charged). 5 → 5: no change, bonus 0.0. A gain followed by the matching loss sums to zero, which is why wiggling cannot be farmed.',
    },
    {
      kind: 'error',
      prompt: 'An agent trained with this progress reward learns to oscillate: it steps towards the goal and away again, over and over. Tap the faulty line.',
      lines: [
        'old_distance = distance(state)',
        'new_distance = distance(next_state)',
        'reward = max(old_distance - new_distance, 0.0)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`max(..., 0.0)` throws away the negative progress, so stepping *away* from the goal costs nothing while stepping towards it pays. The agent can then farm the approach steps by oscillating. Keep the sign (`reward = old_distance - new_distance`) so that every gain is matched by the loss of moving back: this is exactly the potential-based form with Φ = −distance.',
    },
    {
      kind: 'numeric',
      prompt: 'An agent trains with potential-based shaping, potential Φ(s) = −(distance to the goal) and γ = 1. In one episode it starts 12 steps from the goal, wanders (including some detours) and ends 4 steps from the goal. What is the **total shaping reward** collected over the whole path?',
      answer: '8',
      hint: 'The shaping rewards telescope: the total is Φ(end) − Φ(start).',
      explanation: 'The sum telescopes to Φ(end) − Φ(start) = (−4) − (−12) = **8**, regardless of the route taken, however many detours and wiggles it contained. That path-independence is why potential-based shaping cannot be exploited by looping.',
      label: 'Total shaping:',
    },
    {
      kind: 'concept',
      title: 'Debugging a reward function',
      blocks: [
        {
          type: 'steps',
          items: [
            { title: 'Write the reward as code you can test', text: 'Keep the reward in a plain function of the state and previous state, free of engine details. Unit-test it on hand-made situations: a goal scored, a miss, standing still, moving away.' },
            { title: 'Log every term separately', text: 'Record each weighted term, per episode, in TensorBoard or a CSV. The *breakdown* of the return tells you what the agent has learned to do, far better than the total.' },
            { title: 'Score scripted behaviors', text: 'Evaluate the dumbest policies you can think of (stand still, spin, always push forward, circle) and a good scripted one. The good one must clearly beat the dumb ones. If standing still scores positively, the agent will stand still.' },
            { title: 'Watch it play', text: 'Numbers hide exploits. Regularly render or record episodes from checkpoints and look at what the agent actually does.' },
            { title: 'Keep scales sane', text: 'Large rewards can destabilise value learning: scale so typical per-step rewards are around 0.01 to 1 and episode returns around 1 to 100, or normalise returns (`VecNormalize`).' },
            { title: 'Change one thing at a time', text: 'Reward changes alter the whole learning problem. Make one change per experiment and compare against a baseline run with the same seeds.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises implement the building blocks: a potential-based shaping function, a composite reward that reports its weighted terms, and an adaptive curriculum controller.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `shaping_bonus(phi, state, next_state, gamma, terminal=False)` returning the potential-based shaping bonus `gamma * phi(next_state) - phi(state)`. `phi` is a function from a state to a number. If `terminal` is true, treat the potential of the next state as 0 (so the bonus is `-phi(state)`).',
      starter: `def shaping_bonus(phi, state, next_state, gamma, terminal=False):
    ...
`,
      solution: `def shaping_bonus(phi, state, next_state, gamma, terminal=False):
    next_potential = 0.0 if terminal else phi(next_state)
    return gamma * next_potential - phi(state)
`,
      tests: `import math

phi = lambda s: -abs(s - 10)
assert math.isclose(shaping_bonus(phi, 5, 6, 1.0), 1.0)
assert math.isclose(shaping_bonus(phi, 6, 5, 1.0), -1.0)
assert math.isclose(shaping_bonus(phi, 5, 5, 1.0), 0.0, abs_tol=1e-12)
assert math.isclose(shaping_bonus(phi, 5, 6, 0.9), 0.9 * -4 + 5)
assert math.isclose(shaping_bonus(phi, 9, 10, 1.0, terminal=True), 1.0)

grow = lambda s: float(s)
assert math.isclose(shaping_bonus(grow, 3, 10, 1.0, terminal=True), -3.0)
assert math.isclose(shaping_bonus(grow, 3, 10, 1.0), 7.0)

# the bonuses along a path telescope to phi(end) - phi(start) when gamma = 1
path = [0, 3, 2, 5, 4, 8, 10]
total = sum(shaping_bonus(phi, a, b, 1.0) for a, b in zip(path, path[1:]))
assert math.isclose(total, phi(10) - phi(0))
loop = [0, 1, 0, 1, 0]
assert math.isclose(sum(shaping_bonus(phi, a, b, 1.0) for a, b in zip(loop, loop[1:])), 0.0, abs_tol=1e-12)`,
      checks: ['Returns `gamma * phi(next_state) - phi(state)` for ordinary transitions', 'Treats the next potential as 0 when `terminal` is true', 'The bonuses along any path telescope to `phi(end) - phi(start)` with `gamma = 1`, and a loop sums to zero'],
      hint: 'Choose the next potential first: `0.0 if terminal else phi(next_state)`, then return `gamma * next_potential - phi(state)`.',
      explanation: 'The tests check the property that makes this worth using: along any path the bonuses add up to `phi(end) - phi(start)`, and a loop adds up to zero. The terminal convention (potential 0 at the end of an episode) keeps that true when episodes end, which matters for the guarantee that the optimal policy is unchanged.',
    },
    {
      kind: 'code',
      prompt: 'Write `weighted_reward(terms, weights)`. `terms` maps a name to its raw value for this step and `weights` maps names to weights; a term with **no entry** in `weights` has weight `1.0`. Return a tuple `(total, breakdown)`: `breakdown` is a dict with the same names as `terms` holding each term’s **weighted** value, and `total` is the sum of the breakdown values. An empty `terms` gives `(0.0, {})`.',
      starter: `def weighted_reward(terms, weights):
    ...
`,
      solution: `def weighted_reward(terms, weights):
    breakdown = {name: weights.get(name, 1.0) * value for name, value in terms.items()}
    return float(sum(breakdown.values())), breakdown
`,
      tests: `import math

total, parts = weighted_reward({"goal": 1.0, "touch": 1.0, "time": 1.0}, {"goal": 100.0, "touch": 5.0, "time": -0.01})
assert math.isclose(total, 104.99)
assert parts == {"goal": 100.0, "touch": 5.0, "time": -0.01}

total, parts = weighted_reward({"a": 2.0, "b": 3.0}, {"a": 0.5})
assert parts == {"a": 1.0, "b": 3.0} and math.isclose(total, 4.0)

assert weighted_reward({}, {"x": 1.0}) == (0.0, {})
total, parts = weighted_reward({"x": 0.0}, {"x": 5.0})
assert total == 0.0 and parts == {"x": 0.0}
total, parts = weighted_reward({"a": 1.0, "b": -2.0}, {})
assert math.isclose(total, -1.0) and list(parts) == ["a", "b"]
assert isinstance(weighted_reward({"a": 1}, {})[0], float)

terms, weights = {"a": 1.0}, {"a": 2.0}
weighted_reward(terms, weights)
assert terms == {"a": 1.0} and weights == {"a": 2.0}`,
      checks: ['Multiplies each term by its weight (default `1.0` when missing) and returns both the total and the per-term breakdown', 'The breakdown has exactly the keys of `terms`, in order', 'Returns `(0.0, {})` for no terms and does not modify its inputs'],
      hint: 'Build the breakdown with a dict comprehension: `{name: weights.get(name, 1.0) * value for name, value in terms.items()}`, then return `float(sum(breakdown.values()))` together with it.',
      explanation: 'Returning the breakdown is the important part: logging it per episode is how you notice that, say, the 0.1-weighted progress term has quietly grown larger than the 100-weighted goal term (an agent farming progress, not scoring). `dict.get(key, default)` is the idiomatic way to provide a default weight.',
    },
    {
      kind: 'code',
      prompt: 'Write `next_level(level, recent_successes, max_level, promote=0.8, demote=0.2, min_episodes=20)` for an adaptive curriculum. `recent_successes` is a list of booleans for the most recent episodes at the current level. If there are fewer than `min_episodes` of them, return `level` unchanged. Otherwise compute the success rate: at or above `promote` (and `level < max_level`) return `level + 1`; at or below `demote` (and `level > 0`) return `level - 1`; else return `level`.',
      starter: `def next_level(level, recent_successes, max_level, promote=0.8, demote=0.2, min_episodes=20):
    ...
`,
      solution: `def next_level(level, recent_successes, max_level, promote=0.8, demote=0.2, min_episodes=20):
    if len(recent_successes) < min_episodes:
        return level
    rate = sum(recent_successes) / len(recent_successes)
    if rate >= promote and level < max_level:
        return level + 1
    if rate <= demote and level > 0:
        return level - 1
    return level
`,
      tests: `assert next_level(2, [True] * 10, 5) == 2
assert next_level(2, [True] * 20, 5) == 3
assert next_level(2, [True] * 16 + [False] * 4, 5) == 3
assert next_level(2, [True] * 15 + [False] * 5, 5) == 2
assert next_level(2, [True] * 4 + [False] * 16, 5) == 1
assert next_level(2, [True] * 5 + [False] * 15, 5) == 2
assert next_level(5, [True] * 20, 5) == 5
assert next_level(0, [False] * 20, 5) == 0
assert next_level(1, [True] * 10 + [False] * 10, 5) == 1
assert next_level(1, [True] * 30, 5, promote=0.95) == 2
assert next_level(1, [True] * 9, 5, min_episodes=10) == 1
assert next_level(1, [True] * 10, 5, min_episodes=10) == 2
assert next_level(3, [], 5) == 3`,
      checks: ['Does nothing until there are at least `min_episodes` results', 'Promotes at a success rate of `promote` or more (capped at `max_level`) and demotes at `demote` or less (never below 0)', 'Stays at the same level in between'],
      hint: 'Return `level` early if `len(recent_successes) < min_episodes`. Otherwise `rate = sum(recent_successes) / len(recent_successes)` (booleans add up as 1 and 0) and compare with the thresholds, respecting `max_level` and 0.',
      explanation: 'An adaptive curriculum removes a guess from your training script: instead of choosing "raise the difficulty every 50 000 steps", the agent’s own measured success decides. Keeping a wide gap between the promotion and demotion thresholds (80% and 20% here) prevents the level from flapping up and down. In practice you clear the list of recent results after each level change.',
    },
  ],
  takeaways: [
    'The **reward is the specification**: the agent maximises exactly what you write, not what you meant (Goodhart’s law). **Reward hacking** (the CoastRunners boat circling for respawning targets) is the default outcome of repeatable, proxy-based rewards, so ask "what is the cheapest way to earn this?" of every term.',
    '**Sparse** rewards state the goal exactly but give exploration nothing to find; **dense** rewards help learning but invite exploits. Real bots use a sparse core (goal, win) with smaller event and progress terms, ordered so that no pile of small bonuses outweighs the real objective.',
    '**Potential-based shaping** `F = γΦ(s′) − Φ(s)` is the safe dense reward: its bonuses telescope to `Φ(end) − Φ(start)`, so the optimal policy is unchanged and looping or wiggling earns nothing. Bonuses that pay only gains (`max(progress, 0)`) can be farmed. With γ < 1 watch for dawdling.',
    '**Curriculum learning** keeps the sparse reward but starts with easy tasks (goal nearby, weak opponents) so the agent sees successes to learn from, then raises difficulty by hand or **adaptively** (promote at ≥ 80% success, demote at ≤ 20%). In our grid experiment sparse reward found the goal around episode 228 and learned no route, shaping and curriculum solved it almost at once.',
    'Debug rewards like code: unit-test the function, **log every term**, score dumb scripted policies against a good one, watch recorded episodes, keep scales sane and change one thing at a time.',
  ],
  reading: [
    { title: 'Ng, Harada and Russell: Policy invariance under reward transformations (1999)', url: 'https://people.eecs.berkeley.edu/~pabbeel/cs287-fa09/readings/NgHaradaRussell-shaping-ICML1999.pdf', source: 'paper', note: 'The original proof that potential-based shaping preserves the optimal policy.' },
    { title: 'Clark and Amodei (OpenAI): Faulty Reward Functions in the Wild', url: 'https://openai.com/index/faulty-reward-functions/', source: 'article', note: 'The CoastRunners boat that circled a lagoon instead of finishing the race.' },
    { title: 'Krakovna et al. (DeepMind): Specification gaming: the flip side of AI ingenuity', url: 'https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity/', source: 'article', note: 'A readable survey with links to a large list of real examples.' },
    { title: 'Amodei et al.: Concrete Problems in AI Safety (2016)', url: 'https://arxiv.org/abs/1606.06565', source: 'paper', note: 'Reward hacking and side effects, placed in a wider safety context.' },
    { title: 'Narvekar et al.: Curriculum Learning for Reinforcement Learning Domains (JMLR, 2020)', url: 'https://jmlr.org/papers/v21/20-212.html', source: 'paper', note: 'A framework and survey of curriculum methods in RL.' },
  ],
};
