import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-mdps',
  title: 'Markov Decision Processes and Value Functions',
  summary: 'The mathematics behind RL made concrete: states, actions, transition probabilities and rewards; value functions V and Q; the Bellman equation; and value iteration solving a stochastic gridworld whose answers match the textbook.',
  minutes: 26,
  objectives: [
    'Define a Markov decision process (states, actions, transitions, rewards, discount) and the Markov property',
    'Explain the state-value V and action-value Q functions and how they relate',
    'State and use the Bellman equation as a one-step lookahead',
    'Run value iteration on a small MDP and read the resulting values and greedy policy',
    'Explain why planning with a known model differs from learning from experience',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The MDP: a precise model of the RL problem',
      blocks: [
        {
          type: 'p',
          text: 'The last lesson described the agent–environment loop informally. A **Markov decision process (MDP)** is the mathematical version, and nearly all of RL theory is stated in terms of it. An MDP has five parts: a set of **states** `S`, a set of **actions** `A`, **transition probabilities** `P(s′ | s, a)` (the chance of landing in `s′` after taking `a` in `s`), a **reward function** `R(s, a, s′)`, and a **discount factor** `γ`. The transition probabilities capture randomness in the world: a slippery floor, an opponent’s unpredictable move, a die roll.',
        },
        {
          type: 'p',
          text: 'The word *Markov* names a crucial assumption: the **Markov property**. The next state and reward depend only on the **current state and action**, not on how the agent got there. Chess satisfies it (the board shows everything that matters); a single frame of a game does *not* (one picture of a ball tells you nothing about its velocity). When one observation is not enough, designers make it Markov by adding what is missing: stacking the last four frames, adding velocities to the state vector, or giving the agent a memory (an LSTM from the sequences lesson). A problem where the agent only sees part of the state is called a **partially observable MDP (POMDP)**.',
        },
        {
          type: 'p',
          text: 'Throughout this lesson we use a classic example from Russell and Norvig’s *AI: A Modern Approach*: a small grid world. The agent starts at the bottom-left and wants to reach the +1 square while avoiding the −1 square, with a wall in between. Moving is **unreliable**: the agent goes in the intended direction 80% of the time and slips to each side 10% of the time (bumping into a wall or the edge leaves it in place). Every step costs −0.04, which encourages it to hurry. The squares marked `+1` and `−1` end the episode.',
        },
        {
          type: 'code',
          title: 'the grid world',
          lang: 'text',
          code: `      col 0   col 1   col 2   col 3
row 0   .       .       .      +1
row 1   .     wall      .      -1
row 2  start    .       .       .`,
        },
        {
          type: 'definition',
          term: 'Markov decision process',
          text: 'A tuple (S, A, P, R, γ): states, actions, transition probabilities P(s′|s, a), rewards R, and a discount factor γ, satisfying the Markov property (the future depends on the past only through the current state and action). A **policy** π(a|s) says which action to take (or with what probability) in each state; the goal is a policy that maximizes the expected discounted return.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Designing the state is half of RL',
          text: 'When you turn a game into an RL problem you *choose* what the state contains. Too little (no velocity, no cooldown timers, no enemy positions) and the problem stops being Markov, so learning stalls or behaves erratically. Too much (raw, redundant, unnormalized numbers) and learning is slow. A good state vector holds exactly what a smart human would need to decide the next action, expressed in sensible units and relative to the agent (distance and direction to the target rather than two absolute positions).',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Your agent plays a platformer and its observation is a single screenshot. It struggles to learn jumps, because from one image it cannot tell whether the character is moving up or down. Which MDP assumption is violated, and what is a standard fix?',
      options: [
        { text: 'The Markov property: one frame does not contain the velocity; stack the last few frames (or add velocity to the state)', correct: true, why: 'The next state depends on the character’s velocity, which a single still image does not reveal. Frame stacking (as in DQN on Atari), explicit velocity features or a recurrent policy restore the missing information.' },
        { text: 'The discount factor must be 0, so only immediate rewards count', why: 'γ is a design choice unrelated to what the state contains; setting it to 0 would make the agent unable to plan the jump at all.' },
        { text: 'Transitions must be deterministic, so remove all randomness from the game', why: 'MDPs handle stochastic transitions perfectly well (this lesson’s grid world is stochastic). The issue is missing information in the state, not randomness.' },
        { text: 'The action space is too small: add more buttons', why: 'The agent already has the jump button; its problem is that it cannot perceive the information needed to time it.' },
      ],
      explanation: 'A single frame hides velocity, so the observation is not Markov. Stack frames, add velocities, or use memory to restore it.',
    },
    {
      kind: 'concept',
      title: 'Value functions and the Bellman equation',
      blocks: [
        {
          type: 'p',
          text: 'A policy is judged by the return it earns, but the return from a given moment is random (stochastic transitions, stochastic policy). We therefore ask for its **expected** value. The **state-value function** `V^π(s)` is the expected discounted return starting in state `s` and following policy `π` afterwards: "how good is it to be here?". The **action-value function** `Q^π(s, a)` is the expected return if you take action `a` in `s` and then follow `π`: "how good is it to do this here?". Q is what lets an agent *choose*: pick the action with the highest Q.',
        },
        {
          type: 'math',
          tex: 'V^{\\pi}(s) = \\mathbb{E}_{\\pi}\\!\\left[\\,G_t \\mid s_t = s\\,\\right], \\qquad Q^{\\pi}(s, a) = \\mathbb{E}_{\\pi}\\!\\left[\\,G_t \\mid s_t = s,\\, a_t = a\\,\\right]',
          caption: 'The two value functions: expected return from a state, and from a state-action pair.',
        },
        {
          type: 'p',
          text: 'The key property, due to Richard Bellman, comes from the return’s recursion `G_t = r_{t+1} + γ G_{t+1}`. The value of a state is the *expected immediate reward plus the discounted value of the next state*. This turns an infinitely long sum into a **one-step lookahead** that links each state’s value to its neighbours’ values.',
        },
        {
          type: 'derivation',
          steps: [
            { tex: 'V^{\\pi}(s) = \\mathbb{E}\\left[\\, G_t \\mid s_t = s \\,\\right]', why: 'Start from the definition: expected return from s under π.' },
            { tex: 'G_t = r_{t+1} + \\gamma\\, G_{t+1}', why: 'The return is the next reward plus the discounted return that follows.' },
            { tex: 'V^{\\pi}(s) = \\mathbb{E}\\left[\\, r_{t+1} + \\gamma\\, V^{\\pi}(s_{t+1}) \\mid s_t = s \\,\\right]', why: 'Take the expectation: the expected return from the next state s′ is, by definition, V^π(s′).' },
            { tex: 'V^{\\pi}(s) = \\sum_{a} \\pi(a \\mid s) \\sum_{s^{\\prime}} P(s^{\\prime} \\mid s, a)\\,\\bigl[\\, R(s, a, s^{\\prime}) + \\gamma\\, V^{\\pi}(s^{\\prime}) \\,\\bigr]', why: 'Write the expectation out: average over the policy’s actions, then over the possible next states.' },
          ],
          result: 'The Bellman expectation equation: a state’s value equals the average of (reward + γ × value of the next state), a system of equations linking all the V’s together.',
        },
        {
          type: 'p',
          text: 'We do not want the value of an arbitrary policy; we want the **best** one. The **optimal value** `V*(s)` is the highest value any policy can achieve from `s`. It obeys the **Bellman optimality equation**, in which the average over the policy’s actions is replaced by a `max`: in each state take the action whose lookahead is best. Once you know the optimal values, the optimal policy is trivial: **act greedily**, choosing in each state the action with the highest lookahead value.',
        },
        {
          type: 'math',
          tex: 'V^{*}(s) = \\max_{a} \\sum_{s^{\\prime}} P(s^{\\prime} \\mid s, a)\\,\\bigl[\\, R(s, a, s^{\\prime}) + \\gamma\\, V^{*}(s^{\\prime}) \\,\\bigr] = \\max_{a} Q^{*}(s, a)',
          caption: 'The Bellman optimality equation. Q*(s, a) is the bracketed sum: the value of taking a in s and playing optimally afterwards.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why value functions are so useful',
          text: 'Planning ahead through a long game looks hopeless: the number of possible futures explodes. The Bellman equation says you do not have to look far. If you already know how good each next state is, **one step of lookahead** tells you the best action. The whole of RL is about getting those values: by sweeping over a known model (this lesson, "dynamic programming"), or by estimating them from experience (Q-learning next lesson, DQN after that). Policy-gradient methods skip the values and adjust the policy directly, but even they use a learned value function as a helper.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Once you know the optimal action-values Q*(s, a) for every state and action, the optimal policy is simply to take the action with the highest Q*(s, a) in each state.',
      answer: true,
      explanation: 'True. Q*(s, a) already accounts for everything that happens after the action, assuming optimal play, so the greedy action is optimal. This is why learning Q (as Q-learning and DQN do) is enough to act: no separate policy is needed.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the Bellman optimality backup: the new value of a state is the value of its *best* action.',
      template: `q_values = [q_value(V, s, a) for a in actions]
V[s] = ___(q_values)`,
      templateIsCode: true,
      blanks: [{ answers: ['max'] }],
      wordBank: ['max', 'sum', 'min', 'sorted'],
      explanation: 'The optimality equation takes the **maximum** over actions of the one-step lookahead. `sum` would add the values of different actions together, which has no meaning, and `min` would choose the *worst* action.',
    },
    {
      kind: 'concept',
      title: 'Value iteration: solving an MDP by planning',
      blocks: [
        {
          type: 'p',
          text: 'If the model (`P` and `R`) is known, the Bellman optimality equation can be solved by simple repetition. **Value iteration** starts with all values at 0 (or the terminal rewards) and repeatedly replaces every state’s value with the best one-step lookahead using its neighbours’ *current* values. Information about the reward spreads outwards one step per sweep, like heat from a source, until nothing changes by more than a tiny tolerance. The values it converges to are `V*`, and acting greedily on them gives the optimal policy. Below it solves the grid world, with a final step that prints the greedy policy as arrows.',
        },
        {
          type: 'code',
          title: 'value_iteration.py',
          runnable: true,
          code: `ROWS, COLS = 3, 4
WALL = (1, 1)
TERMINAL = {(0, 3): 1.0, (1, 3): -1.0}
MOVES = {"up": (-1, 0), "down": (1, 0), "left": (0, -1), "right": (0, 1)}
SIDEWAYS = {"up": ("left", "right"), "down": ("left", "right"), "left": ("up", "down"), "right": ("up", "down")}

states = [(r, c) for r in range(ROWS) for c in range(COLS) if (r, c) != WALL]

def move(s, a):
    r, c = s[0] + MOVES[a][0], s[1] + MOVES[a][1]
    return (r, c) if 0 <= r < ROWS and 0 <= c < COLS and (r, c) != WALL else s

def outcomes(s, a):
    """(probability, next_state) pairs: 80% as intended, 10% to each side."""
    left, right = SIDEWAYS[a]
    return [(0.8, move(s, a)), (0.1, move(s, left)), (0.1, move(s, right))]

def q_value(V, s, a, cost, gamma):
    return sum(p * (cost + gamma * V[s2]) for p, s2 in outcomes(s, a))

def value_iteration(cost, gamma=1.0, tol=1e-6):
    V = {s: TERMINAL.get(s, 0.0) for s in states}
    while True:
        delta = 0.0
        for s in states:
            if s in TERMINAL:
                continue
            best = max(q_value(V, s, a, cost, gamma) for a in MOVES)
            delta = max(delta, abs(best - V[s]))
            V[s] = best
        if delta < tol:
            return V

def show_policy(V, cost, gamma=1.0):
    arrows = {"up": "^", "down": "v", "left": "<", "right": ">"}
    for r in range(ROWS):
        cells = []
        for c in range(COLS):
            s = (r, c)
            if s == WALL:
                cells.append(" ")
            elif s in TERMINAL:
                cells.append("+" if TERMINAL[s] > 0 else "-")
            else:
                cells.append(arrows[max(MOVES, key=lambda a: q_value(V, s, a, cost, gamma))])
        print(" ".join(cells))

V = value_iteration(cost=-0.04)
for r in range(ROWS):
    print(" ".join("  wall" if (r, c) == WALL else f"{V[(r, c)]:6.3f}" for c in range(COLS)))
show_policy(V, cost=-0.04)
print()
show_policy(value_iteration(cost=-2.0), cost=-2.0)`,
          output: ` 0.812  0.868  0.918  1.000
 0.762   wall  0.660 -1.000
 0.705  0.655  0.611  0.388
> > > +
^   ^ -
^ < < <

> > > +
^   > -
> > > ^`,
          annotations: [
            { lines: '1-5', text: 'The world: a 3×4 grid with a wall at (1, 1), two terminal squares (+1 and −1), four moves, and for each move the two sideways directions it can slip into.' },
            { lines: 7, text: 'All the states (every cell except the wall).' },
            { lines: '9-11', text: '`move` applies a direction; bumping into the wall or the edge leaves the agent where it is.' },
            { lines: '13-16', text: 'The **transition model** `P(s′|s, a)`: 80% the intended move, 10% each sideways slip. Given a state and action it lists every possible next state with its probability.' },
            { lines: '18-19', text: '`q_value` is **one-step lookahead**: the expected value of `cost + γ·V(next state)` over the possible outcomes. This is `Q(s, a)` from the Bellman equation.' },
            { lines: '21-32', text: '**Value iteration**: start from the terminal rewards, then sweep over all states replacing `V[s]` with the best Q over actions, until the largest change (`delta`) is below the tolerance. Terminal states keep their reward.' },
            { lines: '34-46', text: 'Policy extraction: in each state show the action with the highest lookahead value as an arrow (`+` and `−` mark the terminals, a blank is the wall).' },
            { lines: '48-51', text: 'With a step cost of −0.04, the values are the famous textbook ones: **0.812, 0.868, 0.918** along the top, and **0.705** at the start in the bottom-left. Square (2, 3), next to the −1 pit, is the worst at 0.388. The policy heads for the +1 by the safe route, even **walking away** from the shortcut at the bottom right (`<` along the bottom row) because that is the way around the pit.' },
            { lines: '52-53', text: 'Now make each step cost **−2.0** (a harsh time pressure). The policy changes character: from (1, 2) it moves right **into the −1 pit** (`>`), and the bottom row races right and up. Dying quickly is better than wandering at −2 per step. The reward you write decides the behaviour.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Planning versus learning',
          text: 'Value iteration needs the **model**: the full table `P(s′|s, a)` and `R`. That is *planning*, and it works for small games whose rules you can enumerate (and is the idea inside AlphaZero’s tree search). For almost any real game you do not have such a table and the state space is far too large to sweep. Then the agent must **learn from sampled experience** (`s, a, r, s′`) instead, without ever seeing `P`. That is **model-free** RL, and its simplest form, Q-learning, is the next lesson: the same Bellman backup, applied to one sampled transition at a time.',
        },
        {
          type: 'table',
          headers: ['Method', 'Needs the model?', 'How it works', 'Scale'],
          rows: [
            ['**Policy evaluation**', 'Yes', 'Sweep the Bellman *expectation* equation for a fixed policy', 'Small tables'],
            ['**Policy iteration**', 'Yes', 'Alternate: evaluate the policy, then improve it greedily', 'Small tables'],
            ['**Value iteration**', 'Yes', 'Sweep the Bellman *optimality* equation (max over actions)', 'Small tables'],
            ['**Q-learning, SARSA** (next lessons)', 'No', 'Same backups, applied to sampled transitions', 'Tables, then neural networks (DQN)'],
            ['**Policy gradients, PPO**', 'No', 'Adjust a parameterized policy directly, with a learned value baseline', 'Large problems, continuous actions'],
          ],
          caption: 'Dynamic programming (known model) versus learning from experience.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output (one Bellman backup: expected reward plus the discounted expected value of the next state).',
      code: `gamma = 0.5
V_next = [4.0, 8.0]
probs = [0.25, 0.75]
reward = 1.0
print(reward + gamma * sum(p * v for p, v in zip(probs, V_next)))`,
      answer: '4.5',
      hint: 'First the expected next value: `0.25·4 + 0.75·8 = 7`. Then `1 + 0.5 · 7`.',
      explanation: 'The expected value of the next state is 0.25×4 + 0.75×8 = 7.0. Discounting by 0.5 gives 3.5, and adding the immediate reward 1.0 gives 4.5.',
    },
    {
      kind: 'error',
      prompt: 'This value-iteration sweep produces nonsense values because it applies the wrong operation over the actions. Tap the faulty line.',
      lines: [
        'for s in states:',
        '    q_values = [q_value(V, s, a) for a in actions]',
        '    V[s] = sum(q_values)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The Bellman *optimality* backup takes the **maximum** over the actions: `V[s] = max(q_values)`. Summing the Q-values of different actions adds up quantities that are alternatives to each other, so the values grow without meaning (and never converge).',
    },
    {
      kind: 'numeric',
      prompt: 'In the grid world with γ = 1 and a step cost of −0.04, an action leads to three states with probabilities 0.8, 0.1 and 0.1, whose current values are 0.9, 0.5 and 0.3. What is the lookahead value Q(s, a) = −0.04 + Σ p·V(s′)?',
      answer: '0.76',
      hint: 'Expected next value: `0.8×0.9 + 0.1×0.5 + 0.1×0.3`. Then subtract 0.04.',
      explanation: '0.8×0.9 = 0.72, 0.1×0.5 = 0.05 and 0.1×0.3 = 0.03, so the expected next value is 0.80. Adding the step cost −0.04 gives Q = 0.76.',
      label: 'Q:',
    },
    {
      kind: 'concept',
      title: 'Reading values, and a bridge to learning',
      blocks: [
        {
          type: 'p',
          text: 'A converged value function is a map of the world’s opportunities, and reading it is a skill. High values near the goal **spread outwards** and fall off with distance (and with the step cost). Squares near danger have **lower values** than their distance alone would suggest, because the agent’s random slips can push it into the pit. Walls and one-way structure show up as sharp changes in value. If the values look wrong, the *model or reward* is wrong, so printing the value table is the first debugging step for any small RL problem.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Write down the MDP', text: 'States, actions, transitions (even if random), rewards, discount. If you cannot list them, you cannot learn them either.' },
            { title: 'Check the Markov property', text: 'Does the state contain everything needed to predict what happens next? Add velocities, timers, or stacked frames if not.' },
            { title: 'Solve a tiny version exactly', text: 'If a toy version of your game is small enough for value iteration, solve it: you get the *true* optimal values to compare against when you move to learning.' },
            { title: 'Read the policy', text: 'Does the greedy policy do something sensible? An unexpected policy usually means an unintended reward (the −2.0 cost above made the agent dive into the pit).' },
            { title: 'Switch to learning when the model is unknown or huge', text: 'Q-learning, DQN and PPO estimate the same quantities from sampled experience, with no table of `P` required.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises build a small, general planner: compute a Q-value from an outcome list, run value iteration on any MDP given as a dictionary, and extract the greedy policy.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `q_value(outcomes, V, gamma)`. `outcomes` is a list of `(probability, reward, next_state)` triples for one state-action pair, and `V` is a dict mapping states to their current value. Return the expected one-step lookahead `sum(p * (reward + gamma * V[next_state]))`. An empty outcome list gives `0.0`.',
      starter: `def q_value(outcomes, V, gamma):
    ...
`,
      solution: `def q_value(outcomes, V, gamma):
    return sum(p * (reward + gamma * V[nxt]) for p, reward, nxt in outcomes)
`,
      tests: `import math

V = {"A": 0.0, "B": 10.0, "C": 4.0}
assert math.isclose(q_value([(1.0, 1.0, "B")], V, 0.9), 10.0)
assert math.isclose(q_value([(0.5, 0.0, "B"), (0.5, 2.0, "C")], V, 0.5), 0.5 * 5.0 + 0.5 * (2.0 + 2.0))
assert math.isclose(q_value([(0.8, -0.04, "B"), (0.1, -0.04, "C"), (0.1, -0.04, "A")], V, 1.0), -0.04 + 8.4)
assert q_value([], V, 0.9) == 0.0
assert q_value([(1.0, 3.0, "A")], V, 0.0) == 3.0
assert math.isclose(q_value([(1.0, 0.0, "C")], V, 0.5), 2.0)
assert math.isclose(q_value([(0.25, 1.0, "B"), (0.75, 1.0, "B")], V, 1.0), 11.0)
outs = [(1.0, 1.0, "B")]
q_value(outs, V, 0.9)
assert outs == [(1.0, 1.0, "B")] and V["B"] == 10.0`,
      checks: ['Returns the probability-weighted sum of `reward + gamma * V[next_state]` over all outcomes', 'Uses only the immediate reward when `gamma = 0`, and returns 0.0 for an empty outcome list', 'Does not modify its inputs'],
      hint: 'A generator expression over the triples: `sum(p * (reward + gamma * V[nxt]) for p, reward, nxt in outcomes)`.',
      explanation: 'This one line *is* the Bellman backup for a single action. Value iteration applies it to every action of every state and keeps the maximum; Q-learning (next lesson) applies the same idea to one sampled outcome instead of the full list of probabilities.',
    },
    {
      kind: 'code',
      prompt: 'Write `value_iteration(mdp, gamma, tol=1e-9)`. `mdp` maps each state to a dict `{action: [(probability, reward, next_state), ...]}`; a **terminal** state has an empty dict `{}` and value 0. Start with all values 0, then repeatedly sweep the states: for each non-terminal state set `V[s] = max over actions of the expected one-step lookahead` (updating in place), tracking the largest change; stop when it is below `tol`. Return the dict of values.',
      starter: `def value_iteration(mdp, gamma, tol=1e-9):
    ...
`,
      solution: `def value_iteration(mdp, gamma, tol=1e-9):
    V = {s: 0.0 for s in mdp}
    while True:
        delta = 0.0
        for s, actions in mdp.items():
            if not actions:
                continue
            best = max(
                sum(p * (r + gamma * V[nxt]) for p, r, nxt in outcomes)
                for outcomes in actions.values()
            )
            delta = max(delta, abs(best - V[s]))
            V[s] = best
        if delta < tol:
            return V
`,
      tests: `import math

mdp = {
    "A": {"go": [(1.0, 0.0, "B")], "stay": [(1.0, 0.0, "A")]},
    "B": {"go": [(0.9, 1.0, "C"), (0.1, 0.0, "A")], "stay": [(1.0, 0.0, "B")]},
    "C": {},
}
V = value_iteration(mdp, 0.9)
vb = 0.9 / (1 - 0.1 * 0.9 * 0.9)
assert math.isclose(V["B"], vb, rel_tol=1e-6)
assert math.isclose(V["A"], 0.9 * vb, rel_tol=1e-6)
assert V["C"] == 0.0

one = {"S": {"a": [(1.0, 5.0, "T")]}, "T": {}}
assert value_iteration(one, 0.9) == {"S": 5.0, "T": 0.0}

choice = {"S": {"low": [(1.0, 1.0, "T")], "high": [(1.0, 3.0, "T")]}, "T": {}}
assert value_iteration(choice, 0.5)["S"] == 3.0

chain = {0: {"n": [(1.0, 0.0, 1)]}, 1: {"n": [(1.0, 0.0, 2)]}, 2: {"n": [(1.0, 1.0, 3)]}, 3: {}}
V = value_iteration(chain, 0.5)
assert math.isclose(V[2], 1.0) and math.isclose(V[1], 0.5) and math.isclose(V[0], 0.25)

assert value_iteration({"T": {}}, 0.9) == {"T": 0.0}
copy = {s: dict(a) for s, a in mdp.items()}
value_iteration(mdp, 0.9)
assert copy == mdp`,
      checks: ['Repeats full sweeps, setting each non-terminal `V[s]` to the best expected one-step lookahead over its actions', 'Terminal states (empty action dict) keep value 0, and the loop stops when the largest change is below `tol`', 'Returns the converged values (checked against hand-computed results) without modifying the MDP'],
      hint: 'Loop `while True:`; inside, `delta = 0.0` and `for s, actions in mdp.items():` skip terminals (`if not actions: continue`). Compute the best of `sum(p * (r + gamma * V[nxt]) for p, r, nxt in outcomes)` over `actions.values()`, update `delta` and `V[s]`, and `return V` when `delta < tol`.',
      explanation: 'This is a complete solver for any small MDP. Updating `V` in place while sweeping (so later states see the new values of earlier ones) is a standard variant that usually converges faster than computing a whole new table from the old one. The check against the closed-form value `0.9 / (1 − 0.081)` confirms the sweeps converge to the exact answer of the Bellman equations.',
    },
    {
      kind: 'code',
      prompt: 'Write `greedy_policy(mdp, V, gamma)` returning a dict that maps every **non-terminal** state of the MDP (same format as before) to the action with the highest expected one-step lookahead under the values `V`. Break ties in favour of the action that appears **first** in the state’s action dict. Terminal states (empty action dict) do not appear in the result.',
      starter: `def greedy_policy(mdp, V, gamma):
    ...
`,
      solution: `def greedy_policy(mdp, V, gamma):
    policy = {}
    for s, actions in mdp.items():
        if not actions:
            continue
        best_action, best_q = None, None
        for a, outcomes in actions.items():
            q = sum(p * (r + gamma * V[nxt]) for p, r, nxt in outcomes)
            if best_q is None or q > best_q:
                best_action, best_q = a, q
        policy[s] = best_action
    return policy
`,
      tests: `mdp = {
    "A": {"go": [(1.0, 0.0, "B")], "stay": [(1.0, 0.0, "A")]},
    "B": {"go": [(0.9, 1.0, "C"), (0.1, 0.0, "A")], "stay": [(1.0, 0.0, "B")]},
    "C": {},
}
V = {"A": 0.88, "B": 0.98, "C": 0.0}
assert greedy_policy(mdp, V, 0.9) == {"A": "go", "B": "go"}
assert "C" not in greedy_policy(mdp, V, 0.9)

# with a bad value for B, staying put at A looks better than going
V2 = {"A": 5.0, "B": 0.0, "C": 0.0}
assert greedy_policy(mdp, V2, 0.9)["A"] == "stay"

tie = {"S": {"x": [(1.0, 1.0, "T")], "y": [(1.0, 1.0, "T")]}, "T": {}}
assert greedy_policy(tie, {"S": 0.0, "T": 0.0}, 0.9) == {"S": "x"}
tie2 = {"S": {"y": [(1.0, 1.0, "T")], "x": [(1.0, 1.0, "T")]}, "T": {}}
assert greedy_policy(tie2, {"S": 0.0, "T": 0.0}, 0.9) == {"S": "y"}

assert greedy_policy({"T": {}}, {"T": 0.0}, 0.9) == {}
neg = {"S": {"a": [(1.0, -1.0, "T")], "b": [(1.0, -3.0, "T")]}, "T": {}}
assert greedy_policy(neg, {"S": 0.0, "T": 0.0}, 1.0) == {"S": "a"}`,
      checks: ['For each non-terminal state picks the action with the highest `sum(p * (r + gamma * V[next]))`', 'Ties go to the first action in the state’s dict; terminal states are omitted', 'Works with negative rewards and uses the supplied values `V`, not its own'],
      hint: 'Loop over `mdp.items()`, skipping states with no actions. For each action compute its lookahead `q`; only replace the current best when `q` is **strictly greater** (that keeps the first action on ties).',
      explanation: 'The same pattern appears in every value-based method: the policy is never stored; it is *derived* by looking one step ahead (or, in Q-learning, by taking the argmax of the Q-table row). The strict `>` comparison makes ties deterministic, which matters when you debug: a policy that flips between equal actions on every run is very confusing.',
    },
  ],
  takeaways: [
    'An **MDP** is `(S, A, P, R, γ)` with the **Markov property**: the next state and reward depend only on the current state and action. If one observation is not enough (velocity, timers), add stacked frames, extra features or memory; otherwise the problem is only partially observable (a POMDP).',
    '**V^π(s)** is the expected return from a state under a policy and **Q^π(s, a)** the expected return after taking an action there. The **Bellman equation** expresses each as *reward + γ × value of the next state* (averaged over what can happen), a one-step lookahead.',
    'The **optimality equation** replaces the average over actions with a **max**; knowing Q* means the optimal policy is just the **greedy** action `argmax_a Q*(s, a)`.',
    '**Value iteration** sweeps `V[s] = max_a Σ p·(r + γ·V[s′])` until values stop changing. It needs the full model (planning), works only for small problems, and its answers show how your reward design shapes behaviour (a −2.0 step cost makes the agent dive into the pit).',
    'Real games have unknown or huge models, so learning methods (**Q-learning, DQN, PPO**) estimate the same values from **sampled experience**, which is where this unit goes next.',
  ],
  reading: [
    { title: 'Sutton and Barto: Reinforcement Learning: An Introduction, chapters 3 and 4', url: 'https://incompleteideas.net/book/the-book-2nd.html', source: 'book', note: 'MDPs, value functions, the Bellman equations and dynamic programming, the source of this lesson.' },
    { title: 'Russell and Norvig: Artificial Intelligence: A Modern Approach (chapter on sequential decisions)', url: 'https://aima.cs.berkeley.edu/', source: 'book', note: 'The origin of the 4×3 grid world used here, with value and policy iteration.' },
    { title: 'David Silver: Lecture 2, Markov Decision Processes', url: 'https://www.youtube.com/watch?v=lfHX2hHRMVQ', source: 'video', note: 'DeepMind’s lecture on MDPs and the Bellman equations.' },
    { title: 'OpenAI Spinning Up: Key Concepts, Bellman equations', url: 'https://spinningup.openai.com/en/latest/spinningup/rl_intro.html#bellman-equations', source: 'docs', note: 'A compact statement of the Bellman equations for V and Q.' },
    { title: 'Hugging Face Deep RL Course: The Bellman equation', url: 'https://huggingface.co/learn/deep-rl-course/unit2/bellman-equation', source: 'course', note: 'A gentle, worked explanation of the Bellman equation.' },
  ],
};
