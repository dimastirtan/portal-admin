<script lang="ts">
	import OrgPhotoBadge from '$lib/components/OrgPhotoBadge.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Organisasi — Admin Portal DITTEK</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<h1 class="text-2xl font-semibold">Struktur organisasi</h1>
	{#if data.portalUrl}
		<a class="link text-sm" href={data.portalUrl} target="_blank" rel="noopener"
			>Lihat di portal ↗</a
		>
	{/if}
	<a class="btn btn-primary ml-auto" href="/organisasi/baru">+ Tambah unit</a>
</div>

<div class="space-y-4">
	{#each data.units as u (u.id)}
		<section class="card">
			<header class="border-line flex flex-wrap items-center gap-3 border-b px-4 py-3">
				<OrgPhotoBadge foto={u.foto} name={u.head || u.title} />
				<div class="min-w-0 flex-1">
					<p class="font-semibold">
						<a class="link" href="/organisasi/{u.id}">{u.title || '(tanpa nama)'}</a>
						{#if u.type === 0}
							<span
								class="bg-brand ml-1 rounded px-1.5 py-0.5 align-middle text-xs font-medium text-white"
								>Pimpinan</span
							>
						{/if}
					</p>
					<p class="text-muted text-sm">
						{#if u.head}{u.head} · {u.nik}{:else if u.headMissing}<span class="text-warn"
								>NIK {u.nik} tidak ada di data pegawai</span
							>{:else}Belum ada pejabat{/if}
						{#if u.foto.kind === 'lama'}<span class="text-xs"> · foto lama</span>{/if}
					</p>
				</div>
				<div class="flex flex-wrap gap-2 text-sm">
					<a class="btn" href="/organisasi/{u.id}">Ubah</a>
					<a class="btn" href="/organisasi/{u.id}/departemen/baru">+ Departemen</a>
				</div>
			</header>
			{#if u.departments.length}
				<ul class="divide-line divide-y text-sm">
					{#each u.departments as d (d.id)}
						<li class="flex flex-wrap items-center gap-3 px-4 py-2 {d.visible ? '' : 'opacity-60'}">
							<OrgPhotoBadge foto={d.foto} name={d.head || d.title} size="h-8 w-8" />
							<div class="min-w-0 flex-1">
								<a class="link font-medium" href="/organisasi/{u.id}/departemen/{d.id}"
									>{d.title || '(tanpa nama)'}</a
								>
								<span class="text-muted block text-xs">
									{#if d.head}{d.head} · {d.nik}{:else if d.headMissing}<span class="text-warn"
											>NIK {d.nik} tidak ada di data pegawai</span
										>{:else}Belum ada pejabat{/if}
									{#if d.foto.kind === 'lama'}
										· foto lama{/if}
									{#if !d.visible}
										· <span class="text-warn">tidak tampil di portal</span>{/if}
								</span>
							</div>
							<a class="link" href="/organisasi/{u.id}/departemen/{d.id}">Ubah</a>
							<a
								class="text-danger hover:underline"
								href="/organisasi/{u.id}/departemen/{d.id}/hapus">Hapus</a
							>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-muted px-4 py-3 text-sm">Belum ada departemen.</p>
			{/if}
		</section>
	{:else}
		<p class="card text-muted p-6 text-center">Belum ada unit.</p>
	{/each}
</div>
