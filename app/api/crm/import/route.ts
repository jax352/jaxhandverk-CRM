import { z } from 'zod';
import { env } from 'cloudflare:workers';
import { database } from '../../../../db/raw';
import { customerInput, invoiceLineInput } from '../../../../lib/customer-input';
export const dynamic='force-dynamic';
const input=z.object({products:z.array(z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(200)})).max(100),customers:z.array(customerInput.extend({id:z.string().uuid(),sourceKey:z.string().min(1).max(500)})).max(1000),invoiceLines:z.array(invoiceLineInput).max(5000)});
// Stable source UUIDs make retries safe and preserve later edits.
export async function POST(req:Request){
 // The public UI never receives this one-off administrative import secret.
 // With no configured secret the import route is disabled entirely.
 if(!env.CRM_IMPORT_TOKEN||req.headers.get('x-crm-import-token')!==env.CRM_IMPORT_TOKEN)return Response.json({error:'Innflutningur krefst sérstaks aðgangs.'},{status:403});
 if(req.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Óheimil beiðni.'},{status:403});
 let parsed;try{parsed=input.safeParse(await req.json())}catch{return Response.json({error:'Ógild innflutningsgögn.'},{status:400})}
 if(!parsed.success)return Response.json({error:'Innflutningsgögn standast ekki yfirferð.',details:parsed.error.flatten()},{status:400});
 try{
  const db=database(),v=parsed.data,now=new Date().toISOString();let customersCreated=0,linesCreated=0;
  for(const p of v.products){const prior=await db.prepare('SELECT id FROM products WHERE name=?').bind(p.name).first<{id:string}>();if(prior&&prior.id!==p.id)return Response.json({error:'Vara með þessu nafni er þegar til með öðru auðkenni.'},{status:409});await db.prepare('INSERT INTO products (id,name) VALUES (?,?) ON CONFLICT(id) DO NOTHING').bind(p.id,p.name).run();}
  for(const c of v.customers){
   const existing=await db.prepare('SELECT id FROM customers WHERE id=? OR source_key=?').bind(c.id,c.sourceKey).first<{id:string}>();if(existing){if(existing.id!==c.id)return Response.json({error:'Viðskiptavinur er þegar til með öðru auðkenni.'},{status:409});continue;}
   await db.batch([db.prepare('INSERT INTO customers (id,name,contact,classification,email,phone,status,notes,owner_id,created,address,national_id,invoice_numbers,purchase_notes,payday_url,source_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(c.id,c.name,c.contact,c.classification,c.email,c.phone,c.status,c.notes,c.ownerId,now,c.address,c.nationalId,c.invoiceNumbers,c.purchaseNotes,c.paydayUrl,c.sourceKey),...Array.from(new Set(c.productIds)).map(pid=>db.prepare('INSERT INTO customer_products (customer_id,product_id) VALUES (?,?)').bind(c.id,pid))]);customersCreated++;
  }
  for(let offset=0;offset<v.invoiceLines.length;offset+=40){const results=await db.batch(v.invoiceLines.slice(offset,offset+40).map(l=>db.prepare('INSERT INTO invoice_lines (id,customer_id,date,invoice_number,category,description,quantity,unit_price,total_with_vat,total_without_vat,discount,status,notes,payday_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(l.id,l.customerId,l.date,l.invoiceNumber,l.category,l.description,l.quantity,l.unitPrice,l.totalWithVat,l.totalWithoutVat,l.discount,l.status,l.notes,l.paydayUrl)));linesCreated+=results.reduce((sum,r)=>sum+r.meta.changes,0);}
  return Response.json({ok:true,customersCreated,linesCreated,customersSkipped:v.customers.length-customersCreated});
 }catch(e){console.error(e);return Response.json({error:'Innflutningur stöðvaðist. Má endurtaka án þess að tvítelja færslur.'},{status:503})}
}
