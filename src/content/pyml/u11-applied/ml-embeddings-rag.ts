import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-embeddings-rag',
  title: 'Embeddings, Semantic Search and RAG',
  summary: 'Turn text into vectors and search by meaning: TF-IDF from scratch, why exact words fail, how embeddings and cosine similarity fix it, and how retrieval-augmented generation lets a language model answer from your own game data, with offline demos and a way to measure whether retrieval works.',
  minutes: 30,
  objectives: [
    'Build a keyword search from scratch with TF-IDF vectors and cosine similarity, and explain why it misses synonyms',
    'Explain what an embedding is and why nearby vectors mean similar meaning, using a small latent-semantic example',
    'Describe the retrieval-augmented generation pipeline: chunk, embed, retrieve, build a grounded prompt, generate',
    'Choose chunk sizes and overlaps, and measure retrieval quality with recall at k instead of guessing',
    'Implement chunking, top-k cosine search and recall at k yourself',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From keywords to vectors: search from scratch',
      blocks: [
        {
          type: 'p',
          text: 'A player types “where do I buy a steel sword?” into your game’s help window. You have a few hundred lore and help entries. How do you find the right one? Scanning for the exact phrase fails the moment the player words it differently. The classic answer, still used inside many search engines, is to turn every text into a **[[vector|vector]]** with one number per word in the vocabulary, and to rank documents by how close their vector is to the query’s. This is the foundation for everything else in the lesson.',
        },
        {
          type: 'p',
          text: 'The numbers come from **[[tf-idf|TF-IDF]]**. *Term frequency* counts how often a word appears in a text. *Inverse document frequency* down-weights words that appear in many documents (“the” tells you nothing; “forge” tells you a lot), as the logarithm of total documents divided by the documents that contain the word. Closeness is measured with **[[cosine-similarity|cosine similarity]]**, the cosine of the angle between two vectors. It is 1 for the same direction, 0 for no shared words, and it ignores length, so a long document does not win just by being long.',
        },
        {
          type: 'math',
          tex: '\\mathrm{tfidf}(w, d) = \\mathrm{tf}(w, d) \\cdot \\ln \\frac{N}{\\mathrm{df}(w)}, \\qquad \\cos(\\mathbf{a}, \\mathbf{b}) = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{\\lVert \\mathbf{a} \\rVert \\, \\lVert \\mathbf{b} \\rVert}',
          caption: 'N is the number of documents and df(w) the number of documents containing the word w. Cosine similarity divides the dot product by the two vector lengths.',
        },
        {
          type: 'p',
          text: 'The program below is a complete search engine in about 30 lines of plain Python, with no libraries. It builds a vocabulary, computes a weight for each word, turns every document into a vector, and ranks documents by cosine similarity to the query. Notice what happens for the one-word query “sword”.',
        },
        {
          type: 'code',
          title: 'tfidf_search.py',
          runnable: true,
          code: `import math
import re

DOCS = [
    "The smith will repair a chipped blade at the village forge for ten gold.",
    "Buy a steel sword at the forge; the smith sharpens every sword for free.",
    "A sharp blade and a sword are both fine against skeletons in the crypt.",
    "Brew a healing potion from red herbs and clean spring water.",
    "Red herbs grow beside the river and are the main ingredient of every potion.",
    "The dragon sleeps in the mountain cave and guards a hoard of gold.",
    "Travellers rest at the inn to restore health and save their progress.",
    "The harbor sells ships, sea charts and maps of the northern coast.",
]


def tokenize(text):
    return re.findall(r"[a-z]+", text.lower())


vocabulary = sorted({word for doc in DOCS for word in tokenize(doc)})
document_frequency = {w: sum(w in set(tokenize(d)) for d in DOCS) for w in vocabulary}


def tfidf(text):
    """A vector with one weight per vocabulary word: term frequency times inverse document frequency."""
    words = tokenize(text)
    return [words.count(w) * math.log(len(DOCS) / document_frequency[w]) if w in document_frequency else 0.0
            for w in vocabulary]


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return dot / norm if norm else 0.0


vectors = [tfidf(doc) for doc in DOCS]


def search(query, k=3):
    scores = [(cosine(tfidf(query), v), i) for i, v in enumerate(vectors)]
    return sorted(scores, reverse=True)[:k]


for query in ["steel sword", "healing potion ingredients", "sword"]:
    print(f"query: {query!r}")
    for score, i in search(query):
        print(f"   {score:.2f}  {DOCS[i][:58]}")`,
          output: `query: 'steel sword'
   0.56  Buy a steel sword at the forge; the smith sharpens every s
   0.13  A sharp blade and a sword are both fine against skeletons
   0.00  The harbor sells ships, sea charts and maps of the norther
query: 'healing potion ingredients'
   0.44  Brew a healing potion from red herbs and clean spring wate
   0.14  Red herbs grow beside the river and are the main ingredien
   0.00  The harbor sells ships, sea charts and maps of the norther
query: 'sword'
   0.48  Buy a steel sword at the forge; the smith sharpens every s
   0.24  A sharp blade and a sword are both fine against skeletons
   0.00  The harbor sells ships, sea charts and maps of the norther`,
          annotations: [
            { lines: '16-17', text: '`tokenize` lowercases the text and keeps runs of letters. Real systems also handle punctuation, numbers, accents and sometimes stemming (“swords” to “sword”).' },
            { lines: '20-21', text: 'The vocabulary is every distinct word, and `document_frequency` counts in how many documents each word appears.' },
            { lines: '24-28', text: 'A TF-IDF vector has one slot per vocabulary word: how often the word occurs, times `log(N / df)`. A word in every document gets weight 0; a rare word gets a large weight. Words not in the vocabulary are ignored.' },
            { lines: '31-34', text: 'Cosine similarity: the dot product divided by the product of the lengths. The `if norm` guard returns 0 instead of dividing by zero for an empty query.' },
            { lines: 37, text: 'Every document is turned into a vector once, up front. This list is the entire “index”.' },
            { lines: '40-42', text: 'To search, vectorise the query, score it against every document and return the best `k`. Ties (all the 0.00 scores) are broken arbitrarily, so ignore the last line of each result.' },
            { lines: '45-48', text: 'The query “sword” finds the two documents that contain the word. The first document, about repairing a chipped *blade*, is not in the list at all, although a player asking about swords probably wants it.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why exact-word search is not enough',
          text: 'TF-IDF vectors have one dimension per word, and different words are completely unrelated dimensions: to the computer, “sword” and “blade” are as different as “sword” and “harbor”. Players paraphrase, misspell and use synonyms constantly (“fix my weapon”, “mend”, “repair”). To search by *meaning*, we need vectors in which words and sentences with similar meaning end up near each other, even when they share no words. Those vectors are called **embeddings**.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'With the TF-IDF search above, a player searches for “blade”. The forge entry says “repair a chipped blade” and another entry says “buy a steel sword”. Which entries can the search return with a score above zero?',
      options: [
        { text: 'Only entries that contain the word “blade”, so the sword entry scores 0', correct: true, why: 'TF-IDF vectors are built from word counts. The query vector has weight only on the “blade” dimension, so only documents that contain that exact word can have a non-zero cosine.' },
        { text: 'Both entries, because swords are blades', why: 'The vectors know nothing about meaning. “Sword” and “blade” are different dimensions, and only an embedding trained or fitted to capture similar meaning could connect them.' },
        { text: 'Neither, because “blade” is too common a word', why: 'IDF only down-weights words that appear in many documents. “Blade” appears in few of them, so it carries a high weight and finds those documents.' },
        { text: 'Every entry, with scores that depend on document length', why: 'Documents without the word have no overlap with the query, so their dot product is zero whatever their length.' },
      ],
      explanation: 'Keyword vectors only overlap on shared words. That is both their strength (exact names, item codes and rare terms are found reliably) and their weakness (synonyms and paraphrases are invisible).',
    },
    {
      kind: 'concept',
      title: 'Embeddings: meaning as coordinates',
      blocks: [
        {
          type: 'p',
          text: 'An **[[embedding|embedding]]** is a vector of a few hundred or a few thousand numbers that represents a piece of text so that *texts with similar meaning have vectors that point in similar directions*. Instead of one dimension per word, there are a fixed number of dimensions (384 and 768 are common) that are not words but learned features. The same cosine similarity then measures “how similar in meaning”.',
        },
        {
          type: 'p',
          text: 'Modern embedding models are neural networks, usually [[transformer|transformers]], trained on huge amounts of text so that sentences used in similar contexts get similar vectors. You do not train one yourself for a game; you load a pretrained model, call `encode` on your texts, and keep the vectors. The idea itself is much older and you can see it in a few lines of NumPy. **[[latent-semantic-analysis|Latent semantic analysis]]** takes the TF-IDF matrix of your documents and uses a singular value decomposition to find a few hidden “topic” directions. Words that occur in similar documents (sword, blade, forge, smith) land on the same direction, and a text is then described by *how much of each topic* it has.',
        },
        {
          type: 'code',
          title: 'latent_topics.py',
          runnable: true,
          packages: ['numpy'],
          code: `import re

import numpy as np

DOCS = [
    "The smith will repair a chipped blade at the village forge for ten gold.",
    "Buy a steel sword at the forge; the smith sharpens every sword for free.",
    "A sharp blade and a sword are both fine against skeletons in the crypt.",
    "Brew a healing potion from red herbs and clean spring water.",
    "Red herbs grow beside the river and are the main ingredient of every potion.",
    "The dragon sleeps in the mountain cave and guards a hoard of gold.",
    "Travellers rest at the inn to restore health and save their progress.",
    "The harbor sells ships, sea charts and maps of the northern coast.",
]


def tokenize(text):
    return re.findall(r"[a-z]+", text.lower())


vocabulary = sorted({word for doc in DOCS for word in tokenize(doc)})
index = {word: i for i, word in enumerate(vocabulary)}
document_frequency = np.array([sum(w in tokenize(d) for d in DOCS) for w in vocabulary])
idf = np.log(len(DOCS) / document_frequency)


def tfidf(text):
    vector = np.zeros(len(vocabulary))
    for word in tokenize(text):
        if word in index:
            vector[index[word]] += 1
    return vector * idf


def cosine(a, b):
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    return float(a @ b / norm) if norm else 0.0


# Lexical: one dimension per word.
doc_vectors = np.array([tfidf(d) for d in DOCS])

# Semantic: squeeze the word space down to 3 "topic" dimensions with a singular value decomposition.
u, s, vt = np.linalg.svd(doc_vectors, full_matrices=False)
topics = vt[:3]                                  # each row: a direction in word space
doc_topics = doc_vectors @ topics.T


def lsa(text):
    return tfidf(text) @ topics.T


query = "sword"
print(f"query: {query!r}   (TF-IDF = word match, LSA = shared topic)")
for i, doc in enumerate(DOCS):
    print(f"  tfidf {cosine(tfidf(query), doc_vectors[i]):5.2f}   lsa {cosine(lsa(query), doc_topics[i]):5.2f}   {doc[:50].rstrip()}")`,
          output: `query: 'sword'   (TF-IDF = word match, LSA = shared topic)
  tfidf  0.00   lsa  0.98   The smith will repair a chipped blade at the villa
  tfidf  0.48   lsa  1.00   Buy a steel sword at the forge; the smith sharpens
  tfidf  0.24   lsa  0.96   A sharp blade and a sword are both fine against sk
  tfidf  0.00   lsa -0.03   Brew a healing potion from red herbs and clean spr
  tfidf  0.00   lsa  0.14   Red herbs grow beside the river and are the main i
  tfidf  0.00   lsa  0.84   The dragon sleeps in the mountain cave and guards
  tfidf  0.00   lsa -0.01   Travellers rest at the inn to restore health and s
  tfidf  0.00   lsa -0.13   The harbor sells ships, sea charts and maps of the`,
          annotations: [
            { lines: '21-24', text: 'The same vocabulary and IDF weights as before, now as NumPy arrays so we can use matrix algebra.' },
            { lines: '27-32', text: '`tfidf` fills one slot per word and multiplies by the IDF array in one vectorised step.' },
            { lines: 41, text: 'The documents as a matrix with one row per document and one column per vocabulary word. This is the “lexical” representation.' },
            { lines: '44-46', text: 'The singular value decomposition factorises that matrix. The first three rows of `vt` are three directions in word space that capture most of the variation, and projecting each document onto them (`doc_vectors @ topics.T`) gives every document just **3 numbers** instead of one per word.' },
            { lines: '49-50', text: 'A query is projected onto the same topics, so it can be compared with the documents.' },
            { lines: '53-56', text: 'For the query “sword”, plain TF-IDF scores the *blade* document 0.00, but the topic vectors score it 0.98 because it shares the weapons-and-forge topic. The dragon entry (0.84) is probably pulled in by words such as “gold” that it shares with the forge entries, a reminder that small, crude embeddings give fuzzy results; the potion, inn and harbor entries stay near zero.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'What a real embedding model adds',
          text: 'LSA only knows the eight sentences it was fitted on. A pretrained model has seen enormous amounts of text, so it knows that “mend”, “repair” and “fix” are related, and that “something to fix my broken weapon” is close to the forge entry, with no shared words at all. It also gives the same fixed-size vector for any sentence, so adding a new document never requires refitting. Everything else (store the vectors, compare with cosine, take the top *k*) is exactly what you just saw.',
        },
        {
          type: 'code',
          title: 'real_embeddings.py',
          lang: 'python',
          desktopOnly: true,
          code: `import numpy as np
from sentence_transformers import SentenceTransformer

DOCS = [
    "The smith will repair a chipped blade at the village forge for ten gold.",
    "Buy a steel sword at the forge; the smith sharpens every sword for free.",
    "Brew a healing potion from red herbs and clean spring water.",
    "The harbor sells ships, sea charts and maps of the northern coast.",
]

model = SentenceTransformer("all-MiniLM-L6-v2")      # about 90 MB, downloaded once and cached
doc_vectors = model.encode(DOCS, normalize_embeddings=True)       # shape (4, 384)
query_vector = model.encode("something to fix my broken weapon", normalize_embeddings=True)

scores = doc_vectors @ query_vector                  # unit vectors: dot product = cosine
for i in np.argsort(-scores):
    print(f"{scores[i]:.2f}  {DOCS[i]}")`,
          annotations: [
            { lines: 2, text: '`pip install sentence-transformers` provides many pretrained embedding models behind one interface (it uses PyTorch). Other options are the embedding endpoints of hosted APIs and the models you can run through Ollama.' },
            { lines: 11, text: 'A small, popular model producing 384-number vectors. It is downloaded once (about 90 MB) and cached; after that it works offline and runs on a CPU.' },
            { lines: '12-13', text: '`encode` turns texts into vectors. `normalize_embeddings=True` scales each vector to length 1, so cosine similarity becomes a plain dot product. The query shares no important words with the forge entries.' },
            { lines: '15-17', text: 'One matrix-vector product scores every document at once; `np.argsort(-scores)` lists them best first. With a model like this, the two forge entries should rank above the potion and harbor ones even though the query contains none of their words (the exact scores depend on the model version).' },
          ],
        },
        {
          type: 'table',
          headers: ['Choice', 'Typical values', 'What it affects'],
          rows: [
            ['**Embedding model**', 'Small local models (384 to 768 numbers), larger models and hosted APIs (1 000 to 3 000+ numbers)', 'Quality in your language and domain, speed, cost, privacy, and whether it works offline'],
            ['**Dimensions**', '384, 768, 1024, 1536 and more', 'Memory per vector (4 bytes per number as float32) and search speed; more is not always better'],
            ['**Normalisation**', 'Scale every vector to length 1', 'Then cosine similarity equals the dot product, which is faster to compute'],
            ['**Exact vs approximate search**', 'A NumPy matrix for thousands of vectors; an ANN index for millions', 'See the box below'],
          ],
          caption: 'The decisions that matter when you add embeddings to a project. Start with a small model and measure; do not assume that the biggest model is needed.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Never mix embedding models',
          text: 'A vector only means something relative to the model that produced it. Documents embedded with one model cannot be searched with a query embedded by another, and changing the model means **re-embedding every document**. Store the model name next to the vectors, and put the embedding step behind one function so that it is used identically for documents and for queries.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Cosine similarity between two vectors depends on how long the vectors are, so a vector scaled to ten times its length is less similar to its original.',
      answer: false,
      explanation: 'False. Cosine similarity measures only the angle between vectors. Multiplying a vector by a positive number changes its length but not its direction, so the cosine with the original stays exactly 1. That is why cosine suits text: a long document and a short one on the same topic point the same way.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the cosine similarity of two NumPy vectors.',
      template: `score = np.___(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))`,
      templateIsCode: true,
      blanks: [{ answers: ['dot'] }],
      wordBank: ['dot', 'cross', 'sum', 'outer'],
      explanation: 'The numerator is the **dot product**, `np.dot(a, b)` (or `a @ b`), which is large when the vectors point the same way. Dividing by the product of the two lengths (the norms) removes the effect of length and leaves the cosine of the angle.',
    },
    {
      kind: 'concept',
      title: 'Retrieval-augmented generation (RAG)',
      blocks: [
        {
          type: 'p',
          text: 'A language model knows only what was in its training data plus whatever you put in the prompt. It has never seen your game’s lore, today’s patch notes or your internal wiki, and if you ask about them it may produce a confident, plausible and wrong answer (a [[hallucination|hallucination]]). **[[retrieval-augmented-generation|Retrieval-augmented generation]]** fixes this without any training: *look up* the relevant passages first, put them in the prompt, and instruct the model to answer from them. The model supplies language skill; your data supplies the facts.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Chunk', text: 'Split each document into passages small enough to be about one thing, with some overlap so an answer is not cut in half at a boundary. See [[chunking|chunking]].' },
            { title: 'Embed and index', text: 'Turn each chunk into a vector and store it with the chunk text and a source label. This is done once, ahead of time, and again when documents change.' },
            { title: 'Retrieve', text: 'At question time, embed the question the same way and take the top *k* chunks by cosine similarity.' },
            { title: 'Build a grounded prompt', text: 'Number the chunks as sources, add the question, and instruct the model to answer only from the sources, to cite them, and to say so when the answer is not there.' },
            { title: 'Generate', text: 'Send the prompt to the model (see the previous lesson). Because the sources are numbered, you can show the player where an answer came from and check it.' },
          ],
        },
        {
          type: 'p',
          text: 'The demo below runs steps 1 to 4 completely offline on a tiny lore collection, using TF-IDF as the retriever so it needs no model download. It prints the exact prompt that would be sent to a language model, then measures the retriever on six labelled questions. Swapping TF-IDF for real embeddings changes only the `vector` function.',
        },
        {
          type: 'code',
          title: 'mini_rag.py',
          runnable: true,
          code: `import math
import re

LORE = {
    "forge": "Brenna the smith works the village forge. She repairs chipped blades for ten gold. "
             "Steel swords cost one hundred gold. She will not sell weapons to anyone wearing the mark of the Ash Cult.",
    "herbs": "Red herbs grow beside the river and are picked at dawn. A healing potion needs three red herbs and one flask of spring water. "
             "Brewing takes one hour and restores fifty health.",
    "dragon": "The dragon Vharr sleeps inside Ember Cave on the northern mountain. Vharr is weak to frost and cannot cross the frozen river. "
              "Its hoard holds the Crown of Ash.",
    "inn": "The Gilded Stag inn offers a bed for five gold. Resting there restores all health and saves the game. "
           "The innkeeper also sells hot meals.",
}


def tokenize(text):
    return re.findall(r"[a-z]+", text.lower())


def chunk_sentences(text, size=2, overlap=1):
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\\s+", text) if s.strip()]
    step = size - overlap
    return [" ".join(sentences[i:i + size]) for i in range(0, max(1, len(sentences) - overlap), step)]


chunks = [(doc_id, piece) for doc_id, text in LORE.items() for piece in chunk_sentences(text)]
df = {}
for _, piece in chunks:
    for word in set(tokenize(piece)):
        df[word] = df.get(word, 0) + 1


def vector(text):
    counts = {}
    for word in tokenize(text):
        if word in df:
            counts[word] = counts.get(word, 0) + 1
    return {w: c * math.log(len(chunks) / df[w]) for w, c in counts.items()}


def cosine(a, b):
    dot = sum(weight * b.get(word, 0.0) for word, weight in a.items())
    norm = math.sqrt(sum(x * x for x in a.values())) * math.sqrt(sum(x * x for x in b.values()))
    return dot / norm if norm else 0.0


chunk_vectors = [vector(piece) for _, piece in chunks]


def retrieve(question, k=2):
    scored = [(cosine(vector(question), v), i) for i, v in enumerate(chunk_vectors)]
    return sorted(scored, key=lambda pair: (-pair[0], pair[1]))[:k]


def build_prompt(question, hits):
    sources = "\\n".join(f"[{n}] {chunks[i][1]}" for n, (_, i) in enumerate(hits, start=1))
    return ("Answer the question using ONLY the sources below. Cite them like [1]. "
            "If the sources do not contain the answer, say you do not know.\\n\\n"
            f"Sources:\\n{sources}\\n\\nQuestion: {question}")


question = "How much does a healing potion need?"
hits = retrieve(question)
print(build_prompt(question, hits))
print()

labelled = [("How much does it cost to repair a blade?", "forge"), ("What do I need to brew a healing potion?", "herbs"),
            ("Where does the dragon sleep?", "dragon"), ("Is the dragon afraid of anything?", "dragon"),
            ("Where can I rest and save?", "inn"), ("Who sells steel swords?", "forge")]
for k in (1, 2, 3):
    missed = [q for q, doc in labelled if not any(chunks[i][0] == doc for _, i in retrieve(q, k))]
    note = " | missed: " + "; ".join(missed) if missed else ""
    print(f"recall@{k}: {len(labelled) - len(missed)}/{len(labelled)}{note}")`,
          output: `Answer the question using ONLY the sources below. Cite them like [1]. If the sources do not contain the answer, say you do not know.

Sources:
[1] A healing potion needs three red herbs and one flask of spring water. Brewing takes one hour and restores fifty health.
[2] Red herbs grow beside the river and are picked at dawn. A healing potion needs three red herbs and one flask of spring water.

Question: How much does a healing potion need?

recall@1: 5/6 | missed: Where can I rest and save?
recall@2: 5/6 | missed: Where can I rest and save?
recall@3: 6/6`,
          annotations: [
            { lines: '20-23', text: '`chunk_sentences` splits into sentences and slides a window of 2 sentences, moving forward 1 each time, so neighbouring chunks overlap by one sentence. A fact that straddles two sentences still appears whole in at least one chunk.' },
            { lines: 26, text: 'Every document is cut into chunks, and each chunk remembers which document it came from.' },
            { lines: '27-30', text: 'Document frequencies are counted over the **chunks**: for retrieval, each chunk is the “document”.' },
            { lines: '33-38', text: 'The TF-IDF vector as a dictionary of word weights, which is sparse and cheap. In a real system this is the function you would replace with `model.encode`.' },
            { lines: '50-52', text: '`retrieve` scores the question against every chunk and returns the best `k` as `(score, chunk index)` pairs. Ties are broken by index so the results are reproducible.' },
            { lines: '55-59', text: 'The grounded prompt: the rules first (use only the sources, cite them, admit ignorance), then numbered sources, then the question. These instructions are what turn a model that guesses into one that quotes.' },
            { lines: '62-65', text: 'Retrieve for one question and print the full prompt. Both retrieved chunks mention the potion recipe, and the second one overlaps the first, which is the cost of overlapping chunks.' },
            { lines: '67-69', text: 'An evaluation set: questions, each paired with the document that holds the answer. Even six questions are enough to notice that something is wrong.' },
            { lines: '70-73', text: 'For each *k*, count the questions where a chunk from the right document is in the top *k*. This is **recall at k**. One question fails at *k* = 1 and *k* = 2 and passes at *k* = 3.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why “Where can I rest and save?” was missed',
          text: 'The inn chunk says “Resting there restores all health and saves the game”. The question says “rest” and “save”, but the chunk contains “resting” and “saves”, which are different strings for this tokenizer. In fact the only word that the question shares with *any* chunk is “and”, which appears in several of them, so the ranking is decided by an accident of chunk length and the inn chunk comes third. A real embedding model handles this inflection naturally, and simple fixes such as stemming or removing very common words also help. The lesson is that **a retriever fails quietly**: the language model will happily answer from the wrong chunks, so you must measure retrieval on its own, before the model is involved.',
        },
        {
          type: 'code',
          title: 'rag_with_a_language_model.py',
          lang: 'python',
          desktopOnly: true,
          code: `import anthropic

client = anthropic.Anthropic()          # the key comes from the ANTHROPIC_API_KEY environment variable

question = "How much does a healing potion need?"
hits = retrieve(question, k=2)          # retrieval step from the offline demo
prompt = build_prompt(question, hits)   # numbered sources + the instructions

response = client.messages.create(
    model="claude-sonnet-5-5",
    max_tokens=300,
    messages=[{"role": "user", "content": prompt}],
)
print(response.content[0].text)`,
          annotations: [
            { lines: 3, text: 'The client from the previous lesson; the key comes from an environment variable.' },
            { lines: '5-7', text: 'Steps 3 and 4 of the pipeline, using the `retrieve` and `build_prompt` functions from the offline demo.' },
            { lines: '9-13', text: 'Step 5: the grounded prompt goes in as the user message. Because the model sees the sources, a good answer reads like “Three red herbs and one flask of spring water [1]”, and a missing fact should produce “I do not know”.' },
          ],
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output: how many chunks does this sliding window make from five sentences?',
      code: `sentences = ["A.", "B.", "C.", "D.", "E."]
size, overlap = 3, 1
step = size - overlap
chunks = [" ".join(sentences[i:i + size]) for i in range(0, len(sentences) - overlap, step)]
print(len(chunks))`,
      answer: '2',
      hint: '`range(0, 4, 2)` gives the start positions. List the sentences each start would take.',
      explanation: 'The start positions are 0 and 2, so the chunks are "A. B. C." and "C. D. E.": two chunks that share the sentence C. With overlap 1 and size 3, the window moves forward by 2 sentences each time.',
    },
    {
      kind: 'error',
      prompt: 'This retrieval code always returns the *least* relevant chunk. Tap the faulty line.',
      lines: [
        'vectors = []',
        'for chunk in chunks:',
        '    vectors.append(embed(chunk))',
        'index = np.array(vectors)',
        'scores = index @ embed(question)',
        'best = chunks[scores.argmin()]',
      ],
      linesAreCode: true,
      errorLines: [6],
      explanation: 'Similarity scores are *higher* for more similar texts, so the best chunk is `scores.argmax()`. `argmin` picks the worst match. (Assuming `embed` returns unit-length vectors, the dot product on line 5 is the cosine similarity. For top *k*, sort with `np.argsort(-scores)[:k]`.)',
    },
    {
      kind: 'numeric',
      prompt: 'A game has 250 000 chunks of help text. Each is stored as an embedding of 400 float32 numbers (4 bytes each). How much memory do the vectors take, in megabytes (1 MB = 1 000 000 bytes)?',
      answer: '400',
      hint: '250 000 × 400 × 4 bytes, then divide by 1 000 000.',
      explanation: '250 000 × 400 = 100 000 000 numbers, times 4 bytes is 400 000 000 bytes, which is 400 MB. That fits in memory on a modern PC, and a brute-force NumPy search over them is still fast, so a vector database is optional at this size. At tens of millions of chunks you would need an approximate index (or half-precision vectors) instead.',
      label: 'Megabytes:',
    },
    {
      kind: 'concept',
      title: 'Making retrieval work in a real game',
      blocks: [
        {
          type: 'p',
          text: 'The pipeline is simple; the quality is in the details. Most RAG problems are retrieval problems, so the practical work is choosing chunks, checking what comes back, and improving the weakest step. Use the table as a checklist.',
        },
        {
          type: 'table',
          headers: ['Decision', 'Rule of thumb', 'What goes wrong'],
          rows: [
            ['**Chunk size**', 'A few sentences to a short paragraph (roughly 100 to 300 words); split on natural boundaries such as headings and paragraphs', 'Too big: the vector blurs several topics and the prompt fills up. Too small: a chunk loses the context needed to understand it'],
            ['**Overlap**', '10 to 20 percent, or one sentence', 'No overlap cuts answers in half; too much repeats the same text in the top results'],
            ['**Top k**', 'Start at 3 to 5, tune with recall at k', 'Too small misses the answer; too many adds noise and cost, and models can lose facts buried in a long prompt'],
            ['**Metadata**', 'Store a source, a section title and tags with every chunk, and filter (for example by region or quest) before ranking', 'Without it, a rule from the wrong chapter or game version is retrieved'],
            ['**Hybrid search**', 'Combine keyword scores and embedding scores, see [[hybrid-search|hybrid search]]', 'Embeddings alone can miss exact names, item IDs and codes; keywords alone miss paraphrases'],
            ['**Index**', 'A NumPy matrix up to about a million vectors; FAISS or a [[vector-database|vector database]] with approximate [[nearest-neighbor-search|nearest-neighbour search]] beyond that', 'Premature infrastructure: an exact search over a few hundred thousand vectors takes milliseconds'],
            ['**Freshness**', 'Re-embed only the documents that changed, and record the model name and version', 'Stale vectors, or a silent mix of two embedding models'],
            ['**Evaluation**', 'Write 20 to 100 real questions with the right source, and track [[recall-at-k|recall at k]] after every change', 'Tuning by feel, and never noticing a regression'],
          ],
          caption: 'A RAG design checklist. Evaluate retrieval separately from generation: if the right chunk is not retrieved, no prompt can save the answer.',
        },
        {
          type: 'p',
          text: 'In a game, RAG is a good fit for an in-game encyclopedia or help assistant that answers from the real rules, NPCs that can speak accurately about the world’s lore, a support tool for players that searches patch notes, and a developer tool that searches your design documents or source code. It is a poor fit for anything the game state itself can answer: ask the *game* for the player’s gold, not an embedding index.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises build the core of a retriever: a chunker, a vectorised top-k cosine search, and the recall-at-k measurement you use to improve both.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `chunk_words(text, size, overlap=0)`. Split `text` on whitespace into words and return a list of chunks, each a string of **at most `size` words** joined with single spaces. Consecutive chunks share `overlap` words, so the window moves forward by `size - overlap` words. Stop as soon as a chunk reaches the last word (do not emit a final chunk made only of words already included). Return `[]` for text with no words. Raise `ValueError` if `size <= 0`, `overlap < 0` or `overlap >= size`.',
      starter: `def chunk_words(text, size, overlap=0):
    ...
`,
      solution: `def chunk_words(text, size, overlap=0):
    if size <= 0 or overlap < 0 or overlap >= size:
        raise ValueError("need size > 0 and 0 <= overlap < size")
    words = text.split()
    if not words:
        return []
    step = size - overlap
    chunks = []
    start = 0
    while True:
        chunks.append(" ".join(words[start:start + size]))
        if start + size >= len(words):
            break
        start += step
    return chunks
`,
      tests: `text = " ".join("w%d" % i for i in range(10))

assert chunk_words(text, 4) == ["w0 w1 w2 w3", "w4 w5 w6 w7", "w8 w9"]
assert chunk_words(text, 4, 1) == ["w0 w1 w2 w3", "w3 w4 w5 w6", "w6 w7 w8 w9"]
assert chunk_words(text, 4, 2) == ["w0 w1 w2 w3", "w2 w3 w4 w5", "w4 w5 w6 w7", "w6 w7 w8 w9"]
assert chunk_words(text, 10) == [text]
assert chunk_words(text, 50) == [text]
assert chunk_words(text, 1) == ["w%d" % i for i in range(10)]
assert chunk_words("  one   two\\nthree  ", 2) == ["one two", "three"]
assert chunk_words("", 3) == []
assert chunk_words("   \\n ", 3) == []
assert chunk_words("solo", 3, 1) == ["solo"]

for size, overlap in [(0, 0), (-1, 0), (3, 3), (3, 4), (3, -1)]:
    try:
        chunk_words(text, size, overlap)
        raise SystemExit("expected ValueError for %r" % ((size, overlap),))
    except ValueError:
        pass`,
      checks: ['Splits on whitespace and joins chunks of at most `size` words with single spaces', 'Moves forward by `size - overlap` words and stops when a chunk reaches the last word', 'Returns `[]` for empty text and raises `ValueError` for invalid `size` or `overlap`'],
      hint: 'Use `words = text.split()` and a `start` index that begins at 0 and grows by `size - overlap`. Append `words[start:start + size]`, then stop if `start + size >= len(words)`.',
      explanation: 'The stop condition matters: without it, a window with overlap would produce a last chunk that only repeats words already covered. Real chunkers usually split on sentences or paragraphs instead of words and measure size in tokens, but the sliding window with overlap is the same idea. Validating the parameters up front avoids an endless loop when `overlap >= size`.',
    },
    {
      kind: 'code',
      prompt: 'Write `top_k_cosine(query, matrix, k=3)` with NumPy. `matrix` has one vector per row. Return a list of `(row_index, score)` tuples for the `k` rows with the highest cosine similarity to `query`, best first, where `score` is a Python float. Rows with ties are ordered by lower index first. A row (or query) of all zeros has similarity `0.0` (no division by zero). If `k` is larger than the number of rows, return all rows.',
      starter: `import numpy as np


def top_k_cosine(query, matrix, k=3):
    ...
`,
      solution: `import numpy as np


def top_k_cosine(query, matrix, k=3):
    matrix = np.asarray(matrix, dtype=float)
    query = np.asarray(query, dtype=float)
    dots = matrix @ query
    norms = np.linalg.norm(matrix, axis=1) * np.linalg.norm(query)
    scores = np.divide(dots, norms, out=np.zeros_like(dots), where=norms > 0)
    order = sorted(range(len(scores)), key=lambda i: (-scores[i], i))[:k]
    return [(i, float(scores[i])) for i in order]
`,
      tests: `import math

matrix = [[1, 0], [0, 1], [1, 1], [2, 0], [0, 0]]
result = top_k_cosine([1, 0], matrix, k=3)
assert [i for i, _ in result] == [0, 3, 2]
assert all(isinstance(s, float) for _, s in result)
assert math.isclose(result[0][1], 1.0) and math.isclose(result[1][1], 1.0)
assert math.isclose(result[2][1], 1 / math.sqrt(2))

everything = top_k_cosine([1, 0], matrix, k=10)
assert [i for i, _ in everything] == [0, 3, 2, 1, 4]
assert everything[-1][1] == 0.0 and everything[-2][1] == 0.0

assert top_k_cosine([0, 0], matrix, k=2) == [(0, 0.0), (1, 0.0)]
assert top_k_cosine([1, 0], matrix, k=1) == [(0, 1.0)]
assert top_k_cosine([1, 0], matrix, k=0) == []

docs = np.array([[0.9, 0.1, 0.0], [0.0, 1.0, 0.2], [0.1, 0.0, 1.0]])
best = top_k_cosine(np.array([0.0, 0.9, 0.3]), docs, k=1)
assert best[0][0] == 1 and 0.99 < best[0][1] <= 1.0
negative = top_k_cosine([1, 0], [[-1, 0], [0, 1]], k=2)
assert negative[0][0] == 1 and math.isclose(negative[1][1], -1.0)
assert docs.shape == (3, 3)`,
      checks: ['Computes cosine similarity of the query against every row without a Python loop over the vectors', 'Returns the top `k` as `(index, float score)` tuples, best first, with ties by lower index', 'Gives 0.0 for all-zero rows or query instead of dividing by zero, and handles `k` larger than the matrix'],
      packages: ['numpy'],
      hint: '`matrix @ query` gives all the dot products at once. Divide by `np.linalg.norm(matrix, axis=1) * np.linalg.norm(query)` using `np.divide(..., out=np.zeros_like(dots), where=norms > 0)` to avoid dividing by zero. Sort indices with the key `(-scores[i], i)` and slice `[:k]`.',
      explanation: 'One matrix-vector product scores every document, which is why a plain NumPy array is a perfectly good vector index for tens or hundreds of thousands of items. The `where=` argument of `np.divide` skips the zero-norm rows and leaves their output at 0. Sorting by `(-score, index)` makes ties deterministic, which matters when you write tests for retrieval. For millions of vectors you would use an approximate index, but the scoring formula is identical.',
    },
    {
      kind: 'code',
      prompt: 'Write `recall_at_k(ranked, relevant, k)`. `ranked` is a list with one entry per question: the ids retrieved for it, best first. `relevant` is a list (same length) of sets holding the ids that count as correct for each question. Return the fraction of questions for which **at least one** of the first `k` retrieved ids is in the relevant set, as a float. Return `0.0` if there are no questions.',
      starter: `def recall_at_k(ranked, relevant, k):
    ...
`,
      solution: `def recall_at_k(ranked, relevant, k):
    if not ranked:
        return 0.0
    hits = sum(1 for got, wanted in zip(ranked, relevant) if any(i in wanted for i in got[:k]))
    return hits / len(ranked)
`,
      tests: `ranked = [["a", "b", "c"], ["x", "y", "z"], ["p", "q", "r"], ["m", "n", "o"]]
relevant = [{"a"}, {"z"}, {"q", "r"}, {"nothing"}]

assert recall_at_k(ranked, relevant, 1) == 0.25
assert recall_at_k(ranked, relevant, 2) == 0.5
assert recall_at_k(ranked, relevant, 3) == 0.75
assert recall_at_k(ranked, relevant, 10) == 0.75
assert recall_at_k(ranked, relevant, 0) == 0.0
assert recall_at_k([], [], 3) == 0.0
assert recall_at_k([["a"]], [{"a"}], 1) == 1.0
assert recall_at_k([[]], [{"a"}], 3) == 0.0
assert recall_at_k([["a", "b"], ["b", "a"]], [{"a", "b"}, {"b"}], 1) == 1.0
assert isinstance(recall_at_k(ranked, relevant, 3), float)
assert [len(r) for r in ranked] == [3, 3, 3, 3]`,
      checks: ['Counts a question as a hit when any of its top `k` ids is in the relevant set', 'Returns hits divided by the number of questions, as a float', 'Returns `0.0` for no questions or `k = 0`'],
      hint: 'For each pair `(got, wanted)`, a hit is `any(i in wanted for i in got[:k])`. Add them up with `sum(...)` and divide by `len(ranked)`.',
      explanation: 'Recall at k answers the question “is the right passage in what the language model gets to see?”. Track it as you change the chunk size, the embedding model or *k*; whichever change raises it is helping. Related measures include **MRR** (the average of 1 divided by the rank of the first correct result), which rewards putting the answer first. Measuring retrieval separately from generation tells you which half of the system to fix.',
    },
  ],
  takeaways: [
    '**TF-IDF** turns a text into a vector with one weight per word (frequency times the log of how rare the word is), and **cosine similarity** compares directions, ignoring length. It is a complete, fast search for exact words, names and codes, but it cannot connect “sword” with “blade”.',
    'An **embedding** is a fixed-size vector (for example 384 numbers) in which texts with similar meaning point in similar directions. LSA shows the idea with a singular value decomposition; real systems use pretrained neural models, called with `model.encode`. With unit-length vectors, cosine similarity is just a dot product.',
    '**Never mix embedding models**: documents and queries must use the same one, and changing it means re-embedding everything. Up to hundreds of thousands of vectors, a NumPy matrix and one matrix-vector product is a fine index; approximate indexes and vector databases are for much larger collections.',
    '**RAG** = chunk, embed and index, retrieve the top *k*, build a **grounded prompt** (numbered sources, “answer only from them, cite them, say when you do not know”), then generate. It gives a model facts it was never trained on and makes answers checkable, but it reduces rather than removes hallucination.',
    '**Retrieval fails quietly**, so measure it on its own with a labelled question set and **recall at k**. Tune chunk size (a few sentences), overlap, *k*, metadata filters and hybrid keyword-plus-embedding search against that number, not by feel.',
  ],
  reading: [
    { title: 'Sentence Transformers documentation', url: 'https://www.sbert.net', source: 'docs', note: 'Pretrained embedding models, semantic search examples and guidance on choosing a model.' },
    { title: 'Introduction to Information Retrieval (Manning, Raghavan, Schütze)', url: 'https://nlp.stanford.edu/IR-book/', source: 'book', note: 'The free textbook on TF-IDF, vector space search and evaluation measures such as recall.' },
    { title: 'Lewis et al.: Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', url: 'https://arxiv.org/abs/2005.11401', source: 'paper', note: 'The paper that named RAG.' },
    { title: 'FAISS: a library for efficient similarity search', url: 'https://github.com/facebookresearch/faiss', source: 'repo', note: 'The standard library for approximate nearest-neighbour search on large vector sets.' },
    { title: 'scikit-learn: text feature extraction (TfidfVectorizer)', url: 'https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction', source: 'docs', note: 'A production-quality TF-IDF implementation, and the tool for LSA with TruncatedSVD.' },
  ],
};
