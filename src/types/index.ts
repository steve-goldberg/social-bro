export type Platform = 'youtube' | 'instagram' | 'tiktok';

export interface PlatformConfig {
  id: Platform;
  name: string;
  description: string;
  gradient: string;
  icon: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channelName?: string;
  viewCount?: number;
  publishedAt?: string;
  platform: Platform;
  url: string;
}
