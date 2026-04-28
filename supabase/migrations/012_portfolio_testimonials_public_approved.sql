-- Permite que a página inicial leia apenas depoimentos aprovados.
-- Mantém leitura completa restrita a administradores.

drop policy if exists "portfolio_testimonials_select_admin" on public.portfolio_testimonials;
drop policy if exists "portfolio_testimonials_select_public_approved_or_admin" on public.portfolio_testimonials;

create policy "portfolio_testimonials_select_public_approved_or_admin"
  on public.portfolio_testimonials for select
  using (status = 'approved' or public.is_admin());
