<script>
	import '../app.css';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<Toaster
	theme="dark"
	position="bottom-right"
	toastOptions={{
		style:
			'background: rgba(0, 0, 0, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8); font-size: 13px; backdrop-filter: blur(8px);'
	}}
/>
{@render children()}
