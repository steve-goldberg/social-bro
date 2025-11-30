'use client';

import { useState } from 'react';
import type { Platform } from '@/types';

interface SearchHistory {
  id: string;
  query: string;
  platform: Platform;
  timestamp: Date;
}

// Mock data for now - this would come from localStorage or API
const MOCK_SEARCHES: SearchHistory[] = [
  {
    id: '1',
    query: 'how to edit videos for beginners',
    platform: 'youtube',
    timestamp: new Date(),
  },
  { id: '2', query: 'best camera settings 2024', platform: 'youtube', timestamp: new Date() },
  { id: '3', query: 'viral hooks compilation', platform: 'youtube', timestamp: new Date() },
  { id: '4', query: 'mr beast analysis', platform: 'youtube', timestamp: new Date() },
  { id: '5', query: 'aesthetic reels inspiration', platform: 'instagram', timestamp: new Date() },
  { id: '6', query: 'carousel post ideas', platform: 'instagram', timestamp: new Date() },
  { id: '7', query: 'trending audio sounds', platform: 'tiktok', timestamp: new Date() },
  { id: '8', query: 'fyp algorithm tips', platform: 'tiktok', timestamp: new Date() },
  { id: '9', query: 'duet trends this week', platform: 'tiktok', timestamp: new Date() },
];

const TABS: { id: Platform | 'all' | 'saved'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'saved', label: 'Saved' },
];

interface PreviousSearchesProps {
  onSearchSelect: (query: string, platform: Platform) => void;
}

export function PreviousSearches({ onSearchSelect }: PreviousSearchesProps) {
  const [activeTab, setActiveTab] = useState<Platform | 'all' | 'saved'>('all');

  const filteredSearches =
    activeTab === 'all'
      ? MOCK_SEARCHES
      : activeTab === 'saved'
        ? [] // TODO: Implement saved searches
        : MOCK_SEARCHES.filter((s) => s.platform === activeTab);

  if (MOCK_SEARCHES.length === 0) return null;

  return (
    <div className="w-full max-w-4xl">
      {/* Header */}
      <h2 className="mb-4 text-sm font-medium text-white/50">Your previous searches</h2>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
              activeTab === tab.id ? 'bg-white text-black' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search tiles - fixed 4 rows height */}
      <div className="flex h-[176px] flex-wrap content-start gap-2 overflow-hidden">
        {filteredSearches.map((search) => (
          <button
            key={search.id}
            onClick={() => onSearchSelect(search.query, search.platform)}
            className="max-w-[180px] truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-all duration-150 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            {search.query}
          </button>
        ))}
      </div>
    </div>
  );
}
