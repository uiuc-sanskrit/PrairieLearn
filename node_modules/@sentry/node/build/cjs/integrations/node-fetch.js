var {
  _optionalChain
} = require('@sentry/utils');

Object.defineProperty(exports, '__esModule', { value: true });

const api = require('@opentelemetry/api');
const core = require('@sentry/core');
const opentelemetry = require('@sentry/opentelemetry');
const utils = require('@sentry/utils');
const debugBuild = require('../debug-build.js');
const nodeVersion = require('../nodeVersion.js');
const addOriginToSpan = require('../utils/addOriginToSpan.js');

const _nativeNodeFetchIntegration = ((options = {}) => {
  const _breadcrumbs = typeof options.breadcrumbs === 'undefined' ? true : options.breadcrumbs;
  const _ignoreOutgoingRequests = options.ignoreOutgoingRequests;

  async function getInstrumentation() {
    // Only add NodeFetch if Node >= 18, as previous versions do not support it
    if (nodeVersion.NODE_MAJOR < 18) {
      debugBuild.DEBUG_BUILD && utils.logger.log('NodeFetch is not supported on Node < 18, skipping instrumentation...');
      return;
    }

    try {
      const pkg = await import('opentelemetry-instrumentation-fetch-node');
      const { FetchInstrumentation } = pkg;

      class SentryNodeFetchInstrumentation extends FetchInstrumentation {
        // We extend this method so we have access to request _and_ response for the breadcrumb
         onHeaders({ request, response }) {
          if (_breadcrumbs) {
            _addRequestBreadcrumb(request, response);
          }

          return super.onHeaders({ request, response });
        }
      }

      return new SentryNodeFetchInstrumentation({
        ignoreRequestHook: (request) => {
          const url = getAbsoluteUrl(request.origin, request.path);
          const tracingDisabled = !core.hasTracingEnabled();
          const shouldIgnore = _ignoreOutgoingRequests && url && _ignoreOutgoingRequests(url);

          if (shouldIgnore) {
            return true;
          }

          // If tracing is disabled, we still want to propagate traces
          // So we do that manually here, matching what the instrumentation does otherwise
          if (tracingDisabled) {
            const ctx = api.context.active();
            const addedHeaders = {};

            // We generate a virtual span context from the active one,
            // Where we attach the URL to the trace state, so the propagator can pick it up
            const activeSpan = api.trace.getSpan(ctx);
            const propagationContext = activeSpan
              ? opentelemetry.getPropagationContextFromSpan(activeSpan)
              : core.getCurrentScope().getPropagationContext();

            const spanContext = opentelemetry.generateSpanContextForPropagationContext(propagationContext);
            // We know that in practice we'll _always_ haven a traceState here
            spanContext.traceState = _optionalChain([spanContext, 'access', _ => _.traceState, 'optionalAccess', _2 => _2.set, 'call', _3 => _3('sentry.url', url)]);
            const ctxWithUrlTraceState = api.trace.setSpanContext(ctx, spanContext);

            api.propagation.inject(ctxWithUrlTraceState, addedHeaders);

            const requestHeaders = request.headers;
            if (Array.isArray(requestHeaders)) {
              Object.entries(addedHeaders).forEach(headers => requestHeaders.push(...headers));
            } else {
              request.headers += Object.entries(addedHeaders)
                .map(([k, v]) => `${k}: ${v}\r\n`)
                .join('');
            }

            // Prevent starting a span for this request
            return true;
          }

          return false;
        },
        onRequest: ({ span }) => {
          _updateSpan(span);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } );
    } catch (error) {
      // Could not load instrumentation
      debugBuild.DEBUG_BUILD && utils.logger.log('Error while loading NodeFetch instrumentation: \n', error);
    }
  }

  return {
    name: 'NodeFetch',
    setupOnce() {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      getInstrumentation().then(instrumentation => {
        if (instrumentation) {
          opentelemetry.addOpenTelemetryInstrumentation(instrumentation);
        }
      });
    },
  };
}) ;

const nativeNodeFetchIntegration = core.defineIntegration(_nativeNodeFetchIntegration);

/** Update the span with data we need. */
function _updateSpan(span) {
  addOriginToSpan.addOriginToSpan(span, 'auto.http.otel.node_fetch');
}

/** Add a breadcrumb for outgoing requests. */
function _addRequestBreadcrumb(request, response) {
  const data = getBreadcrumbData(request);

  core.addBreadcrumb(
    {
      category: 'http',
      data: {
        status_code: response.statusCode,
        ...data,
      },
      type: 'http',
    },
    {
      event: 'response',
      request,
      response,
    },
  );
}

function getBreadcrumbData(request) {
  try {
    const url = new URL(request.path, request.origin);
    const parsedUrl = utils.parseUrl(url.toString());

    const data = {
      url: utils.getSanitizedUrlString(parsedUrl),
      'http.method': request.method || 'GET',
    };

    if (parsedUrl.search) {
      data['http.query'] = parsedUrl.search;
    }
    if (parsedUrl.hash) {
      data['http.fragment'] = parsedUrl.hash;
    }

    return data;
  } catch (e) {
    return {};
  }
}

// Matching the behavior of the base instrumentation
function getAbsoluteUrl(origin, path = '/') {
  const url = `${origin}`;

  if (origin.endsWith('/') && path.startsWith('/')) {
    return `${url}${path.slice(1)}`;
  }

  if (!origin.endsWith('/') && !path.startsWith('/')) {
    return `${url}/${path.slice(1)}`;
  }

  return `${url}${path}`;
}

exports.nativeNodeFetchIntegration = nativeNodeFetchIntegration;
//# sourceMappingURL=node-fetch.js.map
