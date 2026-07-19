import { asExtractionError } from "../_shared/email-extraction/errors.ts";
import {
  type EnvironmentReader,
  type ExtractionProviderEnvironment,
  resolveProviderEnvironment,
} from "../_shared/email-extraction/environment.ts";
import { createFinancialEmailExtractor } from "../_shared/email-extraction/factory.ts";
import type { FinancialEmailExtractor } from "../_shared/email-extraction/types.ts";
import { normalizeExtraction } from "../_shared/email-extraction/validation.ts";
import {
  type FinancialEmailEvaluationFixture,
  financialEmailEvaluationFixtures,
} from "./fixtures.ts";
import {
  type EvaluationObservation,
  scoreExtraction,
  scoreFailure,
  summarizeObservations,
} from "./scoring.ts";

type EvaluationProvider = "openai" | "ollama";
type EvaluationRunSet = "initial" | "repeat";

interface EvaluationConfiguration {
  fixtures: FinancialEmailEvaluationFixture[];
  minIntervalMs: number;
  model: string;
  provider: EvaluationProvider;
  providerEnvironment: ExtractionProviderEnvironment;
  runCount: number;
  startRun: number;
}

interface RunEvaluationOptions {
  clock?: () => number;
  extractor: FinancialEmailExtractor;
  fixtures: FinancialEmailEvaluationFixture[];
  minIntervalMs: number;
  onObservation?: (observation: EvaluationObservation) => void;
  runCount: number;
  sleep?: (milliseconds: number) => Promise<void>;
  startRun: number;
}

// Keep at most two request starts in any rolling minute. This remains below the
// visible 3 RPM limit and leaves headroom under 10,000 TPM for the production
// adapter's shared prompt, schema, and 2,000-token output allowance.
const OPENAI_MIN_INTERVAL_MS = 31_000;
const allowedOllamaModels = new Set([
  "qwen3.5:9b",
  "qwen3.5:4b",
  "qwen2.5:14b-instruct",
]);

export async function runEvaluation({
  clock = () => performance.now(),
  extractor,
  fixtures,
  minIntervalMs,
  onObservation,
  runCount,
  sleep = wait,
  startRun,
}: RunEvaluationOptions): Promise<EvaluationObservation[]> {
  const observations: EvaluationObservation[] = [];
  let previousRequestStartedAt: number | null = null;

  for (let offset = 0; offset < runCount; offset += 1) {
    const run = startRun + offset;
    for (const fixture of fixtures) {
      if (previousRequestStartedAt !== null && minIntervalMs > 0) {
        const remaining = Math.max(
          0,
          minIntervalMs - (clock() - previousRequestStartedAt),
        );
        if (remaining > 0) await sleep(remaining);
      }

      const startedAt = clock();
      previousRequestStartedAt = startedAt;
      let observation: EvaluationObservation;
      try {
        const generated = await extractor.extract(
          fixture.emailText,
          fixture.context,
        );
        const extraction = normalizeExtraction(generated, fixture.emailText);
        observation = scoreExtraction(
          fixture,
          extraction,
          run,
          clock() - startedAt,
        );
      } catch (error) {
        observation = scoreFailure(
          fixture.id,
          run,
          clock() - startedAt,
          asExtractionError(error).code,
        );
      }
      observations.push(observation);
      onObservation?.(observation);
    }
  }

  return observations;
}

export function resolveEvaluationConfiguration(
  args: string[],
  environment: EnvironmentReader,
): EvaluationConfiguration {
  const options = parseOptions(args);
  const provider = requireProvider(environment.get("EVALUATION_PROVIDER"));
  const runSet = requireRunSet(options.get("run-set"));
  const timeoutMs = parseTimeout(environment.get("AI_EXTRACTION_TIMEOUT_MS"));
  assertExplicitProviderConfiguration(provider, environment);
  const providerEnvironment = resolveProviderEnvironment(
    evaluationEnvironment(provider, environment),
    timeoutMs,
  );
  assertExpectedModel(providerEnvironment);

  if (runSet === "initial") {
    if (options.has("fixtures") || options.has("runs")) {
      throw new Error("invalid evaluation configuration");
    }
    return {
      fixtures: financialEmailEvaluationFixtures,
      minIntervalMs: provider === "openai" ? OPENAI_MIN_INTERVAL_MS : 0,
      model: providerEnvironment.model,
      provider,
      providerEnvironment,
      runCount: 1,
      startRun: 1,
    };
  }

  const fixtureIds = requireFixtureIds(options.get("fixtures"));
  const runCount = parseRepeatCount(options.get("runs"));
  return {
    fixtures: fixtureIds.map((id) =>
      financialEmailEvaluationFixtures.find((fixture) => fixture.id === id)!
    ),
    minIntervalMs: provider === "openai" ? OPENAI_MIN_INTERVAL_MS : 0,
    model: providerEnvironment.model,
    provider,
    providerEnvironment,
    runCount,
    startRun: 2,
  };
}

