/**
 * Test-only stand-in for `@/lib/supabase` (see utils/apiTest.register.mjs).
 * It records the builder calls and answers with queued results, so API modules can be tested
 * in plain Node without react-native or a network.
 */
export interface FakeResult {
  data: unknown;
  error: { message: string; code?: string } | null;
}

export interface RecordedCall {
  /** `from:<table>` or `rpc:<name>` */
  target: string;
  /** Builder steps in call order, e.g. ['update', [{...}]], ['eq', ['id', 'x']]. */
  steps: [string, unknown[]][];
}

export const recordedCalls: RecordedCall[] = [];
const queuedResults: FakeResult[] = [];

export function resetFakeSupabase(): void {
  recordedCalls.length = 0;
  queuedResults.length = 0;
}

/** Queues the answer for the next awaited query (first in, first out). */
export function queueResult(data: unknown, error: FakeResult['error'] = null): void {
  queuedResults.push({ data, error });
}

function createBuilder(call: RecordedCall): unknown {
  const proxy: unknown = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === 'then') {
          return (resolve: (value: FakeResult) => void) =>
            resolve(queuedResults.shift() ?? { data: null, error: { message: 'no queued result' } });
        }

        return (...args: unknown[]) => {
          call.steps.push([String(property), args]);
          return proxy;
        };
      },
    },
  );
  return proxy;
}

export const supabase = {
  from(table: string) {
    const call: RecordedCall = { target: `from:${table}`, steps: [] };
    recordedCalls.push(call);
    return createBuilder(call);
  },
  rpc(name: string, args: unknown) {
    const call: RecordedCall = { target: `rpc:${name}`, steps: [['args', [args]]] };
    recordedCalls.push(call);
    return createBuilder(call);
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: { user: { id: 'user-1' } } }, error: null }),
  },
};
