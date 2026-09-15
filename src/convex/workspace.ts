import type { MutationCtx, QueryCtx } from "./_generated/server";

export const LOCAL_WORKSPACE_ID = "local";

export type AppMode = "local" | "hosted";

export interface WorkspaceContext {
  mode: AppMode;
  /**
   * Stable identifier for the workspace all app data belongs to.
   * Stored in the `userId` field of workspace-owned records.
   */
  workspaceId: string | null;
}

export function getAppMode(): AppMode {
  return process.env.APP_MODE === "hosted" ? "hosted" : "local";
}

/**
 * Resolve the workspace for the current request.
 *
 * - `local` mode (default): every request belongs to the single
 *   self-hosted workspace. No authentication involved.
 * - `hosted` mode: the workspace is the authenticated user's identity
 *   subject; `workspaceId` is null when the caller is not signed in
 *   (queries should return empty, mutations should throw).
 */
export async function getWorkspaceContext(
  ctx: QueryCtx | MutationCtx,
): Promise<WorkspaceContext> {
  if (getAppMode() === "local") {
    return { mode: "local", workspaceId: LOCAL_WORKSPACE_ID };
  }

  const identity = await ctx.auth.getUserIdentity();
  return { mode: "hosted", workspaceId: identity?.subject ?? null };
}
