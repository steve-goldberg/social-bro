import type { PlatformConfig } from '@/types';

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Search videos & channels',
    gradient: '#FF0000', // YouTube red
    icon: 'youtube',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Explore posts & reels',
    gradient: '#E040FB', // Instagram purple/pink
    icon: 'instagram',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Discover trending videos',
    gradient: '#00F2EA', // TikTok cyan
    icon: 'tiktok',
  },
];
