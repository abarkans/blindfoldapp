-- Add location_type to date_ideas to distinguish outside vs home dates.
-- Nullable so existing rows remain valid without backfill.
alter table date_ideas
  add column if not exists location_type text
    check (location_type in ('outside', 'home'));
