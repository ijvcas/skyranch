-- Add pedigree_max_generation column to animals table
ALTER TABLE animals 
ADD COLUMN pedigree_max_generation integer DEFAULT 5 NOT NULL 
CHECK (pedigree_max_generation >= 1 AND pedigree_max_generation <= 5);

COMMENT ON COLUMN animals.pedigree_max_generation IS 
'Maximum pedigree generation depth for this animal (1-5). Indicates how many generations are actually known/relevant. Used to optimize UI display and backup exports.';