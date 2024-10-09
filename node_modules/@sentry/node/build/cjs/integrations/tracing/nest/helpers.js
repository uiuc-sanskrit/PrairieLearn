Object.defineProperty(exports, '__esModule', { value: true });

const core = require('@sentry/core');
const utils = require('@sentry/utils');

const sentryPatched = 'sentryPatched';

/**
 * Helper checking if a concrete target class is already patched.
 *
 * We already guard duplicate patching with isWrapped. However, isWrapped checks whether a file has been patched, whereas we use this check for concrete target classes.
 * This check might not be necessary, but better to play it safe.
 */
function isPatched(target) {
  if (target.sentryPatched) {
    return true;
  }

  utils.addNonEnumerableProperty(target, sentryPatched, true);
  return false;
}

/**
 * Returns span options for nest middleware spans.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function getMiddlewareSpanOptions(target) {
  return {
    name: target.name,
    attributes: {
      [core.SEMANTIC_ATTRIBUTE_SENTRY_OP]: 'middleware.nestjs',
      [core.SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: 'auto.middleware.nestjs',
    },
  };
}

exports.getMiddlewareSpanOptions = getMiddlewareSpanOptions;
exports.isPatched = isPatched;
//# sourceMappingURL=helpers.js.map
