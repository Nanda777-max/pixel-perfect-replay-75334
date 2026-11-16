import { describe,it,expect } from 'vitest';
import { noteIsVisible,noteSchema,NOTE_LIFETIME_DAYS } from '@/lib/guestbook-schema';
import { isReady } from '@/content/types';
describe('Mindscape content and guestbook rules',()=>{
 it('expires public notes at seven days',()=>{const created=new Date('2026-11-16T00:00:00Z');const expiry=new Date(created.getTime()+NOTE_LIFETIME_DAYS*86400000).toISOString();expect(expiry).toBe('2026-11-23T00:00:00.000Z');expect(noteIsVisible({approved:true,expires_at:expiry},new Date(expiry))).toBe(false);});
 it('never displays unapproved public notes',()=>{expect(noteIsVisible({approved:false,expires_at:'2026-11-24T00:00:00Z'},new Date('2026-11-16'))).toBe(false);});
 it('rejects messages longer than 280 characters',()=>{expect(noteSchema.safeParse({name:'Visitor',message:'a'.repeat(281),colour:'sage',website:''}).success).toBe(false);});
 it('rejects the spam honeypot',()=>{expect(noteSchema.safeParse({name:'Visitor',message:'Hello',colour:'sage',website:'spam'}).success).toBe(false);});
 it('automatically recognises filled placeholder titles',()=>{expect(isReady({title:''})).toBe(false);expect(isReady({title:'My book'})).toBe(true);});
});