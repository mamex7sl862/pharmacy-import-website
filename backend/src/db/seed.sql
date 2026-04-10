-- PharmaLink Pro — Sample Data Seed
-- Run after schema.sql: psql $DATABASE_URL -f backend/src/db/seed.sql

-- Sample products with Unsplash images
INSERT INTO products (name, generic_name, brand, category, package_size, description, image_url, is_active, is_featured) VALUES
('Amoxicillin 500mg', 'Amoxicillin Trihydrate', 'GlaxoSmithKline', 'prescription', 'Box of 100 Capsules', 'Broad-spectrum antibiotic for bacterial infections.', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80', true, true),
('Atorvastatin 20mg', 'Atorvastatin Calcium', 'Pfizer Inc.', 'prescription', 'Pack of 30 Tablets', 'Statin medication for lowering cholesterol.', 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80', true, true),
('Lantus SoloStar', 'Insulin Glargine', 'Sanofi S.A.', 'prescription', '5 x 3ml Prefilled Pens', 'Long-acting insulin for diabetes management.', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80', true, true),
('Aspirin Protect 100mg', 'Acetylsalicylic Acid', 'Bayer AG', 'otc', 'Box of 100 Tablets', 'Low-dose aspirin for cardiovascular protection.', 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80', true, true),
('Nexium 40mg', 'Esomeprazole Magnesium', 'AstraZeneca', 'prescription', 'Box of 28 Gastro-Resistant Tabs', 'Proton pump inhibitor for acid reflux.', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80', true, false),
('Entresto 97/103mg', 'Sacubitril/Valsartan', 'Novartis AG', 'prescription', 'Box of 56 Tablets', 'Heart failure medication combining sacubitril and valsartan.', 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80', true, false),
('Surgical Gloves L', 'Latex Examination Gloves', 'Ansell', 'surgical', 'Box of 100 Pairs', 'Sterile latex gloves for surgical procedures.', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80', true, false),
('Vitamin D3 1000IU', 'Cholecalciferol', 'NutraCare', 'personal-care', '90 Softgel Capsules', 'Vitamin D3 supplement for bone health.', 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80', true, false),
('Paracetamol 500mg', 'Acetaminophen', 'Generic Pharma', 'otc', 'Box of 100 Tablets', 'Analgesic and antipyretic for pain and fever.', 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80', true, false),
('Metformin HCL 1000mg', 'Metformin Hydrochloride', 'Bayer Healthcare', 'prescription', 'Box of 60 Tablets', 'First-line medication for type 2 diabetes.', 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80', true, false),
('Lisinopril 10mg', 'Lisinopril', 'Pfizer Inc.', 'prescription', 'Bottle of 30 Tablets', 'ACE inhibitor for hypertension and heart failure.', 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&q=80', true, false),
('N95 Respirator Mask', 'Filtering Facepiece', 'MedShield', 'medical-supplies', 'Box of 20 Masks', 'NIOSH-approved N95 respirator for healthcare settings.', 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600&q=80', true, false)
ON CONFLICT DO NOTHING;

-- Sample testimonials
INSERT INTO testimonials (customer_name, company_name, comment, is_active, sort_order) VALUES
('Dr. Sarah Jenkins', 'Hospital Administrator, St. Jude Medical', 'The reliability of PharmaLink''s cold chain logistics has been transformative for our oncology department. We never have to worry about the integrity of our temperature-sensitive imports.', true, 1),
('Mark Thompson', 'Owner, City Health Pharmacies', 'Procuring rare medications used to be a nightmare of paperwork. PharmaLink''s RFQ portal simplifies the entire process, letting me focus on patient care rather than logistics.', true, 2)
ON CONFLICT DO NOTHING;

-- Default admin user (password: Admin@1234)
INSERT INTO users (email, password_hash, full_name, company_name, role) VALUES
('admin@pharmalink.com', '$2b$12$egApmlZVnnDbjblr4JYkz.IrPuQkKN2gat2S8iy8CbrSe3PdxT9y.', 'Admin User', 'PharmaLink Wholesale', 'admin')
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2b$12$egApmlZVnnDbjblr4JYkz.IrPuQkKN2gat2S8iy8CbrSe3PdxT9y.',
  role = 'admin',
  is_active = true;
