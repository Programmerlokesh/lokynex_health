WITH d AS (
    SELECT id, full_name, phone, regexp_replace(phone, '\D', '', 'g') AS dg
    FROM platform.doctors
), n AS (
    SELECT *, CASE
        WHEN length(dg) = 14 AND dg LIKE '0091%' THEN substr(dg, 5)
        WHEN length(dg) = 12 AND dg LIKE '91%'   THEN substr(dg, 3)
        WHEN length(dg) = 11 AND dg LIKE '0%'    THEN substr(dg, 2)
        ELSE dg END AS ph
    FROM d
)
SELECT id, full_name, phone AS old_phone, ph AS new_phone,
       (ph ~ '^[6-9][0-9]{9}$')        AS valid_indian_mobile,
       count(*) OVER (PARTITION BY ph) AS rows_with_same_new_phone
FROM n
ORDER BY valid_indian_mobile, rows_with_same_new_phone DESC, full_name;