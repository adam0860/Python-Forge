import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-self-play',
  title: 'Self-Play, Opponent Pools and Ratings',
  summary: 'Why the best game bots train against themselves, how strategies chase each other in circles, how an opponent pool and league training fix that, and how to measure real progress with Elo ratings and head-to-head matches in RLGym.',
  minutes: 28,
  objectives: [
    'Explain how self-play creates an automatic curriculum, and how RLGym lets one policy play both sides',
    'Describe strategy cycling and how training against a pool of past versions prevents it',
    'Compare opponent-sampling schemes: latest only, uniform pool, prioritised sampling and leagues',
    'Compute and update Elo ratings, and say what Elo can and cannot tell you',
    'Evaluate bots head to head in a real RLGym match harness',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Why train against yourself?',
      blocks: [
        {
          type: 'p',
          text: 'A fixed opponent has a ceiling: once you beat it every time, there is nothing left to learn from. A human opponent is slow and expensive. [[self-play|Self-play]] solves both problems by making the opponent *a copy of the agent itself*. At the start both players are terrible and every game is close; as the agent improves, so does the opponent, so there is always a challenge of exactly the right difficulty. It is an **automatic curriculum** that never runs out, and it needs no human data.',
        },
        {
          type: 'p',
          text: 'It is the engine behind the landmark game AIs: AlphaGo Zero and AlphaZero learned Go, chess and shogi from nothing but the rules and games against themselves; OpenAI Five learned Dota 2 by playing itself at a huge scale; and AlphaStar added a league of agents for StarCraft II. Most strong Rocket League bots trained the same way.',
        },
        {
          type: 'p',
          text: 'RLGym makes basic self-play almost free. Observations are built from each car’s own point of view (orange cars see the field mirrored), so **one policy can control both cars**, and the experience from *both* sides goes into the same network. In the 1v1 environments of the previous lessons, `env.agents` is `["blue-0", "orange-0"]`: you simply feed the same network the observation of each agent and give it the matching action. A single match thus yields two sets of training data, and the opponent is always as strong as you are.',
        },
        {
          type: 'p',
          text: 'But naive self-play has a famous trap. If you train only against the *latest* version of your opponent, the agent learns to beat that exact strategy, which changes the strategy, which a later version learns to beat, and so on. In games with a rock-paper-scissors structure (and most real games have some) the strategies **chase each other in circles** without getting stronger overall, and the agent forgets how to beat strategies it used to face. The program below shows this in the smallest possible game, and the fix.',
        },
        {
          type: 'code',
          title: 'strategy_cycling.py',
          runnable: true,
          code: `MOVES = "RPS"
PAYOFF = [[0, -1, 1],   # rock     vs rock, paper, scissors
          [1, 0, -1],   # paper
          [-1, 1, 0]]   # scissors


def best_response(opponent_mix):
    scores = [sum(PAYOFF[i][j] * opponent_mix[j] for j in range(3)) for i in range(3)]
    return scores.index(max(scores))


def exploitability(mix):
    """How much a perfect opponent wins per game against this strategy (0 = unbeatable)."""
    return max(sum(PAYOFF[i][j] * mix[j] for j in range(3)) for i in range(3))


# 1. Naive self-play: always train against the latest opponent only.
policy = [1.0, 0.0, 0.0]
played = []
for _ in range(12):
    choice = best_response(policy)
    policy = [1.0 if i == choice else 0.0 for i in range(3)]
    played.append(MOVES[choice])
print("latest-opponent self-play plays:", " ".join(played))
print("exploitability of the latest policy:", exploitability(policy))

# 2. Self-play against a pool of ALL past versions (fictitious play).
counts = [1, 0, 0]
for iteration in range(1, 3001):
    mix = [c / sum(counts) for c in counts]
    counts[best_response(mix)] += 1
    if iteration in (10, 100, 1000, 3000):
        mix = [c / sum(counts) for c in counts]
        print(f"pool of {sum(counts):4d} versions: mix {[round(m, 2) for m in mix]}, exploitability {exploitability(mix):.3f}")`,
          output: `latest-opponent self-play plays: P S R P S R P S R P S R
exploitability of the latest policy: 1.0
pool of   11 versions: mix [0.27, 0.27, 0.45], exploitability 0.182
pool of  101 versions: mix [0.33, 0.4, 0.28], exploitability 0.069
pool of 1001 versions: mix [0.33, 0.33, 0.34], exploitability 0.014
pool of 3001 versions: mix [0.34, 0.34, 0.33], exploitability 0.007`,
          annotations: [
            { lines: '1-4', text: 'Rock-paper-scissors as a payoff matrix: entry `[i][j]` is the score of move `i` against move `j` (+1 win, −1 loss, 0 draw).' },
            { lines: '7-9', text: '`best_response` finds the move with the best expected score against a mixture of opponent moves. It is what a trained agent would converge to if it only wanted to beat that opponent.' },
            { lines: '12-14', text: '`exploitability` measures how much a perfect opponent wins per game against a strategy. 0 means unbeatable; 1 means always beaten.' },
            { lines: '17-25', text: '**Latest-opponent self-play**: each new agent is the best response to the previous one. It cycles through paper, scissors, rock forever, and at every moment it is a pure, fully exploitable strategy (exploitability 1.0), so after many rounds it is no stronger than at the start.' },
            { lines: '27-31', text: '**A pool of all past versions** (called *fictitious play*): each new agent is the best response to the *average* of everything played so far, and joins the pool.' },
            { lines: '32-34', text: 'As the pool grows, the average strategy approaches the unbeatable mix (one third each), and its exploitability falls towards 0. Beating the whole history is a much more demanding target than beating the latest version, and that is exactly what an opponent pool gives you.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why history matters: catastrophic forgetting',
          text: 'A neural network trained only on recent opponents *forgets* how to handle old ones, because nothing in its training data reminds it. If an old opponent style later reappears (or if a human tries it), the agent may lose to something it beat long ago. Sampling opponents from a pool of past versions keeps those old challenges in the training distribution, the same reason replay buffers help in DQN.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'An agent is trained by always playing against the newest copy of itself. After a million steps the training reward looks stable, yet it loses badly to a version from 200 000 steps ago. What is the most likely explanation?',
      options: [
        { text: 'Strategy cycling and forgetting: it keeps adapting to the latest opponent and has lost the ability to beat older styles', correct: true, why: 'Training against only the latest opponent gives no pressure to stay good against older strategies, so improvement against one style can come at the cost of another.' },
        { text: 'The learning rate was too low for the network to update', why: 'A stable training reward against the latest opponent says nothing about a low learning rate; the agent is learning, but only against a moving target.' },
        { text: 'Self-play cannot improve an agent at all', why: 'Self-play works very well (AlphaZero, OpenAI Five). The problem is the opponent choice, not the idea.' },
        { text: 'The discount factor was too large', why: 'The discount factor affects planning horizon, not whether the agent stays good against old opponents.' },
      ],
      explanation: 'The training reward against a moving opponent is not a measure of strength. Sample opponents from a pool of past versions and test against fixed, saved opponents.',
    },
    {
      kind: 'concept',
      title: 'Opponent pools, prioritised sampling and leagues',
      blocks: [
        {
          type: 'p',
          text: 'The fix for cycling is to keep an **[[opponent-pool|opponent pool]]**: every N timesteps you save a snapshot (a frozen *copy* of the policy weights) and add it to a list. Each game, the opponent is sampled from that list, sometimes the latest version and sometimes an older one. How you sample matters.',
        },
        {
          type: 'table',
          headers: ['Scheme', 'How the opponent is chosen', 'Good for', 'Risk'],
          rows: [
            ['**Latest only**', 'Always the newest copy', 'Fast early progress; the simplest', 'Cycling, forgetting'],
            ['**Uniform over the pool**', 'Every saved version equally likely', 'Robustness, no forgetting', 'Wastes games on versions that are now far too weak'],
            ['**Mixed (e.g. 80% latest, 20% older)**', 'Mostly the latest, sometimes a random snapshot', 'A cheap, popular compromise', 'The ratio needs tuning'],
            ['**Prioritised (PFSP)**', 'Weight each opponent by how hard it is: for example (1 − win rate)^p', 'Spending games on opponents that you still lose to', 'Needs win-rate tracking; unwinnable opponents soak up games'],
            ['**Scripted anchors**', 'A few fixed hand-written bots always in the pool', 'A stable reference and protection against drifting into one weird style', 'They are weaker than the agent soon, so give them a small share'],
            ['**League** (AlphaStar)', 'Several agent types train at once: main agents, *main exploiters* (they only try to beat the current main agents), and *league exploiters* (they find weaknesses in the whole pool)', 'Diversity and robustness at scale', 'Expensive: many agents to train'],
          ],
          caption: 'Ways to choose the training opponent. [[league-training|League training]] is the heavyweight option used for StarCraft II; for a hobby bot a mixed scheme with a pool of snapshots is usually enough.',
        },
        {
          type: 'p',
          text: '**Prioritised fictitious self-play (PFSP)** is the idea that you learn most from opponents you do not yet beat reliably. If your win rate against opponent `i` is `w_i`, give it a sampling weight `(1 − w_i)^p` (with `p` around 1 to 2): opponents you always beat get almost no games, and those that beat you get most. When every win rate is 1.0 the weights are all zero, so a sensible implementation falls back to uniform sampling.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Warm up with easier opponents', text: 'Do not start self-play from random weights if you can avoid it. First teach basics (drive to the ball, touch it) with a dense reward, a curriculum, or imitation (next lesson), so early games are not two cars wandering around.' },
            { title: 'Save snapshots on a schedule', text: 'Every N timesteps (for example every few million), save a frozen *copy* of the policy to disk and add it to the pool. Copy, never reference: the live policy keeps changing.' },
            { title: 'Sample opponents each episode', text: 'Pick one with your scheme (mixed or prioritised) at every reset, and keep playing the same opponent for the whole episode. In RLGym the opponent’s observation is simply built and fed to the snapshot network.' },
            { title: 'Rate everyone', text: 'Run regular matches between snapshots and compute Elo ratings (next section) to see whether newer really means better, and to prune old snapshots that are no longer useful.' },
            { title: 'Keep fixed benchmarks', text: 'Always test against the same few scripted bots and the same saved checkpoints, so your progress curve does not depend on a moving target.' },
          ],
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Prioritised sampling gives the most games to opponents that the agent beats most often, so it can consolidate its wins.',
      answer: false,
      explanation: 'False. Prioritised sampling (PFSP) does the opposite: it gives weight to opponents with a *low* win rate, using weights like (1 − win rate)^p, because those are the opponents the agent has most to learn from. Playing endlessly against opponents you always beat produces nearly zero learning signal.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the Elo rating update.',
      template: `new_rating = rating + K * (score - ___)`,
      templateIsCode: true,
      blanks: [{ answers: ['expected', 'expected_score'] }],
      wordBank: ['expected', 'rating', 'draw', 'K'],
      explanation: 'The update moves the rating by `K × (actual score − expected score)`. If you win (score 1) against an opponent you were expected to beat easily, the expected score is high and the rating barely moves; an upset moves it a lot. That is what makes Elo self-correcting.',
    },
    {
      kind: 'concept',
      title: 'Elo ratings: measuring relative strength',
      blocks: [
        {
          type: 'p',
          text: 'Training reward is useless for comparing agents that trained against different opponents. What you want is a single number for strength, estimated from game results. The classic answer is the **[[elo-rating|Elo rating]]**, invented for chess and used in almost every game with ranked play. Ratings are only *relative*: what matters is the difference between two ratings, and a gap of 400 points means the stronger player is expected to score about 91% of the points.',
        },
        {
          type: 'math',
          tex: 'E_{A} = \\frac{1}{1 + 10^{(R_{B} - R_{A})/400}}, \\qquad R_{A}^{\\mathrm{new}} = R_{A} + K\\,(S_{A} - E_{A})',
          caption: 'Elo. E_A is A’s expected score (the probability of winning, counting a draw as one half). S_A is the actual score: 1 for a win, 0.5 for a draw, 0 for a loss. K sets how fast ratings move (16 to 32 is typical).',
        },
        {
          type: 'p',
          text: 'The first program below does an experiment you can run in seconds: four agents with known true strengths play random pairings, and Elo has to recover the strengths from nothing but wins and losses. Starting from equal ratings, the estimates converge towards the true gaps as games accumulate, with some noise left over because a win or a loss is a very small amount of information.',
        },
        {
          type: 'code',
          title: 'elo_recovers_strength.py',
          runnable: true,
          code: `import random

K = 16


def expected_score(rating_a, rating_b):
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400))


def play(strength_a, strength_b, rng):
    """1 if A wins, else 0, with win probability given by the true strengths."""
    return 1.0 if rng.random() < expected_score(strength_a, strength_b) else 0.0


true_strength = {"v1": 1000, "v2": 1200, "v3": 1400, "v4": 1700}
rating = {name: 1000.0 for name in true_strength}
rng = random.Random(7)
names = list(true_strength)

for game in range(1, 2001):
    a, b = rng.sample(names, 2)
    score_a = play(true_strength[a], true_strength[b], rng)
    change = K * (score_a - expected_score(rating[a], rating[b]))
    rating[a] += change
    rating[b] -= change
    if game in (50, 500, 2000):
        low = min(rating.values())
        print(f"after {game:4d} games:", {n: round(r - low) for n, r in rating.items()})

print("true gaps above v1:    ", {n: s - 1000 for n, s in true_strength.items()})`,
          output: `after   50 games: {'v1': 0, 'v2': 105, 'v3': 144, 'v4': 290}
after  500 games: {'v1': 0, 'v2': 137, 'v3': 306, 'v4': 542}
after 2000 games: {'v1': 0, 'v2': 240, 'v3': 409, 'v4': 689}
true gaps above v1:     {'v1': 0, 'v2': 200, 'v3': 400, 'v4': 700}`,
          annotations: [
            { lines: '6-7', text: 'The expected score formula from above, written as a function.' },
            { lines: '10-12', text: 'A simulated game: A wins with a probability given by the *true* strengths, which the rating system never sees.' },
            { lines: '15-18', text: 'Four agents with hidden true strengths; every rating starts at 1000. `K = 16` is a moderate update size.' },
            { lines: '20-25', text: 'The Elo update: pick two players, play one game, and move the winner’s rating up and the loser’s down by the same amount (`rating[b] -= change`), so the total is conserved.' },
            { lines: '26-28', text: 'Print each rating relative to the weakest agent (only differences matter). After 50 games the picture is rough; after 2000 the gaps are close to the truth (240, 409 and 689 against 200, 400 and 700).' },
          ],
        },
        {
          type: 'p',
          text: 'The second program applies the same rating system to *real* Rocket League matches in RLGym. It builds three scripted bots (one that does nothing, one that presses random buttons, and a ball chaser that steers at the ball and boosts), plays 20 matches between each pair with sides swapped every game, and rates them. It also shows why you must be modest about the result: even the ball chaser sometimes scores into its own goal, and many games end in draws.',
        },
        {
          type: 'code',
          title: 'rlgym_round_robin.py',
          lang: 'python',
          desktopOnly: true,
          code: `import random

import numpy as np
from rlgym.api import RLGym
from rlgym.rocket_league.action_parsers import LookupTableAction, RepeatAction
from rlgym.rocket_league.done_conditions import AnyCondition, GoalCondition, NoTouchTimeoutCondition, TimeoutCondition
from rlgym.rocket_league.obs_builders import DefaultObs
from rlgym.rocket_league.reward_functions import GoalReward
from rlgym.rocket_league.sim import RocketSimEngine
from rlgym.rocket_league.state_mutators import FixedTeamSizeMutator, KickoffMutator, MutatorSequence

TABLE = LookupTableAction.make_lookup_table()


def action_index(steer):
    """Index of the table row for: full throttle, boost on, handbrake off, and this steering."""
    return next(i for i, a in enumerate(TABLE) if a[0] == 1 and a[1] == steer and a[6] == 1 and a[7] == 0)


STEER = {-1: action_index(-1), 0: action_index(0), 1: action_index(1)}


def chaser(state, agent, rng):
    """Scripted bot: steer towards the ball and drive at it."""
    car = state.cars[agent].physics
    to_ball = (state.ball.position - car.position)[:2]
    forward = car.forward[:2]
    cross = forward[0] * to_ball[1] - forward[1] * to_ball[0]
    if abs(cross) < 0.15 * np.linalg.norm(to_ball) * np.linalg.norm(forward):
        return STEER[0]
    return STEER[1] if cross > 0 else STEER[-1]


def random_bot(state, agent, rng):
    return int(rng.integers(len(TABLE)))


IDLE = next(i for i, a in enumerate(TABLE) if not a.any())


def idle_bot(state, agent, rng):
    return IDLE


def make_env():
    return RLGym(
        state_mutator=MutatorSequence(FixedTeamSizeMutator(blue_size=1, orange_size=1), KickoffMutator()),
        obs_builder=DefaultObs(zero_padding=None),
        action_parser=RepeatAction(LookupTableAction(), repeats=8),
        reward_fn=GoalReward(),
        termination_cond=GoalCondition(),
        truncation_cond=AnyCondition(TimeoutCondition(60.0), NoTouchTimeoutCondition(15.0)),
        transition_engine=RocketSimEngine(),
    )


K = 24


def expected_score(rating_a, rating_b):
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400))


def play(env, blue_bot, orange_bot, rng):
    """Play one match. Returns 0 if blue scored, 1 if orange scored, None for no goal."""
    env.reset()
    done = False
    while not done:
        actions = {"blue-0": np.array([blue_bot(env.state, "blue-0", rng)]),
                   "orange-0": np.array([orange_bot(env.state, "orange-0", rng)])}
        _, _, terminated, truncated = env.step(actions)
        done = terminated["blue-0"] or truncated["blue-0"]
    return env.state.scoring_team if env.state.goal_scored else None


def head_to_head(env, bot_a, bot_b, games, rng):
    """Play "games" matches, swapping sides every game. Returns (A wins, B wins, draws)."""
    wins = [0, 0]
    for game in range(games):
        a_is_blue = game % 2 == 0
        blue, orange = (bot_a, bot_b) if a_is_blue else (bot_b, bot_a)
        winner = play(env, blue, orange, rng)
        if winner is not None:
            wins[0 if (winner == 0) == a_is_blue else 1] += 1
    return wins[0], wins[1], games - sum(wins)


bots = {"idle": idle_bot, "random": random_bot, "chaser": chaser}
rating = {name: 1000.0 for name in bots}
random.seed(0)
rng = np.random.default_rng(0)
env = make_env()

names = list(bots)
for i, a in enumerate(names):
    for b in names[i + 1:]:
        a_wins, b_wins, draws = head_to_head(env, bots[a], bots[b], 20, rng)
        print(f"{a:>6} vs {b:<6}: {a_wins:2d} - {b_wins:2d}  ({draws} draws)")
        for _ in range(a_wins):
            change = K * (1 - expected_score(rating[a], rating[b]))
            rating[a] += change
            rating[b] -= change
        for _ in range(b_wins):
            change = K * (1 - expected_score(rating[b], rating[a]))
            rating[b] += change
            rating[a] -= change
        for _ in range(draws):
            change = K * (0.5 - expected_score(rating[a], rating[b]))
            rating[a] += change
            rating[b] -= change
env.close()

print("ratings:", {name: round(r) for name, r in sorted(rating.items(), key=lambda kv: -kv[1])})`,
          output: `  idle vs random:  0 -  0  (20 draws)
  idle vs chaser:  5 -  8  (7 draws)
random vs chaser:  4 - 11  (5 draws)
ratings: {'chaser': 1071, 'idle': 972, 'random': 957}`,
          annotations: [
            { lines: '12-20', text: 'The lookup table (a NumPy array of controller rows, 90 of them) is searched for the rows meaning “full throttle and boost, no handbrake” with each steering value.' },
            { lines: '23-31', text: 'The scripted chaser reads the true game state (a scripted bot may peek) and steers by the sign of the cross product of its heading and the direction to the ball. If the ball is nearly straight ahead it drives straight.' },
            { lines: '34-42', text: 'The other two bots: random button presses, and doing nothing (the table row that is all zeros).' },
            { lines: '45-54', text: 'A 1v1 environment with a **1-minute** game limit and a 15-second no-touch limit. Only goals are rewarded here, since we only need to know who scored.' },
            { lines: '64-73', text: '`play` runs one match with any two bots (functions from state to action). Because RLGym is multi-agent, both cars act in the same `step`. It returns the scoring team, or `None` for a draw.' },
            { lines: '76-85', text: '`head_to_head` swaps sides every game (blue and orange are not perfectly equal, for example because of the kickoff) and returns wins, losses and draws from A’s point of view.' },
            { lines: '94-110', text: 'A round robin: every pair plays 20 games and each result updates the Elo ratings (a draw counts as 0.5).' },
            { lines: 113, text: 'The chaser comes out ahead, but only by about 100 points, and idle versus random never produces a goal at all. With only 20 games per pairing, the noise in such a table is large (tens to a hundred points), so use many more games before trusting small differences.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'What Elo cannot tell you',
          text: 'Elo summarises strength in **one number**, so it assumes strength is *transitive*: if A beats B and B beats C, then A should beat C. In rock-paper-scissors-like games that is false, and ratings can look stable while hiding that A has a specific weakness against C. Treat Elo as a progress dashboard, and keep the full win-rate matrix between snapshots to look for such holes. Small samples are noisy too: a 55% result over 40 games is well within chance.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output: expected scores for equal players, for a player rated 400 points higher, and for a player rated 400 points lower.',
      code: `def expected(a, b):
    return 1 / (1 + 10 ** ((b - a) / 400))

print(expected(1000, 1000), round(expected(1400, 1000), 3), round(expected(1000, 1400), 3))`,
      answer: '0.5 0.909 0.091',
      hint: 'A 400-point gap makes the exponent ±1, so the stronger player has 1 / (1 + 0.1).',
      explanation: 'Equal ratings: 1 / (1 + 10⁰) = 0.5. A +400 gap: 1 / (1 + 10⁻¹) = 1 / 1.1 = 0.909. A −400 gap: 1 / (1 + 10¹) = 1 / 11 = 0.091. The two expected scores of a match always add up to 1.',
    },
    {
      kind: 'error',
      prompt: 'This loop is meant to sample opponents from a pool of *past* versions, but every “old” opponent plays exactly like the current policy. Tap the faulty line.',
      lines: [
        'pool = []',
        'for iteration in range(1000):',
        '    opponent = random.choice(pool) if pool else policy',
        '    train(policy, opponent)',
        '    pool.append(policy)',
      ],
      linesAreCode: true,
      errorLines: [5],
      explanation: 'Line 5 appends a *reference* to the live policy object, which `train` keeps modifying, so every entry in the pool is the same, current network. A snapshot must be an independent copy: `pool.append(copy.deepcopy(policy))` (or save and reload the weights). This aliasing bug is one of the most common in self-play code.',
    },
    {
      kind: 'numeric',
      prompt: 'Player A is rated 1000 and player B 1200. With K = 32, A wins the game (score 1). By how many points does A’s rating rise? Round to the nearest whole number.',
      answer: '24',
      hint: 'Expected score of A = 1 / (1 + 10^(200/400)) ≈ 0.240. The change is 32 × (1 − 0.240).',
      explanation: 'E_A = 1 / (1 + 10^0.5) = 1 / (1 + 3.162) ≈ 0.2403. The rating change is 32 × (1 − 0.2403) = 32 × 0.7597 ≈ 24.3, so about **24** points. Beating a stronger player is rewarded: against an equal opponent the same win would give only 16.',
      label: 'Points:',
    },
    {
      kind: 'concept',
      title: 'A practical self-play recipe',
      blocks: [
        {
          type: 'table',
          headers: ['Decision', 'Starting point', 'Why'],
          rows: [
            ['When to start self-play', 'After the agent can reliably reach and touch the ball', 'From random weights, both sides flail and the games contain almost no signal'],
            ['Opponent mix', 'About 80% latest version, 20% sampled from the pool', 'Fast progress with protection against forgetting'],
            ['Snapshot frequency', 'Every few million timesteps, and keep the pool small enough to rate (tens, not thousands)', 'Neighbouring snapshots are almost identical, so saving too often adds nothing'],
            ['Team sizes', 'Train 1v1 first, then 2v2 or 3v3 with the same policy for teammates and opponents', 'Cooperation emerges from shared experience; zero-padded observations let one network handle all sizes'],
            ['Evaluation', 'Elo within the pool plus a fixed benchmark of scripted bots and early checkpoints', 'Progress must be measured against something that does not move'],
            ['Reward', 'Keep a sparse core (goals) plus modest shaping, and anneal shaping away over time', 'Heavy shaping that helps early can limit skill later, because the agent optimises the shaping instead of winning'],
            ['Exploits', 'Watch replays regularly', 'Self-play agents find physics glitches and degenerate tactics that no human intended'],
          ],
          caption: 'A conservative recipe. Every row is a hypothesis to test, not a law.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises implement the building blocks of a self-play system: the Elo update, a pool sampler that mixes the latest version with older ones, and prioritised opponent weights.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `elo_update(rating_a, rating_b, score_a, k=32)` returning the tuple `(new_rating_a, new_rating_b)`. `score_a` is A’s score (1 for a win, 0.5 for a draw, 0 for a loss). Use the expected score `1 / (1 + 10 ** ((rating_b - rating_a) / 400))`, add `k * (score_a - expected)` to A and subtract the same amount from B.',
      starter: `def elo_update(rating_a, rating_b, score_a, k=32):
    ...
`,
      solution: `def elo_update(rating_a, rating_b, score_a, k=32):
    expected_a = 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400))
    change = k * (score_a - expected_a)
    return rating_a + change, rating_b - change
`,
      tests: `import math

a, b = elo_update(1000, 1000, 1)
assert math.isclose(a, 1016.0) and math.isclose(b, 984.0)

a, b = elo_update(1000, 1000, 0.5)
assert math.isclose(a, 1000.0) and math.isclose(b, 1000.0)

a, b = elo_update(1000, 1200, 1)
assert math.isclose(a - 1000, 32 * (1 - 1 / (1 + 10 ** 0.5)))
assert 24 < a - 1000 < 25

a, b = elo_update(1200, 1000, 1)
assert 7 < a - 1200 < 8

a, b = elo_update(1200, 1000, 0)
assert a < 1200 and b > 1000
assert math.isclose(a + b, 2200.0)

a, b = elo_update(1500, 1300, 0.5, k=16)
assert a < 1500 and b > 1300

for ra, rb, s in [(900, 1100, 1), (1700, 1650, 0), (1000, 1400, 0.5)]:
    x, y = elo_update(ra, rb, s)
    assert math.isclose(x + y, ra + rb)

x, y = elo_update(1000, 1000, 1, k=10)
assert math.isclose(x, 1005.0)`,
      checks: ['Computes the expected score of A with the Elo formula', 'Moves A by `k * (score - expected)` and B by the opposite amount, so the total rating is conserved', 'Rewards upsets more than expected wins, and a draw between equals changes nothing'],
      hint: 'Compute `expected_a = 1 / (1 + 10 ** ((rating_b - rating_a) / 400))`, then `change = k * (score_a - expected_a)` and return `(rating_a + change, rating_b - change)`.',
      explanation: 'Because B gets exactly the opposite change, the sum of all ratings in a pool never changes: Elo only redistributes strength. It also needs no history: two ratings and one result are enough, which is why it works for streams of matches from a training run.',
    },
    {
      kind: 'code',
      prompt: 'Write `sample_opponent(pool, rng, latest_prob=0.8)`. `pool` is a list of snapshots with the newest **last**. With probability `latest_prob` return the newest snapshot (`pool[-1]`); otherwise return a snapshot chosen uniformly from the **older** ones (`pool[:-1]`). Use `rng.random()` for the first decision (return the newest if `rng.random() < latest_prob`) and `rng.randrange(n)` for the choice among the `n` older snapshots. If the pool has only one snapshot, always return it (without calling the generator). Raise `ValueError` for an empty pool.',
      starter: `def sample_opponent(pool, rng, latest_prob=0.8):
    ...
`,
      solution: `def sample_opponent(pool, rng, latest_prob=0.8):
    if not pool:
        raise ValueError("the pool is empty")
    if len(pool) == 1:
        return pool[0]
    if rng.random() < latest_prob:
        return pool[-1]
    older = pool[:-1]
    return older[rng.randrange(len(older))]
`,
      tests: `class FakeRng:
    def __init__(self, randoms=(), ranges=()):
        self.randoms = list(randoms)
        self.ranges = list(ranges)
        self.random_calls = 0
        self.range_calls = []

    def random(self):
        self.random_calls += 1
        return self.randoms.pop(0)

    def randrange(self, n):
        self.range_calls.append(n)
        return self.ranges.pop(0)


pool = ["v1", "v2", "v3", "v4"]

rng = FakeRng(randoms=[0.1])
assert sample_opponent(pool, rng) == "v4" and rng.range_calls == []

rng = FakeRng(randoms=[0.79])
assert sample_opponent(pool, rng) == "v4"

rng = FakeRng(randoms=[0.8], ranges=[0])
assert sample_opponent(pool, rng) == "v1" and rng.range_calls == [3]

rng = FakeRng(randoms=[0.95], ranges=[2])
assert sample_opponent(pool, rng) == "v3"

rng = FakeRng(randoms=[0.99], ranges=[1])
assert sample_opponent(pool, rng, latest_prob=0.0) == "v2"
rng = FakeRng(randoms=[0.5])
assert sample_opponent(pool, rng, latest_prob=0.6) == "v4"

rng = FakeRng()
assert sample_opponent(["only"], rng) == "only" and rng.random_calls == 0

try:
    sample_opponent([], FakeRng())
    raise SystemExit("expected ValueError")
except ValueError:
    pass

import random
r = random.Random(3)
picks = [sample_opponent(pool, r, latest_prob=0.8) for _ in range(2000)]
assert 0.74 < picks.count("v4") / 2000 < 0.86
assert all(picks.count(v) > 0 for v in ["v1", "v2", "v3"])
assert pool == ["v1", "v2", "v3", "v4"]`,
      checks: ['Returns the newest snapshot with probability `latest_prob`, using `rng.random()`', 'Otherwise picks uniformly among the older snapshots with `rng.randrange`', 'A one-snapshot pool returns it without touching the generator, and an empty pool raises `ValueError`'],
      hint: 'Handle the empty and single-element cases first. Then `if rng.random() < latest_prob: return pool[-1]`; otherwise `older = pool[:-1]` and `return older[rng.randrange(len(older))]`.',
      explanation: 'This is the “80% latest, 20% pool” scheme from the table. Taking the random generator as an argument (instead of calling the global `random`) makes the function testable with a scripted fake and makes training runs reproducible. In a real trainer, the snapshots in the pool would be loaded networks, and you would pick a new opponent at every episode reset.',
    },
    {
      kind: 'code',
      prompt: 'Write `pfsp_weights(win_rates, p=2.0)` for prioritised opponent sampling. `win_rates` is a list of the agent’s win rate (between 0 and 1) against each pool member. Return a list of probabilities proportional to `(1 - w) ** p` that **sums to 1**. If every weight is zero (the agent beats all opponents every time), return a uniform distribution. An empty list gives `[]`.',
      starter: `def pfsp_weights(win_rates, p=2.0):
    ...
`,
      solution: `def pfsp_weights(win_rates, p=2.0):
    if not win_rates:
        return []
    raw = [(1.0 - w) ** p for w in win_rates]
    total = sum(raw)
    if total == 0.0:
        return [1.0 / len(win_rates)] * len(win_rates)
    return [r / total for r in raw]
`,
      tests: `import math

w = pfsp_weights([0.0, 0.5, 1.0], p=1.0)
assert math.isclose(w[0], 1.0 / 1.5) and math.isclose(w[1], 0.5 / 1.5) and w[2] == 0.0
assert math.isclose(sum(w), 1.0)

w = pfsp_weights([0.0, 0.5, 1.0])
assert math.isclose(w[0], 1.0 / 1.25) and math.isclose(w[1], 0.25 / 1.25) and w[2] == 0.0

assert pfsp_weights([1.0, 1.0, 1.0]) == [1 / 3, 1 / 3, 1 / 3]
assert pfsp_weights([0.5]) == [1.0]
assert pfsp_weights([]) == []

w = pfsp_weights([0.9, 0.2, 0.6, 0.2])
assert math.isclose(sum(w), 1.0)
assert w[1] == w[3] and w[1] > w[2] > w[0]

hard = pfsp_weights([0.1, 0.9], p=4.0)
soft = pfsp_weights([0.1, 0.9], p=0.5)
assert hard[0] > soft[0]
equal = pfsp_weights([0.3, 0.3, 0.3, 0.3])
assert all(math.isclose(x, 0.25) for x in equal)`,
      checks: ['Weights each opponent by `(1 - win_rate) ** p` and normalises so the probabilities sum to 1', 'Opponents with a lower win rate always get a larger share, and a larger `p` sharpens the preference', 'Falls back to a uniform distribution when all weights are zero, and returns `[]` for no opponents'],
      hint: 'Compute `raw = [(1 - w) ** p for w in win_rates]`, divide each by `sum(raw)`, and handle `sum(raw) == 0` (return `1 / n` for each) and the empty list first.',
      explanation: 'This gives the agent most of its games against the opponents that currently beat it, while never wasting time on opponents it has already mastered. The exponent `p` controls how greedy the preference is: `p = 1` is gentle, larger values focus almost entirely on the hardest opponents (which can make training unstable if one opponent is unbeatable). The uniform fallback avoids a division by zero once the agent has conquered the pool.',
    },
  ],
  takeaways: [
    '**Self-play** makes the opponent a copy of the agent, giving an automatic curriculum of ever-harder games with no human data (AlphaZero, OpenAI Five, AlphaStar, most Rocket League bots). RLGym’s mirrored observations let **one policy control both teams**, so every match trains the same network twice.',
    'Training only against the latest version causes **strategy cycling and forgetting**: in rock-paper-scissors the latest-opponent agent stays fully exploitable (exploitability 1.0), while training against a pool of *all* past versions drives exploitability towards 0.',
    'Keep an **opponent pool** of frozen snapshots (always *copies*, never references). Sample opponents with a mixed scheme (for example 80% latest), **prioritised sampling** (weights `(1 − win rate)^p`), scripted anchors, or a full **league** with exploiter agents.',
    '**Elo** turns match results into relative ratings: `E = 1 / (1 + 10^((R_B − R_A)/400))` and `R += K (S − E)`. A 400-point gap is a 91% expected score. It needs many games to be reliable, and it assumes transitive strength, so also keep the full win-rate matrix.',
    'Measure progress with **fixed benchmarks** (scripted bots, saved checkpoints) in a head-to-head harness with sides swapped, not by the training reward, and watch replays for exploits. Start self-play only after the agent has basic skills.',
  ],
  reading: [
    { title: 'Silver et al.: Mastering the game of Go without human knowledge (AlphaGo Zero, 2017)', url: 'https://www.nature.com/articles/nature24270', source: 'paper', note: 'Pure self-play from scratch reaching superhuman Go.' },
    { title: 'Vinyals et al.: Grandmaster level in StarCraft II using multi-agent reinforcement learning (AlphaStar, 2019)', url: 'https://www.nature.com/articles/s41586-019-1724-z', source: 'paper', note: 'League training with main agents and exploiters, and prioritised fictitious self-play.' },
    { title: 'OpenAI et al.: Dota 2 with Large Scale Deep Reinforcement Learning (OpenAI Five, 2019)', url: 'https://arxiv.org/abs/1912.06680', source: 'paper', note: 'Self-play at huge scale, including playing 20% of games against past versions.' },
    { title: 'Bansal et al.: Emergent Complexity via Multi-Agent Competition (2018)', url: 'https://arxiv.org/abs/1710.03748', source: 'paper', note: 'How competition between copies produces complex behaviour from simple rewards.' },
    { title: 'Elo rating system (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Elo_rating_system', source: 'wikipedia', note: 'The formula, its assumptions and its limits.' },
  ],
};
