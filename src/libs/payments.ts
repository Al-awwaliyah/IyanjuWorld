import { supabase } from "./supabase";
export async function getPaymentTransaction(id:string){const {data,error}=await supabase.from("payment_transactions").select("*").eq("id",id).maybeSingle();if(error)throw error;return data;}
