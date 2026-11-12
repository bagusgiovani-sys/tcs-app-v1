-- Read-only inventory. Run in the staging SQL editor and review before migrations.
-- Contains policy/function definitions, not customer rows or credentials.
begin transaction read only;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_schema in ('public', 'storage')
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by table_schema, table_name, grantee, privilege_type;

select grantee, table_name, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by table_name, column_name, grantee;

select n.nspname as schema_name, c.relname, c.relrowsecurity, c.relforcerowsecurity
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage') and c.relkind in ('r', 'p');

select n.nspname as schema_name, p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer, p.proconfig, p.proacl,
  pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f';

select event_object_schema, event_object_table, trigger_name, action_statement
from information_schema.triggers
where event_object_schema in ('public', 'auth');

select id, public, file_size_limit, allowed_mime_types from storage.buckets;
rollback;
