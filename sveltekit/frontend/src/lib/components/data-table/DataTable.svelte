<!-- eslint-disable svelte/no-navigation-without-resolve -->
<script lang="ts">
	import {
		Table,
		TableHeader,
		TableBody,
		TableRow,
		TableHead,
		TableCell
	} from '$lib/components/ui/table/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import {
		Pagination,
		PaginationContent,
		PaginationItem,
		PaginationPrevButton,
		PaginationNextButton
	} from '$lib/components/ui/pagination/index.js';
	import { cn, formatNumber } from '$lib/utils';
	import { type ColumnDef, getScoreColor } from './columns';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Check from '@lucide/svelte/icons/check';

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		data: Record<string, any>[];
		columns: ColumnDef[];
		isLoading?: boolean;
		skeletonRows?: number;
		perPage?: number;
		platform?: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onAction?: (actionType: string, row: Record<string, any>) => void;
	}

	let {
		data = [],
		columns = [],
		isLoading = false,
		skeletonRows = 5,
		perPage = 10,
		platform = '',
		onAction
	}: Props = $props();

	// Sorting state
	let sortColumn = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc' | null>(null);

	// Pagination state
	let currentPage = $state(1);

	// Action loading states: Map<rowId-actionType, state>
	let actionStates = $state<Record<string, 'loading' | 'done'>>({});

	// Sort handler
	function toggleSort(columnId: string) {
		if (sortColumn === columnId) {
			if (sortDirection === 'asc') {
				sortDirection = 'desc';
			} else if (sortDirection === 'desc') {
				sortColumn = null;
				sortDirection = null;
			}
		} else {
			sortColumn = columnId;
			sortDirection = 'asc';
		}
		currentPage = 1;
	}

	// Sorted data
	let sortedData = $derived.by(() => {
		if (!sortColumn || !sortDirection) return data;
		const col = columns.find((c) => c.id === sortColumn);
		if (!col?.accessor) return data;
		const accessor = col.accessor;
		return [...data].sort((a, b) => {
			const aVal = a[accessor];
			const bVal = b[accessor];
			if (aVal == null && bVal == null) return 0;
			if (aVal == null) return 1;
			if (bVal == null) return -1;
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
			}
			const aStr = String(aVal);
			const bStr = String(bVal);
			return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
		});
	});

	// Paginated data
	let totalPages = $derived(Math.max(1, Math.ceil(sortedData.length / perPage)));
	let paginatedData = $derived(
		sortedData.slice((currentPage - 1) * perPage, currentPage * perPage)
	);

	// Reset page when data changes
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		data.length;
		currentPage = 1;
	});

	// Check if data has mobile card fields
	let isVideoData = $derived(
		data.length > 0 && ('username' in data[0] || 'creatorName' in data[0])
	);

	function getCellValue(row: Record<string, unknown>, accessor?: string): unknown {
		if (!accessor) return undefined;
		return row[accessor];
	}

	function formatDate(value: unknown): string {
		if (!value) return '-';
		const date = new Date(value as string);
		return date.toLocaleDateString();
	}

	function getWordCount(row: Record<string, unknown>): string {
		const script = row['script'] as string;
		if (!script) return '0';
		const count = script
			.trim()
			.split(/\s+/)
			.filter(Boolean).length;
		return count.toLocaleString();
	}

	function getActionKey(row: Record<string, unknown>, actionType: string): string {
		const id = (row['id'] as string) ?? '';
		return `${id}-${actionType}`;
	}

	function handleAction(actionType: string, row: Record<string, unknown>) {
		if (!onAction) return;
		const key = getActionKey(row, actionType);
		if (actionStates[key] === 'loading') return;

		if (actionType === 'repurpose' && actionStates[key] !== 'done') {
			actionStates[key] = 'loading';
		}
		onAction(actionType, row);
	}

	export function setActionState(
		rowId: string,
		actionType: string,
		state: 'loading' | 'done' | null
	) {
		const key = `${rowId}-${actionType}`;
		if (state === null) {
			delete actionStates[key];
		} else {
			actionStates[key] = state;
		}
	}
</script>

