-- Add is_live column to sessions table
alter table public.sessions
add column is_live boolean default false;

comment on column public.sessions.is_live is 'Indicates if the session owner is currently editing the session';

-- Create index for faster lookups
create index sessions_is_live_idx on public.sessions(is_live); 