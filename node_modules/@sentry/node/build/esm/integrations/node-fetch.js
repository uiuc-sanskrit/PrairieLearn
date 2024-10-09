import { _optionalChain } from '@sentry/utils';
import { context, trace, propagation } from '@opentelemetry/api';
import { defineIntegration, hasTracingEnabled, getCurrentScope, addBreadcrumb } from '@sentry/core';
import { addOpenTelemetryInstrumentation, getPropagationContextFromSpan, generateSpanContextForPropagationContext } from '@sentry/opentelemetry';
import { logger, parseUrl, getSanitizedUrlString } from '@sentry/utils';
import { DEBUG_BUILD } from '../debug-build.js';
import { NODE_MAJOR } from '../nodeVersion.js';
import { addOriginToSpan } from '../utils/addOriginToSpan.js';

const _nativeNodeFetchIntegration = ((options = {}) => {
  const _breadcrumbs = typeof options.breadcrumbs === 'undefined' ? true : options.breadcrumbs;
  const _ignoreOutgoingRequests = options.ignoreOutgoingRequests;

  async function getInstrumentation() {
    // Only add NodeFetch if Node >= 18, as previous versions do not support it
    if (NODE_MAJOR < 18) {
      DEBUG_BUILD && logger.log('NodeFetch is not supported on Node < 18, skipping instrumentation...');
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
          const tracingDisabled = !hasTracingEnabled();
          const shouldIgnore = _ignoreOutgoingRequests && url && _ignoreOutgoingRequests(url);

          if (shouldIgnore) {
            return true;
          }

          // If tracing is disabled, we still want to propagate traces
          // So we do that manually here, matching what the instrumentation does otherwise
          if (tracingDisabled) {
            const ctx = context.active();
            const addedHeaders = {};

            // We generate a virtual span context from the active one,
            // Where we attach the URL to the trace state, so the propagator can pick it up
            const activeSpan = trace.getSpan(ctx);
            const propagationContext = activeSpan
              ? getPropagationContextFromSpan(activeSpan)
              : getCurrentScope().getPropagationContext();

            const spanContext = generateSpanContextForPropagationContext(propagationContext);
            // We know that in practice we'll _always_ haven a traceState here
            spanContext.traceState = _optionalChain([spanContext, 'access', _ => _.traceState, 'optionalAccess', _2 => _2.set, 'call', _3 => _3('sentry.url', url)]);
            const ctxWithUrlTraceState = trace.setSpanContext(ctx, spanContext);

            propagation.inject(ctxWithUrlTraceState, addedHeaders);

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
      DEBUG_BUILD && logger.log('Error while loading NodeFetch instrumentation: \n', error);
    }
  }

  return {
    name: 'NodeFetch',
    setupOnce() {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      getInstrumentation().then(instrumentation => {
        if (instrumentation) {
          addOpenTelemetryInstrumentation(instrumentation);
        }
      });
    },
  };
}) ;

const nativeNodeFetchIntegration = defineIntegration(_nativeNodeFetchIntegration);

/** Update the span with data we need. */
function _updateSpan(span) {
  addOriginToSpan(span, 'auto.http.otel.node_fetch');
}

/** Add a breadcrumb for outgoing requests. */
function _addRequestBreadcrumb(request, response) {
  const data = getBreadcrumbData(request);

  addBreadcrumb(
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
    const parsedUrl = parseUrl(url.toString());

    const data = {
      url: getSanitizedUrlString(parsedUrl),
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

export { nativeNodeFetchIntegration };
//# sourceMappingURL=node-fetch.js.map
