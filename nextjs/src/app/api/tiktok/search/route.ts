import { NextRequest, NextResponse } from 'next/server';
import { searchTikTok, transformSearchResultsToTableData } from '@/lib/rapidapi';
import { requireUserId } from '@/lib/auth-utils';
import { isApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('q');

  if (!keyword) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const userId = await requireUserId();

    const results = await searchTikTok({
      userId,
      keyword,
    });

    const tableData = transformSearchResultsToTableData(results);

    return NextResponse.json({ results: tableData });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('TikTok search error:', error);
    return NextResponse.json({ error: 'Failed to search TikTok' }, { status: 500 });
  }
}
