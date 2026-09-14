import { supabase } from "@/libs/supabase";
export async function listAdmin(limit=50){const {data,error}=await supabase.from("audit_logs").select("*").limit(limit);if(error)throw error;return data??[];}
