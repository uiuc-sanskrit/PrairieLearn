import 'regenerator-runtime/runtime.js';
import expressMiddleware from './express/middleware.js';
import { PyroscopeProfiler } from './profilers/pyroscope-profiler.js';
import { checkPyroscopeConfig } from './utils/check-pyroscope-config.js';
import { getProfiler, setProfiler } from './utils/pyroscope-profiler.js';
import { processConfig } from './utils/process-config.js';
import { getEnv } from './utils/get-env.js';
import { setLogger as datadogSetLogger } from '@datadog/pprof';
import { setLogger as ourSetLogger } from './logger.js';
import { SourceMapper } from './sourcemapper.js';
export function init(config = {}) {
    checkPyroscopeConfig(config);
    const processedConfig = processConfig(config, getEnv());
    setProfiler(new PyroscopeProfiler(processedConfig));
}
// deprecated: please use getLabels
function getWallLabels() {
    return getLabels();
}
// deprecated: please use setLabels
function setWallLabels(labels) {
    return setLabels(labels);
}
function getLabels() {
    return getProfiler().wallProfiler.profiler.getLabels();
}
function setLabels(labels) {
    getProfiler().wallProfiler.profiler.setLabels(labels);
}
export function wrapWithLabels(lbls, fn, ...args) {
    getProfiler().wallProfiler.profiler.wrapWithLabels(lbls, fn, ...args);
}
function startWallProfiling() {
    getProfiler().wallProfiler.start();
}
// here for backwards compatibility
function startCpuProfiling() {
    getProfiler().wallProfiler.start();
}
async function stopWallProfiling() {
    await getProfiler().wallProfiler.stop();
}
// here for backwards compatibility
async function stopCpuProfiling() {
    await getProfiler().wallProfiler.stop();
}
function startHeapProfiling() {
    getProfiler().heapProfiler.start();
}
async function stopHeapProfiling() {
    await getProfiler().heapProfiler.stop();
}
export function start() {
    startWallProfiling();
    startHeapProfiling();
}
export async function stop() {
    await Promise.all([stopWallProfiling(), stopHeapProfiling()]);
}
function setLogger(logger) {
    datadogSetLogger(logger);
    ourSetLogger(logger);
}
export default {
    SourceMapper,
    expressMiddleware,
    init,
    getWallLabels,
    setWallLabels,
    getLabels,
    setLabels,
    wrapWithLabels,
    start,
    startHeapProfiling,
    startWallProfiling,
    startCpuProfiling,
    stop,
    stopHeapProfiling,
    stopWallProfiling,
    stopCpuProfiling,
    setLogger,
};
