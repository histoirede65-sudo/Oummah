-- OUMMAH Scan — préfixes GS1 (7 premiers chiffres) relus à la main le 03/10/2026.
-- Source : scripts/product-images/build_barcode_prefixes.py (marques réelles derrière chaque préfixe sur
-- Open Food Facts / Open Beauty Facts). Un préfixe ne sert qu'en dernier recours, quand aucune marque n'est
-- reconnue. Écartés après relecture :
--  * Coca-Cola : 7501295 / 7896504 (Santa Clara, embouteilleur ou coopérative homonyme), 8004996 (pâtes Rossi),
--    7771200 (Industrias Del Valle, Bolivie, sans lien) ;
--  * PepsiCo : 5011555 (Walkers mêlé à d'autres fabricants) ;
--  * Carrefour : 8012666 (Carrefour Italia cédé en 2025) ;
--  * Nestlé : 7613034/36/38/39 (produits Herta, cédée en 2025), 3023290 et 3033210 (La Laitière, Froneri :
--    participations partielles), 5900020 / 3387390 / 5011546 (céréales CPW, coentreprise), 8000300 et 4008211
--    (Motta / Mövenpick : Froneri), 8053041 (Buitoni Italie), 3266191 (La Vie Claire), 9000295 / 5900571 /
--    6424908 (Felix Austria / Orkla / Intersnack, pas Purina), 6001056 (Bakers Afrique du Sud), 6033000 (Gloria),
--    5000189 (Sun-Pat), 7610100 (Hirz), 3760381 (Mousline : échantillon trop mêlé) ;
--  * L'Oréal : 3474630 / 3474636 / 3474637 / 3610340 / 7899706 (trop peu de marques identifiées).

update public.boycott_entities set barcode_prefixes = array['5449000','5038862','5000112','9300675','7771609','8901764','9555589','7898341','8992761','7801610','8935049'] where slug = 'coca-cola';
update public.boycott_entities set barcode_prefixes = array['8410199','5000328','5900259','5601363','4803925','7792170','5201024','8858998','6221031','9313820','7501761','5000108','6130743','6924743','4690388','4710543','8690624','1200108'] where slug = 'pepsico';
update public.boycott_entities set barcode_prefixes = array['8007950'] where slug = 'carlsberg';
update public.boycott_entities set barcode_prefixes = array['3560070','3560071','8431876','5400101','3523680'] where slug = 'carrefour';
update public.boycott_entities set barcode_prefixes = array['7613287','8445290','7613033','7613031','7613032','7891000','7613037','3033710','8445291','7630039','3179732','3179730','9556001','7501058','7630428','4902201','7630047','3800020','8002270','6294003','7630311','7630030','8410100','8850125','7460123','6111018','9002100','4005500','8901058','8850124','6001068','7630054','8690632','6181002','8888082','4800361'] where slug = 'nestle';
update public.boycott_entities set barcode_prefixes = array['3600551','3337875','3606000','3600523','3337872','3600524','3337871','3600541','3600522','3433422','3600520','7509552','8901526'] where slug = 'l-oreal-groupe';