<div class="w-full">
	<!-- Mobile Card View -->
	<div class="space-y-3 md:hidden">
		{#if isLoading}
			{#each Array.from({ length: skeletonRows }, (_, i) => i) as index (index)}
				<div
					class="animate-pulse rounded-xl border border-white/10 bg-white/[0.02] p-4"
					style:animation-delay="{index * 50}ms"
				>
					<div class="mb-3 flex items-center justify-between gap-3">
						<div class="flex items-center gap-2">
							<Skeleton class="h-8 w-8 rounded-full" />
							<Skeleton class="h-4 w-24" />
						</div>
						<Skeleton class="h-5 w-12 rounded-full" />
					</div>
					<Skeleton class="mb-2 h-4 w-full" />
					<Skeleton class="mb-3 h-4 w-3/4" />
					<div class="mb-3 flex items-center gap-4">
						<Skeleton class="h-3 w-16" />
						<Skeleton class="h-3 w-14" />
						<Skeleton class="h-3 w-14" />
					</div>
					<div class="flex items-center justify-between">
						<Skeleton class="h-8 w-16" />
						<Skeleton class="h-8 w-20" />
					</div>
				</div>
			{/each}
		{:else if isVideoData && paginatedData.length > 0}
			{#each paginatedData as item, index (item['id'] ?? index)}
				{@const engScore = (item['engagementScore'] as number) ?? 0}
				{@const scoreColor = getScoreColor(engScore)}
				<div
					class="animate-table-row-in rounded-xl border border-white/10 bg-white/[0.02] p-4 opacity-0"
					style:animation-delay="{index * 50}ms"
					style:animation-fill-mode="forwards"
				>
					<!-- Header: Avatar + Username + Engagement -->
					<div class="mb-3 flex items-center justify-between gap-3">
						<div class="flex min-w-0 items-center gap-2">
							{#if item['thumbnail']}
								<img
									src={item['thumbnail'] as string}
									alt=""
									class="h-8 w-8 shrink-0 rounded-full object-cover"
								/>
							{/if}
							<span class="truncate text-sm font-medium text-white">
								{#if item['username']}
									{(item['username'] as string).startsWith('@')
										? item['username']
										: `@${item['username']}`}
								{:else if item['creatorName']}
									{item['creatorName']}
								{/if}
							</span>
						</div>
						<span
							class={cn(
								'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
								scoreColor
							)}
						>
							{engScore.toFixed(1)}%
						</span>
					</div>

					<!-- Title -->
					<p class="mb-3 line-clamp-2 text-sm text-white/70">{item['title'] ?? ''}</p>

					<!-- Stats Row -->
					<div class="mb-3 flex items-center gap-4 text-xs text-white/50">
						<span class="tabular-nums">
							<span class="text-white/30">Views:</span>
							{formatNumber(item['views'] as number)}
						</span>
						<span class="tabular-nums">
							<span class="text-white/30">Likes:</span>
							{formatNumber(item['likes'] as number)}
						</span>
						<span class="tabular-nums">
							<span class="text-white/30">Comments:</span>
							{formatNumber(item['comments'] as number)}
						</span>
					</div>

					<!-- Action Row -->
					<div class="flex items-center justify-between gap-2">
							<a
							href={item['url'] as string}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex min-h-[36px] items-center gap-1.5 text-sm text-blue-400 transition-colors hover:text-blue-300"
						>
							<ExternalLink class="h-3.5 w-3.5" />
							<span>View</span>
						</a>
						<button
							class="min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-all duration-200 hover:border-white/20 hover:bg-white/10 active:scale-95"
							onclick={() => handleAction('repurpose', item)}
						>
							Repurpose
						</button>
					</div>
				</div>
			{/each}
		{:else}
			<div
				class="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40"
			>
				No results found.
			</div>
		{/if}
	</div>

	<!-- Desktop Table View -->
	<div class="hidden md:block">
		<Table>
			<TableHeader>
				<TableRow>
					{#each columns as col (col.id)}
						{@const isSortable = col.sortable !== false}
						<TableHead
							class={cn(
								isSortable &&
									'cursor-pointer select-none transition-colors hover:text-white/80'
							)}
							onclick={() => isSortable && toggleSort(col.id)}
						>
							<div class="flex items-center gap-2">
								{col.header}
								{#if isSortable}
									<span class="text-white/40">
										{#if sortColumn === col.id && sortDirection === 'asc'}
											<ArrowUp class="h-3 w-3" />
										{:else if sortColumn === col.id && sortDirection === 'desc'}
											<ArrowDown class="h-3 w-3" />
										{:else}
											<ArrowUpDown class="h-3 w-3" />
										{/if}
									</span>
								{/if}
							</div>
						</TableHead>
					{/each}
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if isLoading}
					{#each Array.from({ length: skeletonRows }, (_, i) => i) as rowIndex (rowIndex)}
						<TableRow>
							{#each columns as skCol (skCol.id)}
								{@const colIndex = columns.indexOf(skCol)}
								<TableCell>
									<Skeleton
										class={cn(
											'h-4',
											colIndex === 0 ? 'w-20' : colIndex === 1 ? 'w-40' : 'w-14'
										)}
									/>
								</TableCell>
							{/each}
						</TableRow>
					{/each}
				{:else if paginatedData.length > 0}
					{#each paginatedData as row, index (row['id'] ?? index)}
						<TableRow>
							{#each columns as col (col.id)}
								<TableCell>
									{#if col.cellType === 'thumbnail-username'}
										<div class="flex items-center gap-2">
											{#if row['thumbnail']}
												<img
													src={row['thumbnail'] as string}
													alt=""
													class="h-6 w-6 rounded-full object-cover"
												/>
											{/if}
											<span class="font-medium text-white">
												{#if col.prefixAt}@{/if}{getCellValue(row, col.accessor) ??
													'Unknown'}
											</span>
										</div>
									{:else if col.cellType === 'truncated-text'}
										<div
											class="max-w-[200px] truncate"
											style:max-width={col.maxWidth}
											title={String(getCellValue(row, col.accessor) ?? '')}
										>
											{getCellValue(row, col.accessor) ?? ''}
										</div>
									{:else if col.cellType === 'number'}
										<span class="tabular-nums">
											{#if col.format}
												{col.format(getCellValue(row, col.accessor), row)}
											{:else}
												{getCellValue(row, col.accessor) ?? '-'}
											{/if}
										</span>
									{:else if col.cellType === 'engagement'}
										{@const score = (getCellValue(row, col.accessor) as number) ?? 0}
										<span
											class={cn(
												'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
												getScoreColor(score)
											)}
										>
											{score.toFixed(2)}%
										</span>
									{:else if col.cellType === 'url'}
										<a
											href={getCellValue(row, col.accessor) as string}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-1 text-blue-400 transition-colors hover:text-blue-300"
										>
											<ExternalLink class="h-3 w-3" />
											<span class="text-xs">View</span>
										</a>
									{:else if col.cellType === 'date'}
										<span class="text-white/60">
											{formatDate(getCellValue(row, col.accessor))}
										</span>
									{:else if col.cellType === 'platform'}
										<span class="capitalize text-white/70">
											{getCellValue(row, col.accessor) ?? ''}
										</span>
									{:else if col.cellType === 'word-count'}
										<span class="tabular-nums text-white/60">
											{getWordCount(row)}
										</span>
									{:else if col.cellType === 'action'}
										{@const actionKey = getActionKey(row, col.actionType ?? '')}
										{@const actionState = actionStates[actionKey]}
										{#if col.actionType === 'repurpose'}
											{#if platform !== 'youtube' && platform !== ''}
												<span class="text-xs text-white/30">Not available</span>
											{:else}
												<button
													class={cn(
														'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-default disabled:hover:scale-100',
														actionState === 'done'
															? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
															: 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
													)}
													disabled={actionState === 'loading' ||
														actionState === 'done'}
													onclick={() => handleAction('repurpose', row)}
												>
													{#if actionState === 'loading'}
														<Loader2 class="h-3.5 w-3.5 animate-spin" />
													{:else if actionState === 'done'}
														<span class="flex items-center gap-1">
															<Check class="h-3.5 w-3.5" />
															Saved
														</span>
													{:else}
														Repurpose
													{/if}
												</button>
											{/if}
										{:else if col.actionType === 'extract'}
											{@const hasTranscript = row['hasTranscript'] as boolean}
											{#if row['platform'] !== 'youtube'}
												<span class="text-xs text-white/30">Not available</span>
											{:else}
												<button
													class={cn(
														'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-wait disabled:hover:scale-100',
														hasTranscript || actionState === 'done'
															? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
															: 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
													)}
													disabled={actionState === 'loading'}
													onclick={() => handleAction('extract', row)}
												>
													{#if actionState === 'loading'}
														<Loader2 class="h-3.5 w-3.5 animate-spin" />
													{:else if hasTranscript || actionState === 'done'}
														View
													{:else}
														Extract
													{/if}
												</button>
											{/if}
										{:else if col.actionType === 'delete'}
											<button
												class="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-all duration-200 hover:scale-105 hover:border-red-500/30 hover:bg-red-500/20 active:scale-95"
												onclick={() => handleAction('delete', row)}
											>
												Delete
											</button>
										{:else if col.actionType === 'view-original'}
											<button
												class="rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition-all duration-200 hover:scale-105 hover:border-blue-500/40 hover:bg-blue-500/30 active:scale-95"
												onclick={() => handleAction('view-original', row)}
											>
												View
											</button>
										{:else if col.actionType === 'view-repurposed'}
											{@const hasRepurposed = !!row['repurposedScript']}
											<button
												class={cn(
													'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95',
													hasRepurposed
														? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/30'
														: 'border-purple-500/30 bg-purple-500/20 text-purple-400 hover:border-purple-500/40 hover:bg-purple-500/30'
												)}
												onclick={() => handleAction('view-repurposed', row)}
											>
												{hasRepurposed ? 'View' : 'Repurpose'}
											</button>
										{/if}
									{:else}
										{getCellValue(row, col.accessor) ?? ''}
									{/if}
								</TableCell>
							{/each}
						</TableRow>
					{/each}
				{:else}
					<TableRow>
						<TableCell colspan={columns.length} class="h-24 text-center text-white/40">
							No results found.
						</TableCell>
					</TableRow>
				{/if}
			</TableBody>
		</Table>
	</div>

	<!-- Pagination -->
	{#if !isLoading && sortedData.length > perPage}
		<div class="mt-4 flex justify-center">
			<Pagination count={sortedData.length} {perPage} bind:page={currentPage}>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevButton />
					</PaginationItem>
					<PaginationItem>
						<span class="px-3 text-sm text-white/60">
							Page {currentPage} of {totalPages}
						</span>
					</PaginationItem>
					<PaginationItem>
						<PaginationNextButton />
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	{/if}
</div>
