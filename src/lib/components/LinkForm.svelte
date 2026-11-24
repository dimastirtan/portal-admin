<script lang="ts">
	import { LINK_CATEGORIES } from '$lib/categories';
	import type { LinkLimits, LinkValues } from '$lib/types';
	import CategoryRadios from './CategoryRadios.svelte';
	import FormAlert from './FormAlert.svelte';

	let {
		values,
		errors = {},
		limits,
		submit
	}: {
		values: LinkValues;
		errors?: Record<string, string>;
		limits: LinkLimits;
		submit: string;
	} = $props();
</script>

<form method="POST" class="card max-w-2xl space-y-5 p-6">
	<FormAlert message={errors._form} />
	<CategoryRadios options={LINK_CATEGORIES} value={values.category} error={errors.category} />

	<div>
		<label class="label" for="desc">Deskripsi</label>
		<input
			class="input {errors.desc ? 'input-error' : ''}"
			id="desc"
			name="desc"
			required
			maxlength={limits.desc}
			value={values.desc}
			aria-invalid={errors.desc ? 'true' : undefined}
		/>
		{#if errors.desc}<p class="field-error">{errors.desc}</p>{/if}
		<p class="hint">Teks tautan di portal. Maks. {limits.desc} karakter.</p>
	</div>

	<div>
		<label class="label" for="url">URL</label>
		<input
			class="input font-mono {errors.url ? 'input-error' : ''}"
			id="url"
			name="url"
			inputmode="url"
			autocomplete="off"
			spellcheck="false"
			required
			maxlength={limits.url}
			value={values.url}
			placeholder="https://…"
			aria-invalid={errors.url ? 'true' : undefined}
		/>
		{#if errors.url}<p class="field-error">{errors.url}</p>{/if}
		<p class="hint">
			Diawali http:// atau https:// (tanpa itu otomatis ditambah http://). Maks. {limits.url} karakter.
			{#if limits.url <= 50}
				Kolom URL di database masih 50 karakter — untuk alamat yang lebih panjang kolom perlu
				dilebarkan (README › Database).
			{/if}
		</p>
	</div>

	<div class="flex gap-2 pt-1">
		<button class="btn btn-primary">{submit}</button>
		<a class="btn" href="/link">Batal</a>
	</div>
</form>
