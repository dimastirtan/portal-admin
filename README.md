# Admin Portal DITTEK

Dashboard admin (aplikasi terpisah) untuk mengelola konten **Portal Direktorat Teknologi
dan Pengembangan PT Dirgantara Indonesia** (repo `portal-clean`). Menulis langsung ke
database `dittek` dan folder unggahan portal; portal menampilkan perubahan tanpa build ulang.

- SvelteKit 2 + Svelte 5, `adapter-node`, Tailwind v4 (+ cadangan warna Chrome/Edge 109),
  Drizzle ORM + mysql2.
- **Tanpa JavaScript di browser** (`csr = false`): halaman dirender server, form dikirim biasa.
- Modul: Link ✓ · Telepon ✓ · Headline ✓ · Struktur organisasi · Kalender kerja · Buletin.

## Menjalankan (pengembangan)

```bash
npm ci
cp .env.example .env          # isi DB, ADMIN_USERS, UPLOAD_DIR, PORTAL_URL, token
npm run hash-password         # buat baris ADMIN_USERS (username:hash)
npm run dev                   # http://localhost:5280
```

Pemeriksaan: `npm run check` (svelte-check) dan `npm run lint`.

## Deploy (server portal, mis. `ptdi@n219-web1`)

Dashboard berjalan di server yang **sama** dengan portal: menulis langsung ke folder
unggahan portal dan memanggil `/api/cache` portal lewat `127.0.0.1`.

```
~/portal/            portal (pm2: portal-ditek)
  uploads/           UPLOAD_DIR — dipakai bersama, tidak ikut git, backup terpisah
    headline/  org/  org-thumb/  buletin/  kalender/
~/portal-admin/      dashboard (pm2: portal-admin)
```

### Prasyarat di portal

1. Versi portal yang mendukung dashboard: gambar headline & foto pejabat dari
   `UPLOAD_DIR`, `/media/headline|org|org-thumb`, dan `POST /api/cache`. Tanpa itu,
   data teks tetap tampil (setelah cache ≤ 5 menit), tetapi gambar headline/foto
   pejabat unggahan tidak tampil dan dashboard memberi peringatan cache.
2. `.env` portal berisi path absolut & token (lalu `pm2 restart portal-ditek`):

   ```bash
   UPLOAD_DIR=/home/ptdi/portal/uploads
   CACHE_CLEAR_TOKEN=<string acak panjang — buat dengan perintah di bawah>
   ```

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Backup sebelum dipakai (data langsung tampil di portal)

```bash
mysqldump -h 10.1.95.116 -u root -p --single-transaction dittek \
  tmmainarticle tmmainarticledet tmorg tmorgdet tmlink tmtelp > ~/backup-modul-$(date +%F).sql
tar czf ~/backup-uploads-$(date +%F).tgz -C ~/portal uploads
```

### 1. Buat paket (di laptop)

```bash
npm run deploy:pack                 # server menjalankan `npm ci --omit=dev`
npm run deploy:pack -- --modules    # paket lengkap (node_modules Linux x64) — server tanpa akses npm
```

Hasil di `dist/portal-admin-<tanggal>.tgz` (berisi `build/` + kode sumber; **tanpa**
`.env`, `logs/`, `dev-uploads/` — diperiksa otomatis). Salin ke server, mis.
`scp dist/portal-admin-*.tgz ptdi@n219-web1:~/`.

### 2. Pasang pertama kali (di server)

```bash
mkdir -p ~/portal-admin && tar xzf ~/portal-admin-<tanggal>.tgz -C ~/portal-admin
cd ~/portal-admin
npm ci --omit=dev                   # lewati bila paket "-linux-modules"
cp .env.example .env && nano .env   # lihat tabel di bawah
npm run hash-password               # tempel hasilnya ke ADMIN_USERS
ss -tlnp | grep ':3100 '            # pastikan port kosong (ganti PORT bila terpakai)
pm2 start ecosystem.config.cjs && pm2 save
```

| `.env` dashboard                  | Isi                                                        |
| --------------------------------- | ---------------------------------------------------------- |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `10.1.95.116` / `3306` / `dittek`                          |
| `DB_USER` / `DB_PASSWORD`         | user khusus dashboard (lihat **Database**)                 |
| `ADMIN_USERS`                     | hasil `npm run hash-password`, dipisah koma                |
| `UPLOAD_DIR`                      | **sama persis** dengan portal: `/home/ptdi/portal/uploads` |
| `PORTAL_URL`                      | `http://127.0.0.1:<PORT portal>` (mis. `:80`)              |
| `CACHE_CLEAR_TOKEN`               | **sama persis** dengan portal                              |
| `PORTAL_PUBLIC_URL`               | alamat portal di browser (tautan "Lihat di portal")        |
| `ORIGIN` / `PORT`                 | mis. `http://10.1.95.116:3100` / `3100`                    |
| `BODY_SIZE_LIMIT`                 | `20M`                                                      |

