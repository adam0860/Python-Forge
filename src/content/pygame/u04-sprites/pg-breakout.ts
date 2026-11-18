import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-breakout',
  title: 'Mini-Game: Breakout',
  summary: 'Your first complete game: paddle, ball, bricks, score, lives, win and lose. Built from small tested rules (wall bounce, paddle angle, brick bounce) around a short game loop.',
  minutes: 48,
  objectives: [
    'Plan a small game as entities, rules and states before writing code',
    'Make a ball bounce off walls, a paddle (with a steering angle) and bricks (choosing the axis from the overlap)',
    'Keep score, lives and win/lose in a small state object, separate from drawing',
    'Remove destroyed objects from a list safely',
    'Assemble the pieces into a playable game with restart',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Plan before you code',
      blocks: [
        {
          type: 'p',
          text: 'This is the first lesson where all the earlier pieces come together: the loop, input, rectangles, vectors, `dt`, collisions and text. Breakout is the right size for it: small rules, instant feedback, and a result you can play. Before any code, write down what the game **is**:',
        },
        {
          type: 'table',
          headers: ['Piece', 'Details'],
          rows: [
            ['**Entities**', 'A paddle (moves left and right), a ball (moves, bounces), a wall of bricks (disappear when hit)'],
            ['**Rules**', 'The ball bounces off the walls, ceiling, paddle and bricks. Each brick is worth points. Missing the ball costs a life. No bricks left: you win. No lives left: you lose.'],
            ['**Input**', 'Left and right arrows to steer; space to launch the ball and to restart'],
            ['**States**', 'Ball resting on the paddle, ball in play, won, lost'],
            ['**The twist that makes it fun**', 'Where the ball hits the paddle decides where it goes next: the player aims'],
          ],
          caption: 'A design on one screen of text. If you cannot write it, you cannot yet program it.',
        },
        {
          type: 'p',
          text: 'Then split the code the same way. The **rules** (where does the ball go after it hits the paddle?) are plain calculations on numbers, rectangles and vectors, so they go in small functions that a test can check. The **machinery** (the window, the loop, drawing) is a thin shell that calls them. That is how a game stays understandable at 150 lines, and fixable at 1500.',
        },
        {
          type: 'code',
          title: 'breakout.py',
          desktopOnly: true,
          code: `import pygame

WIDTH, HEIGHT = 640, 480
pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Breakout")
clock = pygame.time.Clock()
font = pygame.font.Font(None, 32)

ROW_COLORS = [(220, 70, 70), (240, 150, 60), (240, 210, 70), (90, 190, 100), (70, 140, 220)]
RADIUS = 8


def make_bricks(rows, cols, size, gap, origin):
    bricks = []
    for r in range(rows):
        for c in range(cols):
            x = origin[0] + c * (size[0] + gap)
            y = origin[1] + r * (size[1] + gap)
            bricks.append(pygame.Rect(x, y, size[0], size[1]))
    return bricks


def paddle_bounce(ball_x, paddle, speed):
    offset = (ball_x - paddle.centerx) / (paddle.width / 2)
    offset = max(-1.0, min(1.0, offset))
    return pygame.Vector2(0, -speed).rotate(offset * 60)


class Game:
    def __init__(self):
        self.paddle = pygame.Rect(0, 0, 90, 14)
        self.paddle.midbottom = (WIDTH // 2, HEIGHT - 30)
        self.px = float(self.paddle.centerx)
        self.bricks = make_bricks(5, 10, (56, 20), 4, (10, 60))
        self.lives = 3
        self.score = 0
        self.reset_ball()

    @property
    def over(self):
        return self.lives == 0 or not self.bricks

    def reset_ball(self):
        self.ball = pygame.Vector2(self.paddle.centerx, self.paddle.top - RADIUS)
        self.vel = pygame.Vector2(0, 0)
        self.launched = False

    def launch(self):
        if not self.launched:
            self.vel = pygame.Vector2(180, -300)
            self.launched = True

    def update(self, dt, move):
        self.px = max(45, min(WIDTH - 45, self.px + move * 420 * dt))
        self.paddle.centerx = round(self.px)
        if not self.launched:
            self.ball.update(self.paddle.centerx, self.paddle.top - RADIUS)
            return
        self.ball += self.vel * dt
        if self.ball.x < RADIUS or self.ball.x > WIDTH - RADIUS:
            self.vel.x = -self.vel.x
            self.ball.x = max(RADIUS, min(WIDTH - RADIUS, self.ball.x))
        if self.ball.y < RADIUS:
            self.vel.y = abs(self.vel.y)
            self.ball.y = RADIUS
        ball_rect = pygame.Rect(0, 0, 2 * RADIUS, 2 * RADIUS)
        ball_rect.center = self.ball
        if self.vel.y > 0 and ball_rect.colliderect(self.paddle):
            self.vel = paddle_bounce(self.ball.x, self.paddle, self.vel.length() * 1.02)
            self.ball.y = self.paddle.top - RADIUS
        hit = ball_rect.collidelist(self.bricks)
        if hit != -1:
            brick = self.bricks.pop(hit)
            self.score += 10
            overlap_x = min(ball_rect.right, brick.right) - max(ball_rect.left, brick.left)
            overlap_y = min(ball_rect.bottom, brick.bottom) - max(ball_rect.top, brick.top)
            if overlap_x < overlap_y:
                self.vel.x = -self.vel.x
            else:
                self.vel.y = -self.vel.y
        if self.ball.y > HEIGHT + RADIUS:
            self.lives -= 1
            self.reset_ball()


game = Game()
running = True
while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
            if game.over:
                game = Game()
            else:
                game.launch()

    keys = pygame.key.get_pressed()
    if not game.over:
        game.update(dt, keys[pygame.K_RIGHT] - keys[pygame.K_LEFT])

    screen.fill((20, 24, 48))
    for brick in game.bricks:
        pygame.draw.rect(screen, ROW_COLORS[(brick.y - 60) // 24], brick)
    pygame.draw.rect(screen, (230, 230, 240), game.paddle, border_radius=6)
    pygame.draw.circle(screen, (250, 250, 250), game.ball, RADIUS)
    hud = font.render(f"Score {game.score}   Lives {game.lives}", True, (230, 230, 240))
    screen.blit(hud, (10, 10))
    if game.over:
        verdict = "You win!" if not game.bricks else "Game over"
        text = font.render(verdict + "  -  SPACE to play again", True, (250, 200, 40))
        screen.blit(text, text.get_rect(center=(WIDTH // 2, HEIGHT // 2)))
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '14-21', text: 'Building the wall of bricks: one `Rect` per brick, laid out in rows and columns with a gap. Rectangles are all a brick needs: no sprite class is required.' },
            { lines: '24-27', text: 'The paddle’s steering rule. How far from the paddle centre the ball hit (-1 at the left edge, +1 at the right) becomes an angle of up to 60 degrees: `Vector2(0, -speed).rotate(...)` turns "straight up" into a slanted launch.' },
            { lines: '30-38', text: 'The game state lives in one object: paddle, bricks, lives and score. The exact paddle position is a float (`px`), as in the rect lesson, copied to the rect for drawing and collisions.' },
            { lines: '40-42', text: 'A property computes the "game over" condition from the state, instead of storing a flag that could get out of date.' },
            { lines: '57-59', text: 'While the ball rests on the paddle (before launch), it simply follows the paddle and nothing else happens.' },
            { lines: '60-66', text: 'Moving the ball, then walls: left and right reverse x, the ceiling forces y downward. The ball is **put back inside** each time, so that it cannot stick in a wall.' },
            { lines: '69-71', text: 'The paddle bounce happens only when the ball is moving **down**, so a ball that is still overlapping after bouncing cannot bounce twice.' },
            { lines: '72-81', text: 'A brick hit: remove it, score, and reverse the velocity on the axis with the **smaller overlap**, which is the side the ball came in through.' },
            { lines: '82-84', text: 'Falling below the bottom costs a life and puts the ball back on the paddle.' },
            { lines: '90-98', text: 'The loop’s event handling. Space launches the ball, or restarts the game by simply making a new `Game()` when it is over.' },
            { lines: '100-102', text: 'Update only while the game is not over, with the steering amount from the arrow keys (-1, 0 or +1).' },
            { lines: '104-115', text: 'Drawing reads the state and changes nothing: bricks coloured by row, the paddle, the ball, the text and the final message.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why one `Game` object?',
          text: 'Everything that can change lives in one place, so restarting is `game = Game()`: nothing is left over from the last round. The loop only reads input and calls `update` and the drawing. If the game later grows menus and levels, they replace or wrap this one object, rather than touching a heap of global variables.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'After a bounce off the left wall, the code also sets `ball.x = RADIUS` (inside the wall). Why?',
      options: [
        { text: 'Without it a fast ball can still be inside the wall on the next frame, and would reverse its direction again and get stuck', correct: true, why: 'The ball can move several pixels past the wall in one frame. Reversing the velocity without moving the ball back leaves it outside, and the check triggers again next frame: the ball vibrates in the wall.' },
        { text: 'To make the bounce look more realistic', why: 'It has no visible effect except preventing the bug.' },
        { text: 'Because `Rect` needs integer positions', why: 'The ball position is a float vector; this line is about the bounce, not the rect.' },
        { text: 'To keep the ball from leaving the screen at the bottom', why: 'The bottom is handled separately: falling out is meant to lose a life.' },
      ],
      explanation: 'Whenever a bounce reverses a velocity, also resolve the **position**: put the object back on the legal side. The same rule applied to the rect-collision lesson’s walls.',
    },
    {
      kind: 'truefalse',
      prompt: 'If the paddle just reversed the ball’s vertical speed (`vy = -vy`), the player would still be able to aim the ball by where it lands on the paddle.',
      answer: false,
      explanation: 'False. A plain reversal sends the ball out at the same angle it arrived at, whichever part of the paddle it hit, so the player could not steer at all and the game would become a matter of luck. Making the outgoing angle depend on the **offset from the paddle’s centre** is what gives the player control, and it takes only the three lines of `paddle_bounce`.',
    },
    {
      kind: 'concept',
      title: 'The three rules in detail',
      blocks: [
        {
          type: 'table',
          headers: ['Rule', 'Idea', 'Code'],
          rows: [
            ['**Walls**', 'Reverse the velocity component pointing into the wall, and put the ball back inside', '`vel.x = -vel.x`; `ball.x = clamp(ball.x)`'],
            ['**Paddle**', 'Outgoing direction from the hit offset: centre goes straight up, edges go about 60 degrees to the side', '`offset = (ball.x - paddle.centerx) / (paddle.width / 2)`; `Vector2(0, -speed).rotate(offset * 60)`'],
            ['**Bricks**', 'Flip the component along the axis where the ball and brick overlap **least**', '`overlap_x < overlap_y` means the ball arrived from the side'],
          ],
          caption: 'Each is a tiny function of numbers and rectangles: ideal to test.',
        },
        {
          type: 'p',
          text: 'The brick rule needs a word of explanation. When the ball first overlaps a brick, it has gone **a little way into one face**. Coming from below, the overlap is a flat sliver: wide (as wide as the ball) and shallow (only a few pixels tall), so the vertical overlap is the smaller one, and the vertical velocity must flip. Coming from the side, the sliver is tall and thin, so the horizontal overlap is the smaller one. Taking the **smaller** overlap picks the face that was crossed, the same idea as moving one axis at a time in the collision lesson.',
        },
        {
          type: 'p',
          text: 'Two details matter for how it feels. The speed should rise a little with each paddle hit (the code multiplies by 1.02), or the game never gets harder. And the angle limit of 60 degrees keeps the ball from going nearly horizontal, which would make it bounce between the walls for ages without coming down.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Removing from a list safely',
          text: 'The code finds one brick with `collidelist` and removes it with `pop(index)`, which is safe because the loop is not iterating over the list at that moment. Removing items **while looping over the same list** skips elements. Loop over a copy (`for b in bricks[:]`) or, better, build a new list of survivors.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the brick collision step.',
      template: `hit = ball_rect.___(bricks)
if hit != -1:
    brick = bricks.___(hit)
    score += 10`,
      templateIsCode: true,
      blanks: [{ answers: ['collidelist'] }, { answers: ['pop'] }],
      wordBank: ['collidelist', 'pop', 'colliderect', 'remove', 'kill'],
      explanation: '`collidelist` returns the **index** of the first brick that overlaps (or -1), and `pop(index)` removes and returns that item.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. The ball spans x 95 to 115 and y 38 to 58; the brick spans x 100 to 156 and y 20 to 40. The code measures the overlap on each axis and says which way the ball must bounce.',
      code: `ball_left, ball_right, ball_top, ball_bottom = 95, 115, 38, 58
brick_left, brick_right, brick_top, brick_bottom = 100, 156, 20, 40
ox = min(ball_right, brick_right) - max(ball_left, brick_left)
oy = min(ball_bottom, brick_bottom) - max(ball_top, brick_top)
print("horizontal" if ox < oy else "vertical")`,
      answer: 'vertical',
      hint: 'ox is 115 - 100 = 15. What is oy?',
      explanation: 'The horizontal overlap is 15 pixels and the vertical one only 2, so the ball has barely touched the brick’s bottom face: the **vertical** velocity must flip. (The ball is below the brick moving up, and bounces back down.)',
    },
    {
      kind: 'concept',
      title: 'Tuning, states and what to add next',
      blocks: [
        {
          type: 'p',
          text: 'A game that works is not yet a game that feels good. These numbers are all in the code, and changing them is the quickest way to learn: ball speed (300), the paddle speed (420), the paddle width (90), the angle limit (60), the speed-up (1.02), the lives (3). Make the paddle narrower for difficulty, or the ball faster, and note how the whole game changes. This is **tuning**, and the habit of keeping such numbers as named constants makes it easy.',
        },
        {
          type: 'table',
          headers: ['Next step', 'How', 'Where it leads'],
          rows: [
            ['Sounds on hits', '`Sound.play()` on brick, paddle and wall bounces', 'The sound lesson: the game feels twice as good'],
            ['Power-ups', 'A brick sometimes drops a falling item; catch it with the paddle', 'Sprites, spawning, collisions'],
            ['Levels', 'A list of brick layouts as text rows, loaded by a function', 'Tile maps, later in the course'],
            ['A title screen and pause', 'A `state` variable: "menu", "playing", "paused", "over"', 'The game-states lesson'],
            ['A high score saved to a file', 'Write the best score to JSON on game over', 'The save-data lesson'],
            ['Better collisions at high speed', 'Several small steps per frame', 'Tunnelling, in the collision lesson'],
          ],
          caption: 'Each extension reuses a lesson you have already done.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why finish a small game?',
          text: 'Most beginners start a huge idea and never finish. A complete small game teaches the parts that tutorials skip: restart, winning, losing, feedback, and the hundred small decisions in between. Everything you build later is these same parts in a bigger arrangement.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'Some bricks survive when the ball hits two neighbours at once, and there is no error message. Tap the line with the mistake.',
      lines: [
        'for brick in bricks:',
        '    if ball_rect.colliderect(brick):',
        '        bricks.remove(brick)',
        '        score += 10',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Removing from `bricks` while looping over `bricks` shifts the later items down by one, so the loop **skips the brick that follows** each removed one. Loop over a copy (`for brick in bricks[:]:`), or build a new list: `bricks = [b for b in bricks if not ball_rect.colliderect(b)]`.',
    },
    {
      kind: 'numeric',
      prompt: 'The wall has 10 columns of bricks, each 56 pixels wide, with a gap of 4 pixels between neighbouring bricks (9 gaps). How many pixels wide is the whole wall?',
      answer: '596',
      hint: '10 bricks plus 9 gaps.',
      explanation: '10 x 56 + 9 x 4 = 560 + 36 = 596. Starting at x = 10, the wall ends at x = 606, leaving 34 pixels free on the right of the 640-pixel window. A common mistake is counting 10 gaps, which would give 600.',
      label: 'Width:',
    },
    {
      kind: 'concept',
      title: 'Your turn: the rules of Breakout',
      blocks: [
        {
          type: 'p',
          text: 'You will write the same rules that the game uses, as small testable functions and one state class. The tests do not open a window: they check the numbers.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `wall_bounce(pos, vel, radius, width)`. `pos` and `vel` are `pygame.Vector2` (the ball’s centre and velocity). Return a **new** `(pos, vel)` pair: if `pos.x < radius` or `pos.x > width - radius`, reverse `vel.x` and move `pos.x` back inside (limited to the range `radius` to `width - radius`); if `pos.y < radius`, set `vel.y` to its absolute value (pointing down) and set `pos.y` to `radius`. Nothing is done for the bottom. Write `paddle_bounce(ball_x, paddle, speed)`: the new velocity `Vector2` as in the lesson: the offset `(ball_x - paddle.centerx) / (paddle.width / 2)` limited to -1..1, and `Vector2(0, -speed).rotate(offset * 60)`.',
      starter: `import pygame


def wall_bounce(pos, vel, radius, width):
    ...


def paddle_bounce(ball_x, paddle, speed):
    ...
`,
      solution: `import pygame


def wall_bounce(pos, vel, radius, width):
    pos = pygame.Vector2(pos)
    vel = pygame.Vector2(vel)
    if pos.x < radius or pos.x > width - radius:
        vel.x = -vel.x
        pos.x = max(radius, min(width - radius, pos.x))
    if pos.y < radius:
        vel.y = abs(vel.y)
        pos.y = radius
    return pos, vel


def paddle_bounce(ball_x, paddle, speed):
    offset = (ball_x - paddle.centerx) / (paddle.width / 2)
    offset = max(-1.0, min(1.0, offset))
    return pygame.Vector2(0, -speed).rotate(offset * 60)
`,
      setup: PG_SIM,
      tests: `V = pygame.Vector2

def xy(v):
    return (round(v.x, 2), round(v.y, 2))

p, v = wall_bounce(V(100, 100), V(50, -30), 8, 640)
assert xy(p) == (100, 100) and xy(v) == (50, -30), "no wall touched"
p, v = wall_bounce(V(5, 100), V(-50, -30), 8, 640)
assert xy(p) == (8, 100) and xy(v) == (50, -30), "left wall"
p, v = wall_bounce(V(640, 100), V(50, 30), 8, 640)
assert xy(p) == (632, 100) and xy(v) == (-50, 30), "right wall"
p, v = wall_bounce(V(100, 2), V(50, -30), 8, 640)
assert xy(p) == (100, 8) and xy(v) == (50, 30), "ceiling"
p, v = wall_bounce(V(100, 3), V(50, 30), 8, 640)
assert xy(v) == (50, 30), "already moving down: stays down"
p, v = wall_bounce(V(3, 3), V(-5, -5), 8, 640)
assert xy(p) == (8, 8) and xy(v) == (5, 5), "a corner"
p, v = wall_bounce(V(100, 700), V(1, 1), 8, 640)
assert xy(p) == (100, 700) and xy(v) == (1, 1), "the bottom is not a wall"
pos, vel = V(5, 100), V(-50, 0)
wall_bounce(pos, vel, 8, 640)
assert xy(pos) == (5, 100) and xy(vel) == (-50, 0), "arguments unchanged"
R = pygame.Rect
paddle = R(0, 0, 100, 10)
paddle.center = (300, 400)
assert xy(paddle_bounce(300, paddle, 400)) == (0, -400), "centre: straight up"
right = paddle_bounce(350, paddle, 400)
assert xy(right) == (346.41, -200), xy(right)
left = paddle_bounce(250, paddle, 400)
assert xy(left) == (-346.41, -200)
assert xy(paddle_bounce(600, paddle, 400)) == (346.41, -200), "limited to 60 degrees"
assert xy(paddle_bounce(-100, paddle, 400)) == (-346.41, -200)
half = paddle_bounce(325, paddle, 100)
assert xy(half) == (50, -86.6), xy(half)
assert abs(paddle_bounce(320, paddle, 250).length() - 250) < 1e-6, "the speed is kept"`,
      checks: ['`wall_bounce` reverses the right component, puts the ball back inside, and ignores the bottom', '`paddle_bounce` maps the hit offset (limited to -1..1) to an angle of up to 60 degrees from straight up', 'Both return new vectors and the speed is preserved'],
      hint: 'In `wall_bounce`, copy the vectors first. `max(radius, min(width - radius, pos.x))` keeps x inside. For `paddle_bounce`, `Vector2(0, -speed).rotate(degrees)` turns the upward vector to the right for positive angles.',
      explanation: 'The offset-to-angle trick is the same one used in Pong, and the 60-degree limit is the tuning knob that makes the ball easy or hard to control. Both functions return the speed unchanged: the game multiplies it by 1.02 *before* calling, to speed up.',
    },
    {
      kind: 'code',
      prompt: 'Write `make_bricks(rows, cols, size, gap, origin)` returning a list of `pygame.Rect`, row by row, each of the given `size` (`(width, height)`), spaced by `gap` pixels, the first at `origin`. Write `bounce_off_brick(ball_rect, vel, brick)` that returns a **new** velocity `Vector2`: if the horizontal overlap between `ball_rect` and `brick` (`min(right) - max(left)`) is **smaller** than the vertical overlap (`min(bottom) - max(top)`), reverse `vel.x`; otherwise reverse `vel.y`.',
      starter: `import pygame


def make_bricks(rows, cols, size, gap, origin):
    ...


def bounce_off_brick(ball_rect, vel, brick):
    ...
`,
      solution: `import pygame


def make_bricks(rows, cols, size, gap, origin):
    bricks = []
    for r in range(rows):
        for c in range(cols):
            x = origin[0] + c * (size[0] + gap)
            y = origin[1] + r * (size[1] + gap)
            bricks.append(pygame.Rect(x, y, size[0], size[1]))
    return bricks


def bounce_off_brick(ball_rect, vel, brick):
    overlap_x = min(ball_rect.right, brick.right) - max(ball_rect.left, brick.left)
    overlap_y = min(ball_rect.bottom, brick.bottom) - max(ball_rect.top, brick.top)
    new = pygame.Vector2(vel)
    if overlap_x < overlap_y:
        new.x = -new.x
    else:
        new.y = -new.y
    return new
`,
      setup: PG_SIM,
      tests: `R = pygame.Rect
V = pygame.Vector2
bricks = make_bricks(2, 3, (50, 20), 4, (10, 60))
assert len(bricks) == 6
assert [b.topleft for b in bricks] == [(10, 60), (64, 60), (118, 60), (10, 84), (64, 84), (118, 84)]
assert all(b.size == (50, 20) for b in bricks)
assert make_bricks(0, 5, (50, 20), 4, (0, 0)) == [] and make_bricks(5, 0, (50, 20), 4, (0, 0)) == []
assert len(make_bricks(5, 10, (56, 20), 4, (10, 60))) == 50
wall = make_bricks(5, 10, (56, 20), 4, (10, 60))
assert max(b.right for b in wall) == 606 and max(b.bottom for b in wall) == 176
for i, a in enumerate(wall):
    for b in wall[i + 1:]:
        assert not a.colliderect(b), "bricks must not overlap"
brick = R(100, 100, 50, 20)
ball = R(0, 0, 16, 16)
ball.midtop = (120, 118)
v = bounce_off_brick(ball, V(30, -200), brick)
assert (v.x, v.y) == (30, 200), "hit from below: overlap is shallow in y"
ball.midbottom = (120, 102)
v = bounce_off_brick(ball, V(30, 200), brick)
assert (v.x, v.y) == (30, -200), "hit from above"
ball.midright = (102, 110)
v = bounce_off_brick(ball, V(200, 30), brick)
assert (v.x, v.y) == (-200, 30), "hit from the left side"
ball.midleft = (148, 110)
v = bounce_off_brick(ball, V(-200, -30), brick)
assert (v.x, v.y) == (200, -30), "hit from the right side"
orig = V(1, 2)
bounce_off_brick(ball, orig, brick)
assert (orig.x, orig.y) == (1, 2), "the velocity given is not changed"`,
      checks: ['`make_bricks` lays out `rows * cols` rectangles row by row, with the gap between them and no overlaps', '`bounce_off_brick` flips x when the horizontal overlap is smaller, y otherwise', 'The velocity given is not modified'],
      hint: 'Brick `(r, c)` is at `x = origin[0] + c * (width + gap)` and `y = origin[1] + r * (height + gap)`. Compute the two overlaps with `min` and `max` of the edges, and flip the component of a **copy** of the velocity.',
      explanation: 'Smaller overlap = the face the ball came through. A ball that hits right on a corner has nearly equal overlaps, and either flip looks fine. The test checks all four sides.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Scoreboard(rows, lives=3)` for the rules around the ball. It starts with `score` 0, `lives` as given, and `bricks_left` set to... you do not know it yet: `bricks_left` is given later with `start(count)`. Method `brick_destroyed(row)` (row 0 is the top row) adds `10 * (rows - row)` to the score and lowers `bricks_left` by one. Method `ball_lost()` lowers `lives` by one (not below 0). The property `state` is `"won"` when `bricks_left` is 0 after `start`, otherwise `"lost"` when `lives` is 0, otherwise `"playing"`. (Check **won** first: clearing the last brick wins even if it was your last life.) Before `start` is called, the state is `"playing"`.',
      starter: `class Scoreboard:
    def __init__(self, rows, lives=3):
        ...

    def start(self, count):
        ...

    def brick_destroyed(self, row):
        ...

    def ball_lost(self):
        ...

    @property
    def state(self):
        ...
`,
      solution: `class Scoreboard:
    def __init__(self, rows, lives=3):
        self.rows = rows
        self.lives = lives
        self.score = 0
        self.bricks_left = None

    def start(self, count):
        self.bricks_left = count

    def brick_destroyed(self, row):
        self.score += 10 * (self.rows - row)
        self.bricks_left -= 1

    def ball_lost(self):
        self.lives = max(0, self.lives - 1)

    @property
    def state(self):
        if self.bricks_left == 0:
            return "won"
        if self.lives == 0:
            return "lost"
        return "playing"
`,
      tests: `s = Scoreboard(5)
assert s.score == 0 and s.lives == 3 and s.state == "playing"
s.start(3)
assert s.bricks_left == 3 and s.state == "playing"
s.brick_destroyed(0)
assert s.score == 50 and s.bricks_left == 2
s.brick_destroyed(4)
assert s.score == 60 and s.bricks_left == 1
s.ball_lost()
assert s.lives == 2 and s.state == "playing"
s.brick_destroyed(2)
assert s.score == 90 and s.state == "won"
t = Scoreboard(3, lives=1)
t.start(2)
t.ball_lost()
assert t.lives == 0 and t.state == "lost"
t.ball_lost()
assert t.lives == 0, "never below zero"
u = Scoreboard(3, lives=1)
u.start(1)
u.ball_lost()
assert u.state == "lost"
u2 = Scoreboard(3, lives=1)
u2.start(1)
u2.ball_lost()
u2.lives = 1
u2.brick_destroyed(0)
assert u2.state == "won"
w = Scoreboard(2, lives=1)
w.start(1)
w.lives = 1
w.brick_destroyed(1)
w.ball_lost()
assert w.state == "won", "clearing the last brick wins before the last life is lost"
x = Scoreboard(4, 2)
x.start(4)
for r in (0, 1, 2, 3):
    x.brick_destroyed(r)
assert x.score == 40 + 30 + 20 + 10 and x.state == "won"`,
      checks: ['`brick_destroyed` adds `10 * (rows - row)` and counts the brick down', '`ball_lost` lowers the lives but never below 0', '`state` is "won" first, then "lost", else "playing", and is "playing" before `start`'],
      hint: 'Use `None` for `bricks_left` until `start`, so that `bricks_left == 0` can only mean "all cleared". `state` checks `bricks_left == 0` first, then `lives == 0`.',
      explanation: 'The order of the checks in `state` is a game-design decision: if the ball falls as the last brick breaks, does the player win or lose? Here they win. Writing it as a function of the numbers makes such decisions explicit, and a test pins them down.',
    },
  ],
  takeaways: [
    'Plan a game on one screen first: **entities**, **rules**, **input**, **states**. Then split the code the same way: the rules as small functions of numbers and rectangles, the window and loop as a thin shell.',
    'Bounce rules: **walls** reverse the velocity component pointing into them **and put the ball back inside**; the **paddle** sets the angle from the offset of the hit (`offset * 60` degrees); a **brick** flips the axis of the **smaller overlap**.',
    'Only bounce off the paddle when the ball is moving **down**, so a ball that is still overlapping cannot bounce twice.',
    'Keep everything that changes in one state object (`Game`), so a restart is `game = Game()`. Drawing only reads the state.',
    'Never remove from a list while looping over it: loop over a copy, build a new list, or `pop` an index you found with `collidelist`.',
    'Tune with named constants (speeds, angle limit, speed-up, lives). A finished small game teaches restart, win, lose and feel, which are the parts that scale to bigger games.',
  ],
  reading: [
    { title: 'Wikipedia: Breakout (video game)', url: 'https://en.wikipedia.org/wiki/Breakout_(video_game)', source: 'wikipedia', note: 'The history of the original, designed by Nolan Bushnell and Steve Wozniak, and its many successors.' },
    { title: 'MDN: 2D breakout game', url: 'https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_Breakout_game_pure_JavaScript', source: 'tutorial', note: 'The same game explained step by step in another language: useful for seeing the same rules from a new angle.' },
    { title: 'pygame docs: pygame.Rect.collidelist', url: 'https://www.pygame.org/docs/ref/rect.html#pygame.Rect.collidelist', source: 'docs', note: 'The collision method used to find the brick that was hit.' },
    { title: 'Game Programming Patterns: State', url: 'https://gameprogrammingpatterns.com/state.html', source: 'book', note: 'The theory behind "playing / won / lost" and the menus of later lessons.' },
  ],
};
