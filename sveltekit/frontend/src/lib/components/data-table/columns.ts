import { formatNumber } from '$lib/utils';

export type CellFormatter = (value: unknown, row: Record<string, unknown>) => string;

export interface ColumnDef {
	id: string;
	header: string;
	accessor?: string;
	sortable?: boolean;
	cellType?:
		| 'text'
		| 'number'
		| 'thumbnail-username'
		| 'truncated-text'
		| 'engagement'
		| 'url'
		| 'date'
		| 'platform'
		| 'word-count'
		| 'action';
	format?: CellFormatter;
	maxWidth?: string;
	/** For action columns, defines the action type */
	actionType?: 'repurpose' | 'extract' | 'delete' | 'view-original' | 'view-repurposed';
	/** Whether the username should be prefixed with @ */
	prefixAt?: boolean;
}

function getScoreColor(score: number): string {
	if (score >= 10) return 'text-green-400 bg-green-400/10';
	if (score >= 5) return 'text-yellow-400 bg-yellow-400/10';
	if (score >= 2) return 'text-orange-400 bg-orange-400/10';
	return 'text-red-400 bg-red-400/10';
}

export { getScoreColor };

// ============ YouTube Columns ============
export const youtubeColumns: ColumnDef[] = [
	{
		id: 'username',
		header: 'Username',
		accessor: 'username',
		cellType: 'thumbnail-username',
		sortable: true
	},
	{
		id: 'title',
		header: 'Title',
		accessor: 'title',
		cellType: 'truncated-text',
		sortable: true,
		maxWidth: '200px'
	},
	{
		id: 'views',
		header: 'Views',
		accessor: 'views',
		cellType: 'number',
		sortable: true,
		format: (v) => formatNumber(v as number)
	},
	{
		id: 'likes',
		header: 'Likes',
		accessor: 'likes',
		cellType: 'number',
		sortable: true,
		format: (v) => formatNumber(v as number)
	},
	{
		id: 'comments',
		header: 'Comments',
		accessor: 'comments',
		cellType: 'number',
		sortable: true,
		format: (v) => formatNumber(v as number)
	},
	{
		id: 'engagementScore',
		header: 'Engagement',
		accessor: 'engagementScore',
		cellType: 'engagement',
		sortable: true
	},
	{
		id: 'url',
		header: 'URL',
		accessor: 'url',
		cellType: 'url',
		sortable: false
	},
	{
		id: 'repurpose',
		header: 'Repurpose',
		cellType: 'action',
		actionType: 'repurpose',
		sortable: false
	}
];

// ============ TikTok Columns ============
export const tiktokColumns: ColumnDef[] = [
	{
		id: 'username',
		header: 'Username',
		accessor: 'username',
		cellType: 'thumbnail-username',
		sortable: true,
		prefixAt: true
	},
	{
		id: 'title',
		header: 'Description',
		accessor: 'title',
		cellType: 'truncated-text',
		sortable: true,
		maxWidth: '200px'
	},
	{
		id: 'views',
		header: 'Views',
		accessor: 'views',
		cellType: 'number',
		sortable: true,
		format: (v) => formatNumber(v as number)
	},
	{
		id: 'likes',
		header: 'Likes',
		accessor: 'likes',
		cellType: 'number',
		sortable: true,
		format: (v) => formatNumber(v as number)
	},
	{
		id: 'comments',
		header: 'Comments',
		accessor: 'comments',
		cellType: 'number',
		sortable: true,
		format: (v) => formatNumber(v as number)
	},
	{
		id: 'engagementScore',
		header: 'Engagement',
		accessor: 'engagementScore',
		cellType: 'engagement',
		sortable: true
	},
	{
		id: 'url',
		header: 'URL',
		accessor: 'url',
		cellType: 'url',
		sortable: false
	},
	{
		id: 'repurpose',
		header: 'Repurpose',
		cellType: 'action',
		actionType: 'repurpose',
		sortable: false
	}
];

// ============ Instagram Columns ============
export const instagramColumns: ColumnDef[] = [
	{
		id: 'username',
		header: 'Username',
		accessor: 'username',
		cellType: 'thumbnail-username',
		sortable: true,
		prefixAt: true
	},
	{
		id: 'title',
		header: 'Caption',
		accessor: 'title',
		cellType: 'truncated-text',
		sortable: true,
		maxWidth: '200px'
	},
	{
		id: 'views',
		header: 'Views',
		accessor: 'views',
		cellType: 'number',
		sortable: true,
		format: (v) => formatNumber(v as number)
	},
	{
		id: 'likes',
		header: 'Likes',
		accessor: 'likes',
		cellType: 'number',
		sortable: true,
		format: (v) => formatNumber(v as number)
	},
	{
		id: 'comments',
		header: 'Comments',
		accessor: 'comments',
		cellType: 'number',
		sortable: true,
		format: (v) => formatNumber(v as number)
	},
	{
		id: 'engagementScore',
		header: 'Engagement',
		accessor: 'engagementScore',
		cellType: 'engagement',
		sortable: true
	},
	{
		id: 'url',
		header: 'URL',
		accessor: 'url',
		cellType: 'url',
		sortable: false
	},
	{
		id: 'repurpose',
		header: 'Repurpose',
		cellType: 'action',
		actionType: 'repurpose',
		sortable: false
	}
];

// ============ Repurpose Columns ============
export const repurposeColumns: ColumnDef[] = [
	{
		id: 'creatorName',
		header: 'Creator',
		accessor: 'creatorName',
		cellType: 'thumbnail-username',
		sortable: true
	},
	{
		id: 'title',
		header: 'Title',
		accessor: 'title',
		cellType: 'truncated-text',
		sortable: true,
		maxWidth: '250px'
	},
	{
		id: 'platform',
		header: 'Platform',
		accessor: 'platform',
		cellType: 'platform',
		sortable: true
	},
	{
		id: 'viewCount',
		header: 'Views',
		accessor: 'viewCount',
		cellType: 'number',
		sortable: true,
		format: (v) => (v ? formatNumber(v as number) : '-')
	},
	{
		id: 'savedAt',
		header: 'Saved',
		accessor: 'savedAt',
		cellType: 'date',
		sortable: true
	},
	{
		id: 'url',
		header: 'URL',
		accessor: 'url',
		cellType: 'url',
		sortable: false
	},
	{
		id: 'extract',
		header: '',
		cellType: 'action',
		actionType: 'extract',
		sortable: false
	},
	{
		id: 'actions',
		header: '',
		cellType: 'action',
		actionType: 'delete',
		sortable: false
	}
];

// ============ Scripts Columns ============
export const scriptsColumns: ColumnDef[] = [
	{
		id: 'title',
		header: 'Title',
		accessor: 'title',
		cellType: 'truncated-text',
		sortable: true,
		maxWidth: '300px'
	},
	{
		id: 'createdAt',
		header: 'Created',
		accessor: 'createdAt',
		cellType: 'date',
		sortable: true
	},
	{
		id: 'wordCount',
		header: 'Words',
		cellType: 'word-count',
		sortable: false
	},
	{
		id: 'original',
		header: 'Original',
		cellType: 'action',
		actionType: 'view-original',
		sortable: false
	},
	{
		id: 'repurposed',
		header: 'Repurposed',
		cellType: 'action',
		actionType: 'view-repurposed',
		sortable: false
	},
	{
		id: 'actions',
		header: '',
		cellType: 'action',
		actionType: 'delete',
		sortable: false
	}
];
