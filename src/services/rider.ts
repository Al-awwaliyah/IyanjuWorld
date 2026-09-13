import { supabase } from "@/libs/supabase";
export async function listRider(limit=50){const {data,error}=await supabase.from("riders").select("*").limit(limit);if(error)throw error;return data??[];}
