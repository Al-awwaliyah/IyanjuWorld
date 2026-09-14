import { supabase } from "@/libs/supabase";
export async function listMessaging(limit=50){const {data,error}=await supabase.from("messages").select("*").limit(limit);if(error)throw error;return data??[];}
