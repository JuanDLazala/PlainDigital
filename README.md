# Plain Digital — plaindigital.co

Sitio estático (HTML/CSS/JS en un solo archivo por página). Sin build, sin dependencias.
Se despliega en Netlify desde la rama `main` de este repo.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La landing completa: portada, índice de trabajos, informe, sistema, Plain Boost y contacto |
| `thank-you.html` | Confirmación tras enviar el formulario. `noindex`. Aquí se dispara la conversión |
| `tratamiento-de-datos.html` | Política de tratamiento de datos (Ley 1581 de 2012) |
| `politica-de-privacidad.html` | Cookies, medición y recursos externos |
| `terminos-y-condiciones.html` | Condiciones de uso del sitio |
| `netlify.toml` | Publish dir, cabeceras de seguridad, caché y redirecciones |
| `robots.txt` / `sitemap.xml` | Indexación |
| `og-image.jpg` | Tarjeta al compartir el enlace (1200 × 630) |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | Iconos |
| `mp1hbo6g-Logo-Final.png` | Logo. **Pendiente reemplazar por SVG** — ver más abajo |

## Pendientes conocidos

Están marcados en el código para que sean fáciles de encontrar:

1. **Identificación legal.** Las tres páginas legales tienen `[RAZÓN SOCIAL]`, `[NIT]`,
   `[DIRECCIÓN]` y `[TELÉFONO]` sin llenar, resaltados en dorado. Buscar `[` en los
   archivos legales. **No desplegar sin llenarlos.**
2. **Medición.** En el `<head>` de `index.html` y de `thank-you.html` hay un bloque
   comentado con `G-XXXXXXXXXX` y `AW-XXXXXXXXX`. Pegar los identificadores reales de
   GA4 y Google Ads y descomentar.
3. **Logo.** El PNG actual tiene las letras recortadas contra el borde del lienzo y
   artefactos de compresión. Hace falta un SVG con margen, más una versión monocroma
   para usar a 28 px en la barra.
4. **Redes sociales.** El bloque del pie está comentado a la espera de las URL reales.
   Un enlace a `#` es peor señal que no tener el icono.

## Desarrollo local

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

El formulario de Netlify **no funciona en local**. Para probarlo:

```bash
npm install -g netlify-cli
netlify dev     # levanta en localhost:8888 con detección de formularios
```

## Deploy

Cada push a `main` dispara un deploy automático. Las ramas generan un *deploy preview*
con su propia URL — ahí se prueba antes de tocar el dominio.

```bash
git add -A
git commit -m "Descripción del cambio"
git push
```

## Formulario de contacto

Usa Netlify Forms (`data-netlify="true"`, form-name `contacto`, honeypot `bot-field`).

**Requiere que la detección de formularios esté activada en el proyecto de Netlify.**
Si está apagada, el formulario redirige a la página de gracias y el envío se pierde.

Después del primer deploy, verificar:

1. Panel del sitio → **Forms** → debe aparecer el formulario `contacto`.
2. **Forms → Settings & usage → Form notifications** → notificación por email.
3. Hacer un envío real y confirmar que llega el correo.

## Rendimiento

Sin dependencias externas salvo Google Fonts (Archivo + IBM Plex Sans + IBM Plex Mono).
Si en algún momento se busca eliminar esa dependencia, la ruta es autoalojar los `.woff2`
con `@font-face` y `font-display: swap`.
