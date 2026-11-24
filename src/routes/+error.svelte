<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} — Admin Portal DITTEK</title></svelte:head>

<div class="card mx-auto mt-10 max-w-lg p-6 text-center">
	<p class="text-muted text-4xl font-semibold">{page.status}</p>
	<p class="mt-2">
		{page.status === 404 && page.error?.message === 'Not Found'
			? 'Halaman tidak ditemukan.'
			: (page.error?.message ?? 'Terjadi kesalahan.')}
	</p>
	<a class="btn mt-5" href="/">Kembali ke beranda</a>
</div>
