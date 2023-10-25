


/**from https://github.com/shahyar/setZeroTimeout-js
 * If the browser is capable, tries zero timeout via postMessage (setTimeout can't go faster than 10ms).
 * Otherwise, it falls back to setTimeout(fn, delay) (which is the same as setTimeout(fn, 10) if under 10).
 * @function
 * @param {Function} fn
 * @param {int} delay
 * @example setZeroTimeout(function () { $.ajax('about:blank'); }, 0);
 */
export function setZeroTimeout(fn: Function, delay: number)