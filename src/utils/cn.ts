import { clsx, type ClassValue } from "clsx"; import { twMerge } from "tailwind-merge"; export const cn=(...v:ClassValue[])=>twMerge(clsx(v)); export default cn;
