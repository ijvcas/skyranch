-- Remove the old duplicate A-1 lot and its polygon from June 23
DELETE FROM lot_polygons 
WHERE lot_id = '9a7dcc61-3b62-496c-adf7-29af8c1f0e11';

DELETE FROM lots 
WHERE id = '9a7dcc61-3b62-496c-adf7-29af8c1f0e11'
AND created_at = '2025-06-23 12:45:29.73719+00';

-- Remove the old A-2 lot and its polygon from June 23
DELETE FROM lot_polygons 
WHERE lot_id = 'ad9fe721-8cfb-4e04-8493-b31278dfd1f0';

DELETE FROM lots 
WHERE id = 'ad9fe721-8cfb-4e04-8493-b31278dfd1f0'
AND created_at = '2025-06-23 12:31:09.969762+00';