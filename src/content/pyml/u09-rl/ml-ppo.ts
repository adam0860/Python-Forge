import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-ppo',
  title: 'PPO: The Workhorse of Modern RL',
  summary: 'Proximal Policy Optimization: take the actor–critic and GAE from the last lesson and add a clipped objective that keeps every update small and safe. Learn how it works, what its hyperparameters do, and train an agent in a few lines with Stable-Baselines3.',
  minutes: 27,
  objectives: [
    'Explain the step-size problem of policy gradients and the idea of a trust region',
    'Write the probability ratio and the clipped surrogate objective, and say what each case does',
    'Describe one full PPO iteration: rollouts, GAE, several epochs of mini-batch updates, value and entropy terms',
    'Train, evaluate, save and load a PPO agent with Stable-Baselines3 and read its key hyperparameters',
    'Use the clip fraction and approximate KL divergence to diagnose training',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Why PPO exists',
      blocks: [
        {
          type: 'p',
          text: 'Last lesson ended with a problem: policy-gradient updates are noisy and one oversized step can wreck a good policy, and because the next batch of data comes from the wrecked policy, it may never recover. Supervised learning does not have this issue because the data stays the same whatever the model does. We would like to take the **biggest step that is still safe** and use each batch of experience for several gradient steps instead of one. **Proximal Policy Optimization (PPO)**, published by John Schulman and colleagues at OpenAI in 2017, does exactly that with one clever and very simple trick, and it became the default algorithm of deep RL: OpenAI Five (Dota 2), robotic hand manipulation, the RLHF stage of many language models and a large share of game bots, including most Rocket League bots trained with RLGym.',
        },
        {
          type: 'p',
          text: 'The tool is the **probability ratio** between the policy being trained and the policy that collected the data. For an action `a` taken in state `s`, `r(θ) = π_θ(a|s) / π_old(a|s)`. If `r = 1` the new policy treats that action exactly like the old one; `r = 1.5` means the new policy is now 50% more likely to take it. An earlier algorithm, **TRPO**, constrained the average KL divergence between old and new policy with a complicated second-order method. PPO reaches nearly the same effect by simply **clipping the ratio** inside the objective.',
        },
        {
          type: 'math',
          tex: 'L^{\\mathrm{CLIP}}(\\theta) = \\mathbb{E}_{t}\\Bigl[\\, \\min\\bigl(\\, r_t(\\theta)\\,\\hat{A}_t,\;\; \\mathrm{clip}\\bigl(r_t(\\theta),\\, 1-\\epsilon,\\, 1+\\epsilon\\bigr)\\,\\hat{A}_t \\bigr) \\Bigr], \\qquad r_t(\\theta) = \\frac{\\pi_{\\theta}(a_t \\mid s_t)}{\\pi_{\\mathrm{old}}(a_t \\mid s_t)}',
          caption: 'The PPO clipped surrogate objective (maximised). ε is the clip range, typically 0.2. Â is the advantage estimate (from GAE).',
        },
        {
          type: 'table',
          headers: ['Situation', 'Advantage Â', 'What the objective does', 'Result'],
          rows: [
            ['Good action, ratio below 1 + ε', 'positive', 'Gradient pushes the ratio up', 'Make the good action more likely'],
            ['Good action, ratio above 1 + ε', 'positive', 'Objective is flat: **zero gradient**', 'Stop: the policy has already moved enough'],
            ['Bad action, ratio above 1 − ε', 'negative', 'Gradient pushes the ratio down', 'Make the bad action less likely'],
            ['Bad action, ratio below 1 − ε', 'negative', 'Objective is flat: **zero gradient**', 'Stop: already reduced enough'],
            ['Bad action, ratio above 1 + ε (policy moved the wrong way)', 'negative', 'The `min` keeps the unclipped term: **full gradient**', 'Correct the mistake, never ignore it'],
          ],
          caption: 'The clipped objective in five cases. The last row is why it is min(…) and not just a clip.',
        },
        {
          type: 'graph',
          caption: 'The clipped objective as a function of the ratio r (horizontal axis) for one step with advantage A. For a positive advantage the curve rises and then goes flat above 1 + ε; for a negative advantage it falls until 1 − ε and then goes flat. Drag the sliders for the advantage A and the clip range ε.',
          x: [0, 2],
          y: [-2.5, 2.5],
          functions: [
            { expr: 'min(x*a, min(max(x,1-c),1+c)*a)', label: 'clipped objective', color: 'blue' },
            { expr: 'x*a', label: 'unclipped r·A', color: 'gray' },
          ],
          points: [{ x: 1, y: 'a', color: 'red' }],
          sliders: [
            { name: 'a', min: -2, max: 2, step: 0.1, value: 1, label: 'advantage A' },
            { name: 'c', min: 0.05, max: 0.5, step: 0.05, value: 0.2, label: 'clip range ε' },
          ],
          readouts: [
            { label: 'objective at r = 1.5', expr: 'min(1.5*a, min(max(1.5,1-c),1+c)*a)', digits: 2 },
            { label: 'objective at r = 0.5', expr: 'min(0.5*a, min(max(0.5,1-c),1+c)*a)', digits: 2 },
          ],
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'PPO reuses each batch of collected experience for several epochs of gradient steps. What stops the policy from drifting far from the one that collected the data?',
      options: [
        { text: 'The clipped objective: once the probability ratio leaves [1 − ε, 1 + ε] in the favourable direction, the gradient is zero, so there is no more incentive to move', correct: true, why: 'Clipping removes the reward for pushing the ratio further. The policy can still wander a little (so you monitor the KL), but it has no push to go far.' },
        { text: 'The policy network is frozen after the first epoch', why: 'If the weights were frozen, the later epochs would learn nothing. The weights keep changing; the objective just stops rewarding large changes.' },
        { text: 'A replay buffer mixes in old data from earlier policies', why: 'PPO is on-policy and discards the batch after its few epochs; it does not keep a replay buffer.' },
        { text: 'The learning rate is reduced to zero during training', why: 'A schedule may decay the rate, but that is a separate, optional technique unrelated to the clipping mechanism.' },
      ],
      explanation: 'Clipping creates a soft trust region: beyond ±ε the favourable objective is flat, so gradient steps stop pushing. That is what makes multiple epochs on one batch safe.',
    },
    {
      kind: 'concept',
      title: 'Clipping in action',
      blocks: [
        {
          type: 'p',
          text: 'To see the effect, imagine a policy with two actions in which the old policy picked action 0 only 10% of the time, and this one sample happened to have a positive advantage. A plain policy gradient keeps raising the probability of action 0 for as long as you let it climb. With clipping, the gradient switches off once the ratio passes 1.2. The program below optimises the same single-sample objective with and without clipping, 500 gradient steps each.',
        },
        {
          type: 'code',
          title: 'clipping_demo.py',
          runnable: true,
          code: `import math

def prob(theta):
    return 1 / (1 + math.exp(-theta))

def optimise(clip, epsilon=0.2, steps=500, lr=0.1):
    old = 0.1
    theta = math.log(old / (1 - old))
    advantage = 1.0
    for _ in range(steps):
        p = prob(theta)
        ratio = p / old
        if not clip or ratio < 1 + epsilon:
            theta += lr * advantage * p * (1 - p) / old
    return prob(theta) / old

print("without clipping, new/old probability ratio:", round(optimise(clip=False), 2))
print("with clipping,    new/old probability ratio:", round(optimise(clip=True), 2))`,
          output: `without clipping, new/old probability ratio: 9.98
with clipping,    new/old probability ratio: 1.29`,
          annotations: [
            { lines: '3-4', text: 'The probability of action 0 for a two-action softmax policy with a single logit `theta` (the sigmoid function).' },
            { lines: '6-9', text: '`optimise` sets up the situation: the **old** policy gave action 0 a probability of 0.1, the starting logit reproduces that policy exactly, and the sampled action has advantage +1 (it turned out well).' },
            { lines: '10-12', text: 'Each iteration computes the current probability and the **ratio** new/old.' },
            { lines: '13-14', text: 'The gradient-ascent step on `ratio × advantage` (the derivative of the ratio with respect to the logit is `p(1−p)/old`). **With clipping, the step is skipped once `ratio ≥ 1 + ε`**, because the clipped objective is flat there.' },
            { lines: '15', text: 'Report how much more likely the action became.' },
            { lines: '17-18', text: 'Unclipped, the policy becomes almost deterministic: the action is now **9.98 times** more likely than before, on the strength of one lucky sample. Clipped, it stops at **1.29** (just beyond the 1.2 limit, because the last step overshoots a little). Because every real batch contains thousands of such samples, some of them lucky, this is the difference between steady learning and collapse.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why the min makes it a pessimistic bound',
          text: 'Taking `min(r·A, clip(r)·A)` means the objective is never *more* optimistic than the plain surrogate: clipping only ever removes reward for moving too far, it never hands out extra. In the one case where the policy has moved the **wrong** way (a bad action became more likely, or a good one less likely), the `min` keeps the unclipped, bigger penalty so the gradient fights back at full strength. So PPO ignores changes that would be *too good to trust* but never ignores changes that are *bad*. That asymmetry is the heart of the design.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Because PPO reuses each batch of experience for several gradient epochs, it is an off-policy algorithm that can learn from a replay buffer of old data.',
      answer: false,
      explanation: 'False. PPO is **on-policy**. Reuse is limited to a few epochs on a batch that was collected by the *current* policy, and the clipping keeps the policy close enough to it for that data to stay valid. After the update, the batch is thrown away and fresh data is collected. A large replay buffer of old policies would break the assumptions of the ratio.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the computation of the probability ratio and the clipped ratio in NumPy.',
      template: `ratio = np.exp(logp_new - ___)
clipped = np.clip(ratio, 1 - eps, 1 + ___)`,
      templateIsCode: true,
      blanks: [{ answers: ['logp_old'] }, { answers: ['eps'] }],
      wordBank: ['logp_old', 'logp_new', 'eps', 'gamma', 'advantage'],
      explanation: 'Working with log-probabilities is more stable than dividing probabilities: `exp(logp_new − logp_old)` equals `π_new / π_old`. The clipped ratio is limited to the range `[1 − eps, 1 + eps]`.',
    },
    {
      kind: 'concept',
      title: 'One PPO iteration, and Stable-Baselines3',
      blocks: [
        {
          type: 'steps',
          items: [
            { title: 'Collect a rollout', text: 'Run the current policy for `n_steps` steps in each of `n_envs` parallel environments, storing observations, actions, rewards, dones, value estimates and the log-probability of every chosen action (these are the `π_old` values).' },
            { title: 'Compute advantages with GAE', text: 'Use the critic’s values and the rewards to compute `Â_t` and the return targets for the value function (γ = 0.99 and λ = 0.95 are the usual defaults).' },
            { title: 'Shuffle into mini-batches', text: 'The rollout holds `n_steps × n_envs` transitions. Split it, shuffled, into mini-batches of `batch_size`.' },
            { title: 'Optimise for several epochs', text: 'For `n_epochs` passes over the data (typically 3 to 10), take a gradient step on every mini-batch with the combined loss below. The ratio now differs from 1 because the weights have changed.' },
            { title: 'Throw the batch away and repeat', text: 'The data was for the old policy. Collect a fresh rollout with the updated one.' },
          ],
        },
        {
          type: 'math',
          tex: '\\mathcal{L}(\\theta) = -\\,L^{\\mathrm{CLIP}}(\\theta) + c_{1}\\, \\bigl(V_{\\theta}(s_t) - V_t^{\\mathrm{target}}\\bigr)^{2} - c_{2}\\, \\mathcal{H}\\bigl[\\pi_{\\theta}\\bigr](s_t)',
          caption: 'The PPO loss that is minimised: the negative clipped objective (actor), a value-function regression (critic, weight c₁ ≈ 0.5) and an entropy bonus (weight c₂, often 0 to 0.01) that rewards keeping the policy random enough to explore.',
        },
        {
          type: 'p',
          text: 'You almost never write this loop yourself. **Stable-Baselines3 (SB3)** is a well-tested library of RL algorithms (PPO, DQN, A2C, SAC, TD3) that train on any Gymnasium environment. The program below trains PPO on CartPole in about half a minute on a laptop CPU, evaluates it, and saves and reloads the model. (Run it on your PC with `pip install stable-baselines3`, which also installs PyTorch and Gymnasium.)',
        },
        {
          type: 'code',
          title: 'ppo_cartpole_sb3.py',
          desktopOnly: true,
          outputVaries: true,
          code: `import gymnasium as gym
from stable_baselines3 import PPO
from stable_baselines3.common.evaluation import evaluate_policy
from stable_baselines3.common.monitor import Monitor

env = Monitor(gym.make("CartPole-v1"))
model = PPO("MlpPolicy", env, seed=0, verbose=0)
model.learn(total_timesteps=30_000)

mean_reward, std_reward = evaluate_policy(model, env, n_eval_episodes=10)
print(f"mean return after training: {mean_reward:.0f} +/- {std_reward:.0f}")

obs, _ = env.reset(seed=0)
action, _ = model.predict(obs, deterministic=True)
print("action for the first observation:", int(action))

model.save("ppo_cartpole")
loaded = PPO.load("ppo_cartpole")
print("same action after reloading:", int(loaded.predict(obs, deterministic=True)[0]) == int(action))`,
          output: `mean return after training: 500 +/- 0
action for the first observation: 0
same action after reloading: True`,
          annotations: [
            { lines: '1-4', text: 'Gymnasium for the environment and SB3 for the algorithm, an evaluation helper and the `Monitor` wrapper (which records episode returns for logging and evaluation).' },
            { lines: 6, text: 'Create CartPole and wrap it in `Monitor`.' },
            { lines: 7, text: '**The entire algorithm is one line.** `"MlpPolicy"` means separate small fully-connected networks for the actor and the critic. SB3 chooses the output type (a categorical distribution here) from the environment’s action space automatically.' },
            { lines: 8, text: '`learn` runs the whole loop (rollouts, GAE, epochs of mini-batch updates) until 30 000 environment steps have been used.' },
            { lines: '10-11', text: 'Evaluate over 10 fresh episodes. A random policy scores about 22 here; this trained agent reaches the **maximum of 500** with no variation. CartPole is an easy problem, and PPO is far steadier than the REINFORCE curve of the last lesson.' },
            { lines: '13-15', text: '`predict` returns the action for an observation. `deterministic=True` takes the most likely action (no sampling), which is what you want when *playing* rather than training.' },
            { lines: '17-19', text: 'Save the weights and hyperparameters to `ppo_cartpole.zip`, load them back, and check that the reloaded model acts identically. This is how a trained bot is shipped.' },
          ],
        },
        {
          type: 'p',
          text: 'The defaults are good, but real projects change a handful of hyperparameters. Here are the ones that matter most, written out explicitly with SB3’s default values (except where noted), together with a vectorized environment of 8 copies and the logging option you will want for longer runs.',
        },
        {
          type: 'code',
          title: 'ppo_hyperparameters.py',
          desktopOnly: true,
          code: `from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env

vec_env = make_vec_env("CartPole-v1", n_envs=8, seed=0)
model = PPO(
    "MlpPolicy",
    vec_env,
    n_steps=256,
    batch_size=64,
    n_epochs=10,
    gamma=0.99,
    gae_lambda=0.95,
    clip_range=0.2,
    ent_coef=0.0,
    vf_coef=0.5,
    learning_rate=3e-4,
    policy_kwargs=dict(net_arch=dict(pi=[64, 64], vf=[64, 64])),
    tensorboard_log="./runs",
    verbose=1,
)
model.learn(total_timesteps=200_000)`,
          annotations: [
            { lines: '1-2', text: 'SB3 also provides helpers such as `make_vec_env`, `VecNormalize` (running normalisation of observations and rewards) and callbacks.' },
            { lines: 4, text: 'Eight copies of the environment run side by side, so each rollout step produces 8 transitions.' },
            { lines: '5-7', text: 'The algorithm, policy type and environment.' },
            { lines: '8-10', text: '**Rollout and batching.** The rollout holds 256 × 8 = 2048 transitions (the default `n_steps` is 2048 *per environment*). It is split into mini-batches of 64, and every transition is used for 10 epochs.' },
            { lines: '11-13', text: '**Advantage and clipping.** Discount 0.99, GAE λ of 0.95, and the clip range ε of 0.2.' },
            { lines: '14-16', text: '**Loss weights and step size.** No entropy bonus (raise to 0.001 to 0.01 if the policy becomes deterministic too soon), a value-loss weight of 0.5 and Adam’s learning rate of 3e-4.' },
            { lines: '17-19', text: 'Separate 64-unit hidden layers for the actor (`pi`) and critic (`vf`); TensorBoard logging to `./runs` (needs `pip install tensorboard`); and progress printing.' },
            { lines: 21, text: 'Train for 200 000 environment steps. Realistic problems need millions.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Reading PPO’s health signals',
          text: 'SB3 logs diagnostics every update. **`clip_fraction`**: the share of samples whose ratio was clipped. Values around 0.1 to 0.3 are normal; near 0 means the updates are tiny (learning rate too low), and above 0.5 means the policy is changing too fast. **`approx_kl`**: an estimate of how far the new policy moved from the old one. Values around 0.01 to 0.05 are healthy; spikes indicate instability. **`explained_variance`**: how well the critic predicts returns (1 is perfect, near 0 or negative means the critic is useless and advantages are noise). **`entropy_loss`**: if it collapses to 0 early, the policy stopped exploring.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of the clipped surrogate for three situations.',
      code: `def surrogate(ratio, advantage, eps=0.2):
    clipped = max(1 - eps, min(ratio, 1 + eps))
    return min(ratio * advantage, clipped * advantage)

print(surrogate(1.5, 2.0), surrogate(1.5, -2.0), surrogate(0.5, -2.0))`,
      answer: '2.4 -3.0 -1.6',
      hint: 'The clipped ratio is limited to [0.8, 1.2]. Then take the *smaller* of the two products each time.',
      explanation: 'Case 1: ratio 1.5, A = +2: unclipped 3.0, clipped 1.2×2 = 2.4, min = **2.4** (reward for the big change is capped). Case 2: ratio 1.5, A = −2: unclipped −3.0, clipped −2.4, min = **−3.0** (a bad action made more likely is fully penalised). Case 3: ratio 0.5, A = −2: unclipped −1.0, clipped 0.8×(−2) = −1.6, min = **−1.6**.',
    },
    {
      kind: 'error',
      prompt: 'This PyTorch PPO loss lets the policy make enormous changes whenever they look profitable. Tap the faulty line.',
      lines: [
        'ratio = (logp_new - logp_old).exp()',
        'clipped = ratio.clamp(1 - eps, 1 + eps)',
        'loss = -torch.max(ratio * adv, clipped * adv).mean()',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'It must be `torch.min`. With `max`, the objective always takes the *more optimistic* of the two terms, which removes the pessimistic bound: a big improvement in the ratio is rewarded even more instead of being capped. The `min` is what makes clipping a safety mechanism.',
    },
    {
      kind: 'numeric',
      prompt: 'PPO is configured with `n_steps = 2048`, `n_envs = 8`, `batch_size = 64` and `n_epochs = 10`. How many gradient steps does **one PPO update** (one rollout) perform?',
      answer: '2560',
      hint: 'The rollout has `2048 × 8` transitions. Divide by the batch size for the mini-batches per epoch, then multiply by the epochs.',
      explanation: 'A rollout has 2048 × 8 = 16 384 transitions. With batches of 64 that is 256 mini-batches per epoch, and 10 epochs give **2560** gradient steps for each rollout. This heavy reuse is what makes PPO far more sample-efficient than REINFORCE, which performs one step per batch.',
      label: 'Gradient steps:',
    },
    {
      kind: 'concept',
      title: 'PPO in practice',
      blocks: [
        {
          type: 'p',
          text: 'PPO’s reputation is "it usually works", but it is no magic wand. Most of its success on games comes from the setup *around* the algorithm: a well-shaped reward, a good observation, many parallel environments and enough simulation steps. A few practical rules carry across almost every project.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Use many environments in parallel', text: 'More copies give bigger, less correlated batches and faster wall-clock training. Rocket League training with RLGym commonly runs dozens of game instances.' },
            { title: 'Normalise observations and rewards', text: 'Network inputs of wildly different scales (positions in thousands, flags of 0/1) slow learning dramatically. `VecNormalize` or your own scaling keeps inputs near mean 0 and standard deviation 1; keep the same statistics when you deploy.' },
            { title: 'Start with the defaults', text: 'The SB3 defaults come from extensive research. Change one hyperparameter at a time, and only when a diagnostic points to it (low clip fraction: raise the learning rate; policy collapses: lower it or raise the entropy bonus).' },
            { title: 'Be patient', text: 'Non-trivial games need tens of millions to billions of steps. Judge progress by curves across runs and seeds, not by a single noisy evaluation.' },
            { title: 'Mind the continuous-action case', text: 'For continuous actions PPO outputs a Gaussian; clip actions to the valid range inside the environment, and consider SAC or TD3 when sample efficiency matters more than stability.' },
            { title: 'Save checkpoints and keep the best', text: 'Policies in RL can get worse as well as better. Save regularly and evaluate checkpoints against fixed opponents or scenarios.' },
          ],
        },
        {
          type: 'table',
          headers: ['Algorithm', 'Family', 'Actions', 'Data reuse', 'Best for'],
          rows: [
            ['**DQN** (and Rainbow)', 'Value-based', 'Discrete only', 'Replay buffer (off-policy)', 'Discrete actions when simulation is expensive'],
            ['**PPO**', 'Actor–critic, on-policy', 'Discrete or continuous', 'A few epochs per batch', 'The default: robust, simple, scales to many environments'],
            ['**A2C**', 'Actor–critic, on-policy', 'Discrete or continuous', 'One step per batch', 'Fast prototyping, simpler than PPO'],
            ['**SAC / TD3**', 'Actor–critic, off-policy', 'Continuous', 'Replay buffer', 'Robot control and continuous tasks; sample-efficient'],
          ],
          caption: 'Choosing an algorithm. When in doubt, start with PPO.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises build the PPO pieces you can unit-test without a game: the clipped loss, the two diagnostics that tell you whether training is healthy, and the shuffled mini-batch splitting.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `ppo_clip_loss(logp_new, logp_old, advantages, epsilon=0.2)` with NumPy. All three arguments are 1-D arrays of the same length. Compute `ratio = exp(logp_new - logp_old)`, the per-sample surrogate `min(ratio * A, clip(ratio, 1 - epsilon, 1 + epsilon) * A)`, and return the **loss** (a float): the **negative mean** of the surrogate.',
      starter: `import numpy as np

def ppo_clip_loss(logp_new, logp_old, advantages, epsilon=0.2):
    ...
`,
      solution: `import numpy as np

def ppo_clip_loss(logp_new, logp_old, advantages, epsilon=0.2):
    logp_new = np.asarray(logp_new, dtype=float)
    logp_old = np.asarray(logp_old, dtype=float)
    advantages = np.asarray(advantages, dtype=float)
    ratio = np.exp(logp_new - logp_old)
    clipped = np.clip(ratio, 1 - epsilon, 1 + epsilon)
    surrogate = np.minimum(ratio * advantages, clipped * advantages)
    return float(-surrogate.mean())
`,
      packages: ['numpy'],
      tests: `import math
import numpy as np

zero = np.zeros(3)
adv = np.array([1.0, -2.0, 3.0])
assert math.isclose(ppo_clip_loss(zero, zero, adv), -adv.mean())

new = np.log(np.array([1.5]))
assert math.isclose(ppo_clip_loss(new, np.zeros(1), np.array([2.0])), -2.4)
assert math.isclose(ppo_clip_loss(new, np.zeros(1), np.array([-2.0])), 3.0)

half = np.log(np.array([0.5]))
assert math.isclose(ppo_clip_loss(half, np.zeros(1), np.array([-2.0])), 1.6)
assert math.isclose(ppo_clip_loss(half, np.zeros(1), np.array([2.0])), -1.0)

ratios = np.array([1.5, 0.5, 1.1])
advs = np.array([2.0, -2.0, 1.0])
expected = -np.mean([2.4, -1.6, 1.1])
assert math.isclose(ppo_clip_loss(np.log(ratios), np.zeros(3), advs), expected)
assert math.isclose(ppo_clip_loss(new, np.zeros(1), np.array([2.0]), epsilon=0.6), -3.0)
assert isinstance(ppo_clip_loss(zero, zero, adv), float)

a, b, c = new.copy(), np.zeros(1), np.array([2.0])
ppo_clip_loss(a, b, c)
assert (a == new).all() and (b == 0).all() and (c == 2.0).all()`,
      checks: ['Uses the ratio `exp(logp_new - logp_old)` and takes the elementwise **minimum** of the unclipped and clipped terms', 'Handles positive and negative advantages (a bad action made likelier keeps its full penalty)', 'Returns the negative mean as a Python float and leaves the inputs unchanged'],
      hint: '`ratio = np.exp(logp_new - logp_old)`, `clipped = np.clip(ratio, 1 - epsilon, 1 + epsilon)`, then `np.minimum(ratio * advantages, clipped * advantages)`. The loss is minus its mean.',
      explanation: 'This is the whole PPO policy loss: three lines. Real implementations compute it on PyTorch tensors so that gradients flow, but the arithmetic is identical. Testing it against hand-computed cases (as these tests do) is the best protection against the sign and min/max mistakes that silently ruin training.',
    },
    {
      kind: 'code',
      prompt: 'Write `ppo_diagnostics(logp_old, logp_new, epsilon)` with NumPy returning a tuple `(approx_kl, clip_fraction)` of floats. With `log_ratio = logp_new - logp_old` and `ratio = exp(log_ratio)`: `approx_kl = mean((ratio - 1) - log_ratio)` and `clip_fraction = mean(abs(ratio - 1) > epsilon)` (the share of samples whose ratio left the clip range).',
      starter: `import numpy as np

def ppo_diagnostics(logp_old, logp_new, epsilon):
    ...
`,
      solution: `import numpy as np

def ppo_diagnostics(logp_old, logp_new, epsilon):
    log_ratio = np.asarray(logp_new, dtype=float) - np.asarray(logp_old, dtype=float)
    ratio = np.exp(log_ratio)
    approx_kl = float(np.mean((ratio - 1.0) - log_ratio))
    clip_fraction = float(np.mean(np.abs(ratio - 1.0) > epsilon))
    return approx_kl, clip_fraction
`,
      packages: ['numpy'],
      tests: `import math
import numpy as np

same = np.array([-0.5, -1.0, -2.0])
kl, frac = ppo_diagnostics(same, same, 0.2)
assert kl == 0.0 and frac == 0.0

kl, frac = ppo_diagnostics(np.zeros(1), np.log(np.array([1.5])), 0.2)
assert math.isclose(kl, 0.5 - math.log(1.5))
assert frac == 1.0

ratios = np.array([1.0, 1.1, 1.3, 0.7])
kl, frac = ppo_diagnostics(np.zeros(4), np.log(ratios), 0.2)
expected_kl = float(np.mean((ratios - 1) - np.log(ratios)))
assert math.isclose(kl, expected_kl)
assert math.isclose(frac, 0.5)

kl, frac = ppo_diagnostics(np.zeros(4), np.log(ratios), 0.5)
assert frac == 0.0 and kl > 0
assert isinstance(kl, float) and isinstance(frac, float)

rng = np.random.default_rng(0)
old = rng.normal(size=100)
new = old + rng.normal(scale=0.1, size=100)
kl, frac = ppo_diagnostics(old, new, 0.2)
assert kl >= 0 and 0.0 <= frac <= 1.0`,
      checks: ['`approx_kl` is the mean of `(ratio - 1) - log_ratio`, exactly 0 when the policies are identical', '`clip_fraction` is the fraction of samples with `abs(ratio - 1) > epsilon`', 'Returns a tuple of two Python floats'],
      hint: 'Start with `log_ratio = logp_new - logp_old` and `ratio = np.exp(log_ratio)`. The KL estimate is `np.mean((ratio - 1) - log_ratio)`. The clip fraction is `np.mean(np.abs(ratio - 1) > epsilon)` (the mean of booleans is the fraction that are true).',
      explanation: 'The estimator `(ratio − 1) − log ratio` is always non-negative (because `x − 1 ≥ ln x`) and has low variance, which is why SB3 logs it as `approx_kl`. Some implementations even stop the epochs early when it exceeds a target (`target_kl`). Taking the mean of a boolean array is the idiomatic way to compute a fraction in NumPy.',
    },
    {
      kind: 'code',
      prompt: 'Write `minibatch_indices(n, batch_size, rng)` returning a list of lists of indices. It should **shuffle** the numbers `0..n-1` with the `random.Random` object `rng` (use `rng.shuffle`) and split them into consecutive batches of `batch_size`. The last batch may be smaller. Every index must appear exactly once.',
      starter: `def minibatch_indices(n, batch_size, rng):
    ...
`,
      solution: `def minibatch_indices(n, batch_size, rng):
    indices = list(range(n))
    rng.shuffle(indices)
    return [indices[i:i + batch_size] for i in range(0, n, batch_size)]
`,
      tests: `import random

batches = minibatch_indices(10, 4, random.Random(0))
assert [len(b) for b in batches] == [4, 4, 2]
flat = [i for b in batches for i in b]
assert sorted(flat) == list(range(10))

batches = minibatch_indices(8, 4, random.Random(1))
assert [len(b) for b in batches] == [4, 4]
assert sorted(i for b in batches for i in b) == list(range(8))

assert minibatch_indices(0, 4, random.Random(0)) == []
one = minibatch_indices(3, 10, random.Random(0))
assert len(one) == 1 and sorted(one[0]) == [0, 1, 2]

shuffled = False
for seed in range(5):
    flat = [i for b in minibatch_indices(20, 5, random.Random(seed)) for i in b]
    if flat != list(range(20)):
        shuffled = True
assert shuffled

a = minibatch_indices(20, 5, random.Random(7))
b = minibatch_indices(20, 5, random.Random(7))
assert a == b
assert all(isinstance(batch, list) for batch in a)
epoch1 = minibatch_indices(20, 5, random.Random(3))
epoch2 = minibatch_indices(20, 5, random.Random(4))
assert sorted(i for x in epoch1 for i in x) == sorted(i for x in epoch2 for i in x)`,
      checks: ['Every index from 0 to `n - 1` appears exactly once, in shuffled order', 'Batches have `batch_size` items, except a possibly smaller last one', 'Uses the supplied `rng` (same seed gives the same result) and returns an empty list for `n = 0`'],
      hint: 'Make `indices = list(range(n))`, call `rng.shuffle(indices)` (it shuffles in place), then slice it: `[indices[i:i + batch_size] for i in range(0, n, batch_size)]`.',
      explanation: 'PPO does this once per epoch, with a fresh shuffle each time, so every transition is seen exactly once per epoch but in a different grouping. Passing in the random generator (instead of using the global one) keeps training runs reproducible, which is essential for comparing experiments.',
    },
  ],
  takeaways: [
    '**PPO** stabilises policy gradients with a **clipped surrogate objective**: with the ratio `r = π_new/π_old`, maximise `min(r·Â, clip(r, 1−ε, 1+ε)·Â)`. Beyond `1 ± ε` in the favourable direction the gradient is zero, so a batch can safely be reused for several epochs; the `min` keeps the full penalty when the policy moves the wrong way.',
    'One iteration: **collect a rollout** (many environments in parallel), **compute GAE advantages**, then run `n_epochs` of shuffled **mini-batch** updates on the combined loss (clipped policy loss + value loss + entropy bonus), then discard the data (**on-policy**).',
    '**Stable-Baselines3** trains PPO in one line (`PPO("MlpPolicy", env).learn(...)`), with `predict`, `save` and `load`. Key hyperparameters: `n_steps`, `batch_size`, `n_epochs`, `gamma = 0.99`, `gae_lambda = 0.95`, `clip_range = 0.2`, `ent_coef`, `learning_rate = 3e-4`.',
    'Watch `clip_fraction` (about 0.1 to 0.3 is normal), `approx_kl`, `explained_variance` and entropy to see whether training is healthy; normalise observations and rewards; expect millions of steps; start with the defaults and change one thing at a time.',
    'Choose by problem: **PPO** is the robust default (discrete or continuous), **DQN/Rainbow** for discrete actions when simulation is costly, **SAC/TD3** for continuous control with replay. Unit 10 applies PPO to games, including Rocket League with RLGym.',
  ],
  reading: [
    { title: 'Schulman et al.: Proximal Policy Optimization Algorithms (2017)', url: 'https://arxiv.org/abs/1707.06347', source: 'paper', note: 'The PPO paper, short and readable.' },
    { title: 'OpenAI Spinning Up: Proximal Policy Optimization', url: 'https://spinningup.openai.com/en/latest/algorithms/ppo.html', source: 'docs', note: 'Clear explanation with pseudocode and the clipping intuition.' },
    { title: 'Stable-Baselines3 documentation: PPO', url: 'https://stable-baselines3.readthedocs.io/en/master/modules/ppo.html', source: 'docs', note: 'Parameters, defaults and logged diagnostics.' },
    { title: 'Huang et al.: The 37 Implementation Details of Proximal Policy Optimization', url: 'https://iclr-blog-track.github.io/2022/03/25/ppo-implementation-details/', source: 'article', note: 'What actually matters when you implement PPO.' },
    { title: 'Schulman et al.: Trust Region Policy Optimization (2015)', url: 'https://arxiv.org/abs/1502.05477', source: 'paper', note: 'PPO’s predecessor and the idea of a trust region.' },
    { title: 'Hugging Face Deep RL Course: Proximal Policy Optimization', url: 'https://huggingface.co/learn/deep-rl-course/unit8/introduction', source: 'course', note: 'A hands-on PPO unit.' },
  ],
};
