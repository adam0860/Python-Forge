import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'pg-sound',
  title: 'Sound Effects and Music',
  summary: 'Short effects with Sound, long tracks with mixer.music, volume and panning, and an audio layer that never crashes a game when there is no sound device.',
  minutes: 34,
  objectives: [
    'Play short effects with `pygame.mixer.Sound` and a long track with `pygame.mixer.music`, and explain why they are different',
    'Set volumes, loop music and fade it out',
    'Explain channels and what happens when too many sounds play at once',
    'Make a game keep working when audio cannot start (no device, missing file)',
    'Compute volume falloff with distance, stereo pan and fades as plain functions',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Two kinds of sound',
      blocks: [
        {
          type: 'p',
          text: 'pygame’s `mixer` module mixes sounds together and sends them to the speakers. It offers two different tools, for two different jobs:',
        },
        {
          type: 'table',
          headers: ['Aspect', '`mixer.Sound`', '`mixer.music`'],
          rows: [
            ['**For**', 'Short effects: a shot, a jump, a coin, an explosion', 'One long track: the background music'],
            ['**Memory**', 'Decoded and kept **in memory** (about 10 MB per minute)', '**Streamed** from the file as it plays (very little memory)'],
            ['**At once**', 'Many sounds overlap (each uses a **channel**)', 'Only **one** track at a time'],
            ['**Create**', '`s = pygame.mixer.Sound("assets/shoot.wav")`', '`pygame.mixer.music.load("assets/theme.ogg")`'],
            ['**Play**', '`s.play()`', '`pygame.mixer.music.play(-1)` (-1 means loop forever)'],
            ['**Volume**', '`s.set_volume(0.6)`', '`pygame.mixer.music.set_volume(0.4)`'],
            ['**Formats**', 'WAV and OGG are safest', 'OGG and WAV are safest; MP3 support depends on the system'],
          ],
          caption: 'Volumes run from 0.0 (silent) to 1.0 (full). Use OGG for music: small and universally supported.',
        },
        {
          type: 'code',
          title: 'sound_demo.py',
          desktopOnly: true,
          code: `import pygame

pygame.mixer.pre_init(44100, -16, 2, 512)
pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

try:
    shoot = pygame.mixer.Sound("assets/shoot.wav")
    shoot.set_volume(0.6)
    pygame.mixer.music.load("assets/music.wav")
    pygame.mixer.music.set_volume(0.4)
    pygame.mixer.music.play(-1)
    sound_ok = True
except pygame.error:
    sound_ok = False

muted = False
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE and sound_ok:
                shoot.play()
            elif event.key == pygame.K_m and sound_ok:
                muted = not muted
                pygame.mixer.music.set_volume(0.0 if muted else 0.4)

    screen.fill((20, 24, 48))
    pygame.display.flip()
    clock.tick(60)

pygame.quit()`,
          annotations: [
            { lines: '3', text: '`pre_init` must come **before** `pygame.init()`. A small buffer (512 samples) lowers the delay between pressing a key and hearing the sound.' },
            { lines: '8-16', text: 'Audio can fail: no sound card, a remote desktop session, a missing file. Wrapping the setup in `try/except pygame.error` lets the game start silently instead of crashing.' },
            { lines: '9-10', text: 'A `Sound` is loaded once, before the loop, like an image, and its volume set once.' },
            { lines: '11-13', text: 'The music is loaded as a stream and started with `play(-1)`: loop for ever. Keep it quieter than the effects, or the shots will be lost under it.' },
            { lines: '25-26', text: 'Play an effect on the `KEYDOWN` **event**, so that one press makes one shot. The same sound can overlap itself if you press again before it ends.' },
            { lines: '27-29', text: 'Mute by setting the music volume to 0. (There is also `pygame.mixer.music.pause()`.) Settings screens use the same calls with a slider.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why two different tools?',
          text: 'Decoding a three-minute song into memory would need tens of megabytes, and a long pause at start-up. Streaming it avoids both, at the price of "one music track at a time". Effects are the opposite: tiny, needed **instantly**, and often several at once, so they are decoded up front and kept in memory. The split follows the job: effects fire and overlap; music sits underneath.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You want a 3-minute background track that loops while the game runs, plus a gunshot that can fire many times a second. What do you use?',
      options: [
        { text: '`mixer.music` for the track, and `mixer.Sound` for the gunshot', correct: true, why: 'The track streams with almost no memory; the short shot stays in memory and can overlap itself.' },
        { text: '`mixer.Sound` for both', why: 'It would decode three minutes of audio into memory (tens of megabytes) before the game starts.' },
        { text: '`mixer.music` for both', why: '`music` plays only one thing at a time, so a gunshot would cut off the song, or be impossible to overlap.' },
        { text: 'A new `mixer.Sound(...)` created on each shot', why: 'That reloads and decodes the file for each shot, causing stutters. Create it once and `play()` it many times.' },
      ],
      explanation: 'Streamed music for the long track, in-memory `Sound` for effects, and create each Sound once.',
    },
    {
      kind: 'truefalse',
      prompt: 'Two different tracks can be played at the same time with `pygame.mixer.music`, as long as they are loaded one after the other.',
      answer: false,
      explanation: 'False. `mixer.music` has a single stream: `load` replaces the current track. To layer sounds, use `Sound` objects, each of which plays on its own channel. (A crossfade between two songs is done by fading the old one out, `music.fadeout(ms)`, and then starting the next.)',
    },
    {
      kind: 'concept',
      title: 'Channels, volume and good manners',
      blocks: [
        {
          type: 'p',
          text: 'When a `Sound` plays, the mixer gives it a free **channel**: a lane that carries one sound. By default there are 8. If a ninth sound is started while all 8 are busy, it simply **does not play** (unless you ask for a channel yourself, see `pygame.mixer.find_channel(True)`, which steals the quietest). A game that fires a thousand overlapping bullet sounds is not louder, it is only sloppy. Practical rules:',
        },
        {
          type: 'table',
          headers: ['Habit', 'Why'],
          rows: [
            ['Limit repeats: a cooldown on repeated effects', 'A machine gun playing at 60 Hz sounds like a buzz and uses every channel'],
            ['Vary the sound a little (a few variants, chosen at random)', 'The same sample over and over sounds mechanical and tiring'],
            ['Set the **mix**: music about 0.3 to 0.5, effects 0.6 to 1.0', 'Effects must be heard over the music'],
            ['Offer volume and mute settings', 'Players expect them, and it is two lines'],
            ['Never let missing audio crash the game', 'Not every computer has a working sound device'],
            ['Use files you may legally use', 'Check licences; free libraries state them'],
          ],
          caption: 'Sound is half of the "feel" of a game: a missing hit sound makes a hit feel like nothing.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the audio setup: an effect, looping music, and a volume.',
      template: `shoot = pygame.mixer.___("assets/shoot.wav")
pygame.mixer.music.play(___)
pygame.mixer.music.___(0.4)`,
      templateIsCode: true,
      blanks: [{ answers: ['Sound'] }, { answers: ['-1'] }, { answers: ['set_volume'] }],
      wordBank: ['Sound', '-1', 'set_volume', '0', 'load', 'volume'],
      explanation: '`Sound(path)` loads an effect; `play(-1)` loops the music for ever; `set_volume(0.4)` sets it to 40 percent.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. A sound’s own volume is 0.8 and the player’s master volume setting is 0.5. The final loudness is the two multiplied. (The output is rounded to avoid float noise.)',
      code: `own = 0.8
master = 0.5
print(round(own * master, 2))`,
      answer: '0.4',
      hint: '80 percent of 50 percent.',
      explanation: 'Volumes multiply: 0.8 x 0.5 = 0.4. That is how a settings screen scales every sound without changing each one’s balance: keep each sound’s own volume, and apply the master on top.',
    },
    {
      kind: 'concept',
      title: 'Where sounds come from, and one bank for all of them',
      blocks: [
        {
          type: 'p',
          text: 'Sound can also depend on **where** things are. Volume falls with distance (a distant explosion is quieter) and a sound on the left should come from the left speaker. Both are simple formulas: a **falloff** that is 1 at distance 0 and 0 at the maximum distance, and a **pan** that sends more to the left or right channel. Pass them to `channel.set_volume(left, right)`.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Put audio behind one small class',
          text: 'Instead of calling `pygame.mixer` all over the game, keep one `SoundBank` object that loads and caches sounds, ignores missing ones and honours mute. The rest of the game says `sounds.play("coin")` and never worries about audio errors, which also makes it testable with a fake loader. The exercises build that class.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This program crashes with `pygame.error: mixer not initialized`. Tap the line that causes it.',
      lines: [
        'import pygame',
        'shoot = pygame.mixer.Sound("assets/shoot.wav")',
        'pygame.init()',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The mixer must be started before any sound is created: `pygame.init()` (or `pygame.mixer.init()`) comes first. Reorder so `pygame.init()` runs before `mixer.Sound(...)`.',
    },
    {
      kind: 'numeric',
      prompt: 'A mono sound at 44100 samples per second, 16 bits (2 bytes) per sample, lasts 2 seconds. How many bytes does it take once decoded in memory?',
      answer: '176400',
      hint: '44100 x 2 seconds x 2 bytes.',
      explanation: '44100 x 2 x 2 = 176 400 bytes, about 172 kilobytes. Stereo doubles that. Three minutes of stereo would be about 31 megabytes: the reason long tracks are streamed with `mixer.music` instead of loaded as a `Sound`.',
      label: 'Bytes:',
    },
    {
      kind: 'concept',
      title: 'Your turn: audio you can test',
      blocks: [
        {
          type: 'p',
          text: 'Real audio cannot be heard by a test, but everything around it can be checked: the volumes, the decisions, and the safety. You will write the formulas, the safe sound bank (with an injected loader and fake sounds), and a playlist.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `volume_for_distance(distance, max_distance)`: 1.0 at distance 0, falling in a straight line to 0.0 at `max_distance`, and 0.0 beyond it (never negative, never above 1). Write `pan_for_x(x, width)`: returns `(left, right)` volumes: with `t = x / width` limited to 0 to 1, left is `1 - t` and right is `t`. Write `fade(start, end, elapsed, duration)`: the value part-way from `start` to `end` after `elapsed` seconds of a fade lasting `duration` (a duration of 0 or less gives `end`; time outside the fade is limited to its ends).',
      starter: `def volume_for_distance(distance, max_distance):
    ...


def pan_for_x(x, width):
    ...


def fade(start, end, elapsed, duration):
    ...
`,
      solution: `def volume_for_distance(distance, max_distance):
    if max_distance <= 0:
        return 0.0
    return max(0.0, min(1.0, 1.0 - distance / max_distance))


def pan_for_x(x, width):
    t = max(0.0, min(1.0, x / width))
    return (1.0 - t, t)


def fade(start, end, elapsed, duration):
    if duration <= 0:
        return end
    t = max(0.0, min(1.0, elapsed / duration))
    return start + (end - start) * t
`,
      tests: `assert volume_for_distance(0, 100) == 1.0
assert volume_for_distance(50, 100) == 0.5
assert volume_for_distance(100, 100) == 0.0
assert volume_for_distance(250, 100) == 0.0
assert volume_for_distance(-10, 100) == 1.0
assert volume_for_distance(25, 100) == 0.75
assert volume_for_distance(5, 0) == 0.0
assert pan_for_x(0, 640) == (1.0, 0.0)
assert pan_for_x(640, 640) == (0.0, 1.0)
assert pan_for_x(320, 640) == (0.5, 0.5)
assert pan_for_x(160, 640) == (0.75, 0.25)
assert pan_for_x(-50, 640) == (1.0, 0.0)
assert pan_for_x(900, 640) == (0.0, 1.0)
assert fade(1.0, 0.0, 0, 2) == 1.0
assert fade(1.0, 0.0, 1, 2) == 0.5
assert fade(1.0, 0.0, 2, 2) == 0.0
assert fade(1.0, 0.0, 5, 2) == 0.0
assert fade(0.0, 1.0, -3, 2) == 0.0
assert fade(0.25, 0.75, 1, 2) == 0.5
assert fade(0.3, 0.9, 0, 0) == 0.9`,
      checks: ['`volume_for_distance` is a straight line from 1.0 down to 0.0, limited to that range', '`pan_for_x` returns `(1 - t, t)` with `t = x / width` limited to 0..1', '`fade` interpolates with the time limited to the fade, and a zero duration gives the end value'],
      hint: 'All three have the same shape: compute a fraction `t`, limit it with `max(0.0, min(1.0, t))`, then use it. For the fade, `start + (end - start) * t`.',
      explanation: 'These formulas are linear interpolation again (the same idea as `lerp`). A music fade-out is `fade(1.0, 0.0, elapsed, 2)` applied to the music volume each frame. Real hearing is logarithmic, so sound designers often square the volume for a more natural falloff, but a straight line is a good start.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `SoundBank(loader)`. `loader(name)` returns a sound object (which has `play()` and `set_volume(v)`) or raises an exception when the sound cannot be loaded. `play(name)` plays the named sound and returns `True`; it returns `False` and plays nothing if the bank is muted, or if loading failed. Each name is loaded **at most once**, even when loading failed (never retry). The attribute `muted` starts `False`. `set_master(volume)` stores the master volume (default 1.0) and calls `set_volume(volume)` on every sound that has loaded successfully; sounds loaded later also get that volume when they load.',
      starter: `class SoundBank:
    def __init__(self, loader):
        ...

    def play(self, name):
        ...

    def set_master(self, volume):
        ...
`,
      solution: `class SoundBank:
    def __init__(self, loader):
        self.loader = loader
        self.sounds = {}
        self.muted = False
        self.master = 1.0

    def _get(self, name):
        if name not in self.sounds:
            try:
                sound = self.loader(name)
                sound.set_volume(self.master)
            except Exception:
                sound = None
            self.sounds[name] = sound
        return self.sounds[name]

    def play(self, name):
        if self.muted:
            return False
        sound = self._get(name)
        if sound is None:
            return False
        sound.play()
        return True

    def set_master(self, volume):
        self.master = volume
        for sound in self.sounds.values():
            if sound is not None:
                sound.set_volume(volume)
`,
      tests: `class FakeSound:
    def __init__(self, name):
        self.name = name
        self.plays = 0
        self.volume = None

    def play(self):
        self.plays += 1

    def set_volume(self, v):
        self.volume = v

loaded = []

def loader(name):
    loaded.append(name)
    if name == "missing":
        raise FileNotFoundError(name)
    return FakeSound(name)

bank = SoundBank(loader)
assert bank.muted is False
assert loaded == [], "nothing is loaded until it is needed"
assert bank.play("coin") is True
assert bank.play("coin") is True
assert loaded == ["coin"], "loaded only once"
assert bank.sounds["coin"].plays == 2
assert bank.play("missing") is False
assert bank.play("missing") is False
assert loaded == ["coin", "missing"], "a failed load is not retried"
bank.muted = True
assert bank.play("coin") is False
assert bank.sounds["coin"].plays == 2, "muted: nothing played"
assert bank.play("shoot") is False
assert "shoot" not in loaded, "muted: no need to load"
bank.muted = False
bank.set_master(0.5)
assert bank.sounds["coin"].volume == 0.5
assert bank.play("shoot") is True
assert bank.sounds["shoot"].volume == 0.5, "new sounds get the master volume"
bank.set_master(0.25)
assert bank.sounds["coin"].volume == 0.25 and bank.sounds["shoot"].volume == 0.25
assert bank.play("missing") is False`,
      checks: ['Sounds are loaded lazily and only once, and a failed load is remembered (not retried)', '`play` returns `True` when it played and `False` when muted or missing, without raising', '`set_master` updates every loaded sound, and later loads use the current master volume'],
      hint: 'A dictionary `self.sounds` maps a name to a sound or `None`. In a helper, `try: sound = self.loader(name) ... except Exception: sound = None`, and store the result so a failure is also remembered. Check `self.muted` before even loading.',
      explanation: 'This tiny class carries three good habits: load lazily and cache, treat missing audio as normal rather than fatal, and inject the loader so a test (or a silent mode) can replace it. In the real game the loader is `lambda n: pygame.mixer.Sound(f"assets/{n}.wav")`.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Playlist(tracks, loop=True)` for the background music. `current` is a property giving the current track name, or `None` if the list is empty or finished. `next()` moves to the following track and returns the new `current`: after the last track it wraps to the first when `loop` is `True`, otherwise `current` becomes `None` (finished) and stays `None`. `previous()` moves back, wrapping to the last track when `loop` is true; without looping it stops at the first track. An empty playlist always gives `None`.',
      starter: `class Playlist:
    def __init__(self, tracks, loop=True):
        ...

    @property
    def current(self):
        ...

    def next(self):
        ...

    def previous(self):
        ...
`,
      solution: `class Playlist:
    def __init__(self, tracks, loop=True):
        self.tracks = list(tracks)
        self.loop = loop
        self.index = 0
        self.finished = False

    @property
    def current(self):
        if not self.tracks or self.finished:
            return None
        return self.tracks[self.index]

    def next(self):
        if not self.tracks or self.finished:
            return None
        if self.index + 1 < len(self.tracks):
            self.index += 1
        elif self.loop:
            self.index = 0
        else:
            self.finished = True
        return self.current

    def previous(self):
        if not self.tracks:
            return None
        if self.finished:
            self.finished = False
            self.index = len(self.tracks) - 1
        elif self.index > 0:
            self.index -= 1
        elif self.loop:
            self.index = len(self.tracks) - 1
        return self.current
`,
      tests: `p = Playlist(["a", "b", "c"])
assert p.current == "a"
assert p.next() == "b" and p.next() == "c"
assert p.next() == "a", "wraps around"
assert p.previous() == "c", "wraps backwards"
assert p.previous() == "b" and p.current == "b"
q = Playlist(["a", "b"], loop=False)
assert q.current == "a"
assert q.previous() == "a", "stops at the first"
assert q.next() == "b"
assert q.next() is None and q.current is None, "finished"
assert q.next() is None
e = Playlist([])
assert e.current is None and e.next() is None and e.previous() is None
one = Playlist(["only"])
assert one.next() == "only" and one.previous() == "only"
one2 = Playlist(["only"], loop=False)
assert one2.next() is None
src = ["x", "y"]
r = Playlist(src)
src.append("z")
assert r.next() == "y" and r.next() == "x", "the list is copied"`,
      checks: ['`next` and `previous` move through the tracks and wrap when `loop` is true', 'Without looping, `next` past the end finishes (`None`) and `previous` stops at the start', 'Empty lists are safe, and the playlist copies the list it is given'],
      hint: 'Keep an `index` (and a `finished` flag for the non-looping end). `current` is `tracks[index]` unless empty or finished. Use `list(tracks)` to copy.',
      explanation: 'A playlist is just an index over a list with a rule for the ends. In the game loop you would watch `pygame.mixer.music.get_busy()`: when it turns `False`, call `next()` and load that track. The same wrap-or-stop logic drives menus, slideshows and level lists.',
    },
  ],
  takeaways: [
    '`mixer.Sound(path)` is for **short effects**: decoded into memory, many can overlap, `play()` them often. `mixer.music` **streams one long track**: `load`, `play(-1)` to loop, `fadeout(ms)`.',
    'Create each `Sound` **once** before the loop; call `pygame.init()` (or `mixer.init()`) before creating any. `mixer.pre_init(44100, -16, 2, 512)` before `init` gives a small buffer and a short delay.',
    'Volumes go from 0.0 to 1.0 and multiply: sound volume times master volume. Keep music quieter than effects.',
    'There are only 8 channels by default; extra sounds are silently dropped. Limit repeats with cooldowns, and vary the samples.',
    'Never let audio kill the game: wrap setup in `try/except pygame.error`, and keep sound behind one small bank class that ignores missing files and honours mute.',
    'Falloff, panning and fades are linear interpolation with a clamped fraction; being plain functions, they are easy to test.',
  ],
  reading: [
    { title: 'pygame docs: pygame.mixer', url: 'https://www.pygame.org/docs/ref/mixer.html', source: 'docs', note: 'Sound, Channel and mixer.music, with every method and the supported formats.' },
    { title: 'Freesound', url: 'https://freesound.org/', source: 'other', note: 'A huge library of sound effects with clear licences. Check each one before use.' },
    { title: 'Audacity', url: 'https://www.audacityteam.org/', source: 'other', note: 'A free editor to trim, convert and normalise your sound files to WAV or OGG.' },
    { title: 'Kenney: Free game assets', url: 'https://kenney.nl/assets', source: 'other', note: 'Public-domain art and sound packs made for games.' },
  ],
};
