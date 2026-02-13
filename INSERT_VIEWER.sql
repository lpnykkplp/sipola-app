-- Menambahkan akun Viewer ke tabel users
-- Username: viewer
-- Password: viewer123
INSERT INTO public.users (username, password, name, role)
VALUES ('viewer', 'viewer123', 'Tamu / Viewer', 'Viewer')
ON CONFLICT (username) DO NOTHING;
