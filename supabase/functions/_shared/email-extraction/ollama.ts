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

interface OllamaEmailExtractorOptions {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  fetcher?: typeof fetch;
}

export class OllamaEmailExtractor implements FinancialEmailExtractor {
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: OllamaEmailExtractorOptions) {
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
      const response = await this.fetcher(`${this.options.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.options.model,
          stream: false,
          think: false,
          format: financialEmailExtractionSchema,
          options: { temperature: 0 },
          messages: [
            {
              role: "system",
              content: buildExtractionInstructions(context),
            },
            {
              role: "user",
              content: buildUntrustedEmailInput(emailText, context),
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw errors.providerUnavailable();
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw errors.providerInvalidResponse();
      }

      const payload: unknown = await response.json();
      if (!isRecord(payload) || payload.done !== true) {
        throw errors.providerIncomplete();
      }
      if (
        !isRecord(payload.message) ||
        typeof payload.message.content !== "string" ||
        !payload.message.content.trim()
      ) {
        throw errors.providerInvalidResponse();
      }
      return parseGeneratedExtraction(JSON.parse(payload.message.content));
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

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
