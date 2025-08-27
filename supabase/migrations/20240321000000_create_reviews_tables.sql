-- Create reviews table
create table if not exists public.reviews (
    id uuid default gen_random_uuid() primary key,
    order_id text not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    feedback text,
    customer_name text not null,
    customer_email text not null,
    needs_follow_up boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    
    -- Add foreign key constraint to bookings
    constraint fk_order 
        foreign key (order_id) 
        references public.bookings(id) 
        on delete cascade
);

-- Create follow_ups table
create table if not exists public.follow_ups (
    id uuid default gen_random_uuid() primary key,
    review_id uuid not null,
    order_id text not null,
    customer_name text not null,
    customer_email text not null,
    status text not null check (status in ('pending', 'in_progress', 'completed')),
    created_at timestamp with time zone default timezone('utc'::text, now()),
    completed_at timestamp with time zone,
    notes text,
    
    -- Add foreign key constraints
    constraint fk_review 
        foreign key (review_id) 
        references public.reviews(id) 
        on delete cascade,
    constraint fk_order 
        foreign key (order_id) 
        references public.bookings(id) 
        on delete cascade
);

-- Create indexes for faster searches
create index if not exists reviews_order_id_idx on public.reviews(order_id);
create index if not exists reviews_rating_idx on public.reviews(rating);
create index if not exists follow_ups_status_idx on public.follow_ups(status);

-- Enable Row Level Security (RLS)
alter table public.reviews enable row level security;
alter table public.follow_ups enable row level security;

-- Create RLS policies for reviews
create policy "Reviews are viewable by everyone"
    on public.reviews
    for select
    using (true);

create policy "Reviews can be created by authenticated users"
    on public.reviews
    for insert
    with check (auth.role() = 'authenticated');

-- Create RLS policies for follow_ups
create policy "Follow-ups are viewable by admin"
    on public.follow_ups
    for select
    using (auth.role() = 'authenticated');

create policy "Follow-ups can be created by admin"
    on public.follow_ups
    for insert
    with check (auth.role() = 'authenticated');

create policy "Follow-ups can be updated by admin"
    on public.follow_ups
    for update
    using (auth.role() = 'authenticated'); 