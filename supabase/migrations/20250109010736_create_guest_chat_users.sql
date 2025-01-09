-- migrate:up

-- Create the guest_chat_users table
create table if not exists "public"."guest_chat_users" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "session_id" uuid not null references "public"."sessions"("id") on delete cascade,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "last_active_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "captcha_verified" boolean not null default false,
    primary key ("id")
);

-- Enable RLS
alter table "public"."guest_chat_users" enable row level security;

-- Create policies
create policy "Enable read access for all users"
on "public"."guest_chat_users"
for select
to public
using (true);

create policy "Enable insert for all users"
on "public"."guest_chat_users"
for insert
to public
with check (true);

-- Add guest_user_id to chat_messages
alter table "public"."chat_messages" 
add column if not exists "guest_user_id" uuid references "public"."guest_chat_users"("id") on delete cascade;

-- Create indexes
create index if not exists guest_chat_users_session_id_idx on guest_chat_users(session_id);
create unique index if not exists guest_chat_users_session_name_idx on guest_chat_users(session_id, lower(name));

-- Add to realtime publication
alter publication supabase_realtime add table guest_chat_users;
