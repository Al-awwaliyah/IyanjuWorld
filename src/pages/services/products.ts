import { supabase } from "@/libs/supabase";
export async function listProducts(limit=50){const {data,error}=await supabase.from("products").select("*").limit(limit);if(error)throw error;return data??[];}
