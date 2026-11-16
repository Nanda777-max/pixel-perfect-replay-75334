import { z } from 'zod';
export const noteSchema=z.object({name:z.string().trim().min(1).max(40),message:z.string().trim().min(1).max(280).refine(v=>!/<[^>]*>|https?:\/\//i.test(v),'Please leave a plain-text note without links.'),colour:z.enum(['sage','rose','butter']),website:z.string().max(0)});
export const NOTE_LIFETIME_DAYS=7;
export const noteIsVisible=(note:{approved:boolean;expires_at:string},now:Date)=>note.approved&&Date.parse(note.expires_at)>now.getTime();