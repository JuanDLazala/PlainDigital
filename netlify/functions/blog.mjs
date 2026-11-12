// ============================================================
// Blog de Plain Digital — columna «Sin cuentos».
//
// Los artículos se escriben y aprueban en el CRM (Contenidos ›
// Orgánico › Blog). Esta función los pide a la API pública del CRM
// y arma el HTML en el servidor, así Google ve la página completa.
// Un artículo aparece solo cuando está aprobado y llegó su fecha.
//
//   /blog              → portada de la columna
//   /blog/<slug>       → artículo
//   /blog/sitemap.xml  → mapa del sitio para Google
// ============================================================

const CRM = process.env.CRM_URL || 'https://app.plaindigital.co';
const CUENTA = process.env.BLOG_ACCOUNT_ID || '873ba939-1374-4ead-ab57-5deca577f019';
const SITIO = 'https://plaindigital.co';
const AUTOR = 'Juan Lazala';
const AUTOR_ROL = 'Fundador de Plain Digital';
const WA = 'https://wa.me/573226850142?text=CUENTO';

export const config = { path: ['/blog', '/blog/', '/blog/*'] };

const TRACKING = `<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-NHXJBLRM"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  // Conversiones por clic: WhatsApp y agenda de diagnóstico.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/wa\.me|api\.whatsapp\.com|whatsapp:/i.test(h)) {
      gtag('event', 'contacto_whatsapp', { link_url: h });
      if (window.fbq) fbq('track', 'Contact', { content_name: 'whatsapp' });
    } else if (/calendar\.google\.com\/calendar\/appointments|calendar\.app\.google/i.test(h)) {
      gtag('event', 'agendar_diagnostico', { link_url: h });
      if (window.fbq) fbq('track', 'Schedule', { content_name: 'diagnostico' });
    }
  }, true);
</script>
<!-- Meta Pixel (Plain Digital Web · 1094511603402213) -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1094511603402213');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=1094511603402213&ev=PageView&noscript=1"></noscript>
`;

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Markdown sencillo y seguro: títulos, párrafos, listas, citas,
// negrita, cursiva y enlaces. Todo se escapa antes de formatear.
function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_, t, u) => {
      const ext = u.startsWith('http') && !u.startsWith(SITIO);
      return `<a href="${u}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
    });
}
function markdown(md = '') {
  const out = [];
  let lista = null;
  let parrafo = [];
  const cerrarP = () => { if (parrafo.length) { out.push(`<p>${inline(parrafo.join(' '))}</p>`); parrafo = []; } };
  const cerrarL = () => { if (lista) { out.push(`</${lista}>`); lista = null; } };
  for (const raw of md.replace(/\r/g, '').split('\n')) {
    const l = raw.trim();
    let m;
    if (!l) { cerrarP(); cerrarL(); continue; }
    if ((m = l.match(/^(#{2,4})\s+(.*)$/))) { cerrarP(); cerrarL(); const n = m[1].length; out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
    if (/^#\s+/.test(l)) { cerrarP(); cerrarL(); continue; } // el H1 lo pone la plantilla
    if ((m = l.match(/^>\s?(.*)$/))) { cerrarP(); cerrarL(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    if ((m = l.match(/^[-*]\s+(.*)$/))) { cerrarP(); if (lista !== 'ul') { cerrarL(); out.push('<ul>'); lista = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if ((m = l.match(/^\d+[.)]\s+(.*)$/))) { cerrarP(); if (lista !== 'ol') { cerrarL(); out.push('<ol>'); lista = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    cerrarL();
    parrafo.push(l);
  }
  cerrarP(); cerrarL();
  return out.join('\n');
}

const fecha = (d) => new Date(d + 'T12:00:00-05:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
const minutos = (md = '') => Math.max(2, Math.round(md.split(/\s+/).length / 220));

const CSS = `
:root{--bg:oklch(14.5% 0 0);--fg:#fff;--muted:oklch(70.6% 0 0);--border:color-mix(in oklch,var(--bg),#fff 12%);--surface:color-mix(in oklch,var(--bg),#fff 5%);--red:#D7282F;--cyan:#1F9DD0;--gold:#F5C44E;--fd:'Archivo',Arial,sans-serif;--fb:'IBM Plex Sans',Arial,sans-serif;--fm:'IBM Plex Mono',Consolas,monospace;--wrap:clamp(24px,5.5vw,96px)}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:var(--fb);font-size:18px;line-height:1.7;background:var(--bg);color:var(--muted);-webkit-font-smoothing:antialiased}
a{color:var(--fg)}h1,h2,h3,h4{font-family:var(--fd);color:var(--fg);letter-spacing:-.02em;line-height:1.05;text-wrap:balance}
.nav{position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid oklch(90% 0 0)}.nav-in{max-width:1200px;margin:0 auto;padding:14px var(--wrap);display:flex;align-items:center;justify-content:space-between;gap:16px}
.nav img{height:34px;display:block}.nav nav{display:flex;gap:22px;align-items:center}.nav nav a{color:oklch(22% 0 0);font-family:var(--fm);font-size:12px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none}
.nav .cta{background:oklch(22% 0 0);color:#fff;padding:9px 14px}
.wrap{max-width:760px;margin:0 auto;padding:clamp(48px,9vh,96px) var(--wrap)}
.eyebrow{font-family:var(--fm);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}.eyebrow b{color:var(--red);font-weight:500}
.bar{display:flex;height:6px}.bar i{flex:1}
h1.col{font-size:clamp(56px,10vw,120px);font-weight:900;margin:18px 0 12px}h1.col span{color:var(--red)}
.lead{font-size:20px;max-width:56ch}
.lista{margin-top:48px;border-top:1px solid var(--border)}.item{display:block;padding:28px 0;border-bottom:1px solid var(--border);text-decoration:none}
.item h2{font-size:clamp(26px,3.4vw,36px);font-weight:900;margin:8px 0}.item p{color:var(--muted)}.item:hover h2{color:var(--gold)}
.vacio{margin-top:48px;padding:28px;border:1px dashed var(--border)}
article h1{font-size:clamp(38px,6vw,64px);font-weight:900;margin:16px 0 18px}
.firma{display:flex;gap:10px;flex-wrap:wrap;font-family:var(--fm);font-size:12px;letter-spacing:.1em;text-transform:uppercase;padding-bottom:28px;border-bottom:1px solid var(--border);margin-bottom:36px}.firma b{color:var(--fg);font-weight:500}
.cuerpo h2{font-size:30px;font-weight:900;margin:44px 0 14px}.cuerpo h3{font-size:22px;font-weight:700;margin:32px 0 10px}
.cuerpo p,.cuerpo ul,.cuerpo ol{margin:0 0 20px}.cuerpo ul,.cuerpo ol{padding-left:22px}.cuerpo li{margin-bottom:8px}.cuerpo strong{color:var(--fg)}
.cuerpo a{color:var(--cyan)}.cuerpo blockquote{border-left:4px solid var(--red);padding:6px 0 6px 20px;margin:28px 0;font-family:var(--fd);font-size:26px;line-height:1.25;color:var(--fg)}
.box{margin-top:56px;padding:32px;background:var(--surface);border:1px solid var(--border)}.box h3{font-size:28px;font-weight:900;margin-bottom:10px}
.btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}.btn{display:inline-block;padding:14px 20px;font-family:var(--fd);font-weight:700;text-decoration:none}
.btn.gold{background:var(--gold);color:#0A0A0A}.btn.line{border:1px solid var(--border)}
.pie{border-top:1px solid var(--border);padding:32px var(--wrap);text-align:center;font-family:var(--fm);font-size:12px;letter-spacing:.1em;text-transform:uppercase}.pie a{margin:0 10px;text-decoration:none}
`;

function pagina({ titulo, descripcion, canonical, cuerpo, jsonld, ogImg }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
${TRACKING}
<title>${esc(titulo)}</title><meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${ogImg || SITIO + '/og-image.jpg'}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;900&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
<style>${CSS}</style></head><body>
<header class="nav"><div class="nav-in"><a href="/" aria-label="Plain Digital — inicio"><img src="/mp1hbo6g-Logo-Final.png" alt="Plain Digital"></a>
<nav aria-label="Navegación"><a href="/blog">Blog</a><a href="/#contacto" class="cta">Diagnóstico gratis</a></nav></div></header>
<div class="bar" aria-hidden="true"><i style="background:#1F9DD0"></i><i style="background:#2C5F7D"></i><i style="background:#D7282F"></i><i style="background:#F5C44E"></i></div>
<main>${cuerpo}</main>
<footer class="pie"><a href="/">plaindigital.co</a><a href="/politica-de-privacidad.html">Privacidad</a><a href="mailto:hablemos@plaindigital.co">hablemos@plaindigital.co</a></footer>
</body></html>`;
}

const cajaDiagnostico = `<aside class="box"><p class="eyebrow">Sin cuentos</p><h3>¿Dónde se te está perdiendo la plata?</h3>
<p>Diagnóstico gratis de 30 minutos, los viernes. Sales sabiendo qué arreglar, aunque no trabajes con nosotros.</p>
<div class="btns"><a class="btn gold" href="/#contacto">Agendar diagnóstico</a><a class="btn line" href="${WA}">Escríbenos CUENTO por WhatsApp</a></div></aside>`;

async function crm(params) {
  const r = await fetch(`${CRM}/api/public/blog?cuenta=${CUENTA}${params}`, { headers: { accept: 'application/json' } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('CRM ' + r.status);
  return r.json();
}

const HTML = { 'content-type': 'text/html; charset=utf-8', 'Netlify-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400', 'Cache-Control': 'public, max-age=0, must-revalidate' };

export default async (req) => {
  const ruta = new URL(req.url).pathname.replace(/\/+$/, '') || '/blog';
  try {
    if (ruta === '/blog/sitemap.xml') {
      const { articulos } = await crm('');
      const urls = [`<url><loc>${SITIO}/blog</loc></url>`, ...articulos.map((a) => `<url><loc>${SITIO}/blog/${a.slug}</loc><lastmod>${a.fecha_programada}</lastmod></url>`)];
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`, { headers: { ...HTML, 'content-type': 'application/xml; charset=utf-8' } });
    }

    if (ruta === '/blog') {
      const { articulos } = await crm('');
      const lista = articulos.length
        ? `<div class="lista">${articulos.map((a) => `<a class="item" href="/blog/${a.slug}"><span class="eyebrow">${fecha(a.fecha_programada)}${a.categoria ? ' <b>·</b> ' + esc(a.categoria) : ''}</span><h2>${esc(a.titulo.replace(/^Columna Sin cuentos #\d+ · /, ''))}</h2><p>${esc(a.meta_description || a.gancho || '')}</p></a>`).join('')}</div>`
        : `<p class="vacio">El primer artículo sale muy pronto.</p>`;
      const cuerpo = `<div class="wrap"><p class="eyebrow">La columna de ${AUTOR} <b>·</b> Plain Digital</p><h1 class="col">Sin cuentos<span>.</span></h1>
<p class="lead">Pauta, ventas y marketing contados sin humo: lo que funciona, lo que no y cuánto cuesta de verdad conseguir un cliente.</p>${lista}${cajaDiagnostico}</div>`;
      return new Response(pagina({
        titulo: 'Sin cuentos · La columna de Juan Lazala | Plain Digital',
        descripcion: 'Columna de Juan Lazala sobre pauta digital, ventas y marketing para empresas en Colombia, sin humo ni jerga.',
        canonical: `${SITIO}/blog`, cuerpo,
        jsonld: { '@context': 'https://schema.org', '@type': 'Blog', name: 'Sin cuentos', url: `${SITIO}/blog`, author: { '@type': 'Person', name: AUTOR }, publisher: { '@type': 'Organization', name: 'Plain Digital', url: SITIO } },
      }), { headers: HTML });
    }

    const slug = ruta.slice('/blog/'.length);
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) return Response.redirect(`${SITIO}/blog`, 301);
    const data = await crm(`&slug=${slug}`);
    if (!data) {
      return new Response(pagina({ titulo: 'Artículo no encontrado | Plain Digital', descripcion: '', canonical: `${SITIO}/blog`,
        cuerpo: `<div class="wrap"><h1 class="col">Ese cuento no existe<span>.</span></h1><p class="lead"><a href="/blog">Ver todos los artículos</a></p></div>` }), { status: 404, headers: HTML });
    }
    const a = data.articulo;
    const titulo = a.titulo.replace(/^Columna Sin cuentos #\d+ · /, '');
    const url = `${SITIO}/blog/${a.slug}`;
    const cuerpo = `<div class="wrap"><article><p class="eyebrow"><a href="/blog" style="text-decoration:none">Sin cuentos</a> <b>·</b> ${fecha(a.fecha_programada)}</p>
<h1>${esc(titulo)}</h1><p class="firma"><span>Por <b>${AUTOR}</b></span><span>${AUTOR_ROL}</span><span>${minutos(a.cuerpo_md)} min de lectura</span></p>
<div class="cuerpo">${markdown(a.cuerpo_md)}</div></article>${cajaDiagnostico}</div>`;
    return new Response(pagina({
      titulo: a.meta_title || `${titulo} | Plain Digital`, descripcion: a.meta_description || a.gancho || '', canonical: url, cuerpo, ogImg: a.asset_url,
      jsonld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: titulo, description: a.meta_description || '', datePublished: a.fecha_programada,
        dateModified: (a.updated_at || a.fecha_programada).slice(0, 10), mainEntityOfPage: url, image: a.asset_url || `${SITIO}/og-image.jpg`,
        author: { '@type': 'Person', name: AUTOR, jobTitle: AUTOR_ROL }, publisher: { '@type': 'Organization', name: 'Plain Digital', logo: { '@type': 'ImageObject', url: `${SITIO}/favicon-512.png` } }, keywords: a.palabra_clave_seo || undefined },
    }), { headers: HTML });
  } catch (e) {
    console.error('[blog]', e);
    return new Response(pagina({ titulo: 'Blog | Plain Digital', descripcion: '', canonical: `${SITIO}/blog`,
      cuerpo: `<div class="wrap"><h1 class="col">Vuelve en un momento<span>.</span></h1><p class="lead">No pudimos cargar el blog. Intenta de nuevo.</p></div>` }), { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
};
