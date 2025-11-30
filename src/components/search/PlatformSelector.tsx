'use client';

import { Youtube, Instagram, Music2 } from 'lucide-react';
import type { Platform, PlatformConfig } from '@/types';
import { PLATFORMS } from '@/lib/constants';

interface PlatformSelectorProps {
  selected: Platform;
  onSelect: (platform: Platform) => void;
}

const PlatformIcon = ({ platform }: { platform: Platform }) => {
  const iconProps = { className: 'h-4 w-4' };

  switch (platform) {
    case 'youtube':
      return <Youtube {...iconProps} />;
    case 'instagram':
      return <Instagram {...iconProps} />;
    case 'tiktok':
      return <Music2 {...iconProps} />;
    default:
      return null;
  }
};

function PlatformCard({
  platform,
  isSelected,
  onClick,
}: {
  platform: PlatformConfig;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ${
        isSelected
          ? 'bg-white text-black'
          : 'border border-white/10 bg-transparent text-white/60 hover:border-white/20 hover:text-white'
      }`}
    >
      <PlatformIcon platform={platform.id} />
      <span>{platform.name}</span>
    </button>
  );
}

export function PlatformSelector({ selected, onSelect }: PlatformSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PLATFORMS.map((platform) => (
        <PlatformCard
          key={platform.id}
          platform={platform}
          isSelected={selected === platform.id}
          onClick={() => onSelect(platform.id)}
        />
      ))}
    </div>
  );
}
