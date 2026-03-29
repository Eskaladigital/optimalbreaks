-- =============================================
-- HÍBRIDA FEST — fechas oficiales I y II edicion
-- https://www.hibridafest.com/edicion-16-marzo-2024/
-- https://www.hibridafest.com/ii-edicion-20-julio-2024/
-- Corrige slug/anno erroneo hibrida-fest-2025-ii-edicion → 2024-ii
-- =============================================

UPDATE public.organizations
SET
  description_en = 'Cultural movement focused on breakbeat and forward electronic music for a young audience. It debuted in Cordoba on 16 March 2024 (I edition), followed by 20 July 2024 (II); the third edition is scheduled for 11 April 2026 within Crazy World Festival, with two stages — retro breakbeat and current sounds — and long-format programming (12h+).',
  description_es = 'Movimiento cultural de musica electronica de vanguardia y breakbeat pensado para publico joven. Debut en Cordoba el 16 de marzo de 2024 (I edicion), seguida del 20 de julio de 2024 (II); la tercera edicion esta prevista el 11 de abril de 2026 en Crazy World Festival, con dos escenarios (breakbeat retro y actual) y programacion de mas de doce horas.'
WHERE slug = 'hibrida-fest';

UPDATE public.events
SET
  name = 'Híbrida Fest 2024 — I Edición (16 marzo)',
  description_en = 'First edition on 16 March 2024 in Cordoba. Official page documents lineup section, aftermovies (breakbeat / hard techno) and photo gallery.',
  description_es = 'Primera edicion el 16 de marzo de 2024 en Cordoba. La pagina oficial incluye seccion de lineup, aftermovies (breakbeat / hard techno) y galeria de fotos.',
  date_start = DATE '2024-03-16',
  website = 'https://www.hibridafest.com/edicion-16-marzo-2024/'
WHERE slug = 'hibrida-fest-2024-i-edicion';

UPDATE public.events
SET
  slug = 'hibrida-fest-2024-ii-edicion',
  name = 'Híbrida Fest 2024 — II Edición (20 julio)',
  description_en = 'Second edition on 20 July 2024 in Cordoba. Official page includes lineup, aftermovie and photo gallery.',
  description_es = 'Segunda edicion el 20 de julio de 2024 en Cordoba. La pagina oficial incluye lineup, aftermovie y galeria de fotos.',
  date_start = DATE '2024-07-20',
  website = 'https://www.hibridafest.com/ii-edicion-20-julio-2024/'
WHERE slug = 'hibrida-fest-2025-ii-edicion';
