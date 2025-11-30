'use client';

import { useState } from 'react';
import { SearchInput, PlatformSelector, PreviousSearches } from '@/components/search';
import { WelcomeHeader } from '@/components/search/WelcomeHeader';
import { PreLoader } from '@/components/preloader';
import type { Platform } from '@/types';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('youtube');
  const [showPreLoader, setShowPreLoader] = useState(true);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    // TODO: Implement actual search functionality
    // eslint-disable-next-line no-console
    console.log(`Searching for "${searchQuery}" on ${selectedPlatform}`);
  };

  const handleSearchSelect = (query: string, platform: Platform) => {
    setSearchQuery(query);
    setSelectedPlatform(platform);
  };

  return (
    <>
      {showPreLoader && <PreLoader onComplete={() => setShowPreLoader(false)} />}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        {/* Main content - centered */}
        <div className="flex w-full max-w-[57.75rem] flex-col items-center gap-8">
          {/* Welcome Header */}
          <WelcomeHeader />

          {/* Platform Selector */}
          <PlatformSelector selected={selectedPlatform} onSelect={setSelectedPlatform} />

          {/* Search Input */}
          <div className="w-full max-w-2xl">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              platform={selectedPlatform}
              placeholder="Search for videos, creators, or topics..."
            />
          </div>
        </div>

        {/* Previous Searches - absolute positioned at bottom */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center px-4">
          <PreviousSearches onSearchSelect={handleSearchSelect} />
        </div>
      </div>
    </>
  );
}
