export class UsageError extends Error {
  readonly status = 429;
}
export type UsageKind = "text" | "image";
type State = {
  windowStart: number;
  text: number;
  image: number;
  activeText: number;
  activeImage: number;
};
const globals = globalThis as typeof globalThis & { formaUsage?: State };
function limit(name: string, fallback: number) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0 || n > 10000)
    throw new Error(
      `Invalid server setting ${name}. Use an integer from 0 to 10000.`,
    );
  return n;
}
export function usageSnapshot(now = Date.now()) {
  const state = (globals.formaUsage ??= {
    windowStart: now,
    text: 0,
    image: 0,
    activeText: 0,
    activeImage: 0,
  });
  if (now - state.windowStart >= 3600000) {
    state.windowStart = now;
    state.text = 0;
    state.image = 0;
  }
  return {
    state,
    textLimit: limit("AI_TEXT_REQUESTS_PER_HOUR", 40),
    imageLimit: limit("AI_IMAGES_PER_HOUR", 12),
  };
}
/** Global to this Node process: reserve before a paid request, count attempts, always release concurrency. */
export function reserveUsage(kind: UsageKind, now = Date.now()): () => void {
  const { state, textLimit, imageLimit } = usageSnapshot(now);
  const maximum = kind === "image" ? imageLimit : textLimit;
  if (state[kind] >= maximum)
    throw new UsageError(
      `${kind === "image" ? "Image" : "Text"} generation limit reached. Try again after the hourly window resets.`,
    );
  const active = kind === "image" ? "activeImage" : "activeText";
  if (state[active] >= (kind === "image" ? 2 : 4))
    throw new UsageError(
      "Other AI requests are running. Please wait and retry.",
    );
  state[kind]++;
  state[active]++;
  let released = false;
  return () => {
    if (!released) {
      state[active]--;
      released = true;
    }
  };
}
