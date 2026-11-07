import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-imitation',
  title: 'Imitation Learning: Learning from Demonstrations',
  summary: 'Teach a bot by showing it, not by scoring it. Behavioral cloning, why it fails quietly when the learner drifts off the expert’s path, DAgger as the fix, and how demonstrations are combined with RL, demonstrated on a real RLGym bot.',
  minutes: 29,
  objectives: [
    'Explain when imitation learning beats reinforcement learning and when it does not',
    'Implement behavioral cloning as supervised learning on (state, action) pairs',
    'Describe distribution shift and why behavioral-cloning errors grow quadratically with the horizon',
    'Explain DAgger and show on a real RLGym bot that it repairs a failing clone',
    'Plan a pipeline that pretrains with demonstrations and then fine-tunes with RL, avoiding data-leakage mistakes',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Learning from an expert',
      blocks: [
        {
          type: 'p',
          text: 'Reinforcement learning needs a reward, and writing a good reward is hard (the reward-design lesson showed how easily agents find loopholes). **[[imitation-learning|Imitation learning]]** takes a different route: instead of a score, you provide *demonstrations* (a human playing, a recorded replay, a scripted bot) and the agent learns to act like the expert. It shines in three situations: when what you want is hard to express as a reward (“play like a human”, “drive naturally”), when exploration is the bottleneck (the expert shows the agent where the interesting behavior is), and when you need a good starting point before RL.',
        },
        {
          type: 'p',
          text: 'Imitation has a long history in games. AlphaGo first trained its policy network on millions of human moves; AlphaStar started from supervised learning on human StarCraft II replays before reinforcement learning; OpenAI’s VPT learned to play Minecraft from many thousands of hours of recorded gameplay; and racing games such as *Forza* use “Drivatars” that learn from how real players drive, so that opponents behave like people. The same idea is how you can give an NPC a human-like style that a reward could never capture.',
        },
        {
          type: 'table',
          headers: ['Method', 'Idea', 'Needs', 'Main weakness'],
          rows: [
            ['**[[behavioral-cloning|Behavioral cloning]]** (BC)', 'Supervised learning of the expert’s action from the state', 'A dataset of (state, action) pairs', 'Compounding errors: the learner drifts into states the expert never showed'],
            ['**[[dagger|DAgger]]**', 'Let the learner act, ask the expert to label the states it reaches, retrain on everything', 'An expert you can *query* during training', 'An expert on call (often a person or a script)'],
            ['**Inverse RL / GAIL**', 'Infer a reward (or a discriminator) from the demonstrations, then use RL', 'Demonstrations plus an environment', 'Harder to train; adversarial instability'],
            ['**BC then RL**', 'Pretrain with BC, fine-tune with a reward', 'Demonstrations and a reward', 'Fine-tuning can erase the imitated style unless it is regularised'],
          ],
          caption: 'The imitation-learning family. Behavioral cloning is the foundation of the others.',
        },
        {
          type: 'math',
          tex: '\\mathcal{L}(\\theta) = -\\,\\mathbb{E}_{(s,\\,a^{*}) \\sim \\mathcal{D}}\\bigl[\\log \\pi_{\\theta}(a^{*} \\mid s)\\bigr]',
          caption: 'Behavioral cloning: maximise the log-probability that the learner π_θ assigns to the expert’s action a* in each demonstrated state s. For discrete actions this is exactly the cross-entropy loss of a classifier.',
        },
        {
          type: 'p',
          text: 'Behavioral cloning is therefore *just supervised learning*, which makes it easy and stable. Its trap is hidden in the expectation: the states `s` come from the *expert’s* trajectories, but at play time the learner sees states produced by *its own* actions. The two distributions differ, and the difference grows. This is **[[distribution-shift|distribution shift]]**. A learner that is 99% accurate on the demonstrations still makes a mistake every hundred steps; each mistake puts it in a state that the expert (who never made that mistake) never visited, so it has no training data there, so it is more likely to err again, and the errors snowball.',
        },
        {
          type: 'p',
          text: 'The program below isolates this in a tiny world. A car drives down a road and gets bumped sideways at random; the expert always steers back to the middle, so its demonstrations only ever contain offsets −1, 0 and +1. The clone copies the expert wherever it has data, does nothing where it has none, and slips 10% of the time (no learner is perfect). Then **DAgger** is applied: drive with the clone, let the expert label the offsets it actually reaches, and retrain.',
        },
        {
          type: 'code',
          title: 'compounding_errors.py',
          runnable: true,
          code: `import random

LIMIT, HORIZON, KICK, SLIP = 25, 100, 0.2, 0.1


def expert(offset, rng):
    """Steer back towards the middle of the road."""
    return -1 if offset > 0 else 1 if offset < 0 else 0


def clone(data):
    """Copy the expert where the data has an answer, do nothing where it has none, and
    slip (pick a random steering action) 10% of the time: no learner is perfect."""
    def policy(offset, rng):
        if rng.random() < SLIP:
            return rng.randrange(3) - 1
        return data.get(offset, 0)
    return policy


def drive(policy, seed):
    """One drive of HORIZON steps. Returns (total distance from the middle, visited offsets)."""
    rng = random.Random(seed)
    offset, cost, visited = 0, 0, []
    for _ in range(HORIZON):
        visited.append(offset)
        offset += policy(offset, rng)
        if rng.random() < KICK:                      # a bump pushes the car sideways
            offset += 1 if rng.random() < 0.5 else -1
        offset = max(-LIMIT, min(LIMIT, offset))
        cost += abs(offset)
    return cost, visited


def average_cost(policy, drives=200):
    return sum(drive(policy, 1000 + i)[0] for i in range(drives)) / drives


# 1. Behavioral cloning: the demonstrations are drives by the expert.
data = {}
for seed in range(20):
    for offset in drive(expert, seed)[1]:
        data[offset] = expert(offset, None)
print(f"expert                 average cost {average_cost(expert):7.1f}")
print(f"behavioral cloning     average cost {average_cost(clone(data)):7.1f}   (offsets with data: {len(data)})")

# 2. DAgger: drive with the clone, let the expert label every offset it reaches, retrain.
for round_number in range(1, 4):
    policy = clone(data)
    for seed in range(20):
        for offset in drive(policy, 5000 + 100 * round_number + seed)[1]:
            data[offset] = expert(offset, None)
    print(f"DAgger round {round_number}         average cost {average_cost(clone(data)):7.1f}   (offsets with data: {len(data)})")`,
          output: `expert                 average cost    20.2
behavioral cloning     average cost   113.6   (offsets with data: 3)
DAgger round 1         average cost    35.2   (offsets with data: 5)
DAgger round 2         average cost    28.8   (offsets with data: 8)
DAgger round 3         average cost    28.8   (offsets with data: 8)`,
          annotations: [
            { lines: 3, text: 'The road is 25 units either side of the middle, drives last 100 steps, a bump happens 20% of the time, and the clone slips 10% of the time.' },
            { lines: '6-8', text: 'The expert: steer back towards the middle (−1 if to the right of it, +1 if to the left, 0 if centred). It recovers from every bump at once, so it never strays further than one unit.' },
            { lines: '11-18', text: 'The learner: it looks the offset up in its table of demonstrations and does nothing (action 0) if it has no data for that offset. On top of that, 10% of the time it picks a random steering action: a stand-in for the imperfection of any real model.' },
            { lines: '21-32', text: 'One drive. The cost is the total distance from the middle of the road over 100 steps; the function also returns the offsets that were visited, which is what the experts will label.' },
            { lines: '39-43', text: 'Behavioral cloning: record 20 drives by the expert. They only contain three different offsets (−1, 0, +1), so the table has three entries.' },
            { lines: '44-45', text: 'The expert’s cost is about 20. The clone costs about **114**, more than five times as much: after a slip it sometimes ends up at offset ±2 or beyond, where its table is empty, so it does nothing and the random bumps push it further away.' },
            { lines: '48-53', text: 'DAgger: drive with the *clone*, label every offset it visits with the expert’s action, add the pairs and rebuild the table. Each round the table covers more of the places the clone really goes (3, 5, then 8 offsets) and the cost falls to about 29, close to the expert, with the rest explained by the 10% slips.' },
          ],
        },
        {
          type: 'math',
          tex: 'J(\\pi_{\\mathrm{BC}}) \\le J(\\pi^{*}) + O(\\varepsilon\\,T^{2}), \\qquad J(\\pi_{\\mathrm{DAgger}}) \\le J(\\pi^{*}) + O(\\varepsilon\\,T)',
          caption: 'Ross and Bagnell (2010) and Ross, Gordon and Bagnell (2011): if the learner makes a mistake with probability ε per step over a horizon of T steps, BC’s extra cost can grow like ε T², but DAgger’s only like ε T.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why T squared?',
          text: 'A mistake at step t does not cost one unit of error: it pushes the learner into unfamiliar territory where it may keep failing for all the *remaining* T − t steps. Adding that up over mistakes spread across the episode gives a cost proportional to ε × (T + (T−1) + … + 1) ≈ ε T² / 2. DAgger removes the snowball because the learner is trained on the states it ends up in *after* making mistakes, so it has seen how to recover.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A cloned Rocket League bot agrees with the expert on 99% of the demonstration frames, yet in matches it keeps driving past the ball and wandering off. What is the most likely cause?',
      options: [
        { text: 'Distribution shift: small errors put it in states that the expert never visited, where the training data has nothing to say', correct: true, why: 'High accuracy on the expert’s own states is exactly what behavioral cloning guarantees. The failure comes from the states the clone creates for itself, which are not in the dataset.' },
        { text: 'The network is overfitting, so it needs a larger learning rate', why: 'The agreement is already 99% and a larger learning rate would not help the clone in states it has never seen.' },
        { text: 'The expert’s demonstrations must have been wrong', why: 'The demonstrations can be perfect and the clone still fails: the trouble is where the clone ends up, not what the expert did.' },
        { text: 'Behavioral cloning cannot learn discrete actions', why: 'BC is routinely used with discrete actions as a plain classifier; that is what the program in this lesson does.' },
      ],
      explanation: 'Accuracy on demonstrations is the wrong measure for a policy: you must run the policy and measure what it *does*. DAgger-style data collection fixes the mismatch by labelling the learner’s own states.',
    },
    {
      kind: 'concept',
      title: 'Cloning a Rocket League bot, and repairing it with DAgger',
      blocks: [
        {
          type: 'p',
          text: 'Now the real thing. The expert is the scripted ball chaser from the self-play lesson. We record 40 expert-versus-expert matches (12 000 pairs of observation and action, taken from both cars’ points of view), train a small PyTorch network to predict the action from the observation, and test it by letting it drive for ten seconds with an idle opponent. The metric is the number of episodes, out of 50, in which the bot touches the ball. Then we run three rounds of DAgger.',
        },
        {
          type: 'code',
          title: 'clone_chaser_with_dagger.py',
          lang: 'python',
          desktopOnly: true,
          code: `import random

import numpy as np
import torch
from torch import nn
from rlgym.api import RLGym
from rlgym.rocket_league.action_parsers import LookupTableAction, RepeatAction
from rlgym.rocket_league.done_conditions import GoalCondition, TimeoutCondition
from rlgym.rocket_league.obs_builders import DefaultObs
from rlgym.rocket_league.reward_functions import GoalReward
from rlgym.rocket_league.sim import RocketSimEngine
from rlgym.rocket_league.state_mutators import FixedTeamSizeMutator, KickoffMutator, MutatorSequence

TABLE = LookupTableAction.make_lookup_table()


def action_index(steer):
    return next(i for i, a in enumerate(TABLE) if a[0] == 1 and a[1] == steer and a[6] == 1 and a[7] == 0)


STEER = {-1: action_index(-1), 0: action_index(0), 1: action_index(1)}


def expert(state, agent):
    """The scripted ball chaser we want to imitate."""
    car = state.cars[agent].physics
    to_ball = (state.ball.position - car.position)[:2]
    forward = car.forward[:2]
    cross = forward[0] * to_ball[1] - forward[1] * to_ball[0]
    if abs(cross) < 0.15 * np.linalg.norm(to_ball) * np.linalg.norm(forward):
        return STEER[0]
    return STEER[1] if cross > 0 else STEER[-1]


def make_env():
    return RLGym(
        state_mutator=MutatorSequence(FixedTeamSizeMutator(blue_size=1, orange_size=1), KickoffMutator()),
        obs_builder=DefaultObs(zero_padding=None),
        action_parser=RepeatAction(LookupTableAction(), repeats=8),
        reward_fn=GoalReward(),
        termination_cond=GoalCondition(),
        truncation_cond=TimeoutCondition(10.0),
        transition_engine=RocketSimEngine(),
    )


def run_episodes(env, choose_actions, episodes, record=None):
    """choose_actions(obs_dict, state) -> {agent: action index}. Returns how many episodes had a touch by blue."""
    touches = 0
    for _ in range(episodes):
        obs = env.reset()
        done, touched = False, False
        while not done:
            actions = choose_actions(obs, env.state)
            if record is not None:
                for agent in env.agents:
                    record.append((obs[agent], actions[agent]))
            obs, _, terminated, truncated = env.step({a: np.array([i]) for a, i in actions.items()})
            touched = touched or env.state.cars["blue-0"].ball_touches > 0
            done = terminated["blue-0"] or truncated["blue-0"]
        touches += touched
    return touches


def train_clone(X, y, epochs=40):
    """Behavioral cloning: plain supervised classification of the expert's action."""
    policy = nn.Sequential(nn.Linear(X.shape[1], 128), nn.ReLU(), nn.Linear(128, 128), nn.ReLU(), nn.Linear(128, len(TABLE)))
    optimizer = torch.optim.Adam(policy.parameters(), lr=1e-3)
    for _ in range(epochs):
        order = torch.randperm(len(X))
        for i in range(0, len(X), 256):
            batch = order[i:i + 256]
            loss = nn.functional.cross_entropy(policy(X[batch]), y[batch])
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
    return policy


IDLE = next(i for i, a in enumerate(TABLE) if not a.any())


def clone_action(policy, obs):
    with torch.no_grad():
        return int(policy(torch.tensor(obs, dtype=torch.float32)).argmax())


def touch_episodes(env, policy, episodes=50):
    """In how many episodes does the cloned bot (blue) touch the ball, against a motionless orange car?"""
    chooser = lambda obs, state: {"blue-0": clone_action(policy, obs["blue-0"]), "orange-0": IDLE}
    return run_episodes(env, chooser, episodes)


random.seed(0)
torch.manual_seed(0)
env = make_env()

# 1. Demonstrations: (observation, expert action) pairs from expert-vs-expert games.
demos = []
run_episodes(env, lambda obs, state: {a: expert(state, a) for a in env.agents}, episodes=40, record=demos)
inputs = [o for o, _ in demos]
labels = [a for _, a in demos]
print("demonstration pairs:", len(demos))

# 2. Behavioral cloning, then DAgger rounds: let the clone drive, ask the expert what it
#    would have done in the states the clone reaches, add those pairs, and retrain.
expert_touches = run_episodes(env, lambda obs, state: {"blue-0": expert(state, "blue-0"), "orange-0": IDLE}, 50)
print("expert              episodes with a ball touch (of 50):", expert_touches)
for round_number in range(4):
    policy = train_clone(torch.tensor(np.array(inputs), dtype=torch.float32), torch.tensor(labels))
    name = "behavioral cloning" if round_number == 0 else f"DAgger round {round_number}   "
    print(f"{name:<19} episodes with a ball touch (of 50): {touch_episodes(env, policy)}   ({len(inputs)} pairs)")

    visited = []   # states the CLONE drives into, labelled by the EXPERT
    def clone_drives_expert_labels(obs, state):
        visited.append((obs["blue-0"], expert(state, "blue-0")))
        return {"blue-0": clone_action(policy, obs["blue-0"]), "orange-0": IDLE}
    run_episodes(env, clone_drives_expert_labels, 20)
    inputs += [o for o, _ in visited]
    labels += [a for _, a in visited]
env.close()`,
          output: `demonstration pairs: 12000
expert              episodes with a ball touch (of 50): 50
behavioral cloning  episodes with a ball touch (of 50): 10   (12000 pairs)
DAgger round 1      episodes with a ball touch (of 50): 17   (14720 pairs)
DAgger round 2      episodes with a ball touch (of 50): 31   (17552 pairs)
DAgger round 3      episodes with a ball touch (of 50): 50   (20041 pairs)`,
          annotations: [
            { lines: '14-21', text: 'The 90-row lookup table again. The expert only ever uses three of its rows (full throttle and boost with steering −1, 0 or +1).' },
            { lines: '24-32', text: 'The expert reads the *true game state* (a script may peek at the state) and steers by the cross product of its heading and the direction to the ball. The clone will have to manage with the observation vector alone.' },
            { lines: '35-44', text: 'A 1v1 environment with a 10-second limit.' },
            { lines: '47-62', text: '`run_episodes` plays episodes with any function that chooses actions for both cars, optionally recording (observation, action) pairs, and counts the episodes in which blue touched the ball.' },
            { lines: '65-77', text: 'Behavioral cloning: a two-hidden-layer network with one output per table row, trained with **cross-entropy** on the (observation, expert action) pairs. That is the whole algorithm.' },
            { lines: '80-91', text: '`clone_action` picks the network’s most likely action. `touch_episodes` evaluates a clone driving blue while the orange car does nothing.' },
            { lines: '98-103', text: 'Collect demonstrations from expert-versus-expert games, recording both cars’ data (the observations are mirrored for orange, so both are valid training data for a blue-view policy).' },
            { lines: '107-108', text: 'The expert itself touches the ball in all 50 episodes.' },
            { lines: '109-112', text: 'Round 0 is plain behavioral cloning. Although its agreement with the expert is high on the demonstrations, it touches the ball in only **10 of 50** episodes: drift and distribution shift in action.' },
            { lines: '114-120', text: 'The DAgger step: let the *clone* drive 20 episodes, record the observations it actually sees, label each with what the *expert* would have done in that state, append the pairs to the dataset (never replacing it), and retrain. After three rounds the clone touches the ball in **50 of 50** episodes, as often as the expert, with only about 8 000 extra labelled frames.' },
          ],
        },
        {
          type: 'p',
          text: 'In this experiment the expert is a script, so labelling is free: we simply call the script on any state the learner reaches. With a *human* expert, DAgger is more awkward (someone must label thousands of frames of the learner’s mistakes), but the recipe still works: show the person the learner’s trajectory and ask what they would have done. Where no expert is available at all, you are limited to behavioral cloning on whatever data exists, and should expect, and test for, drift.',
        },
        {
          type: 'table',
          headers: ['Pitfall', 'What goes wrong', 'Remedy'],
          rows: [
            ['**Multimodal experts**', 'Two valid behaviors (pass left or right) averaged by a regression loss give an invalid one (straight into the obstacle)', 'Predict a *distribution* (classification, a mixture model, or a diffusion policy), not a single average action'],
            ['**Imbalanced data**', 'Most frames are boring (driving straight), so the network ignores rare but critical actions (jumps, flips)', 'Weight the loss, resample rare actions, or choose a loss that focuses on hard frames'],
            ['**Hidden information**', 'A human reacted to something the observation does not contain (sound, the opponent’s intention)', 'Add history or context to the observation; accept that some behavior cannot be copied'],
            ['**Action-space mismatch**', 'Human replays have continuous inputs, but your policy has 90 discrete table rows', 'Quantise each recorded input to the nearest table row'],
            ['**Data leakage in validation**', 'Splitting individual frames at random puts nearly identical neighbouring frames in both training and validation sets, so accuracy looks great', 'Split by whole *episodes* (or whole games or players)'],
            ['**Imperfect demonstrators**', 'You clone the expert’s mistakes too', 'Filter demonstrations (keep winning episodes) and use RL afterwards to improve beyond the expert'],
          ],
          caption: 'Common problems in imitation learning and how to avoid them.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Behavioral cloning needs the expert to be available while the learner trains, to answer questions about new states.',
      answer: false,
      explanation: 'False. Behavioral cloning works on a fixed, recorded dataset of (state, action) pairs, so the expert does not have to be present, and may even be unknown (a collection of old replays). That is its great convenience. It is DAgger that needs a queryable expert, because it asks for labels in states the learner reaches that were not in the recording.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the loss used to clone a discrete-action expert.',
      template: `loss = nn.functional.___(policy(states), expert_actions)`,
      templateIsCode: true,
      blanks: [{ answers: ['cross_entropy'] }],
      wordBank: ['cross_entropy', 'mse_loss', 'relu', 'softmax'],
      explanation: 'Predicting which of 90 actions the expert chose is a **classification** problem, so the loss is **cross-entropy** between the network’s logits and the expert’s action indices (the negative log-likelihood from the formula above). For continuous actions you would use a regression loss such as `mse_loss` instead, but beware of the multimodality problem.',
    },
    {
      kind: 'concept',
      title: 'Imitation and reinforcement learning together',
      blocks: [
        {
          type: 'p',
          text: 'Imitation and RL complement each other. Imitation gives a *competent starting point* cheaply; RL then improves it with a reward and can go beyond the expert. The most common recipe has three steps: **pretrain** the policy by behavioral cloning on demonstrations (or replays); **fine-tune** with PPO and a reward, starting from the cloned weights; and add a **regulariser** that keeps the new policy close to the cloned one, so that RL does not immediately wreck the style you paid for.',
        },
        {
          type: 'math',
          tex: 'J(\\theta) = \\mathbb{E}\\Bigl[\\sum_{t} \\gamma^{t} r_{t}\\Bigr] \\;-\\; \\beta\\;\\mathbb{E}_{s}\\Bigl[\\mathrm{KL}\\bigl(\\pi_{\\theta}(\\cdot \\mid s)\\;\\big\\|\\;\\pi_{\\mathrm{BC}}(\\cdot \\mid s)\\bigr)\\Bigr]',
          caption: 'RL fine-tuning with a KL penalty towards the cloned policy. β controls the trade-off: large β stays close to the human style, small β chases reward. Anneal β towards 0 if you want the agent to surpass its teacher.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Collect and clean demonstrations', text: 'Record the expert (or convert replays with the same observation builder and action parser you will train with). Keep winning or high-quality episodes, and check that the observations match exactly what the live policy will see.' },
            { title: 'Split by episode and clone', text: 'Hold out whole episodes for validation, train with cross-entropy, and judge the result by *running* the policy, not only by frame accuracy.' },
            { title: 'Collect corrections (DAgger) if you can', text: 'Let the clone act, have the expert label the states it reaches, aggregate and retrain, until its behavior is close to the expert’s.' },
            { title: 'Fine-tune with RL', text: 'Initialise the PPO policy from the cloned network (and warm up the value network, which has seen no data yet), add a KL penalty or an auxiliary BC loss, and start training with a small learning rate.' },
            { title: 'Anneal the imitation term', text: 'Reduce the pull towards the demonstrations as the reward-driven behavior becomes better, and keep evaluating against the expert and against fixed benchmarks.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Ethics and game rules',
          text: 'Imitation is a powerful way to build human-like NPCs, tutorials and practice partners. Use data you have the right to use (your own play, consented recordings, or public datasets whose terms allow it). Do not use it to build automation that plays on someone’s behalf in online competitive games: that breaks the rules of virtually every such game.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output: the two error bounds from the formulas, ε T for DAgger and ε T² for behavioral cloning, with ε = 0.01 and T = 100.',
      code: `eps = 0.01
T = 100
print(round(eps * T, 1), round(eps * T * T, 1))`,
      answer: '1.0 100.0',
      hint: '0.01 × 100 = 1; 0.01 × 100 × 100 = 100.',
      explanation: 'DAgger’s bound is ε T = 0.01 × 100 = 1.0 and behavioral cloning’s is ε T² = 0.01 × 10 000 = 100.0. A one-in-a-hundred error rate looks harmless, but over a hundred steps the BC bound is a hundred times worse; this is why a clone with 99% accuracy can still fail in practice.',
    },
    {
      kind: 'error',
      prompt: 'This DAgger loop is supposed to aggregate data across rounds, yet the clone gets no better after the first round. Tap the faulty line.',
      lines: [
        'data = list(expert_demonstrations)',
        'for round_number in range(rounds):',
        '    policy = fit(data)',
        '    data = rollout_and_relabel(policy)',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'Line 4 *replaces* the dataset with the latest rollout only, so the original demonstrations (and every earlier round) are thrown away; the policy forgets everything it knew. DAgger’s name says it: **Da**ta**g**ger = dataset **agg**regation. The new pairs must be *added*: `data += rollout_and_relabel(policy)`.',
    },
    {
      kind: 'numeric',
      prompt: 'A clone has a per-step error rate ε = 0.002 and acts for T = 200 steps. Using the behavioral-cloning bound ε T², what is the bound on its extra cost?',
      answer: '80',
      hint: 'ε × T × T = 0.002 × 200 × 200.',
      explanation: '0.002 × 200 × 200 = 0.002 × 40 000 = **80**. Under DAgger’s bound ε T the same learner would have an extra cost of only 0.4. The longer the episodes, the more DAgger-style data collection matters.',
      label: 'Bound:',
    },
    {
      kind: 'concept',
      title: 'Data pipelines for demonstrations',
      blocks: [
        {
          type: 'p',
          text: 'Most of the effort in a real imitation project goes into the **data**, not the network. For Rocket League, community tools can convert recorded replays into the states that RLGym uses, after which you rebuild each frame’s observation with *your* observation builder and map the recorded controller inputs to *your* action space. The three exercises below implement the core pieces on small examples: the table-based cloner, the nearest-action quantiser for human inputs, and the episode-level split that prevents data leakage.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Write a majority-vote cloner for a table policy, quantise continuous controller inputs to a discrete action table with NumPy, and split demonstrations into training and validation sets by episode.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `clone_table(pairs)`. `pairs` is a list of `(state, action)` tuples (states are hashable). Return a dictionary mapping each state to the **most common** action the expert took in it. If two actions are equally common, pick the **smaller** one.',
      starter: `def clone_table(pairs):
    ...
`,
      solution: `def clone_table(pairs):
    counts = {}
    for state, action in pairs:
        per_state = counts.setdefault(state, {})
        per_state[action] = per_state.get(action, 0) + 1
    table = {}
    for state, per_state in counts.items():
        best = max(per_state.values())
        table[state] = min(a for a, c in per_state.items() if c == best)
    return table
`,
      tests: `pairs = [("a", 1), ("a", 1), ("a", 2), ("b", 0), ("b", 3), ("c", 7)]
assert clone_table(pairs) == {"a": 1, "b": 0, "c": 7}

assert clone_table([]) == {}
assert clone_table([(0, 5)]) == {0: 5}
assert clone_table([((1, 2), -1), ((1, 2), -1), ((1, 2), 1)]) == {(1, 2): -1}
assert clone_table([("x", 2), ("x", 1)]) == {"x": 1}

t = clone_table([("x", 4), ("y", 4), ("x", 9), ("x", 9), ("y", 3), ("y", 3), ("y", 4)])
assert t == {"x": 9, "y": 3}

big = [(i % 5, (i * 7) % 3) for i in range(300)]
t = clone_table(big)
assert set(t) == {0, 1, 2, 3, 4}
assert all(a in (0, 1, 2) for a in t.values())

data = [("s", 1)] * 3 + [("s", 0)] * 3
assert clone_table(data) == {"s": 0}`,
      checks: ['Maps every state in the data to its most frequent expert action', 'Breaks ties by taking the smaller action', 'Returns an empty dictionary for no data and accepts any hashable state'],
      hint: 'Count actions per state with nested dictionaries, then for each state find the highest count and take `min` over the actions that reach it.',
      explanation: 'A lookup table is the simplest possible “learner”: perfect on the states in the data and helpless on every other one, which is precisely why distribution shift hurts. A neural network generalises to nearby states, but at heart it is doing the same job: predicting the most likely expert action for a state.',
    },
    {
      kind: 'code',
      prompt: 'Write `nearest_action(action, table)` with NumPy. `table` is a 2-D array whose rows are the available discrete actions, and `action` is a recorded continuous action with the same number of values. Return the **index** of the row closest to `action` in squared Euclidean distance as a Python `int`. If several rows are equally close, return the lowest index.',
      starter: `import numpy as np


def nearest_action(action, table):
    ...
`,
      solution: `import numpy as np


def nearest_action(action, table):
    table = np.asarray(table, dtype=float)
    action = np.asarray(action, dtype=float)
    distances = ((table - action) ** 2).sum(axis=1)
    return int(np.argmin(distances))
`,
      packages: ['numpy'],
      tests: `import numpy as np

table = np.array([[0, 0, 0], [1, 0, 0], [1, 1, 0], [-1, 0, 1]], dtype=float)
assert nearest_action([0.9, 0.1, 0.0], table) == 1
assert nearest_action([1.0, 0.8, 0.1], table) == 2
assert nearest_action([-0.7, 0.1, 0.9], table) == 3
assert nearest_action([0.0, 0.0, 0.0], table) == 0
assert nearest_action([0.5, 0.0, 0.0], table) == 0
assert nearest_action([2.0, 5.0, 0.0], table) == 2

r = nearest_action(np.array([0.2, 0.0, 0.0]), table)
assert type(r) is int and r == 0

one = np.array([[3.0]])
assert nearest_action([-100.0], one) == 0

tie_table = np.array([[1.0, 0.0], [-1.0, 0.0]])
assert nearest_action([0.0, 0.0], tie_table) == 0

rng = np.random.default_rng(0)
t = rng.normal(size=(30, 4))
for i in range(30):
    assert nearest_action(t[i] + 1e-6, t) == i

assert table.tolist()[0] == [0, 0, 0]`,
      checks: ['Compares the action with every row of the table using squared Euclidean distance', 'Returns the lowest index in case of a tie, as a plain Python `int`', 'Works for tables of any size and does not modify its inputs'],
      hint: 'Subtract the action from every row (broadcasting), square, sum along `axis=1`, and take `np.argmin` (which returns the first minimum). Wrap the result in `int(...)`.',
      explanation: 'Human controller inputs are continuous, but your policy picks one of a fixed set of rows (the 90-row lookup table in RLGym, for example). Snapping each recorded input to the nearest row turns replays into a classification dataset. `np.argmin` returns the first minimum, which gives the “lowest index” tie-break for free, and broadcasting does all rows at once with no loop.',
    },
    {
      kind: 'code',
      prompt: 'Write `split_episodes(episodes, val_fraction, seed)`. `episodes` is a list of episodes, each a list of frames. Shuffle the **episodes** with `random.Random(seed)`, put the first `round(len(episodes) * val_fraction)` of them in the validation set (at least one validation episode if `val_fraction > 0` and there are at least two episodes), and the rest in the training set. Return `(train_frames, val_frames)`, each a flat list of frames. No episode may appear in both. Do not modify the input.',
      starter: `import random


def split_episodes(episodes, val_fraction, seed):
    ...
`,
      solution: `import random


def split_episodes(episodes, val_fraction, seed):
    order = list(range(len(episodes)))
    random.Random(seed).shuffle(order)
    n_val = round(len(episodes) * val_fraction)
    if val_fraction > 0 and len(episodes) >= 2:
        n_val = max(1, n_val)
    val_ids = set(order[:n_val])
    train = [f for i in order[n_val:] for f in episodes[i]]
    val = [f for i in order[:n_val] for f in episodes[i]]
    return train, val
`,
      tests: `episodes = [[(e, t) for t in range(5)] for e in range(10)]
train, val = split_episodes(episodes, 0.2, seed=0)
assert len(val) == 10 and len(train) == 40
train_ids = {e for e, _ in train}
val_ids = {e for e, _ in val}
assert len(val_ids) == 2 and len(train_ids) == 8
assert train_ids.isdisjoint(val_ids)
assert train_ids | val_ids == set(range(10))

# every episode is kept whole
for e in range(10):
    frames = [f for f in train + val if f[0] == e]
    assert sorted(frames) == [(e, t) for t in range(5)]

assert split_episodes(episodes, 0.2, 0) == split_episodes(episodes, 0.2, 0)
assert split_episodes(episodes, 0.2, 0) != split_episodes(episodes, 0.2, 1)

train, val = split_episodes(episodes, 0.0, 3)
assert val == [] and len(train) == 50

train, val = split_episodes(episodes, 0.01, 3)
assert len({e for e, _ in val}) == 1

train, val = split_episodes([[1, 2, 3]], 0.5, 0)
assert val == [] and train == [1, 2, 3]

train, val = split_episodes([[1], [2]], 0.5, 0)
assert len(train) == 1 and len(val) == 1 and train != val

assert split_episodes([], 0.3, 0) == ([], [])
assert len(episodes) == 10 and episodes[0] == [(0, t) for t in range(5)]`,
      checks: ['Shuffles whole episodes with `random.Random(seed)` and splits them, so no episode lands in both sets', 'Uses `round(len(episodes) * val_fraction)` validation episodes, at least one when possible', 'Returns flat lists of frames, is reproducible for a given seed, and does not modify its input'],
      hint: 'Shuffle a list of episode *indices* with `random.Random(seed).shuffle`. The first `n_val` indices are validation, the rest training; then flatten each side with a nested comprehension.',
      explanation: 'Neighbouring frames of a drive are nearly identical, so a random *frame* split lets the model memorise the training frames and “pass” validation on near-copies. Splitting by *episode* tests what you care about: behavior on drives it has never seen. The same rule applies to any grouped data (split by player, by game, or by session).',
    },
  ],
  takeaways: [
    '**Imitation learning** learns from demonstrations instead of a reward: ideal for human-like style, hard-to-specify goals, and a quick start before RL (AlphaGo, AlphaStar, VPT and racing “Drivatars” all use it). **Behavioral cloning** is plain supervised learning: cross-entropy on (state, expert action) pairs.',
    '**Distribution shift** is its weakness: the clone sees its own states at play time, not the expert’s. Small errors lead to unfamiliar states, then more errors; the cost can grow like ε T², so a clone with 99% accuracy can still fail. Measure clones by *running* them, not by frame accuracy.',
    '**DAgger** (dataset aggregation) fixes this by letting the learner act, having the expert label the states it reaches, *adding* them to the dataset and retraining. In our RLGym experiment a clone that touched the ball in 10 of 50 episodes reached 50 of 50 after three rounds; in the road example the cost fell from about 114 to about 29 (expert about 20).',
    'Watch for classic data problems: **multimodal** experts (average of two good actions is a bad one), **imbalanced** actions, hidden information, **action-space mismatch** (snap continuous inputs to the nearest table row), imperfect demonstrators, and **frame-level leakage** (always split by episode).',
    'Combine imitation with RL: **pretrain by cloning**, fine-tune with PPO from those weights, and add a **KL penalty** (or an auxiliary BC loss) that you anneal, so that RL can surpass the expert without immediately erasing the imitated behavior.',
  ],
  reading: [
    { title: 'Ross, Gordon and Bagnell: A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning (DAgger, 2011)', url: 'https://arxiv.org/abs/1011.0686', source: 'paper', note: 'The DAgger paper, including the proof of linear versus quadratic error growth.' },
    { title: 'Pomerleau: ALVINN, an autonomous land vehicle in a neural network (1989)', url: 'https://proceedings.neurips.cc/paper/1988/hash/812b4ba287f5ee0bc9d43bbf5bbe87fb-Abstract.html', source: 'paper', note: 'The first neural-network behavioral cloning of driving, and the first description of the drift problem.' },
    { title: 'Baker et al. (OpenAI): Video PreTraining (VPT): Learning to Act by Watching Unlabeled Online Videos (2022)', url: 'https://arxiv.org/abs/2206.11795', source: 'paper', note: 'Behavioral cloning at scale for Minecraft, followed by RL fine-tuning.' },
    { title: 'Ho and Ermon: Generative Adversarial Imitation Learning (GAIL, 2016)', url: 'https://arxiv.org/abs/1606.03476', source: 'paper', note: 'Imitation as adversarial matching of expert and learner behavior.' },
    { title: 'Hussein et al.: Imitation Learning: A Survey of Learning Methods (ACM Computing Surveys, 2017)', url: 'https://dl.acm.org/doi/10.1145/3054912', source: 'paper', note: 'A broad overview of the field.' },
  ],
};
