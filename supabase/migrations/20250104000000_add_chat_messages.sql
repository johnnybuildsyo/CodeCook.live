-- Create chat_messages table
create table public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.sessions(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    content text not null,
    is_system boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.chat_messages enable row level security;

-- Allow users to view messages in sessions they have access to
create policy "Users can view messages in accessible sessions"
    on public.chat_messages for select
    using (
        exists (
            select 1 from public.sessions s
            where s.id = chat_messages.session_id
            and (
                -- Session author can view
                s.user_id = auth.uid()
                -- TODO: Add more conditions here when we implement session sharing/collaboration
            )
        )
    );

-- Allow users to insert their own messages
create policy "Users can insert their own messages"
    on public.chat_messages for insert
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.sessions s
            where s.id = chat_messages.session_id
            and s.is_live = true
            and (
                -- Session author can insert
                s.user_id = auth.uid()
                -- TODO: Add more conditions here when we implement session sharing/collaboration
            )
        )
    );

-- Allow users to update their own messages
create policy "Users can update their own messages"
    on public.chat_messages for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Allow users to delete their own messages
create policy "Users can delete their own messages"
    on public.chat_messages for delete
    using (auth.uid() = user_id);

-- Create indexes
create index chat_messages_session_id_idx on public.chat_messages(session_id);
create index chat_messages_user_id_idx on public.chat_messages(user_id);
create index chat_messages_created_at_idx on public.chat_messages(created_at);

-- Add comment
comment on table public.chat_messages is 'Chat messages for live coding sessions';