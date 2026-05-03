-- TipDirect database schema
-- Plak dit in de Supabase SQL editor: supabase.com/dashboard > SQL Editor

-- Obers tabel
create table obers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  naam text not null,
  gebruikersnaam text unique not null,
  foto_url text,
  iban text,
  iban_naam text,
  actief boolean default true,
  aangemaakt_op timestamptz default now()
);

-- Betalingen tabel
create table betalingen (
  id uuid default gen_random_uuid() primary key,
  ober_id uuid references obers(id) not null,
  mollie_id text unique not null,
  bedrag integer not null,        -- in centen (bijv. 500 = €5,00)
  fee integer not null default 50, -- in centen (€0,50)
  status text not null default 'open', -- open | betaald | mislukt | teruggestort
  beschrijving text,
  aangemaakt_op timestamptz default now(),
  betaald_op timestamptz
);

-- Uitbetalingen tabel
create table uitbetalingen (
  id uuid default gen_random_uuid() primary key,
  ober_id uuid references obers(id) not null,
  bedrag integer not null,        -- in centen
  status text not null default 'in_behandeling', -- in_behandeling | uitbetaald
  aangemaakt_op timestamptz default now(),
  uitbetaald_op timestamptz
);

-- Row Level Security inschakelen
alter table obers enable row level security;
alter table betalingen enable row level security;
alter table uitbetalingen enable row level security;

-- Policies: obers mogen alleen hun eigen data zien
create policy "Ober ziet eigen profiel"
  on obers for select
  using (auth.uid() = id);

create policy "Ober update eigen profiel"
  on obers for update
  using (auth.uid() = id);

create policy "Ober ziet eigen betalingen"
  on betalingen for select
  using (auth.uid() = ober_id);

create policy "Ober ziet eigen uitbetalingen"
  on uitbetalingen for select
  using (auth.uid() = ober_id);

-- Publieke leestoegang voor de betaalpagina (alleen naam en foto)
create policy "Publiek kan ober profiel zien"
  on obers for select
  using (actief = true);

-- Service role heeft volledige toegang (voor webhooks en payouts)
create policy "Service role volledig toegang betalingen"
  on betalingen for all
  using (auth.role() = 'service_role');

create policy "Service role volledig toegang uitbetalingen"
  on uitbetalingen for all
  using (auth.role() = 'service_role');

-- Handige views
create view ober_statistieken as
  select
    o.id,
    o.naam,
    o.gebruikersnaam,
    count(b.id) filter (where b.status = 'betaald') as totaal_tips,
    coalesce(sum(b.bedrag - b.fee) filter (where b.status = 'betaald'), 0) as totaal_ontvangen,
    coalesce(sum(b.bedrag - b.fee) filter (where b.status = 'betaald' and u.id is null), 0) as nog_uit_te_betalen
  from obers o
  left join betalingen b on b.ober_id = o.id
  left join uitbetalingen u on u.ober_id = o.id
  group by o.id, o.naam, o.gebruikersnaam;
