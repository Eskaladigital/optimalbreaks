-- ============================================
-- OPTIMAL BREAKS — Artistas de la home (FEATURED_ARTISTS)
-- Inserta filas que faltan respecto al seed 002; no duplica slugs existentes.
-- Ejecutar en Supabase SQL Editor después de 006/007.
-- ============================================

INSERT INTO public.artists (
  slug, name, name_display, country, bio_en, bio_es, category, styles, era,
  essential_tracks, recommended_mixes, related_artists, website, socials,
  is_featured, sort_order, real_name, labels_founded, key_releases, image_url
) VALUES
(
  'dj-kool-herc',
  'DJ Kool Herc',
  'DJ KOOL HERC',
  'USA',
  $$Clive Campbell, known as DJ Kool Herc, is widely cited as a foundational figure in hip hop through his Bronx block parties in the 1970s.

His practice of isolating and extending drum breaks using two turntables and a mixer supplied the rhythmic blueprint that breakbeat, jungle and club culture would later amplify worldwide.$$,
  $$Clive Campbell, conocido como DJ Kool Herc, suele citarse como figura fundacional del hip hop por sus fiestas en el Bronx en los años 70.

Su forma de aislar y alargar breaks de batería con dos platos y una mesa aportó la plantilla rítmica que después amplificarían el breakbeat, el jungle y la cultura club.$$,
  'pioneer',
  ARRAY['Hip Hop', 'Breaks'],
  '1970s',
  ARRAY[]::text[],
  ARRAY[]::text[],
  ARRAY[]::text[],
  NULL,
  '{}'::jsonb,
  true,
  20,
  'Clive Campbell',
  '{}',
  '[]'::jsonb,
  NULL
),
(
  'public-enemy',
  'Public Enemy',
  'PUBLIC ENEMY',
  'USA',
  $$Long Island collective led by Chuck D and Flavor Flav; their dense sample collages and political urgency helped define late-80s hip hop and the creative reuse of breaks.

Their sound influenced how UK and US producers treated rhythm sections, noise and voice as raw material for dancefloor-ready tension.$$,
  $$Colectivo de Long Island liderado por Chuck D y Flavor Flav; sus collages de samples y su urgencia política definieron el hip hop de finales de los 80 y el uso creativo de breaks.

Su sonido marcó cómo productores UK y US trataron baterías, ruido y voz como materia prima para tensiones listas para pista.$$,
  'pioneer',
  ARRAY['Hip Hop', 'Sample culture'],
  '1980s',
  ARRAY['Fight the Power', 'Bring the Noise', 'Don''t Believe the Hype'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  NULL,
  '{}'::jsonb,
  true,
  21,
  NULL,
  '{}',
  '[]'::jsonb,
  NULL
),
(
  'renegade-soundwave',
  'Renegade Soundwave',
  'RENEGADE SOUNDWAVE',
  'UK',
  $$London project bridging electro, dub, hip hop and the pre-rave UK underground; a key reference for how British electronics absorbed break-driven grooves.

Their records anticipated the hybrid energy later central to big beat and nu skool breaks.$$,
  $$Proyecto londinense entre electro, dub, hip hop y el underground UK pre-rave; referencia clave de cómo la electrónica británica absorbió grooves basados en breaks.

Sus discos anticiparon la energía híbrida que después sería central en big beat y nu skool breaks.$$,
  'uk_legend',
  ARRAY['Electro', 'Breaks'],
  '1980s',
  ARRAY['The Phantom', 'Ozone Breakdown', 'Thunder'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  NULL,
  '{}'::jsonb,
  true,
  22,
  NULL,
  '{}',
  '[]'::jsonb,
  NULL
),
(
  'shut-up-and-dance',
  'Shut Up and Dance',
  'SHUT UP AND DANCE',
  'UK',
  $$East London duo central to the hardcore and rave continuum that fed jungle, breakbeat and UK street electronics.

Their upfront break-driven tracks helped wire the connection between pirate energy and chart-crossing momentum.$$,
  $$Dúo del Este de Londres central en el continuo hardcore y rave que alimentó jungle, breakbeat y electrónica callejera UK.

Sus temas directos basados en breaks ayudaron a cablear la conexión entre energía pirata e impulso hacia las listas.$$,
  'uk_legend',
  ARRAY['Hardcore', 'Rave'],
  '1990s',
  ARRAY['Raving I''m Raving', 'The Art of Moving Butts', 'Derek Went Mad'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  NULL,
  '{}'::jsonb,
  true,
  23,
  NULL,
  '{}',
  '[]'::jsonb,
  NULL
),
(
  'altern-8',
  'Altern-8',
  'ALTERN-8',
  'UK',
  $$Mask-and-hi-vis rave act synonymous with bleepy hardcore acceleration; their anthems sit in the family tree linking breakbeats, stabs and warehouse momentum.

A touchstone when tracing how UK floors learned to love fractured drums at high tempo.$$,
  $$Acto rave de máscaras y chalecos fluorescentes, sinónimo de hardcore bleepy en aceleración; sus himnos enlazan breaks, stabs y pegada de warehouse.

Punto de apoyo al rastrear cómo las pistas UK aprendieron a amar baterías fracturadas a alto tempo.$$,
  'uk_legend',
  ARRAY['Rave', 'Hardcore'],
  '1990s',
  ARRAY['Activ 8', 'Brutal-8-E', 'Infiltrate 202'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  NULL,
  '{}'::jsonb,
  true,
  24,
  NULL,
  '{}',
  '[]'::jsonb,
  NULL
),
(
  '4hero',
  '4hero',
  '4HERO',
  'UK',
  $$Dego and Marc Mac built a bridge from breakbeat hardcore and jungle toward soulful drum and bass and future jazz; their catalog rewards anyone mapping UK bass genealogy.

Their work shows how broken rhythms became a language for melody, arrangement and long-form albums.$$,
  $$Dego y Marc Mac tendieron un puente del hardcore breakbeat y jungle hacia drum and bass soulful y jazz futurista; su catálogo interesa a quien trace la genealogía del bajo UK.

Su obra muestra cómo los ritmos rotos se volvieron lenguaje para melodía, arreglos y discos de largo aliento.$$,
  'uk_legend',
  ARRAY['Jungle', 'DnB'],
  '1990s',
  ARRAY['Mr Kirk''s Nightmare', 'Universal Love', 'Parallel Universe'],
  ARRAY[]::text[],
  ARRAY['Goldie', 'Photek', 'Roni Size'],
  NULL,
  '{}'::jsonb,
  true,
  25,
  NULL,
  '{}',
  '[]'::jsonb,
  NULL
),
(
  'goldie',
  'Goldie',
  'GOLDIE',
  'UK',
  $$Clifford Joseph Price; Metalheadz founder and a defining voice turning jungle into high-definition sound design and album ambition.

From Timeless forward, his career links soundsystem pressure, art-world curiosity and global drum and bass.$$,
  $$Clifford Joseph Price; fundador de Metalheadz y voz definitoria al llevar el jungle hacia diseño sonoro de alta definición y ambición de álbum.

Desde Timeless, su carrera une presión soundsystem, curiosidad de arte y drum and bass global.$$,
  'uk_legend',
  ARRAY['Jungle', 'DnB'],
  '1990s',
  ARRAY['Inner City Life', 'Timeless', 'Terminator'],
  ARRAY[]::text[],
  ARRAY['4hero', 'Photek'],
  NULL,
  '{}'::jsonb,
  true,
  26,
  'Clifford Joseph Price',
  ARRAY['Metalheadz'],
  '[]'::jsonb,
  NULL
),
(
  'orbital',
  'Orbital',
  'ORBITAL',
  'UK',
  $$The Hartnoll brothers helped shape British rave and techno storytelling with live hardware sets and melodic, break-tinged momentum.

Their festival presence and long-form live journeys connect techno ethos to the broader UK dance continuum.$$,
  $$Los hermanos Hartnoll moldearon rave y techno británico con directos de hardware y melodías con pulsos cercanos al break.

Su presencia en festivales y viajes largos en directo conectan el ethos techno con el continuo dance UK.$$,
  'uk_legend',
  ARRAY['Techno', 'Rave'],
  '1990s',
  ARRAY['Chime', 'Halcyon + On + On', 'Belfast'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  NULL,
  '{}'::jsonb,
  true,
  27,
  NULL,
  '{}',
  '[]'::jsonb,
  NULL
),
(
  'pendulum',
  'Pendulum',
  'PENDULUM',
  'AU',
  $$Australian-born collective that crossed drum and bass, rock energy and arena-scale production; a reference point for bass music’s global stadium era.

Their trajectory highlights Perth-to-UK pathways within modern breaks-adjacent culture.$$,
  $$Colectivo de origen australiano que cruzó drum and bass, energía rock y producción de escala arena; referencia de la era stadium del bass global.

Su trayectoria destaca rutas Perth–UK dentro de la cultura moderna adyacente a breaks.$$,
  'current',
  ARRAY['DnB', 'Electronic', 'Rock crossover'],
  '2000s',
  ARRAY['Tarantula', 'Slam', 'Watercolour'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  NULL,
  '{}'::jsonb,
  true,
  28,
  NULL,
  '{}',
  '[]'::jsonb,
  NULL
),
(
  'escena-andaluza',
  'Escena andaluza',
  'ESCENA ANDALUZA',
  'ES',
  $$Not a single act but a collective chapter: Andalusian breakbeat and club culture between the 1990s and early 2000s, including massive events, radio and local labels that connected UK energy to Mediterranean floors.

Optimal Breaks treats it as an editorial anchor for Spain’s role in the global breaks story.$$,
  $$No es un solo proyecto sino un capítulo colectivo: breakbeat y cultura club andaluza entre los 90 y principios de los 2000, con macroeventos, radio y sellos locales que conectaron energía UK con pistas mediterráneas.

Optimal Breaks lo usa como ancla editorial del papel de España en la historia global del breaks.$$,
  'andalusian',
  ARRAY['Breakbeat', 'Makina crossover', 'Rave'],
  '1992–2002',
  ARRAY[]::text[],
  ARRAY[]::text[],
  ARRAY[]::text[],
  NULL,
  '{}'::jsonb,
  true,
  29,
  NULL,
  '{}',
  '[]'::jsonb,
  NULL
)
ON CONFLICT (slug) DO NOTHING;
