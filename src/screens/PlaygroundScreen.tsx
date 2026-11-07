import { useEffect, useState } from 'react';
import { CodeEditor, ConsoleView, RunButton, useRunner } from '../components/CodeRunner';
import { Icon } from '../components/Icon';
import { loadJSON, saveJSON } from '../lib/storage';
import { usePythonStatus, warmUpPython } from '../lib/python';
import { sfx } from '../lib/sound';
import { toast } from '../lib/ui';
import { copyText } from '../lib/platform';

const KEY = 'pythonforge.playground.v1';

const SAMPLES: { id: string; label: string; code: string; stdin?: string }[] = [
  {
    id: 'hello',
    label: 'Hello, world',
    code: `# Welcome to the playground! Edit this code and press Run (or Ctrl+Enter).
name = "Python Forge"
print(f"Hello from {name}!")

import sys
print("Running Python", sys.version.split()[0])`,
  },
  {
    id: 'fizzbuzz',
    label: 'FizzBuzz',
    code: `for n in range(1, 21):
    if n % 15 == 0:
        print("FizzBuzz")
    elif n % 3 == 0:
        print("Fizz")
    elif n % 5 == 0:
        print("Buzz")
    else:
        print(n)`,
  },
  {
    id: 'guess',
    label: 'Guess the number (input)',
    code: `import random

secret = random.randint(1, 10)
for attempt in range(1, 4):
    guess = int(input("Guess a number from 1 to 10: "))
    if guess == secret:
        print(f"Got it in {attempt}!")
        break
    print("Too low." if guess < secret else "Too high.")
else:
    print(f"Out of guesses — it was {secret}.")`,
    stdin: '5\n7\n3',
  },
  {
    id: 'dice',
    label: 'Dice statistics',
    code: `import random
from collections import Counter

rolls = [random.randint(1, 6) + random.randint(1, 6) for _ in range(10_000)]
counts = Counter(rolls)
for total in range(2, 13):
    bar = "█" * (counts[total] // 40)
    print(f"{total:>2} {bar} {counts[total]}")`,
  },
  {
    id: 'class',
    label: 'A tiny game entity',
    code: `from dataclasses import dataclass

@dataclass
class Enemy:
    name: str
    hp: int = 30

    def hit(self, damage: int) -> None:
        self.hp = max(0, self.hp - damage)
        status = "defeated!" if self.hp == 0 else f"{self.hp} HP left"
        print(f"{self.name} takes {damage} damage — {status}")

goblin = Enemy("Goblin")
for dmg in (12, 9, 15):
    goblin.hit(dmg)`,
  },
];

interface Saved {
  code: string;
  stdin: string;
}

export function PlaygroundScreen() {
  const [state, setState] = useState<Saved>(() => loadJSON<Saved>(KEY, { code: SAMPLES[0].code, stdin: '' }));
  const runner = useRunner();
  const py = usePythonStatus();
  const [showInput, setShowInput] = useState(() => /\binput\s*\(/.test(state.code));

  useEffect(() => {
    warmUpPython();
  }, []);
  useEffect(() => {
    const t = setTimeout(() => saveJSON(KEY, state), 400);
    return () => clearTimeout(t);
  }, [state]);

  const run = () => {
    sfx.tap();
    void runner.run(state.code, { stdin: state.stdin, timeoutMs: 20_000 });
  };
  const load = (id: string) => {
    const s = SAMPLES.find((x) => x.id === id);
    if (!s) return;
    setState({ code: s.code, stdin: s.stdin ?? '' });
    setShowInput(Boolean(s.stdin));
    runner.clear();
  };

  return (
    <div className="screen playground">
      <header className="page-head">
        <h1>Playground</h1>
        <p className="muted">
          A scratchpad with a real Python interpreter that runs on your device — no internet needed.
          {py.status === 'ready' && ` Python ${py.version} is ready.`}
          {py.status === 'loading' && ' Starting Python…'}
          {py.status === 'error' && ' Python could not start on this device.'}
        </p>
      </header>

      <div className="pg-toolbar">
        <label className="pg-select">
          <Icon name="list" size={16} />
          <select value="" onChange={(e) => load(e.target.value)} aria-label="Load an example">
            <option value="" disabled>
              Load an example…
            </option>
            {SAMPLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={`btn btn-soft btn-sm${showInput ? ' on' : ''}`} onClick={() => setShowInput((v) => !v)} aria-pressed={showInput}>
          <Icon name="type" size={16} /> Input
        </button>
        <button
          type="button"
          className="btn btn-soft btn-sm"
          onClick={async () => {
            if (await copyText(state.code)) toast({ icon: 'copy', title: 'Code copied' }, 1600);
          }}
        >
          <Icon name="copy" size={16} /> Copy
        </button>
        <span className="grow" />
        <RunButton running={runner.running} onRun={run} onStop={runner.stop} />
      </div>

      <div className="code-block pg-editor">
        <CodeEditor value={state.code} onChange={(code) => setState((s) => ({ ...s, code }))} onRun={run} minLines={14} ariaLabel="Playground code" />
        {showInput && (
          <label className="stdin-box">
            <span>
              <Icon name="type" size={13} /> Input for <code>input()</code> — one line per call
            </span>
            <textarea value={state.stdin} onChange={(e) => setState((s) => ({ ...s, stdin: e.target.value }))} rows={3} spellCheck={false} />
          </label>
        )}
        <ConsoleView chunks={runner.chunks} running={runner.running} status={runner.status} onClear={runner.clear} />
      </div>

      <p className="muted small pg-note">
        Runs the full Python standard library. Programs stop after 20 seconds. Packages such as NumPy and pandas download automatically the first
        time you <code>import</code> them (internet needed once per session); packages that need a GPU or native code, like PyTorch, run on your
        PC instead.
      </p>
    </div>
  );
}
