<script lang="ts">
	import { RegisterForm } from '$lib/components/auth/index.js';
	import type { PageData } from './$types.js';
	import { page } from '$app/state';

	let { data }: { data: PageData } = $props();

	const actionError = $derived(
		page.form && 'error' in page.form ? (page.form.error as string) : undefined
	);
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
	<RegisterForm {data} error={actionError} />
</div>
