import { wrapApiCall } from "../errors/handlers.js";
import { withBackoff } from "../quota/backoff.js";
import type { YouTubeClient } from "./client.js";
import type { youtube_v3 } from "@googleapis/youtube";

export async function listCommentThreads(
  yt: YouTubeClient,
  videoId: string,
  params: {
    maxResults?: number;
    pageToken?: string;
    order?: "time" | "relevance";
    searchTerms?: string;
  }
): Promise<{ items: youtube_v3.Schema$CommentThread[]; nextPageToken?: string }> {
  return wrapApiCall("commentThreads.list", () =>
    withBackoff(async () => {
      const response = await yt.commentThreads.list({
        part: ["snippet", "replies"],
        videoId,
        maxResults: params.maxResults ?? 20,
        pageToken: params.pageToken,
        order: params.order ?? "time",
        searchTerms: params.searchTerms,
      });
      return {
        items: response.data.items ?? [],
        nextPageToken: response.data.nextPageToken ?? undefined,
      };
    }, "commentThreads.list")
  );
}

export async function getCommentThread(
  yt: YouTubeClient,
  commentThreadId: string,
  maxReplies = 20
): Promise<youtube_v3.Schema$CommentThread | null> {
  return wrapApiCall("commentThreads.list", () =>
    withBackoff(async () => {
      const response = await yt.commentThreads.list({
        part: ["snippet", "replies"],
        id: [commentThreadId],
        maxResults: maxReplies,
      });
      return response.data.items?.[0] ?? null;
    }, "commentThreads.list")
  );
}

export async function replyToComment(
  yt: YouTubeClient,
  parentCommentId: string,
  text: string
): Promise<youtube_v3.Schema$Comment> {
  return wrapApiCall("comments.insert", () =>
    withBackoff(async () => {
      const response = await yt.comments.insert({
        part: ["snippet"],
        requestBody: {
          snippet: {
            parentId: parentCommentId,
            textOriginal: text,
          },
        },
      });
      return response.data;
    }, "comments.insert")
  );
}

export async function deleteComment(
  yt: YouTubeClient,
  commentId: string
): Promise<void> {
  return wrapApiCall("comments.delete", () =>
    withBackoff(async () => {
      await yt.comments.delete({ id: commentId });
    }, "comments.delete")
  );
}

export async function moderateComment(
  yt: YouTubeClient,
  commentId: string,
  moderationStatus: "published" | "heldForReview" | "rejected",
  banAuthor = false
): Promise<void> {
  return wrapApiCall("comments.setModerationStatus", () =>
    withBackoff(async () => {
      await yt.comments.setModerationStatus({
        id: [commentId],
        moderationStatus,
        banAuthor,
      });
    }, "comments.setModerationStatus")
  );
}
