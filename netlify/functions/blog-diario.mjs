// Todos los días a las 12:05 a. m. (Bogotá): avisa al CRM para que marque
// como «Publicada» lo que sale hoy y refresca el blog, así el artículo del
// día aparece sin esperar a que alguien entre.
const CRM = process.env.CRM_URL || 'https://app.plaindigital.co';
const CUENTA = process.env.BLOG_ACCOUNT_ID || '873ba939-1374-4ead-ab57-5deca577f019';

export const config = { schedule: '5 5 * * *' };

export default async () => {
  const t = Date.now();
  const r1 = await fetch(`${CRM}/api/public/blog?cuenta=${CUENTA}&t=${t}`).then((r) => r.status).catch((e) => String(e));
  const r2 = await fetch(`https://plaindigital.co/blog?t=${t}`).then((r) => r.status).catch((e) => String(e));
  console.log('[blog-diario]', { crm: r1, blog: r2 });
  return new Response('ok');
};
