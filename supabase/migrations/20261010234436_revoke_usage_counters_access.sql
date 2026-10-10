/*
# Revoke all access on usage_counters from anon and authenticated

1. Security changes
- REVOKE ALL privileges (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER)
  on usage_counters FROM anon and authenticated roles.
- This ensures the browser anon key can never directly read or modify the usage counters.
- Only service_role (via the SECURITY DEFINER increment_usage function) can access the table.
*/

REVOKE ALL ON usage_counters FROM anon;
REVOKE ALL ON usage_counters FROM authenticated;
