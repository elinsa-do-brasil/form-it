-- Remove the deprecated previousEquipmentDisposition field from persisted
-- equipment request JSON payloads.

UPDATE "equipment_request" AS er
SET "items" = (
  SELECT COALESCE(
    jsonb_agg(item - 'previousEquipmentDisposition'),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(er."items") AS item
)
WHERE jsonb_typeof(er."items") = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(er."items") AS item
    WHERE item ? 'previousEquipmentDisposition'
  );

UPDATE "equipment_request" AS er
SET "normalizedPayload" = jsonb_set(
  er."normalizedPayload",
  '{items}',
  (
    SELECT COALESCE(
      jsonb_agg(item - 'previousEquipmentDisposition'),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(er."normalizedPayload"->'items') = 'array'
          THEN er."normalizedPayload"->'items'
        ELSE '[]'::jsonb
      END
    ) AS item
  ),
  true
)
WHERE jsonb_typeof(er."normalizedPayload") = 'object'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(er."normalizedPayload"->'items') = 'array'
          THEN er."normalizedPayload"->'items'
        ELSE '[]'::jsonb
      END
    ) AS item
    WHERE item ? 'previousEquipmentDisposition'
  );
