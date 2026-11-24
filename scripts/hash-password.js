/**
 * Buat baris ADMIN_USERS untuk .env:  npm run hash-password
 * Kata sandi diketik tersembunyi (tidak tampil & tidak masuk riwayat shell).
 */
import { hashPassword } from '../src/lib/server/password.js';

/**
 * Baca satu baris dari terminal; `hidden` = jangan tampilkan ketikan.
 * @param {string} prompt
 * @param {boolean} hidden
 * @returns {Promise<string>}
 */
function ask(prompt, hidden) {
	return new Promise((resolve) => {
		const stdin = process.stdin;
		process.stdout.write(prompt);
		if (!stdin.isTTY) {
			let buf = '';
			stdin.setEncoding('utf8');
			stdin.on('data', (d) => (buf += d));
			stdin.on('end', () => resolve(buf.split(/\r?\n/)[0] ?? ''));
			return;
		}
		let value = '';
		stdin.setRawMode(true);
		stdin.resume();
		stdin.setEncoding('utf8');
		/** @param {string} chunk */
		const onData = (chunk) => {
			for (const ch of chunk) {
				if (ch === '\r' || ch === '\n') {
					stdin.setRawMode(false);
					stdin.pause();
					stdin.off('data', onData);
					process.stdout.write('\n');
					resolve(value);
					return;
				}
				if (ch === '\u0003') {
					process.stdout.write('\n');
					process.exit(130);
				}
				if (ch === '\u0008' || ch === '\u007f') {
					if (value.length) {
						value = value.slice(0, -1);
						if (!hidden) process.stdout.write('\b \b');
					}
					continue;
				}
				value += ch;
				if (!hidden) process.stdout.write(ch);
			}
		};
		stdin.on('data', onData);
	});
}

const username = (await ask('Username (1–10 huruf kecil/angka): ', false)).trim().toLowerCase();
if (!/^[a-z0-9]{1,10}$/.test(username)) {
	console.error('Username harus 1–10 huruf kecil/angka (kolom I_ENTRY tmlink hanya 10 karakter).');
	process.exit(1);
}
const password = await ask('Kata sandi (min. 12 karakter): ', true);
if (password.length < 12) {
	console.error('Kata sandi minimal 12 karakter.');
	process.exit(1);
}
const again = await ask('Ulangi kata sandi: ', true);
if (again !== password) {
	console.error('Kata sandi tidak sama.');
	process.exit(1);
}

const entry = `${username}:${await hashPassword(password)}`;
console.log(
	'\nTambahkan ke ADMIN_USERS di .env (pisahkan dengan koma bila lebih dari satu admin):\n'
);
console.log(entry);
