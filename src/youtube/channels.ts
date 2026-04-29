import fs from "node:fs";
import { wrapApiCall } from "../errors/handlers.js";
import { withBackoff } from "../quota/backoff.js";
import type { YouTubeClient } from "./client.js";
import type { youtube_v3 } from "@googleapis/youtube";

export async function getChannel(
  yt: YouTubeClient,
  parts: string[] = ["snippet", "brandingSettings", "statistics", "contentDetails"]
): Promise<youtube_v3.Schema$Channel | null> {
  return wrapApiCall("channels.list", () =>
    withBackoff(async () => {
      const response = await yt.channels.list({ part: parts, mine: true });
      return response.data.items?.[0] ?? null;
    }, "channels.list")
  );
}

export async function updateChannel(
  yt: YouTubeClient,
  params: {
    title?: string;
    description?: string;
    keywords?: string[];
    country?: string;
    defaultLanguage?: string;
  }
): Promise<youtube_v3.Schema$Channel> {
  const current = await getChannel(yt, ["snippet", "brandingSettings"]);

  return wrapApiCall("channels.update", () =>
    withBackoff(async () => {
      const response = await yt.channels.update({
        part: ["snippet", "brandingSettings"],
        requestBody: {
          id: current?.id ?? "",
          snippet: {
            title: params.title ?? current?.snippet?.title,
            description: params.description ?? current?.snippet?.description,
            defaultLanguage: params.defaultLanguage ?? current?.snippet?.defaultLanguage,
            country: params.country ?? current?.snippet?.country,
          },
          brandingSettings: {
            channel: {
              ...current?.brandingSettings?.channel,
              keywords: params.keywords
                ? params.keywords.join(" ")
                : current?.brandingSettings?.channel?.keywords,
            },
          },
        },
      });
      return response.data;
    }, "channels.update")
  );
}

export async function updateBranding(
  yt: YouTubeClient,
  channelId: string,
  params: {
    bannerImagePath?: string;
    showRelatedChannels?: boolean;
    featuredChannelsTitle?: string;
  }
): Promise<youtube_v3.Schema$Channel> {
  return wrapApiCall("channels.update", () =>
    withBackoff(async () => {
      const response = await yt.channels.update({
        part: ["brandingSettings"],
        requestBody: {
          id: channelId,
          brandingSettings: {
            channel: {
              showRelatedChannels: params.showRelatedChannels,
              featuredChannelsTitle: params.featuredChannelsTitle,
            },
          },
        },
      });
      return response.data;
    }, "channels.update")
  );
}

export async function setWatermark(
  yt: YouTubeClient,
  channelId: string,
  imagePath: string,
  position: {
    cornerPosition: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
    type: "corner";
  },
  timing: {
    type: "offsetFromStart" | "offsetFromEnd";
    offsetMs: number;
    durationMs: number;
  }
): Promise<void> {
  const media = fs.createReadStream(imagePath);

  return wrapApiCall("watermarks.set", () =>
    withBackoff(async () => {
      await yt.watermarks.set({
        channelId,
        requestBody: {
          position: {
            cornerPosition: position.cornerPosition,
            type: position.type,
          },
          timing: {
            type: timing.type,
            offsetMs: String(timing.offsetMs),
            durationMs: String(timing.durationMs),
          },
        },
        media: { mimeType: "image/png", body: media },
      });
    }, "watermarks.set")
  );
}

export async function unsetWatermark(
  yt: YouTubeClient,
  channelId: string
): Promise<void> {
  return wrapApiCall("watermarks.unset", () =>
    withBackoff(async () => {
      await yt.watermarks.unset({ channelId });
    }, "watermarks.unset")
  );
}

export async function listChannelSections(
  yt: YouTubeClient,
  channelId?: string
): Promise<youtube_v3.Schema$ChannelSection[]> {
  return wrapApiCall("channelSections.list", () =>
    withBackoff(async () => {
      const response = await yt.channelSections.list({
        part: ["snippet", "contentDetails"],
        channelId,
        mine: channelId ? undefined : true,
      });
      return response.data.items ?? [];
    }, "channelSections.list")
  );
}

export async function createChannelSection(
  yt: YouTubeClient,
  params: {
    type: string;
    title?: string;
    position?: number;
    playlistIds?: string[];
    channelIds?: string[];
  }
): Promise<youtube_v3.Schema$ChannelSection> {
  return wrapApiCall("channelSections.insert", () =>
    withBackoff(async () => {
      const response = await yt.channelSections.insert({
        part: ["snippet", "contentDetails"],
        requestBody: {
          snippet: {
            type: params.type,
            title: params.title,
            position: params.position,
          },
          contentDetails: {
            playlists: params.playlistIds,
            channels: params.channelIds,
          },
        },
      });
      return response.data;
    }, "channelSections.insert")
  );
}

export async function deleteChannelSection(
  yt: YouTubeClient,
  sectionId: string
): Promise<void> {
  return wrapApiCall("channelSections.delete", () =>
    withBackoff(async () => {
      await yt.channelSections.delete({ id: sectionId });
    }, "channelSections.delete")
  );
}