function assertExplicitProviderConfiguration(
  provider: EvaluationProvider,
  environment: EnvironmentReader,
): void {
  const requiredNames = provider === "openai"
    ? ["OPENAI_API_KEY", "OPENAI_EXTRACTION_MODEL"]
    : ["OLLAMA_BASE_URL", "OLLAMA_EXTRACTION_MODEL"];
  if (requiredNames.some((name) => !environment.get(name)?.trim())) {
    throw new Error("invalid evaluation configuration");
  }
}

function evaluationEnvironment(
  provider: EvaluationProvider,
  environment: EnvironmentReader,
): EnvironmentReader {
  return {
    get(name: string): string | undefined {
      if (name === "AI_EXTRACTION_PROVIDER") return provider;
      return environment.get(name);
    },
  };
}

function assertExpectedModel(
  environment: ExtractionProviderEnvironment,
): void {
  if (environment.provider === "openai") {
    if (environment.model !== "gpt-5.6") {
      throw new Error("invalid evaluation configuration");
    }
    return;
  }
  if (!allowedOllamaModels.has(environment.model)) {
    throw new Error("invalid evaluation configuration");
  }
}

function parseOptions(args: string[]): Map<string, string> {
  const options = new Map<string, string>();
  for (const argument of args) {
    const match = argument.match(/^--([a-z-]+)=(.+)$/);
    if (!match || options.has(match[1])) {
      throw new Error("invalid evaluation configuration");
    }
    options.set(match[1], match[2]);
  }
  for (const key of options.keys()) {
    if (!["run-set", "fixtures", "runs"].includes(key)) {
      throw new Error("invalid evaluation configuration");
    }
  }
  return options;
}

function requireProvider(value: string | undefined): EvaluationProvider {
  if (value === "openai" || value === "ollama") return value;
  throw new Error("invalid evaluation configuration");
}

function requireRunSet(value: string | undefined): EvaluationRunSet {
  if (value === "initial" || value === "repeat") return value;
  throw new Error("invalid evaluation configuration");
}

function requireFixtureIds(value: string | undefined): string[] {
  if (!value) throw new Error("invalid evaluation configuration");
  const ids = value.split(",");
  if (!ids.length || new Set(ids).size !== ids.length) {
    throw new Error("invalid evaluation configuration");
  }
  const knownIds = new Set(
    financialEmailEvaluationFixtures.map((fixture) => fixture.id),
  );
  if (ids.some((id) => !knownIds.has(id))) {
    throw new Error("invalid evaluation configuration");
  }
  return ids;
}

function parseRepeatCount(value: string | undefined): number {
  const count = Number(value ?? "2");
  if (!Number.isInteger(count) || count < 1 || count > 2) {
    throw new Error("invalid evaluation configuration");
  }
  return count;
}

function parseTimeout(value: string | undefined): number {
  const timeoutMs = value?.trim() ? Number(value) : 60_000;
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1_000 ||
    timeoutMs > 120_000
  ) {
    throw new Error("invalid evaluation configuration");
  }
  return timeoutMs;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function main(): Promise<void> {
  try {
    const configuration = resolveEvaluationConfiguration(Deno.args, {
      get: (name) => Deno.env.get(name),
    });
    const extractor = createFinancialEmailExtractor(
      configuration.providerEnvironment,
    );
    const observations = await runEvaluation({
      extractor,
      fixtures: configuration.fixtures,
      minIntervalMs: configuration.minIntervalMs,
      onObservation: (observation) =>
        console.info(JSON.stringify({
          event: "financial_email_evaluation_observation",
          provider: configuration.provider,
          model: configuration.model,
          ...observation,
        })),
      runCount: configuration.runCount,
      startRun: configuration.startRun,
    });
    const summary = summarizeObservations(observations);
    console.info(JSON.stringify({
      event: "financial_email_evaluation_summary",
      provider: configuration.provider,
      model: configuration.model,
      ...summary,
    }));
    if (observations.some((observation) => !observation.passed)) {
      Deno.exitCode = 2;
    }
  } catch {
    console.error(JSON.stringify({
      event: "financial_email_evaluation_configuration_error",
      code: "configuration",
    }));
    Deno.exitCode = 1;
  }
}

if (import.meta.main) await main();
