import env from "../config/env";

type DebugMetadata = Record<string, unknown>;

function shouldLogDebug(): boolean {
  return env.nodeEnv !== "production";
}

export function logDebug(
  scope: string,
  message: string,
  metadata?: DebugMetadata
): void {
  if (!shouldLogDebug()) {
    return;
  }

  const timestamp = new Date().toISOString();

  if (metadata) {
    console.debug(`[${timestamp}] [debug] [${scope}] ${message}`, metadata);
    return;
  }

  console.debug(`[${timestamp}] [debug] [${scope}] ${message}`);
}
