// Local oxlint JS plugin.
// Keeps namespaced JSX components (e.g. <Foo.Bar />) out of app code: it forces
// each UI piece to be a concrete export instead of a member of a namespace
// object. Scoped to the design system via the components/ui override.
function renderName(node) {
  if (node.type === 'JSXIdentifier') return node.name;
  if (node.type === 'JSXMemberExpression') {
    return `${renderName(node.object)}.${node.property.name}`;
  }
  if (node.type === 'JSXNamespacedName') {
    return `${node.namespace.name}:${node.name.name}`;
  }
  return '';
}

const noMemberExpression = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow JSX member expressions; use a named component instead.',
    },
    schema: [],
    messages: {
      memberExpression: 'Use a named component instead of the member expression <{{name}}>.',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name?.type !== 'JSXMemberExpression') return;
        context.report({
          node: node.name,
          messageId: 'memberExpression',
          data: { name: renderName(node.name) },
        });
      },
    };
  },
};

export default {
  meta: { name: 'design-system' },
  rules: { 'no-member-expression': noMemberExpression },
};
