-- OUMMAH — étend le catalogue à 50 images de mosquées
-- et réattribue une image déterministe à toutes les mosquées déjà enregistrées.

with image_pool as (
  select array[
    'mosque-a-00',
    'mosque-a-01',
    'mosque-a-02',
    'mosque-a-03',
    'mosque-a-04',
    'mosque-a-05',
    'mosque-a-06',
    'mosque-a-07',
    'mosque-a-08',
    'mosque-a-09',
    'mosque-a-10',
    'mosque-a-11',
    'mosque-b-00',
    'mosque-b-01',
    'mosque-b-02',
    'mosque-b-03',
    'mosque-b-04',
    'mosque-b-05',
    'mosque-b-06',
    'mosque-b-07',
    'mosque-b-08',
    'mosque-b-09',
    'mosque-b-10',
    'mosque-b-11',
    'mosque-coastal',
    'mosque-neighborhood',
    'mosque-c-00',
    'mosque-c-01',
    'mosque-c-02',
    'mosque-c-03',
    'mosque-c-04',
    'mosque-c-05',
    'mosque-c-06',
    'mosque-c-07',
    'mosque-c-08',
    'mosque-c-09',
    'mosque-c-10',
    'mosque-c-11',
    'mosque-d-00',
    'mosque-d-01',
    'mosque-d-02',
    'mosque-d-03',
    'mosque-d-04',
    'mosque-d-05',
    'mosque-d-06',
    'mosque-d-07',
    'mosque-d-08',
    'mosque-d-09',
    'mosque-d-10',
    'mosque-d-11'
  ]::text[] as keys
)
update public.mosque_submissions as mosque
set
  image_key = pool.keys[
    1 + (
      ('x' || substr(md5(mosque.id::text), 1, 8))::bit(32)::bigint
      % cardinality(pool.keys)
    )::integer
  ],
  updated_at = now()
from image_pool as pool;
