-- Enable RLS and add safe default policies for core tables.
-- Review and adjust to your exact schemas/column types before applying.

-- USERS TABLE ---------------------------------------------------------------
alter table public.users enable row level security;

-- A user can select his own row
create policy users_select_own on public.users
  for select using (id::text = auth.uid()::text);

-- A user can update limited fields on his own row (adjust column list if needed)
create policy users_update_own on public.users
  for update using (id::text = auth.uid()::text);

-- Service-role (bypass RLS) should be used for admin updates/webhooks.

-- CONVERSATIONS TABLE -------------------------------------------------------
alter table public.conversations enable row level security;

-- Only owner can read
create policy conversations_select_own on public.conversations
  for select using (user_id::text = auth.uid()::text);

-- Only owner can insert/update/delete their conversation rows
create policy conversations_modify_own on public.conversations
  for all using (user_id::text = auth.uid()::text) with check (user_id::text = auth.uid()::text);

-- MESSAGES TABLE ------------------------------------------------------------
alter table public.messages enable row level security;

-- Only owner (through conversation ownership) can access messages
-- Assumes messages has column conversation_id referencing conversations.id
create policy messages_select_own on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id::text = auth.uid()::text
    )
  );

create policy messages_modify_own on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id::text = auth.uid()::text
    )
  ) with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id::text = auth.uid()::text
    )
  );

-- USER_MEMORY TABLE ---------------------------------------------------------
alter table public.user_memory enable row level security;

create policy user_memory_select_own on public.user_memory
  for select using (user_id::text = auth.uid()::text);

create policy user_memory_modify_own on public.user_memory
  for all using (user_id::text = auth.uid()::text) with check (user_id::text = auth.uid()::text);

-- USER_PURCHASED_MODELS TABLE ----------------------------------------------
alter table public.user_purchased_models enable row level security;

create policy upm_select_own on public.user_purchased_models
  for select using (user_id::text = auth.uid()::text);

create policy upm_modify_own on public.user_purchased_models
  for all using (user_id::text = auth.uid()::text) with check (user_id::text = auth.uid()::text);

-- USER_DAILY_USAGE TABLE (rate limit counters) ------------------------------
-- Typically maintained by service role; allow select for own counters if needed
alter table public.user_daily_usage enable row level security;

create policy udu_select_own on public.user_daily_usage
  for select using (subject_id::text = auth.uid()::text);

-- No insert/update from client unless you want client-side counters
-- Service role should upsert counts. If needed, uncomment and restrict:
-- create policy udu_modify_own on public.user_daily_usage
--   for all using (subject_id::text = auth.uid()::text) with check (subject_id::text = auth.uid()::text);

-- NOTES ---------------------------------------------------------------------
-- 1) Ensure all auth-required reads/writes from the client use supabase-js with the user's session.
-- 2) Any admin/webhook/cron tasks should use the service-role key from serverless functions only.
-- 3) If your id columns are UUID types, remove the ::text casts accordingly.
-- 4) Run these statements in the Supabase SQL editor. Consider adding IF NOT EXISTS guards if re-running.
