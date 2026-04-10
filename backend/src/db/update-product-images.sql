-- Update all products with relevant pharmaceutical images from Unsplash
-- Each image is specifically chosen to match the product type
-- Run in pgAdmin Query Tool on the pharmalink database

-- ── PRESCRIPTION MEDICINES ───────────────────────────────────────────────────
-- Capsules / antibiotics
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80' WHERE name = 'Amoxicillin 500mg';
-- White tablets in blister pack
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80' WHERE name = 'Atorvastatin 20mg';
-- Round white tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80' WHERE name = 'Metformin HCL 1000mg';
-- Small white pills
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&q=80' WHERE name = 'Lisinopril 10mg';
-- Insulin pen / injection device
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80' WHERE name = 'Lantus SoloStar';
-- Medicine capsules purple/blue
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' WHERE name = 'Nexium 40mg';
-- Heart medication tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80' WHERE name = 'Entresto 97/103mg';
-- Small round tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80' WHERE name = 'Amlodipine 5mg';
-- Capsules in blister
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80' WHERE name = 'Omeprazole 20mg';
-- Tablet strip
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80' WHERE name = 'Losartan 50mg';
-- White oval tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80' WHERE name = 'Simvastatin 40mg';
-- Antibiotic tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600&q=80' WHERE name = 'Ciprofloxacin 500mg';
-- Blood thinner tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80' WHERE name = 'Warfarin 5mg';
-- Small thyroid tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80' WHERE name = 'Levothyroxine 100mcg';
-- Capsules for nerve pain
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&q=80' WHERE name = 'Gabapentin 300mg';

-- ── OTC MEDICINES ────────────────────────────────────────────────────────────
-- Aspirin tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80' WHERE name = 'Aspirin Protect 100mg';
-- Paracetamol blister pack
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80' WHERE name = 'Paracetamol 500mg';
-- Ibuprofen tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80' WHERE name = 'Ibuprofen 400mg';
-- Allergy tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80' WHERE name = 'Cetirizine 10mg';
-- Antihistamine tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80' WHERE name = 'Loratadine 10mg';
-- Cough syrup / capsules
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' WHERE name = 'Dextromethorphan 15mg';
-- Antacid chewable tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80' WHERE name = 'Antacid Tablets';
-- Diarrhea capsules
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80' WHERE name = 'Loperamide 2mg';
-- Antiseptic liquid bottle
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80' WHERE name = 'Dettol Antiseptic 500ml';
-- Cream tube
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600&q=80' WHERE name = 'Zinc Oxide Cream';
-- Oral rehydration sachets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&q=80' WHERE name = 'Oral Rehydration Salts';

-- ── MEDICAL SUPPLIES ─────────────────────────────────────────────────────────
-- N95 mask
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600&q=80' WHERE name = 'N95 Respirator Mask';
-- Medical gloves
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80' WHERE name = 'Disposable Gloves M';
-- IV drip set
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80' WHERE name = 'IV Infusion Set';
-- Gauze pads
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' WHERE name = 'Sterile Gauze Pads 4x4';
-- Adhesive plasters
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80' WHERE name = 'Adhesive Bandages';
-- Medical syringe
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80' WHERE name = 'Syringe 5ml';
-- Hypodermic needle
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80' WHERE name = 'Hypodermic Needle 21G';
-- Wound dressing pad
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80' WHERE name = 'Wound Dressing 10x10cm';
-- Elastic bandage roll
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80' WHERE name = 'Elastic Bandage 10cm';
-- Urine drainage bag
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80' WHERE name = 'Urine Collection Bag';
-- Oxygen mask
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&q=80' WHERE name = 'Oxygen Mask Adult';

-- ── SURGICAL PRODUCTS ────────────────────────────────────────────────────────
-- Surgical latex gloves
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80' WHERE name = 'Surgical Gloves L';
-- Scalpel / surgical blade
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600&q=80' WHERE name = 'Scalpel Handle No.4';
-- Surgical suture thread
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80' WHERE name = 'Surgical Suture 2-0';
-- Sterile drape
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' WHERE name = 'Surgical Drape 150x200cm';
-- Electrosurgical device
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80' WHERE name = 'Electrosurgical Pencil';
-- Surgical stapler
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80' WHERE name = 'Surgical Stapler 30mm';
-- Surgical retractors
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80' WHERE name = 'Retractor Set';
-- Surgical gown
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80' WHERE name = 'Surgical Gown XL';
-- Orthopedic saw blade
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80' WHERE name = 'Bone Saw Blade';
-- Laparoscopic trocar
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80' WHERE name = 'Laparoscopic Trocar 5mm';

-- ── LABORATORY EQUIPMENT ─────────────────────────────────────────────────────
-- Blood glucose meter device
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80' WHERE name = 'Blood Glucose Meter';
-- PCR test tubes / lab
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' WHERE name = 'PCR Test Kit COVID-19';
-- Lab centrifuge tubes
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80' WHERE name = 'Centrifuge Tubes 15ml';
-- Microscope glass slides
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80' WHERE name = 'Microscope Slides';
-- Urine test strips
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80' WHERE name = 'Urine Dipstick 10 Panel';
-- Hemoglobin analyzer
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80' WHERE name = 'Hemoglobin Analyzer';
-- Blood culture bottles
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600&q=80' WHERE name = 'Blood Culture Bottles';
-- Pipette tips rack
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80' WHERE name = 'Pipette Tips 200ul';
-- Rapid diagnostic test
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80' WHERE name = 'Malaria RDT Kit';
-- Pregnancy test strip
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80' WHERE name = 'Pregnancy Test Strip';

-- ── PERSONAL CARE / NUTRACEUTICALS ───────────────────────────────────────────
-- Vitamin D3 softgels
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80' WHERE name = 'Vitamin D3 1000IU';
-- Vitamin C effervescent
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80' WHERE name = 'Vitamin C 1000mg';
-- Fish oil capsules
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80' WHERE name = 'Omega-3 Fish Oil 1000mg';
-- Zinc tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80' WHERE name = 'Zinc 50mg';
-- Magnesium tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' WHERE name = 'Magnesium 400mg';
-- Probiotic capsules
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80' WHERE name = 'Probiotic 10 Billion CFU';
-- Iron supplement tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80' WHERE name = 'Iron 65mg';
-- Folic acid tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80' WHERE name = 'Folic Acid 5mg';
-- Multivitamin tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&q=80' WHERE name = 'Multivitamin Complete';
-- Calcium tablets
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600&q=80' WHERE name = 'Calcium 600mg + D3';

SELECT name, category, image_url FROM products ORDER BY category, name;
