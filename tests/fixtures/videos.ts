import type { youtube_v3 } from "@googleapis/youtube";

export function singleVideoResponse(
  overrides: Partial<youtube_v3.Schema$Video> = {}
): { items: youtube_v3.Schema$Video[]; pageInfo: { totalResults: number; resultsPerPage: number } } {
  return {
    items: [
      {
        kind: "youtube#video",
        etag: "test_etag",
        id: "dQw4w9WgXcQ",
        snippet: {
          publishedAt: "2024-01-01T00:00:00Z",
          channelId: "UCtest123",
          title: "Test Video Title",
          description: "Test description",
          thumbnails: {
            default: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg", width: 120, height: 90 },
          },
          tags: ["test", "video"],
          categoryId: "22",
          liveBroadcastContent: "none",
          defaultLanguage: "en",
          localized: { title: "Test Video Title", description: "Test description" },
        },
        statistics: {
          viewCount: "1000000",
          likeCount: "50000",
          favoriteCount: "0",
          commentCount: "5000",
        },
        status: {
          uploadStatus: "processed",
          privacyStatus: "public",
          license: "youtube",
          embeddable: true,
          publicStatsViewable: true,
          madeForKids: false,
        },
        ...overrides,
      },
    ],
    pageInfo: { totalResults: 1, resultsPerPage: 5 },
  };
}

export function emptyVideoResponse() {
  return { items: [], pageInfo: { totalResults: 0, resultsPerPage: 5 } };
}
