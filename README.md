# Plain Digital — Landing

Sitio estático (HTML/CSS/JS) con formulario de contacto vía Netlify Forms.

## Archivos clave

- `index.html` — landing principal
- `thank-you.html` — página de confirmación tras envío del formulario
- `netlify.toml` — configuración de Netlify (publish dir, headers de seguridad)
- `mp1hbo6g-Logo-Final.png` — logo

## Deploy: GitHub + Netlify (paso a paso)

### 1) Crear el repo en GitHub

Desde la carpeta `Web/`, abrir terminal (PowerShell o Git Bash) y correr:

```bash
git init
git add .
git commit -m "Initial commit: Plain Digital landing"
git branch -M main
```

Luego crea el repo en https://github.com/new (público o privado, sin README).
GitHub te mostrará dos comandos — corre los que dicen "…or push an existing repository":

```bash
git remote add origin https://github.com/<tu-usuario>/<nombre-repo>.git
git push -u origin main
```

### 2) Conectar Netlify

1. Entra a https://app.netlify.com/start
2. Elige **Import from Git** → **GitHub** → autoriza Netlify
3. Selecciona el repo que acabas de crear
4. Configuración de build:
   - **Branch to deploy:** `main`
   - **Build command:** (vacío — es un sitio estático)
   - **Publish directory:** `.` (raíz)
5. Click **Deploy site**

En 30–60 segundos tendrás una URL `random-name-12345.netlify.app`.

### 3) Activar Netlify Forms

Netlify detecta el formulario automáticamente al hacer el primer deploy (lo encuentra en `index.html` por el atributo `data-netlify="true"`).

Para verificar:

1. Dashboard del sitio → **Forms**
2. Deberías ver un formulario llamado **contacto**
3. **Forms → Settings & usage → Form notifications → Add notification**
   - Email notification → ingresa tu email (ej: `jdavid.lazala@gmail.com`)
   - Asegúrate de seleccionar el form "contacto"

### 4) Cambiar el dominio (opcional)

**Dominio gratis Netlify:**
- Site configuration → Change site name → `plaindigital` → quedará `plaindigital.netlify.app`

**Dominio propio (ej. plain.digital):**
- Domain management → Add custom domain → seguir instrucciones DNS

### 5) Iteración futura

Cada cambio que pushees a `main` en GitHub disparará un deploy automático.

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

## Integración WhatsApp (siguiente fase)

Para enviar leads a WhatsApp automáticamente:

1. Crear cuenta en https://zapier.com o https://make.com
2. Trigger: **Netlify → New Form Submission**
3. Action: **WhatsApp Business Cloud API** o **Twilio WhatsApp** → enviar mensaje al número de Plain Digital con los datos del lead

## Probar el form en local

Netlify Forms solo funciona en deploy (no en `file://` local). Para probar:

```bash
# Instalar Netlify CLI una sola vez
npm install -g netlify-cli

# Desde la carpeta del proyecto
netlify dev
```

Esto levanta el sitio en `localhost:8888` con detección de formularios habilitada.