Buka `ORIGIN` di browser → login → **Status sistem** di beranda harus tiga ✓
(database, cache portal, folder unggahan). Bila folder unggahan "belum ada", buat
dengan `mkdir -p /home/ptdi/portal/uploads`.

### Update

```bash
cd ~/portal-admin && rm -rf build && tar xzf ~/portal-admin-<tanggal>.tgz -C ~/portal-admin
npm ci --omit=dev                   # lewati bila paket "-linux-modules"
pm2 restart portal-admin            # admin perlu login ulang (sesi di memori)
```

`.env`, `logs/audit.log`, dan folder unggahan tidak tersentuh oleh update.

### Catatan

- **pm2 wajib satu proses** (`ecosystem.config.cjs`): sesi login disimpan di memori.
- sharp (pengolah gambar) butuh Linux x64 glibc ≥ 2.26 (`ldd --version`).
- Kembali ke kondisi awal: `pm2 stop portal-admin`, pulihkan dump SQL & arsip `uploads`.

## Database

Tabel modul berjenis **MyISAM** (tanpa transaksi & foreign key), charset **latin1**, dan
server memakai `STRICT_TRANS_TABLES` + `NO_ZERO_DATE`:

- Teks disimpan lewat koneksi utf8mb4 → MySQL menyimpannya sebagai cp1252 (“ ” — é muat;
  emoji, ≥, → tidak). Dashboard menolak karakter yang tidak muat sebelum menyimpan.
- Kolom audit `I_ENTRY` (username admin) & `D_ENTRY` (waktu sekarang) selalu diisi.
  `tmlink.I_ENTRY` hanya 10 karakter → username admin maks. 10 huruf kecil/angka.
- Batas panjang kolom dibaca dari `information_schema` saat berjalan.

### User MySQL khusus dashboard

Jangan pakai root atau user portal. `<host>` = host server dashboard sebagaimana terlihat
MySQL (jalankan `SELECT USER();` dari server itu, ambil bagian setelah `@`).

```sql
CREATE USER 'portal_admin'@'<host>' IDENTIFIED BY '<sandi acak panjang>';
GRANT SELECT, INSERT, UPDATE, DELETE ON dittek.tmmainarticle    TO 'portal_admin'@'<host>';
GRANT SELECT, INSERT, UPDATE, DELETE ON dittek.tmmainarticledet TO 'portal_admin'@'<host>';
GRANT SELECT, INSERT, UPDATE, DELETE ON dittek.tmorg            TO 'portal_admin'@'<host>';
GRANT SELECT, INSERT, UPDATE, DELETE ON dittek.tmorgdet         TO 'portal_admin'@'<host>';
GRANT SELECT, INSERT, UPDATE, DELETE ON dittek.tmlink           TO 'portal_admin'@'<host>';
GRANT SELECT, INSERT, UPDATE, DELETE ON dittek.tmtelp           TO 'portal_admin'@'<host>';
GRANT SELECT (C_NIK, I_EMP, C_ORG, C_STATUS) ON dittek.tmemp    TO 'portal_admin'@'<host>';
```

### Kolom `tmlink` hanya 50 karakter

`N_DESC_LINK` & `N_URL_LINK` masih `varchar(50)`; URL yang lebih panjang ditolak. Untuk
melebarkan (jalankan sebagai root, setelah backup; portal tidak terpengaruh):

```sql
ALTER TABLE dittek.tmlink
  MODIFY N_DESC_LINK varchar(200) NOT NULL DEFAULT '',
  MODIFY N_URL_LINK  varchar(255) NOT NULL DEFAULT '';
```

Form menyesuaikan batas baru paling lambat 10 menit kemudian (atau setelah restart).

Backup sebelum uji tulis: lihat **Deploy › Backup**.

## Kontrak dengan portal

- **Cache**: setelah setiap simpan/hapus dashboard memanggil
  `POST <PORTAL_URL>/api/cache` dengan `Authorization: Bearer <CACHE_CLEAR_TOKEN>` (token
  sama di `.env` portal & dashboard). Gagal → simpan tetap berhasil, muncul peringatan
  "perubahan tampil maks. 5 menit lagi".
- **Unggahan**: `UPLOAD_DIR` = folder unggahan portal (`kalender/`, `buletin/`,
  `headline/`, `org/`, `org-thumb/`) — lihat `src/lib/server/uploads.ts` di portal.

## Keamanan

- Admin di `ADMIN_USERS` (hash scrypt, `npm run hash-password`). Sesi di memori proses
  (restart pm2 = login ulang), cookie `httpOnly` + `SameSite=Strict`, berakhir setelah
  8 jam tidak aktif / 12 jam sejak login.
- Login dikunci 15 menit setelah 5 kali gagal per IP+username (20 per IP).
- Semua halaman selain `/login` di belakang login (`src/hooks.server.ts`); CSP ketat,
  form hanya ke dashboard sendiri, cek Origin bawaan SvelteKit.
- Log audit (siapa mengubah apa, nilai sebelum & sesudah) ke `AUDIT_LOG`
  (default `logs/audit.log`) dan console.
- `.env` tidak pernah di-commit.
