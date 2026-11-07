import type { GlossaryEntry } from '../../types';

// Glossary terms introduced by this unit that are NOT in scripts/glossary-master.ts.
export const glossary: GlossaryEntry[] = [
  {
    id: 'code-point',
    term: 'Code point',
    course: 'python',
    category: 'Text',
    short: 'The number Unicode assigns to a character, written like `U+2713` (✓). A Python `str` is a sequence of code points; `ord("✓")` gives 10003 and `chr(10003)` goes back.',
    see: ['unicode', 'encoding'],
  },
  {
    id: 'encoding',
    term: 'Encoding',
    course: 'python',
    category: 'Text',
    short: 'A rule for turning text (code points) into bytes and back. `"é".encode("utf-8")` gives two bytes; `bytes.decode()` reverses it. Using the wrong encoding to decode produces errors or garbled text.',
    see: ['utf-8', 'code-point'],
  },
  {
    id: 'utf-8',
    term: 'UTF-8',
    course: 'python',
    category: 'Text',
    short: 'The dominant Unicode encoding: it uses 1 to 4 bytes per character, matches ASCII for the first 128 characters, and is the default for Python source files and most of the web.',
    see: ['encoding', 'unicode'],
  },
  {
    id: 'bytes-object',
    term: 'bytes',
    course: 'python',
    category: 'Text',
    short: 'An immutable sequence of integers from 0 to 255, written `b"HP\\x00"`. It is what files, sockets and encodings really deal in. Its mutable sibling is `bytearray`.',
    see: ['encoding', 'immutable'],
  },
  {
    id: 'normalization',
    term: 'Unicode normalization',
    course: 'python',
    category: 'Text',
    short: 'Converting text to a canonical form so that visually identical strings compare equal: `"é"` can be one code point or `e` plus a combining accent, and `unicodedata.normalize("NFC", s)` makes them the same.',
    see: ['unicode', 'code-point'],
  },
  {
    id: 'regular-expression',
    term: 'Regular expression',
    course: 'python',
    category: 'Text',
    short: 'A compact pattern language for describing text to find, validate or extract, such as `\\d+` for "one or more digits". Python’s `re` module compiles and runs them.',
    see: ['raw-string', 'str'],
  },
];
