<script lang="ts">
	import type { HeadlineLimits, HeadlineValues, ParentOption } from '$lib/types';
	import FormAlert from './FormAlert.svelte';

	let {
		values,
		errors = {},
		limits,
		parents,
		image = null,
		imageFallback = '',
		hadFile = false,
		convertHref = null,
		submit,
		cancel = '/headline'
	}: {
		values: HeadlineValues;
		errors?: Record<string, string>;
		limits: HeadlineLimits;
		parents: ParentOption[];
		/** Gambar unggahan saat ini (halaman ubah). */
		image?: { url: string; size: string; updated: string } | null;
		/** Keterangan gambar yang dipakai portal bila tanpa unggahan. */
		imageFallback?: string;
		/** Form gagal validasi setelah admin memilih berkas → minta pilih ulang. */
		hadFile?: boolean;
		/** Tautan "ubah jadi teks polos" untuk isi HTML lama. */
		convertHref?: string | null;
		submit: string;
		cancel?: string;
	} = $props();
</script>

<form method="POST" enctype="multipart/form-data" class="card max-w-3xl space-y-5 p-6">
	<FormAlert message={errors._form} />
	<input type="hidden" name="format" value={values.format} />

	<div>
		<label class="label" for="title">Judul</label>
		<input
			class="input {errors.title ? 'input-error' : ''}"
			id="title"
			name="title"
			required
			maxlength={limits.title}
			value={values.title}
			aria-invalid={errors.title ? 'true' : undefined}
		/>
		{#if errors.title}<p class="field-error">{errors.title}</p>{/if}
		<p class="hint">Maks. {limits.title} karakter.</p>
	</div>

	<div class="flex flex-wrap gap-5">
		<div>
			<label class="label" for="date">Tanggal</label>
			<input
				class="input w-auto {errors.date ? 'input-error' : ''}"
				id="date"
				name="date"
				type="date"
				required
				value={values.date}
				aria-invalid={errors.date ? 'true' : undefined}
			/>
			{#if errors.date}<p class="field-error">{errors.date}</p>{/if}
			<p class="hint">Headline terbaru tampil paling depan di hero.</p>
		</div>
		<div class="min-w-64 flex-1">
			<label class="label" for="parent">Berita induk</label>
			<select class="input {errors.parent ? 'input-error' : ''}" id="parent" name="parent">
				<option value="baru" selected={values.parent === 'baru'}>
					— Buat otomatis (judul & tanggal sama dengan headline)
				</option>
				{#each parents as p (p.id)}
					<option value={String(p.id)} selected={values.parent === String(p.id)}>
						{p.title} · {p.date || 'tanpa tanggal'} · {p.children} headline
					</option>
				{/each}
			</select>
			{#if errors.parent}<p class="field-error">{errors.parent}</p>{/if}
			<p class="hint">
				Biasanya cukup otomatis. Pilih induk lain hanya untuk mengelompokkan beberapa headline
				(portal menampilkan "Part of: …").
			</p>
		</div>
	</div>

	<div>
		<label class="label" for="text">Isi berita</label>
		{#if values.format === 'html'}
			<p class="border-warn/30 bg-warn-bg text-warn mb-2 rounded-md border px-3 py-2 text-sm">
				Isi ini berformat <strong>HTML</strong> (data portal lama) dan tetap disimpan sebagai HTML.
				{#if convertHref}
					<a class="font-medium underline" href={convertHref}>Ubah jadi teks polos</a> agar mudah diedit
					(format tebal/miring & gambar di dalam isi hilang).
				{/if}
			</p>
		{/if}
		<textarea
			class="input min-h-80 leading-relaxed {values.format === 'html'
				? 'font-mono text-xs'
				: ''} {errors.text ? 'input-error' : ''}"
			id="text"
			name="text"
			required
			rows="18"
			aria-invalid={errors.text ? 'true' : undefined}>{values.text}</textarea
		>
		{#if errors.text}<p class="field-error">{errors.text}</p>{/if}
		{#if values.format === 'text'}
			<p class="hint">
				Teks polos: setiap baris menjadi satu paragraf di portal. Bila baris pertama sama dengan
				judul, portal tidak menampilkannya dua kali. Tidak perlu (dan jangan) menempel HTML.
			</p>
		{/if}
	</div>

	<div>
		<span class="label">Gambar</span>
		{#if image}
			<div class="mb-3 flex flex-wrap items-start gap-4">
				<img
					src={image.url}
					alt="Gambar headline saat ini"
					class="border-line w-full max-w-sm rounded-md border"
				/>
				<div class="text-sm">
					<p class="text-muted">Unggahan saat ini · {image.size} · {image.updated}</p>
					<label class="mt-2 flex items-center gap-2">
						<input type="checkbox" name="hapus_gambar" value="1" class="accent-danger" />
						Hapus gambar ini
					</label>
				</div>
			</div>
		{:else if imageFallback}
			<p class="text-muted mb-2 text-sm">{imageFallback}</p>
		{/if}
		<input
			class="input {errors.gambar ? 'input-error' : ''}"
			type="file"
			name="gambar"
			accept="image/jpeg,image/png,image/webp"
			aria-label={image ? 'Ganti gambar' : 'Unggah gambar'}
		/>
		{#if errors.gambar}<p class="field-error">{errors.gambar}</p>{/if}
		{#if hadFile && !errors.gambar}
			<p class="field-error">
				Pilih ulang gambarnya — berkas tidak ikut terkirim ulang setelah ada isian yang salah.
			</p>
		{/if}
		<p class="hint">
			JPG, PNG, atau WebP, maks. 15 MB. Gunakan gambar <strong>landscape, lebar ≥ 1920 px</strong>:
			di hero beranda gambar dipotong, di halaman detail tampil utuh. Otomatis dikecilkan ke maks.
			1920 px (WebP).
		</p>
	</div>

	<div class="flex gap-2 pt-1">
		<button class="btn btn-primary">{submit}</button>
		<a class="btn" href={cancel}>Batal</a>
	</div>
</form>
