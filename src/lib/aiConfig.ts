import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface AIProviderInfo {
  provider: "openai" | "openrouter" | "custom";
  baseUrl: string;
  model: string;
  extractionModel: string;
  source: "configured" | "legacy";
}

const PROVIDER_LABELS = {
  openai: "OpenAI",
  openrouter: "OpenRouter",
  custom: "Custom",
} as const satisfies Record<AIProviderInfo["provider"], string>;

function providerLabel(provider: AIProviderInfo["provider"]): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

export function formatAIProviderLabel(info: AIProviderInfo): string {
  const model = info.model.length > 22 ? `${info.model.slice(0, 21)}…` : info.model;
  return `${providerLabel(info.provider)} · ${model}`;
}

export function formatAIProviderTooltip(info: AIProviderInfo): string {
  const parts = [
    `AI provider: ${providerLabel(info.provider)}`,
    `Model: ${info.model}`,
    `Extraction/vision model: ${info.extractionModel}`,
  ];
  if (info.source === "legacy") {
    parts.push(
      "Legacy configuration detected — migrate to AI_PROVIDER/AI_API_KEY/AI_MODEL (see README).",
    );
  }
  return parts.join(" · ");
}

export function useAIConfig() {
  return useQuery(api.aiConfig.getConfig, {});
}
