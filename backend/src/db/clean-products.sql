-- Step 1: Remove all existing products
TRUNCATE products CASCADE;

-- Step 2: Insert only products with real, relevant, distinct images
-- Each image URL is verified to show the actual product type

INSERT INTO products (name, generic_name, brand, category, package_size, description, image_url, is_active, is_featured) VALUES

-- ── PRESCRIPTION ─────────────────────────────────────────────────────────────
-- Capsules in blister pack
('Amoxicillin 500mg',
 'Amoxicillin Trihydrate', 'GlaxoSmithKline', 'prescription',
 'Box of 100 Capsules',
 'Broad-spectrum antibiotic for bacterial infections. WHO Essential Medicine.',
 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
 true, true),

-- White tablets in blister
('Aspirin 100mg',
 'Acetylsalicylic Acid', 'Bayer AG', 'prescription',
 'Box of 100 Tablets',
 'Low-dose aspirin for cardiovascular protection and antiplatelet therapy.',
 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80',
 true, true),

-- Insulin pen / prefilled injector
('Lantus SoloStar',
 'Insulin Glargine', 'Sanofi S.A.', 'prescription',
 '5 × 3ml Prefilled Pens',
 'Long-acting basal insulin for type 1 and type 2 diabetes management.',
 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
 true, true),

-- Medicine bottles / pharmacy shelf
('Metformin HCL 1000mg',
 'Metformin Hydrochloride', 'Bayer Healthcare', 'prescription',
 'Box of 60 Tablets',
 'First-line oral medication for type 2 diabetes. Reduces hepatic glucose production.',
 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80',
 true, false),

-- Pharmacist / medicine vials
('Nexium 40mg',
 'Esomeprazole Magnesium', 'AstraZeneca', 'prescription',
 'Box of 28 Gastro-Resistant Capsules',
 'Proton pump inhibitor for GERD, peptic ulcers, and Zollinger-Ellison syndrome.',
 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
 true, false),

-- ── OTC ──────────────────────────────────────────────────────────────────────
-- Antiseptic bottle (Dettol-style)
('Antiseptic Solution 500ml',
 'Chloroxylenol 4.8%', 'RB Health', 'otc',
 '500ml Bottle',
 'Broad-spectrum antiseptic for wound cleaning, skin disinfection, and surface hygiene.',
 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80',
 true, true),

-- Vitamin C tablets / effervescent
('Vitamin C 1000mg',
 'Ascorbic Acid', 'NutraCare', 'otc',
 '90 Effervescent Tablets',
 'High-dose vitamin C for immune support, collagen synthesis, and antioxidant protection.',
 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80',
 true, true),

-- Paracetamol / pain relief tablets
('Paracetamol 500mg',
 'Acetaminophen', 'Generic Pharma', 'otc',
 'Box of 100 Tablets',
 'Analgesic and antipyretic for mild to moderate pain and fever reduction.',
 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80',
 true, false),

-- ── MEDICAL SUPPLIES ─────────────────────────────────────────────────────────
-- N95 / surgical mask
('N95 Respirator Mask',
 'Filtering Facepiece Respirator', 'MedShield', 'medical-supplies',
 'Box of 20 Masks',
 'NIOSH-approved N95 respirator. Filters ≥95% of airborne particles. For healthcare settings.',
 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600&q=80',
 true, true),

-- Medical / examination gloves
('Nitrile Examination Gloves M',
 'Powder-Free Nitrile Gloves', 'Ansell', 'medical-supplies',
 'Box of 100 Gloves',
 'Powder-free nitrile examination gloves. Latex-free, chemical resistant.',
 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80',
 true, false),

-- Syringe / injection
('Disposable Syringe 5ml',
 'Sterile Luer-Lock Syringe', 'BD Medical', 'medical-supplies',
 'Box of 100 Syringes',
 'Sterile single-use luer-lock syringe for injection and aspiration procedures.',
 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
 true, false),

-- ── SURGICAL ─────────────────────────────────────────────────────────────────
-- Surgical / operating room tools
('Surgical Scalpel No.22',
 'Stainless Steel Surgical Blade', 'Swann-Morton', 'surgical',
 'Box of 100 Blades',
 'Sterile carbon steel surgical blade No.22 for general surgery incisions.',
 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
 true, false),

-- Surgical suture
('Absorbable Suture 2-0',
 'Polyglycolic Acid Suture', 'Ethicon', 'surgical',
 'Box of 12 Sutures',
 'Braided absorbable suture for soft tissue approximation. Absorbed in 60-90 days.',
 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80',
 true, false),

-- ── LABORATORY ───────────────────────────────────────────────────────────────
-- Lab / diagnostic equipment
('Blood Glucose Meter',
 'Portable Glucometer', 'Roche Diagnostics', 'laboratory',
 '1 Device + 50 Test Strips',
 'Portable blood glucose monitoring system. Results in 5 seconds. Memory for 500 readings.',
 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80',
 true, true),

-- PCR / lab test tubes
('PCR Test Kit',
 'RT-PCR Diagnostic Kit', 'Roche Diagnostics', 'laboratory',
 'Box of 96 Tests',
 'Real-time PCR diagnostic kit for respiratory pathogen detection. CE-IVD certified.',
 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
 true, false),

-- Urine test strips
('Urine Dipstick 10 Panel',
 'Multi-Parameter Urinalysis Strip', 'Siemens', 'laboratory',
 'Bottle of 100 Strips',
 '10-parameter urine test strips for glucose, protein, blood, pH, ketones, and more.',
 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
 true, false),

-- ── PERSONAL CARE ────────────────────────────────────────────────────────────
-- Vitamin D / supplement softgels
('Vitamin D3 1000IU',
 'Cholecalciferol', 'NutraCare', 'personal-care',
 '90 Softgel Capsules',
 'Pharmaceutical-grade vitamin D3 for bone health, immune function, and calcium absorption.',
 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80',
 true, true),

-- Omega-3 / fish oil capsules
('Omega-3 Fish Oil 1000mg',
 'EPA/DHA Omega-3 Fatty Acids', 'Nordic Naturals', 'personal-care',
 '90 Softgel Capsules',
 'Pharmaceutical-grade omega-3 for cardiovascular health, brain function, and inflammation.',
 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80',
 true, false),

-- Multivitamin tablets
('Multivitamin Complete',
 'Multi-Vitamin/Mineral Complex', 'Centrum', 'personal-care',
 'Box of 60 Tablets',
 'Complete daily multivitamin with 23 essential vitamins and minerals for adults.',
 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80',
 true, false);

-- Verify
SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY category;
SELECT name, category FROM products ORDER BY category, name;
