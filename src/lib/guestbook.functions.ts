import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { noteSchema } from './guestbook-schema';
export const pinNote=createServerFn({method:'POST'}).inputValidator(noteSchema).handler(async({data})=>{
 const ip=getRequestHeader('cf-connecting-ip')??getRequestHeader('x-real-ip')??'unknown';
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip+':'+(process.env['SUPABASE_SERVICE_ROLE_KEY']??'')));
 const key=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const {data:allowed,error:limitError}=await supabaseAdmin.rpc('claim_submission',{key});
 if(limitError||!allowed)return {ok:false,message:'Please wait ten minutes before leaving another note.'};
 const {error}=await supabaseAdmin.from('guestbook_notes').insert({name:data.name,message:data.message,colour:data.colour});
 return error?{ok:false,message:'Your note could not be saved. Please try again later.'}:{ok:true,message:'Your note is pinned for review. It will appear after approval, for seven days from today.'};
});