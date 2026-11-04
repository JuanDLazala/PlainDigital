// Netlify ejecuta esta función sola cada vez que llega un envío válido
// (ya filtrado de spam) de un formulario de Netlify Forms.
// Crea el prospecto como contacto en el CRM de Plain Digital (app.plaindigital.co).
// Requiere la variable de entorno CRM_API_KEY (clave de API del CRM con permiso contacts:write).

const CRM_URL = process.env.CRM_URL || 'https://app.plaindigital.co';

function normalizarTelefono(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('3')) d = '57' + d; // celular colombiano sin indicativo
  return d.length >= 8 ? '+' + d : null;
}

export default async (req) => {
  try {
    const { payload } = await req.json();
    if (!payload || payload.form_name !== 'contacto') return new Response('ignorado');

    const datos = payload.data || {};
    const telefono = normalizarTelefono(datos.whatsapp);
    if (!telefono) {
      console.log('[lead] envío sin WhatsApp válido; queda solo en Netlify Forms');
      return new Response('sin telefono');
    }
    if (!process.env.CRM_API_KEY) {
      console.error('[lead] falta CRM_API_KEY');
      return new Response('sin clave', { status: 500 });
    }

    const r = await fetch(`${CRM_URL}/api/v1/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CRM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: telefono,
        name: (datos.nombre || '').slice(0, 120) || undefined,
        email: datos.email ? String(datos.email).slice(0, 160) : undefined,
        company: (datos.empresa || '').slice(0, 160) || undefined,
      }),
    });
    console.log('[lead] CRM respondió', r.status);
    return new Response('ok');
  } catch (e) {
    console.error('[lead] error', e);
    return new Response('error', { status: 500 });
  }
};
