import { supabase } from "@/libs/supabase";
export async function listWallet(limit=50){const {data,error}=await supabase.from("customer_wallets").select("*").limit(limit);if(error)throw error;return data??[];}
