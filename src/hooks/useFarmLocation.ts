
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FarmLocation {
  name: string;
  lat: number;
  lng: number;
}

const fetchFarmLocation = async (): Promise<FarmLocation | null> => {
  console.log("📍 Fetching main property location...");
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("is_main_property", { ascending: false })
    .order("name")
    .limit(1);

  if (error) {
    console.error("Error loading farm location:", error);
    return null;
  }

  const prop = data?.[0];
  if (!prop) return null;

  // Numeric conversions (supabase numeric may deserialize as string)
  const latNum = typeof prop.center_lat === "string" ? parseFloat(prop.center_lat) : Number(prop.center_lat);
  const lngNum = typeof prop.center_lng === "string" ? parseFloat(prop.center_lng) : Number(prop.center_lng);

  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    console.warn("Invalid property coordinates");
    return null;
  }

  return {
    name: prop.name as string,
    lat: latNum,
    lng: lngNum,
  };
};

export const useFarmLocation = () => {
  return useQuery({
    queryKey: ["farm-location"],
    queryFn: fetchFarmLocation,
    staleTime: 10 * 60 * 1000, // 10 min
  });
};
