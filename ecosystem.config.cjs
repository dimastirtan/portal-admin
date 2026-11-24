/**
 * Konfigurasi pm2 untuk dashboard admin (production). Semua pengaturan (DB, PORT,
 * ORIGIN, UPLOAD_DIR, token, admin) ada di .env — file ini hanya cara menjalankannya.
 *
 * Pertama kali (dari folder dashboard di server, mis. ~/portal-admin):
 *   npm ci --omit=dev          (lewati bila paket sudah berisi node_modules)
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *
 * Update : ekstrak paket baru → npm ci --omit=dev → pm2 restart portal-admin
 * Ubah .env : pm2 restart portal-admin   (.env dibaca saat proses start)
 * Log       : pm2 logs portal-admin       (log audit: logs/audit.log)
 */
module.exports = {
	apps: [
		{
			name: 'portal-admin',
			cwd: __dirname,
			script: 'build/index.js',
			// Node ≥ 20.6 membaca .env sendiri — sama seperti `npm start`.
			node_args: '--env-file=.env',
			// WAJIB satu proses: sesi login disimpan di memori proses. Mode cluster
			// membuat admin terus "logout" karena tiap request bisa ke proses lain.
			exec_mode: 'fork',
			instances: 1,
			autorestart: true,
			// Pengolahan gambar (sharp) butuh memori sesaat; portal & dashboard satu server.
			max_memory_restart: '400M',
			kill_timeout: 10000,
			time: true,
			env: { NODE_ENV: 'production' }
		}
	]
};
