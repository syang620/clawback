export const financialEmailExtractionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["isActionable", "candidate", "confidence", "warnings"],
  properties: {
    isActionable: { type: "boolean" },
    candidate: {
      type: ["object", "null"],
      additionalProperties: false,
      required: [
        "merchantName",
        "title",
        "kind",
        "valueAmount",
        "chargeAmount",
        "deadlineDate",
        "recurrence",
        "actionUrl",
      ],
      properties: {
        merchantName: nullableString(200),
        title: nullableString(200),
        kind: nullableEnum(["trial", "perk", "subscription"]),
        valueAmount: nullableMoney(),
        chargeAmount: nullableMoney(),
        deadlineDate: {
          type: ["string", "null"],
          pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
        },
        recurrence: nullableEnum([
          "none",
          "monthly",
          "quarterly",
          "annual",
          "custom",
        ]),
        actionUrl: nullableString(2048),
      },
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    warnings: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "field", "message"],
        properties: {
          code: {
            type: "string",
            enum: [
              "missing_deadline",
              "ambiguous_deadline",
              "inferred_year",
              "missing_merchant",
              "missing_amount",
              "conflicting_amounts",
              "unverified_action_url",
              "unsupported_task",
              "low_confidence",
              "unsupported_currency",
              "multiple_dates",
              "normalized_relative_date",
            ],
          },
          field: {
            type: "string",
            enum: [
              "general",
              "merchantName",
              "title",
              "kind",
              "valueAmount",
              "chargeAmount",
              "deadlineDate",
              "recurrence",
              "actionUrl",
            ],
          },
          message: { type: "string" },
        },
      },
    },
  },
} as const;

function nullableString(maxLength: number) {
  // Length is enforced by the shared runtime validator. Ollama 0.31 cannot
  // compile minLength/maxLength on nullable strings into its grammar.
  void maxLength;
  return {
    type: ["string", "null"],
  } as const;
}

function nullableEnum(values: readonly string[]) {
  return {
    type: ["string", "null"],
    enum: [...values, null],
  } as const;
}

function nullableMoney() {
  return {
    type: ["string", "null"],
    pattern: "^(0|[1-9][0-9]*)(\\.[0-9]{1,2})?$",
  } as const;
}
