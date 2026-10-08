import { describe, expect, it } from 'vitest';

import { escapeLike } from '@api/db/queries/articles';

describe('escapeLike', () => {
  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeLike('100%')).toBe('100\\%');
    expect(escapeLike('a_b')).toBe('a\\_b');
    expect(escapeLike('c:\\x')).toBe('c:\\\\x');
  });

  it('leaves ordinary text unchanged', () => {
    expect(escapeLike('plain text')).toBe('plain text');
  });
});
