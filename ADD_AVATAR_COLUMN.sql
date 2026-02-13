-- Menambahkan kolom avatar ke tabel users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;

-- (Opsional) Jika ingin menghapus kolom avatar nanti:
-- ALTER TABLE public.users DROP COLUMN avatar;
