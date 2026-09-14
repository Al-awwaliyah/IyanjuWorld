import { supabase } from "@/libs/supabase";
export async function listOrders(limit=50){const {data,error}=await supabase.from("orders").select("*").limit(limit);if(error)throw error;return data??[];}
