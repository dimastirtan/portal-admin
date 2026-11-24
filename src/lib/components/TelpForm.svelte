<script lang="ts">
	import { TELP_CATEGORIES } from '$lib/categories';
	import type { TelpLimits, TelpValues } from '$lib/types';
	import CategoryRadios from './CategoryRadios.svelte';
	import FormAlert from './FormAlert.svelte';

	let {
		values,
		errors = {},
		limits,
		submit
	}: {
		values: TelpValues;
		errors?: Record<string, string>;
		limits: TelpLimits;
		submit: string;
	} = $props();
</script>

<form method="POST" class="card max-w-2xl space-y-5 p-6">
	<FormAlert message={errors._form} />
	<CategoryRadios
		legend="Kelompok"
		options={TELP_CATEGORIES}
		value={values.category}
		error={errors.category}
	/>

	<div>
		<label class="label" for="title">Nama</label>
		<input
			class="input {errors.title ? 'input-error' : ''}"
			id="title"
			name="title"
			required
			maxlength={limits.title}
			value={values.title}
			placeholder="mis. Helpdesk IT"
			aria-invalid={errors.title ? 'true' : undefined}
		/>
		{#if errors.title}<p class="field-error">{errors.title}</p>{/if}
		<p class="hint">Unit / layanan yang dihubungi. Maks. {limits.title} karakter.</p>
	</div>

	<div>
		<label class="label" for="no">Nomor</label>
		<input
			class="input max-w-xs font-mono {errors.no ? 'input-error' : ''}"
			id="no"
			name="no"
			inputmode="tel"
			autocomplete="off"
			required
			maxlength={limits.no}
			value={values.no}
			placeholder="mis. 4260 atau 022-6034571"
			aria-invalid={errors.no ? 'true' : undefined}
		/>
		{#if errors.no}<p class="field-error">{errors.no}</p>{/if}
		<p class="hint">
			Boleh lebih dari satu nomor atau berketerangan (mis. "4949 / 4204", "147 Pilihan 2"). Maks.
			{limits.no} karakter.
		</p>
	</div>

	<div class="flex gap-2 pt-1">
		<button class="btn btn-primary">{submit}</button>
		<a class="btn" href="/telepon">Batal</a>
	</div>
</form>
