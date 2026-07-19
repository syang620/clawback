import { errors } from "./errors.ts";

export interface EnvironmentReader {
  get(name: string): string | undefined;
}

export interface SharedExtractionEnvironment {
  allowedOrigins: string[];
  timeoutMs: number;
}

export type ExtractionProviderEnvironment =
  | {
    provider: "openai";
    apiKey: string;
    model: string;
    timeoutMs: number;
  }
  | {
    provider: "ollama";
    baseUrl: string;
    model: string;
    timeoutMs: number;
  };

export function resolveSharedEnvironment(
  environment: EnvironmentReader,
): SharedExtractionEnvironment {
  const allowedOrigins = readRequired(
    environment,
    "AI_EXTRACTION_ALLOWED_ORIGINS",
  )
    .split(",")
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter((origin, index, values) => values.indexOf(origin) === index);
  if (!allowedOrigins.length) throw errors.configuration();

  const timeoutValue = environment.get("AI_EXTRACTION_TIMEOUT_MS")?.trim();
  const timeoutMs = timeoutValue ? Number(timeoutValue) : 60_000;
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1_000 ||
    timeoutMs > 120_000
  ) {
    throw errors.configuration();
  }

  return { allowedOrigins, timeoutMs };
}

export function resolveProviderEnvironment(
  environment: EnvironmentReader,
  timeoutMs: number,
): ExtractionProviderEnvironment {
  const provider = readRequired(environment, "AI_EXTRACTION_PROVIDER");
  if (provider === "openai") {
    return {
      provider,
      apiKey: readRequired(environment, "OPENAI_API_KEY"),
      model: environment.get("OPENAI_EXTRACTION_MODEL")?.trim() || "gpt-5.6",
      timeoutMs,
    };
  }

  if (provider === "ollama") {
    return {
      provider,
      baseUrl: normalizeOllamaBaseUrl(
        readRequired(environment, "OLLAMA_BASE_URL"),
      ),
      model: environment.get("OLLAMA_EXTRACTION_MODEL")?.trim() || "qwen3.5:9b",
      timeoutMs,
    };
  }

  throw errors.configuration();
}

function readRequired(environment: EnvironmentReader, name: string): string {
  const value = environment.get(name)?.trim();
  if (!value) throw errors.configuration();
  return value;
}

function normalizeOrigin(value: string): string {
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw errors.configuration();
    }
    return url.origin;
  } catch {
    throw errors.configuration();
  }
}

function normalizeOllamaBaseUrl(value: string): string {
  try {
    const url = new URL(value);
    const localHosts = new Set([
      "localhost",
      "127.0.0.1",
      "[::1]",
      "host.docker.internal",
    ]);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      (url.protocol === "http:" && !localHosts.has(url.hostname)) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw errors.configuration();
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    throw errors.configuration();
  }
}
