import type { EnvironmentReader } from "../_shared/email-extraction/environment.ts";
import type {
  FinancialEmailExtraction,
  FinancialEmailExtractor,
  GeneratedFinancialEmailExtraction,
} from "../_shared/email-extraction/types.ts";
import {
  financialEmailEvaluationFixtures,
  requiredRepeatFixtureIds,
} from "../evaluation/fixtures.ts";
import {
  resolveEvaluationConfiguration,
  runEvaluation,
} from "../evaluation/run.ts";
import {
  scoreExtraction,
  summarizeObservations,
} from "../evaluation/scoring.ts";

Deno.test("evaluation fixtures cover the required synthetic scenarios", () => {
  assertEquals(financialEmailEvaluationFixtures.length, 14);
  assertEquals(
    new Set(financialEmailEvaluationFixtures.map(({ id }) => id)).size,
    14,
  );
  assertEquals([...requiredRepeatFixtureIds], [
    "prompt-injection",
    "ambiguous-deadline",
  ]);
  for (const fixture of financialEmailEvaluationFixtures) {
    assert(fixture.emailText.length > 0);
    assert(!fixture.emailText.includes("PRIVATE_EMAIL_MARKER_74291"));
  }
});

Deno.test("evaluation configuration is explicit and rate-safe for GPT-5.6", () => {
  const configuration = resolveEvaluationConfiguration(
    ["--run-set=initial"],
    reader({
      EVALUATION_PROVIDER: "openai",
      OPENAI_API_KEY: "test-key",
      OPENAI_EXTRACTION_MODEL: "gpt-5.6",
    }),
  );
  assertEquals(configuration.provider, "openai");
  assertEquals(configuration.model, "gpt-5.6");
  assertEquals(configuration.fixtures.length, 14);
  assertEquals(configuration.minIntervalMs, 31_000);
  assertEquals(configuration.runCount, 1);
});

Deno.test("evaluation configuration requires provider-specific values and known models", () => {
  assertThrows(() =>
    resolveEvaluationConfiguration(
      ["--run-set=initial"],
      reader({ EVALUATION_PROVIDER: "openai", OPENAI_API_KEY: "test-key" }),
    )
  );
  assertThrows(() =>
    resolveEvaluationConfiguration(
      ["--run-set=initial"],
      reader({
        EVALUATION_PROVIDER: "openai",
        OPENAI_API_KEY: "test-key",
        OPENAI_EXTRACTION_MODEL: "not-gpt-5.6",
      }),
    )
  );
  assertThrows(() =>
    resolveEvaluationConfiguration(
      ["--run-set=initial"],
      reader({
        EVALUATION_PROVIDER: "ollama",
        OLLAMA_BASE_URL: "http://localhost:11434",
        OLLAMA_EXTRACTION_MODEL: "unknown-model",
      }),
    )
  );
});

Deno.test("repeat runs require an explicit bounded fixture selection", () => {
  const environment = reader({
    EVALUATION_PROVIDER: "ollama",
    OLLAMA_BASE_URL: "http://localhost:11434",
    OLLAMA_EXTRACTION_MODEL: "qwen3.5:9b",
  });
  const configuration = resolveEvaluationConfiguration(
    [
      "--run-set=repeat",
      "--fixtures=prompt-injection,ambiguous-deadline",
      "--runs=2",
    ],
    environment,
  );
  assertEquals(configuration.fixtures.map(({ id }) => id), [
    "prompt-injection",
    "ambiguous-deadline",
  ]);
  assertEquals(configuration.runCount, 2);
  assertEquals(configuration.startRun, 2);
  assertThrows(() =>
    resolveEvaluationConfiguration(["--run-set=repeat"], environment)
  );
});

