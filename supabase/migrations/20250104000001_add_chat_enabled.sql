-- Add chat_enabled column to sessions table
alter table public.sessions
add column chat_enabled boolean default false;

comment on column public.sessions.chat_enabled is 'Indicates if chat is enabled for this session'; 