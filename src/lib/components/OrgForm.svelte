<script lang="ts">
	import { ORG_TYPES } from '$lib/categories';
	import { fitsDeptNik } from '$lib/nik';
	import type { EmployeeOption, OrgPhoto } from '$lib/types';
	import CategoryRadios from './CategoryRadios.svelte';
	import FormAlert from './FormAlert.svelte';

	let {
		kind,
		values,
		errors = {},
		maxTitle,
		employees,
		photo = null,
		units = [],
		hadFile = false,
		submit,
		cancel
	}: {
		kind: 'unit' | 'dept';
		values: { title: string; nik: string; type?: number; orgId?: number };
		errors?: Record<string, string>;
		maxTitle: number;
		employees: EmployeeOption[];
		/** Foto tersimpan (halaman ubah). */
		photo?: OrgPhoto | null;
		/** Pilihan unit untuk memindahkan departemen. */
		units?: { id: number; title: string }[];
		hadFile?: boolean;
		submit: string;
		cancel: string;
	} = $props();

	const label = $derived(kind === 'unit' ? 'Nama unit' : 'Nama departemen');
	/** NIK tersimpan yang tidak ada di tmemp — tetap jadi pilihan supaya tidak hilang diam-diam. */
	const unknownNik = $derived(
		values.nik && !employees.some((e) => e.nik === values.nik) ? values.nik : ''
	);
	/** Pegawai yang NIK-nya tidak muat di kolom angka departemen. */
	const deptBlocked = $derived(
		kind === 'dept' ? employees.filter((e) => !fitsDeptNik(e.nik)).length : 0
	);
</script>

<form method="POST" enctype="multipart/form-data" class="card max-w-2xl space-y-5 p-6">
	<FormAlert message={errors._form} />

	{#if kind === 'unit'}
		<CategoryRadios
			name="type"
			legend="Jenis unit"
			options={ORG_TYPES}
			value={values.type ?? 1}
			error={errors.type}
		/>
	{:else if units.length}
		<div>
			<label class="label" for="orgId">Unit</label>
			<select class="input {errors.orgId ? 'input-error' : ''}" id="orgId" name="orgId">
				{#each units as u (u.id)}
					<option value={String(u.id)} selected={values.orgId === u.id}>{u.title}</option>
				{/each}
			</select>
			{#if errors.orgId}<p class="field-error">{errors.orgId}</p>{/if}
		</div>
	{/if}

	<div>
		<label class="label" for="title">{label}</label>
		<input
			class="input {errors.title ? 'input-error' : ''}"
			id="title"
			name="title"
			required
			maxlength={maxTitle}
			value={values.title}
			placeholder={kind === 'unit' ? 'mis. Pusat Teknologi Dirgantara' : 'mis. Departemen Avionik'}
			aria-invalid={errors.title ? 'true' : undefined}
		/>
		{#if errors.title}<p class="field-error">{errors.title}</p>{/if}
		<p class="hint">Maks. {maxTitle} karakter.</p>
	</div>

	<div>
		<label class="label" for="nik">Pejabat</label>
		<select class="input {errors.nik ? 'input-error' : ''}" id="nik" name="nik">
			<option value="" selected={!values.nik}>— Kosong (belum ada pejabat) —</option>
			{#if unknownNik}
				<option value={unknownNik} selected>NIK {unknownNik} — tidak ada di data pegawai</option>
			{/if}
			{#each employees as e (e.nik)}
				{#if kind === 'dept' && !fitsDeptNik(e.nik)}
					<option value={e.nik} disabled>{e.name} — {e.nik} (hanya untuk unit)</option>
				{:else}
					<option value={e.nik} selected={values.nik === e.nik}>{e.name} — {e.nik}</option>
				{/if}
			{/each}
		</select>
		{#if errors.nik}<p class="field-error">{errors.nik}</p>{/if}
		<p class="hint">
			Nama diambil dari data pegawai ({employees.length} orang). Klik daftar lalu ketik awal nama untuk
			melompat.
			{#if kind === 'dept' && deptBlocked}
				Pegawai ber-NIK huruf atau berawalan 0 ({deptBlocked} orang) tidak bisa dipilih di sini — kolom
				NIK departemen di database berupa angka.
			{/if}
		</p>
	</div>

	<div>
		<span class="label">Foto pejabat</span>
		{#if photo?.kind === 'upload' && photo.preview}
			<div class="mb-3 flex items-center gap-4">
				<img
					src={photo.preview}
					alt="Foto saat ini"
					class="border-line h-20 w-20 rounded-full border object-cover"
				/>
				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" name="hapus_foto" value="1" class="accent-danger" />
					Hapus foto ini
				</label>
			</div>
		{:else if photo?.kind === 'lama'}
			<div class="text-muted mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
				<span>
					Foto lama portal: <code>{photo.file}</code>
					{#if photo.legacyUrl}
						· <a class="link" href={photo.legacyUrl} target="_blank" rel="noopener">lihat ↗</a>
					{/if}
				</span>
				<label class="flex items-center gap-2">
					<input type="checkbox" name="hapus_foto" value="1" class="accent-danger" />
					Kosongkan foto
				</label>
			</div>
		{/if}
		<input
			class="input {errors.foto ? 'input-error' : ''}"
			type="file"
			name="foto"
			accept="image/jpeg,image/png,image/webp"
			aria-label={photo?.kind ? 'Ganti foto' : 'Unggah foto'}
		/>
		{#if errors.foto}<p class="field-error">{errors.foto}</p>{/if}
		{#if hadFile && !errors.foto}
			<p class="field-error">
				Pilih ulang fotonya — berkas tidak ikut terkirim ulang setelah ada isian yang salah.
			</p>
		{/if}
		<p class="hint">
			JPG, PNG, atau WebP, maks. 15 MB. Foto wajah (portrait) — di portal tampil sebagai lingkaran
			kecil. Otomatis dikecilkan (maks. 1200 px) dan dibuatkan thumbnail.
		</p>
	</div>

	<div class="flex gap-2 pt-1">
		<button class="btn btn-primary">{submit}</button>
		<a class="btn" href={cancel}>Batal</a>
	</div>
</form>
