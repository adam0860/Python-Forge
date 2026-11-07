import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-game-ai-overview',
  title: 'Game AI: Classic Techniques vs Machine Learning',
  summary: 'The toolbox game developers have used for decades (state machines, behavior trees, A* pathfinding, minimax and Monte Carlo search) next to learned agents. Write the classics in Python, then learn when machine learning is the right tool and when it is not.',
  minutes: 27,
  objectives: [
    'Describe the main classic game AI techniques and what each is good at',
    'Implement a finite state machine, A* pathfinding and minimax with alpha-beta pruning',
    'Explain why heuristics and pruning make search fast without changing the answer',
    'Decide between hand-authored AI, learned AI and hybrids for a given game problem',
    'Place milestone systems (Deep Blue, TD-Gammon, AlphaGo, OpenAI Five) in the picture',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Two ways to make a character smart',
      blocks: [
        {
          type: 'p',
          text: 'Everything so far in this course has been about *learning*: the machine discovers behavior from data or experience. Games have a much older tradition, **authored AI**: a programmer or designer writes down the behavior. When a guard in a stealth game notices you, a shopkeeper walks to the counter or an enemy path-finds around a wall, almost always some hand-written logic is running, and has been since the 1970s. Before you use machine learning in a game, you should know what that toolbox offers, because for many problems it is the faster, cheaper and more controllable answer, and because the best learned systems often **combine** it with learning.',
        },
        {
          type: 'table',
          headers: ['Technique', 'Idea', 'Strengths', 'Weaknesses', 'Typical use'],
          rows: [
            ['**[[finite-state-machine|Finite state machine]]**', 'A few states and rules for switching between them', 'Trivial to write, read and debug', 'Transitions explode as behavior grows', 'Simple enemies, UI flow, animation states'],
            ['**[[behavior-tree|Behavior tree]]**', 'A tree of sequences, selectors, conditions and actions, re-evaluated each tick', 'Modular, reusable, designer-friendly', 'Needs tooling; reactive but not forward-looking', 'Most modern action and shooter NPCs'],
            ['**[[utility-ai|Utility AI]]**', 'Score every option from the situation and pick the best', 'Smooth, adaptive, handles many options', 'Scoring curves need tuning', 'Strategy games, life simulations'],
            ['**[[goap|GOAP planning]]**', 'Search for a chain of actions that reaches a goal', 'Emergent, flexible plans', 'Harder to debug and predict', 'Tactical NPCs (F.E.A.R.)'],
            ['**[[a-star|A* pathfinding]]**', 'Heuristic search for the cheapest route on a graph or grid', 'Optimal, fast, deterministic', 'Only answers "how do I get there"', 'Navigation in nearly every game'],
            ['**[[minimax|Minimax]] + [[alpha-beta|alpha-beta]]**', 'Look ahead through alternating moves, assuming the opponent plays well', 'Perfect play for small games, strong with a good evaluation', 'Exponential in depth; needs turn-based, perfect information', 'Chess, checkers, board games'],
            ['**[[mcts|Monte Carlo tree search]]**', 'Sample many playouts and favor promising moves', 'Needs no evaluation function; handles huge branching', 'Needs a fast simulator', 'Go, card games; the core of AlphaZero'],
          ],
          caption: 'The classic game AI toolbox. These are all *authored* or *searched*, not trained.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'From Deep Blue to learned agents',
          text: '**1992**: Gerald Tesauro’s TD-Gammon learns backgammon by self-play with temporal-difference learning, the first big RL success. **1997**: IBM’s **Deep Blue** beats world chess champion Garry Kasparov with minimax, alpha-beta pruning, custom hardware and a hand-built evaluation: classic search at its peak, no learning. **2016**: DeepMind’s **AlphaGo** beats Lee Sedol at Go by combining Monte Carlo tree search with neural networks trained on human games and self-play; **AlphaZero** (2017) dropped the human data and learned chess, shogi and Go from scratch. **2019**: **OpenAI Five** beats the Dota 2 world champions and DeepMind’s **AlphaStar** reaches Grandmaster in StarCraft II, both trained with large-scale policy-gradient RL and self-play. **2022**: Sony AI’s **Gran Turismo Sophy** beats top human racers. In parallel, hobbyist communities used the tools of the next lessons (RLGym and PPO) to train Rocket League bots that rival strong human players. The pattern: search where a model of the game is available, learning where behavior is too complicated to write by hand.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A designer wants a boss with three clearly telegraphed phases, whose timings and attack choices they need to tweak every day during playtesting. Which approach fits best?',
      options: [
        { text: 'A finite state machine or behavior tree whose states and transitions the designer can read and edit', correct: true, why: 'The behavior is simple, must be predictable and readable, and has to be tuned by hand. Authored AI gives full control; an RL policy would be a black box that has to be retrained for every tweak.' },
        { text: 'A PPO-trained policy, because learned AI is always better than scripted AI', why: 'Learned policies can surprise and impress, but they are hard to direct, hard to guarantee and expensive to retrain whenever the design changes. A boss with fixed phases does not need them.' },
        { text: 'Minimax search with alpha-beta pruning', why: 'Minimax suits alternating-turn, perfect-information board games, not a real-time boss with scripted phases.' },
        { text: 'A* pathfinding', why: 'A* answers where to walk, not which attack to use or when to change phase.' },
      ],
      explanation: 'Pick the simplest technique that meets the requirements. Designer control and predictability favor authored AI.',
    },
    {
      kind: 'concept',
      title: 'The classics in code: state machines and A*',
      blocks: [
        {
          type: 'p',
          text: 'A **finite state machine** keeps one current state and, on each update, checks whether a rule fires that moves it to another. The guard below patrols until the player comes within 10 units, chases, attacks when within 2, and flees whenever its health is low. Notice that "flee when hurt" is checked **first**: the order of the rules encodes priorities.',
        },
        {
          type: 'code',
          title: 'guard_fsm.py',
          runnable: true,
          code: `class Guard:
    def __init__(self):
        self.state = "patrol"

    def update(self, distance, health):
        if health < 25:
            self.state = "flee"
        elif self.state == "patrol" and distance < 10:
            self.state = "chase"
        elif self.state == "chase" and distance < 2:
            self.state = "attack"
        elif self.state == "chase" and distance > 15:
            self.state = "patrol"
        elif self.state == "attack" and distance > 3:
            self.state = "chase"
        elif self.state == "flee" and health >= 50:
            self.state = "patrol"
        return self.state


guard = Guard()
events = [(20, 100), (9, 100), (5, 100), (1, 100), (1, 20), (6, 20), (30, 60)]
for distance, health in events:
    print(f"distance {distance:>2}, health {health:>3} -> {guard.update(distance, health)}")`,
          output: `distance 20, health 100 -> patrol
distance  9, health 100 -> chase
distance  5, health 100 -> chase
distance  1, health 100 -> attack
distance  1, health  20 -> flee
distance  6, health  20 -> flee
distance 30, health  60 -> patrol`,
          annotations: [
            { lines: '1-3', text: 'The whole AI is one object holding its current **state**.' },
            { lines: 5, text: '`update` is called once per game tick with what the guard can sense: distance to the player and its own health.' },
            { lines: '6-7', text: 'Highest priority: below 25 health the guard flees regardless of anything else.' },
            { lines: '8-9', text: 'Patrol becomes chase when the player is within 10.' },
            { lines: '10-11', text: 'Chase becomes attack at close range (under 2).' },
            { lines: '12-13', text: 'The guard gives up the chase if the player gets more than 15 away.' },
            { lines: '14-15', text: 'Attack falls back to chase if the player steps away (over 3). Different thresholds for entering and leaving a state (here 2 and 3) are called **hysteresis**; they stop the guard from flickering between states at the boundary.' },
            { lines: '16-17', text: 'A fleeing guard only recovers (back to patrol) once it has regained 50 health, again a higher threshold than the one that triggered it.' },
            { lines: '21-24', text: 'Feeding in a sequence of situations shows the guard noticing, chasing, attacking, fleeing when wounded (still fleeing at health 20 although the player moved off) and finally calming down and resuming its patrol.' },
          ],
        },
        {
          type: 'p',
          text: 'Finding a route is the other universal game AI task. **Dijkstra’s algorithm** expands outwards from the start in circles of increasing cost, and finds the shortest path but wastes time exploring in all directions. **A\\*** adds a **heuristic** `h` estimating the remaining distance to the goal, and always expands the node with the lowest `f = g + h`, where `g` is the cost so far. If `h` never overestimates (an **admissible** heuristic such as Manhattan distance on a grid), A* still returns a shortest path but heads towards the goal instead of spreading out. Below, both run on the same grid, with `h = 0` giving Dijkstra.',
        },
        {
          type: 'code',
          title: 'astar_grid.py',
          runnable: true,
          code: `import heapq

GRID = [
    "S...............",
    "................",
    "......####......",
    "......#.........",
    "......#.....#...",
    "............#...",
    "............#..G",
]
ROWS, COLS = len(GRID), len(GRID[0])

def find(ch):
    for r, row in enumerate(GRID):
        if ch in row:
            return (r, row.index(ch))

def neighbours(p):
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        r, c = p[0] + dr, p[1] + dc
        if 0 <= r < ROWS and 0 <= c < COLS and GRID[r][c] != "#":
            yield (r, c)

def search(start, goal, use_heuristic):
    def h(p):
        return abs(p[0] - goal[0]) + abs(p[1] - goal[1]) if use_heuristic else 0
    frontier = [(h(start), 0, start)]
    best = {start: 0}
    expanded = 0
    while frontier:
        _, neg_g, node = heapq.heappop(frontier)
        g = -neg_g
        if g > best[node]:
            continue
        expanded += 1
        if node == goal:
            return g, expanded
        for nxt in neighbours(node):
            if g + 1 < best.get(nxt, 1e9):
                best[nxt] = g + 1
                heapq.heappush(frontier, (g + 1 + h(nxt), -(g + 1), nxt))
    return None, expanded

start, goal = find("S"), find("G")
for name, use_h in (("Dijkstra (no heuristic)", False), ("A* (Manhattan)", True)):
    length, expanded = search(start, goal, use_h)
    print(f"{name:<24} path length {length}, nodes expanded {expanded}")`,
          output: `Dijkstra (no heuristic)  path length 21, nodes expanded 103
A* (Manhattan)           path length 21, nodes expanded 22`,
          annotations: [
            { lines: '3-12', text: 'The map: `#` is a wall, `S` the start and `G` the goal on a 7×16 grid.' },
            { lines: '14-17', text: 'Find the coordinates of a character on the map.' },
            { lines: '19-23', text: 'The legal moves from a cell: up, down, left, right, staying on the map and out of walls (a generator, so neighbours are produced one at a time).' },
            { lines: '25-27', text: '`h` is the **heuristic**: Manhattan distance to the goal (or 0 for Dijkstra). It never overestimates on a grid with 4-direction moves, so it is admissible.' },
            { lines: '28-30', text: 'The **frontier** is a priority queue ordered by `f = g + h`. `best` remembers the cheapest known cost to each cell.' },
            { lines: '31-33', text: 'Pop the most promising node. (Among equal `f`, the deeper node, larger `g`, goes first, which makes A* run straight at the goal.)' },
            { lines: '34-36', text: 'Skip stale queue entries, then count the expansion.' },
            { lines: '37-38', text: 'Reaching the goal returns the cost and how many nodes were expanded.' },
            { lines: '39-42', text: 'Otherwise, for each neighbour reachable more cheaply than before, record the cost and push it with priority `g + 1 + h`.' },
            { lines: '45-48', text: 'Both algorithms find a path of 21 steps (identical quality). Dijkstra examined **103** cells, A* only **22**, essentially just the cells on the path. On big game maps with thousands of cells the heuristic saves most of the work, which is why A* is in nearly every game.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why a heuristic speeds things up without losing the answer',
          text: 'Dijkstra treats every direction equally, so it must explore a growing disc of cells before it happens to reach the goal. The heuristic adds *information about where the goal is*: nodes that point towards it get a lower `f` and are expanded first. Because an admissible heuristic never overestimates, any node it postpones really does lie on a path at least as long as the one it will eventually find, so nothing optimal is ever skipped. Information is traded for work, never for correctness. The same principle (use knowledge to avoid pointless work) reappears in alpha-beta pruning below.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Practical pathfinding',
          text: 'Real games rarely path-find on raw tiles. They bake a **navigation mesh** (navmesh) of walkable polygons and run A* over that graph, then smooth the result and add **steering behaviors** (seek, flee, avoid) for local movement around other characters. Unity, Unreal and Godot all ship navmesh systems, so you will usually *call* A* rather than write it, but knowing what it does tells you why a character gets stuck or takes an odd detour.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A* with an admissible heuristic (one that never overestimates the remaining cost) still finds a shortest path, usually while expanding far fewer nodes than Dijkstra’s algorithm.',
      answer: true,
      explanation: 'True. Admissibility is exactly the guarantee of optimality: the heuristic can steer the search towards the goal, but because it never overestimates, A* can never discard the true shortest path. An *inadmissible* heuristic (for example 2× Manhattan distance) searches even faster but may return a longer path.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the A* priority of a node: the cost so far plus the heuristic estimate to the goal.',
      template: `priority = ___ + heuristic(node)`,
      templateIsCode: true,
      blanks: [{ answers: ['g', 'cost_so_far', 'cost', 'g_cost', 'dist'] }],
      wordBank: ['g', 'h', 'heuristic', 'goal', 'best'],
      explanation: 'A* orders the frontier by `f = g + h`: `g` is the known cost from the start to this node and `h` the estimated cost from the node to the goal. With `h = 0` it degrades to Dijkstra, and with `g = 0` to greedy best-first search.',
    },
    {
      kind: 'concept',
      title: 'Search for adversarial games: minimax and alpha-beta',
      blocks: [
        {
          type: 'p',
          text: 'In a two-player, turn-based game with perfect information (chess, checkers, tic-tac-toe), you can **look ahead**. **Minimax** explores the tree of moves: at your turns you pick the child with the **highest** value, at the opponent’s turns you assume they pick the **lowest**. The leaves are scored (win +1, loss −1, draw 0; real engines use a hand-built evaluation function when they cannot reach the end of the game). The result is the value of the position under best play by both sides. The cost is brutal: with `b` moves per turn and a depth of `d` turns there are about `b^d` positions. **Alpha-beta pruning** keeps two bounds, `alpha` (the best value the maximizer can already guarantee) and `beta` (the best the minimizer can guarantee), and stops exploring a branch the moment it provably cannot change the decision. It returns **exactly** the same value, usually after visiting far fewer positions. The program below solves a tic-tac-toe position both ways and counts positions.',
        },
        {
          type: 'code',
          title: 'minimax_alphabeta.py',
          runnable: true,
          code: `LINES = [(0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8), (0, 4, 8), (2, 4, 6)]

def winner(board):
    for a, b, c in LINES:
        if board[a] != " " and board[a] == board[b] == board[c]:
            return board[a]
    return None

class Counter:
    nodes = 0

def minimax(board, player, alpha=None, beta=None):
    """Value for X: +1 X wins, -1 O wins, 0 draw. Alpha-beta pruning if alpha is given."""
    Counter.nodes += 1
    w = winner(board)
    if w:
        return 1 if w == "X" else -1
    moves = [i for i, ch in enumerate(board) if ch == " "]
    if not moves:
        return 0
    best = -2 if player == "X" else 2
    for m in moves:
        child = board[:m] + player + board[m + 1:]
        value = minimax(child, "O" if player == "X" else "X", alpha, beta)
        if player == "X":
            best = max(best, value)
            if alpha is not None:
                alpha = max(alpha, best)
        else:
            best = min(best, value)
            if beta is not None:
                beta = min(beta, best)
        if alpha is not None and beta is not None and alpha >= beta:
            break
    return best

position = "XO X     "
for name, args in (("minimax", ()), ("alpha-beta", (-2, 2))):
    Counter.nodes = 0
    value = minimax(position, "O", *args)
    print(f"{name:<11} value {value:>2}, positions searched {Counter.nodes}")`,
          output: `minimax     value  1, positions searched 1019
alpha-beta  value  1, positions searched 285`,
          annotations: [
            { lines: 1, text: 'The eight winning lines of the 3×3 board, as index triples into a 9-character string.' },
            { lines: '3-7', text: '`winner` returns "X" or "O" if a line is complete, otherwise `None`.' },
            { lines: '9-10', text: 'A counter for how many positions get examined.' },
            { lines: '12-14', text: 'One function does both algorithms: `alpha` and `beta` are optional, and when they are `None` no pruning happens. The value is always from X’s point of view.' },
            { lines: '15-20', text: 'Base cases: a finished game (win or loss) or a full board (draw).' },
            { lines: 21, text: 'Start `best` at the worst possible value for the player to move.' },
            { lines: '22-24', text: 'Try every legal move, build the child position and **recurse** with the roles swapped.' },
            { lines: '25-32', text: 'X **maximizes**, O **minimizes**. The running best updates `alpha` (for X) or `beta` (for O).' },
            { lines: '33-34', text: '**The pruning rule**: if `alpha >= beta`, the opponent already has a better option elsewhere, so this branch can never be reached by good play and the remaining moves are skipped.' },
            { lines: '37-41', text: 'The position has O to move after X, O, X were placed. Both searches agree that the value is +1 (X wins with best play), but alpha-beta reaches the same answer after **285** positions instead of **1019**, a 3.6× saving on this tiny game, and the saving grows exponentially with depth.' },
          ],
        },
        {
          type: 'p',
          text: 'Chess engines add many refinements: an evaluation function (material, piece activity, king safety), **move ordering** (try captures and the previously best move first, so that pruning happens early), iterative deepening, transposition tables that cache positions already seen, and opening books. With **perfect move ordering**, alpha-beta examines only about `b^(d/2)` positions, effectively doubling the depth it can search in the same time. **Monte Carlo tree search** takes a different path for games like Go where `b` is about 250 and no good evaluation function exists: it estimates a move’s value by playing many random games from it, spending more effort on moves that look promising. **AlphaZero** replaces the random playouts by a neural network that suggests moves and judges positions, and trains that network on the games its own search produces: classical search guided by learning.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this small state machine trace.',
      code: `state = "patrol"
states = []
for distance in [20, 8, 1, 5]:
    if state == "patrol" and distance < 10:
        state = "chase"
    elif state == "chase" and distance < 2:
        state = "attack"
    elif state == "attack" and distance > 3:
        state = "chase"
    states.append(state)
print(*states)`,
      answer: 'patrol chase attack chase',
      hint: 'Only one `elif` branch can fire per update: trace the state after each distance.',
      explanation: 'Distance 20: the patrol rule needs under 10, so the state stays patrol. Distance 8: patrol → chase. Distance 1: chase and under 2 → attack. Distance 5: attack and over 3 → chase. (Because it is an `if/elif` chain, a state changes at most once per update.)',
    },
    {
      kind: 'error',
      prompt: 'This alpha-beta loop never explores more than the first move of each node, so it returns wrong values. Tap the faulty line.',
      lines: [
        'best = max(best, value)',
        'alpha = max(alpha, best)',
        'if alpha <= beta:',
        '    break',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The cut-off condition is reversed. A branch is pruned when `alpha >= beta` (the maximizer already has something at least as good as what the minimizer will allow). With `alpha <= beta`, the usual case where the window is still open triggers `break` immediately, so almost nothing is searched.',
    },
    {
      kind: 'numeric',
      prompt: 'A game has about 10 legal moves per turn and you search 6 plies (half-moves) deep. With **perfect** move ordering, alpha-beta examines about `b^(d/2)` leaf positions. About how many leaves is that (plain minimax would need 10^6)?',
      answer: '1000',
      hint: 'Compute 10 raised to the power 6 / 2 = 3.',
      explanation: 'b^(d/2) = 10^3 = **1000** leaves, versus 10^6 = 1 000 000 for plain minimax: a thousand times less work. That is why good move ordering matters so much, and why alpha-beta lets a chess engine search roughly twice as deep as plain minimax in the same time. Real-world savings fall between the best case and the worst case.',
      label: 'Leaves:',
    },
    {
      kind: 'concept',
      title: 'When is machine learning the right tool?',
      blocks: [
        {
          type: 'p',
          text: 'Machine learning is exciting, but each of the classic techniques exists because it is **cheap, predictable and controllable**. Learned agents earn their place when the behavior is too complex or too subtle to script, when a good simulator is available to train in, and when surprises are acceptable.',
        },
        {
          type: 'table',
          headers: ['Situation', 'Classic approach', 'Learned approach', 'Verdict'],
          rows: [
            ['Predictable enemies that designers must tune', 'FSM or behavior tree', 'RL policy', '**Classic**: control and readability'],
            ['Route finding around obstacles', 'A* on a navmesh', 'RL navigation', '**Classic**: solved, fast, optimal'],
            ['Small perfect-information board game', 'Minimax + alpha-beta', 'AlphaZero-style self-play', 'Classic search; learning if the game is large'],
            ['Fast, continuous, mechanical skill (driving a car, aerial control in Rocket League)', 'Hand-tuned controllers, which are brittle', 'RL with PPO', '**Learned**: too subtle to script'],
            ['Huge strategy game with hidden information', 'Layers of scripts and cheats', 'Large-scale self-play (OpenAI Five, AlphaStar)', 'Learned, with huge compute'],
            ['Imitating the style of human players', 'Hand-crafted rules', 'Imitation learning on recorded games', '**Learned**: data captures style'],
            ['Automated playtesting and balance checking', 'Scripted bots', 'RL agents that explore the game', 'Learned, often as a dev tool'],
          ],
          caption: 'A rough guide. When both could work, choose the classic one first.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Can you write it down?', text: 'If a designer can describe the behavior in a flowchart, write the flowchart. It will run in microseconds and never surprise you.' },
            { title: 'Is there a fast simulator?', text: 'RL needs millions of attempts. If the game cannot run faster than real time, or crashes when reset 10 000 times, learning is not yet an option.' },
            { title: 'Can you score success?', text: 'You must be able to write a reward (win, score, distance) or provide expert examples. If you cannot say what "good" means, no algorithm can learn it.' },
            { title: 'Can you live with the downsides?', text: 'Learned behavior is harder to debug, to tune and to guarantee, needs retraining when the game changes, and costs inference time every frame (usually milliseconds on a CPU).' },
            { title: 'Consider a hybrid', text: 'The strongest designs mix both: a behavior tree whose "choose a tactic" node is a learned policy, classic navigation with learned combat, or search guided by a network (AlphaZero). Use learning for the part that is hard to write, authored logic for the rest.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises implement the core of each classic technique so you can test them: a behavior-tree evaluator, shortest-path length on a grid, and alpha-beta search on an explicit game tree.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `tick(node, blackboard)` to evaluate a tiny behavior tree and return `True` (success) or `False` (failure). A node is a tuple `(kind, payload)`. For `("leaf", fn)` return `bool(fn(blackboard))`. For `("sequence", children)` run the children **in order**, stop and fail at the first child that fails, and succeed if all succeed (an empty sequence succeeds). For `("selector", children)` run the children in order, stop and succeed at the first success, and fail if all fail (an empty selector fails). Children are nodes, so trees can be nested.',
      starter: `def tick(node, blackboard):
    ...
`,
      solution: `def tick(node, blackboard):
    kind, payload = node
    if kind == "leaf":
        return bool(payload(blackboard))
    if kind == "sequence":
        for child in payload:
            if not tick(child, blackboard):
                return False
        return True
    for child in payload:
        if tick(child, blackboard):
            return True
    return False
`,
      tests: `log = []

def leaf(name, result):
    def run(bb):
        log.append(name)
        return result
    return ("leaf", run)

assert tick(("sequence", [leaf("a", True), leaf("b", False), leaf("c", True)]), {}) is False
assert log == ["a", "b"]
log.clear()
assert tick(("selector", [leaf("a", False), leaf("b", True), leaf("c", True)]), {}) is True
assert log == ["a", "b"]
log.clear()
assert tick(("sequence", [leaf("a", True), leaf("b", True)]), {}) is True and log == ["a", "b"]
log.clear()
assert tick(("selector", [leaf("a", False), leaf("b", False)]), {}) is False and log == ["a", "b"]
assert tick(("sequence", []), {}) is True
assert tick(("selector", []), {}) is False
assert tick(("leaf", lambda bb: 1), {}) is True

def do(name):
    def run(bb):
        bb["did"] = name
        return True
    return ("leaf", run)

low_hp = ("leaf", lambda bb: bb["health"] < 25)
near = ("leaf", lambda bb: bb["distance"] < 10)
tree = ("selector", [
    ("sequence", [low_hp, do("flee")]),
    ("sequence", [near, do("attack")]),
    do("patrol"),
])
bb = {"distance": 5, "health": 100}
assert tick(tree, bb) is True and bb["did"] == "attack"
bb = {"distance": 50, "health": 100}
tick(tree, bb)
assert bb["did"] == "patrol"
bb = {"distance": 5, "health": 10}
tick(tree, bb)
assert bb["did"] == "flee"`,
      checks: ['A sequence stops at the first failure and succeeds only if every child succeeds (empty sequence: success)', 'A selector stops at the first success and fails only if every child fails (empty selector: fail)', 'Nested trees work, children after the deciding one are never run, and the result is a real `True`/`False`'],
      hint: 'Unpack `kind, payload = node`. For a sequence loop over the children and `return False` as soon as one `tick` is false, otherwise `return True` after the loop. A selector mirrors it: return `True` as soon as one succeeds, otherwise `False`.',
      explanation: 'That is a working behavior tree in a dozen lines. The two composite nodes encode "do all of these" (sequence) and "try these in order until one works" (selector); the guard tree in the test reads like a priority list: flee if hurt, else attack if the enemy is near, else patrol. Real behavior trees add a third result, "running", for actions that take several ticks, plus decorators such as repeat and cooldown.',
    },
    {
      kind: 'code',
      prompt: 'Write `shortest_path_length(grid, start, goal)`. `grid` is a list of equal-length strings in which `#` is a wall and anything else is walkable; `start` and `goal` are `(row, column)` tuples. Return the minimum number of steps using up/down/left/right moves, or `None` if the goal cannot be reached (or is a wall). A start equal to the goal gives 0. Any shortest-path algorithm is fine (breadth-first search, Dijkstra or A*).',
      starter: `def shortest_path_length(grid, start, goal):
    ...
`,
      solution: `from collections import deque

def shortest_path_length(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    if grid[goal[0]][goal[1]] == "#":
        return None
    seen = {start}
    queue = deque([(start, 0)])
    while queue:
        (r, c), dist = queue.popleft()
        if (r, c) == goal:
            return dist
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "#" and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append(((nr, nc), dist + 1))
    return None
`,
      tests: `from collections import deque
import random

assert shortest_path_length(["....", "....", "...."], (0, 0), (2, 3)) == 5
assert shortest_path_length(["...", ".#.", "..."], (0, 0), (2, 2)) == 4
assert shortest_path_length(["..#..", "..#..", "....."], (0, 0), (0, 4)) == 8
assert shortest_path_length(["..#", "..#", "..#"], (0, 0), (0, 2)) is None
assert shortest_path_length(["...", "..#"], (0, 0), (1, 2)) is None
assert shortest_path_length(["...", "..."], (1, 1), (1, 1)) == 0
assert shortest_path_length(["S.G"], (0, 0), (0, 2)) == 2

big = ["." * 40 for _ in range(40)]
assert shortest_path_length(big, (0, 0), (39, 39)) == 78

def reference(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    dist = {start: 0}
    queue = deque([start])
    while queue:
        r, c = queue.popleft()
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            n = (r + dr, c + dc)
            if 0 <= n[0] < rows and 0 <= n[1] < cols and grid[n[0]][n[1]] != "#" and n not in dist:
                dist[n] = dist[(r, c)] + 1
                queue.append(n)
    return dist.get(goal)

rng = random.Random(5)
for _ in range(25):
    grid = ["".join("#" if rng.random() < 0.3 else "." for _ in range(8)) for _ in range(6)]
    grid[0] = "." + grid[0][1:]
    grid[5] = grid[5][:7] + "."
    assert shortest_path_length(grid, (0, 0), (5, 7)) == reference(grid, (0, 0), (5, 7))`,
      checks: ['Returns the minimum number of 4-direction steps, treating `#` as a wall', 'Returns 0 when `start == goal` and `None` when the goal is unreachable or a wall', 'Agrees with a reference breadth-first search on random mazes'],
      hint: 'Breadth-first search with a `deque` of `(position, distance)` pairs and a `seen` set: pop from the left, return the distance when you reach the goal, and push each unseen walkable neighbour with `dist + 1`.',
      explanation: 'On a grid where every step costs 1, plain breadth-first search is already optimal, and A* with a Manhattan heuristic only adds speed. A* becomes worthwhile when the map is big or the costs vary (mud, roads, danger zones), where you replace the queue by a priority queue ordered by `g + h`.',
    },
    {
      kind: 'code',
      prompt: 'Write `alphabeta(node, maximizing, alpha=float("-inf"), beta=float("inf"))` for an explicit game tree. A node is either a number (a leaf, with that value) or a list of child nodes. Return a tuple `(value, leaves_visited)`: the minimax value of the node and how many leaves were actually examined. Try children left to right, update `alpha` (maximizing) or `beta` (minimizing) as you go, and stop looking at the remaining children as soon as `alpha >= beta`.',
      starter: `def alphabeta(node, maximizing, alpha=float("-inf"), beta=float("inf")):
    ...
`,
      solution: `def alphabeta(node, maximizing, alpha=float("-inf"), beta=float("inf")):
    if not isinstance(node, list):
        return node, 1
    visited = 0
    best = float("-inf") if maximizing else float("inf")
    for child in node:
        value, seen = alphabeta(child, not maximizing, alpha, beta)
        visited += seen
        if maximizing:
            best = max(best, value)
            alpha = max(alpha, best)
        else:
            best = min(best, value)
            beta = min(beta, best)
        if alpha >= beta:
            break
    return best, visited
`,
      tests: `import random

assert alphabeta(7, True) == (7, 1)
assert alphabeta([[3, 5], [2, 9], [0, 1]], True) == (3, 4)

def plain(node, maximizing):
    if not isinstance(node, list):
        return node
    values = [plain(c, not maximizing) for c in node]
    return max(values) if maximizing else min(values)

def leaves(node):
    return 1 if not isinstance(node, list) else sum(leaves(c) for c in node)

def build(rng, depth):
    if depth == 0:
        return rng.randint(-9, 9)
    return [build(rng, depth - 1) for _ in range(3)]

rng = random.Random(0)
saved = 0
for i in range(30):
    tree = build(rng, 4)
    for maximizing in (True, False):
        value, seen = alphabeta(tree, maximizing)
        assert value == plain(tree, maximizing)
        assert 1 <= seen <= leaves(tree)
        saved += leaves(tree) - seen
assert saved > 0

tree = [[3, 5], [2, 9], [0, 1]]
copy = [list(x) for x in tree]
alphabeta(tree, True)
assert tree == copy`,
      checks: ['Returns the same value as plain minimax (checked on random trees, for both root players)', 'Prunes: the textbook tree `[[3, 5], [2, 9], [0, 1]]` examines only 4 of its 6 leaves', 'Stops looking at remaining children when `alpha >= beta` and does not modify the tree'],
      hint: 'A non-list node is a leaf: return `(node, 1)`. Otherwise loop over the children recursively with `not maximizing`, add up the visited leaves, update `best` and `alpha` (or `beta`), and `break` when `alpha >= beta`.',
      explanation: 'The checks are the whole point of alpha-beta: **same answer, fewer leaves**. On the textbook tree the second and third minimizing nodes are cut off after their first leaf (2 and 0), because the maximizer already has a guaranteed 3 and these nodes can only offer less. The deeper the tree, and the better the move ordering, the larger the saving.',
    },
  ],
  takeaways: [
    'Most game AI is **authored**, not learned: **finite state machines** (simple, readable), **behavior trees** (modular sequences and selectors), **utility AI** (score every option) and **GOAP** (plan a chain of actions). Rule order encodes priority; different enter/leave thresholds (hysteresis) stop flicker.',
    '**A\\*** finds shortest paths by expanding the node with the lowest `f = g + h`. An **admissible** heuristic (never overestimates, e.g. Manhattan distance) keeps it optimal while expanding far fewer nodes than Dijkstra (22 vs 103 cells in our demo). Real games run A* on navmeshes.',
    '**Minimax** looks ahead through alternating turns (maximize on your move, minimize on the opponent’s); **alpha-beta pruning** returns the *same* value while skipping provably irrelevant branches (285 vs 1019 positions here, about `b^(d/2)` with perfect move ordering). **MCTS** estimates values from random playouts and, with neural networks, became AlphaGo and AlphaZero.',
    'Use machine learning when the behavior is too subtle to script (fast mechanical skill), you have a fast simulator and a way to score success, or you have expert data to imitate; prefer classic AI when designers need control and predictability. **Hybrids** (a learned policy inside a behavior tree, classic navigation with learned combat, search guided by a network) are often best.',
    'Milestones: Deep Blue (search), TD-Gammon and AlphaZero (self-play learning), OpenAI Five and AlphaStar (large-scale RL). The next lessons build the machinery to apply RL to your own game: environments, reward design, RLGym and PPO training, self-play, imitation and deployment.',
  ],
  reading: [
    { title: 'Russell and Norvig: Artificial Intelligence: A Modern Approach (search and games chapters)', url: 'https://aima.cs.berkeley.edu/', source: 'book', note: 'A* and its heuristics, minimax, alpha-beta pruning and Monte Carlo tree search.' },
    { title: 'Amit Patel: Introduction to the A* Algorithm (Red Blob Games)', url: 'https://www.redblobgames.com/pathfinding/a-star/introduction.html', source: 'tutorial', note: 'Interactive visual explanations of breadth-first search, Dijkstra and A*.' },
    { title: 'Game Programming Patterns: State', url: 'https://gameprogrammingpatterns.com/state.html', source: 'book', note: 'Robert Nystrom on state machines in games, free online.' },
    { title: 'Silver et al.: Mastering the game of Go with deep neural networks and tree search (Nature, 2016)', url: 'https://www.nature.com/articles/nature16961', source: 'paper', note: 'AlphaGo: MCTS guided by neural networks.' },
    { title: 'Wikipedia: Behavior tree (artificial intelligence, robotics and control)', url: 'https://en.wikipedia.org/wiki/Behavior_tree_(artificial_intelligence,_robotics_and_control)', source: 'wikipedia', note: 'Node types and their use in games and robotics.' },
    { title: 'Berner et al.: Dota 2 with Large Scale Deep Reinforcement Learning (OpenAI Five, 2019)', url: 'https://arxiv.org/abs/1912.06680', source: 'paper', note: 'PPO and self-play at the scale of a professional game.' },
  ],
};
