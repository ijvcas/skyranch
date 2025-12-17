-- Sync app_users.role with user_roles.role for all users
UPDATE app_users 
SET role = ur.role::text 
FROM user_roles ur 
WHERE app_users.id = ur.user_id 
AND app_users.role != ur.role::text;