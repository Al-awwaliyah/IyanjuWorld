import { supabase } from "@/libs/supabase";
export async function listCart(limit=50){const {data,error}=await supabase.from("carts").select("*").limit(limit);if(error)throw error;return data??[];}
