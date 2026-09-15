"use node";

import OpenAI from "openai";
import { AIConfigurationError, resolveAIProvider } from "./config";

export type { AIProviderConfig } from "./config";
export { DEFAULT_REASONING_MODEL, DEFAULT_EXTRACTION_MODEL } from "./config";

export interface AIModels {
  reasoning: string;
  extraction: string;
  vision: string;
}

export interface AIClient {
  provider: "openai" | "openrouter" | "custom";
  client: OpenAI;
  models: AIModels;
}

export function getAI(): AIClient {
  const config = resolveAIProvider();

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    defaultHeaders:
      config.provider === "openrouter"
        ? {
            "HTTP-Referer": process.env.SITE_URL ?? "http://localhost:5173",
            "X-Title": "Thesis Navigator",
          }
        : undefined,
    maxRetries: 2,
    timeout: 120000,
  });

  return {
    provider: config.provider,
    client,
    models: {
      reasoning: config.model,
      extraction: config.extractionModel,
      vision: config.visionModel,
    },
  };
}

export function unwrapAIError(error: unknown): never {
  if (error instanceof AIConfigurationError) throw error;

  if (error instanceof OpenAI.APIError) {
    const status = error.status ?? 500;
    const name = error.name ?? "ProviderError";
    if (status === 401 || status === 403) {
      throw new Error(
        `AI provider rejected the credentials (HTTP ${status}). Check that AI_API_KEY is valid for the configured provider.`,
      );
    }
    if (status === 404) {
      throw new Error(
        "AI model not found (HTTP 404). The configured AI_MODEL does not exist on this provider.",
      );
    }
    if (status === 429) {
      throw new Error(
        "AI provider rate limit reached (HTTP 429). Wait a moment or switch to another AI_MODEL.",
      );
    }
    throw new Error(`AI provider request failed (HTTP ${status}, ${name}).`);
  }

  if (error instanceof Error) {
    if (error.message.includes("API key")) {
      throw new Error("AI API key is missing or malformed for the configured provider.");
    }
    throw new Error(`AI provider request failed: ${error.message}`);
  }

  throw new Error("AI provider request failed.");
}
