export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
  token_type: "Bearer";
  stored_at: number;
}

export interface ChannelProfile {
  name: string;
  tokens: StoredTokens;
  addedAt: number;
  channelId?: string;
  channelTitle?: string;
}

export interface MultiProfileStore {
  profiles: Record<string, ChannelProfile>;
  activeProfile: string;
}
