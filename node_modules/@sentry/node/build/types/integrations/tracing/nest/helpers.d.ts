import type { CatchTarget, InjectableTarget } from './types';
/**
 * Helper checking if a concrete target class is already patched.
 *
 * We already guard duplicate patching with isWrapped. However, isWrapped checks whether a file has been patched, whereas we use this check for concrete target classes.
 * This check might not be necessary, but better to play it safe.
 */
export declare function isPatched(target: InjectableTarget | CatchTarget): boolean;
/**
 * Returns span options for nest middleware spans.
 */
export declare function getMiddlewareSpanOptions(target: InjectableTarget | CatchTarget): {
    name: string;
    attributes: {
        "sentry.op": string;
        "sentry.origin": string;
    };
};
//# sourceMappingURL=helpers.d.ts.map