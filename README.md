# 🦊 FoxdiOS — el portfolio de Foxdi

Un portfolio con forma de sistema operativo estilo **Frutiger Aero** (Vista / 7 con toques de XP).
Todo funciona en el navegador, sin servidor: se puede publicar gratis y queda online 24/7.

---

## 🚀 Uso rápido

```bash
npm install        # solo la primera vez
npm run dev        # abre http://localhost:5173 y se recarga sola al cambiar archivos
npm run build      # genera la web final en la carpeta dist/
```

> Mientras `npm run dev` está corriendo, **agregar, borrar o editar cualquier archivo de `contenido/` recarga la web sola**.

---

## 📁 Cómo está organizado

```
contenido/          ← TU "disco duro". Aquí agregas fotos, textos, webs, música, enlaces…
src/
  sistema/          ← el "sistema operativo": ventanas, escritorio, barra de tareas, sonidos…
  apps/             ← programas: explorador, visor de fotos, lector, navegador, música, configuración
  asistente/        ← Foxdi, el asistente
  widgets/          ← gadgets (reloj, calendario, puzzle…)
  movil/            ← modo celular (solo se descarga si alguien lo activa)
  i18n/             ← textos de la interfaz: en.ts (inglés, principal) y es.ts (español)
scripts/            ← el escáner que lee contenido/ y crea las miniaturas
foxdios.config.json ← configuración general (miniaturas, Foxdi, Cloudflare R2)
```

---

## ➕ Agregar contenido (sin tocar código)

Solo pones archivos dentro de `contenido/`. El escáner los detecta, los ordena y crea miniaturas livianas de las fotos.
Para el explorador, **cada carpeta de `contenido/` es una carpeta de verdad**.

| Tipo | Formatos | Se abre con |
| --- | --- | --- |
| Imagen | `.png .jpg .jpeg .webp .gif .avif` | Visor de fotos (primero la miniatura, luego la original en máxima calidad) |
| Documento | `.md` (Markdown) y `.txt` | Lector de documentos |
| PDF | `.pdf` | Lector (con botón de descarga) |
| Audio | `.mp3 .ogg .wav .m4a .flac` | Reproductor Aero |
| Enlace | `.json` dentro de una carpeta de enlaces | Pestaña nueva del navegador del visitante |
| Web | una carpeta con `index.html` dentro de una carpeta de webs | Navegador AeroNet |

Los archivos y carpetas que empiezan con `_` o `.` no se muestran (sirven para configuración).

### ⚙️ Configurar una carpeta: `_carpeta.json`

Cada carpeta puede tener un `_carpeta.json` (todo es opcional):

```json
{
  "nombre": { "en": "Pictures", "es": "Imágenes" },
  "icono": "fotos",
  "acepta": ["imagen"],
  "orden": "nombre",
  "escritorio": true,
  "puzzle": true,
  "fondos": false,
  "oculta": false,
  "vista": "iconos",
  "prioridad": 1
}
```

- **nombre**: nombre que se ve (traducido). Si no lo pones, se usa el nombre real de la carpeta.
- **icono**: `fotos`, `arte`, `documentos`, `musica`, `enlaces`, `webs`, `trabajo`, `proyectos`, `papelera`.
- **acepta**: qué tipos de archivo acepta (`imagen`, `documento`, `pdf`, `audio`). Si alguien mete otra cosa, se ignora y sale un aviso en la consola.
- **orden**: `nombre`, `nombre-desc`, `fecha` o `fecha-desc` (la fecha sale del documento, ver abajo). Para ordenar fotos usa nombres como `001-dibujo.png`, `002-dibujo.png`…
- **escritorio**: muestra la carpeta también como icono en el escritorio.
- **puzzle**: las imágenes de esta carpeta se usan en el rompecabezas.
- **fondos**: las imágenes se ofrecen como fondo de pantalla en Configuración.
- **oculta**: no aparece en el explorador.
- **tipo**: `"enlaces"`, `"webs"` o `"musica"` para carpetas especiales.
- **prioridad**: para ordenar las carpetas (menor = primero).

`acepta`, `orden`, `tipo`, `puzzle`, `fondos` y `vista` **se heredan** a las subcarpetas. Ejemplo: `Fotos/` acepta solo imágenes, así que `Fotos/Furry/` también.

