-- Add is_archived column to sessions table
alter table public.sessions
add column is_archived boolean default false;

comment on column public.sessions.is_archived is 'Indicates if the session has been archived';

-- Create index for faster lookups
create index sessions_is_archived_idx on public.sessions(is_archived); 