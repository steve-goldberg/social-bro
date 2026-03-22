<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title class="text-2xl">Something went wrong</Card.Title>
			<Card.Description>
				{page.status === 404 ? 'The page you are looking for does not exist.' : page.error?.message || 'An unexpected error occurred.'}
			</Card.Description>
		</Card.Header>
		<Card.Footer>
			<Button onclick={() => window.location.href = '/'}>Go Home</Button>
		</Card.Footer>
	</Card.Root>
</div>
