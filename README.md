https://web-wits.vercel.app

create table public.comments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  meme_id uuid not null,
  content text not null,
  vote_count integer null default 0,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint comments_pkey primary key (id),
  constraint comments_meme_id_fkey foreign KEY (meme_id) references memes (id),
  constraint comments_user_id_fkey foreign KEY (user_id) references profiles (id)
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
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id)
) TABLESPACE pg_default;

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
