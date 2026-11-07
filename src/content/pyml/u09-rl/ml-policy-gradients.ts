import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-policy-gradients',
  title: 'Policy Gradients: Learning the Policy Directly',
  summary: 'Instead of learning values and acting greedily, adjust the policy network itself. Derive the policy-gradient theorem, implement REINFORCE, see why baselines and advantages tame its variance, and meet generalized advantage estimation and actor–critic.',
  minutes: 28,
  objectives: [
    'Explain how a policy network represents discrete and continuous action choices',
    'State the policy-gradient theorem and the intuition behind it, and derive it with the log-derivative trick',
    'Implement REINFORCE with returns-to-go and understand its high variance',
    'Explain baselines, advantages and generalized advantage estimation (GAE)',
    'Describe the actor–critic architecture that PPO builds on',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Learn the policy itself',
      blocks: [
        {
          type: 'p',
          text: 'DQN learns *values* and gets a policy indirectly by taking the best-scoring action. That is awkward in three situations: when actions are **continuous** (the `max` over a steering angle is itself an optimisation problem), when the best behaviour is **stochastic** (rock-paper-scissors is best played at random, and a deterministic argmax cannot do that), and when you simply want a **smooth** way to change behaviour. [[policy-gradient|Policy-gradient]] methods skip the middle step: the network *is* the [[policy|policy]] `π_θ(a | s)`, its output is a probability distribution over actions, and the weights `θ` are adjusted by gradient ascent on the expected return.',
        },
        {
          type: 'table',
          headers: ['Action space', 'Network output', 'Distribution', 'Sampling'],
          rows: [
            ['Discrete (n choices)', 'n numbers (**logits**)', 'Categorical: softmax of the logits', 'Draw one of n according to the probabilities'],
            ['Continuous (d numbers)', 'd means (and d spreads, or learned log-std)', 'Gaussian (normal) per dimension', 'mean + std × random normal'],
            ['Binary flags', 'n logits', 'Independent Bernoulli', 'Each flag on with its probability'],
          ],
          caption: 'How a policy network represents decisions. Probabilistic policies explore on their own: no ε-greedy needed.',
        },
        {
          type: 'p',
          text: 'The objective is the expected return of the policy, `J(θ) = E[G]`, with the expectation over the trajectories the policy produces. Its gradient has a beautifully simple form. For each action actually taken, push up the **log-probability** of that action in proportion to how much return followed it.',
        },
        {
          type: 'math',
          tex: '\\nabla_{\\theta} J(\\theta) = \\mathbb{E}_{\\tau \\sim \\pi_{\\theta}}\\Bigl[\\sum_{t} \\nabla_{\\theta} \\log \\pi_{\\theta}(a_t \\mid s_t)\; G_t \\Bigr]',
          caption: 'The policy-gradient theorem (in its reward-to-go form). G_t is the return from step t onward. Actions followed by a high return become more likely, those followed by a low return less likely.',
        },
        {
          type: 'derivation',
          steps: [
            { tex: 'J(\\theta) = \\mathbb{E}_{\\tau\\sim P_{\\theta}}[R(\\tau)] = \\int P(\\tau;\\theta)\\, R(\\tau)\\, d\\tau', why: 'The objective is the expected total reward over trajectories τ, whose probability depends on θ.' },
            { tex: '\\nabla_{\\theta} J = \\int \\nabla_{\\theta} P(\\tau;\\theta)\\, R(\\tau)\\, d\\tau', why: 'Differentiate under the integral. R(τ) does not depend on θ.' },
            { tex: '\\nabla_{\\theta} P = P\\, \\nabla_{\\theta} \\log P \;\;\\Rightarrow\;\; \\nabla_{\\theta} J = \\mathbb{E}_{\\tau}\\bigl[\\nabla_{\\theta} \\log P(\\tau;\\theta)\\, R(\\tau)\\bigr]', why: 'The log-derivative trick: ∇P = P ∇log P. The gradient of an integral becomes an expectation we can estimate by sampling.' },
            { tex: 'P(\\tau;\\theta) = \\rho(s_0)\\prod_{t} \\pi_{\\theta}(a_t \\mid s_t)\\, p(s_{t+1} \\mid s_t, a_t)', why: 'A trajectory’s probability: start state, then for each step the policy’s choice and the environment’s response.' },
            { tex: '\\nabla_{\\theta} \\log P(\\tau;\\theta) = \\sum_{t} \\nabla_{\\theta} \\log \\pi_{\\theta}(a_t \\mid s_t)', why: 'Taking the log turns the product into a sum, and every term not involving θ (the start distribution and the environment’s dynamics p) differentiates to zero.' },
          ],
          result: 'The gradient needs only the policy’s own log-probabilities and the observed returns, not the environment’s dynamics. That is why policy gradients are model-free, and why they work for any simulator, however complicated.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Intuition: trial, error and nudging probabilities',
          text: 'Think of it as supervised learning with self-generated labels: the agent *samples* an action, and afterwards we re-weight the "label" by how well things went. A good outcome means "do more of that" (increase `log π(a|s)`); a bad outcome means "do less of that". For a softmax policy the gradient of `log π(a)` with respect to preference `i` is simply `1[i = a] − π_i`: push up the chosen action’s preference and push down the others in proportion to their probability. The next code uses exactly that.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why can a policy-gradient method handle a continuous action such as a steering angle in [−1, 1] more easily than DQN?',
      options: [
        { text: 'The policy network outputs the parameters of a distribution (mean and spread) over actions, so an action is *sampled*; no maximum over infinitely many actions is needed', correct: true, why: 'DQN must compute a max over all actions, which is trivial for 4 buttons but not for a continuous range. A Gaussian policy just samples, and its log-probability is differentiable.' },
        { text: 'Policy gradients discretise the steering angle into many buttons internally', why: 'That is not what happens: the policy works directly in the continuous space, with no discretisation.' },
        { text: 'Policy gradients do not need rewards, only the observations', why: 'The return is the entire learning signal: log-probabilities are weighted by it.' },
        { text: 'Policy gradients are off-policy, so old data can be reused', why: 'The basic algorithms are **on-policy**, which is a limitation, not a reason they handle continuous actions.' },
      ],
      explanation: 'A stochastic policy parameterised by a distribution is naturally compatible with continuous actions: sample from it and differentiate its log-probability.',
    },
    {
      kind: 'concept',
      title: 'REINFORCE and the variance problem',
      blocks: [
        {
          type: 'p',
          text: '**REINFORCE** (Ronald Williams, 1992) is the simplest algorithm that follows the theorem. Play one or more full episodes with the current policy, compute the **return-to-go** `G_t` for every step, and update `θ` along `Σ_t ∇log π(a_t|s_t)·G_t`. Because the weights change after each batch, the old episodes no longer describe the new policy: the data is used once and thrown away (**on-policy**). The program below is REINFORCE on a three-armed bandit, with a softmax policy written out by hand so every gradient is visible: three actions with average rewards 1.0, 2.0 and 1.5 (plus noise).',
        },
        {
          type: 'code',
          title: 'reinforce_bandit.py',
          runnable: true,
          code: `import math
import random

MEANS = [1.0, 2.0, 1.5]
rng = random.Random(0)

def softmax(prefs):
    top = max(prefs)
    exps = [math.exp(p - top) for p in prefs]
    total = sum(exps)
    return [e / total for e in exps]

def sample(probs):
    u, acc = rng.random(), 0.0
    for i, p in enumerate(probs):
        acc += p
        if u < acc:
            return i
    return len(probs) - 1

prefs, baseline, lr = [0.0, 0.0, 0.0], 0.0, 0.1
for t in range(1, 1001):
    probs = softmax(prefs)
    a = sample(probs)
    r = MEANS[a] + (rng.random() - 0.5)
    advantage = r - baseline
    for i in range(3):
        grad_log_prob = (1.0 if i == a else 0.0) - probs[i]
        prefs[i] += lr * advantage * grad_log_prob
    baseline += 0.05 * (r - baseline)
    if t in (1, 50, 200, 1000):
        print(f"step {t:>4}: probabilities {[round(p, 2) for p in softmax(prefs)]}")`,
          output: `step    1: probabilities [0.31, 0.31, 0.37]
step   50: probabilities [0.12, 0.62, 0.26]
step  200: probabilities [0.01, 0.94, 0.05]
step 1000: probabilities [0.0, 0.99, 0.01]`,
          annotations: [
            { lines: '1-5', text: 'Three arms with true average rewards 1.0, 2.0 and 1.5. The best arm is the second.' },
            { lines: '7-11', text: '**Softmax**: turn preferences (logits) into probabilities. Subtracting the maximum first avoids overflow without changing the result.' },
            { lines: '13-19', text: 'Draw an action according to the probabilities with one uniform random number (inverse-CDF sampling).' },
            { lines: 21, text: 'The policy’s parameters are one **preference per action**, all starting equal (so the policy starts uniform). `baseline` is a running average of rewards; `lr` is the learning rate.' },
            { lines: '22-24', text: 'One interaction per iteration: compute the policy, sample an action from it.' },
            { lines: 25, text: 'The noisy reward: the arm’s average plus a random amount between −0.5 and 0.5.' },
            { lines: 26, text: 'The **advantage** here is the reward minus the baseline: better than usual is positive, worse than usual negative.' },
            { lines: '27-29', text: 'The policy-gradient step. The gradient of `log π(a)` for a softmax is `1[i = a] − π_i`, and it is scaled by the advantage, so a good outcome raises the chosen action’s preference and lowers the others.' },
            { lines: 30, text: 'Update the running baseline.' },
            { lines: '31-32', text: 'The policy starts uniform (~0.33 each), already leans to the best arm after 50 steps, and by step 1000 plays it 99% of the time. Exploration came for free from the randomness of the policy.' },
          ],
        },
        {
          type: 'p',
          text: 'REINFORCE works, but it is **noisy**. Each update uses a single sampled trajectory, and the return of a trajectory depends on dozens of random events. Two techniques reduce that variance without changing the expected gradient. First, **reward-to-go**: an action cannot affect rewards that came *before* it, so weight each action only by the return from that step on (that is why the theorem has `G_t`, not the whole-episode return). Second, a **baseline** `b(s)` subtracted from the return: since `E[∇log π · b(s)] = 0`, it adds no bias, but if `b` is close to the typical return, the weights become small positive and negative numbers around zero instead of large positive ones. The best simple baseline is the value function `V(s)`, which gives the **advantage** `A(s, a) = Q(s, a) − V(s)`: how much better than average this action was *in this state*.',
        },
        {
          type: 'code',
          title: 'baseline_variance.py',
          runnable: true,
          code: `import math
import random

MEANS = [1.0, 2.0, 1.5]
rng = random.Random(1)
probs = [1 / 3] * 3
V = sum(p * m for p, m in zip(probs, MEANS))

def gradient_estimates(use_baseline, n=20000):
    out = []
    for _ in range(n):
        a = int(rng.random() * 3)
        r = MEANS[a] + (rng.random() - 0.5)
        score = (1.0 if a == 1 else 0.0) - probs[1]
        out.append((r - (V if use_baseline else 0.0)) * score)
    return out

for use_baseline in (False, True):
    g = gradient_estimates(use_baseline)
    mean = sum(g) / len(g)
    std = math.sqrt(sum((x - mean) ** 2 for x in g) / len(g))
    print(f"baseline={use_baseline!s:5}  mean gradient {mean:.3f}  std {std:.3f}")`,
          output: `baseline=False  mean gradient 0.170  std 0.840
baseline=True   mean gradient 0.168  std 0.193`,
          annotations: [
            { lines: '4-7', text: 'A fixed uniform policy over the three arms, whose true value is `V` = 1.5. We can therefore estimate the gradient with respect to the second arm’s preference exactly as REINFORCE would.' },
            { lines: '9-16', text: '20 000 single-sample gradient estimates. Each is `(reward − baseline) × (1[a = arm 1] − π₁)`, with the baseline either 0 or `V`.' },
            { lines: '18-22', text: '**Same mean, one quarter of the noise.** Both versions estimate the same gradient (about 0.17, so the baseline adds no bias), but with the baseline the standard deviation falls from 0.84 to 0.19. Less noise means steadier and faster learning with the same amount of data.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why the baseline costs nothing',
          text: 'Subtracting a number `b(s)` that depends only on the state changes each gradient sample, but not its *average*: `E[∇log π(a|s)] = 0` for a probability distribution (the probabilities always sum to 1, so their total slope is zero), hence `E[∇log π(a|s) · b(s)] = 0`. The estimator stays unbiased while its variance can fall dramatically. This is the general idea of a **control variate**: subtract something with known mean zero that is correlated with the noise.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Subtracting a state-dependent baseline from the returns in the policy gradient changes the *expected* gradient, so the learned policy will be different (biased), in exchange for lower variance.',
      answer: false,
      explanation: 'False. A baseline that depends only on the state leaves the expected gradient unchanged (it is unbiased), because `E[∇log π(a|s)] = 0`. It reduces *variance* for free. (A baseline that depended on the action would introduce bias, which is why actor–critic methods are more subtle.)',
    },
    {
      kind: 'fill',
      prompt: 'Complete the REINFORCE loss, written so that gradient descent *increases* the return.',
      template: `loss = ___(log_probs * returns).sum()`,
      templateIsCode: true,
      blanks: [{ answers: ['-'] }],
      wordBank: ['-', '+', '2 *', '1 /'],
      explanation: 'Optimizers *minimise* a loss, but we want to *maximise* `Σ log π · G`. Putting a minus sign in front turns ascent into descent. A missing sign makes the agent learn to do worse.',
    },
    {
      kind: 'concept',
      title: 'Advantages, GAE and actor–critic',
      blocks: [
        {
          type: 'p',
          text: 'A natural upgrade is to learn the baseline: train a second network, the **critic**, to predict `V(s)`, and use the **actor** (the policy network) with advantages computed from it. This is the **[[actor-critic|actor–critic]]** architecture, and it underlies A2C, PPO and SAC. The critic’s own training is just supervised regression of `V(s)` towards observed returns or TD targets, exactly the value learning you already know.',
        },
        {
          type: 'p',
          text: 'How do we estimate the advantage of a step? Two extremes. The one-step **TD error** `δ_t = r_t + γV(s_{t+1}) − V(s_t)` has low variance (only one random reward) but is **biased** if the critic is wrong. The full **Monte-Carlo** advantage `G_t − V(s_t)` is unbiased but noisy. **[[gae|Generalized advantage estimation]] (GAE, Schulman et al. 2015)** blends all the n-step options with one parameter `λ`, and is the standard choice in PPO.',
        },
        {
          type: 'math',
          tex: '\\delta_t = r_t + \\gamma V(s_{t+1}) - V(s_t), \\qquad \\hat{A}_t^{\\mathrm{GAE}} = \\sum_{l=0}^{\\infty} (\\gamma\\lambda)^{l}\\, \\delta_{t+l} = \\delta_t + \\gamma\\lambda\\, \\hat{A}_{t+1}^{\\mathrm{GAE}}',
          caption: 'GAE: an exponentially weighted sum of future TD errors, computed efficiently by a backward recursion. λ = 0 gives the one-step TD error (low variance, more bias); λ = 1 gives return minus value (unbiased, high variance). Typical: γ = 0.99, λ = 0.95.',
        },
        {
          type: 'graph',
          caption: 'The weight (γλ)^l that GAE gives to the TD error l steps ahead. A small γλ makes the estimate look only a few steps ahead (low variance, more bias); γλ near 1 looks far ahead (less bias, more variance). The readout shows the effective horizon.',
          x: [0, 100],
          y: [0, 1.05],
          functions: [{ expr: '(g*m)^x', label: 'weight (γλ)^l', color: 'blue' }],
          points: [{ x: '1/(1-g*m)', y: '(g*m)^(1/(1-g*m))', color: 'red' }],
          sliders: [
            { name: 'g', min: 0.9, max: 0.999, step: 0.001, value: 0.99, label: 'discount γ' },
            { name: 'm', min: 0, max: 1, step: 0.01, value: 0.95, label: 'GAE λ' },
          ],
          readouts: [
            { label: 'effective horizon 1/(1−γλ)', expr: '1/(1-g*m)', digits: 1 },
            { label: 'weight after 10 steps', expr: '(g*m)^10', digits: 3 },
          ],
        },
        {
          type: 'p',
          text: 'Now the full thing in PyTorch: REINFORCE with a neural-network policy on CartPole. The policy outputs two logits, a `Categorical` distribution samples the action and gives its log-probability, and the returns-to-go are normalised (a cheap, effective variance-reduction trick, standing in for a learned baseline). (Run it on your PC; it takes about half a minute.)',
        },
        {
          type: 'code',
          title: 'reinforce_cartpole.py',
          desktopOnly: true,
          outputVaries: true,
          code: `import gymnasium as gym
import numpy as np
import torch
from torch import nn

torch.manual_seed(0)
env = gym.make("CartPole-v1")
policy = nn.Sequential(nn.Linear(4, 64), nn.Tanh(), nn.Linear(64, 2))
optimizer = torch.optim.Adam(policy.parameters(), lr=1e-2)
gamma = 0.99

def run_episode(seed=None):
    obs, _ = env.reset(seed=seed)
    log_probs, rewards, done = [], [], False
    while not done:
        dist = torch.distributions.Categorical(logits=policy(torch.as_tensor(obs)))
        action = dist.sample()
        obs, reward, terminated, truncated, _ = env.step(action.item())
        log_probs.append(dist.log_prob(action))
        rewards.append(reward)
        done = terminated or truncated
    return torch.stack(log_probs), rewards

def returns_to_go(rewards):
    out, g = [], 0.0
    for r in reversed(rewards):
        g = r + gamma * g
        out.append(g)
    return torch.tensor(out[::-1], dtype=torch.float32)

history = []
for episode in range(400):
    log_probs, rewards = run_episode(seed=episode if episode == 0 else None)
    returns = returns_to_go(rewards)
    returns = (returns - returns.mean()) / (returns.std() + 1e-8)
    loss = -(log_probs * returns).sum()
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    history.append(sum(rewards))
    if (episode + 1) % 100 == 0:
        print(f"episode {episode + 1:>4}: mean return of last 20 = {np.mean(history[-20:]):.0f}")`,
          output: `episode  100: mean return of last 20 = 176
episode  200: mean return of last 20 = 134
episode  300: mean return of last 20 = 479
episode  400: mean return of last 20 = 137`,
          annotations: [
            { lines: '1-4', text: 'Gymnasium for CartPole, NumPy for averaging, PyTorch for the policy.' },
            { lines: '6-10', text: 'The policy is a tiny network: 4 inputs (the observation), 64 tanh units and **2 logits**. There is no value network or ε: exploration comes from sampling.' },
            { lines: '12-14', text: '`run_episode` plays one complete episode with the current policy.' },
            { lines: '15-17', text: 'A **`Categorical`** distribution built from the logits: `sample()` draws an action, and `log_prob` will give `log π(a|s)` for that action.' },
            { lines: '18-22', text: 'Step the environment, record the log-probability (still attached to the computation graph, so gradients can flow later) and the reward, and stop on `terminated or truncated`.' },
            { lines: '24-29', text: '**Returns-to-go**, computed backwards: each step’s return is its reward plus γ times the return of the next step.' },
            { lines: '31-33', text: 'The training loop: one episode per update.' },
            { lines: '34-35', text: 'Compute returns-to-go and **normalise** them to mean 0 and standard deviation 1, so that better-than-average steps get positive weights and worse-than-average steps negative ones.' },
            { lines: 36, text: 'The loss: **minus** the sum of `log π · weight`. The minus sign turns gradient ascent into the descent PyTorch performs.' },
            { lines: '37-39', text: 'The usual three optimizer steps.' },
            { lines: '40-42', text: 'The return climbs from about 20 to a few hundred, but REINFORCE is **unstable**: here 479 at episode 300, then 137 at episode 400. One noisy update can undo progress. Fixing exactly this (steadier steps and better advantages) is what PPO is for.' },
          ],
        },
        {
          type: 'table',
          headers: ['Method', 'Advantage estimate', 'Variance', 'Bias', 'Needs a critic?'],
          rows: [
            ['REINFORCE (raw)', '`G_t`', 'Very high', 'None', 'No'],
            ['REINFORCE + baseline', '`G_t − b`', 'High', 'None', 'Optional'],
            ['One-step actor–critic', '`r + γV(s′) − V(s)`', 'Low', 'If V is wrong', 'Yes'],
            ['**GAE(λ)** (PPO)', 'Weighted sum of TD errors', 'Tunable', 'Tunable', 'Yes'],
          ],
          caption: 'A spectrum of advantage estimators, trading variance against bias.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output (returns-to-go, computed backwards).',
      code: `rewards = [0.0, 0.0, 10.0]
gamma = 0.5
out, g = [], 0.0
for r in reversed(rewards):
    g = r + gamma * g
    out.append(g)
print(out[::-1])`,
      answer: '[2.5, 5.0, 10.0]',
      hint: 'Start from the end: the last step’s return is 10. Each earlier step adds its reward and halves the later return.',
      explanation: 'Going backwards: g = 10.0; then g = 0 + 0.5×10 = 5.0; then g = 0 + 0.5×5 = 2.5. The list is built in reverse order, so `out[::-1]` puts it back in time order: `[2.5, 5.0, 10.0]`.',
    },
    {
      kind: 'error',
      prompt: 'An agent trained with this loss gets *worse* every update. Tap the faulty line.',
      lines: [
        'loss = (log_probs * returns).sum()',
        'optimizer.zero_grad()',
        'loss.backward()',
      ],
      linesAreCode: true,
      errorLines: [1],
      explanation: 'The optimizer minimises `loss`. The policy-gradient objective is something to *maximise*, so the loss must be its negative: `loss = -(log_probs * returns).sum()`. Without the minus sign, every update makes good actions *less* likely.',
    },
    {
      kind: 'numeric',
      prompt: 'A step has reward `r = 1.0`, discount `γ = 0.9`, value estimates `V(s) = 4.0` and `V(s′) = 5.0`. What is the one-step TD error `δ = r + γV(s′) − V(s)`, which is also the advantage estimate with `λ = 0`?',
      answer: '1.5',
      hint: '`1.0 + 0.9 × 5.0 − 4.0`.',
      explanation: 'δ = 1.0 + 0.9×5.0 − 4.0 = 1.0 + 4.5 − 4.0 = 1.5. The step turned out better than the critic expected (positive advantage), so the action taken gets a push up.',
      label: 'δ:',
    },
    {
      kind: 'concept',
      title: 'Strengths, weaknesses and what comes next',
      blocks: [
        {
          type: 'p',
          text: 'Policy gradients are conceptually clean and work with any action space, but plain versions have three practical weaknesses. They are **sample-inefficient**: each batch of experience is used for one update, then discarded, because the policy it describes no longer exists. They have **high variance**, which needs large batches, baselines and advantage normalisation to manage. And they can be **fragile about step size**: a single oversized update can move the policy so far that its performance collapses, and because the next batch of data comes *from* that damaged policy, recovery can be slow or impossible.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Use a baseline or critic', text: 'Never use raw returns for anything but a first experiment. Normalised returns are the minimum; a learned value function with GAE is the standard.' },
            { title: 'Collect bigger batches', text: 'Average the gradient over many episodes (or many parallel environments) before each update. This is what vectorised environments are for.' },
            { title: 'Add an entropy bonus', text: 'Subtract a small multiple of the policy’s entropy from the loss to stop it from becoming deterministic too early; this keeps exploring.' },
            { title: 'Limit how far each update can move the policy', text: 'This is the key idea of **TRPO** and its simpler successor **PPO**, the next lesson: do several gradient steps on each batch, but *clip* the objective so the new policy cannot stray far from the one that collected the data.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises build the numeric heart of a policy-gradient agent: returns-to-go, advantage normalisation, and generalized advantage estimation. All three work on plain Python lists, so they run right here.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `returns_to_go(rewards, gamma)` returning a list with the discounted return from **each** step onward: element `t` is `rewards[t] + gamma * rewards[t+1] + gamma**2 * rewards[t+2] + ...`. An empty list gives an empty list.',
      starter: `def returns_to_go(rewards, gamma):
    ...
`,
      solution: `def returns_to_go(rewards, gamma):
    out = []
    g = 0.0
    for r in reversed(rewards):
        g = r + gamma * g
        out.append(g)
    return out[::-1]
`,
      tests: `import math

assert returns_to_go([1, 1, 1], 1.0) == [3.0, 2.0, 1.0]
r = returns_to_go([1, 1, 1], 0.5)
assert all(math.isclose(a, b) for a, b in zip(r, [1.75, 1.5, 1.0]))
r = returns_to_go([0, 0, 10], 0.9)
assert all(math.isclose(a, b) for a, b in zip(r, [8.1, 9.0, 10.0]))
assert returns_to_go([5, 2, 7], 0.0) == [5.0, 2.0, 7.0]
assert returns_to_go([], 0.9) == []
assert returns_to_go([4], 0.9) == [4.0]
rewards = [1.0, 2.0, 3.0]
returns_to_go(rewards, 0.9)
assert rewards == [1.0, 2.0, 3.0]
long = returns_to_go([1.0] * 5, 0.9)
assert len(long) == 5 and math.isclose(long[0], 1 + 0.9 * long[1])`,
      checks: ['Element `t` is the discounted sum of the rewards from `t` to the end', 'Handles `gamma` of 0 and 1, a single reward and an empty list', 'Does not modify the input list'],
      hint: 'Work **backwards**: keep a running `g`, and for each reward from the last to the first do `g = r + gamma * g`, appending `g`. Reverse the result at the end.',
      explanation: 'Computing from the end makes this O(n): each return reuses the one after it via `G_t = r_t + γ·G_{t+1}`. A naive double loop that sums `gamma**k * reward` for every start step gives the same numbers in O(n²).',
    },
    {
      kind: 'code',
      prompt: 'Write `normalize_advantages(values, eps=1e-8)` returning a new list scaled to **mean 0 and standard deviation 1**: `(x - mean) / (std + eps)`, where `std` is the **population** standard deviation (divide by `n`, not `n - 1`). A list of identical numbers must give all zeros, and an empty list an empty list.',
      starter: `def normalize_advantages(values, eps=1e-8):
    ...
`,
      solution: `def normalize_advantages(values, eps=1e-8):
    if not values:
        return []
    n = len(values)
    mean = sum(values) / n
    std = (sum((x - mean) ** 2 for x in values) / n) ** 0.5
    return [(x - mean) / (std + eps) for x in values]
`,
      tests: `import math

out = normalize_advantages([1.0, 3.0])
assert math.isclose(out[0], -1.0, abs_tol=1e-6) and math.isclose(out[1], 1.0, abs_tol=1e-6)

data = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]
out = normalize_advantages(data)
assert len(out) == 8
mean = sum(out) / 8
std = math.sqrt(sum((x - mean) ** 2 for x in out) / 8)
assert abs(mean) < 1e-9 and math.isclose(std, 1.0, abs_tol=1e-6)
assert math.isclose(out[0], -1.5, abs_tol=1e-6) and math.isclose(out[-1], 2.0, abs_tol=1e-6)

assert normalize_advantages([5.0, 5.0, 5.0]) == [0.0, 0.0, 0.0]
assert normalize_advantages([]) == []
assert normalize_advantages([3.0]) == [0.0]
src = [1.0, 2.0, 3.0]
normalize_advantages(src)
assert src == [1.0, 2.0, 3.0]
big = normalize_advantages([1000.0, 2000.0, 3000.0])
assert math.isclose(big[0], -math.sqrt(1.5), abs_tol=1e-6)`,
      checks: ['Result has mean 0 and (population) standard deviation 1', 'Constant input gives all zeros (no division-by-zero error); empty input gives an empty list', 'Returns a new list and leaves the input unchanged'],
      hint: 'Compute `mean = sum(values) / n`, then `std = (sum((x - mean) ** 2 for x in values) / n) ** 0.5`, and return `[(x - mean) / (std + eps) for x in values]`. Handle the empty list first.',
      explanation: 'Normalising advantages makes the learning signal scale-free (a reward of 1 or 1000 gives the same update size) and guarantees roughly half the actions are pushed up and half down. The tiny `eps` prevents a division by zero when every value is the same. In PyTorch you would write `(x - x.mean()) / (x.std() + 1e-8)`; note that `torch.std` is the *sample* standard deviation by default, a small difference that rarely matters.',
    },
    {
      kind: 'code',
      prompt: 'Write `gae(rewards, values, last_value, gamma, lam)` returning the generalized advantage estimate for every step of one trajectory. `values[t]` is `V(s_t)` and `last_value` is `V(s_T)` for the state after the final step (use 0 if the episode terminated). Compute `delta_t = rewards[t] + gamma * V(s_(t+1)) - values[t]` with `V(s_T) = last_value`, then work **backwards** with `A_t = delta_t + gamma * lam * A_(t+1)` (and `A_T = 0`).',
      starter: `def gae(rewards, values, last_value, gamma, lam):
    ...
`,
      solution: `def gae(rewards, values, last_value, gamma, lam):
    advantages = [0.0] * len(rewards)
    next_value = last_value
    running = 0.0
    for t in reversed(range(len(rewards))):
        delta = rewards[t] + gamma * next_value - values[t]
        running = delta + gamma * lam * running
        advantages[t] = running
        next_value = values[t]
    return advantages
`,
      tests: `import math

def close(a, b):
    return len(a) == len(b) and all(math.isclose(x, y, abs_tol=1e-9) for x, y in zip(a, b))

# gamma = lam = 1: advantage = return-to-go minus value
assert close(gae([1, 2, 3], [1, 1, 1], 0.0, 1.0, 1.0), [5.0, 4.0, 2.0])
# lam = 0: just the one-step TD error
assert close(gae([1, 1, 1], [0.5, 0.5, 0.5], 0.5, 1.0, 0.0), [1.0, 1.0, 1.0])
# gamma = 1, lam = 1 with a constant TD error of 1
assert close(gae([1, 1, 1], [0.5, 0.5, 0.5], 0.5, 1.0, 1.0), [3.0, 2.0, 1.0])
# general case, computed by hand
assert close(gae([1, 1, 1], [0.5, 0.5, 0.5], 0.5, 0.9, 0.5), [1.569875, 1.3775, 0.95])
# a terminal last value of 0 and different values per step
out = gae([0.0, 1.0], [2.0, 3.0], 0.0, 1.0, 0.0)
assert close(out, [3.0 - 2.0, 1.0 + 0.0 - 3.0])
assert gae([], [], 0.0, 0.99, 0.95) == []
r, v = [1.0, 2.0], [0.5, 0.5]
gae(r, v, 0.0, 0.9, 0.9)
assert r == [1.0, 2.0] and v == [0.5, 0.5]`,
      checks: ['Computes the TD error `delta_t` using `values[t+1]` for inner steps and `last_value` after the final step', 'Accumulates backwards with `gamma * lam`, so `lam = 0` gives the TD errors and `gamma = lam = 1` gives return minus value', 'Returns one advantage per step and does not modify its inputs'],
      hint: 'Loop `t` from the last index down to 0, tracking `next_value` (starting at `last_value`) and `running` (starting at 0). Each step: `delta = rewards[t] + gamma * next_value - values[t]`, `running = delta + gamma * lam * running`, store it, then set `next_value = values[t]`.',
      explanation: 'This short loop is exactly what PPO implementations run after collecting a batch. The two special cases are a good sanity check: with `lam = 0` you get plain TD errors, and with `gamma = lam = 1` you get the Monte-Carlo advantage `G_t − V(s_t)`. Typical training uses `gamma = 0.99` and `lam = 0.95`, in between the two.',
    },
  ],
  takeaways: [
    '**Policy-gradient methods** make the network the policy: it outputs a distribution (softmax logits for discrete actions, a Gaussian for continuous ones) and the weights follow `∇J = E[Σ ∇log π(a_t|s_t) · G_t]`: raise the probability of actions followed by high return. They explore by sampling and handle continuous actions naturally.',
    'The log-derivative trick shows that the dynamics of the environment drop out of the gradient, so the method is **model-free**. **REINFORCE** samples episodes, computes returns-to-go and applies this gradient, using each batch once (**on-policy**).',
    'The estimate is **high-variance**. **Reward-to-go** and a state-dependent **baseline** reduce variance without adding bias; the natural baseline is the value function, giving the **advantage** `A = Q − V`. Normalising advantages is a cheap, standard improvement.',
    '**Actor–critic** pairs the policy (actor) with a learned value function (critic). **GAE(λ)** estimates advantages as a weighted sum of TD errors, interpolating between one-step TD (`λ = 0`, low variance, more bias) and Monte-Carlo (`λ = 1`, unbiased, high variance); `γ = 0.99, λ = 0.95` is typical.',
    'Plain policy gradients are sample-hungry and sensitive to step size (REINFORCE’s curve above jumps from 479 to 137). **PPO**, next, keeps the same ingredients but clips each update so training stays stable.',
  ],
  reading: [
    { title: 'OpenAI Spinning Up: Intro to Policy Optimization', url: 'https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html', source: 'docs', note: 'A clear derivation of the policy gradient, reward-to-go and baselines.' },
    { title: 'Sutton and Barto: Reinforcement Learning: An Introduction, chapter 13', url: 'https://incompleteideas.net/book/the-book-2nd.html', source: 'book', note: 'Policy-gradient methods, REINFORCE with baseline and actor–critic.' },
    { title: 'Williams: Simple statistical gradient-following algorithms for connectionist reinforcement learning (1992)', url: 'https://link.springer.com/article/10.1007/BF00992696', source: 'paper', note: 'The original REINFORCE paper.' },
    { title: 'Schulman et al.: High-Dimensional Continuous Control Using Generalized Advantage Estimation', url: 'https://arxiv.org/abs/1506.02438', source: 'paper', note: 'The GAE paper, the advantage estimator used in PPO.' },
    { title: 'Lilian Weng: Policy Gradient Algorithms', url: 'https://lilianweng.github.io/posts/2018-04-08-policy-gradient/', source: 'article', note: 'A thorough tour from REINFORCE to PPO, with the derivations.' },
    { title: 'Andrej Karpathy: Deep Reinforcement Learning: Pong from Pixels', url: 'https://karpathy.github.io/2016/05/31/rl/', source: 'article', note: 'A readable build-it-from-scratch introduction to policy gradients.' },
  ],
};
