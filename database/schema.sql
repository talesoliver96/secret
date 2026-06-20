create extension if not exists "uuid-ossp";

create table admins (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password text not null,
  created_at timestamp default now()
);

create table customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text unique not null,
  created_at timestamp default now()
);

create table restaurant_tables (
  id uuid primary key default uuid_generate_v4(),
  number int unique not null,
  active boolean default true,
  created_at timestamp default now()
);

create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  active boolean default true,
  created_at timestamp default now()
);

create table products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references categories(id),
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  available boolean default true,
  created_at timestamp default now()
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id),
  table_number int not null,
  status text default 'recebido',
  total numeric(10,2) not null default 0,
  notes text,
  cancel_reason text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,
  quantity int not null,
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  notes text
);

create table settings (
  id uuid primary key default uuid_generate_v4(),
  restaurant_name text default 'The Secret Burger',
  service_fee_percent numeric(5,2) default 0,
  confirmation_message text default 'Pedido recebido. Em breve iniciaremos o preparo.',
  created_at timestamp default now()
);