-- Add 48 new columns for generations 4 and 5 pedigree data
-- Generation 4: 16 ancestors (8 paternal, 8 maternal)
-- Generation 5: 32 ancestors (16 paternal, 16 maternal)

ALTER TABLE public.animals
-- Generation 4 - Paternal line (8 ancestors)
ADD COLUMN gen4_paternal_ggggf_p TEXT,
ADD COLUMN gen4_paternal_ggggm_p TEXT,
ADD COLUMN gen4_paternal_gggmf_p TEXT,
ADD COLUMN gen4_paternal_gggmm_p TEXT,
ADD COLUMN gen4_paternal_ggfgf_p TEXT,
ADD COLUMN gen4_paternal_ggfgm_p TEXT,
ADD COLUMN gen4_paternal_ggmgf_p TEXT,
ADD COLUMN gen4_paternal_ggmgm_p TEXT,

-- Generation 4 - Maternal line (8 ancestors)
ADD COLUMN gen4_maternal_ggggf_m TEXT,
ADD COLUMN gen4_maternal_ggggm_m TEXT,
ADD COLUMN gen4_maternal_gggmf_m TEXT,
ADD COLUMN gen4_maternal_gggmm_m TEXT,
ADD COLUMN gen4_maternal_ggfgf_m TEXT,
ADD COLUMN gen4_maternal_ggfgm_m TEXT,
ADD COLUMN gen4_maternal_ggmgf_m TEXT,
ADD COLUMN gen4_maternal_ggmgm_m TEXT,

-- Generation 5 - Paternal line (16 ancestors)
ADD COLUMN gen5_paternal_1 TEXT,
ADD COLUMN gen5_paternal_2 TEXT,
ADD COLUMN gen5_paternal_3 TEXT,
ADD COLUMN gen5_paternal_4 TEXT,
ADD COLUMN gen5_paternal_5 TEXT,
ADD COLUMN gen5_paternal_6 TEXT,
ADD COLUMN gen5_paternal_7 TEXT,
ADD COLUMN gen5_paternal_8 TEXT,
ADD COLUMN gen5_paternal_9 TEXT,
ADD COLUMN gen5_paternal_10 TEXT,
ADD COLUMN gen5_paternal_11 TEXT,
ADD COLUMN gen5_paternal_12 TEXT,
ADD COLUMN gen5_paternal_13 TEXT,
ADD COLUMN gen5_paternal_14 TEXT,
ADD COLUMN gen5_paternal_15 TEXT,
ADD COLUMN gen5_paternal_16 TEXT,

-- Generation 5 - Maternal line (16 ancestors)
ADD COLUMN gen5_maternal_1 TEXT,
ADD COLUMN gen5_maternal_2 TEXT,
ADD COLUMN gen5_maternal_3 TEXT,
ADD COLUMN gen5_maternal_4 TEXT,
ADD COLUMN gen5_maternal_5 TEXT,
ADD COLUMN gen5_maternal_6 TEXT,
ADD COLUMN gen5_maternal_7 TEXT,
ADD COLUMN gen5_maternal_8 TEXT,
ADD COLUMN gen5_maternal_9 TEXT,
ADD COLUMN gen5_maternal_10 TEXT,
ADD COLUMN gen5_maternal_11 TEXT,
ADD COLUMN gen5_maternal_12 TEXT,
ADD COLUMN gen5_maternal_13 TEXT,
ADD COLUMN gen5_maternal_14 TEXT,
ADD COLUMN gen5_maternal_15 TEXT,
ADD COLUMN gen5_maternal_16 TEXT;