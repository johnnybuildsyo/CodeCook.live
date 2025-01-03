-- Add Bluesky post references to sessions table
alter table public.sessions
add column bluesky_post_uri text;

comment on column public.sessions.bluesky_post_uri is 'URI of the first post in the Bluesky thread';

-- Create index for faster lookups
create index sessions_bluesky_post_uri_idx on public.sessions(bluesky_post_uri);