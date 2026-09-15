import { query } from "./_generated/server";
import { describeAIProvider } from "./ai/config";

export const getConfig = query({
  args: {},
  handler: async () => describeAIProvider(),
});
