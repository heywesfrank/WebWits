https://web-wits.vercel.app

create table public.comments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  meme_id uuid not null,
  content text not null,
  vote_count integer null default 0,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  mic_cut_until timestamp with time zone null,
  mic_cut_by uuid null,
  squeezed_until timestamp with time zone null,
  squeezed_by uuid null,
  constraint comments_pkey primary key (id),
  constraint comments_meme_id_fkey foreign KEY (meme_id) references memes (id),
  constraint comments_mic_cut_by_fkey foreign KEY (mic_cut_by) references profiles (id),
  constraint comments_squeezed_by_fkey foreign KEY (squeezed_by) references profiles (id),
  constraint comments_user_id_fkey foreign KEY (user_id) references profiles (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create table public.profiles (
  id uuid not null,
  username text null,
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  avatar_url text null,
  email text null,
  country text null,
  influencer boolean null default false,
  monthly_points integer null default 0,
  total_points integer null default 0,
  has_seen_invite_popup boolean null default false,
  credits integer null default 0,
  last_spin_date date null,
  cosmetics jsonb null default '{}'::jsonb,
  daily_rank integer null,
  social_link text null,
  sound_enabled boolean null default true,
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_profiles_monthly_points on public.profiles using btree (monthly_points desc) TABLESPACE pg_default;

create index IF not exists idx_profiles_total_points on public.profiles using btree (total_points desc) TABLESPACE pg_default;

create index IF not exists idx_profiles_monthly_points on public.profiles using btree (monthly_points desc) TABLESPACE pg_default;

create index IF not exists idx_profiles_total_points on public.profiles using btree (total_points desc) TABLESPACE pg_default;

create table public.purchases (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  item_id text not null,
  item_name text not null,
  cost integer not null,
  status text null default 'completed'::text,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint purchases_pkey primary key (id),
  constraint purchases_user_id_fkey foreign KEY (user_id) references profiles (id)
) TABLESPACE pg_default;
