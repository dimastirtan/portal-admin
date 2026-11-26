<script lang="ts">
	import FormAlert from './FormAlert.svelte';
	import type { BulletinView } from '$lib/types';

	let {
		judul,
		tanggal,
		today,
		errors = {},
		hadFile = false,
		current = null,
		submit
	}: {
		judul: string;
		/** Tanggal terbit 'YYYY-MM-DD'. */
		tanggal: string;
		/** Hari ini (WIB) — batas atas pilihan tanggal. */
		today: string;
		errors?: Record<string, string>;
		hadFile?: boolean;
		/** Buletin yang sedang diubah; null = unggah baru. */
		current?: BulletinView | null;
		submit: string;
	} = $props();
</script>

<form
	method="POST"
	enctype="multipart/form-data"
	class="card grid max-w-3xl gap-6 p-6 sm:grid-cols-[1fr_12rem]"
>
	<div class="space-y-4">
		<FormAlert message={errors._form} />
		<div>
			<label class="label" for="judul">Judul</label>
			<input
				id="judul"
				class="input {errors.judul ? 'input-error' : ''}"
				name="judul"
				value={judul}
				maxlength="100"
				required
				placeholder="mis. Cyber Security Bulletin #140"
				aria-invalid={errors.judul ? 'true' : undefined}
			/>
			{#if errors.judul}<p class="field-error">{errors.judul}</p>{/if}
			<p class="hint">
				Tampil di bawah poster di Information center. Judul sekaligus jadi nama berkas, jadi tanda
				baca yang tidak boleh di nama berkas (/ \ : * ? " &lt; &gt; |) disesuaikan otomatis.
			</p>
		</div>
		<div>
			<label class="label" for="tanggal">Tanggal</label>
			<input
				id="tanggal"
				class="input w-auto {errors.tanggal ? 'input-error' : ''}"
				type="date"
				name="tanggal"
				value={tanggal}
				min="2000-01-01"
				max={today}
				required
				aria-invalid={errors.tanggal ? 'true' : undefined}
			/>
			{#if errors.tanggal}<p class="field-error">{errors.tanggal}</p>{/if}
			<p class="hint">
				Tampil di bawah judul di portal. Urutan di Information center mengikuti tanggal ini — hanya
				3 terbaru yang tampil.
			</p>
		</div>
		<div>
			<label class="label" for="gambar"
				>{current ? 'Ganti gambar (opsional)' : 'Gambar poster'}</label
			>
			<input
				id="gambar"
				class="block w-full text-sm"
				type="file"
				name="gambar"
				accept="image/jpeg,image/png,image/webp"
				required={!current}
			/>
			{#if errors.gambar}<p class="field-error">{errors.gambar}</p>{/if}
			{#if hadFile && !errors.gambar}
				<p class="field-error">
					Pilih ulang gambarnya — berkas tidak ikut terkirim ulang setelah ada isian yang salah.
				</p>
			{/if}
			<p class="hint">
				JPG, PNG, atau WebP, maks. 15 MB. Poster tegak (rasio A4) — disimpan WebP, sisi terpanjang
				maks. 1600 px.
				{#if current}Mengganti gambar tidak mengubah tanggal & posisinya di portal.{/if}
			</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-primary">{submit}</button>
			<a class="btn" href="/buletin">Batal</a>
		</div>
	</div>

	{#if current}
		<figure>
			<a href={current.preview} target="_blank" rel="noopener" title="Buka ukuran penuh">
				<img
					src={current.thumb}
					alt="Poster saat ini"
					class="border-line bg-surface aspect-[1/1.414] w-full rounded border object-contain"
				/>
			</a>
			<figcaption class="text-muted mt-1 text-xs">
				Poster saat ini · {current.size}
			</figcaption>
		</figure>
	{/if}
</form>
