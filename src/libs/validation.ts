export const isValidEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isRequired=(v:unknown)=>typeof v==="string"?v.trim().length>0:v!=null;
export const validatePassword=(v:string)=>v.length>=8;
