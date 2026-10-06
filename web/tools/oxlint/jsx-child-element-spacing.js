// Local oxlint JS plugin.
// Mirrors eslint-plugin-react's jsx-child-element-spacing, which oxlint 1.87
// does not implement. Only lowercase inline HTML elements are checked, matching
// the upstream rule. See https://github.com/jsx-eslint/eslint-plugin-react
const INLINE_ELEMENTS = new Set([
  'a',
  'abbr',
  'acronym',
  'b',
  'bdo',
  'big',
  'button',
  'cite',
  'code',
  'dfn',
  'em',
  'i',
  'img',
  'input',
  'kbd',
  'label',
  'map',
  'object',
  'q',
  'samp',
  'script',
  'select',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'textarea',
  'tt',
  'var',
]);

// Linear time: `[^\S\n]*` is whitespace that cannot cross the newline, so the
// quantifiers never compete with `\n` (unlike the upstream /^\s*\n\s*\S/).
const TEXT_FOLLOWING_ELEMENT_PATTERN = /^[^\S\n]*\n\s*\S/;
const TEXT_PRECEDING_ELEMENT_PATTERN = /\S[^\S\n]*\n\s*$/;

function elementName(node) {
  const name = node.openingElement?.name;
  return name?.type === 'JSXIdentifier' ? name.name : undefined;
}

function isInlineElement(node) {
  return node.type === 'JSXElement' && INLINE_ELEMENTS.has(elementName(node));
}

const childElementSpacing = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Disallow ambiguous whitespace between inline elements and text.',
    },
    schema: [],
    messages: {
      spacingAfterPrev: 'Ambiguous spacing after previous element {{element}}',
      spacingBeforeNext: 'Ambiguous spacing before next element {{element}}',
    },
  },
  create(context) {
    function handleJSX(node) {
      let lastChild = null;
      let child = null;
      for (const nextChild of [...node.children, null]) {
        const isText = Boolean(child) && (child.type === 'Literal' || child.type === 'JSXText');
        const bracketsInlineElements =
          (Boolean(lastChild) || Boolean(nextChild)) &&
          (!lastChild || isInlineElement(lastChild)) &&
          isText &&
          (!nextChild || isInlineElement(nextChild));

        if (bracketsInlineElements) {
          if (lastChild && TEXT_FOLLOWING_ELEMENT_PATTERN.test(child.value)) {
            context.report({
              node: lastChild,
              messageId: 'spacingAfterPrev',
              data: { element: elementName(lastChild) },
            });
          } else if (nextChild && TEXT_PRECEDING_ELEMENT_PATTERN.test(child.value)) {
            context.report({
              node: nextChild,
              messageId: 'spacingBeforeNext',
              data: { element: elementName(nextChild) },
            });
          }
        }

        lastChild = child;
        child = nextChild;
      }
    }

    return { JSXElement: handleJSX, JSXFragment: handleJSX };
  },
};

export default {
  meta: { name: 'jsx' },
  rules: { 'child-element-spacing': childElementSpacing },
};
