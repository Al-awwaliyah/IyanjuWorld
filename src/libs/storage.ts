import { supabase } from "./supabase";
export async function uploadFile(bucket:string,path:string,file:File){const {data,error}=await supabase.storage.from(bucket).upload(path,file,{upsert:true});if(error)throw error;return data;}
export function getPublicFileUrl(bucket:string,path:string){return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;}
