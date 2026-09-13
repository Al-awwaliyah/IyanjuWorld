import { supabase } from "@/libs/supabase";
export async function listBusiness(limit=50){const {data,error}=await supabase.from("businesses").select("*").limit(limit);if(error)throw error;return data??[];}
