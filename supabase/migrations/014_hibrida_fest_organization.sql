-- =============================================
-- HÍBRIDA FEST — organización + eventos
-- Web: https://www.hibridafest.com/
-- =============================================

INSERT INTO public.organizations (
  slug,
  name,
  country,
  base_city,
  founded_year,
  description_en,
  description_es,
  website,
  socials,
  roles,
  is_active,
  is_featured
) VALUES (
  'hibrida-fest',
  'Híbrida Fest',
  'Spain',
  'Córdoba',
  2024,
  'Cultural movement focused on breakbeat and forward electronic music for a young audience. It debuted in Cordoba on 16 March 2024 (I edition), followed by 20 July 2024 (II); the third edition is scheduled for 11 April 2026 within Crazy World Festival, with two stages — retro breakbeat and current sounds — and long-format programming (12h+).',
  'Movimiento cultural de musica electronica de vanguardia y breakbeat pensado para publico joven. Debut en Cordoba el 16 de marzo de 2024 (I edicion), seguida del 20 de julio de 2024 (II); la tercera edicion esta prevista el 11 de abril de 2026 en Crazy World Festival, con dos escenarios (breakbeat retro y actual) y programacion de mas de doce horas.',
  'https://www.hibridafest.com/',
  jsonb_build_object(
    'tickets', 'https://www.hibridafest.com/#entradas'
  ),
  ARRAY['promoter']::TEXT[],
  TRUE,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  base_city = EXCLUDED.base_city,
  founded_year = EXCLUDED.founded_year,
  description_en = EXCLUDED.description_en,
  description_es = EXCLUDED.description_es,
  website = EXCLUDED.website,
  socials = EXCLUDED.socials,
  roles = EXCLUDED.roles,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured;

WITH hibrida_org AS (
  SELECT id
  FROM public.organizations
  WHERE slug = 'hibrida-fest'
  LIMIT 1
)
INSERT INTO public.events (
  slug,
  name,
  description_en,
  description_es,
  event_type,
  date_start,
  date_end,
  location,
  city,
  country,
  venue,
  website,
  lineup,
  is_featured,
  promoter_organization_id
)
SELECT
  source.slug,
  source.name,
  source.description_en,
  source.description_es,
  source.event_type,
  source.date_start,
  source.date_end,
  source.location,
  source.city,
  source.country,
  source.venue,
  source.website,
  source.lineup,
  source.is_featured,
  hibrida_org.id
FROM hibrida_org
CROSS JOIN (
  VALUES
    (
      'hibrida-fest-2024-i-edicion',
      'Híbrida Fest 2024 — I Edición (16 marzo)',
      'First edition on 16 March 2024 in Cordoba. Official page documents lineup section, aftermovies (breakbeat / hard techno) and photo gallery.',
      'Primera edicion el 16 de marzo de 2024 en Cordoba. La pagina oficial incluye seccion de lineup, aftermovies (breakbeat / hard techno) y galeria de fotos.',
      'past_iconic',
      DATE '2024-03-16',
      NULL::DATE,
      'Córdoba, Spain',
      'Córdoba',
      'Spain',
      'Córdoba',
      'https://www.hibridafest.com/edicion-16-marzo-2024/',
      ARRAY[]::TEXT[],
      FALSE
    ),
    (
      'hibrida-fest-2024-ii-edicion',
      'Híbrida Fest 2024 — II Edición (20 julio)',
      'Second edition on 20 July 2024 in Cordoba. Official page includes lineup, aftermovie and photo gallery.',
      'Segunda edicion el 20 de julio de 2024 en Cordoba. La pagina oficial incluye lineup, aftermovie y galeria de fotos.',
      'past_iconic',
      DATE '2024-07-20',
      NULL::DATE,
      'Córdoba, Spain',
      'Córdoba',
      'Spain',
      'Córdoba',
      'https://www.hibridafest.com/ii-edicion-20-julio-2024/',
      ARRAY[]::TEXT[],
      FALSE
    ),
    (
      'hibrida-fest-2026',
      'Híbrida Fest 2026',
      'Third edition on 11 April 2026 in Córdoba as a dedicated stage within Crazy World Festival: two stages (retro breakbeat and current), 12+ hours. Lineup reported in specialist press includes Rennie Pilgrem, Ragga Twins, Lady Waks, Mark XTC, Altern-8 and a strong Spanish breaks bill (e.g. DJ Karpin, Norbak, Guau).',
      'Tercera edicion el 11 de abril de 2026 en Cordoba con escenario propio en Crazy World Festival: dos escenarios (breakbeat retro y actual), mas de doce horas. Cartel difundido en prensa especializada incluye Rennie Pilgrem, Ragga Twins, Lady Waks, Mark XTC, Altern-8 y fuerte columna nacional de breaks (DJ Karpin, Norbak, Guau, entre otros).',
      'upcoming',
      DATE '2026-04-11',
      NULL::DATE,
      'Recinto Ferial El Arenal, Córdoba, Spain',
      'Córdoba',
      'Spain',
      'Recinto Ferial El Arenal (Crazy World Festival)',
      'https://www.hibridafest.com/',
      ARRAY[
        'Rennie Pilgrem',
        'Ragga Twins',
        'Lady Waks',
        'Mark XTC',
        'Altern-8',
        'DJ Karpin',
        'Legend Deejays',
        'The Brainkiller',
        'Tortu',
        'Jan B',
        'Mr.Fli',
        'Rasco',
        'DJ Jonay',
        'Terrie Kynd',
        'Jottafrank',
        'Yo Speed',
        'Guau',
        'Bass & Crash',
        'Kültur',
        'Lore Breaks',
        'Norbak',
        'Perfect Kombo',
        'Seekflow',
        'Ylia',
        'Wally',
        'Flyppin',
        'Obscure Sound'
      ]::TEXT[],
      TRUE
    )
) AS source(
  slug,
  name,
  description_en,
  description_es,
  event_type,
  date_start,
  date_end,
  location,
  city,
  country,
  venue,
  website,
  lineup,
  is_featured
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description_en = EXCLUDED.description_en,
  description_es = EXCLUDED.description_es,
  event_type = EXCLUDED.event_type,
  date_start = EXCLUDED.date_start,
  date_end = EXCLUDED.date_end,
  location = EXCLUDED.location,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  venue = EXCLUDED.venue,
  website = EXCLUDED.website,
  lineup = EXCLUDED.lineup,
  is_featured = EXCLUDED.is_featured,
  promoter_organization_id = EXCLUDED.promoter_organization_id;
