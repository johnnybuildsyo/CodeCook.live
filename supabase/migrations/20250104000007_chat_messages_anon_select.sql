-- Allow anonymous users to select from chat_messages
create policy "Allow anonymous users to select chat messages"
on chat_messages for select
to anon
using (true);

-- Update existing policy to be more specific for authenticated users
drop policy if exists "Users can select chat messages" on chat_messages;
create policy "Users can select chat messages"
on chat_messages for select
to authenticated
using (true); 