// Local oxlint JS plugin.
// Heuristic coverage for Sonar S5852 / eslint-plugin-regexp
// no-super-linear-backtracking, which oxlint does not implement.
//
// It flags a quantified atom that can consume the same characters as the atom
// directly after it, e.g. /\s*\n/ or /[a-z]*[a-z]/. That adjacency is what makes
// the engine retry every split point, which is the reported super-linear case.
// It deliberately ignores groups, alternation and assertions to stay
// conservative (no false positives), so it is a subset of the Sonar rule.
const MAX_CODE_POINT = 0x10ffff;

const DIGIT = [[0x30, 0x39]];
const WORD = [
  [0x30, 0x39],
  [0x41, 0x5a],
  [0x5f, 0x5f],
  [0x61, 0x7a],
];
const SPACE = [
  [0x09, 0x0d],
  [0x20, 0x20],
  [0xa0, 0xa0],
  [0x1680, 0x1680],
  [0x2000, 0x200a],
  [0x2028, 0x2029],
  [0x202f, 0x202f],
  [0x205f, 0x205f],
  [0x3000, 0x3000],
  [0xfeff, 0xfeff],
];
const DOT = [
  [0x00, 0x09],
  [0x0b, 0x0c],
  [0x0e, 0x2027],
  [0x202a, MAX_CODE_POINT],
];

function normalize(set) {
  if (set.length === 0) return [];
  const sorted = set.toSorted((a, b) => a[0] - b[0]);
  const merged = [sorted[0].slice()];
  for (let i = 1; i < sorted.length; i += 1) {
    const last = merged.at(-1);
    if (sorted[i][0] <= last[1] + 1) last[1] = Math.max(last[1], sorted[i][1]);
    else merged.push(sorted[i].slice());
  }
  return merged;
}

function complement(set) {
  const merged = normalize(set);
  const out = [];
  let prev = 0;
  for (const [lo, hi] of merged) {
    if (lo > prev) out.push([prev, lo - 1]);
    prev = hi + 1;
  }
  if (prev <= MAX_CODE_POINT) out.push([prev, MAX_CODE_POINT]);
  return out;
}

function intersects(a, b) {
  for (const [aStart, aEnd] of a) {
    for (const [bStart, bEnd] of b) {
      if (aStart <= bEnd && bStart <= aEnd) return true;
    }
  }
  return false;
}

const SHORTHANDS = {
  d: DIGIT,
  w: WORD,
  s: SPACE,
};

function escapedSet(char) {
  const lower = char.toLowerCase();
  if (SHORTHANDS[lower]) return lower === char ? SHORTHANDS[lower] : complement(SHORTHANDS[lower]);
  const code = { n: 0x0a, r: 0x0d, t: 0x09, f: 0x0c, v: 0x0b, 0: 0x00 }[char];
  if (code !== undefined) return [[code, code]];
  return [[char.codePointAt(0), char.codePointAt(0)]];
}

// Reads one member of a character class (a literal code point or an escape) as a
// set of code point ranges plus how many characters it spans.
function readClassMember(pattern, start) {
  if (pattern[start] !== '\\') {
    const code = pattern.codePointAt(start);
    return { set: [[code, code]], width: code > 0xffff ? 2 : 1, shorthand: false };
  }
  const escaped = pattern[start + 1];
  const shorthand = SHORTHANDS[escaped.toLowerCase()];
  if (!shorthand) return { set: escapedSet(escaped), width: 2, shorthand: false };
  const set = escaped === escaped.toLowerCase() ? shorthand : complement(shorthand);
  return { set, width: 2, shorthand: true };
}

// Reads a character class starting at `[` and returns its set plus the index after `]`.
function readClass(pattern, start) {
  let i = start + 1;
  let negated = false;
  if (pattern[i] === '^') {
    negated = true;
    i += 1;
  }
  const set = [];
  let first = true;
  while (i < pattern.length && (pattern[i] !== ']' || first)) {
    first = false;
    const member = readClassMember(pattern, i);
    i += member.width;
    const startsRange =
      !member.shorthand &&
      member.set.length === 1 &&
      pattern[i] === '-' &&
      pattern[i + 1] !== ']' &&
      i + 1 < pattern.length;
    if (startsRange) {
      const hi = pattern.codePointAt(i + 1);
      set.push([member.set[0][0], hi]);
      i += hi > 0xffff ? 3 : 2;
    } else {
      set.push(...member.set);
    }
  }
  const merged = normalize(set);
  return { set: negated ? complement(merged) : merged, end: i + 1 };
}

// Reads a single-character atom (or skips assertions/groups). Returns null for
// anything whose character set is unknown or irrelevant.
function readAtom(pattern, start) {
  const char = pattern[start];
  if (char === '[') {
    const { set, end } = readClass(pattern, start);
    return { set, end };
  }
  if (char === '.') return { set: DOT, end: start + 1 };
  if (char === '\\') {
    const escaped = pattern[start + 1];
    if (escaped === undefined) return null;
    if ('bB'.includes(escaped) || /[1-9]/.test(escaped)) return null;
    if (escaped === 'u' || escaped === 'x') return null; // keep it simple; uncommon here
    return { set: escapedSet(escaped), end: start + 2 };
  }
  if ('^$()|*+?{'.includes(char)) return null;
  const code = pattern.codePointAt(start);
  return { set: [[code, code]], end: start + (code > 0xffff ? 2 : 1) };
}

// Returns the quantifier at `start`, or null. `unbounded` means it can repeat
// without an upper limit, which is what turns the overlap into super-linear time.
function readQuantifier(pattern, start) {
  const char = pattern[start];
  if (char === '*' || char === '+') return { unbounded: true, end: start + 1 };
  if (char === '?') return { unbounded: false, end: start + 1 };
  if (char !== '{') return null;
  const match = /^\{(\d+)(,(\d+)?)?\}/.exec(pattern.slice(start));
  if (!match) return null;
  return {
    unbounded: match[2] !== undefined && match[3] === undefined,
    end: start + match[0].length,
  };
}

function hasSuperLinearBacktracking(pattern) {
  let prev = null;
  let i = 0;
  while (i < pattern.length) {
    const atom = readAtom(pattern, i);
    if (!atom) {
      prev = null;
      i += 1;
      continue;
    }
    const quantifier = readQuantifier(pattern, atom.end);
    if (prev && prev.unbounded && intersects(prev.set, atom.set)) return true;
    prev = quantifier?.unbounded ? { unbounded: true, set: atom.set } : null;
    i = quantifier ? quantifier.end : atom.end;
  }
  return false;
}

const noSuperLinearBacktracking = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow regexes that can backtrack super-linearly.',
    },
    schema: [],
    messages: {
      superLinear:
        'Super-linear backtracking: this regex has overlapping quantified atoms, which can be slow on some inputs.',
    },
  },
  create(context) {
    function check(node) {
      if (!node.regex?.pattern) return;
      if (hasSuperLinearBacktracking(node.regex.pattern)) {
        context.report({ node, messageId: 'superLinear' });
      }
    }
    return { Literal: check, RegExpLiteral: check };
  },
};

export default {
  meta: { name: 'regex-safety' },
  rules: { 'no-super-linear-backtracking': noSuperLinearBacktracking },
};
