import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-sequences',
  title: 'Sequence Models and Embeddings',
  summary: 'Teach a network to read text, logs and game histories: tokens and vocabularies, learned embeddings, recurrent networks written from scratch, LSTMs and GRUs, and a character-level language model that writes text.',
  minutes: 26,
  objectives: [
    'Turn text into token ids with a vocabulary, and explain character, word and subword tokenization',
    'Explain what an embedding is, why it beats one-hot vectors, and how similarity is measured with cosine similarity',
    'Write a recurrent network’s forward pass from scratch and explain the hidden state and weight sharing over time',
    'Explain why plain RNNs forget and how LSTM and GRU gates fix it, and read their PyTorch shapes',
    'Train a character-level LSTM and describe where recurrent networks are used in game AI',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Sequences, tokens and vocabularies',
      blocks: [
        {
          type: 'p',
          text: 'Not all data is a fixed-size table or an image. A sentence, an audio clip, a stock price history, the list of moves in a chess game and the last 200 frames of a player’s inputs are all **sequences**: ordered lists of varying length where *order carries meaning* ("dog bites man" is not "man bites dog"). A sequence model has to read the items one after another, remember what matters, and cope with different lengths.',
        },
        {
          type: 'p',
          text: 'Networks work on numbers, so text must be converted first. The pipeline is: **split** the text into units called **tokens**, build a **vocabulary** that gives each distinct token an integer id, and **encode** the text as a list of ids. Which unit you choose is a trade-off. **Characters** give a tiny vocabulary (about 100) and never meet an unknown token, but sequences get long. **Words** give short sequences but a huge vocabulary, and every word never seen in training is unknown. **Subwords** (byte-pair encoding, used by GPT-style models) split rare words into frequent pieces ("unbelievable" → "un", "believ", "able"), a compromise that handles any text with a vocabulary of tens of thousands.',
        },
        {
          type: 'code',
          title: 'tokenize.py',
          runnable: true,
          code: `text = "the cat sat on the mat"
vocab = sorted(set(text))
stoi = {ch: i for i, ch in enumerate(vocab)}
itos = {i: ch for ch, i in stoi.items()}
ids = [stoi[c] for c in "cat"]
print(vocab)
print(ids, "".join(itos[i] for i in ids))
words = text.split()
wvocab = {w: i for i, w in enumerate(sorted(set(words)))}
print(wvocab, [wvocab[w] for w in words])`,
          output: `[' ', 'a', 'c', 'e', 'h', 'm', 'n', 'o', 's', 't']
[2, 1, 9] cat
{'cat': 0, 'mat': 1, 'on': 2, 'sat': 3, 'the': 4} [4, 0, 3, 2, 4, 1]`,
          annotations: [
            { lines: '1-4', text: 'A **character vocabulary**: the sorted distinct characters of the text (10 here, including the space). `stoi` maps string to integer and `itos` maps back; you need both directions, one to feed the network and one to read its output.' },
            { lines: '5-7', text: 'Encode "cat" as `[2, 1, 9]` and decode it again, a lossless round trip.' },
            { lines: '8-10', text: 'The same text with a **word vocabulary**: 5 distinct words instead of 10 characters, and the six-word sentence becomes six ids instead of 22. A real system also reserves ids for `<pad>` (to pad batches) and `<unk>` (for words not seen in training).' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Game logs are text too',
          text: 'The same pipeline works for any discrete event stream. A log of player actions ("jump", "attack", "dodge", "attack"…) becomes a vocabulary of action ids; a level can be a sequence of tile ids; a combat log can be tokenized by event type. If you can list the distinct symbols, you can build a vocabulary, and everything else in this lesson applies.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You tokenize by whole words and train on a game chat corpus. At deployment a player types a word that never appeared in training. What happens, and what is the usual fix?',
      options: [
        { text: 'It has no id, so it must be mapped to a reserved `<unk>` token; subword or character tokenization avoids the problem', correct: true, why: 'A word vocabulary is closed. Reserving `<unk>` keeps the model running, and subword tokenization (or characters) can represent any string, which is why modern models use it.' },
        { text: 'The network automatically learns a new id for it', why: 'The embedding table and output layer have a fixed size set at training time; new ids cannot appear without retraining.' },
        { text: 'The word is ignored and the sentence becomes shorter, with no effect on the model', why: 'Dropping tokens silently changes the meaning of the sentence; an explicit `<unk>` at least tells the model something was there.' },
        { text: 'It is converted to the id 0, which always means "unknown"', why: 'Id 0 only means "unknown" if you *design* the vocabulary that way; otherwise it is just whichever word was first. You choose and reserve the special ids deliberately.' },
      ],
      explanation: 'Word vocabularies are closed, so unseen words need a reserved `<unk>` id; subword tokenization (byte-pair encoding) avoids the issue by splitting any word into known pieces.',
    },
    {
      kind: 'concept',
      title: 'Embeddings: ids that carry meaning',
      blocks: [
        {
          type: 'p',
          text: 'The id 4 for "the" and the id 3 for "sat" are labels, not quantities: 4 is not "bigger than" 3 in any meaningful way, so feeding raw ids into a network is a mistake. The classic fix, **one-hot encoding**, represents id `i` as a vector of zeros with a 1 in position `i`. It is correct but wasteful (a 50,000-word vocabulary means 50,000 numbers per word) and it places every word equally far from every other: "cat" is no more similar to "kitten" than to "tractor".',
        },
        {
          type: 'p',
          text: 'An **[[embedding|embedding]]** replaces the one-hot vector by a short dense vector (50 to 1,000 numbers) *learned during training*. Mathematically it is simply a lookup table: a matrix `E` with one row per token, where multiplying a one-hot vector by `E` just selects row `i`. In PyTorch this is `nn.Embedding(vocab_size, dim)`. Because the rows are trained by backpropagation along with everything else, tokens used in similar contexts end up with similar vectors, so *distance in the embedding space becomes meaning*. We measure closeness with **cosine similarity**, the cosine of the angle between two vectors: 1 for the same direction, 0 for unrelated, −1 for opposite.',
        },
        {
          type: 'code',
          title: 'embeddings_by_hand.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

vocab = ["king", "queen", "man", "woman", "apple"]
# hand-made 4-d vectors: (royalty, male, female, food)
E = np.array([
    [0.9, 0.8, 0.1, 0.0],
    [0.9, 0.1, 0.8, 0.0],
    [0.1, 0.8, 0.1, 0.0],
    [0.1, 0.1, 0.8, 0.0],
    [0.0, 0.0, 0.0, 0.9],
])
idx = {w: i for i, w in enumerate(vocab)}

def cosine(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

one_hot = np.eye(len(vocab))[idx["queen"]]
print(np.allclose(one_hot @ E, E[idx["queen"]]))
for w in ["queen", "man", "apple"]:
    print(w, round(cosine(E[idx["king"]], E[idx[w]]), 2))
v = E[idx["king"]] - E[idx["man"]] + E[idx["woman"]]
best = max((w for w in vocab if w not in ("king", "man", "woman")), key=lambda w: cosine(v, E[idx[w]]))
print(best)`,
          output: `True
queen 0.66
man 0.75
apple 0.0
queen`,
          annotations: [
            { lines: '3-12', text: 'An embedding matrix `E`: one row per word, four numbers per row. These vectors are **made up** so the dimensions are readable (royalty, male, female, food). In a trained model the dimensions are learned and rarely so tidy, but the geometry works the same way.' },
            { lines: '14-15', text: 'Cosine similarity: the dot product divided by the product of the lengths.' },
            { lines: '17-18', text: 'The key identity: a one-hot vector times `E` is exactly the row for that word, so an embedding layer is a lookup table (and much cheaper to compute by indexing than by a matrix product).' },
            { lines: '19-20', text: '"king" is close to "man" (0.75) and "queen" (0.66) because they share dimensions, and unrelated to "apple" (0.0).' },
            { lines: '21-23', text: 'The famous analogy `king − man + woman ≈ queen`: subtract the "male" direction, add the "female" direction, and the nearest remaining word is "queen". Real word-vector models (word2vec, 2013) learned directions like this from text alone.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Learned vectors beat hand-made features',
          text: 'You could try to design the features of a word by hand (is it royal? male? edible?), but you would never finish, and your list would miss patterns that matter. Training discovers whichever dimensions help predict the task. The same idea works well beyond words: embed **player ids**, **item ids**, **tile types**, **action ids** or **map regions** into small vectors, and let the network learn what makes them similar. Embeddings are the standard way to feed any categorical variable into a neural network.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'An `nn.Embedding(50, 8)` layer is just a trainable table with 50 rows of 8 numbers each; looking up token id 7 returns row 7.',
      answer: true,
      explanation: 'True. It stores a `50 × 8` weight matrix (400 parameters) that is updated by backpropagation like any other weight, and its forward pass is simply an index operation, equivalent to multiplying a one-hot vector by the matrix.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output (the shape of an embedding lookup for a batch of two sequences of three token ids).',
      code: `import torch
from torch import nn

emb = nn.Embedding(50, 8)
print(emb(torch.tensor([[1, 2, 3], [4, 5, 6]])).shape)`,
      answer: 'torch.Size([2, 3, 8])',
      hint: 'Each token id is replaced by a vector of length `embedding_dim`, so the shape gains one trailing dimension.',
      explanation: 'The `(2, 3)` grid of ids becomes a `(2, 3, 8)` tensor: every id is swapped for its 8-number row of the embedding table.',
    },
    {
      kind: 'concept',
      title: 'Recurrent networks and the hidden state',
      blocks: [
        {
          type: 'p',
          text: 'An MLP or CNN sees its whole input at once and has no memory between calls. A **recurrent neural network (RNN)** processes a sequence one item at a time while carrying a **hidden state** `h`: a vector summarizing everything seen so far. At each step it combines the new input with the previous state to produce the next one:',
        },
        {
          type: 'math',
          tex: 'h_t = \\tanh\\!\\left(W_x\\,x_t + W_h\\,h_{t-1} + b\\right)',
          caption: 'The RNN update. The same weights W_x, W_h and b are used at every time step; only h changes.',
        },
        {
          type: 'p',
          text: 'The crucial detail is **weight sharing over time**: one set of weights is applied at every step, just as a convolution shares a kernel across space. That is why an RNN can read sequences of any length with a fixed number of parameters. The hidden state is the network’s working memory. For a classification you usually use the *last* hidden state; for tagging or next-token prediction you use every step’s output. Training uses backpropagation through the unrolled loop, called **backpropagation through time (BPTT)**. Here is the whole forward pass in NumPy:',
        },
        {
          type: 'code',
          title: 'rnn_from_scratch.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

rng = np.random.default_rng(0)
d_in, d_h = 3, 4
Wx = rng.normal(scale=0.5, size=(d_in, d_h))
Wh = rng.normal(scale=0.5, size=(d_h, d_h))
b = np.zeros(d_h)

def rnn_forward(xs):
    h = np.zeros(d_h)
    states = []
    for x in xs:
        h = np.tanh(x @ Wx + h @ Wh + b)
        states.append(h)
    return np.array(states)

xs = rng.normal(size=(5, d_in))
H = rnn_forward(xs)
print(H.shape, H.min() >= -1 and H.max() <= 1)
print(bool(np.allclose(H[-1], rnn_forward(xs[::-1])[-1])))
print(rnn_forward(np.vstack([xs, xs])).shape)`,
          output: `(5, 4) True
False
(10, 4)`,
          annotations: [
            { lines: '3-7', text: 'Just three parameter tensors for the *whole* network: input-to-hidden `Wx`, hidden-to-hidden `Wh` and a bias. They do not depend on the sequence length.' },
            { lines: '9-15', text: 'The recurrence: start with a zero hidden state and, for each input vector, compute `tanh(x·Wx + h·Wh + b)`. The new `h` depends on the old `h`, so the loop cannot be vectorized over time (a main reason RNNs train slowly).' },
            { lines: '17-19', text: 'Five 3-dimensional inputs give five 4-dimensional states, all squashed into (−1, 1) by `tanh`.' },
            { lines: 20, text: 'Feeding the same inputs in reverse order gives a **different** final state (`False`): the hidden state encodes order, which is the whole point.' },
            { lines: 21, text: 'The same weights handle a sequence twice as long: 10 states.' },
          ],
        },
        {
          type: 'p',
          text: 'Plain RNNs have a flaw. Backpropagating through 100 time steps multiplies the gradient by `Wh` (and the `tanh` derivative, below 1) 100 times, so it vanishes: the network cannot learn that something at step 3 matters at step 100 (the **vanishing gradient** problem in time, from the previous lesson). The **LSTM** (Long Short-Term Memory, Hochreiter and Schmidhuber, 1997) fixes this with a separate **cell state** `c`, a conveyor belt that information rides along almost unchanged, and three learned **gates** (numbers between 0 and 1 produced by sigmoids) that control it. The **GRU** (2014) is a lighter variant with two gates and no separate cell state.',
        },
        {
          type: 'table',
          headers: ['Gate', 'Question it answers', 'Effect'],
          rows: [
            ['**Forget gate**', 'How much of the old memory should I keep?', 'Multiplies the cell state: 1 keeps it, 0 erases it'],
            ['**Input gate**', 'How much of the new candidate information should I write?', 'Scales what gets added to the cell state'],
            ['**Output gate**', 'How much of the memory should I reveal now?', 'Scales what becomes the hidden state `h`'],
          ],
          caption: 'The three LSTM gates. Because the cell state is updated by *adding* (gated) information rather than repeatedly multiplying by a matrix, gradients can flow back across hundreds of steps.',
        },
        {
          type: 'code',
          title: 'lstm_shapes.py',
          desktopOnly: true,
          code: `import torch
from torch import nn

emb = nn.Embedding(num_embeddings=50, embedding_dim=8)
lstm = nn.LSTM(input_size=8, hidden_size=16, batch_first=True)
tokens = torch.randint(0, 50, (4, 10))
x = emb(tokens)
out, (h_n, c_n) = lstm(x)
print(tuple(x.shape), tuple(out.shape), tuple(h_n.shape), tuple(c_n.shape))
print(sum(p.numel() for p in lstm.parameters()), sum(p.numel() for p in emb.parameters()))
gru = nn.GRU(8, 16, batch_first=True)
print(sum(p.numel() for p in gru.parameters()))
print(torch.equal(out[:, -1], h_n[0]))`,
          output: `(4, 10, 8) (4, 10, 16) (1, 4, 16) (1, 4, 16)
1664 400
1248
True`,
          annotations: [
            { lines: '4-5', text: 'An embedding table for 50 tokens with 8 numbers each, feeding an LSTM with a 16-unit hidden state. `batch_first=True` makes the input layout `(batch, time, features)` (without it PyTorch expects `(time, batch, features)`).' },
            { lines: '6-8', text: 'A batch of 4 sequences of 10 token ids → embedded into `(4, 10, 8)` → the LSTM returns `out`, the hidden state at **every** step `(4, 10, 16)`, plus the **final** hidden and cell states `h_n` and `c_n`, each `(layers, batch, hidden) = (1, 4, 16)`.' },
            { lines: 9, text: 'Printed shapes of everything.' },
            { lines: '10-12', text: 'Parameters: the embedding has `50 × 8 = 400`. The LSTM has 4 blocks (three gates plus the candidate), each with `16×8` input weights, `16×16` recurrent weights and two bias vectors of 16: `4 × (128 + 256 + 32) = 1,664`. A GRU has 3 blocks, so 1,248.' },
            { lines: 13, text: 'The last time step of `out` is exactly the final hidden state `h_n`: use `out[:, -1]` (or `h_n[0]`) for a one-label-per-sequence classifier.' },
          ],
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the recurrence: the new hidden state must depend on the **previous hidden state** as well as the current input.',
      template: `h = np.zeros(4)
for x in xs:
    h = np.tanh(x @ Wx + ___ @ Wh + b)`,
      templateIsCode: true,
      blanks: [{ answers: ['h'] }],
      wordBank: ['h', 'x', 'b', 'Wx'],
      explanation: 'The term `h @ Wh` feeds the previous state back in; that feedback loop is what makes the network recurrent and gives it memory. Without it each step would only see its own input.',
    },
    {
      kind: 'error',
      prompt: 'This code crashes because the LSTM is given the wrong kind of input. Tap the faulty line.',
      lines: [
        'emb = nn.Embedding(50, 8)',
        'lstm = nn.LSTM(input_size=8, hidden_size=16, batch_first=True)',
        'tokens = torch.randint(0, 50, (4, 10))',
        'out, (h_n, c_n) = lstm(tokens)',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'The LSTM expects float vectors of shape `(batch, time, 8)`, but `tokens` holds integer ids of shape `(4, 10)`. The ids must be looked up in the embedding first: `lstm(emb(tokens))`. The embedding layer is created but never used.',
    },
    {
      kind: 'numeric',
      prompt: 'How many parameters does `nn.LSTM(input_size=8, hidden_size=16)` have (one layer, with biases)? An LSTM has 4 blocks, each with an input weight matrix `16 × 8`, a recurrent matrix `16 × 16`, and two bias vectors of length 16.',
      answer: '1664',
      hint: 'One block has `16·8 + 16·16 + 16 + 16` numbers. Multiply by 4.',
      explanation: 'One block: 128 + 256 + 32 = 416. Four blocks: 4 × 416 = 1,664. A GRU with 3 blocks would have 1,248, which is why GRUs are a little faster.',
      label: 'Parameters:',
    },
    {
      kind: 'concept',
      title: 'A character-level language model, and recurrence in games',
      blocks: [
        {
          type: 'p',
          text: 'A **language model** predicts the next token given the previous ones; it is the engine behind autocomplete and, scaled up, every chatbot. Training needs no labels at all: the text supplies its own. At every position the *input* is the character at `t` and the *target* is the character at `t+1`. We build a tiny version with everything from this lesson: embedding → LSTM → linear layer producing a score for each possible next character. Afterwards we **generate** text by feeding the model’s own prediction back in as the next input, carrying the hidden state along.',
        },
        {
          type: 'code',
          title: 'char_lstm.py',
          desktopOnly: true,
          outputVaries: true,
          code: `import torch
from torch import nn

text = "the quick brown fox jumps over the lazy dog. " * 20
vocab = sorted(set(text))
stoi = {c: i for i, c in enumerate(vocab)}
data = torch.tensor([stoi[c] for c in text])
T = 16
starts = torch.arange(0, len(data) - T - 1)
X = torch.stack([data[s:s + T] for s in starts])
Y = torch.stack([data[s + 1:s + T + 1] for s in starts])

class CharLM(nn.Module):
    def __init__(self, V, d=16, h=64):
        super().__init__()
        self.emb = nn.Embedding(V, d)
        self.lstm = nn.LSTM(d, h, batch_first=True)
        self.out = nn.Linear(h, V)
    def forward(self, x, state=None):
        o, state = self.lstm(self.emb(x), state)
        return self.out(o), state

torch.manual_seed(0)
model = CharLM(len(vocab))
opt = torch.optim.Adam(model.parameters(), lr=0.01)
for epoch in range(1, 41):
    order = torch.randperm(len(X))
    for s in range(0, len(order), 64):
        idx = order[s:s + 64]
        logits, _ = model(X[idx])
        loss = nn.functional.cross_entropy(logits.reshape(-1, len(vocab)), Y[idx].reshape(-1))
        opt.zero_grad(); loss.backward(); opt.step()
    if epoch in (1, 10, 40):
        print(epoch, round(loss.item(), 3))

itos = {i: c for c, i in stoi.items()}
x = torch.tensor([[stoi["t"]]])
state = None
chars = ["t"]
with torch.no_grad():
    for _ in range(60):
        logits, state = model(x, state)
        nxt = logits[0, -1].argmax().item()
        chars.append(itos[nxt])
        x = torch.tensor([[nxt]])
print("".join(chars))`,
          output: `1 1.439
10 0.047
40 0.037
the lazy dog. the quick brown fox jumps over the lazy dog. th`,
          annotations: [
            { lines: '4-11', text: 'The corpus is one pangram repeated 20 times (a toy that is easy to memorize). Cut it into overlapping windows of 16 characters: `X` is each window and `Y` is the **same window shifted by one**, so every position learns to predict the character that follows it.' },
            { lines: '13-21', text: 'The model: **embedding → LSTM → linear**. The linear layer outputs one score per vocabulary character at *every* time step (`(batch, 16, vocab)`). `forward` also accepts and returns the LSTM `state`, which is what lets us generate one character at a time later.' },
            { lines: '23-34', text: 'The training loop is the one you know: cross-entropy over every position (reshaped to a flat list of predictions and targets). The loss falls from 1.4 to near 0.04, so the model has learned the text almost perfectly.' },
            { lines: '36-46', text: '**Generation**: start with "t", feed one character in, take the most likely next character (`argmax`), append it, feed *that* back in, and carry `state` along so the network remembers what came before. The output reproduces the sentence. (The exact text and losses vary with the PyTorch version; the loop is the point.)' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Temperature and sampling',
          text: 'Always picking the most likely character (`argmax`, "greedy decoding") gives repetitive text. Instead you can **sample** from the softmax probabilities, after dividing the scores by a **temperature** `τ`: low `τ` (0.2) sharpens the distribution toward the best choice, high `τ` (1.5) flattens it and produces more varied, riskier output. The same knob controls the creativity of large language models, and of game AIs that should not always make the identical move.',
        },
        {
          type: 'table',
          headers: ['Use in games', 'Sequence model role', 'Notes'],
          rows: [
            ['**Partial observability** (fog of war, one screen of a larger map)', 'A recurrent policy remembers what it has seen', 'LSTM or GRU in the agent’s network; the standard answer when one observation does not reveal the state'],
            ['**Frame stacking vs recurrence**', 'Stack the last 4 frames as channels, or carry an LSTM state', 'Stacking is simpler and often enough; recurrence helps with longer memory'],
            ['**Player modelling**', 'Predict a player’s next action from their recent actions', 'Dynamic difficulty, anti-cheat, recommendations'],
            ['**Procedural generation**', 'A language model over tile or note sequences', 'Generate levels, music or names, as above but over tiles'],
            ['**Dialogue and text**', 'Next-token models', 'Today almost always transformers (next lesson)'],
          ],
          caption: 'Where sequence models show up in game AI.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'The hidden state is persistent game state',
          text: 'When a recurrent agent plays a live game, the hidden state `(h, c)` must be carried from one game tick to the next, like a member variable of the agent object, and **reset to zeros at the start of each episode** (otherwise memories from the last match leak into the next one). The generation loop above is exactly that: `state` is passed in and returned each step. Forgetting to carry or reset it is the commonest recurrent-agent bug.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'From RNNs to transformers',
          text: 'RNNs dominated language and speech from the 1990s to about 2017. They have two drawbacks: they process steps one after another (slow to train on GPUs), and even LSTMs struggle with very long dependencies. The **transformer** (2017) replaced recurrence with **attention**, which lets every position look directly at every other. That is the subject of the next lesson. Recurrent layers remain popular for small, fast on-device models, streaming data and reinforcement-learning agents.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write a class `Vocab(texts)` for word-level tokenization. Reserve id 0 for `"<pad>"` and id 1 for `"<unk>"`, then give every distinct lower-cased word found in `texts` (split on whitespace) an id in **sorted** order starting at 2. Provide `encode(text)` (lower-case, split, unknown words become 1), `decode(ids)` (join the words with spaces) and `__len__`. Keep the attribute `itos` (list of tokens) and `stoi` (dict).',
      starter: `class Vocab:
    ...
`,
      solution: `class Vocab:
    def __init__(self, texts):
        words = sorted({w for t in texts for w in t.lower().split()})
        self.itos = ["<pad>", "<unk>"] + words
        self.stoi = {w: i for i, w in enumerate(self.itos)}

    def encode(self, text):
        return [self.stoi.get(w, 1) for w in text.lower().split()]

    def decode(self, ids):
        return " ".join(self.itos[i] for i in ids)

    def __len__(self):
        return len(self.itos)
`,
      tests: `v = Vocab(["The cat sat", "the dog sat down"])
assert v.itos == ["<pad>", "<unk>", "cat", "dog", "down", "sat", "the"]
assert len(v) == 7
assert v.stoi["<pad>"] == 0 and v.stoi["<unk>"] == 1 and v.stoi["the"] == 6
assert v.encode("the cat") == [6, 2]
assert v.encode("The bird sat") == [6, 1, 5]
assert v.decode([6, 2, 5]) == "the cat sat"
assert v.decode(v.encode("a b")) == "<unk> <unk>"
assert v.encode("") == []
assert v.decode([]) == ""

empty = Vocab([])
assert len(empty) == 2 and empty.encode("hello") == [1]
w = Vocab(["b a", "a c"])
assert w.itos[2:] == ["a", "b", "c"]
assert w.encode("C A B") == [4, 2, 3]`,
      checks: ['Ids 0 and 1 are `<pad>` and `<unk>`; the lower-cased distinct words follow in sorted order from id 2', '`encode` lower-cases, splits on whitespace and maps unseen words to the `<unk>` id 1', '`decode` joins words back with spaces; `len()` gives the vocabulary size (including the two special tokens)'],
      hint: 'Build `words = sorted({w for t in texts for w in t.lower().split()})`, then `self.itos = ["<pad>", "<unk>"] + words` and `self.stoi = {w: i ...}`. Use `self.stoi.get(w, 1)` in `encode`.',
      explanation: 'Reserving the first ids for special tokens (`<pad>` for batching, `<unk>` for out-of-vocabulary words) is standard. Real tokenizers add `<bos>` / `<eos>` markers too, and use subwords so `<unk>` is rare, but the id-mapping machinery is exactly this.',
    },
    {
      kind: 'code',
      prompt: 'Write `most_similar(word, vocab, E, k=2)`: `vocab` is a list of words and `E` a NumPy matrix with one embedding row per word (same order). Return the `k` **other** words most similar to `word` by cosine similarity, most similar first (the word itself is excluded). Raise `KeyError` if `word` is not in `vocab` (a plain `list.index` or dict lookup does this naturally for a dict; for a list raise it yourself).',
      starter: `import numpy as np

def most_similar(word, vocab, E, k=2):
    ...
`,
      solution: `import numpy as np


def most_similar(word, vocab, E, k=2):
    if word not in vocab:
        raise KeyError(word)
    E = np.asarray(E, dtype=float)
    i = vocab.index(word)
    unit = E / np.linalg.norm(E, axis=1, keepdims=True)
    sims = unit @ unit[i]
    order = sorted((j for j in range(len(vocab)) if j != i), key=lambda j: -sims[j])
    return [vocab[j] for j in order[:k]]
`,
      tests: `import numpy as np

vocab = ["king", "queen", "man", "woman", "apple"]
E = np.array([
    [0.9, 0.8, 0.1, 0.0],
    [0.9, 0.1, 0.8, 0.0],
    [0.1, 0.8, 0.1, 0.0],
    [0.1, 0.1, 0.8, 0.0],
    [0.0, 0.0, 0.0, 0.9],
])
assert most_similar("king", vocab, E) == ["man", "queen"]
assert most_similar("queen", vocab, E) == ["woman", "king"]
assert most_similar("man", vocab, E, k=1) == ["king"]
assert most_similar("woman", vocab, E, k=1) == ["queen"]
assert len(most_similar("king", vocab, E, k=10)) == 4
assert "king" not in most_similar("king", vocab, E, k=4)
assert most_similar("king", vocab, E, k=0) == []
assert most_similar("king", vocab, E * 5.0) == ["man", "queen"]
before = E.copy()
most_similar("king", vocab, E)
assert np.array_equal(E, before)
try:
    most_similar("pear", vocab, E)
except KeyError:
    pass
else:
    raise AssertionError("expected KeyError")`,
      packages: ['numpy'],
      checks: ['Ranks the other words by cosine similarity (dot product of the normalized vectors), highest first', 'Excludes the query word itself and returns at most `k` words (all of them if `k` is larger)', 'Is insensitive to vector length (scaling `E` does not change the order); raises `KeyError` for an unknown word'],
      hint: 'Normalize the rows (`E / np.linalg.norm(E, axis=1, keepdims=True)`), then `sims = unit @ unit[i]` gives every word’s cosine similarity to word `i`. Sort the other indices by `-sims[j]` and take the first `k`.',
      explanation: 'This is the "nearest neighbours" lookup behind word-similarity demos, semantic search and recommendation systems: normalize the vectors so that a dot product *is* the cosine, and then rank. Large systems replace the full sort with an approximate nearest-neighbour index, but the idea does not change (the RAG lesson later builds on it).',
    },
    {
      kind: 'code',
      prompt: 'Write `rnn_forward(xs, Wx, Wh, b, h0=None)`: run a plain RNN over the sequence `xs` of shape `(T, d_in)` and return a NumPy array of shape `(T, d_h)` containing the hidden state after every step. Use `h = np.tanh(x @ Wx + h @ Wh + b)`, starting from zeros of length `d_h` (or `h0` if given). For an empty sequence return an array of shape `(0, d_h)`.',
      starter: `import numpy as np

def rnn_forward(xs, Wx, Wh, b, h0=None):
    ...
`,
      solution: `import numpy as np


def rnn_forward(xs, Wx, Wh, b, h0=None):
    Wx = np.asarray(Wx, dtype=float)
    Wh = np.asarray(Wh, dtype=float)
    d_h = Wh.shape[0]
    h = np.zeros(d_h) if h0 is None else np.asarray(h0, dtype=float)
    states = np.empty((len(xs), d_h))
    for t, x in enumerate(xs):
        h = np.tanh(np.asarray(x, dtype=float) @ Wx + h @ Wh + b)
        states[t] = h
    return states
`,
      tests: `import numpy as np
import math

Wx = np.array([[1.0]])
Wh = np.array([[0.5]])
b = np.array([0.0])
H = rnn_forward(np.array([[1.0], [0.0], [0.0]]), Wx, Wh, b)
h1 = math.tanh(1.0)
h2 = math.tanh(0.5 * h1)
h3 = math.tanh(0.5 * h2)
assert H.shape == (3, 1)
assert np.allclose(H[:, 0], [h1, h2, h3])

fwd = rnn_forward(np.array([[1.0], [0.0]]), np.array([[1.0]]), np.array([[1.0]]), np.zeros(1))
rev = rnn_forward(np.array([[0.0], [1.0]]), np.array([[1.0]]), np.array([[1.0]]), np.zeros(1))
assert not np.allclose(fwd[-1], rev[-1])

rng = np.random.default_rng(0)
Wx2, Wh2, b2 = rng.normal(size=(3, 4)), rng.normal(size=(4, 4)), rng.normal(size=4)
xs = rng.normal(size=(6, 3))
out = rnn_forward(xs, Wx2, Wh2, b2)
assert out.shape == (6, 4) and np.all(np.abs(out) < 1)
assert np.allclose(out[0], np.tanh(xs[0] @ Wx2 + b2))
assert np.allclose(out[1], np.tanh(xs[1] @ Wx2 + out[0] @ Wh2 + b2))

assert rnn_forward(np.zeros((0, 3)), Wx2, Wh2, b2).shape == (0, 4)
h0 = np.ones(4)
with_h0 = rnn_forward(xs, Wx2, Wh2, b2, h0=h0)
assert np.allclose(with_h0[0], np.tanh(xs[0] @ Wx2 + h0 @ Wh2 + b2))
assert not np.allclose(with_h0, out)

zeroWh = rnn_forward(xs, Wx2, np.zeros((4, 4)), b2)
assert np.allclose(zeroWh, np.tanh(xs @ Wx2 + b2))`,
      packages: ['numpy'],
      checks: ['Each state is `tanh(x @ Wx + h @ Wh + b)` computed from the previous state, starting from zeros or `h0`', 'Returns an array of shape `(T, d_h)` with the state after every step, and `(0, d_h)` for an empty sequence', 'With `Wh = 0` the states depend only on the current input; the order of the sequence matters otherwise'],
      hint: 'Get `d_h = Wh.shape[0]`, start with `h = np.zeros(d_h)`, allocate `states = np.empty((len(xs), d_h))`, then in the loop update `h` and store `states[t] = h`.',
      explanation: 'This is the entire forward pass of `nn.RNN`. When `Wh` is zero the network has no memory (each state sees only its own input), and everything interesting comes from the feedback term `h @ Wh`. PyTorch’s LSTM and GRU keep this loop but replace the single `tanh` update by gated updates that protect the memory.',
    },
  ],
  takeaways: [
    'Text and event streams become numbers via **tokenization** → **vocabulary** → **ids**. Characters (tiny vocabulary, long sequences), words (short, but closed vocabulary needing `<unk>`) and subwords (the modern compromise) trade off differently. Reserve ids for `<pad>` and `<unk>`.',
    'An **embedding** (`nn.Embedding`) is a learned lookup table that gives each id a dense vector; tokens used alike end up close together, measured by **cosine similarity**. Use embeddings for any categorical input: words, items, actions, tiles.',
    'An **RNN** reads a sequence step by step with a **hidden state** `h_t = tanh(W_x x_t + W_h h_{t−1} + b)`, sharing the same weights at every step. The loop makes it slow to train and gradients vanish over long spans.',
    '**LSTM** (cell state plus forget, input and output gates) and **GRU** (two gates) protect memory across long sequences. In PyTorch, use `batch_first=True`, feed embeddings (not ids), and read the last step with `out[:, -1]`; `h_n` and `c_n` hold the final states.',
    'A **language model** predicts the next token (input at `t`, target at `t+1`) and generates by feeding its output back in with the state carried along. Recurrent agents must carry their hidden state between game ticks and reset it each episode. Transformers, next, replace recurrence with attention.',
  ],
  reading: [
    { title: 'Andrej Karpathy: The Unreasonable Effectiveness of Recurrent Neural Networks', url: 'https://karpathy.github.io/2015/05/21/rnn-effectiveness/', source: 'article', note: 'The classic tour of character-level RNNs that write Shakespeare, code and more.' },
    { title: 'Christopher Olah: Understanding LSTM Networks', url: 'https://colah.github.io/posts/2015-08-Understanding-LSTMs/', source: 'article', note: 'The clearest diagrammatic explanation of LSTM gates and the cell state.' },
    { title: 'PyTorch: NLP From Scratch (character-level RNN tutorials)', url: 'https://docs.pytorch.org/tutorials/intermediate/char_rnn_classification_tutorial.html', source: 'tutorial', note: 'Official tutorials that classify and generate names with recurrent networks.' },
    { title: 'Efficient Estimation of Word Representations in Vector Space (word2vec)', url: 'https://arxiv.org/abs/1301.3781', source: 'paper', note: 'The 2013 paper that popularized learned word embeddings and their analogies.' },
    { title: 'Hugging Face LLM Course: tokenizers', url: 'https://huggingface.co/learn/llm-course/chapter2/4', source: 'course', note: 'How subword tokenizers (BPE, WordPiece) work and are used in practice.' },
  ],
};
