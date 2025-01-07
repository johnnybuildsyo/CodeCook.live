-- Drop existing policies
drop policy if exists "Users can view messages in accessible sessions" on public.chat_messages;
drop policy if exists "Users can insert their own messages" on public.chat_messages;
drop policy if exists "Users can update their own messages" on public.chat_messages;
drop policy if exists "Users can delete their own messages" on public.chat_messages;

-- Create new policies
create policy "Users can view chat messages"
    on public.chat_messages for select
    using (auth.uid() is not null);

create policy "Users can insert their own messages"
    on public.chat_messages for insert
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.sessions s
            where s.id = chat_messages.session_id
            and s.is_live = true
            and s.chat_enabled = true
            and s.user_id = auth.uid()
        )
    );

create policy "Users can update their own messages"
    on public.chat_messages for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own messages"
    on public.chat_messages for delete
    using (auth.uid() = user_id);

-- Enable realtime
alter table public.chat_messages replica identity full;
alter publication supabase_realtime add table public.chat_messages; 