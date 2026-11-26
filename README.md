# TicketDesk AI · Web

Frontend Angular 21 + Angular Material para la API de tickets de [TicketDesk AI](../TicketDesk%20AI). Es una SPA con login, alta y listado de tickets, detalle con comentarios/historial/IA/duplicados, panel del agente y configuración de IA.

## Requisitos

- Node `22.19.0` (Angular 21 no acepta versiones posteriores a `22.22.x` en esta demo).
- npm (el repo fija `packageManager: npm@11.10.1`).
- La API corriendo en `http://localhost:8080` (ver README del backend).

## Scripts

```bash
npm ci
npm start                       # http://localhost:4200
npm run build                   # genera dist/ticketdesk-web-angular/browser
npm test -- --watch=false
```

`npm run build` ejecuta antes el `prebuild`: un script que escribe `src/environments/environment.ts` con la URL de la API.

## Configuración de la API

| Variable | Uso | Default |
| --- | --- | --- |
| `API_URL` | URL base de la API, se usa durante el build | `http://localhost:8080` |

Ejemplo para apuntar al backend desplegado en Render:

```bash
API_URL=https://<API_EN_RENDER>.onrender.com npm run build
```

En Vercel, cargar `API_URL` en **Project → Settings → Environment Variables** y hacer un nuevo deploy: el valor queda grabado en el bundle.

## Estructura

- `src/app/core`: modelos, sesión (`sessionStorage`), auth, interceptor JWT, guards y notificaciones.
- `src/app/features`: pantallas de auth, tickets, panel del agente y settings de IA, con sus servicios.
- `src/app/layout/shell.ts`: toolbar con navegación por rol y footer que consulta `/health`.
- `src/environments/environment.ts`: único punto con la URL de la API (generado en cada build).
- `src/app/features/tickets/ticket-import.ts`: carga de un PDF o un correo `.eml`, preview editable y alta del ticket con `source: 'PDF'` o `'EMAIL'`. Si el backend indica `provider`, muestra `Sugerido por …`.

Decisiones de diseño:

- Los guards redirigen a `/login` si no hay sesión y a `/tickets` si el rol no tiene permiso.
- El JWT se guarda en `sessionStorage`; se cierra al cerrar la pestaña.
- Los errores de la API se muestran con snackbars leyendo `ProblemDetail` (`detail`, `title` y errores de validación).
- No hay expresiones en templates: todo cálculo o condición vive en el componente.

## Deploy en Vercel

`vercel.json` define:

- `buildCommand: npm run build`.
- `outputDirectory: dist/ticketdesk-web-angular/browser`.
- Rewrite `/(.*) → /index.html` para que las rutas SPA funcionen al recargar.

Además, el backend debe incluir la URL de Vercel en `CORS_ALLOWED_ORIGINS`. Usar `localhost:4200` (no `127.0.0.1`) en desarrollo: si el origin no coincide, el preflight da `403`.

## CI

`.github/workflows/ci.yml` instala con `npm ci`, compila y corre los tests con Node 22.19.0 en cada push y PR.

## Demo

Usuarios: `cliente@ticketdesk.dev`, `agente@ticketdesk.dev`, `admin@ticketdesk.dev`; password `demo1234`.

1. Login como cliente y crear un ticket.
2. Logout y login como agente.
3. Panel agente → tomar ticket → abrir detalle.
4. Pestañas: **Comentarios**, **Gestión**, **Historial**, **IA** y **Duplicados**.
5. En **Config. IA**, elegir `Demo (Mock)` en el select de proveedor: no pide clave y ya viene sin modelo. Para un proveedor real, elegir OpenAI, Anthropic o Gemini; el select de modelo se llena desde `GET /api/ai/providers` y precarga el modelo por defecto.
6. Al pegar una api key se sugiere el proveedor por su prefijo (`sk-ant-`, `sk-`, `AIza`); la SPA **no cambia sola**: hay que click en **Usar …** para confirmar. La clave se cifra en el backend y la API sólo devuelve una pista (`****1234`).
7. Desde **Importar** se elige PDF o correo `.eml`, se revisan los campos sugeridos y se confirma; el ticket queda con el badge `PDF` o `EMAIL`. Con `MOCK` se usan heurísticas; con un proveedor real configurado, el preview dice `Sugerido por …` y los campos vienen de la IA. Ante un error de la IA se vuelve a las heurísticas sin romper la pantalla.
