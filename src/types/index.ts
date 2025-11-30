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

export interface YouTubeTableData {
  id: string;
  username: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  engagementScore: number;
  url: string;
  thumbnail?: string;
}

export interface SavedSearchWithResults {
  id: string;
  query: string;
  platform: Platform;
  createdAt: string;
  results: YouTubeTableData[];
}
