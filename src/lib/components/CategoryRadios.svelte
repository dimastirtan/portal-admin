<script lang="ts">
	let {
		name = 'category',
		legend = 'Kategori',
		options,
		value,
		error
	}: {
		name?: string;
		legend?: string;
		options: readonly { value: number; label: string; hint: string }[];
		value: number;
		error?: string;
	} = $props();
</script>

<fieldset>
	<legend class="label">{legend}</legend>
	<div class="flex flex-wrap gap-x-5 gap-y-2">
		{#each options as o (o.value)}
			<label class="flex items-start gap-2 text-sm">
				<input
					type="radio"
					{name}
					value={o.value}
					checked={value === o.value}
					class="accent-brand mt-0.5"
				/>
				<span
					><span class="font-medium">{o.label}</span>
					<span class="text-muted">— {o.hint}</span></span
				>
			</label>
		{/each}
	</div>
	{#if error}<p class="field-error">{error}</p>{/if}
</fieldset>
