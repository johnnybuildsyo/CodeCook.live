-- Remove any existing constraints
alter table public.chat_messages 
    drop constraint if exists chat_messages_user_id_fkey;

-- Add comment to indicate the relationship
comment on column public.chat_messages.user_id is 'References auth.users.id';

-- Create a function to validate user_id exists in auth.users
create or replace function public.check_user_exists()
returns trigger as $$
begin
  if not exists (select 1 from auth.users where id = new.user_id) then
    raise exception 'User not found';
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to validate user_id on insert
drop trigger if exists ensure_user_exists on public.chat_messages;
create trigger ensure_user_exists
  before insert on public.chat_messages
  for each row
  execute function public.check_user_exists(); 