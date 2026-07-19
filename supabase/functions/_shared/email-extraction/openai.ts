import { errors } from "./errors.ts";
import {
  buildExtractionInstructions,
  buildUntrustedEmailInput,
} from "./prompt.ts";
import { financialEmailExtractionSchema } from "./schema.ts";
import type {
  ExtractionContext,
  FinancialEmailExtractor,
  GeneratedFinancialEmailExtraction,
} from "./types.ts";
import { parseGeneratedExtraction } from "./validation.ts";

interface OpenAIEmailExtractorOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
  fetcher?: typeof fetch;
}

export class OpenAIEmailExtractor implements FinancialEmailExtractor {
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: OpenAIEmailExtractorOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  async extract(
    emailText: string,
    context: ExtractionContext,
  ): Promise<GeneratedFinancialEmailExtraction> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.options.timeoutMs,
    );

    try {
      const response = await this.fetcher(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.options.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.options.model,
            store: false,
            instructions: buildExtractionInstructions(context),
            input: buildUntrustedEmailInput(emailText, context),
            max_output_tokens: 2_000,
            text: {
              format: {
                type: "json_schema",
                name: "financial_email_extraction",
                strict: true,
                schema: financialEmailExtractionSchema,
              },
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) throw errors.providerUnavailable();
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw errors.providerInvalidResponse();
      }

      return parseGeneratedExtraction(
        JSON.parse(extractStructuredText(await response.json())),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw errors.timeout();
      }
      if (error instanceof SyntaxError) throw errors.providerInvalidResponse();
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function extractStructuredText(input: unknown): string {
  if (!isRecord(input)) throw errors.providerInvalidResponse();
  if (input.status === "incomplete") throw errors.providerIncomplete();
  if (input.status !== "completed" || input.error) {
    throw errors.providerInvalidResponse();
  }
  if (!Array.isArray(input.output)) throw errors.providerInvalidResponse();

  let structuredText: string | null = null;
  let messageCount = 0;
  for (const outputItem of input.output) {
    if (!isRecord(outputItem)) throw errors.providerInvalidResponse();
    if (outputItem.type === "reasoning") continue;
    if (outputItem.type !== "message" || !Array.isArray(outputItem.content)) {
      throw errors.providerInvalidResponse();
    }
    messageCount += 1;
    for (const content of outputItem.content) {
      if (!isRecord(content)) throw errors.providerInvalidResponse();
      if (content.type === "refusal") throw errors.providerRefused();
      if (
        content.type !== "output_text" ||
        typeof content.text !== "string" ||
        !content.text.trim() ||
        structuredText !== null
      ) {
        throw errors.providerInvalidResponse();
      }
      structuredText = content.text;
    }
  }

  if (messageCount !== 1 || structuredText === null) {
    throw errors.providerInvalidResponse();
  }
  return structuredText;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
