BEGIN;

UPDATE pharmacies SET governorate = 'Sfax'
WHERE id IN (1114, 1200) AND governorate IS NULL;

UPDATE pharmacies SET governorate = 'Nabeul'
WHERE id IN (1198, 1238) AND governorate IS NULL;

UPDATE pharmacies SET governorate = 'Jendouba'
WHERE id IN (1457,1458,1459,1460,1461,1462)
  AND longitude < 9.10 AND governorate IS NULL;

UPDATE pharmacies SET governorate = 'Beja'
WHERE id IN (1457,1458,1459,1460,1461,1462)
  AND longitude >= 9.10 AND governorate IS NULL;

UPDATE pharmacies SET governorate = 'Medenine'
WHERE id = 1566 AND governorate IS NULL;

COMMIT;
