import { supabase } from "@/libs/supabase";
export async function listRefunds(limit=50){const {data,error}=await supabase.from("refunds").select("*").limit(limit);if(error)throw error;return data??[];}
