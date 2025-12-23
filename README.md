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
