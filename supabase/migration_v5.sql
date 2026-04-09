-- ===========================================
-- De Schat van Schier — Migration v5
-- Adds: cloud_label field to plans for wordcloud display
-- ===========================================

ALTER TABLE plans ADD COLUMN IF NOT EXISTS cloud_label TEXT DEFAULT '';

-- Set labels for existing plans
UPDATE plans SET cloud_label = 'Jongerenplek' WHERE id = 2;
UPDATE plans SET cloud_label = 'Sportlessen' WHERE id = 3;
UPDATE plans SET cloud_label = 'Klimbos' WHERE id = 4;
UPDATE plans SET cloud_label = 'Legotheek' WHERE id = 5;
UPDATE plans SET cloud_label = 'Survivalbaan' WHERE id = 6;
UPDATE plans SET cloud_label = 'Kookclub' WHERE id = 7;
UPDATE plans SET cloud_label = 'Blotevoetenpad' WHERE id = 8;
UPDATE plans SET cloud_label = 'Mountainbike' WHERE id = 9;
UPDATE plans SET cloud_label = 'Graffiti muur' WHERE id = 10;
UPDATE plans SET cloud_label = 'IJsbaan' WHERE id = 11;
UPDATE plans SET cloud_label = 'Free run' WHERE id = 12;
UPDATE plans SET cloud_label = 'Zeeverkenners' WHERE id = 13;
UPDATE plans SET cloud_label = 'Huisdier klas' WHERE id = 14;
UPDATE plans SET cloud_label = 'Zandspoor' WHERE id = 15;
UPDATE plans SET cloud_label = 'Skeelerbaan' WHERE id = 16;
UPDATE plans SET cloud_label = 'Suisbuis' WHERE id = 17;
UPDATE plans SET cloud_label = 'Trampolinepark' WHERE id = 18;
UPDATE plans SET cloud_label = 'Turnclub' WHERE id = 19;
UPDATE plans SET cloud_label = 'Boldermuur' WHERE id = 20;
UPDATE plans SET cloud_label = 'Landrover' WHERE id = 21;
UPDATE plans SET cloud_label = 'Timmerdorp' WHERE id = 22;
UPDATE plans SET cloud_label = 'Moestuin' WHERE id = 23;
UPDATE plans SET cloud_label = 'Fierljeppen' WHERE id = 24;
UPDATE plans SET cloud_label = 'Wilgentenen' WHERE id = 25;
UPDATE plans SET cloud_label = 'Speurtocht' WHERE id = 26;
UPDATE plans SET cloud_label = 'Knutselclub' WHERE id = 27;
UPDATE plans SET cloud_label = 'Pannakooi' WHERE id = 28;
UPDATE plans SET cloud_label = 'Motorbaan' WHERE id = 29;
UPDATE plans SET cloud_label = 'Klimmuur' WHERE id = 30;
UPDATE plans SET cloud_label = 'Danslessen' WHERE id = 31;
UPDATE plans SET cloud_label = 'Escape room' WHERE id = 32;
UPDATE plans SET cloud_label = 'Binnenspeeltuin' WHERE id = 33;
UPDATE plans SET cloud_label = 'Slecht weer' WHERE id = 34;
UPDATE plans SET cloud_label = 'Survival+Zee' WHERE id = 35;
