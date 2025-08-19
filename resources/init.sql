-- clear script
do $$
declare
  t text;
begin
  for t in
    select table_name
    from information_schema.tables
    where table_schema = 'public'
  loop
    execute 'drop table if exists ' || t || ' cascade';
  end loop;
end $$;

create type link_type as enum ('short', 'named');

create table USERS(
  user_id serial primary key,
  login text not null unique,
  email text not null,
  password text not null,
  check (
    login <> '' and
    email <> '' and
    password <> ''
  )
);

create table LINKS(
  link_id serial primary key,
  full_link text not null unique,
  type link_type not null,
  short_id text not null,
  expire timestamp,
  name text,
  description text,
  create_date timestamp not null default now(),
  update_date timestamp,
  owner text not null references users(login),
  check (
    full_link <> '' and
    short_id <> '' and
    (name is null or name <> '') and
    (description is null or description <> '') and
    (update_date is null or update_date > create_date) and
    (expire is null or expire > create_date)
  )
);