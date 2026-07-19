import type { FinancialEmailExtractor } from "./types.ts";
import type { ExtractionProviderEnvironment } from "./environment.ts";
import { OllamaEmailExtractor } from "./ollama.ts";
import { OpenAIEmailExtractor } from "./openai.ts";

export function createFinancialEmailExtractor(
  environment: ExtractionProviderEnvironment,
): FinancialEmailExtractor {
  if (environment.provider === "openai") {
    return new OpenAIEmailExtractor(environment);
  }
  return new OllamaEmailExtractor(environment);
}
