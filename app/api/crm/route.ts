import { database } from '../../../db/raw';
import { z } from 'zod';
import { customerInput } from '../../../lib/customer-input';
export const dynamic = 'force-dynamic';
const ownerId=z.string().uuid().nullable().default(null);
const customer=customerInput;
const id=z.string().uuid();
const taskDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v);
const change=z.discriminatedUnion('action',[
 z.object({action:z.literal('product'),name:z.string().trim().min(1).max(200)}),
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
 try{const db=database();const r=await db.batch([db.prepare('SELECT *,owner_id AS ownerId,national_id AS nationalId,invoice_numbers AS invoiceNumbers,purchase_notes AS purchaseNotes,payday_url AS paydayUrl FROM customers ORDER BY name COLLATE NOCASE'),db.prepare('SELECT id,customer_id AS customerId,owner_id AS ownerId,kind,sold,body,created FROM interactions ORDER BY created DESC'),db.prepare('SELECT id,customer_id AS customerId,owner_id AS ownerId,title,due,done,created FROM tasks ORDER BY due,created'),db.prepare('SELECT * FROM employees ORDER BY name COLLATE NOCASE'),db.prepare('SELECT * FROM products ORDER BY name COLLATE NOCASE'),db.prepare('SELECT customer_id AS customerId,product_id AS productId FROM customer_products'),db.prepare('SELECT *,customer_id AS customerId,invoice_number AS invoiceNumber,unit_price AS unitPrice,total_with_vat AS totalWithVat,total_without_vat AS totalWithoutVat,payday_url AS paydayUrl FROM invoice_lines ORDER BY date DESC,invoice_number DESC')]);return Response.json({customers:r[0].results,interactions:r[1].results,tasks:r[2].results,employees:r[3].results,products:r[4].results,customerProducts:r[5].results,invoiceLines:r[6].results},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error(e);return Response.json({error:'Ekki tókst að sækja gögn. Reyndu aftur.'},{status:503});}
}
export async function POST(req:Request){
 if(req.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Óheimil beiðni.'},{status:403});
 let parsed;try{parsed=change.safeParse(await req.json());}catch{return Response.json({error:'Ógild gögn.'},{status:400});}
 if(!parsed.success)return Response.json({error:'Athugaðu að allir nauðsynlegir reitir og dagsetningar séu rétt fyllt út.'},{status:400});
 try{const v=parsed.data,db=database(),now=new Date().toISOString();let result;
 const assigned=v.action==='customer'?v.data.ownerId:('ownerId' in v?v.ownerId:null);
 if(assigned&&!await db.prepare('SELECT id FROM employees WHERE id=?').bind(assigned).first())return Response.json({error:'Starfsmaður fannst ekki. Veldu annan ábyrgðaraðila.'},{status:400});
 if(v.action==='product'){
  if(await db.prepare('SELECT id FROM products WHERE name=?').bind(v.name).first())return Response.json({error:'Þessi vörutegund er þegar skráð.'},{status:409});
  await db.prepare('INSERT INTO products (id,name) VALUES (?,?)').bind(crypto.randomUUID(),v.name).run();return Response.json({ok:true});
 }
 else if(v.action==='customer'){
  const d=v.data,cid=v.id??crypto.randomUUID(),ids=Array.from(new Set(d.productIds));
  if(v.id&&!await db.prepare('SELECT id FROM customers WHERE id=?').bind(cid).first())return Response.json({error:'Viðskiptavinur fannst ekki.'},{status:404});
  for(const pid of ids)if(!await db.prepare('SELECT id FROM products WHERE id=?').bind(pid).first())return Response.json({error:'Vörutegund fannst ekki.'},{status:400});
  const q=v.id?db.prepare('UPDATE customers SET name=?,owner_id=?,contact=?,classification=?,email=?,phone=?,status=?,notes=?,address=?,national_id=?,invoice_numbers=?,purchase_notes=?,payday_url=? WHERE id=?').bind(d.name,d.ownerId,d.contact,d.classification,d.email,d.phone,d.status,d.notes,d.address,d.nationalId,d.invoiceNumbers,d.purchaseNotes,d.paydayUrl,cid):db.prepare('INSERT INTO customers (id,name,owner_id,contact,classification,email,phone,status,notes,address,national_id,invoice_numbers,purchase_notes,payday_url,created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(cid,d.name,d.ownerId,d.contact,d.classification,d.email,d.phone,d.status,d.notes,d.address,d.nationalId,d.invoiceNumbers,d.purchaseNotes,d.paydayUrl,now);
  const results=await db.batch([q,db.prepare('DELETE FROM customer_products WHERE customer_id=?').bind(cid),...ids.map(pid=>db.prepare('INSERT INTO customer_products (customer_id,product_id) VALUES (?,?)').bind(cid,pid))]);result=results[0];
 }
 else if(v.action==='delete-customer'){const deleted=await db.batch([db.prepare('DELETE FROM invoice_lines WHERE customer_id=?').bind(v.id),db.prepare('DELETE FROM customer_products WHERE customer_id=?').bind(v.id),db.prepare('DELETE FROM tasks WHERE customer_id=?').bind(v.id),db.prepare('DELETE FROM interactions WHERE customer_id=?').bind(v.id),db.prepare('DELETE FROM customers WHERE id=?').bind(v.id)]);result=deleted[deleted.length-1];}
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
