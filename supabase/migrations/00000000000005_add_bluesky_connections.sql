create table if not exists public.bluesky_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  did text not null,
  handle text not null,
  access_jwt text not null,
  refresh_jwt text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
)
-- Enable RLS
alter table public.bluesky_connections enable row level security
-- Create policies
create policy "Users can view their own Bluesky connection"
  on public.bluesky_connections for select
  using (auth.uid() = user_id)
create policy "Users can insert their own Bluesky connection"
  on public.bluesky_connections for insert
  with check (auth.uid() = user_id)
create policy "Users can update their own Bluesky connection"
  on public.bluesky_connections for update
  using (auth.uid() = user_id)
create policy "Users can delete their own Bluesky connection"
  on public.bluesky_connections for delete
  using (auth.uid() = user_id)
-- Create function to update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$
-- Create trigger for updated_at
create trigger handle_bluesky_connections_updated_at
  before update on public.bluesky_connections
  for each row
  execute function public.handle_updated_at()