<script lang="ts">
	let { message }: { message?: string } = $props();
</script>

{#if message}
	<p
		class="border-danger/30 bg-danger-bg text-danger rounded-md border px-3 py-2 text-sm"
		role="alert"
	>
		{message}
	</p>
{/if}