**Ejemplo:** crear la carpeta `contenido/Fotos/Furry/` y meter `furry1.jpg` adentro. Listo, aparece sola.

### 📝 Documentos en dos idiomas

- `sobre-mi.md` → versión principal (inglés)
- `sobre-mi.es.md` → versión en español (opcional)

El lector muestra el idioma que eligió el visitante y tiene botones para cambiar. Arriba del documento puedes poner datos:

```markdown
---
titulo: Frontend Developer — Example Company
fecha: 2024-03
---
# El texto empieza aquí
```

`titulo` es lo que se ve en la ventana y `fecha` sirve para ordenar (por ejemplo la experiencia laboral, de la más nueva a la más vieja).

**Enlaces mágicos dentro de los documentos:** `[Ver mi arte](app:carpeta?ruta=Fotos/Arte)` se ve como un botón brillante que abre esa carpeta.
También sirven `app:navegador`, `app:musica`, `app:configuracion` y `app:archivo?ruta=Documentos/cv.pdf`.

### 👋 Ventana de bienvenida

Edita `contenido/Bienvenida/bienvenida.md` (inglés) y `bienvenida.es.md` (español).
Arriba puedes poner `nombre`, `subtitulo` y `cv` (por ejemplo `cv: Documentos/cv.pdf`). Si pones `cv`, aparece un botón verde **"Descargar mi CV"**.

### 🔗 Enlaces

En `contenido/Enlaces/` crea un `.json` por enlace:

```json
{
  "nombre": "YouTube",
  "logo": "iconos/youtube.png",
  "link": "https://youtube.com/@tucanal",
  "descripcion": { "en": "My videos", "es": "Mis videos" },
  "mostrar": ["escritorio", "explorador"]
}
```

- **logo**: ruta a la imagen dentro de la carpeta de enlaces. Si no lo pones, se busca una imagen con el mismo nombre que el `.json` (`youtube.json` → `youtube.png`).
- **mostrar**: dónde aparece: `"escritorio"`, `"explorador"` o los dos.

### 🌐 Webs para el navegador AeroNet

En `contenido/Webs/` crea una carpeta por web, con su `index.html`, CSS, JS e imágenes, y un `_web.json`:

```json
{
  "dominio": "zorros.com",
  "titulo": { "en": "All about foxes", "es": "Todo sobre zorros" },
  "descripcion": { "en": "Fun facts", "es": "Datos curiosos" },
  "icono": "icono.svg"
}
```

- El visitante la abre desde la lista del portal o escribiendo `zorros.com` en la barra de direcciones.
- ⚠️ **Dentro de tus webs usa rutas relativas**: `src="img/foto.png"`, **no** `src="/img/foto.png"`.
- Cada web corre aislada (sandbox): no puede romper el portfolio. Por eso no puede usar `localStorage`.

### 🎵 Música

Pon archivos de audio en `contenido/Musica/`. El título sale del nombre del archivo: `Artista - Título.mp3`.
O agrega un `.json` con el mismo nombre: `{ "titulo": "...", "artista": "..." }`.
**Usa música tuya o libre de derechos.** La canción de ejemplo `Foxdi - Aero Dreams.wav` es original (generada por código), cámbiala cuando tengas la tuya.
Consejo: usa `.mp3` u `.ogg`, que pesan mucho menos que `.wav`.

### 🦊 Foxdi (el asistente)

- **Frases:** `contenido/Asistente/frases.json`. Hay tres listas: `bienvenida`, `alHacerClick` e `inactividad`. Cada frase lleva `en` y `es`. Agrega todas las que quieras, salen al azar.
- **Tiempo de inactividad:** en `foxdios.config.json`, `asistente.segundosInactividad` (por defecto 120 = 2 minutos).
- **Expresiones de PNGtuber:** reemplaza estos 4 archivos de `contenido/Asistente/` (por ahora los 4 son la misma imagen):

| Archivo | Cuándo se usa |
| --- | --- |
| `ojos-abiertos-boca-cerrada.png` | Normal (en reposo) |
| `ojos-abiertos-boca-abierta.png` | Hablando |
| `ojos-cerrados-boca-cerrada.png` | Parpadeando |
| `ojos-cerrados-boca-abierta.png` | Parpadea mientras habla |

