-- Create the guest_chat_users table
create table public.guest_chat_users (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid not null references public.sessions(id) on delete cascade,
    name text not null,
    captcha_verified boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_active_at timestamptz not null default now()
);

-- Add indexes for performance
create index guest_chat_users_session_id_idx on public.guest_chat_users(session_id);
create index guest_chat_users_name_idx on public.guest_chat_users(name);

-- Enable RLS
alter table public.guest_chat_users enable row level security;

-- Add policies
create policy "Anyone can view guest chat users"
    on public.guest_chat_users
    for select
    to anon, authenticated
    using (true);

create policy "Service role can create guest chat users"
    on public.guest_chat_users
    for insert
    to service_role
    with check (true);

create policy "Service role can update guest chat users"
    on public.guest_chat_users
    for update
    to service_role
    using (true)
    with check (true);

-- Modify chat_messages table to support guest users
alter table public.chat_messages 
    add column if not exists guest_user_id uuid references public.guest_chat_users(id) on delete set null,
    alter column user_id drop not null;

-- Drop existing trigger if it exists
drop trigger if exists ensure_user_exists on public.chat_messages;

-- Create function to validate message authors
create or replace function public.check_user_exists()
returns trigger as $$
begin
  -- If there's a guest_user_id, verify it exists in guest_chat_users
  if new.guest_user_id is not null then
    if not exists (select 1 from guest_chat_users where id = new.guest_user_id) then
      raise exception 'Guest user not found';
    end if;
    -- For guest messages, user_id should be null
    new.user_id = null;
    return new;
  end if;

  -- For regular messages, verify user_id exists in auth.users
  if new.user_id is null then
    raise exception 'user_id is required when guest_user_id is not provided';
  end if;

  if not exists (select 1 from auth.users where id = new.user_id) then
    raise exception 'User not found';
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to validate message authors
create trigger ensure_user_exists
  before insert on public.chat_messages
  for each row
  execute function public.check_user_exists(); 