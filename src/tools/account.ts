import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createAuthenticatedClient } from "../auth/oauth.js";
import { tokenStore } from "../auth/token-store.js";
import { resetAllAuthClients } from "../auth/middleware.js";
import { buildYouTubeClient } from "../youtube/client.js";
import { getChannel } from "../youtube/channels.js";
import { YouTubeMcpError } from "../errors/types.js";
import { buildErrorResponse } from "../errors/handlers.js";
import { YouTubeMcpErrorCode } from "../errors/codes.js";
import { getQuotaSummary } from "../quota/tracker.js";
import {
  AddChannelSchema, SwitchChannelSchema, RemoveChannelSchema,
  ListChannelsSchema, CurrentChannelSchema,
} from "../schemas/account.js";

function toolResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerAccountTools(server: McpServer): void {
  server.registerTool(
    "youtube_account_add",
    {
      description: "Connect a new YouTube channel by running the OAuth flow and saving it under a named profile. After this you can target it with channel: '<name>' in any tool.",
      inputSchema: AddChannelSchema,
    },
    async (params) => {
      try {
        const existing = tokenStore.getProfile(params.name);
        if (existing) {
          throw new YouTubeMcpError(
            YouTubeMcpErrorCode.INTERNAL_ERROR,
            `Profile "${params.name}" already exists. Remove it first or choose a different name.`
          );
        }

        const client = await createAuthenticatedClient(params.name);
        const yt = buildYouTubeClient(client);
        const channelData = await getChannel(yt, ["id", "snippet"]);

        if (channelData?.id) {
          tokenStore.updateProfileMeta(params.name, {
            channelId: channelData.id,
            channelTitle: (channelData as { snippet?: { title?: string } }).snippet?.title,
          });
        }

        const profile = tokenStore.getProfile(params.name);
        return toolResult({
          success: true,
          data: {
            name: params.name,
            channelId: profile?.channelId,
            channelTitle: profile?.channelTitle,
            addedAt: profile?.addedAt,
            message: `Channel "${params.name}" connected. Use channel: "${params.name}" in any tool to target it.`,
          },
        });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_account_list",
    {
      description: "List all connected YouTube channel profiles with their names, channel IDs, and active status.",
      inputSchema: ListChannelsSchema,
    },
    async () => {
      try {
        const profiles = tokenStore.listProfiles();
        const active = tokenStore.getActiveProfileName();
        const data = profiles.map((p) => ({
          name: p.name,
          channelId: p.channelId,
          channelTitle: p.channelTitle,
          addedAt: p.addedAt ? new Date(p.addedAt).toISOString() : undefined,
          active: p.name === active,
        }));
        return toolResult({ success: true, data, activeProfile: active });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_account_switch",
    {
      description: "Switch the active channel profile. All tools without an explicit channel parameter will use this profile.",
      inputSchema: SwitchChannelSchema,
    },
    async (params) => {
      try {
        tokenStore.setActiveProfile(params.name);
        resetAllAuthClients();
        const profile = tokenStore.getProfile(params.name);
        return toolResult({
          success: true,
          data: {
            activeProfile: params.name,
            channelId: profile?.channelId,
            channelTitle: profile?.channelTitle,
            message: `Switched to profile "${params.name}". All subsequent tool calls will use this channel.`,
          },
        });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_account_current",
    {
      description: "Show the currently active channel profile.",
      inputSchema: CurrentChannelSchema,
    },
    async () => {
      try {
        const active = tokenStore.getActiveProfileName();
        const profile = tokenStore.getProfile(active);
        return toolResult({
          success: true,
          data: {
            name: active,
            channelId: profile?.channelId,
            channelTitle: profile?.channelTitle,
            addedAt: profile?.addedAt ? new Date(profile.addedAt).toISOString() : undefined,
            hasTokens: !!profile?.tokens,
          },
        });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );

  server.registerTool(
    "youtube_account_remove",
    {
      description: "Disconnect and remove a channel profile. Requires confirm: true. Cannot remove the last profile.",
      inputSchema: RemoveChannelSchema,
    },
    async (params) => {
      try {
        const profiles = tokenStore.listProfiles();
        if (profiles.length <= 1) {
          throw new YouTubeMcpError(
            YouTubeMcpErrorCode.INTERNAL_ERROR,
            "Cannot remove the only connected channel. Add another channel first."
          );
        }
        const profile = tokenStore.getProfile(params.name);
        if (!profile) {
          throw new YouTubeMcpError(
            YouTubeMcpErrorCode.INTERNAL_ERROR,
            `Profile "${params.name}" not found.`
          );
        }
        tokenStore.removeProfile(params.name);
        resetAllAuthClients();
        const newActive = tokenStore.getActiveProfileName();
        return toolResult({
          success: true,
          data: {
            removed: params.name,
            activeProfile: newActive,
            message: `Profile "${params.name}" removed. Active profile is now "${newActive}".`,
          },
        });
      } catch (err) {
        const e = err instanceof YouTubeMcpError ? err : new YouTubeMcpError(YouTubeMcpErrorCode.INTERNAL_ERROR, String(err));
        return toolResult(buildErrorResponse(e, getQuotaSummary(0)));
      }
    }
  );
}
