<script lang="ts">
	let { data, form } = $props();
</script>

<svelte:head><title>Masuk — Admin Portal DITTEK</title></svelte:head>

<div class="mx-auto mt-16 max-w-sm">
	<div class="mb-6 text-center">
		<div
			class="bg-brand mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold text-white"
		>
			DT
		</div>
		<h1 class="text-xl font-semibold">Admin Portal DITTEK</h1>
		<p class="text-muted mt-1 text-sm">Masuk untuk mengelola konten portal.</p>
	</div>

	<form method="POST" class="card space-y-4 p-6">
		{#if !data.configured}
			<p class="border-warn/30 bg-warn-bg text-warn rounded-md border px-3 py-2 text-sm">
				Belum ada akun admin. Isi <code>ADMIN_USERS</code> di <code>.env</code> (lihat
				<code>npm run hash-password</code>), lalu restart.
			</p>
		{/if}
		{#if form?.error}
			<p
				class="border-danger/30 bg-danger-bg text-danger rounded-md border px-3 py-2 text-sm"
				role="alert"
			>
				{form.error}
			</p>
		{/if}
		<div>
			<label class="label" for="username">Username</label>
			<input
				class="input"
				id="username"
				name="username"
				autocomplete="username"
				autocapitalize="none"
				spellcheck="false"
				required
				maxlength="10"
				value={form?.username ?? ''}
			/>
		</div>
		<div>
			<label class="label" for="password">Kata sandi</label>
			<input
				class="input"
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
			/>
		</div>
		<button class="btn btn-primary w-full py-2">Masuk</button>
	</form>
</div>
