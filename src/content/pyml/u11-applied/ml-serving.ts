import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'ml-serving',
  title: 'Serving and Shipping Models',
  summary: 'Get a trained model out of the notebook and into something people use: save it together with its preprocessing, wrap it in a FastAPI service, make it fast with quantization and micro-batching, measure latency properly, and run it safely with the right deployment target for a game, a PC app or a phone.',
  minutes: 29,
  objectives: [
    'Save a model with its preprocessing and version, and choose a safe file format',
    'Wrap a model in a FastAPI service with validated input, a health check and a model loaded once at startup',
    'Explain quantization and micro-batching, and what each trades away',
    'Measure latency with percentiles and capacity with simple arithmetic instead of averages',
    'Pick a deployment target (in the engine, local server, remote server, phone) and list the production risks',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A model is a file, and the file must carry everything',
      blocks: [
        {
          type: 'p',
          text: 'Training ends with a file. For a neural network that file is a set of numbers (the weights). But a model is more than weights: it expects inputs prepared in exactly the way they were during training (scaled, in a certain order, with a certain image size), and it produces outputs that must be interpreted (which number is which class). If any of that knowledge stays behind in the notebook, the model will quietly produce nonsense in production. The rule is: **ship the preprocessing with the weights, and give the bundle a version**.',
        },
        {
          type: 'p',
          text: 'The smallest honest example needs no libraries. The program below stores a tiny model (weights, bias, the feature names, and the mean and standard deviation used to scale each feature) as JSON, loads it again, refuses a file in a format it does not understand, and shows what happens when the scaling is forgotten.',
        },
        {
          type: 'code',
          title: 'model_bundle.py',
          runnable: true,
          code: `import json
import math

# Pretend this came out of training: the weights AND the preprocessing that goes with them.
bundle = {
    "format_version": 1,
    "name": "quit-risk",
    "features": ["hours_played", "deaths_per_hour"],
    "mean": [20.0, 4.0],
    "std": [10.0, 2.0],
    "weights": [-0.8, 1.2],
    "bias": -0.3,
}
text = json.dumps(bundle, indent=2)                  # this string is what you would write to quit_risk.json
print("saved", len(text.splitlines()), "lines,", len(text), "characters")


def load_model(text):
    data = json.loads(text)
    if data["format_version"] != 1:
        raise ValueError(f"unsupported model format {data['format_version']}")

    def predict(raw):
        if len(raw) != len(data["features"]):
            raise ValueError(f"expected {len(data['features'])} features, got {len(raw)}")
        z = data["bias"]
        for value, mean, std, weight in zip(raw, data["mean"], data["std"], data["weights"]):
            z += weight * (value - mean) / std           # the same scaling that was used in training
        return 1 / (1 + math.exp(-z))

    return predict


predict = load_model(text)
print("new player, many deaths:", round(predict([5, 9]), 3))
print("veteran, few deaths:    ", round(predict([40, 1]), 3))

# What goes wrong if the scaling is forgotten at inference time:
z = -0.3 + -0.8 * 5 + 1.2 * 9
print("without scaling:        ", round(1 / (1 + math.exp(-z)), 3))

try:
    load_model(text.replace('"format_version": 1', '"format_version": 2'))
except ValueError as error:
    print("rejected:", error)`,
          output: `saved 21 lines, 234 characters
new player, many deaths: 0.98
veteran, few deaths:     0.024
without scaling:         0.998
rejected: unsupported model format 2`,
          annotations: [
            { lines: '5-13', text: 'Everything the model needs: a **format version**, a name, the feature **names and order**, the **scaling** statistics (`mean`, `std`) learned from the training data, and the weights and bias. The scaling belongs to the model as much as the weights do.' },
            { lines: '14-15', text: '`json.dumps` produces the text you would write to a file. JSON suits tiny models and is readable by any language; large models use binary formats.' },
            { lines: '18-21', text: 'Loading checks the version first. A file written by a newer version of your tool should fail loudly, not be half-understood.' },
            { lines: '23-29', text: 'The prediction function checks that it received the right number of features, applies the **same scaling used in training** to each one, and then applies the sigmoid to get a probability between 0 and 1.' },
            { lines: '34-36', text: 'A new player with many deaths per hour is predicted very likely to quit (0.98); a veteran with few deaths is not (0.024).' },
            { lines: '38-40', text: 'The classic production bug: the same raw numbers fed in without the scaling give 0.998, an extreme and wrong answer. The code runs without any error, which is why this kind of mismatch is so dangerous.' },
            { lines: '42-45', text: 'A model file with an unknown format version is rejected with a clear message.' },
          ],
        },
        {
          type: 'table',
          headers: ['Format', 'Used for', 'Notes'],
          rows: [
            ['**state_dict** (`.pt`, PyTorch)', 'Saving and resuming PyTorch training', 'Needs your model class to load; PyTorch only. Load with `torch.load(path, weights_only=True)`'],
            ['**joblib / pickle** (scikit-learn)', 'Classic ML models', 'Tied to library versions, and **unsafe from untrusted sources**: unpickling can run arbitrary code'],
            ['**ONNX** (`.onnx`)', 'Portable inference across languages and engines', 'Runs in ONNX Runtime from Python, C++, C# (Unity) and on phones; see the engine deployment lesson'],
            ['**safetensors**', 'Sharing weights, especially large models', 'Plain tensors with no code execution, so safe to download'],
            ['**GGUF**', 'Quantized language models for llama.cpp and similar local runtimes', 'One file with weights, tokenizer and metadata'],
            ['**JSON / plain text**', 'Tiny models and lookup tables', 'Human-readable and easy to diff; fine when the model is a handful of numbers'],
          ],
          caption: 'Common model file formats. Whatever you choose, store the preprocessing, the input and output description and a version with the weights.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Never load a pickle you did not create',
          text: 'Python’s `pickle` format (which `joblib` and old-style `torch.load` use) can contain instructions that run code during loading. Loading a downloaded “model” file that way is the same as running a stranger’s program. Prefer ONNX, safetensors or `torch.load(..., weights_only=True)` for files from outside, and verify checksums for files you distribute.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You trained a model on standardised inputs (each feature has its mean subtracted and is divided by its standard deviation) and saved only the weights. In the game, the loaded model returns extreme, nonsensical predictions, but raises no error. What is the most likely cause?',
      options: [
        { text: 'The scaling was not applied to the inputs at inference time, so the model receives numbers in a range it never saw', correct: true, why: 'Weights only make sense with the same input preprocessing as in training. Unscaled values are far outside the range the model learned from, which produces extreme outputs without any error.' },
        { text: 'The weights file was corrupted during saving', why: 'A corrupted file would normally fail to load or give random noise, not consistent extreme confidence. The silent, systematic nonsense points to a preprocessing mismatch.' },
        { text: 'The model is overfitted to the training data', why: 'Overfitting lowers accuracy on new data, but it does not typically push every prediction to an extreme because the inputs are on the wrong scale.' },
        { text: 'Python is slower than the training environment', why: 'Speed affects latency, never the values of the predictions.' },
      ],
      explanation: 'Treat preprocessing as part of the model: save the scaling statistics, image size, feature order and label names with the weights, and have a single function that does the preprocessing for both training and serving.',
    },
    {
      kind: 'concept',
      title: 'A model service with FastAPI',
      blocks: [
        {
          type: 'p',
          text: 'If your game, website or tool is not written in Python, or the model needs a GPU the player does not have, run it as a small **service**: a program that loads the model once and answers requests over HTTP. **FastAPI** (`pip install fastapi uvicorn`) is the most popular way to write one in Python. You write ordinary functions with type hints; FastAPI turns them into endpoints, parses the JSON, **validates** it with [[pydantic|Pydantic]] models, rejects bad requests with a clear `422` error, and generates interactive documentation at `/docs`.',
        },
        {
          type: 'code',
          title: 'quit_risk_service.py',
          lang: 'python',
          desktopOnly: true,
          code: `import math
import time

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field

app = FastAPI(title="Quit-risk service")

# Loaded ONCE when the server starts, never inside a request handler.
MODEL = {"mean": [20.0, 4.0], "std": [10.0, 2.0], "weights": [-0.8, 1.2], "bias": -0.3, "version": "1"}


class Player(BaseModel):
    hours_played: float = Field(ge=0, le=10_000)
    deaths_per_hour: float = Field(ge=0, le=500)


def score(player: Player) -> float:
    raw = [player.hours_played, player.deaths_per_hour]
    z = MODEL["bias"] + sum(w * (v - m) / s for v, m, s, w in zip(raw, MODEL["mean"], MODEL["std"], MODEL["weights"]))
    return 1 / (1 + math.exp(-z))


@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL["version"]}


@app.post("/predict")
def predict(player: Player):
    started = time.perf_counter()
    risk = round(score(player), 3)
    return {"quit_risk": risk, "model_version": MODEL["version"], "ms": round((time.perf_counter() - started) * 1000, 2)}


# FastAPI's test client calls the app directly, with no network, so we can test it like any function.
client = TestClient(app)
print(client.get("/health").json())

reply = client.post("/predict", json={"hours_played": 5, "deaths_per_hour": 9})
print(reply.status_code, reply.json()["quit_risk"], reply.json()["model_version"])

bad = client.post("/predict", json={"hours_played": -3, "deaths_per_hour": 9})
print(bad.status_code, bad.json()["detail"][0]["loc"], bad.json()["detail"][0]["type"])

missing = client.post("/predict", json={"hours_played": 5})
print(missing.status_code, missing.json()["detail"][0]["msg"])`,
          output: `{'status': 'ok', 'model_version': '1'}
200 0.98 1
422 ['body', 'hours_played'] greater_than_equal
422 Field required`,
          annotations: [
            { lines: '10-11', text: 'The model is created **once at import time**, not inside a request handler. Loading a model takes far longer than using it, so doing it per request would make every call slow.' },
            { lines: '14-16', text: 'The request body described as a class. `Field(ge=0, le=10_000)` declares the allowed range: Pydantic checks types and limits before your code runs.' },
            { lines: '19-22', text: 'The scoring function: the same scaling and sigmoid as the previous example.' },
            { lines: '25-27', text: 'A **health endpoint** that a load balancer, a game launcher or a monitor can call to see that the service is alive and which model version it runs.' },
            { lines: '30-34', text: 'The prediction endpoint. FastAPI has already parsed and validated `player` by the time the function runs. The response carries the **model version** so that every answer can be traced to the model that produced it.' },
            { lines: '37-39', text: '`TestClient` calls the app directly, without a network or a running server, so a service can be unit-tested like a function. Here it checks the health endpoint.' },
            { lines: '41-42', text: 'A valid request returns status 200 with the quit risk of 0.98.' },
            { lines: '44-48', text: 'Invalid requests never reach the model: a negative number gives a `422` error that names the field and the rule that was broken, and a missing field gives “Field required”.' },
          ],
        },
        {
          type: 'p',
          text: 'To run it for real, save the code (without the test client lines) as `quit_risk_service.py` and start the server with `uvicorn quit_risk_service:app --port 8000`. Any program can then send an HTTP `POST` with JSON to `http://127.0.0.1:8000/predict`: a Unity game with `UnityWebRequest`, a web page with `fetch`, or Python with `urllib.request` or `requests`. Opening `http://127.0.0.1:8000/docs` shows generated interactive documentation.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why validate the input at the edge',
          text: 'A service is exposed to anything that can reach it: typos, missing fields, absurd numbers, and deliberately hostile input. Validating at the boundary means the model code can assume clean data, bad requests fail fast with an explanation, and no one can crash the process or exhaust memory with a gigantic payload. The rule is the same as for tool arguments from an LLM: **never trust data that crossed a boundary**.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'It is fine to load the model file inside the request handler function, because Python caches the loaded model after the first request.',
      answer: false,
      explanation: 'False. Python does not cache that for you: the load would run again on every request, adding the (long) load time to every response and wasting memory and disk reads. Load the model once when the process starts, keep it in a module-level variable (or the application’s startup state), and reuse it in every request.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the decorator for an endpoint that receives a JSON body and returns a prediction.',
      template: `@app.___("/predict")`,
      templateIsCode: true,
      blanks: [{ answers: ['post'] }],
      wordBank: ['get', 'post', 'delete', 'route'],
      explanation: 'Requests that send data to be processed use the HTTP `POST` method, so the decorator is `@app.post(...)`. `@app.get(...)` is for reading, such as the `/health` check.',
    },
    {
      kind: 'concept',
      title: 'Making it fast: quantization and batching',
      blocks: [
        {
          type: 'p',
          text: 'A model that is accurate but too slow or too large is not shippable. Two techniques give big wins for little work. **[[quantization|Quantization]]** stores weights (and sometimes the computations) as 8-bit integers instead of 32-bit floats: the model is about 4 times smaller, uses less memory bandwidth and often runs faster, and accuracy usually drops only slightly. The idea is a simple scaling, which the NumPy program below does by hand. In practice you use a tool for it: ONNX Runtime’s quantization utilities, the quantization options of your inference runtime, or the Q4 and Q8 variants of local language models.',
        },
        {
          type: 'code',
          title: 'int8_by_hand.py',
          runnable: true,
          packages: ['numpy'],
          code: `import numpy as np

rng = np.random.default_rng(0)
weights = rng.normal(0, 0.05, size=(512, 256)).astype(np.float32)     # the weights of one layer

scale = np.abs(weights).max() / 127                    # a single number that maps floats onto -127..127
quantized = np.round(weights / scale).astype(np.int8)  # store 8-bit integers
restored = quantized.astype(np.float32) * scale        # what the runtime effectively computes with

print("bytes:", weights.nbytes, "->", quantized.nbytes)
error = np.abs(weights - restored).max()
print("largest rounding error is at most half a step:", bool(error <= scale / 2 + 1e-9))

x = rng.normal(size=256).astype(np.float32)
exact, approx = weights @ x, restored @ x
print("layer output off by", round(float(np.abs(exact - approx).mean() / np.abs(exact).mean() * 100), 1), "percent on average")`,
          output: `bytes: 524288 -> 131072
largest rounding error is at most half a step: True
layer output off by 1.1 percent on average`,
          annotations: [
            { lines: '3-4', text: 'A random weight matrix standing in for one layer: 512 by 256 numbers in 32-bit floating point.' },
            { lines: 6, text: 'One number, the **scale**, maps the largest weight to 127. Every other weight becomes a whole number between -127 and 127 after dividing by the scale and rounding.' },
            { lines: '7-8', text: 'Store the rounded values as `int8`, one byte each, and multiply by the scale to get approximate floats back (this is what the runtime effectively computes with).' },
            { lines: 10, text: 'The weights now occupy 131 072 bytes instead of 524 288: four times smaller.' },
            { lines: '11-12', text: 'Rounding to the nearest step can be wrong by at most half a step, `scale / 2`, and the check confirms it.' },
            { lines: '14-16', text: 'Multiplying a test input through both versions of the layer gives outputs that differ by about 1 percent on average. Whether that matters depends on the model, so always **re-measure accuracy** after quantizing.' },
          ],
        },
        {
          type: 'p',
          text: 'The second technique is **[[micro-batching|micro-batching]]**. Calling a model has a fixed cost (moving data, starting the computation) plus a small cost for each item, especially on a GPU. Handling 100 requests one at a time pays the fixed cost 100 times. A server can instead hold each request for a few milliseconds, collect those that arrive meanwhile, and run them as one batch. The simulation below uses a made-up cost of 10 ms per call plus 1 ms per item and a stream of one request every 2 ms.',
        },
        {
          type: 'code',
          title: 'micro_batching.py',
          runnable: true,
          code: `OVERHEAD_MS = 10     # fixed cost of every model call (moving data, launching the work)
PER_ITEM_MS = 1      # extra cost for each request inside a call


def simulate(arrivals, max_batch, max_wait):
    """Requests arrive at the given times (ms). The server collects a batch of up to max_batch requests,
    waiting at most max_wait ms after the first one (or until the server is free). Returns the latencies."""
    latencies = []
    server_free = 0
    i = 0
    while i < len(arrivals):
        close = max(server_free, arrivals[i] + max_wait)      # the last moment this batch waits for company
        batch = []
        while i < len(arrivals) and len(batch) < max_batch and arrivals[i] <= close:
            batch.append(i)
            i += 1
        launch = max(server_free, arrivals[batch[-1]]) if len(batch) == max_batch else close
        server_free = launch + OVERHEAD_MS + PER_ITEM_MS * len(batch)
        latencies += [server_free - arrivals[j] for j in batch]
    return latencies


arrivals = [2 * k for k in range(100)]                  # one request every 2 ms, 100 requests
for max_batch, max_wait in [(1, 0), (8, 5), (32, 10)]:
    lat = simulate(arrivals, max_batch, max_wait)
    print(f"batch <= {max_batch:2d}, wait <= {max_wait:2d} ms: average latency {sum(lat) / len(lat):6.1f} ms, worst {max(lat):3d} ms")`,
          output: `batch <=  1, wait <=  0 ms: average latency  456.5 ms, worst 902 ms
batch <=  8, wait <=  5 ms: average latency   34.7 ms, worst  53 ms
batch <= 32, wait <= 10 ms: average latency   27.9 ms, worst  38 ms`,
          annotations: [
            { lines: '1-2', text: 'The cost model: every model call costs 10 ms plus 1 ms for each request in it. Real numbers differ, but the shape of the trade-off is the same.' },
            { lines: '8-10', text: '`server_free` is the time when the model finishes its current job. `i` points to the next request that has not been served.' },
            { lines: 12, text: 'A batch will wait for stragglers until `max_wait` after its first request, or until the server becomes free, whichever is later: while the server is busy, requests pile up anyway.' },
            { lines: '13-16', text: 'Collect every request that has arrived by then, up to `max_batch` of them.' },
            { lines: '17-19', text: 'A full batch launches at once, a partial one launches at its closing time. The batch takes the overhead plus 1 ms per item, and each request’s latency is its finish time minus its arrival time.' },
            { lines: '23-26', text: 'One request per call takes 11 ms but requests come every 2 ms, so the queue grows without limit and the last request waits 902 ms. Batches of up to 8 take 18 ms for 8 requests, which is faster than they arrive, so latency stays near 35 ms even though each request now *waits* a few milliseconds to be batched.' },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Throughput versus latency',
          text: 'Batching raises **throughput** (requests handled per second) by sharing fixed costs, and it costs a little **latency** for the first requests of each batch, which wait for company. A game that needs a reply within one frame may batch only a millisecond or two, or not at all, while a nightly job should use the biggest batches it can. Measure both, and choose the settings from your latency budget.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output: how many milliseconds does running 8 requests as one batch save, compared with running them one by one, with a cost of 10 ms per call plus 1 ms per request?',
      code: `overhead = 10
per_item = 1
one_by_one = 8 * (overhead + per_item)
batched = overhead + 8 * per_item
print(one_by_one - batched)`,
      answer: '70',
      hint: 'Compute 8 × 11 and 10 + 8, then subtract.',
      explanation: 'One by one: 8 × (10 + 1) = 88 ms. Batched: 10 + 8 × 1 = 18 ms. The saving is 88 - 18 = 70 ms, because the fixed cost of 10 ms is paid once instead of eight times (7 × 10 = 70). The larger the fixed cost compared with the per-item cost, the more batching helps.',
    },
    {
      kind: 'error',
      prompt: 'This endpoint answers correctly but takes over a second per request, even though the model itself needs only a few milliseconds. Tap the faulty line.',
      lines: [
        '@app.post("/predict")',
        'def predict(player: Player):',
        '    model = torch.load("quit_risk.pt", weights_only=False)',
        '    return {"quit_risk": float(model(features(player)))}',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Line 3 reads the model from disk on **every request**, so the (slow) load time is added to every response. Load once at startup (`MODEL = torch.load(...)` at module level, or in the application’s startup handler) and reuse it. (`weights_only=False` is also risky for files you did not create, because it allows unpickling arbitrary code.)',
    },
    {
      kind: 'numeric',
      prompt: 'A service runs batches of 40 requests continuously. Each model call takes 10 ms of fixed cost plus 1 ms per request. How many requests per second can it process?',
      answer: '800',
      hint: 'One batch takes 10 + 40 × 1 milliseconds. There are 1 000 milliseconds in a second.',
      explanation: 'A batch of 40 takes 10 + 40 = 50 ms, so the server completes 1000 / 50 = 20 batches per second, which is 20 × 40 = 800 requests per second. Without batching the capacity would be 1000 / 11, about 91 per second. Capacity arithmetic like this tells you how many servers you need before you ever run a load test.',
      label: 'Requests per second:',
    },
    {
      kind: 'concept',
      title: 'Choosing a target and running it safely',
      blocks: [
        {
          type: 'p',
          text: 'Where should the model run? The answer follows from your latency budget, your players’ hardware, privacy and your budget for servers. Each target trades one thing for another.',
        },
        {
          type: 'table',
          headers: ['Target', 'Good for', 'Trade-offs'],
          rows: [
            ['**Inside the game or app process** (ONNX Runtime from C++ or C#, or an embedded Python runtime)', 'Per-frame decisions, offline play, no running costs, lowest latency', 'You ship the model and the runtime; the model must be small and in a portable format; updates arrive with game patches'],
            ['**A local server on the player’s PC** (FastAPI or a runtime like Ollama)', 'Python-only models and bigger models without rewriting them; the game talks HTTP to localhost', 'You must install and start it, and the player’s hardware sets the speed'],
            ['**A remote server you run** (a container on a cloud machine)', 'Big models, GPUs, central updates and monitoring, shared by all players', 'Network latency, ongoing cost, availability and privacy obligations, and it needs an internet connection'],
            ['**A hosted API** (a provider runs the model for you, as with LLM APIs)', 'The largest models and no infrastructure to run', 'Per-use cost, rate limits, dependence on the provider, and data leaves your control'],
            ['**On a phone** (ONNX Runtime Mobile, LiteRT/TensorFlow Lite, ExecuTorch, or a vendor SDK)', 'Offline mobile features, privacy, instant response', 'Tight memory and battery budgets: small and quantized models, tested on real devices. Check each runtime’s current documentation'],
          ],
          caption: 'The deployment target is an engineering decision. Many games use two: a small model in the engine for the fast loop, and a server for the heavy, occasional work.',
        },
        {
          type: 'table',
          headers: ['Risk', 'What to do'],
          rows: [
            ['**Slow responses**', 'Track latency as **percentiles** ([[tail-latency|p50, p95, p99]]), not the average: the average hides the slow requests that players actually notice. Set timeouts, and have a cheap fallback answer when the model is late'],
            ['**Model and code drift apart**', 'Return a model version with every answer, log it, and keep the preprocessing in the same bundle as the weights'],
            ['**Input data changes**', 'Monitor the distribution of the inputs and outputs (for example the share of high-risk predictions per day); a sudden change means a bug or real-world drift'],
            ['**Bad releases**', 'Roll out to a small share of traffic first (a canary), compare against the old model on the same inputs (shadow mode), and keep the previous version one switch away'],
            ['**Abuse and overload**', 'Authentication, rate limits, a maximum request size, and validated input; do not expose model files or internal errors'],
            ['**Reproducibility**', 'Pin library versions, build the service as a container image, and record the data and code that produced each model'],
          ],
          caption: 'A short operations checklist. Most outages in ML systems come from data and process, rarely from the model itself.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'Three exercises build tools every model service needs: a small cache for repeated requests, a latency percentile function, and the grouping rule of a micro-batcher.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write a class `LRUCache` for caching predictions. `LRUCache(capacity)` raises `ValueError` if `capacity < 1`. `get(key)` returns the stored value, or `None` if the key is absent, and marks the key as **most recently used**. `put(key, value)` stores or updates a value (also marking it most recently used) and, when the cache then holds more than `capacity` items, removes the **least recently used** one. `len(cache)` returns the number of items stored.',
      starter: `class LRUCache:
    ...
`,
      solution: `from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be at least 1")
        self.capacity = capacity
        self._items = OrderedDict()

    def get(self, key):
        if key not in self._items:
            return None
        self._items.move_to_end(key)
        return self._items[key]

    def put(self, key, value):
        self._items[key] = value
        self._items.move_to_end(key)
        if len(self._items) > self.capacity:
            self._items.popitem(last=False)

    def __len__(self):
        return len(self._items)
`,
      tests: `cache = LRUCache(2)
assert len(cache) == 0
assert cache.get("a") is None
cache.put("a", 1)
cache.put("b", 2)
assert cache.get("a") == 1
cache.put("c", 3)
assert cache.get("b") is None
assert cache.get("a") == 1 and cache.get("c") == 3
assert len(cache) == 2

cache = LRUCache(2)
cache.put("a", 1)
cache.put("b", 2)
cache.put("a", 10)
cache.put("c", 3)
assert cache.get("a") == 10
assert cache.get("b") is None
assert len(cache) == 2

cache = LRUCache(1)
cache.put("x", 1)
cache.put("y", 2)
assert cache.get("x") is None and cache.get("y") == 2 and len(cache) == 1

cache = LRUCache(3)
for key in "abc":
    cache.put(key, key.upper())
cache.get("a")
cache.get("b")
cache.put("d", "D")
assert cache.get("c") is None
assert [cache.get(k) for k in "abd"] == ["A", "B", "D"]

cache = LRUCache(2)
cache.put("none", None)
assert len(cache) == 1

for bad in (0, -1):
    try:
        LRUCache(bad)
        raise SystemExit("expected ValueError")
    except ValueError:
        pass`,
      checks: ['Returns `None` for missing keys and the stored value otherwise, and `get` refreshes the key', 'Evicts the least recently used item when `put` exceeds the capacity, and updating a key refreshes it too', 'Raises `ValueError` for a capacity below 1 and supports `len()`'],
      hint: '`collections.OrderedDict` remembers the order of keys: `move_to_end(key)` marks one as most recent and `popitem(last=False)` removes the oldest.',
      explanation: 'A cache lets a service answer repeated requests (the same question to an NPC, the same image) without running the model again. Evicting the *least recently used* entry keeps the items most likely to be asked again. Python ships this ready-made as `functools.lru_cache` for function results; writing it by hand shows how little is needed. When caching model outputs, include the model version in the key, so that a new model never returns an old model’s answers.',
    },
    {
      kind: 'code',
      prompt: 'Write `percentile(values, p)` using the **nearest-rank** method: sort a copy of `values`, compute `rank = ceil(p * n / 100)` (with `n = len(values)`), raise the rank to at least 1, and return the value at that rank (1-based). Raise `ValueError` if `values` is empty or `p` is not between 0 and 100 inclusive. Do not modify the input list.',
      starter: `import math


def percentile(values, p):
    ...
`,
      solution: `import math


def percentile(values, p):
    if not values:
        raise ValueError("no values")
    if not 0 <= p <= 100:
        raise ValueError("p must be between 0 and 100")
    ordered = sorted(values)
    rank = max(1, math.ceil(p * len(ordered) / 100))
    return ordered[rank - 1]
`,
      tests: `latencies = [40, 15, 50, 35, 20]
assert percentile(latencies, 0) == 15
assert percentile(latencies, 30) == 20
assert percentile(latencies, 40) == 20
assert percentile(latencies, 50) == 35
assert percentile(latencies, 100) == 50
assert latencies == [40, 15, 50, 35, 20]

hundred = list(range(1, 101))
assert percentile(hundred, 50) == 50
assert percentile(hundred, 95) == 95
assert percentile(hundred, 99) == 99
assert percentile(hundred, 99.9) == 100
assert percentile(hundred, 1) == 1

assert percentile([7], 0) == 7
assert percentile([7], 50) == 7
assert percentile([7], 100) == 7
assert percentile([3, 3, 3], 90) == 3
assert percentile([1.5, 0.5], 50) == 0.5

twenty = [10] * 19 + [900]
assert percentile(twenty, 95) == 10
assert percentile(twenty, 96) == 900
assert sum(twenty) / len(twenty) == 54.5

for args in [([], 50), ([1, 2], -1), ([1, 2], 101)]:
    try:
        percentile(*args)
        raise SystemExit("expected ValueError for %r" % (args,))
    except ValueError:
        pass`,
      checks: ['Sorts a copy and returns the value at rank `ceil(p * n / 100)`, with a minimum rank of 1', 'Raises `ValueError` for an empty list or `p` outside 0 to 100', 'Does not modify the input list'],
      hint: 'Sort with `sorted(values)` (which returns a new list), compute `rank = max(1, math.ceil(p * n / 100))`, and index with `rank - 1`. Multiply by `n` before dividing so exact cases such as 95 percent of 20 stay exact.',
      explanation: 'The last test shows why services track percentiles: with 19 requests at 10 ms and one at 900 ms, the average is 54.5 ms, which describes no real request, while p95 is 10 ms and p96 reveals the slow outlier. Many teams watch p50 (typical), p95 and p99 (the experience of the unlucky), and set targets on them. Other percentile definitions interpolate between values; nearest-rank always returns a value that was actually observed.',
    },
    {
      kind: 'code',
      prompt: 'Write `make_batches(arrivals, max_batch, max_wait)`. `arrivals` is a list of request arrival times in milliseconds, in ascending order. A batch starts with the first request not yet batched, and also includes each following request that arrives **no later than `max_wait` after the first request of that batch**, up to `max_batch` requests in total. Return a list of batches, each a list of request **indexes**, in order. Raise `ValueError` if `max_batch < 1`. Do not modify the input.',
      starter: `def make_batches(arrivals, max_batch, max_wait):
    ...
`,
      solution: `def make_batches(arrivals, max_batch, max_wait):
    if max_batch < 1:
        raise ValueError("max_batch must be at least 1")
    batches = []
    i = 0
    while i < len(arrivals):
        batch = [i]
        i += 1
        while i < len(arrivals) and len(batch) < max_batch and arrivals[i] - arrivals[batch[0]] <= max_wait:
            batch.append(i)
            i += 1
        batches.append(batch)
    return batches
`,
      tests: `arrivals = [0, 1, 2, 10, 11, 30]
assert make_batches(arrivals, 3, 5) == [[0, 1, 2], [3, 4], [5]]
assert make_batches(arrivals, 2, 5) == [[0, 1], [2], [3, 4], [5]]
assert make_batches(arrivals, 10, 100) == [[0, 1, 2, 3, 4, 5]]
assert make_batches(arrivals, 10, 0) == [[0], [1], [2], [3], [4], [5]]
assert make_batches(arrivals, 1, 100) == [[0], [1], [2], [3], [4], [5]]
assert make_batches([], 4, 5) == []
assert make_batches([7], 4, 5) == [[0]]
assert make_batches([0, 0, 0, 1], 5, 0) == [[0, 1, 2], [3]]
assert make_batches([0, 4, 5, 6, 11], 10, 5) == [[0, 1, 2], [3, 4]]
assert make_batches([0, 6], 10, 5) == [[0], [1]]
assert arrivals == [0, 1, 2, 10, 11, 30]

flat = [i for batch in make_batches(list(range(25)), 4, 100) for i in batch]
assert flat == list(range(25))
assert [len(b) for b in make_batches(list(range(25)), 4, 100)] == [4, 4, 4, 4, 4, 4, 1]

for bad in (0, -2):
    try:
        make_batches([0, 1], bad, 5)
        raise SystemExit("expected ValueError")
    except ValueError:
        pass`,
      checks: ['Starts each batch at the first unbatched request and adds later requests within `max_wait` of that first one', 'Never puts more than `max_batch` requests in a batch, and keeps the original order and indexes', 'Returns `[]` for no requests and raises `ValueError` when `max_batch < 1`'],
      hint: 'Use an index `i`. Start a batch with `[i]`, then keep appending while the next request exists, the batch is not full and `arrivals[next] - arrivals[first] <= max_wait`.',
      explanation: 'This is the grouping rule at the core of a micro-batcher (the simulation earlier added the effect of a busy server). The two limits express the trade-off from the lesson: `max_batch` caps the work done per call, and `max_wait` caps the latency added to the earliest request. Real servers implement the same idea with queues and timers, and some inference runtimes provide it built in.',
    },
  ],
  takeaways: [
    '**A model is weights plus everything needed to use them**: preprocessing (scaling statistics, image size), feature order, label names and a **version**. Forgetting the preprocessing produces silent nonsense, so ship it in the same bundle and use one function for training and serving.',
    'Choose formats deliberately: **ONNX** for portable inference, **safetensors** or `torch.load(weights_only=True)` for weights from outside, JSON for tiny models. **Never load a pickle you did not create**, because it can run code.',
    'A **FastAPI** service loads the model **once at startup**, validates every request with Pydantic (bad input gets a `422` before it touches the model), exposes a **health** check, returns the **model version**, and can be tested without a network using `TestClient`.',
    '**Quantization** (8-bit weights) makes a model about 4 times smaller for a small accuracy cost, and **micro-batching** shares the fixed cost of each model call across requests, raising throughput at the price of a little latency. Always re-measure accuracy and latency after changing either.',
    'Measure with **percentiles** (p50, p95, p99), not averages, and do capacity arithmetic. Pick the target (in the engine, local server, remote server, hosted API, phone) from the latency budget, hardware, privacy and cost, and operate it with versions, monitoring, canary releases, rate limits and a fallback.',
  ],
  reading: [
    { title: 'FastAPI documentation', url: 'https://fastapi.tiangolo.com', source: 'docs', note: 'The tutorial covers request models, validation, testing and deployment.' },
    { title: 'ONNX Runtime documentation', url: 'https://onnxruntime.ai/docs/', source: 'docs', note: 'Running ONNX models from many languages, quantization tools and mobile builds.' },
    { title: 'Hugging Face safetensors', url: 'https://github.com/huggingface/safetensors', source: 'repo', note: 'A safe, fast tensor file format and why it exists instead of pickle.' },
    { title: 'Google: Rules of Machine Learning', url: 'https://developers.google.com/machine-learning/guides/rules-of-ml', source: 'article', note: 'Practical rules for shipping ML systems, including training-serving skew.' },
    { title: 'Hidden Technical Debt in Machine Learning Systems (Sculley et al.)', url: 'https://papers.nips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html', source: 'paper', note: 'Why the code around the model is where most of the maintenance cost lives.' },
  ],
};
