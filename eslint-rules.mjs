/* eslint-disable custom/no-hardcoded-admin-id */
function isAllowedPath(filename, patterns) {
  // eslint-disable-next-line security/detect-non-literal-regexp
  return patterns.some((p) => new RegExp(p).test(filename));
}

const hardcodedUrlRule = {
  meta: { type: 'problem', docs: { description: 'disallow hardcoded URLs' } },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'string' && /https?:\/\//.test(node.value)) {
          const filename = context.getFilename();
          if (!isAllowedPath(filename, [
            'url-builder',
            'config',
            'test',
            'mock',
            'api-enablement-error',
          ])) {
            context.report({ node, message: 'Do not hardcode URLs. Use url-builder or configuration.' });
          }
        }
      },
    };
  },
};

const rawFetchRule = {
  meta: { type: 'problem', docs: { description: 'enforce API helpers over fetch' } },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'fetch') {
          const filename = context.getFilename();
          if (!isAllowedPath(filename, ['lib\/api', 'test', 'mock', 'token-refresh', 'utils', 'actions', 'api-enablement-error'])) {
            context.report({ node, message: 'Use API helpers instead of raw fetch.' });
          }
        }
      },
    };
  },
};

const consoleRule = {
  meta: { type: 'problem', docs: { description: 'discourage console usage' } },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'console'
        ) {
          const filename = context.getFilename();
          if (!isAllowedPath(filename, ['test'])) {
            context.report({ node, message: 'Use Logger utilities instead of console.' });
          }
        }
      },
    };
  },
};

const adminIdRule = {
  meta: { type: 'problem', docs: { description: 'prevent hardcoded admin role ID' } },
  create(context) {
    return {
      Literal(node) {
        if (node.value === '62e90394-69f5-4237-9190-012177145e10') {
          context.report({ node, message: 'Move Microsoft Global Admin ID to configuration.' });
        }
      },
    };
  },
};

const customRules = {
  rules: {
    'no-hardcoded-url': hardcodedUrlRule,
    'no-raw-fetch': rawFetchRule,
    'no-console-log': consoleRule,
    'no-hardcoded-admin-id': adminIdRule,
  },
};

export default customRules;
