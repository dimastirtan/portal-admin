/**
 * Buat paket deploy dashboard:   npm run deploy:pack            (server menjalankan npm ci)
 *                                npm run deploy:pack -- --modules  (lengkap, tanpa npm di server)
 *
 * Hasil: dist/portal-admin-<YYYYMMDD-HHMM>[-linux-modules].tgz berisi build/ (hasil
 * `npm run build`), kode sumber & konfigurasi. TIDAK PERNAH berisi .env, logs/,
 * dev-uploads/ — diperiksa ulang setelah paket dibuat.
 *
 * --modules: ikut sertakan node_modules produksi untuk Linux x64 (glibc), termasuk
 * biner sharp/libvips Linux — untuk server yang tidak bisa mengakses registry npm.
 * (npm tidak bisa memilih platform lain lewat --os/--cpu untuk paket yang sudah
 * terkunci di lockfile, jadi biner Linux dipasang eksplisit dengan versi lockfile.)
 */
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

process.chdir(path.resolve(import.meta.dirname, '..'));
const withModules = process.argv.includes('--modules');

/** Isi paket (path relatif — tar GNU di Git Bash salah membaca "C:\..." sebagai host). */
const FILES = [
	'build',
	'src',
	'static',
	'scripts',
	'package.json',
	'package-lock.json',
	'.npmrc',
	'.env.example',
	'ecosystem.config.cjs',
	'README.md',
	'svelte.config.js',
	'vite.config.ts',
	'tsconfig.json'
];
/** .env apa pun (kecuali .env.example), log audit, unggahan uji, cache build. */
const FORBIDDEN = /(^|\/)(\.env(?!\.example$)(\..*)?|logs|dev-uploads|\.svelte-kit)(\/|$)/;

/** @param {string} cmd @param {import('node:child_process').ExecSyncOptions} [opts] */
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });

console.log('\n› npm run build');
run('npm run build');
if (!fs.existsSync('build/index.js')) throw new Error('build/index.js tidak ada — build gagal?');

const now = new Date();
const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
fs.mkdirSync('dist', { recursive: true });
const out = `dist/portal-admin-${stamp}${withModules ? '-linux-modules' : ''}.tgz`;

const stage = 'dist/stage';
if (withModules) {
	console.log('\n› node_modules produksi untuk Linux x64');
	fs.rmSync(stage, { recursive: true, force: true });
	fs.mkdirSync(stage, { recursive: true });
	for (const f of ['package.json', 'package-lock.json', '.npmrc']) {
		fs.copyFileSync(f, path.join(stage, f));
	}
	const quiet = '--ignore-scripts --no-audit --no-fund --omit=dev';
	run(`npm ci ${quiet}`, { cwd: stage });
	const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8')).packages;
	const linux = Object.keys(lock)
		.filter((k) => /^node_modules\/@img\/sharp-(libvips-)?linux-x64$/.test(k))
		.map((k) => `${k.slice('node_modules/'.length)}@${lock[k].version}`);
	if (linux.length !== 2)
		throw new Error(`Biner sharp Linux tidak ditemukan di lockfile: ${linux}`);
	run(`npm install --no-save --force ${quiet} ${linux.join(' ')}`, { cwd: stage });
	// Biner Windows/macOS & shim .bin tidak berguna di server.
	const img = path.join(stage, 'node_modules/@img');
	for (const d of fs.readdirSync(img)) {
		if (/win32|darwin|wasm/.test(d)) fs.rmSync(path.join(img, d), { recursive: true, force: true });
	}
	fs.rmSync(path.join(stage, 'node_modules/.bin'), { recursive: true, force: true });
}

console.log(`\n› ${out}`);
const args = ['-czf', out, ...FILES.filter((f) => fs.existsSync(f))];
if (withModules) args.push('-C', stage, 'node_modules');
execFileSync('tar', args, { stdio: 'inherit' });
if (withModules) fs.rmSync(stage, { recursive: true, force: true });

// Pastikan tidak ada kredensial/berkas lokal yang ikut.
const listing = execFileSync('tar', ['-tzf', out], {
	encoding: 'utf8',
	maxBuffer: 64 * 1024 * 1024
})
	.split('\n')
	.filter(Boolean);
const leaked = listing.filter((p) => FORBIDDEN.test(p.replace(/\\/g, '/')));
if (leaked.length) {
	fs.rmSync(out, { force: true });
	throw new Error(`Paket dibatalkan — berisi berkas terlarang: ${leaked.slice(0, 5).join(', ')}`);
}

const mb = (fs.statSync(out).size / 1024 / 1024).toFixed(1);
console.log(`\n✔ ${out} (${mb} MB, ${listing.length} entri, tanpa .env/logs/dev-uploads)`);
console.log(
	withModules
		? '  Di server: ekstrak → isi .env → pm2 start ecosystem.config.cjs (tanpa npm).'
		: '  Di server: ekstrak → npm ci --omit=dev → isi .env → pm2 start ecosystem.config.cjs.'
);
console.log('  Lihat README › Deploy.\n');