Usa PNG con fondo transparente y **el mismo tamaño de lienzo en las 4** (ahora es 1000×1000, con el personaje tocando el borde de abajo). También sirven `.webp` o `.gif` con el mismo nombre.

---

## 🛠️ Cambios que sí son de código (fáciles)

- **Iconos del escritorio** (orden y placeholders): `src/sistema/escritorio/elementos.ts`
- **Textos de la interfaz**: `src/i18n/en.ts` (inglés) y `src/i18n/es.ts` (español)
- **Fondos integrados**: `src/sistema/fondo/Fondo.tsx` + `fondo.css`. O sin código: pon imágenes en `contenido/Fotos/Fondos/`.
- **Nueva app**: crea `src/apps/miApp/MiApp.tsx` y regístrala en `src/apps/registro.ts`.
- **Nuevo gadget**: crea un componente en `src/widgets/` y agrégalo a `GADGETS` en `BarraWidgets.tsx`.

---

## ☁️ Publicar gratis 24/7

### 1. Subir el código a GitHub
1. Crea un repositorio vacío en [github.com/new](https://github.com/new) (por ejemplo `foxdios`).
2. En esta carpeta:

```bash
git init
git add .
git commit -m "Primera versión de FoxdiOS"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/foxdios.git
git push -u origin main
```

### 2. Conectar Cloudflare Pages (recomendado: ancho de banda ilimitado)
1. Entra a [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Elige tu repositorio.
3. Configuración:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Save and Deploy**. Te da una URL gratis tipo `foxdios.pages.dev`.

A partir de ahí, **cada `git push` publica la web sola** en uno o dos minutos.

> Límite de Cloudflare Pages: 25 MB por archivo. Para fotos o canciones más pesadas, usa R2 (abajo).

**Alternativa (la que usamos ahora): GitHub Pages.** Ya está configurada en `.github/workflows/publicar.yml`: cada `git push` a `main` compila la web y la publica en `https://yaffaromarozil.github.io/foxdios/`.
Solo hay que activarla una vez en el repo: **Settings → Pages → Source: GitHub Actions**. El progreso de cada publicación se ve en la pestaña **Actions**.

### 3. (Más adelante) Fotos pesadas en Cloudflare R2
Cuando tengas muchas fotos y el repo se ponga pesado (GitHub recomienda menos de 1 GB):

1. En Cloudflare crea un bucket **R2** (10 GB gratis) y activa su **URL pública** (`https://pub-xxxx.r2.dev`).
2. En `foxdios.config.json`:
   ```json
   "almacenamientoExterno": { "activo": true, "urlBase": "https://pub-xxxx.r2.dev" }
   ```
3. Pon las fotos pesadas en `contenido-externo/`, con **las mismas carpetas** que en `contenido/` (por ejemplo `contenido-externo/Fotos/Arte/dibujo-enorme.png`). Esa carpeta **no se sube a GitHub**.
4. Corre `npm run dev` o `npm run build` una vez: se generan las miniaturas en `externo/`, y esa carpeta **sí** se sube.
5. Sube el contenido de `contenido-externo/` al bucket R2 respetando las carpetas (desde el panel de Cloudflare o con `rclone`).
6. `git push`. Las miniaturas cargan desde tu web y las fotos originales desde R2. En el explorador se ven mezcladas con las demás.

---

## ⚖️ Licencia

- **El código** tiene **licencia MIT**: cualquiera puede usarlo, modificarlo y basarse en él, siempre que mantenga el aviso de copyright de Foxdi.
- **Todo lo que está en `contenido/`** (el personaje Foxdi, el arte, las imágenes, los textos, la música y las webs) tiene **todos los derechos reservados**: no se puede reutilizar sin permiso.

Si haces tu propio portfolio a partir de FoxdiOS, reemplaza la carpeta `contenido/` con tus cosas. Los detalles están en [LICENSE](LICENSE).

## 📜 Créditos
- Foto del avatar de inicio de sesión: "Vulpes vulpes ssp fulvus", Wikimedia Commons, **CC0** (ver `src/assets/sistema/CREDITOS.txt`).
- Todos los iconos, sonidos, fondos y la música de ejemplo son originales (hechos por código para este proyecto). La estética está inspirada en Windows Vista/7/XP, pero no usa recursos de Microsoft.
