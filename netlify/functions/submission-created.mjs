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

// Lee de dónde vino el lead (campos ocultos que llena la web con UTM/gclid/fbclid).
function origenDelLead(d) {
  const src = String(d.utm_source || '').toLowerCase();
  const med = String(d.utm_medium || '').toLowerCase();
  let canal = 'Directo / orgánico';
  let etiqueta = null;
  if (d.gclid || (src.includes('google') && /cpc|ppc|paid|ads/.test(med))) {
    canal = 'Google Ads'; etiqueta = 'Origen: Google Ads';
  } else if (d.fbclid || /facebook|instagram|meta|fb|ig/.test(src)) {
    canal = /cpc|ppc|paid|ads/.test(med) || d.fbclid ? 'Meta Ads' : 'Redes (orgánico)';
    etiqueta = canal === 'Meta Ads' ? 'Origen: Meta Ads' : 'Origen: Redes';
  } else if (src) {
    canal = `${d.utm_source}${d.utm_medium ? ' / ' + d.utm_medium : ''}`;
  } else if (/google\./.test(d.referido || '')) {
    canal = 'Google (orgánico)';
  } else if (/facebook\.|instagram\.|tiktok\./.test(d.referido || '')) {
    canal = 'Redes (orgánico)'; etiqueta = 'Origen: Redes';
  } else if (d.referido && !/plaindigital\.co/.test(d.referido)) {
    canal = 'Referido: ' + String(d.referido).replace(/^https?:\/\//, '').split('/')[0];
  }
  const clave = { 'Google Ads': 'web-google-ads', 'Meta Ads': 'web-meta-ads' }[canal] || 'web';
  return { canal, etiqueta, clave };
}

export default async (req) => {
  try {
    const { payload } = await req.json();
    if (!payload || payload.form_name !== 'contacto') return new Response('ignorado');

    const datos = payload.data || {};
    const origen = origenDelLead(datos);
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
        // Entra al embudo: origen, campos y negocio en "Nuevo lead".
        tags: ['origen-web', 'prospecto', ...(origen.etiqueta ? [origen.etiqueta] : [])],
        origen: origen.clave,
        custom_fields: {
          'Empresa': datos.empresa || '',
          'Inversión mensual en pauta': datos.inversion_mensual || '',
          'Origen': 'Formulario plaindigital.co',
          'Canal': origen.canal,
          'Campaña': datos.utm_campaign || '',
          'Palabra clave': datos.utm_term || '',
          'Anuncio': datos.utm_content || '',
        },
        // Casilla opcional del formulario: permiso para difusiones por WhatsApp.
        ...(datos.autorizacion_difusiones === 'Si'
          ? {
              whatsapp_permiso: {
                estado: 'si',
                fuente: 'formulario plaindigital.co',
                texto: 'Quiero recibir por WhatsApp contenidos, invitaciones y novedades de Plain Digital. Es opcional y me puedo dar de baja cuando quiera respondiendo BAJA.',
              },
            }
          : {}),
        // Casilla opcional: permiso para correos (Brevo). Solo si dejó correo.
        ...(datos.autorizacion_correos === 'Si' && datos.email
          ? {
              email_permiso: {
                estado: 'si',
                fuente: 'formulario plaindigital.co',
                texto: 'Quiero recibir por correo contenidos, invitaciones y novedades de Plain Digital. Es opcional y me puedo dar de baja cuando quiera desde el enlace que trae cada correo.',
              },
            }
          : {}),
        deal: {
          title: `Web · ${(datos.empresa || datos.nombre || 'Prospecto').slice(0, 80)}`,
          notes: [
            `Qué vende: ${datos.que_vende || '—'}`,
            `Inversión mensual en adquisición: ${datos.inversion_mensual || '—'}`,
            `Autorizó tratamiento de datos y contacto por WhatsApp para responder esta solicitud: ${datos.autorizacion_datos === 'Si' ? 'sí' : 'no consta'} (formulario web, ${new Date().toISOString().slice(0, 10)})`,
            `Autorizó difusiones por WhatsApp: ${datos.autorizacion_difusiones === 'Si' ? 'sí' : 'no'}`,
            `Autorizó correos: ${datos.autorizacion_correos === 'Si' && datos.email ? 'sí' : 'no'}`,
            '',
            `Canal: ${origen.canal}`,
            ...[
              ['Campaña', datos.utm_campaign], ['Palabra clave', datos.utm_term], ['Anuncio', datos.utm_content],
              ['utm_source', datos.utm_source], ['utm_medium', datos.utm_medium],
              ['gclid', datos.gclid], ['fbclid', datos.fbclid],
              ['Página de entrada', datos.pagina_entrada], ['Llegó desde', datos.referido],
            ].filter(([, v]) => v).map(([k, v]) => `${k}: ${String(v).slice(0, 200)}`),
          ].join('\n'),
        },
      }),
    });
    console.log('[lead] CRM respondió', r.status);

    // Primer mensaje por WhatsApp con la plantilla aprobada (utilidad), solo si
    // autorizó el contacto por WhatsApp para responder la solicitud. Si la
    // plantilla aún no está aprobada, Meta la rechaza y el lead igual queda en el CRM.
    if (datos.autorizacion_datos === 'Si') {
      const primerNombre = String(datos.nombre || '').trim().split(/\s+/)[0] || 'hola';
      try {
        const m = await fetch(`${CRM_URL}/api/v1/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.CRM_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: telefono,
            type: 'template',
            template: { name: 'diagnostico_web_recibido', language: 'es', params: [primerNombre.slice(0, 40)] },
          }),
        });
        console.log('[lead] plantilla WhatsApp', m.status, m.ok ? '' : (await m.text()).slice(0, 300));
      } catch (e) {
        console.error('[lead] no se pudo enviar la plantilla', e);
      }
    }
    return new Response('ok');
  } catch (e) {
    console.error('[lead] error', e);
    return new Response('error', { status: 500 });
  }
};
