import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-derivatives-gradients',
  title: 'Derivatives, Gradients and the Chain Rule',
  summary: 'How a model learns, in one lesson: the derivative as slope, why the slope of the loss tells you which way to adjust a parameter, the gradient as a vector of slopes, gradient descent, and the chain rule that makes backpropagation possible.',
  minutes: 22,
  objectives: [
    'Interpret the derivative as the slope of a function and estimate it numerically',
    'Explain how gradient descent uses the slope of the loss to improve parameters, and what the learning rate does',
    'Compute and interpret the gradient of a function of several variables',
    'Apply the chain rule to a composition, including a one-neuron model with a sigmoid',
    'Check an analytic gradient against a numerical one',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The derivative: slope at a point',
      blocks: [
        {
          type: 'p',
          text: 'Training a model means *adjusting numbers to make a score better*. To know **which way** to adjust a number you need to know how the score reacts to a tiny nudge. That is exactly what the **[[derivative]]** measures: the rate of change of a function, the **slope** of its graph at a point. If `f(x) = x²` and you nudge `x` from 3 to 3.001, `f` rises from 9 to about 9.006, six times as much as the nudge, so the slope at 3 is 6. Formally the derivative is the limit of "rise over run" as the step `h` shrinks to zero.',
        },
        {
          type: 'math',
          tex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}",
          caption: 'The derivative: the slope of the line that touches the curve at x (the tangent line).',
        },
        {
          type: 'graph',
          caption: 'The curve f(x) = x². Slide the point along the curve: the red tangent line shows the slope there. It is steep and positive on the right, flat at the bottom, steep and negative on the left — the slope is 2a.',
          x: [-4, 4],
          y: [-2, 10],
          functions: [{ expr: 'x^2', label: 'f(x) = x²', color: 'blue' }],
          tangents: [{ expr: 'x^2', at: 'a', color: 'red', label: 'tangent' }],
          points: [{ x: 'a', y: 'a^2', color: 'red' }],
          sliders: [{ name: 'a', min: -3, max: 3, step: 0.1, value: 1.5, label: 'position a' }],
          readouts: [
            { label: 'f(a)', expr: 'a^2', digits: 2 },
            { label: 'slope f′(a)', expr: '2a', digits: 2 },
          ],
          height: 320,
        },
        {
          type: 'p',
          text: 'You do not always need a formula. Evaluating the function a tiny step on *both* sides of `x` and dividing the difference by the width gives a very good estimate — **[[numerical-differentiation]]**. The *central* difference `(f(x+h) − f(x−h)) / 2h` is much more accurate than the one-sided version, and it works for any function you can compute, even a whole neural network.',
        },
        {
          type: 'code',
          title: 'numeric_derivative.py',
          runnable: true,
          code: `def derivative(f, x, h=1e-6):
    return (f(x + h) - f(x - h)) / (2 * h)

def square(x):
    return x * x

print(round(derivative(square, 3), 4))
print(round(derivative(square, -2), 4))
print(round(derivative(lambda x: x ** 3, 2), 4))
print(round(derivative(abs, 0.5), 4), round(derivative(abs, -0.5), 4))`,
          output: `6.0
-4.0
12.0
1.0 -1.0`,
          annotations: [
            { lines: '1-2', text: 'The central difference: evaluate `f` a hair to the right and to the left, subtract and divide by the width `2h`. A function is just a value you can pass around, so `f` can be anything.' },
            { lines: 7, text: 'The slope of `x²` at 3 is 6 (the formula `2x`).' },
            { lines: 8, text: 'At -2 the slope is -4: the curve is going downhill there.' },
            { lines: 9, text: 'For `x³` the formula is `3x²`, which is 12 at `x = 2`; the lambda defines the function on the spot.' },
            { lines: 10, text: 'Even `abs` has a derivative away from the corner: +1 on the right of zero, -1 on the left. (Exactly at 0 there is a kink and no true derivative; ReLU, a popular activation, has the same corner.)' },
          ],
        },
        {
          type: 'table',
          headers: ['Function', 'Derivative', 'Where it appears in ML'],
          rows: [
            ['constant `c`', '`0`', 'a bias that does not depend on the input has no effect on the slope'],
            ['`x^n`', '`n · x^(n-1)`', 'squared error `(y - t)²`, polynomial features'],
            ['`e^x`', '`e^x`', 'softmax, exponential decay of learning rates'],
            ['`ln x`', '`1 / x`', 'cross-entropy loss'],
            ['sigmoid `σ(x)`', '`σ(x) · (1 - σ(x))`', 'sigmoid neurons, logistic regression'],
            ['ReLU `max(0, x)`', '`1` if `x > 0`, else `0`', 'the most common hidden-layer activation'],
          ],
          caption: 'The few derivative rules that cover most of deep learning. You do not need to memorize more.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why you rarely differentiate by hand',
          text: 'Frameworks such as PyTorch compute derivatives **automatically** (automatic differentiation) for any program you write. But understanding what the derivative *means* is what lets you debug training: exploding or vanishing gradients, a learning rate that is too big, a loss that does not move. The numerical derivative above is still used for **gradient checking**: verifying that a hand-written or new gradient is correct.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'The derivative of a model’s loss with respect to one weight is **-3** at the current weight value. What does that tell you?',
      options: [
        { text: 'Increasing that weight a little makes the loss go down (about 3 times the size of the nudge)', correct: true, why: 'A negative slope means the loss falls as the weight rises. Gradient descent therefore increases this weight, moving opposite to the sign of the slope.' },
        { text: 'The loss itself equals -3', why: 'The derivative is a slope, not the value of the loss. Losses are also normally non-negative.' },
        { text: 'The weight is already at its optimal value', why: 'At an optimum the slope is 0 (the curve is flat), not -3.' },
        { text: 'Decreasing the weight will make the loss go down', why: 'The opposite: a negative slope means that moving the weight *down* would make the loss *rise*.' },
      ],
      explanation: 'The sign of the derivative gives the direction (negative: loss falls as the weight rises) and its size gives the steepness. Learning follows the downhill direction.',
    },
    {
      kind: 'concept',
      title: 'Gradient descent in one dimension',
      blocks: [
        {
          type: 'p',
          text: 'Here is the idea behind almost every learning algorithm. Let `L(w)` be the **loss** of a model as a function of one parameter `w` (high is bad). At the current `w`, the slope `L′(w)` says which way is uphill. So take a small step *downhill*: subtract the slope, scaled by a small number `η` (eta) called the **learning rate**. Repeat. This is **[[gradient-descent]]**.',
        },
        {
          type: 'math',
          tex: 'w \\leftarrow w - \\eta \\, L\'(w)',
          caption: 'One step of gradient descent. η (the learning rate) controls the step size.',
        },
        {
          type: 'code',
          title: 'descent_1d.py',
          runnable: true,
          code: `def descend(grad, w, lr, steps):
    path = [w]
    for _ in range(steps):
        w = w - lr * grad(w)
        path.append(w)
    return path

grad = lambda w: 2 * (w - 3)
good = descend(grad, 0.0, 0.1, 20)
print([round(w, 3) for w in good[:4]], round(good[-1], 3))
slow = descend(grad, 0.0, 0.01, 20)
print(round(slow[-1], 3))
bad = descend(grad, 0.0, 1.1, 10)
print([round(w, 1) for w in bad[:5]], abs(bad[-1]) > 10)`,
          output: `[0.0, 0.6, 1.08, 1.464] 2.965
0.997
[0.0, 6.6, -1.3, 8.2, -3.2] True`,
          annotations: [
            { lines: '1-6', text: 'The whole learning algorithm: repeat `w = w - lr * grad(w)` and record where we have been. The function `grad` returns the slope of the loss.' },
            { lines: 8, text: 'Our "loss" is `(w - 3)²`, whose minimum is at `w = 3`; its derivative is `2 (w - 3)`. We start far away at `w = 0`.' },
            { lines: '9-10', text: 'Learning rate 0.1: each step moves roughly 20% of the remaining distance. After 20 steps `w` is 2.965, very close to the optimum 3. The steps shrink on their own because the slope shrinks near the bottom.' },
            { lines: '11-12', text: 'Learning rate 0.01: safe but **too slow**. After the same 20 steps `w` is still only 0.997.' },
            { lines: '13-14', text: 'Learning rate 1.1: **too large**. Each step overshoots the minimum and lands farther away on the other side (0 → 6.6 → -1.3 → 8.2 …) and the process diverges. This is what an exploding loss looks like.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Choosing the learning rate',
          text: 'It is the most important setting in training. Too small and training crawls (or stalls); too large and the loss bounces or explodes (it shows up as `nan`). Typical starting values are 0.1 to 0.001 depending on the model and optimizer; the practical approach is to try a few values on a log scale (0.1, 0.03, 0.01, 0.003 …) and watch the loss curve. Later lessons add smarter optimizers (momentum, Adam) and learning-rate schedules.',
        },
        {
          type: 'callout',
          variant: 'analogy',
          title: 'Walking down a foggy mountain',
          text: 'Imagine standing on a hillside in thick fog. You cannot see the valley, but you can feel the slope under your feet. Step downhill, feel the slope again, step again. Small steps are safe but slow; giant leaps may carry you across the valley and up the other side. Gradient descent is exactly this walk, with the loss as the height and the parameters as your position.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'To decrease the loss, gradient descent moves the parameters in the **same** direction as the gradient.',
      answer: false,
      explanation: 'False. The gradient points in the direction of steepest **increase**, so gradient *descent* subtracts it: `w ← w − η · gradient`. Moving with the gradient would be gradient *ascent* and would make the loss bigger.',
    },
    {
      kind: 'concept',
      title: 'Gradients: slopes in many dimensions',
      blocks: [
        {
          type: 'p',
          text: 'A real model has thousands to billions of parameters, so the loss is a function of *many* variables. The **[[partial-derivative]]** `∂L/∂wᵢ` answers: "if I nudge only `wᵢ` and hold every other weight fixed, how fast does the loss change?" Collecting all of them into a vector gives the **[[gradient]]** `∇L`. Two facts make it the star of machine learning: it points in the direction of **steepest ascent**, and each entry tells you how much to blame — and therefore adjust — the corresponding parameter. Gradient descent becomes the same update applied to the whole vector: `w ← w − η ∇L(w)`.',
        },
        {
          type: 'math',
          tex: '\\nabla L = \\left( \\frac{\\partial L}{\\partial w_1},\\ \\frac{\\partial L}{\\partial w_2},\\ \\dots,\\ \\frac{\\partial L}{\\partial w_n} \\right), \\qquad \\mathbf{w} \\leftarrow \\mathbf{w} - \\eta\\, \\nabla L(\\mathbf{w})',
          caption: 'The gradient is the vector of partial derivatives; descent steps against it.',
        },
        {
          type: 'code',
          title: 'gradient_2d.py',
          runnable: true,
          code: `def numerical_gradient(f, point, h=1e-6):
    grad = []
    for i in range(len(point)):
        up = list(point)
        up[i] += h
        down = list(point)
        down[i] -= h
        grad.append((f(up) - f(down)) / (2 * h))
    return grad

def bowl(p):
    x, y = p
    return (x - 1) ** 2 + 2 * (y + 2) ** 2

def bowl_grad(p):
    x, y = p
    return [2 * (x - 1), 4 * (y + 2)]

p = [3.0, 0.0]
print([round(g, 3) for g in numerical_gradient(bowl, p)], bowl_grad(p))
for _ in range(100):
    g = bowl_grad(p)
    p = [pi - 0.1 * gi for pi, gi in zip(p, g)]
print([round(v, 3) for v in p], round(bowl(p), 6))`,
          output: `[4.0, 8.0] [4.0, 8.0]
[1.0, -2.0] 0.0`,
          annotations: [
            { lines: '1-9', text: 'A **numerical gradient**: for each coordinate `i`, nudge only that coordinate up and down, evaluate `f` twice and take the central difference. That produces one partial derivative per coordinate, collected in a list.' },
            { lines: '11-13', text: 'A bowl-shaped "loss" in two variables with its lowest point at `(1, -2)`. Note that `y` matters twice as much (factor 2).' },
            { lines: '15-17', text: 'The partial derivatives worked out by hand: `∂/∂x = 2(x - 1)` and `∂/∂y = 4(y + 2)`.' },
            { lines: '19-20', text: 'At `(3, 0)` the numerical and analytic gradients agree: `[4, 8]`. This comparison is **gradient checking**. The gradient points uphill, and is steeper in `y`.' },
            { lines: '21-23', text: 'Gradient descent on a vector: the same update `p - lr * g` applied to every component with `zip`.' },
            { lines: 24, text: 'After 100 steps the point has arrived at the bottom of the bowl, `(1, -2)`, where the loss is 0.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'A billion partial derivatives, computed cheaply',
          text: 'The numerical approach needs two evaluations *per parameter*; for a model with a billion weights that would take forever. **Backpropagation** (next lessons and the neural-network unit) computes *all* the partial derivatives in about the cost of two forward passes, by applying the chain rule backwards through the network. PyTorch does this for you with `loss.backward()`; numerical gradients remain useful to check small examples.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Valleys, plateaus and local minima',
          text: 'Real loss surfaces are not smooth bowls. Gradient descent can crawl along long narrow valleys, stall on flat plateaus where the gradient is almost zero, or settle in a *local* minimum. In practice, huge networks have many good minima and the noise from training on small batches helps escape bad ones; this is why momentum and Adam optimizers work so well.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the gradient descent update for one parameter.',
      template: `grad = 2 * (w - 3)
w = w ___ lr * ___`,
      templateIsCode: true,
      blanks: [{ answers: ['-'] }, { answers: ['grad'] }],
      wordBank: ['-', '+', 'grad', 'w'],
      explanation: 'Descent subtracts the learning rate times the gradient: `w = w - lr * grad`. With a minus sign the weight moves downhill; with a plus sign it would climb the loss.',
    },
    {
      kind: 'concept',
      title: 'The chain rule: derivatives of compositions',
      blocks: [
        {
          type: 'p',
          text: 'Models are *compositions*: the output of one operation feeds the next (`input → multiply by weights → add bias → sigmoid → compare with target → loss`). How does the loss change when you nudge a weight deep inside this chain? The **[[chain-rule]]** answers: **multiply the local slopes along the chain**. If `y` depends on `u` and `u` depends on `x`, then a nudge of `x` changes `u` by `du/dx` per unit, and that change in `u` changes `y` by `dy/du` per unit, so overall `dy/dx = dy/du · du/dx`.',
        },
        {
          type: 'derivation',
          title: 'Example: differentiate y = (3x + 1)²',
          steps: [
            { tex: 'u = 3x + 1, \\quad y = u^2', why: 'Split the function into two simple links: an inner function `u(x)` and an outer function `y(u)`.' },
            { tex: '\\frac{dy}{du} = 2u', why: 'The power rule for the outer link: the derivative of `u²` is `2u`.' },
            { tex: '\\frac{du}{dx} = 3', why: 'The inner link is a straight line with slope 3.' },
            { tex: '\\frac{dy}{dx} = \\frac{dy}{du}\\cdot\\frac{du}{dx} = 2u \\cdot 3', why: 'The chain rule: multiply the slopes of the links.' },
            { tex: '\\frac{dy}{dx} = 6\\,(3x + 1)', why: 'Substitute back `u = 3x + 1`. At `x = 1` the slope is 24.' },
          ],
          result: "\\frac{d}{dx}(3x+1)^2 = 6(3x+1)",
        },
        {
          type: 'p',
          text: 'The same pattern differentiates a tiny model, a **single sigmoid neuron**, with respect to its weight `w` and bias `b`. The chain is `z = w·x + b`, then `s = σ(z)`, then `L = (s − t)²`. The three local slopes are `∂L/∂s = 2(s − t)`, `∂s/∂z = s(1 − s)` and `∂z/∂w = x` (or `1` for `b`). Multiplying them gives both gradients. The program computes them with the formula and checks the result against numerical differentiation:',
        },
        {
          type: 'code',
          title: 'chain_rule_neuron.py',
          runnable: true,
          code: `import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

def loss(w, b, x, t):
    return (sigmoid(w * x + b) - t) ** 2

def grads(w, b, x, t):
    s = sigmoid(w * x + b)
    common = 2 * (s - t) * s * (1 - s)
    return common * x, common

w, b, x, t = 0.5, -0.2, 2.0, 1.0
dw, db = grads(w, b, x, t)
h = 1e-6
num_dw = (loss(w + h, b, x, t) - loss(w - h, b, x, t)) / (2 * h)
num_db = (loss(w, b + h, x, t) - loss(w, b - h, x, t)) / (2 * h)
print(round(dw, 5), round(num_dw, 5))
print(round(db, 5), round(num_db, 5))`,
          output: `-0.26527 -0.26527
-0.13263 -0.13263`,
          annotations: [
            { lines: '3-4', text: 'The **sigmoid** squashes any number into the range 0 to 1, so the neuron’s output can be read as a probability.' },
            { lines: '6-7', text: 'The loss of one neuron on one example: the squared difference between its output and the target `t`.' },
            { lines: '9-12', text: 'The **chain rule by hand**. `2 (s - t)` is the slope of the loss with respect to the output `s`, `s (1 - s)` the slope of the sigmoid, and the last link is `x` for the weight and `1` for the bias. `common` is the product of the first two; multiplying by `x` or `1` finishes each chain.' },
            { lines: '14-15', text: 'One training example: input 2.0 with target 1.0, starting weights 0.5 and -0.2.' },
            { lines: '16-18', text: 'The **gradient check**: nudge `w` (then `b`) up and down by `h`, recompute the loss and take the central difference.' },
            { lines: '19-20', text: 'Formula and numerical estimate agree to five decimals. The negative gradients say: increasing `w` and `b` lowers the loss, because the neuron’s output is below the target 1.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Backpropagation is the chain rule, organized',
          text: 'A deep network is a long chain of such links. **Backpropagation** walks the chain *backwards* from the loss, multiplying local slopes as it goes and handing each parameter its share of the gradient. Every link only needs to know its own local derivative, which is why frameworks can offer thousands of operations that all differentiate automatically. You will build this machinery from scratch in the neural-network unit.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What does the gradient point to?" (steepest ascent); "Why subtract it?" (we want to go down); "What happens with too large a learning rate?" (overshoot, divergence, `nan`); "State the chain rule" (`dy/dx = dy/du · du/dx`); "How can you check a gradient implementation?" (compare with a numerical central difference).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. The numerical derivative of `3x²` is computed at `x = 2`.',
      code: `def derivative(f, x, h=1e-6):
    return (f(x + h) - f(x - h)) / (2 * h)

print(round(derivative(lambda x: 3 * x ** 2, 2), 3))`,
      answer: '12.0',
      hint: 'The formula for the derivative of `3x²` is `6x`.',
      explanation: 'The derivative of `3x²` is `6x`, which is 12 at `x = 2`. The central difference is accurate to many decimals, so rounding to 3 places gives `12.0`.',
    },
    {
      kind: 'error',
      prompt: 'This training loop makes the loss *grow* instead of shrink. Tap the faulty line.',
      lines: [
        'def step(w, grad, lr):',
        '    # move the weight so the loss goes down',
        '    new_w = w + lr * grad',
        '    return new_w',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The gradient points uphill, so the update must **subtract** it: `w - lr * grad`. With `+` every step climbs the loss (gradient *ascent*), and the loss grows.',
    },
    {
      kind: 'numeric',
      prompt: 'Use the chain rule to find the slope of `y = (2x + 1)³` at `x = 1`. (With `u = 2x + 1`: `dy/dx = 3u² · 2`.)',
      answer: '54',
      hint: 'At `x = 1`, `u = 3`. Then `3 · 3² · 2`.',
      explanation: 'With `u = 2x + 1` the outer slope is `3u²` and the inner slope is 2. At `x = 1`, `u = 3`, so `dy/dx = 3 · 9 · 2 = 54`.',
      label: 'Slope:',
    },
    {
      kind: 'code',
      prompt: 'Write `derivative(f, x, h=1e-6)` using the **central difference** `(f(x + h) - f(x - h)) / (2 * h)`.',
      starter: `def derivative(f, x, h=1e-6):
    ...
`,
      solution: `def derivative(f, x, h=1e-6):
    return (f(x + h) - f(x - h)) / (2 * h)
`,
      tests: `import math

def close(a, b, tol=1e-5):
    return abs(a - b) < tol

assert close(derivative(lambda x: x * x, 3), 6)
assert close(derivative(lambda x: x ** 3, 2), 12, 1e-4)
assert close(derivative(math.sin, 0), 1)
assert close(derivative(lambda x: 5, 7), 0)
assert close(derivative(math.exp, 1), math.e, 1e-4)
assert close(derivative(lambda x: 2 * x + 1, -4), 2)
assert close(derivative(lambda x: 1 / x, 2), -0.25, 1e-5)

seen = []

def f(x):
    seen.append(x)
    return x

result = derivative(f, 1.0, h=0.5)
assert sorted(seen) == [0.5, 1.5]
assert result == 1.0`,
      checks: ['Evaluates \`f\` at \`x + h\` and \`x - h\` (a central difference) and divides by \`2 * h\`', 'Accurate for polynomials, trigonometric and exponential functions', 'Uses the \`h\` argument it is given'],
      hint: 'Call `f` twice, once at `x + h` and once at `x - h`, subtract, and divide by `2 * h`.',
      explanation: 'Centering the two sample points cancels the leading error term, so the estimate is far more accurate than the one-sided `(f(x + h) - f(x)) / h` for the same `h`. It treats `f` as a black box, so it can check gradients of any code you write.',
    },
    {
      kind: 'code',
      prompt: 'Write `gradient_descent(grad, start, lr, steps)`. `grad(point)` returns the gradient as a list; `start` is a list of starting coordinates. Perform `steps` updates `point = point - lr * gradient` (for every coordinate) and return the final point as a **new** list. The `start` list must not be changed.',
      starter: `def gradient_descent(grad, start, lr, steps):
    ...
`,
      solution: `def gradient_descent(grad, start, lr, steps):
    point = list(start)
    for _ in range(steps):
        g = grad(point)
        point = [p - lr * gi for p, gi in zip(point, g)]
    return point
`,
      tests: `def close(a, b, tol=1e-6):
    return abs(a - b) < tol

g1 = lambda p: [2 * (p[0] - 3)]
res = gradient_descent(g1, [0.0], 0.1, 200)
assert len(res) == 1 and close(res[0], 3)

g2 = lambda p: [2 * (p[0] - 1), 4 * (p[1] + 2)]
res = gradient_descent(g2, [3.0, 0.0], 0.1, 200)
assert close(res[0], 1) and close(res[1], -2)

start = [1.0, 2.0]
out = gradient_descent(lambda p: [0.0, 0.0], start, 0.5, 10)
assert out == [1.0, 2.0] and out is not start
assert start == [1.0, 2.0]

orig = [5.0]
assert gradient_descent(g1, orig, 0.1, 0) == [5.0]
assert close(gradient_descent(g1, [0.0], 0.1, 1)[0], 0.6)

g3 = lambda p: [2 * p[0], 2 * p[1], 2 * p[2]]
res = gradient_descent(g3, [4.0, -3.0, 2.0], 0.25, 60)
assert all(abs(v) < 1e-9 for v in res)

before = [3.0, 0.0]
gradient_descent(g2, before, 0.1, 5)
assert before == [3.0, 0.0]`,
      checks: ['Applies \`point - lr * gradient\` to every coordinate for \`steps\` iterations', 'Returns a new list and leaves \`start\` unchanged; zero steps returns a copy of \`start\`', 'Works for any number of dimensions'],
      hint: 'Copy the start with `point = list(start)`. In the loop get `g = grad(point)` and build the new point with a list comprehension over `zip(point, g)`.',
      explanation: 'This is real gradient descent — the loop at the heart of training every model in this course. Neural-network training differs only in how the gradient is computed (backpropagation) and in smarter update rules like momentum and Adam.',
    },
    {
      kind: 'code',
      prompt: 'Write `neuron_grads(w, b, x, t)` for the loss `L = (sigmoid(w*x + b) - t) ** 2` of one sigmoid neuron. Return the tuple `(dL_dw, dL_db)` computed with the chain rule: `2 (s - t) · s (1 - s)` times `x` for the weight and times `1` for the bias, where `s = sigmoid(w*x + b)`.',
      starter: `import math

def sigmoid(z):
    return 1 / (1 + math.exp(-z))

def neuron_grads(w, b, x, t):
    ...
`,
      solution: `import math


def sigmoid(z):
    return 1 / (1 + math.exp(-z))


def neuron_grads(w, b, x, t):
    s = sigmoid(w * x + b)
    common = 2 * (s - t) * s * (1 - s)
    return common * x, common
`,
      tests: `def loss(w, b, x, t):
    return (sigmoid(w * x + b) - t) ** 2

def numeric(w, b, x, t, h=1e-6):
    dw = (loss(w + h, b, x, t) - loss(w - h, b, x, t)) / (2 * h)
    db = (loss(w, b + h, x, t) - loss(w, b - h, x, t)) / (2 * h)
    return dw, db

cases = [
    (0.5, -0.2, 2.0, 1.0),
    (0.0, 0.0, 1.0, 1.0),
    (-1.5, 0.7, 0.3, 0.0),
    (2.0, 1.0, -1.0, 1.0),
    (3.0, -2.0, 0.5, 0.5),
]
for case in cases:
    dw, db = neuron_grads(*case)
    ndw, ndb = numeric(*case)
    assert abs(dw - ndw) < 1e-6, (case, dw, ndw)
    assert abs(db - ndb) < 1e-6, (case, db, ndb)

dw, db = neuron_grads(0.0, 0.0, 1.0, 1.0)
assert abs(dw - (-0.25)) < 1e-12 and abs(db - dw) < 1e-12
dw, db = neuron_grads(0.5, 0.5, 0.0, 0.7)
assert dw == 0.0 and db != 0.0
assert isinstance(neuron_grads(1.0, 1.0, 1.0, 1.0), tuple)`,
      checks: ['Returns \`(dL_dw, dL_db)\` as a tuple', 'Uses \`2(s - t) · s(1 - s)\` times \`x\` (weight) or \`1\` (bias)', 'Matches numerical differentiation for several inputs'],
      hint: 'Compute `s = sigmoid(w * x + b)` once, then `common = 2 * (s - t) * s * (1 - s)`. The weight gradient is `common * x` and the bias gradient is `common`.',
      explanation: 'Each factor is one link of the chain: `2(s − t)` for the loss, `s(1 − s)` for the sigmoid and `x` or `1` for the linear part. Comparing with a numerical derivative (as the tests do) is the standard way to prove a gradient correct. Backpropagation does exactly this for millions of neurons.',
    },
  ],
  takeaways: [
    'The **derivative** is the slope of a function: how fast the output changes when the input is nudged. You can always estimate it numerically with a central difference `(f(x+h) − f(x−h)) / 2h`.',
    '**Gradient descent** learns by stepping against the slope of the loss: `w ← w − η·L′(w)`. The learning rate `η` must be tuned: too small is slow, too large overshoots and diverges.',
    'With many parameters the slopes form the **gradient**, the vector of partial derivatives. It points steepest uphill, so descent subtracts it from the whole parameter vector.',
    'The **chain rule** multiplies local slopes along a chain: `dy/dx = dy/du · du/dx`. Backpropagation is the chain rule applied backwards through a network, which is how all the gradients are computed efficiently.',
    'Always **check gradients numerically** when you write one by hand: a small mistake in a derivative produces a model that trains badly without any error message.',
  ],
  reading: [
    { title: 'Essence of Calculus (3Blue1Brown)', url: 'https://www.3blue1brown.com/topics/calculus', source: 'video', note: 'A visual series on derivatives, the chain rule and the intuition behind them.' },
    { title: 'Neural Networks: Backpropagation calculus (3Blue1Brown)', url: 'https://www.3blue1brown.com/lessons/backpropagation-calculus', source: 'video', note: 'The chain rule applied to a tiny neural network, step by step.' },
    { title: 'Mathematics for Machine Learning — Vector Calculus', url: 'https://mml-book.com/', source: 'book', note: 'Chapter 5 covers partial derivatives, gradients and the chain rule with ML in mind.' },
    { title: 'An overview of gradient descent optimization algorithms (Sebastian Ruder)', url: 'https://www.ruder.io/optimizing-gradient-descent/', source: 'article', note: 'A readable tour of momentum, RMSprop and Adam, for when you want to go beyond plain gradient descent.' },
  ],
};
