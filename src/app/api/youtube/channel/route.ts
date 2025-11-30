import { NextRequest, NextResponse } from 'next/server';
import { getChannelVideosByUsername } from '@/lib/youtube';
import { getMultipleVideoDetails } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const maxResults = parseInt(searchParams.get('maxResults') || '25', 10);

  if (!username) {
    return NextResponse.json(
      { error: 'Username parameter is required' },
      { status: 400 }
    );
  }

  try {
    const { channel, videos } = await getChannelVideosByUsername(username, maxResults);

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Get video IDs to fetch detailed stats
    const videoIds = videos.map((v) => v.id).filter(Boolean);

    // Fetch video details with stats
    const videoDetails = videoIds.length > 0
      ? await getMultipleVideoDetails(videoIds)
      : [];

    return NextResponse.json({
      channel,
      videos,
      videoDetails,
    });
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel videos' },
      { status: 500 }
    );
  }
}
