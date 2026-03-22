<script>
	import '../app.css';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<Toaster theme="dark" position="top-right" />
{@render children()}
