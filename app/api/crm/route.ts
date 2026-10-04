import { database } from '../../../db/raw';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
const ownerId=z.string().uuid().nullable().default(null);
const customer=z.object({name:z.string().trim().min(1).max(200),contact:z.string().trim().max(200),classification:z.string().trim().max(200).default(''),email:z.union([z.literal(''),z.string().email().max(200)]),phone:z.string().max(80),status:z.enum(['Nýr','Í samtali','Virkur','Óvirkur']),ownerId,notes:z.string().max(10000)});
const id=z.string().uuid();
const taskDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v);
const change=z.discriminatedUnion('action',[
 z.object({action:z.literal('customer'),id:id.optional(),data:customer}),
 z.object({action:z.literal('interaction'),customerId:id,ownerId,kind:z.enum(['Símtal','Tölvupóstur','Fundur','Athugasemd']),sold:z.boolean().default(false),body:z.string().trim().min(1).max(10000)}),
 z.object({action:z.literal('task'),customerId:id,ownerId,title:z.string().trim().min(1).max(500),due:taskDate}),
 z.object({action:z.literal('complete'),id,done:z.boolean()}),
 z.object({action:z.literal('outcome'),id,sold:z.boolean()}),
 z.object({action:z.literal('edit-interaction'),id,customerId:id,ownerId,kind:z.enum(['Símtal','Tölvupóstur','Fundur','Athugasemd']),body:z.string().trim().min(1).max(10000),sold:z.boolean()}),
 z.object({action:z.literal('delete-interaction'),id,customerId:id}),
 z.object({action:z.literal('clear-history'),customerId:id}),
 z.object({action:z.literal('delete-customer'),id}),
 z.object({action:z.literal('employee'),id:id.optional(),name:z.string().trim().min(1).max(200),active:z.boolean().default(true)}),
 z.object({action:z.literal('assign-task'),id,ownerId}),
 z.object({action:z.literal('edit-task'),id,customerId:id,ownerId,title:z.string().trim().min(1).max(500),due:taskDate,done:z.boolean()}),
 z.object({action:z.literal('delete-task'),id,customerId:id}),
]);
export async function GET(){
 try{const db=database();const r=await db.batch([db.prepare('SELECT *,owner_id AS ownerId FROM customers ORDER BY name COLLATE NOCASE'),db.prepare('SELECT id,customer_id AS customerId,owner_id AS ownerId,kind,sold,body,created FROM interactions ORDER BY created DESC'),db.prepare('SELECT id,customer_id AS customerId,owner_id AS ownerId,title,due,done,created FROM tasks ORDER BY due,created'),db.prepare('SELECT * FROM employees ORDER BY name COLLATE NOCASE')]);return Response.json({customers:r[0].results,interactions:r[1].results,tasks:r[2].results,employees:r[3].results},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error(e);return Response.json({error:'Ekki tókst að sækja gögn. Reyndu aftur.'},{status:503});}
}
export async function POST(req:Request){
 if(req.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Óheimil beiðni.'},{status:403});
 let parsed;try{parsed=change.safeParse(await req.json());}catch{return Response.json({error:'Ógild gögn.'},{status:400});}
 if(!parsed.success)return Response.json({error:'Athugaðu að allir nauðsynlegir reitir og dagsetningar séu rétt fyllt út.'},{status:400});
 try{const v=parsed.data,db=database(),now=new Date().toISOString();let result;
 const assigned=v.action==='customer'?v.data.ownerId:('ownerId' in v?v.ownerId:null);
 if(assigned&&!await db.prepare('SELECT id FROM employees WHERE id=?').bind(assigned).first())return Response.json({error:'Starfsmaður fannst ekki. Veldu annan ábyrgðaraðila.'},{status:400});
 if(v.action==='customer'){const d=v.data;result=v.id?await db.prepare('UPDATE customers SET name=?,owner_id=?,contact=?,classification=?,email=?,phone=?,status=?,notes=? WHERE id=?').bind(d.name,d.ownerId,d.contact,d.classification,d.email,d.phone,d.status,d.notes,v.id).run():await db.prepare('INSERT INTO customers (id,name,owner_id,contact,classification,email,phone,status,notes,created) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),d.name,d.ownerId,d.contact,d.classification,d.email,d.phone,d.status,d.notes,now).run();}
 else if(v.action==='delete-customer'){const deleted=await db.batch([db.prepare('DELETE FROM tasks WHERE customer_id=?').bind(v.id),db.prepare('DELETE FROM interactions WHERE customer_id=?').bind(v.id),db.prepare('DELETE FROM customers WHERE id=?').bind(v.id)]);result=deleted[2];}
 else if(v.action==='employee')result=v.id?await db.prepare('UPDATE employees SET name=?,active=? WHERE id=?').bind(v.name,v.active?1:0,v.id).run():await db.prepare('INSERT INTO employees (id,name,active) VALUES (?,?,?)').bind(crypto.randomUUID(),v.name,v.active?1:0).run();
 else if(v.action==='edit-task')result=await db.prepare('UPDATE tasks SET title=?,due=?,owner_id=?,done=? WHERE id=? AND customer_id=?').bind(v.title,v.due,v.ownerId,v.done?1:0,v.id,v.customerId).run();
 else if(v.action==='delete-task')result=await db.prepare('DELETE FROM tasks WHERE id=? AND customer_id=?').bind(v.id,v.customerId).run();
 else if(v.action==='assign-task')result=await db.prepare('UPDATE tasks SET owner_id=? WHERE id=?').bind(v.ownerId,v.id).run();
 else if(v.action==='edit-interaction')result=await db.prepare('UPDATE interactions SET kind=?,body=?,sold=?,owner_id=? WHERE id=? AND customer_id=?').bind(v.kind,v.body,v.sold?1:0,v.ownerId,v.id,v.customerId).run();
 else if(v.action==='delete-interaction')result=await db.prepare('DELETE FROM interactions WHERE id=? AND customer_id=?').bind(v.id,v.customerId).run();
 else if(v.action==='clear-history'){if(!await db.prepare('SELECT id FROM customers WHERE id=?').bind(v.customerId).first())return Response.json({error:'Viðskiptavinur fannst ekki.'},{status:404});await db.prepare('DELETE FROM interactions WHERE customer_id=?').bind(v.customerId).run();return Response.json({ok:true});}
 else if(v.action==='outcome')result=await db.prepare('UPDATE interactions SET sold=? WHERE id=?').bind(v.sold?1:0,v.id).run();
 else if(v.action==='complete')result=await db.prepare('UPDATE tasks SET done=? WHERE id=?').bind(v.done?1:0,v.id).run();
 else{if(!await db.prepare('SELECT id FROM customers WHERE id=?').bind(v.customerId).first())return Response.json({error:'Viðskiptavinur fannst ekki.'},{status:404});
 if(v.action==='interaction')result=await db.prepare('INSERT INTO interactions (id,customer_id,kind,sold,body,owner_id,created) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),v.customerId,v.kind,v.sold?1:0,v.body,v.ownerId,now).run();
 else result=await db.prepare('INSERT INTO tasks (id,customer_id,title,due,done,owner_id,created) VALUES (?,?,?,?,0,?,?)').bind(crypto.randomUUID(),v.customerId,v.title,v.due,v.ownerId,now).run();}
 if(!result.meta.changes)return Response.json({error:'Færslan fannst ekki.'},{status:404});return Response.json({ok:true});
 }catch(e){console.error(e);return Response.json({error:'Ekki tókst að vista. Gögnin í forminu eru enn til staðar; reyndu aftur.'},{status:503});}
}
