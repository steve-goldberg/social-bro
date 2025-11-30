import { NextRequest, NextResponse } from 'next/server';
import { searchYouTube } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const maxResults = searchParams.get('maxResults');
  const order = searchParams.get('order') as
    | 'date'
    | 'rating'
    | 'relevance'
    | 'title'
    | 'viewCount'
    | null;
  const type = searchParams.get('type') as 'video' | 'channel' | 'playlist' | null;

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const results = await searchYouTube({
      query,
      maxResults: maxResults ? parseInt(maxResults, 10) : 25,
      order: order || 'relevance',
      type: type || 'video',
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('YouTube search error:', error);
    return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 500 });
  }
}
