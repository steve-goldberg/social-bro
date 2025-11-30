'use client';

import { useRef } from 'react';
import { Search } from 'lucide-react';
import type { Platform } from '@/types';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  platform: Platform;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search for content...',
  disabled = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const canSearch = value.trim().length > 0 && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="w-full rounded-full border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-200 hover:border-white/20 focus-within:border-white/30">
      <div className="flex h-12 items-center gap-3 px-5">
        <Search className="h-5 w-5 shrink-0 text-white/40" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
        />

        {canSearch && (
          <button
            onClick={onSearch}
            className="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition-opacity duration-150 hover:opacity-80"
          >
            Search
          </button>
        )}
      </div>
    </div>
  );
}
