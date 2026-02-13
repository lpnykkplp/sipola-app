# Panduan Setup Supabase untuk SiPola

Ikuti langkah-langkah ini untuk menghubungkan aplikasi SiPola Anda ke database cloud Supabase.

## 1. Buat Proyek Supabase
1. Buka [Supabase.com](https://supabase.com/) dan **Sign In**.
2. Klik **New Project**.
3. Pilih organisasi (jika ada) dan isi detail:
   - **Name**: `SiPola`
   - **Database Password**: Buat password yang kuat (simpan ini).
   - **Region**: Pilih yang terdekat (misal: Singapore).
4. Klik **Create new project**. Tunggu beberapa menit hingga database siap.

## 2. Copy Script Database
1. Di dashboard Supabase, lihat menu di kiri, klik **SQL Editor** (icon: `[ SQL ]` atau terminal).
2. Klik **New Query**.
3. Buka file `supabase_schema.sql` yang ada di folder proyek Anda (saya sudah buatkan). Copy seluruh isinya.
4. Paste ke dalam SQL Editor di Supabase.
5. Klik tombol **Run** (di kanan bawah editor).
   - Pastikan muncul pesan "Success". Ini akan membuat semua tabel (`users`, `qr_points`, `apel_logs`, dll) dan mengisi data awal.

## 3. Dapatkan API Keys
1. Di dashboard Supabase, klik **Project Settings** (icon gerigi di kiri bawah).
2. Klik menu **API**.
3. Anda akan melihat `Project URL` dan `Project API keys`.
   - **Project URL**: (contoh: `https://xyz.supabase.co`)
   - **Anon / Public Key**: (kunci panjang)

## 4. Konfigurasi Aplikasi
1. Di folder proyek SiPola, buat file baru bernama `.env`.
2. Isi file `.env` dengan format berikut (ganti dengan URL dan Key milik Anda):

```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. Jalankan Aplikasi
1. Kembali ke terminal VS Code.
2. Matikan server jika sedang berjalan (`Ctrl + C`).
3. Jalankan ulang:
   ```bash
   npm run dev
   ```
4. Buka aplikasi di browser.

## Login
Karena data user sekarang diambil dari database Supabase, Anda bisa login dengan akun default yang sudah saya masukkan di script SQL:
- **Username**: `Rupam I`
- **Password**: `123456`
- (Atau akun lain: `Administrator`, `Rupam II`, dll sesuai data.js lama).

Selamat! Aplikasi SiPola Anda sekarang terhubung ke Cloud Database. 🚀
