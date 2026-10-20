INSERT INTO platform.super_admins (id, name, email, username, password_hash, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Lokesh Debnath',
  'lokesh@lokynex.com',
  'superadmin',
  '$2b$12$xHgx2ZLIDHw2YJJRY73c1uQUK/WZ/.gV05iP6IhsbmIYtL.8cf/la',
  'Active',
  now(),
  now()
);