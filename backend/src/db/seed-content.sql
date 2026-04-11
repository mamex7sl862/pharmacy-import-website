-- Run in pgAdmin after schema.sql
-- Creates the site_content table and seeds all default content

CREATE TABLE IF NOT EXISTS site_content (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section    VARCHAR(100) UNIQUE NOT NULL,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hero Slides
INSERT INTO site_content (section, data) VALUES ('hero_slides', '[
  {"img":"https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1800&q=90","badge":"Global Distribution Excellence","accent":"Import Solutions","subtitle":"Supplying medical institutions worldwide with precision-sourced medications, surgical supplies, and laboratory equipment through a certified cold-chain network."},
  {"img":"https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1800&q=90","badge":"WHO-GMP Certified Sources","accent":"Pharmaceutical Wholesale","subtitle":"Every product in our catalog meets rigorous international standards including WHO, FDA, and EMA guidelines — from origin to delivery."},
  {"img":"https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1800&q=90","badge":"Cold Chain Specialists","accent":"Temperature-Controlled Logistics","subtitle":"IoT-monitored cold chain handling for temperature-sensitive pharmaceuticals. 2–8°C compliance guaranteed throughout the entire supply chain."},
  {"img":"https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1800&q=90","badge":"Surgical & Medical Supplies","accent":"Sterile & Certified","subtitle":"Precision instruments, sterile disposables, and medical consumables for operating theaters and clinical environments worldwide."}
]'::jsonb) ON CONFLICT (section) DO NOTHING;

-- Company Info
INSERT INTO site_content (section, data) VALUES ('company_info', '{
  "name":"PharmaLink Wholesale",
  "tagline":"Trusted Pharmaceutical Wholesale & Import Solutions",
  "description":"PharmaLink Pro operates at the intersection of medical necessity and logistical precision. As a licensed global wholesaler, we remove the complexities of international pharmaceutical procurement.",
  "address":"Medical Park West, Floor 14, London, UK EC1A 4HQ",
  "phone":"+44 (0) 20 7946 0123",
  "hours":"Mon–Fri, 9am – 6pm GMT",
  "email":"support@pharmalinkwholesale.com",
  "procurementEmail":"procurement@pharmalinkwholesale.com",
  "yearsExp":"15+",
  "countries":"50+",
  "products":"10,000+",
  "accuracy":"99.8%",
  "aboutImage":"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=90",
  "aboutHeading":"The Essential Bridge in Healthcare Supply Chains",
  "missionTitle":"Our Mission",
  "missionText":"To make pharmaceutical procurement transparent, efficient, and accessible for every healthcare institution worldwide.",
  "visionTitle":"Our Vision",
  "visionText":"A world where no patient goes without medicine due to supply chain failures or procurement inefficiencies."
}'::jsonb) ON CONFLICT (section) DO NOTHING;

-- Why Choose Us
INSERT INTO site_content (section, data) VALUES ('why_choose_us', '[
  {"icon":"verified","title":"Genuine Products","desc":"Direct sourcing from certified manufacturers only."},
  {"icon":"payments","title":"Competitive Pricing","desc":"Economies of scale passed directly to our clients."},
  {"icon":"local_shipping","title":"Fast Delivery","desc":"Optimized air & sea freight for rapid turnaround."},
  {"icon":"gavel","title":"Licensed & Certified","desc":"Strict adherence to regional health authorities."}
]'::jsonb) ON CONFLICT (section) DO NOTHING;

-- Team
INSERT INTO site_content (section, data) VALUES ('team', '[
  {"name":"Dr. Helena Richardson","role":"Chief Executive Officer","bio":"20+ years in pharmaceutical supply chain. Former VP at Novartis Global Distribution.","img":"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80"},
  {"name":"James Okafor","role":"Head of Regulatory Affairs","bio":"Expert in international pharmaceutical compliance. Certified by WHO and EMA frameworks.","img":"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80"},
  {"name":"Dr. Mei Lin","role":"Director of Quality Assurance","bio":"PhD in Pharmaceutical Sciences. Oversees all product verification and cold chain protocols.","img":"https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80"},
  {"name":"Carlos Mendez","role":"VP of Global Logistics","bio":"Specialist in air and sea freight for temperature-sensitive cargo across 50+ countries.","img":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"}
]'::jsonb) ON CONFLICT (section) DO NOTHING;

-- Timeline
INSERT INTO site_content (section, data) VALUES ('timeline', '[
  {"year":"2009","title":"Founded","desc":"PharmaLink established in London as a regional pharmaceutical wholesaler."},
  {"year":"2012","title":"WHO Certification","desc":"Achieved WHO-GMP certification, opening doors to international markets."},
  {"year":"2015","title":"Cold Chain Launch","desc":"Launched dedicated cold chain division with IoT temperature monitoring."},
  {"year":"2018","title":"Digital Platform","desc":"Introduced the first version of our digital RFQ procurement portal."},
  {"year":"2021","title":"Global Expansion","desc":"Expanded operations to 50+ countries across 6 continents."},
  {"year":"2024","title":"PharmaLink Pro","desc":"Launched PharmaLink Pro — the next generation of B2B pharmaceutical procurement."}
]'::jsonb) ON CONFLICT (section) DO NOTHING;

-- FAQ
INSERT INTO site_content (section, data) VALUES ('faq', '[
  {"q":"How quickly do you respond to RFQs?","a":"We respond to all RFQ submissions within 4–24 business hours with a formal quotation."},
  {"q":"What is the minimum order quantity?","a":"MOQ varies by product. Many items have no minimum. Contact us for specific product requirements."},
  {"q":"Do you handle international shipping?","a":"Yes. We ship to 50+ countries and handle all customs documentation and freight arrangements."},
  {"q":"Are your products WHO-GMP certified?","a":"All products in our catalog are sourced exclusively from WHO-GMP certified manufacturers."}
]'::jsonb) ON CONFLICT (section) DO NOTHING;

-- Contact Info
INSERT INTO site_content (section, data) VALUES ('contact_info', '[
  {"icon":"location_on","title":"Headquarters","line1":"Medical Park West, Floor 14","line2":"London, UK EC1A 4HQ"},
  {"icon":"call","title":"Phone Support","line1":"+44 (0) 20 7946 0123","line2":"Mon–Fri, 9am – 6pm GMT"},
  {"icon":"mail","title":"Email","line1":"support@pharmalinkwholesale.com","line2":"procurement@pharmalinkwholesale.com"},
  {"icon":"schedule","title":"Business Hours","line1":"Monday – Friday: 9am – 6pm GMT","line2":"Saturday: 10am – 2pm GMT"}
]'::jsonb) ON CONFLICT (section) DO NOTHING;

-- Services
INSERT INTO site_content (section, data) VALUES ('services', '[
  {"icon":"local_shipping","title":"Pharmaceutical Wholesale Supply","desc":"We supply bulk pharmaceutical products directly to pharmacies, hospitals, clinics, and distributors at competitive wholesale prices.","features":["Bulk order discounts","Flexible MOQ","Dedicated account manager","Priority stock allocation"],"img":"https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80"},
  {"icon":"flight","title":"International Import & Export","desc":"Licensed pharmaceutical importer with global sourcing capabilities. We handle all regulatory documentation, customs clearance, and international freight.","features":["WHO-GMP certified sources","Full customs clearance","Import/export licensing","Multi-country sourcing"],"img":"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80"},
  {"icon":"thermostat","title":"Cold Chain Logistics","desc":"Specialized temperature-controlled storage and distribution for biologics, vaccines, and temperature-sensitive pharmaceuticals.","features":["2–8°C compliance","IoT temperature monitoring","Validated cold rooms","Real-time tracking"],"img":"https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80"},
  {"icon":"request_quote","title":"RFQ & Quotation Management","desc":"Our digital RFQ platform allows healthcare institutions to submit structured quotation requests for multiple products simultaneously.","features":["Multi-product RFQ","Digital quotation delivery","4–24h response time","PDF quotation download"],"img":"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80"},
  {"icon":"verified_user","title":"Regulatory & Compliance Support","desc":"Our regulatory affairs team assists clients with product registration, import permits, and compliance documentation.","features":["Product registration support","Import permit assistance","WHO/FDA/EMA compliance","Certificate of Analysis"],"img":"https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80"},
  {"icon":"support_agent","title":"After-Sales & Technical Support","desc":"Dedicated customer support team available for order tracking, product queries, documentation requests, and post-delivery support.","features":["Dedicated account manager","Order tracking portal","Documentation requests","Technical product queries"],"img":"https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80"}
]'::jsonb) ON CONFLICT (section) DO NOTHING;

-- Categories
INSERT INTO site_content (section, data) VALUES ('categories', '[
  {"key":"prescription","label":"Prescription Medicines","count":"2,400+ SKUs","desc":"Regulated prescription drugs sourced directly from certified manufacturers. Full traceability, cold-chain handling, and regulatory documentation included.","img":"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80","features":["WHO-GMP Certified Sources","Full Batch Traceability","Regulatory Documentation","Cold Chain Available"],"examples":["Amoxicillin 500mg","Atorvastatin 20mg","Metformin HCL 1000mg","Lisinopril 10mg"]},
  {"key":"otc","label":"OTC Medications","count":"1,800+ SKUs","desc":"High-volume over-the-counter essentials for retail pharmacy networks. Competitive bulk pricing with fast turnaround for high-demand products.","img":"https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80","features":["Bulk Pricing Available","Fast Turnaround","Retail-Ready Packaging","Private Label Options"],"examples":["Paracetamol 500mg","Aspirin 100mg","Ibuprofen 400mg","Vitamin C 1000mg"]},
  {"key":"medical-supplies","label":"Medical Supplies","count":"3,200+ SKUs","desc":"Consumables and disposables for clinical environments. From IV sets to wound care, we supply the full spectrum of medical consumables.","img":"https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80","features":["Sterile & Non-Sterile","Single-Use Certified","Hospital Grade Quality","Bulk Discounts"],"examples":["IV Infusion Sets","Surgical Gloves","Wound Dressings","Syringes & Needles"]},
  {"key":"surgical","label":"Surgical Products","count":"900+ SKUs","desc":"Precision instruments and sterile disposables for operating theaters. All surgical products meet international sterility and biocompatibility standards.","img":"https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80","features":["ISO 13485 Certified","Sterility Guaranteed","Biocompatibility Tested","Surgeon-Grade Quality"],"examples":["Scalpels & Blades","Surgical Sutures","Retractors","Electrosurgical Units"]},
  {"key":"laboratory","label":"Laboratory Equipment","count":"1,100+ SKUs","desc":"Diagnostic devices and consumables for clinical research and pathology labs. From reagents to analyzers, we supply the full diagnostic workflow.","img":"https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80","features":["CE & FDA Cleared","Calibration Certificates","Technical Support","Reagent Compatibility"],"examples":["PCR Reagents","Centrifuges","Microscope Slides","Blood Glucose Meters"]},
  {"key":"personal-care","label":"Personal Care & Nutraceuticals","count":"600+ SKUs","desc":"Pharmaceutical-grade vitamins, supplements, and personal care products. Sourced from GMP-certified nutraceutical manufacturers worldwide.","img":"https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80","features":["GMP Certified","Third-Party Tested","Allergen Declarations","Halal & Kosher Options"],"examples":["Vitamin D3 1000IU","Omega-3 Fish Oil","Zinc Supplements","Probiotic Capsules"]}
]'::jsonb) ON CONFLICT (section) DO NOTHING;

SELECT section, updated_at FROM site_content ORDER BY section;
