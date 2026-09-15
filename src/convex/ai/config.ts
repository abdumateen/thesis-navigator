export type ProviderKind = "openai" | "openrouter" | "custom";

export const DEFAULT_REASONING_MODEL = "gpt-4o";
export const DEFAULT_EXTRACTION_MODEL = "gpt-4o-mini";

const PROVIDER_BASE_URLS: Record<ProviderKind, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  custom: "",
};

export interface AIProviderConfig {
  provider: ProviderKind;
  baseUrl: string;
  apiKey: string;
  model: string;
  extractionModel: string;
  visionModel: string;
  source: "configured" | "legacy";
}

export interface AIProviderInfo {
  provider: ProviderKind;
  baseUrl: string;
  model: string;
  extractionModel: string;
  source: "configured" | "legacy";
}

export class AIConfigurationError extends Error {}

type EnvGetter = (name: string) => string | undefined;

function parseProvider(value: string | undefined): ProviderKind {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return "openai";
  if (normalized === "openai" || normalized === "openrouter" || normalized === "custom") {
    return normalized;
  }
  throw new AIConfigurationError(
    `Unsupported AI_PROVIDER "${value}". Use "openai", "openrouter", or "custom".`,
  );
}

export function resolveAIProviderConfig(getenv: EnvGetter): AIProviderConfig {
  const provider = parseProvider(getenv("AI_PROVIDER"));
  const genericKey = getenv("AI_API_KEY");
  const legacyKey = getenv("OPENAI_API_KEY");
  const apiKey = (genericKey?.trim() || legacyKey?.trim() || "") as string;

  if (!apiKey) {
    throw new AIConfigurationError(
      "AI provider is not configured. Set AI_API_KEY (or the legacy OPENAI_API_KEY) " +
        "as an environment variable on your Convex deployment.",
    );
  }

  const isLegacy = !genericKey?.trim();
  const baseUrl = (getenv("AI_BASE_URL")?.trim() || PROVIDER_BASE_URLS[provider]) as string;
  if (!baseUrl) {
    throw new AIConfigurationError(
      "AI_BASE_URL is required when AI_PROVIDER=custom. " +
        "Set it to your provider's OpenAI-compatible endpoint, e.g. https://provider.example.com/v1",
    );
  }

  const model = getenv("AI_MODEL")?.trim() || DEFAULT_REASONING_MODEL;
  const extractionModel =
    getenv("AI_EXTRACTION_MODEL")?.trim() || DEFAULT_EXTRACTION_MODEL;
  const visionModel = getenv("AI_VISION_MODEL")?.trim() || extractionModel;

  return {
    provider,
    baseUrl,
    apiKey,
    model,
    extractionModel,
    visionModel,
    source: isLegacy ? "legacy" : "configured",
  };
}

function defaultGetenv(name: string): string | undefined {
  return process.env[name];
}

export function resolveAIProvider(): AIProviderConfig {
  return resolveAIProviderConfig(defaultGetenv);
}

export function describeAIProvider(getenv?: EnvGetter): AIProviderInfo | null {
  try {
    const config = getenv ? resolveAIProviderConfig(getenv) : resolveAIProvider();
    return {
      provider: config.provider,
      baseUrl: config.baseUrl,
      model: config.model,
      extractionModel: config.extractionModel,
      source: config.source,
    };
  } catch {
    return null;
  }
}
