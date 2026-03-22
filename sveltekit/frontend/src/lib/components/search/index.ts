export { default as PlatformSelector } from './PlatformSelector.svelte';
export { default as SearchInput } from './SearchInput.svelte';
export { default as PreviousSearches } from './PreviousSearches.svelte';
export { default as WelcomeHeader } from './WelcomeHeader.svelte';
export {
	addSearchToHistory,
	setSearchHistoryUserId,
	removeSearchFromHistory,
	searchHistory,
} from './PreviousSearches.svelte';
export type { SearchHistory } from './PreviousSearches.svelte';
