-- Create storage buckets for farm media
INSERT INTO storage.buckets (id, name, public) VALUES ('farm-logos', 'farm-logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('farm-pictures', 'farm-pictures', true);

-- Create farm_profiles table
CREATE TABLE public.farm_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_name text NOT NULL,
  description text,
  logo_url text,
  picture_url text,
  location_name text,
  location_coordinates text,
  address text,
  contact_email text,
  contact_phone text,
  website text,
  established_year integer,
  farm_type text,
  total_area_hectares numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on farm_profiles
ALTER TABLE public.farm_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for farm_profiles
CREATE POLICY "Anyone can view farm profiles" 
ON public.farm_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage farm profiles" 
ON public.farm_profiles 
FOR ALL 
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);

-- Create storage policies for farm logos
CREATE POLICY "Farm logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'farm-logos');

CREATE POLICY "Authenticated users can upload farm logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'farm-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update farm logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'farm-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete farm logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'farm-logos' AND auth.uid() IS NOT NULL);

-- Create storage policies for farm pictures
CREATE POLICY "Farm pictures are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'farm-pictures');

CREATE POLICY "Authenticated users can upload farm pictures" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'farm-pictures' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update farm pictures" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'farm-pictures' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete farm pictures" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'farm-pictures' AND auth.uid() IS NOT NULL);

-- Create trigger for updating updated_at
CREATE TRIGGER update_farm_profiles_updated_at
BEFORE UPDATE ON public.farm_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();