Deno.test("scoring preserves explicit zero and separates value from charge", () => {
  const fixture = fixtureById("explicit-zero-charge");
  const extraction: FinancialEmailExtraction = {
    isActionable: true,
    candidate: {
      merchantName: "Lantern Community",
      title: "Review Lantern Community renewal",
      kind: "subscription",
      valueCents: null,
      chargeAmountCents: 0,
      deadlineDate: "2026-08-20",
      recurrence: "none",
      actionUrl: null,
    },
    confidence: 0.7,
    warnings: [],
  };
  const observation = scoreExtraction(fixture, extraction, 1, 12.6);
  assert(observation.passed);
  assertEquals(observation.coreCandidateExactMatch, true);
  assertEquals(observation.coreCandidateFieldChecks, {
    candidatePresent: true,
    kindExact: true,
    merchantExact: true,
    recurrenceExact: true,
    titleDoesNotClaimCompletion: true,
    titleUsable: true,
  });
  assertEquals(observation.explicitZeroPreserved, true);
  assertEquals(observation.valueChargeClassification, true);
  assertEquals(observation.durationMs, 13);
});

Deno.test("runner is sequential and emits observations without fixture content", async () => {
  const fixture = fixtureById("non-actionable-newsletter");
  const calls: string[] = [];
  const waits: number[] = [];
  let now = 0;
  const extractor: FinancialEmailExtractor = {
    extract(emailText) {
      calls.push(emailText);
      return Promise.resolve(nonActionable());
    },
  };
  const observations = await runEvaluation({
    clock: () => now,
    extractor,
    fixtures: [fixture, fixture],
    minIntervalMs: 31_000,
    runCount: 1,
    sleep(milliseconds) {
      waits.push(milliseconds);
      now += milliseconds;
      return Promise.resolve();
    },
    startRun: 1,
  });
  assertEquals(calls.length, 2);
  assertEquals(waits, [31_000]);
  assert(!JSON.stringify(observations).includes(fixture.emailText));
});

Deno.test("runner normalizes unknown failures to a safe code", async () => {
  const fixture = fixtureById("clear-free-trial");
  const extractor: FinancialEmailExtractor = {
    extract() {
      return Promise.reject(
        new Error("raw provider payload and secret must not escape"),
      );
    },
  };
  const observations = await runEvaluation({
    extractor,
    fixtures: [fixture],
    minIntervalMs: 0,
    runCount: 1,
    startRun: 1,
  });
  assertEquals(observations[0].safeErrorCode, "provider_unavailable");
  assert(!JSON.stringify(observations).includes("raw provider payload"));
  const summary = summarizeObservations(observations);
  assertEquals(summary.failures, 1);
  assertEquals(summary.failureRate, 1);
  assertEquals(summary.safeErrorCodes, { provider_unavailable: 1 });
  assertEquals(summary.timeouts, 0);
  assertEquals(summary.timeoutRate, 0);
});

Deno.test("summary reports rates, latency, and safe failures", () => {
  const fixture = fixtureById("non-actionable-newsletter");
  const first = scoreExtraction(
    fixture,
    {
      isActionable: false,
      candidate: null,
      confidence: 0.5,
      warnings: [],
    },
    1,
    10,
  );
  const summary = summarizeObservations([first]);
  assertEquals(summary.runs, 1);
  assertEquals(summary.failures, 0);
  assertEquals(summary.failureRate, 0);
  assertEquals(summary.timeouts, 0);
  assertEquals(summary.timeoutRate, 0);
  assertEquals(summary.metrics.schemaValid.rate, 1);
  assertEquals(summary.metrics.coreCandidateExactMatch.rate, null);
  assertEquals(summary.durationMs, { maximum: 10, median: 10, p95: 10 });
});

function nonActionable(): GeneratedFinancialEmailExtraction {
  return {
    isActionable: false,
    candidate: null,
    confidence: 0.5,
    warnings: [],
  };
}

function fixtureById(id: string) {
  const fixture = financialEmailEvaluationFixtures.find((item) =>
    item.id === id
  );
  if (!fixture) throw new Error(`Missing fixture ${id}`);
  return fixture;
}

function reader(values: Record<string, string>): EnvironmentReader {
  return { get: (name) => values[name] };
}

function assert(condition: unknown): asserts condition {
  if (!condition) throw new Error("Assertion failed.");
}

function assertEquals(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${
        JSON.stringify(actual)
      }.`,
    );
  }
}

function assertThrows(action: () => unknown): void {
  try {
    action();
  } catch {
    return;
  }
  throw new Error("Expected action to throw.");
}
