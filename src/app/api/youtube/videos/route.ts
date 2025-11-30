import { NextRequest, NextResponse } from 'next/server';
import { getMultipleVideoDetails } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ids = searchParams.get('ids');

  if (!ids) {
    return NextResponse.json({ error: 'Video IDs are required' }, { status: 400 });
  }

  try {
    const videoIds = ids.split(',').filter(Boolean);
    const videos = await getMultipleVideoDetails(videoIds);
    return NextResponse.json({ videos });
  } catch (error) {
    console.error('YouTube video details error:', error);
    return NextResponse.json({ error: 'Failed to fetch video details' }, { status: 500 });
  }
}
