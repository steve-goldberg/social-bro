import { NextRequest, NextResponse } from 'next/server';
import { getMultipleVideoDetails } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ids = searchParams.get('ids');

  if (!ids) {
    return NextResponse.json({ error: 'Video IDs are required' }, { status: 400 });
  }

  try {
    // YouTube video IDs are 11 characters, alphanumeric with - and _
    const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;
    const videoIds = ids
      .split(',')
      .filter(Boolean)
      .filter((id) => videoIdPattern.test(id));

    if (videoIds.length === 0) {
      return NextResponse.json({ error: 'No valid video IDs provided' }, { status: 400 });
    }

    const videos = await getMultipleVideoDetails(videoIds);
    return NextResponse.json({ videos });
  } catch (error) {
    console.error('YouTube video details error:', error);
    return NextResponse.json({ error: 'Failed to fetch video details' }, { status: 500 });
  }
}
