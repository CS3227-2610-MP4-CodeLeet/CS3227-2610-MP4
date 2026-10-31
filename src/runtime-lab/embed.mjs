import { run } from './lab.mjs';
import { isAllowedParentOrigin } from './deployment-policy.mjs';
const parameters = new URLSearchParams(location.search);
const parentOrigin = parameters.get('parentOrigin');
const nonce = parameters.get('nonce');
let allowed = false;
try {
  allowed =
    isAllowedParentOrigin(parentOrigin) && /^[a-f0-9-]{36}$/.test(nonce);
} catch {
  /* Invalid bridge context: do not initialize. */
}
let active;
if (allowed && parent !== window) {
  const reply = (data) => parent.postMessage({ ...data, nonce }, parentOrigin);
  addEventListener('message', async (event) => {
    const data = event.data;
    if (!validMessage(event, data, parentOrigin, nonce)) return;
    if (data.type === 'stop' && data.id === active) {
      window.runtimeLab.stop();
      return;
    }
    if (data.type !== 'run' || active) return;
    const input = data.input;
    if (!validRunInput(input)) return;
    active = data.id;
    try {
      reply({ type: 'result', id: active, result: await run(input) });
    } catch {
      reply({
        type: 'result',
        id: active,
        result: {
          status: 'unavailable',
          stdout: '',
          stderr: 'Browser runtime unavailable. Reload the page and try again.',
          executionMs: null,
        },
      });
    } finally {
      active = undefined;
    }
  });
  reply({ type: 'ready' });
}

function validMessage(event, data, parentOrigin, nonce) {
  return (
    event.source === parent &&
    event.origin === parentOrigin &&
    data?.nonce === nonce &&
    typeof data.id === 'string' &&
    data.id.length <= 80
  );
}

function validRunInput(input) {
  return (
    Boolean(input) &&
    ['python', 'java'].includes(input.language) &&
    typeof input.source === 'string' &&
    typeof input.stdin === 'string' &&
    input.timeoutMs === 5000
  );
}
