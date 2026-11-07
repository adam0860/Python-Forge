import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-transformers',
  title: 'Attention and Transformers',
  summary: 'The architecture behind every modern language model. Build scaled dot-product attention in NumPy, add masks, heads and positions, assemble a transformer block in PyTorch, and train a tiny GPT that writes text.',
  minutes: 28,
  objectives: [
    'Explain attention as a soft lookup with queries, keys and values, and compute it with scaled dot-product attention',
    'Explain self-attention, the causal mask, multiple heads and positional encoding',
    'Describe a transformer block (attention, MLP, residual connections, layer norm) and count its parameters',
    'Compare transformers with RNNs, including the quadratic cost of attention',
    'Train a small decoder-only transformer language model and explain how GPT-style models generate text',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Attention: a soft dictionary lookup',
      blocks: [
        {
          type: 'p',
          text: 'The last lesson ended with a problem: an RNN squeezes everything it has read into one hidden vector, passed along one step at a time, so distant information fades and training cannot be parallelized. **Attention** (Bahdanau 2014, then "Attention Is All You Need", 2017) removes the bottleneck: instead of remembering, let every position *look back* directly at every other position and pick up exactly what it needs.',
        },
        {
          type: 'p',
          text: 'The mechanism is a **soft dictionary lookup**. A normal dictionary compares your query with its keys and returns the *one* matching value. Attention compares a **query** with *every* **key**, turns the similarities into weights that sum to 1 (a softmax), and returns the **weighted average of all the values**. So a position that is "asking" about, say, the subject of a sentence receives mostly the value from the subject word and a little from the others. Each token produces a query ("what am I looking for?"), a key ("what do I contain?") and a value ("what will I tell you if you attend to me?").',
        },
        {
          type: 'math',
          tex: '\\text{Attention}(Q, K, V) = \\operatorname{softmax}\\!\\left(\\frac{Q K^{\\top}}{\\sqrt{d_k}}\\right) V',
          caption: 'Scaled dot-product attention. Row i of QKᵀ holds the similarity of query i with every key; the softmax turns each row into weights; multiplying by V mixes the values.',
        },
        {
          type: 'p',
          text: 'The `√d_k` (the square root of the key dimension) is a scaling fix: the dot product of two random vectors of length `d` has variance proportional to `d`, so for large `d` the scores become huge, the softmax saturates into an almost one-hot choice and its gradients vanish. Dividing by `√d_k` keeps the scores at a sensible size. Here is the whole mechanism in a few lines of NumPy, on three tokens with two-dimensional vectors:',
        },
        {
          type: 'code',
          title: 'attention_numpy.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

def softmax(z):
    z = z - z.max(axis=-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

def attention(Q, K, V, causal=False):
    d = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d)
    if causal:
        scores = np.where(np.tril(np.ones_like(scores)) == 1, scores, -1e9)
    w = softmax(scores)
    return w @ V, w

Q = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
K = Q.copy()
V = np.array([[10.0, 0.0], [0.0, 10.0], [5.0, 5.0]])
out, w = attention(Q, K, V)
print(np.round(w, 2).tolist())
print(np.round(out[0], 2).tolist(), bool(np.allclose(w.sum(axis=1), 1)))
out_c, w_c = attention(Q, K, V, causal=True)
print(np.round(w_c, 2).tolist())
print(np.round(out_c[0], 2).tolist())`,
          output: `[[0.4, 0.2, 0.4], [0.2, 0.4, 0.4], [0.25, 0.25, 0.5]]
[6.02, 3.98] True
[[1.0, 0.0, 0.0], [0.33, 0.67, 0.0], [0.25, 0.25, 0.5]]
[10.0, 0.0]`,
          annotations: [
            { lines: '3-6', text: 'A numerically stable softmax over the last axis: subtracting the row maximum changes nothing mathematically but prevents `exp` from overflowing.' },
            { lines: '8-14', text: 'Attention in four lines: scores `Q Kᵀ / √d` (every query against every key), optional mask, softmax into weights, and a weighted average of the values `w @ V`. It returns the output and the weights.' },
            { lines: '16-18', text: 'Three tokens. For simplicity the keys equal the queries, and each token carries a different value vector.' },
            { lines: '19-21', text: 'Each row of weights sums to 1. Token 0 (query `[1, 0]`) attends 40% to itself, 20% to token 1 and 40% to token 2 (whose key `[1, 1]` also contains its direction), so its output is the blend `[6.02, 3.98]`.' },
            { lines: '22-24', text: 'With the **causal mask** a token cannot look at later tokens: token 0 can only see itself (weight 1, output equal to its own value `[10, 0]`), token 1 sees tokens 0 and 1, and so on. The weights above the diagonal are exactly 0.' },
          ],
        },
        {
          type: 'callout',
          variant: 'analogy',
          title: 'A search engine inside the network',
          text: 'Think of a search: the query is what you type, the keys are the page titles, the values are the page contents. A search engine ranks titles by similarity to your query and shows you the most relevant contents. Attention does the same thing, but softly (you get a weighted mix of *all* pages), differentiably (so gradients can teach the network what to search for), and for every token in parallel.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why does scaled dot-product attention divide the scores `Q Kᵀ` by `√d_k` before the softmax?',
      options: [
        { text: 'The scores grow with the key dimension, which would saturate the softmax into near one-hot weights with vanishing gradients; dividing keeps them at a moderate size', correct: true, why: 'The dot product of two random d-dimensional vectors has variance proportional to d, so for large d the softmax inputs are extreme and its gradient almost zero.' },
        { text: 'It makes each row of weights add up to 1', why: 'The softmax already guarantees that. The scaling only controls how sharp (peaked) the softmax is.' },
        { text: 'It applies the causal mask', why: 'Masking is done separately by setting future scores to −∞ before the softmax; scaling has no effect on which positions are visible.' },
        { text: 'It reduces the sequence length', why: 'The number of positions is unchanged; only the magnitude of the scores changes.' },
      ],
      explanation: 'Without the `1/√d_k` factor, large key dimensions make the softmax extremely peaked, so training becomes unstable; the scaling keeps the scores at a stable size.',
    },
    {
      kind: 'concept',
      title: 'Self-attention, masks, heads and positions',
      blocks: [
        {
          type: 'p',
          text: 'In **self-attention** the queries, keys and values all come from the *same* sequence: each token vector `x` is multiplied by three learned matrices to give `q = xW_Q`, `k = xW_K` and `v = xW_V`. Every token can therefore gather information from every other token in *one* step, however far apart they are: the path between any two positions has length 1, compared with up to `T` steps in an RNN. And since all positions are computed together with matrix multiplications, a GPU processes the whole sequence in parallel.',
        },
        {
          type: 'list',
          items: [
            '**Causal mask.** For next-token prediction (GPT-style models) position `t` must not see the future, or it could simply copy the answer. The mask sets the scores of later positions to −∞, which the softmax turns into weight 0 (as in the NumPy example). Models that only *read* (like BERT) skip the mask and let every token see both sides.',
            '**Multiple heads.** One attention pattern is not enough: a token may need to look at the previous word for grammar, a distant noun for meaning and a bracket for syntax. **Multi-head attention** splits the vector into several smaller parts (say 8 heads of 64 numbers from a 512-vector), runs attention separately in each, then concatenates the results and mixes them with a final linear layer. Each head can learn a different relationship, at the same total cost.',
            '**Positional encoding.** Attention itself is *order blind*: shuffle the tokens and each token still sees the same set of keys. To restore order, a vector that depends on the position is **added** to each token embedding. The original paper used fixed sinusoids at many frequencies (below); GPT-style models usually learn a position embedding table (`nn.Embedding(max_length, d)`); modern models often use rotary embeddings (RoPE), which rotate queries and keys by an angle depending on position.',
          ],
        },
        {
          type: 'math',
          tex: 'PE_{(pos,\\,2i)} = \\sin\\!\\left(\\frac{pos}{10000^{2i/d}}\\right), \\qquad PE_{(pos,\\,2i+1)} = \\cos\\!\\left(\\frac{pos}{10000^{2i/d}}\\right)',
          caption: 'Sinusoidal positional encoding. Even dimensions use sines and odd dimensions cosines, with wavelengths from 2π up to 10000·2π, like the digits of a number that change at different speeds.',
        },
        {
          type: 'table',
          headers: ['Property', 'RNN / LSTM', 'Transformer'],
          rows: [
            ['Path between distant tokens', 'Up to `T` steps (fades)', '1 step (direct)'],
            ['Parallel over the sequence', 'No: step by step', 'Yes: one matrix product'],
            ['Cost for sequence length `T`', '`O(T)` memory and time', '`O(T²)` for the attention matrix'],
            ['Remembers beyond its window', 'In principle, via the state', 'No: only what fits in the context window'],
            ['Typical use today', 'Small, streaming or on-device models; RL agents', 'Language, vision, audio, almost everything large'],
          ],
          caption: 'Transformers trade quadratic cost for direct access and parallel training. That quadratic term is why context windows are limited and long contexts are expensive.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Doubling the length of the input sequence roughly quadruples the size of the attention score matrix, because every token is compared with every other token.',
      answer: true,
      explanation: 'True. The score matrix is `T × T`, so doubling `T` makes it 4 times larger in memory and computation. This quadratic scaling is the main reason context windows are limited, and why techniques such as FlashAttention, sparse attention and sliding windows exist.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output (the causal mask for a sequence of three tokens: 1 means "may attend").',
      code: `import torch

print(torch.tril(torch.ones(3, 3, dtype=torch.int)).tolist())`,
      answer: '[[1, 0, 0], [1, 1, 0], [1, 1, 1]]',
      hint: '`tril` keeps the lower triangle (including the diagonal) and zeroes the rest.',
      explanation: 'Row `t` has ones for positions `0 … t`: token 0 sees only itself, token 1 sees tokens 0 and 1, token 2 sees all three. Zeros above the diagonal become `−inf` scores and weight 0.',
    },
    {
      kind: 'concept',
      title: 'The transformer block',
      blocks: [
        {
          type: 'p',
          text: 'A transformer is a **stack of identical blocks**. Each block has two sub-layers, each wrapped in the tricks from the previous lesson: **(1)** multi-head self-attention, which moves information *between* positions, and **(2)** a position-wise **MLP** (two linear layers with a GELU in between, expanding the width by 4× and shrinking it back), which processes each position *independently* and holds much of the model’s stored knowledge. Both sub-layers use a **residual connection** (`x + f(x)`) and **layer normalization**. In the common "pre-norm" form: `x = x + Attention(LN(x))`, then `x = x + MLP(LN(x))`.',
        },
        {
          type: 'code',
          title: 'transformer_block.py',
          desktopOnly: true,
          code: `import torch
from torch import nn
import torch.nn.functional as F

class SelfAttention(nn.Module):
    def __init__(self, d_model, n_heads):
        super().__init__()
        self.h = n_heads
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.proj = nn.Linear(d_model, d_model)
    def forward(self, x):
        B, T, C = x.shape
        q, k, v = self.qkv(x).chunk(3, dim=-1)
        q, k, v = (t.view(B, T, self.h, C // self.h).transpose(1, 2) for t in (q, k, v))
        att = (q @ k.transpose(-2, -1)) / (C // self.h) ** 0.5
        mask = torch.tril(torch.ones(T, T, dtype=torch.bool))
        att = att.masked_fill(~mask, float("-inf"))
        out = F.softmax(att, dim=-1) @ v
        return self.proj(out.transpose(1, 2).reshape(B, T, C))

class Block(nn.Module):
    def __init__(self, d, h):
        super().__init__()
        self.ln1, self.ln2 = nn.LayerNorm(d), nn.LayerNorm(d)
        self.attn = SelfAttention(d, h)
        self.mlp = nn.Sequential(nn.Linear(d, 4 * d), nn.GELU(), nn.Linear(4 * d, d))
    def forward(self, x):
        x = x + self.attn(self.ln1(x))
        return x + self.mlp(self.ln2(x))

blk = Block(32, 4)
x = torch.randn(2, 10, 32)
print(tuple(blk(x).shape), sum(p.numel() for p in blk.parameters()))
y1 = blk(x)
x2 = x.clone(); x2[:, 7:] += 1.0
y2 = blk(x2)
print(torch.allclose(y1[:, :7], y2[:, :7], atol=1e-5), torch.allclose(y1[:, 7:], y2[:, 7:], atol=1e-5))`,
          output: `(2, 10, 32) 12704
True False`,
          annotations: [
            { lines: '5-10', text: 'The attention layer’s weights: **one** linear layer produces the queries, keys and values for all heads at once (`3 × d_model` outputs), and a final linear layer `proj` mixes the heads’ results back together.' },
            { lines: '11-14', text: 'Project, split into `q`, `k`, `v`, then reshape each from `(B, T, C)` to `(B, heads, T, C/heads)`: every head works on its own slice of the vector.' },
            { lines: 15, text: 'The scores for every head: `q kᵀ / √(head size)`, a `(T × T)` matrix per head per batch element.' },
            { lines: '16-17', text: 'The **causal mask**: a lower-triangular boolean matrix; future positions get `−inf`, so the softmax gives them weight 0.' },
            { lines: '18-19', text: 'Softmax over the keys (`dim=-1`), weighted sum of the values, then merge the heads back into one vector per token and apply `proj`.' },
            { lines: '21-26', text: 'A **block**: two layer norms, the attention layer and an MLP that widens by 4× (`d → 4d → d`) with a GELU.' },
            { lines: '27-29', text: 'The pre-norm residual pattern: `x + attention(norm(x))`, then `x + mlp(norm(x))`. The block maps `(B, T, d)` to `(B, T, d)`, so blocks stack freely.' },
            { lines: '31-33', text: 'A batch of 2 sequences of 10 tokens through a 32-wide block with 4 heads keeps its shape. The block has **12,704 parameters**: attention `3,168 + 1,056`, MLP `4,224 + 4,128` and two layer norms `128`. For a width `d` that is close to `12·d²` (4d² for attention and 8d² for the MLP).' },
            { lines: '34-37', text: 'A **causality test**: add 1 to every feature of tokens 7 to 9 and compare. Outputs for tokens 0 to 6 are unchanged (`True`), because they cannot see the future, while the outputs for the changed tokens differ (`False`). Run this test on any language model you build: a leak of future information makes the training loss look wonderful and the model useless.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why the MLP and the residuals matter',
          text: 'Attention only *mixes* vectors; it is a weighted average, so by itself it computes nothing non-linear. The MLP supplies the non-linearity and, with its wide hidden layer, most of the parameters (two thirds of every block). The **residual stream** `x`, passed along unchanged except for small additions from each sub-layer, is what lets 12, 48 or 100 blocks train at all: it is the same skip-connection idea that made ResNets deep, and every layer reads from and writes to it. Many researchers picture a transformer as a shared notebook that each block reads and annotates.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the scaling in the attention scores (the square root of the key dimension `d`).',
      template: `scores = Q @ K.T / np.___(d)`,
      templateIsCode: true,
      blanks: [{ answers: ['sqrt'] }],
      wordBank: ['sqrt', 'log', 'exp', 'abs'],
      explanation: 'Scores are divided by `np.sqrt(d)`. `log` or `exp` would distort the similarities, and `abs` would remove the sign that distinguishes matching from opposite directions.',
    },
    {
      kind: 'error',
      prompt: 'This attention code mixes the wrong things: the softmax normalizes along the wrong axis. Tap the faulty line.',
      lines: [
        'scores = q @ k.transpose(-2, -1) / d ** 0.5',
        'weights = torch.softmax(scores, dim=0)',
        'out = weights @ v',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The scores matrix has one row per query and one column per key, and the softmax must normalize over the **keys** (the last dimension, `dim=-1`) so that each query’s weights sum to 1. With `dim=0` the weights are normalized over the wrong axis (across queries, or even across the batch), and the output is garbage.',
    },
    {
      kind: 'numeric',
      prompt: 'A transformer block with model width `d = 256` has roughly `12·d²` weights (attention `4d²` plus the MLP `8d²`, ignoring biases and layer norms). About how many parameters is that for one block?',
      answer: '786432',
      hint: '`d² = 65,536`. Multiply by 12.',
      explanation: '256² = 65,536 and 12 × 65,536 = 786,432. A 12-block model of this width would have about 9.4 million block parameters, plus the embeddings: the same estimate scales up to the billions of parameters in large language models.',
      label: 'Parameters:',
    },
    {
      kind: 'concept',
      title: 'A tiny GPT, and the big picture',
      blocks: [
        {
          type: 'p',
          text: 'Put it all together and you have **GPT** (Generative Pre-trained Transformer): token embeddings plus position embeddings, a stack of causal transformer blocks, a final layer norm, and a linear layer that outputs a score for every token in the vocabulary, trained to predict the next token. Generation repeats one step: run the model on the context so far, pick the next token, append it, and go again. The listing below does exactly that with PyTorch’s built-in `TransformerEncoderLayer` (which implements the block above) on the same pangram as the LSTM lesson.',
        },
        {
          type: 'code',
          title: 'tiny_gpt.py',
          desktopOnly: true,
          outputVaries: true,
          code: `import torch
from torch import nn
import torch.nn.functional as F

text = "the quick brown fox jumps over the lazy dog. " * 20
vocab = sorted(set(text))
stoi = {c: i for i, c in enumerate(vocab)}
itos = {i: c for c, i in stoi.items()}
data = torch.tensor([stoi[c] for c in text])
T = 16

class TinyGPT(nn.Module):
    def __init__(self, V, d=32):
        super().__init__()
        self.tok = nn.Embedding(V, d)
        self.pos = nn.Embedding(T, d)
        layer = nn.TransformerEncoderLayer(d, nhead=4, dim_feedforward=4 * d, dropout=0.0,
                                           activation="gelu", batch_first=True, norm_first=True)
        self.blocks = nn.TransformerEncoder(layer, num_layers=2, enable_nested_tensor=False)
        self.ln = nn.LayerNorm(d)
        self.head = nn.Linear(d, V)
    def forward(self, idx):
        t = idx.shape[1]
        x = self.tok(idx) + self.pos(torch.arange(t))
        mask = nn.Transformer.generate_square_subsequent_mask(t)
        return self.head(self.ln(self.blocks(x, mask=mask, is_causal=True)))

torch.manual_seed(0)
model = TinyGPT(len(vocab))
opt = torch.optim.AdamW(model.parameters(), lr=3e-3)
starts = torch.arange(0, len(data) - T - 1)
for step in range(1, 301):
    s = starts[torch.randint(0, len(starts), (64,))]
    X = torch.stack([data[i:i + T] for i in s])
    Y = torch.stack([data[i + 1:i + T + 1] for i in s])
    loss = F.cross_entropy(model(X).reshape(-1, len(vocab)), Y.reshape(-1))
    opt.zero_grad(); loss.backward(); opt.step()
    if step in (1, 100, 300):
        print(step, round(loss.item(), 3))
idx = torch.tensor([[stoi["t"]]])
model.eval()
with torch.no_grad():
    for _ in range(60):
        logits = model(idx[:, -T:])
        idx = torch.cat([idx, logits[:, -1].argmax(-1, keepdim=True)], dim=1)
print("".join(itos[i] for i in idx[0].tolist()))`,
          output: `1 3.496
100 0.082
300 0.053
the lazy dog. the quick brown fox jumps over the lazy dog. th`,
          annotations: [
            { lines: '5-10', text: 'The same data as the LSTM lesson: a character vocabulary and a toy corpus (one pangram repeated). The context length `T = 16` is this model’s **context window**.' },
            { lines: '12-21', text: 'The model: a token embedding, a **learned position embedding**, two pre-norm transformer blocks (heads = 4, MLP width 4×, no dropout for this tiny task), a final layer norm and a linear layer producing a score for each character.' },
            { lines: '22-26', text: '`forward` adds each token’s position embedding to its token embedding, builds the **causal mask**, runs the blocks, and returns scores for the next token at *every* position (a `T`-fold training signal from each window).' },
            { lines: '28-39', text: 'Train on random windows with AdamW: the loss drops from 3.5 (about `ln 33`, a uniform guess over 33 characters) to about 0.05 in 300 steps, a few seconds on a CPU.' },
            { lines: '40-46', text: 'Generation: no recurrent state is carried. At each step the model re-reads the last `T` tokens, and we append its most likely next character. (Real systems cache the keys and values of earlier tokens, the **KV cache**, to avoid recomputing them.) The text and exact losses vary slightly by version.' },
          ],
        },
        {
          type: 'table',
          headers: ['Family', 'Attention', 'Trained to', 'Examples', 'Good for'],
          rows: [
            ['**Decoder-only**', 'Causal (left to right)', 'Predict the next token', 'GPT, Claude, Llama, Gemma', 'Chat, writing, code, in-context learning'],
            ['**Encoder-only**', 'Full (both directions)', 'Fill in masked tokens', 'BERT, RoBERTa', 'Classification, search, embeddings'],
            ['**Encoder-decoder**', 'Full in the encoder, causal in the decoder', 'Map an input sequence to an output sequence', 'T5, the original transformer', 'Translation, summarization'],
            ['**Vision transformer**', 'Full over image patches', 'Classify images', 'ViT, CLIP', 'Images, as an alternative to CNNs'],
          ],
          caption: 'The transformer families. Almost all large language models today are decoder-only.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Transformers and game AI',
          text: 'Language models can drive **NPC dialogue**, quest text and dynamic narrative (a later lesson calls such models through an API). Transformers over game *state* work too: the **Decision Transformer** treats trajectories of (return, state, action) as a sequence, and attention over a *set* of entities (units, enemies, pickups) is how large game agents such as OpenAI Five and AlphaStar processed variable numbers of objects. For plain reinforcement learning on small state vectors, however, transformers are often harder to train than an MLP or LSTM, so reach for them when the problem is genuinely about long sequences or sets, not by default.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'Attention Is All You Need',
          text: 'Eight Google researchers published the transformer in 2017 for machine translation. Within two years BERT (2018) and GPT-2 (2019) showed that pre-training a transformer on huge amounts of raw text and then adapting it works astonishingly well, and scaling it up (GPT-3, 2020, with 175 billion parameters) produced models that follow instructions from a few examples. Chat assistants, code assistants and image generators followed. Almost every model in the news since then is a transformer or a close relative, built from the block you just wrote.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises: scaled dot-product attention with an optional causal mask, the sinusoidal positional encoding, and the head-splitting reshape that multi-head attention depends on.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `attention(Q, K, V, causal=False)` for 2-D NumPy arrays `Q` `(Tq, d)`, `K` `(Tk, d)` and `V` `(Tk, dv)`. Compute `scores = Q @ K.T / sqrt(d)`. If `causal` is true (then `Tq == Tk`), set every score above the diagonal to `-inf` before the softmax. Apply a **numerically stable** softmax along each row (subtract the row maximum first). Return `(output, weights)` where `output = weights @ V`.',
      starter: `import numpy as np

def attention(Q, K, V, causal=False):
    ...
`,
      solution: `import numpy as np


def attention(Q, K, V, causal=False):
    Q, K, V = (np.asarray(a, dtype=float) for a in (Q, K, V))
    d = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d)
    if causal:
        future = np.triu(np.ones(scores.shape, dtype=bool), k=1)
        scores = np.where(future, -np.inf, scores)
    scores = scores - scores.max(axis=-1, keepdims=True)
    e = np.exp(scores)
    weights = e / e.sum(axis=-1, keepdims=True)
    return weights @ V, weights
`,
      tests: `import numpy as np

Q = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
K = Q.copy()
V = np.array([[10.0, 0.0], [0.0, 10.0], [5.0, 5.0]])
out, w = attention(Q, K, V)
assert out.shape == (3, 2) and w.shape == (3, 3)
assert np.allclose(w, [[0.40, 0.20, 0.40], [0.20, 0.40, 0.40], [0.25, 0.25, 0.50]], atol=0.01)
assert np.allclose(w.sum(axis=1), 1.0)
assert np.allclose(out, w @ V)
assert np.allclose(out[0], [6.02, 3.98], atol=0.02)

out_c, w_c = attention(Q, K, V, causal=True)
assert np.allclose(w_c, [[1, 0, 0], [0.33, 0.67, 0], [0.25, 0.25, 0.5]], atol=0.01)
assert np.allclose(np.triu(w_c, k=1), 0.0)
assert np.allclose(out_c[0], V[0])
assert np.allclose(w_c.sum(axis=1), 1.0)

assert np.allclose(attention(Q, K, np.eye(3))[0], w)
big = attention(Q * 1000, K * 1000, V)[0]
assert np.all(np.isfinite(big))
single_q = attention(Q[:1], K, V)
assert single_q[0].shape == (1, 2) and single_q[1].shape == (1, 3)
u = np.zeros((4, 2))
uw = attention(u, u, np.arange(8.0).reshape(4, 2))[1]
assert np.allclose(uw, 0.25)
rng = np.random.default_rng(0)
A = rng.normal(size=(5, 8))
o1, _ = attention(A, A, A, causal=True)
B = A.copy(); B[3:] += 5.0
o2, _ = attention(B, B, B, causal=True)
assert np.allclose(o1[:3], o2[:3])`,
      packages: ['numpy'],
      checks: ['Scores are `Q @ K.T / sqrt(d)`; each row of weights sums to 1 (stable softmax, no overflow for large scores)', 'With `causal=True` every weight above the diagonal is exactly 0, so the first token only attends to itself', 'Returns `(output, weights)` with `output = weights @ V`; changing later tokens does not change earlier causal outputs'],
      hint: 'After computing `scores`, build the future mask with `np.triu(np.ones(scores.shape, dtype=bool), k=1)` and use `np.where(future, -np.inf, scores)`. Then `scores - scores.max(axis=-1, keepdims=True)`, exponentiate and divide by the row sums.',
      explanation: 'These ten lines are the core of every transformer. The last test is the causality check from the PyTorch listing, in NumPy: changing tokens 3 and later cannot affect outputs 0 to 2. PyTorch adds the learned projections that create `Q`, `K` and `V`, runs many heads in parallel and does everything in batches on a GPU.',
    },
    {
      kind: 'code',
      prompt: 'Write `positional_encoding(T, d)` returning a `(T, d)` NumPy array of sinusoidal position encodings: `pe[pos, 2i] = sin(pos / 10000**(2i/d))` and `pe[pos, 2i+1] = cos(pos / 10000**(2i/d))`. `d` must be even; raise `ValueError` otherwise.',
      starter: `import numpy as np

def positional_encoding(T, d):
    ...
`,
      solution: `import numpy as np


def positional_encoding(T, d):
    if d % 2 != 0:
        raise ValueError("d must be even")
    pos = np.arange(T)[:, None]
    i = np.arange(d // 2)[None, :]
    angle = pos / (10000.0 ** (2 * i / d))
    pe = np.zeros((T, d))
    pe[:, 0::2] = np.sin(angle)
    pe[:, 1::2] = np.cos(angle)
    return pe
`,
      tests: `import numpy as np
import math

pe = positional_encoding(4, 4)
assert pe.shape == (4, 4)
assert np.allclose(pe[0], [0, 1, 0, 1])
assert np.allclose(pe[1], [math.sin(1), math.cos(1), math.sin(0.01), math.cos(0.01)])
assert np.allclose(pe[3, 0], math.sin(3))
assert np.allclose(pe[2, 3], math.cos(2 / 10000 ** 0.5))

big = positional_encoding(50, 16)
assert big.shape == (50, 16)
assert np.all(np.abs(big) <= 1.0)
assert np.allclose(big[:, 0] ** 2 + big[:, 1] ** 2, 1.0)
assert len({tuple(np.round(r, 6)) for r in big}) == 50
assert positional_encoding(0, 6).shape == (0, 6)
for bad in (3, 5, 7):
    try:
        positional_encoding(4, bad)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      packages: ['numpy'],
      checks: ['Even columns hold `sin(pos / 10000**(2i/d))` and odd columns the matching `cos`', 'Row 0 is `[0, 1, 0, 1, …]`; every value lies in `[-1, 1]` and every position gets a distinct row', 'Raises `ValueError` for odd `d`'],
      hint: '`pos = np.arange(T)[:, None]` and `i = np.arange(d // 2)[None, :]` broadcast into a `(T, d/2)` array of angles; assign `np.sin(angle)` to `pe[:, 0::2]` and `np.cos(angle)` to `pe[:, 1::2]`.',
      explanation: 'Low dimensions oscillate quickly with the position and high dimensions slowly, like the units, tens and hundreds digits of a counter. Every position therefore gets a unique fingerprint, and because `sin` and `cos` of a shifted angle are linear in the originals, the model can easily learn to attend to "the token 3 positions back".',
    },
    {
      kind: 'code',
      prompt: 'Multi-head attention splits each token vector into heads. Write `split_heads(x, n_heads)` for a NumPy array `x` of shape `(T, d)`: return an array of shape `(n_heads, T, d // n_heads)` where head `h` holds columns `h*dh … (h+1)*dh - 1` (with `dh = d // n_heads`). Raise `ValueError` if `d` is not divisible by `n_heads`. Also write `merge_heads(x)`, the exact inverse mapping `(n_heads, T, dh)` back to `(T, n_heads*dh)`.',
      starter: `import numpy as np

def split_heads(x, n_heads):
    ...

def merge_heads(x):
    ...
`,
      solution: `import numpy as np


def split_heads(x, n_heads):
    x = np.asarray(x)
    T, d = x.shape
    if d % n_heads != 0:
        raise ValueError("d must be divisible by n_heads")
    return x.reshape(T, n_heads, d // n_heads).transpose(1, 0, 2)


def merge_heads(x):
    x = np.asarray(x)
    n_heads, T, dh = x.shape
    return x.transpose(1, 0, 2).reshape(T, n_heads * dh)
`,
      tests: `import numpy as np

x = np.arange(24).reshape(3, 8)
h = split_heads(x, 2)
assert h.shape == (2, 3, 4)
assert np.array_equal(h[0], x[:, :4]) and np.array_equal(h[1], x[:, 4:])
assert np.array_equal(merge_heads(h), x)

h4 = split_heads(x, 4)
assert h4.shape == (4, 3, 2)
assert np.array_equal(h4[2], x[:, 4:6])
assert np.array_equal(merge_heads(h4), x)
assert np.array_equal(split_heads(x, 1)[0], x)
assert np.array_equal(split_heads(x, 8)[7], x[:, 7:8])

rng = np.random.default_rng(0)
y = rng.normal(size=(5, 12))
for n in (1, 2, 3, 4, 6, 12):
    assert np.array_equal(merge_heads(split_heads(y, n)), y)

before = x.copy()
split_heads(x, 2)
assert np.array_equal(x, before)
for bad in (3, 5):
    try:
        split_heads(x, bad)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")`,
      packages: ['numpy'],
      checks: ['`split_heads` reshapes `(T, d)` into `(T, n_heads, dh)` and moves the head axis first, giving `(n_heads, T, dh)` with contiguous column blocks per head', '`merge_heads` is the exact inverse (round trip returns the original array for every valid head count)', 'Raises `ValueError` when `d` is not divisible by `n_heads`; does not modify the input'],
      hint: '`x.reshape(T, n_heads, d // n_heads)` groups the columns into heads; `.transpose(1, 0, 2)` moves the head axis to the front. `merge_heads` reverses both steps: transpose back to `(T, n_heads, dh)` and reshape to `(T, n_heads * dh)`.',
      explanation: 'This reshape is the only thing that distinguishes multi-head from single-head attention: the heads are just independent slices of the same vectors, attention runs on each slice, and `merge_heads` glues them back together before the final projection. In PyTorch it is the `.view(...).transpose(1, 2)` line in the listing.',
    },
  ],
  takeaways: [
    '**Attention** is a differentiable soft lookup: `softmax(Q Kᵀ / √d) V`. Each token’s query is compared with every key, the similarities become weights, and the output is the weighted average of the values. The `√d` scaling keeps the softmax from saturating.',
    '**Self-attention** takes Q, K and V from the same sequence, so any two tokens interact in one step and the whole sequence is computed in parallel. A **causal mask** hides the future for next-token models; **multiple heads** learn different relationships; **positional encodings** restore the word order that attention ignores.',
    'A **transformer block** is `x + Attention(LN(x))` then `x + MLP(LN(x))`: residual connections and layer norm around attention and a 4×-wide MLP. A block has about `12·d²` parameters, and blocks stack freely.',
    'Attention costs `O(T²)` in the sequence length, which limits context windows, but gives direct long-range access and parallel training, which is why transformers replaced RNNs for language, vision and audio.',
    '**GPT-style** models are decoder-only transformers trained to predict the next token and generate by repeatedly appending their own output. For games, transformers shine on language and on sets of entities; for small-state RL an MLP or LSTM is often the better start.',
  ],
  reading: [
    { title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', source: 'paper', note: 'The 2017 paper that introduced the transformer; short and very readable.' },
    { title: 'Jay Alammar: The Illustrated Transformer', url: 'https://jalammar.github.io/illustrated-transformer/', source: 'article', note: 'The best visual walkthrough of attention, heads and the full architecture.' },
    { title: 'Andrej Karpathy: Let’s build GPT from scratch (video)', url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY', source: 'video', note: 'Two hours building a character-level GPT in PyTorch, step by step. This lesson in full.' },
    { title: 'Hugging Face LLM Course', url: 'https://huggingface.co/learn/llm-course/', source: 'course', note: 'Using pretrained transformers in practice with the transformers library.' },
    { title: 'The Annotated Transformer (Harvard NLP)', url: 'https://nlp.seas.harvard.edu/annotated-transformer/', source: 'article', note: 'The original paper as runnable PyTorch code, line by line.' },
  ],
};
