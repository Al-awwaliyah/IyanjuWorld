import { supabase } from "@/libs/supabase";
export async function listPayments(limit=50){const {data,error}=await supabase.from("payment_transactions").select("*").limit(limit);if(error)throw error;return data??[];}
