-- One-time invite codes for joining a team

create table if not exists public.invite_codes (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams(id) on delete cascade,
    code text not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    used_by uuid,
    used_at timestamptz
);

create unique index if not exists invite_codes_code_key on public.invite_codes (code);
create index if not exists invite_codes_team_id_idx on public.invite_codes (team_id);

alter table public.invite_codes enable row level security;

-- staff can create and read codes for their team
create policy "invite_codes_read_staff" on public.invite_codes
for select
using (is_active_team_staff(team_id));

create policy "invite_codes_insert_staff" on public.invite_codes
for insert
with check (is_active_team_staff(team_id));

-- audit log for invite_codes
create trigger audit_log_invite_codes
after insert or update or delete on public.invite_codes
for each row execute function public.audit_log_change();
