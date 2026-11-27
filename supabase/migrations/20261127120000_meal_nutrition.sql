-- PROJ-12 Nährwertübersicht: approximate nutrition values per portion on the shared meal content.
-- Design: features/PROJ-12-naehrwertuebersicht/design.md → Datenmodell.
-- No personal data. Rights and Row Level Security of `meals` stay unchanged: signed-in people read
-- offered meals (the table-level select grant covers the new columns), nobody writes through the
-- API (AC-11). The team maintains the values through migrations.

alter table public.meals
  add column energy_kcal integer
    constraint meals_energy_kcal_check check (energy_kcal between 0 and 2000),
  add column protein_g integer
    constraint meals_protein_g_check check (protein_g between 0 and 200),
  add column carbs_g integer
    constraint meals_carbs_g_check check (carbs_g between 0 and 200),
  add column fat_g integer
    constraint meals_fat_g_check check (fat_g between 0 and 200),
  -- All four or none — never only some (AC-8).
  add constraint meals_nutrition_complete_check check (
    (energy_kcal is null and protein_g is null and carbs_g is null and fat_g is null)
    or (energy_kcal is not null and protein_g is not null and carbs_g is not null and fat_g is not null)
  );

comment on column public.meals.energy_kcal is 'PROJ-12: approximate energy per portion in kcal; null together with the other three.';
comment on column public.meals.protein_g is 'PROJ-12: approximate protein per portion in g.';
comment on column public.meals.carbs_g is 'PROJ-12: approximate carbohydrates per portion in g.';
comment on column public.meals.fat_g is 'PROJ-12: approximate fat per portion in g.';

-- Sample values for the 17 sample meals (AC-10): rough estimates from the listed ingredient amounts,
-- rounded. They fall under each meal's review status ("Beispielinhalt", AC-9) and are reviewed by
-- nutrition experts before any publication.
update public.meals as m
set energy_kcal = v.energy_kcal, protein_g = v.protein_g, carbs_g = v.carbs_g, fat_g = v.fat_g, updated_at = now()
from (values
  ('haferflocken_obst', 380, 9, 72, 6),
  ('hummus_brot', 315, 12, 47, 7),
  ('kichererbsen_salat', 455, 20, 52, 16),
  ('joghurt_apfel_nuesse', 370, 10, 38, 20),
  ('thunfisch_brot', 385, 39, 43, 3),
  ('ruehrei_brot', 295, 17, 20, 15),
  ('couscous_erbsen', 355, 10, 50, 11),
  ('tofu_gemuese_pfanne', 320, 20, 12, 20),
  ('bohnen_toast', 470, 24, 78, 3),
  ('kaesetoast', 320, 16, 32, 14),
  ('haehnchen_wrap', 315, 29, 32, 7),
  ('nudeln_tomatensosse', 455, 15, 80, 7),
  ('reis_kichererbsen_spinat', 475, 14, 70, 13),
  ('rote_linsen_suppe', 245, 16, 36, 1),
  ('kartoffeln_quark', 380, 16, 54, 10),
  ('lachs_reis_brokkoli', 565, 33, 52, 23),
  ('reispfanne_haehnchen', 465, 30, 55, 12)
) as v (id, energy_kcal, protein_g, carbs_g, fat_g)
where m.id = v.id;
