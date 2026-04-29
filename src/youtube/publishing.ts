import { wrapApiCall } from "../errors/handlers.js";
import { withBackoff } from "../quota/backoff.js";
import type { YouTubeClient } from "./client.js";
import type { youtube_v3 } from "@googleapis/youtube";

export async function setPrivacy(
  yt: YouTubeClient,
  videoId: string,
  privacyStatus: "public" | "private" | "unlisted"
): Promise<youtube_v3.Schema$Video> {
  return wrapApiCall("videos.update", () =>
    withBackoff(async () => {
      const response = await yt.videos.update({
        part: ["status"],
        requestBody: {
          id: videoId,
          status: { privacyStatus },
        },
      });
      return response.data;
    }, "videos.update")
  );
}

export async function schedulePublish(
  yt: YouTubeClient,
  videoId: string,
  publishAt: string,
  privacyStatus: "public" | "private" = "public"
): Promise<youtube_v3.Schema$Video> {
  return wrapApiCall("videos.update", () =>
    withBackoff(async () => {
      const response = await yt.videos.update({
        part: ["status"],
        requestBody: {
          id: videoId,
          status: {
            privacyStatus: "private",
            publishAt,
          },
        },
      });
      return response.data;
    }, "videos.update")
  );
}

export async function setPremiere(
  yt: YouTubeClient,
  videoId: string,
  premiereAt: string
): Promise<youtube_v3.Schema$Video> {
  return wrapApiCall("videos.update", () =>
    withBackoff(async () => {
      const response = await yt.videos.update({
        part: ["status", "snippet"],
        requestBody: {
          id: videoId,
          status: {
            privacyStatus: "private",
            publishAt: premiereAt,
          },
        },
      });
      return response.data;
    }, "videos.update")
  );
}
