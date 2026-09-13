export const hasRole=(role:string|null|undefined,allowed:string[])=>!!role&&allowed.includes(role);
