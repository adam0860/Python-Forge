import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-unicode-bytes',
  title: 'Unicode, Encodings and bytes',
  summary: 'The difference between text and bytes: code points, UTF-8, encode and decode, what causes UnicodeDecodeError and mojibake, normalization, and using `bytes`, `bytearray` and `struct` for binary game and network data.',
  minutes: 19,
  objectives: [
    'Explain that `str` holds Unicode code points while `bytes` holds raw 0–255 values, and convert between them with `encode` and `decode`',
    'Describe how UTF-8 stores characters in one to four bytes and why `len(s)` differs from `len(s.encode())`',
    'Diagnose `UnicodeDecodeError`, `UnicodeEncodeError` and garbled "mojibake" text, and choose an `errors=` strategy',
    'Compare strings safely with normalization and `casefold`, and know why one emoji can have a length greater than 1',
    'Read and build binary data with `bytes`, `bytearray`, `int.to_bytes` and `struct`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Text is not bytes',
      blocks: [
        {
          type: 'p',
          text: 'Computers store and send **bytes** — numbers from 0 to 255. People read **text** — letters, accents, symbols, emoji. Python keeps the two as separate types so you cannot confuse them: a `str` is a sequence of [[unicode]] **characters**, and a `bytes` object is a sequence of small integers. Turning text into bytes is **encoding**; turning bytes back into text is **decoding**.',
        },
        {
          type: 'p',
          text: 'Unicode gives every character a number called a [[code-point]] (`U+0041` is `A`, `U+2713` is ✓, `U+1F600` is 😀). It does not say how to store that number — that is the job of an [[encoding]]. The one you will use almost always is [[utf-8]], which spends one byte on the 128 ASCII characters and up to four bytes on the rest.',
        },
        {
          type: 'code',
          title: 'text_vs_bytes.py',
          runnable: true,
          code: `s = "héllo ✓"
print(len(s), len(s.encode("utf-8")))
print(s.encode("utf-8"))
print(list(s.encode("utf-8")))
print(ord("A"), ord("é"), ord("✓"), chr(97), chr(0x2713), hex(ord("✓")))
for ch in "Aé✓😀":
    print(repr(ch), hex(ord(ch)), len(ch.encode("utf-8")))`,
          output: `7 10
b'h\\xc3\\xa9llo \\xe2\\x9c\\x93'
[104, 195, 169, 108, 108, 111, 32, 226, 156, 147]
65 233 10003 a ✓ 0x2713
'A' 0x41 1
'é' 0xe9 2
'✓' 0x2713 3
'😀' 0x1f600 4`,
          annotations: [
            { lines: 2, text: 'The string has **7 characters** but its UTF-8 form is **10 bytes**: `é` takes two bytes and `✓` takes three.' },
            { lines: 3, text: '`bytes` print as `b"…"`. Printable ASCII bytes appear as letters; everything else as `\\xNN` hexadecimal escapes.' },
            { lines: 4, text: 'Underneath, a `bytes` object is just integers. `h` is 104, and the two bytes of `é` are 195 and 169.' },
            { lines: 5, text: '`ord` turns a character into its code point; `chr` goes the other way. Hex literals like `0x2713` are the usual way to write code points.' },
            { lines: 6, text: 'Higher code points need more bytes — the loop on the next line prints 1, 2, 3 and 4 bytes for four characters.' },
            { lines: 7, text: '`repr` shows each character in quotes; `hex(ord(ch))` shows its code point; the last number is the UTF-8 length.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why UTF-8 won',
          text: 'UTF-8 is backwards compatible with ASCII (pure English text is byte-for-byte identical), has no byte-order problems, can represent every Unicode character, and a corrupted byte damages only one character. Those properties made it the default for web pages, JSON, source files and nearly every modern tool — so "just use UTF-8" is almost always right.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'In C++, `std::string` is really a byte container and `char` is a byte, so a "string" may or may not be valid text depending on its encoding. Python’s `str` is true text (code points), and `bytes` is the byte container — the types force you to say where the conversion happens.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In Python, what is `len("naïve".encode("utf-8"))`?',
      options: [
        { text: '`5`', why: 'That is `len("naïve")`, the number of characters. The encoded form is longer because `ï` needs two bytes.' },
        { text: '`6`', correct: true, why: 'Right: n, a, v and e take one byte each and `ï` (U+00EF) takes two, so 4 + 2 = 6 bytes.' },
        { text: '`10`', why: 'Nothing here needs more than two bytes, so the total cannot be that large.' },
        { text: 'It raises an error because `ï` is not ASCII.', why: 'UTF-8 can encode every Unicode character; only a limited encoding such as ASCII would fail.' },
      ],
      explanation: 'UTF-8 uses one byte for ASCII characters and two for characters up to U+07FF, such as `ï`. The string has 5 characters but 6 bytes — which is why sizes in files and network messages are measured in bytes, not characters.',
    },
    {
      kind: 'concept',
      title: 'When it goes wrong: decode errors and mojibake',
      blocks: [
        {
          type: 'p',
          text: 'Encoding errors almost always mean two sides disagree about the encoding. Decoding bytes with the wrong codec either raises `UnicodeDecodeError` (the bytes are not valid for that encoding) or, worse, *succeeds* and returns nonsense — the garbled "Ã©" you sometimes see on web pages, called **mojibake**. Going the other direction, `UnicodeEncodeError` means the target encoding has no way to write a character.',
        },
        {
          type: 'code',
          title: 'encoding_errors.py',
          runnable: true,
          code: `data = "café".encode("utf-8")
print(data, data.decode("utf-8"))
print(data.decode("latin-1"))
try:
    data.decode("ascii")
except UnicodeDecodeError as e:
    print(type(e).__name__, e)
try:
    "café".encode("ascii")
except UnicodeEncodeError as e:
    print(type(e).__name__, e)
for mode in ("replace", "ignore", "backslashreplace", "xmlcharrefreplace"):
    print(mode, "café".encode("ascii", errors=mode))
print(b"abc\\xff".decode("utf-8", errors="replace"))`,
          output: `b'caf\\xc3\\xa9' café
cafÃ©
UnicodeDecodeError 'ascii' codec can't decode byte 0xc3 in position 3: ordinal not in range(128)
UnicodeEncodeError 'ascii' codec can't encode character '\\xe9' in position 3: ordinal not in range(128)
replace b'caf?'
ignore b'caf'
backslashreplace b'caf\\\\xe9'
xmlcharrefreplace b'caf&#233;'
abc�`,
          annotations: [
            { lines: 2, text: 'Decoding with the same codec used to encode gives the original text back — a perfect round trip.' },
            { lines: 3, text: 'Decoding UTF-8 bytes as `latin-1` never fails (every byte is a valid Latin-1 character) but turns the two bytes of `é` into `Ã©`. That is mojibake: wrong answer, no error.' },
            { lines: 5, text: 'ASCII only knows bytes below 128, so the byte `0xc3` is rejected. The message gives the codec, the byte and its position — read it, it tells you exactly where the data stops matching.' },
            { lines: 9, text: 'The reverse direction fails too: ASCII has no `é`.' },
            { lines: 12, text: 'Every encode/decode call accepts `errors=`. `replace` swaps in `?` (or `�` when decoding), `ignore` drops the problem silently, `backslashreplace` writes a Python escape and `xmlcharrefreplace` writes an HTML entity.' },
            { lines: 14, text: 'Bytes that are not valid UTF-8 (`0xff` is never valid) become the replacement character `�` instead of raising an error.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '`errors="ignore"` hides data loss',
          text: 'Silencing an error means the missing text is gone with no warning. Prefer the strict default so bugs surface early; use `replace` or `backslashreplace` only for output that is for humans to read (logs, console messages), where a placeholder is better than a crash.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Always name your encodings',
          text: 'When you open a text file, pass the encoding explicitly: `open(path, encoding="utf-8")`. If you do not, Python uses a platform-dependent default, and a program that works on your Linux machine can fail on a Windows one (the Files lesson returns to this).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this line.',
      code: `print(len("naïve"), len("naïve".encode("utf-8")))`,
      answer: '5 6',
      hint: 'Count characters first, then count how many bytes UTF-8 needs for them.',
      explanation: '`"naïve"` has five characters, so `len` is 5. Encoded as UTF-8, the `ï` takes two bytes and the other four letters take one each: 6 bytes.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the round trip: bytes in, text out, then text back to bytes.',
      template: `raw = b"caf\\xc3\\xa9"
text = raw.___("utf-8")
back = text.___("utf-8")
print(text, back)`,
      templateIsCode: true,
      blanks: [{ answers: ['decode'] }, { answers: ['encode'] }],
      wordBank: ['decode', 'encode', 'bytes', 'str'],
      explanation: '`bytes.decode` produces text (`str`), and `str.encode` produces `bytes`. A handy way to remember: you *encode* text into a secret code of bytes, and *decode* it to read it again.',
    },
    {
      kind: 'concept',
      title: 'Same-looking text, different code points',
      blocks: [
        {
          type: 'p',
          text: 'Unicode lets the same visible character be written more than one way. The letter `é` can be a single code point (`U+00E9`) or an `e` followed by a *combining* acute accent (`U+0301`). They look identical on screen and are **different strings** to Python. The fix is [[normalization]]: convert both to the same canonical form before comparing. For case-insensitive comparison use `casefold()`, which handles cases like German `ß`.',
        },
        {
          type: 'code',
          title: 'normalization.py',
          runnable: true,
          code: `import unicodedata
a = "é"
b = "e\\u0301"
print(a == b, len(a), len(b), a, b)
print(unicodedata.normalize("NFC", b) == a, len(unicodedata.normalize("NFD", a)))
print(unicodedata.name("✓"), unicodedata.category("A"))
print("Straße".casefold() == "STRASSE".casefold(), "ß".upper())
print("😀", len("😀"), len("😀".encode("utf-8")))
print(len("\\U0001F468\\u200d\\U0001F469\\u200d\\U0001F467"))`,
          output: `False 1 2 é é
True 2
CHECK MARK Lu
True SS
😀 1 4
5`,
          annotations: [
            { lines: 3, text: '`\\u0301` is an escape for one code point: the combining acute accent. Written after `e`, it draws `é`.' },
            { lines: 4, text: 'They print identically, yet `a == b` is `False` and the lengths differ (1 versus 2).' },
            { lines: 5, text: '`NFC` composes combining sequences into single code points; `NFD` decomposes them. After normalizing both sides to the same form, the strings are equal.' },
            { lines: 6, text: '`unicodedata` is the standard-library database: `name` gives the official character name and `category` a code such as `Lu` (uppercase letter).' },
            { lines: 7, text: '`casefold()` is a stronger `lower()` meant for comparisons: it treats `ß` as `ss`. Notice that `"ß".upper()` is `"SS"` — changing case can change the length of a string.' },
            { lines: 8, text: 'One emoji is one code point and four UTF-8 bytes.' },
            { lines: 9, text: 'A "family" emoji is three emoji glued with invisible zero-width joiners — five code points drawn as **one** symbol. `len` counts code points, not what a person sees.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Characters, code points and glyphs',
          text: 'What people call a "character" can be several code points (a letter plus accents, a joined emoji). Python’s `len` and indexing work on code points. If you must count visible symbols — for a text box that wraps, or a name limit — you need a library that understands *grapheme clusters* (such as the third-party `regex` or `grapheme` packages). For most game and tool code, code points are good enough.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Normalize at the door',
          text: 'Usernames, file names and search terms from users should be normalized (`NFC`) and, for comparison, casefolded as they *enter* your program. Then every later `==` and dictionary lookup just works.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: '`len(s)` always equals the number of symbols a person sees when the string is displayed.',
      answer: false,
      explanation: 'False. `len` counts Unicode code points. An accented letter written as `e` plus a combining accent counts as 2, and a joined emoji (a family, a flag) can count as 5 or more even though it is drawn as one symbol.',
    },
    {
      kind: 'error',
      prompt: 'This code should build a greeting packet, but it crashes with a `TypeError`. Tap the line with the bug.',
      lines: [
        'prefix = b"MSG:"',
        'name = "Zoë"',
        'packet = prefix + name',
        'print(packet)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Line 3 adds `bytes` to `str`, which Python refuses (`can\'t concat str to bytes`). Encode the text first: `packet = prefix + name.encode("utf-8")`.',
    },
    {
      kind: 'concept',
      title: 'bytes, bytearray and struct: binary data',
      blocks: [
        {
          type: 'p',
          text: 'Game saves, network packets, image headers and file formats are all binary. Python’s [[bytes-object]] type is immutable, supports indexing and slicing like a list of integers (indexing gives an `int`, slicing gives `bytes`), and `bytearray` is its mutable twin. To pack numbers into a fixed layout, use `int.to_bytes` for single integers and the `struct` module for several fields at once.',
        },
        {
          type: 'code',
          title: 'binary.py',
          runnable: true,
          code: `packet = b"HP\\x00K"
print(packet, packet[0], packet[1:3], len(packet))
print(packet.hex(), bytes.fromhex("48 50"), bytes([72, 80, 255]))
ba = bytearray(b"abc")
ba[0] = 65
ba.append(100)
print(ba, bytes(ba))
print((300).to_bytes(2, "little"), (300).to_bytes(2, "big"), int.from_bytes(b"\\x01\\x2c", "big"))
import struct
pk = struct.pack("<HIf", 7, 100000, 1.5)
print(pk, len(pk), struct.unpack("<HIf", pk))
print(struct.calcsize("<HIf"), struct.calcsize("HIf"))`,
          output: `b'HP\\x00K' 72 b'P\\x00' 4
4850004b b'HP' b'HP\\xff'
bytearray(b'Abcd') b'Abcd'
b',\\x01' b'\\x01,' 300
b'\\x07\\x00\\xa0\\x86\\x01\\x00\\x00\\x00\\xc0?' 10 (7, 100000, 1.5)
10 12`,
          annotations: [
            { lines: 1, text: 'A bytes literal: printable ASCII as letters, anything else as `\\xNN` hex escapes. `\\x00` is the zero byte; `K` is 0x4B.' },
            { lines: 2, text: '`packet[0]` is the integer 72 (not `"H"`), while `packet[1:3]` is a slice, which is still `bytes`.' },
            { lines: 3, text: '`.hex()` shows the bytes as hexadecimal text and `bytes.fromhex` parses it back. `bytes([…])` builds bytes from a list of integers between 0 and 255.' },
            { lines: 4, text: '`bytearray` can be changed in place: assign into it and append to it. Convert back with `bytes(ba)`.' },
            { lines: 8, text: '`to_bytes(length, byteorder)` writes an integer as bytes. 300 is `0x012C`: **little-endian** stores the low byte first (`2c 01`), **big-endian** stores the high byte first (`01 2c`).' },
            { lines: 10, text: '`struct.pack` builds a fixed layout from a format string: `<` means little-endian with no padding, `H` is an unsigned 16-bit integer, `I` an unsigned 32-bit integer and `f` a 32-bit float. Hence 2 + 4 + 4 bytes.' },
            { lines: 11, text: '`unpack` returns a **tuple**, giving back `(7, 100000, 1.5)`.' },
            { lines: 12, text: 'Without `<` or `>`, `struct` uses the platform’s native alignment, adding padding bytes (12 here instead of 10). For files and network data always state the byte order explicitly.' },
          ],
        },
        {
          type: 'table',
          headers: ['Code', 'C type', 'Size (with `<`)'],
          rows: [
            ['`B` / `b`', 'unsigned / signed char', '1 byte'],
            ['`H` / `h`', 'unsigned / signed short', '2 bytes'],
            ['`I` / `i`', 'unsigned / signed int', '4 bytes'],
            ['`Q` / `q`', 'unsigned / signed long long', '8 bytes'],
            ['`f` / `d`', 'float / double', '4 / 8 bytes'],
          ],
          caption: 'The most common `struct` format codes.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why byte order matters',
          text: 'Different CPUs and file formats store multi-byte numbers in different orders. If a writer uses little-endian and a reader assumes big-endian, 300 is read as 11,265. Network protocols conventionally use big-endian ("network byte order"); most PCs use little-endian internally. Always specify it in the format string or the `byteorder` argument.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'str and bytes never mix',
          text: '`"a" + b"b"` raises a `TypeError`, and `b"abc" == "abc"` is simply `False` — there is no silent conversion. You must call `.encode()` or `.decode()` yourself, which is exactly the point.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'How many bytes does `struct.pack("<HBff", 1, 100, 0.5, -2.0)` produce?',
      answer: '11',
      hint: 'Add the sizes: `H` is 2 bytes, `B` is 1, and each `f` is 4. The `<` means no padding.',
      explanation: '$2 + 1 + 4 + 4 = 11$ bytes. Because the format starts with `<`, `struct` adds no alignment padding between the fields.',
      label: 'Bytes:',
    },
    {
      kind: 'order',
      prompt: 'Put these lines in order to build a **length-prefixed** message (a 2-byte length, then the UTF-8 text) and read it back.',
      lines: [
        'payload = "score: 9000 ✓".encode("utf-8")',
        'header = len(payload).to_bytes(2, "big")',
        'packet = header + payload',
        'length = int.from_bytes(packet[:2], "big")',
        'text = packet[2:2 + length].decode("utf-8")',
      ],
      linesAreCode: true,
      distractors: ['text = packet.decode("ascii")'],
      explanation: 'Encode the text first, because the length must be the number of **bytes**, not characters. The header and payload are joined into a packet; the reader then parses the length from the first two bytes and decodes exactly that many bytes. Decoding the whole packet as ASCII (the distractor) would fail on the header and the `✓`.',
    },
    {
      kind: 'code',
      prompt: 'Write `truncate_utf8(text, max_bytes)` that returns the longest start of `text` whose UTF-8 encoding fits in `max_bytes` bytes **without cutting a character in half**. For example, `truncate_utf8("héllo", 3)` is `"hé"` and `truncate_utf8("héllo", 2)` is `"h"`.',
      starter: `# define truncate_utf8 here
`,
      solution: `def truncate_utf8(text, max_bytes):
    data = text.encode("utf-8")[:max_bytes]
    return data.decode("utf-8", errors="ignore")
`,
      tests: `assert truncate_utf8("héllo", 3) == "hé", truncate_utf8("héllo", 3)
assert truncate_utf8("héllo", 2) == "h"
assert truncate_utf8("abc", 10) == "abc"
assert truncate_utf8("✓✓", 4) == "✓"
assert truncate_utf8("😀", 3) == ""
assert truncate_utf8("", 5) == ""
assert truncate_utf8("hello", 0) == ""`,
      checks: ['Never returns a broken half-character', 'Counts bytes, not characters', 'Returns the whole text when it already fits'],
      hint: 'Encode first, slice the *bytes*, then decode again. A slice that ends in the middle of a character will not decode — `errors="ignore"` drops that partial piece.',
      explanation: 'Slicing the encoded bytes enforces the byte limit exactly. If the cut lands inside a multi-byte character, the leftover bytes are not valid UTF-8, and decoding with `errors="ignore"` silently discards just that fragment. This is a legitimate use of `ignore`: you *know* the only damage is the trailing partial character. Name length limits in network protocols and databases are often defined in bytes.',
    },
    {
      kind: 'code',
      prompt: 'Write two functions for a compact player record:\n\n- `pack_player(player_id, hp, x, y)` returns `bytes` using little-endian with layout: 16-bit unsigned id, 8-bit unsigned hp, then two 32-bit floats for `x` and `y` (11 bytes total).\n- `unpack_player(data)` returns a dictionary with the keys `"id"`, `"hp"`, `"x"` and `"y"`.',
      starter: `import struct

# define pack_player and unpack_player here
`,
      solution: `import struct

FORMAT = "<HBff"

def pack_player(player_id, hp, x, y):
    return struct.pack(FORMAT, player_id, hp, x, y)

def unpack_player(data):
    player_id, hp, x, y = struct.unpack(FORMAT, data)
    return {"id": player_id, "hp": hp, "x": x, "y": y}
`,
      tests: `data = pack_player(1, 100, 0.5, -2.0)
assert isinstance(data, bytes)
assert len(data) == 11, len(data)
assert data == b"\\x01\\x00d\\x00\\x00\\x00?\\x00\\x00\\x00\\xc0", data
assert unpack_player(data) == {"id": 1, "hp": 100, "x": 0.5, "y": -2.0}
assert unpack_player(pack_player(65535, 255, 1.5, 2.25)) == {"id": 65535, "hp": 255, "x": 1.5, "y": 2.25}`,
      checks: ['Little-endian layout with no padding (11 bytes)', 'Round-trips every field correctly'],
      hint: 'The format string is `"<HBff"`. Use `struct.pack` and `struct.unpack` with the same string, and build the dictionary from the unpacked tuple.',
      explanation: 'Keeping the format string in one constant guarantees the writer and reader agree — the most common binary-format bug is a mismatch between them. `unpack` returns a tuple, which is unpacked into four names and then wrapped in a dictionary with readable keys.',
    },
    {
      kind: 'code',
      prompt: 'Write `hex_dump(data)` that returns the bytes as two-digit lowercase hex values separated by single spaces: `hex_dump(b"HP\\x00")` is `"48 50 00"`, and the empty bytes give `""`.',
      starter: `# define hex_dump here
`,
      solution: `def hex_dump(data):
    return " ".join(f"{byte:02x}" for byte in data)
`,
      tests: `assert hex_dump(b"HP\\x00") == "48 50 00", hex_dump(b"HP\\x00")
assert hex_dump(b"") == ""
assert hex_dump(b"\\xff") == "ff"
assert hex_dump(bytes(range(3))) == "00 01 02"
assert hex_dump("é".encode("utf-8")) == "c3 a9"`,
      checks: ['Two digits per byte, zero-padded', 'Single spaces between bytes and none at the ends'],
      hint: 'Iterating over bytes yields integers. Format each with the spec `02x` (zero-padded, width 2, lowercase hex) and join them with `" "`.',
      explanation: 'Iterating over `bytes` gives integers, and the f-string spec `02x` from the Formatting lesson zero-pads each to two hex digits. `" ".join(...)` puts spaces only between items, so an empty input gives an empty string. (The built-in `data.hex(" ")` does the same thing.)',
    },
  ],
  takeaways: [
    '`str` is text (Unicode code points); `bytes` is raw 0–255 values. `text.encode("utf-8")` makes bytes and `data.decode("utf-8")` makes text — they never mix implicitly.',
    'UTF-8 uses 1–4 bytes per character, so `len(s)` and `len(s.encode())` can differ. Sizes in files and network protocols are counted in bytes.',
    'A `UnicodeDecodeError` means the bytes do not match the codec; garbled "Ã©" text (mojibake) means a wrong codec that happened to succeed. Name the encoding explicitly and use `errors=` only deliberately.',
    'Identical-looking strings can differ in code points: normalize with `unicodedata.normalize("NFC", s)` and compare with `casefold()`. `len` counts code points, not visible symbols.',
    '`bytes` (immutable), `bytearray` (mutable), `int.to_bytes`/`from_bytes` and `struct` read and write binary layouts — always state the byte order, e.g. `"<HBff"`.',
  ],
  reading: [
    { title: 'Unicode HOWTO', url: 'https://docs.python.org/3/howto/unicode.html', source: 'docs', note: 'The official, clear explanation of Unicode in Python, with examples.' },
    { title: 'struct — Interpret bytes as packed binary data', url: 'https://docs.python.org/3/library/struct.html', source: 'docs', note: 'Format characters, byte orders and alignment rules in full.' },
    { title: 'unicodedata — Unicode Database', url: 'https://docs.python.org/3/library/unicodedata.html', source: 'docs', note: 'Character names, categories and normalization.' },
    { title: 'The Absolute Minimum Every Software Developer Must Know About Unicode', url: 'https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/', source: 'article', note: 'Joel Spolsky’s classic, readable introduction to encodings.' },
  ],
};
