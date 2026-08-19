# Frontend — Sistema de Carga Aérea

Interfaz web del **Sistema de Carga Aérea**, desarrollada con Angular y TypeScript. Permite iniciar sesión y administrar los módulos del sistema mediante el consumo de una API REST construida con Spring Boot.

## Funcionalidades principales

- Inicio y cierre de sesión.
- Autenticación mediante JWT.
- Protección de rutas privadas y por rol (`ADMINISTRADOR` / `OPERADOR`).
- Envío automático del token en las solicitudes HTTP.
- Notificaciones globales de error (toast) para cualquier respuesta del backend.
- Dashboard con gráficos (vuelos por estado, encomiendas por estado).
- Gestión de vuelos: registro, edición, cambio de estado, manifiesto de vuelo, alerta visual al superar 90% de capacidad.
- Gestión de encomiendas: registro con peso volumétrico opcional, asignación a vuelos, cambio de estado.
- Auditoría y recuperación: historial filtrable de cambios y restauración de versiones anteriores.
- Exportar Vuelos y Encomiendas a PDF y Excel, con logo y estilo de marca.
- Gestión de usuarios para el rol `ADMINISTRADOR`, con protección contra auto-bloqueo.
- Modo oscuro (aplicado solo dentro de la app autenticada, no en el login).
- Interfaz adaptable a computadoras, tabletas y dispositivos móviles.

## Tecnologías utilizadas

- Angular.
- TypeScript.
- HTML5.
- CSS y Tailwind CSS.
- Angular Router.
- Angular Reactive Forms.
- Angular HttpClient.
- Signals de Angular.
- RxJS.
- PrimeNG (tema Aura).
- Chart.js.
- jsPDF + jspdf-autotable.
- ExcelJS.
- pnpm como gestor de paquetes.

Las versiones exactas instaladas se encuentran en el archivo `package.json`. También pueden consultarse ejecutando:

```bash
pnpm exec ng version
```

## Requisitos previos

Antes de ejecutar el frontend, instala lo siguiente:

### 1. Node.js

Instala una versión LTS de Node.js compatible con la versión de Angular declarada en `package.json`.

Comprueba la instalación:

```bash
node --version
npm --version
```

### 2. pnpm

Este proyecto utiliza `pnpm`. Puedes habilitarlo con Corepack:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

También puedes instalarlo con npm:

```bash
npm install --global pnpm
```

Comprueba la instalación:

```bash
pnpm --version
```

### 3. Backend del sistema

El frontend necesita que la API de Spring Boot esté ejecutándose, normalmente en:

```text
http://localhost:8080
```

El endpoint de autenticación utilizado es:

```text
POST http://localhost:8080/api/auth/login
```

## Instalación del proyecto

Abre PowerShell, CMD o la terminal del IDE y entra en la carpeta del frontend:

```powershell
cd C:\Users\User\Desktop\sistema-carga-aerea\frontend
```

Instala las dependencias:

```bash
pnpm install
```

No copies la carpeta `node_modules` desde otra computadora. Debe generarse localmente mediante `pnpm install`.

## Configuración de la API

Para desarrollo local, la URL base del backend debe ser:

```text
http://localhost:8080
```

Si el proyecto todavía tiene la URL escrita directamente en `auth.service.ts`, debe aparecer como una cadena normal:

```typescript
private readonly apiUrl = 'http://localhost:8080/api/auth';
```

No debe contener sintaxis de enlace Markdown como esta:

```typescript
'[http://localhost:8080/api/auth](http://localhost:8080/api/auth)'
```

Para una configuración más escalable, se recomienda centralizar la dirección de la API en los archivos de entorno.

`src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

Después puede utilizarse desde los servicios:

```typescript
import { environment } from '../../../environments/environment';

private readonly apiUrl = `${environment.apiUrl}/auth`;
```

La ruta relativa del import puede variar según la ubicación real del servicio.

## Ejecución en desarrollo

Primero inicia el backend en otra terminal. Después, desde la carpeta `frontend`, ejecuta:

```bash
pnpm start
```

Si `package.json` no contiene el script `start`, utiliza:

```bash
pnpm exec ng serve
```

Abre en el navegador:

```text
http://localhost:4200
```

Angular recargará automáticamente la página cuando se modifique el código fuente.

Para permitir el acceso desde otros dispositivos de la misma red durante el desarrollo:

```bash
pnpm exec ng serve --host 0.0.0.0
```

Esta opción solo debe utilizarse en una red confiable.

## Ejecución desde la raíz del monorepo

Si la raíz del proyecto contiene scripts para administrar backend y frontend, regresa a:

```powershell
cd C:\Users\User\Desktop\sistema-carga-aerea
```

Instala las dependencias del monorepo:

```bash
pnpm install
```

Ejecuta ambos proyectos:

```bash
pnpm dev
```

También pueden existir scripts separados, por ejemplo:

```bash
pnpm frontend
pnpm backend
```

Revisa la sección `scripts` del `package.json` de la raíz para confirmar los comandos disponibles.

## Autenticación

Al iniciar sesión correctamente, la API devuelve información similar a:

```json
{
  "token": "TOKEN_JWT",
  "tipo": "Bearer",
  "usuarioId": 1,
  "username": "admin",
  "nombreCompleto": "Administrador del sistema",
  "rol": "ADMINISTRADOR",
  "expiraEnSegundos": 3600
}
```

El frontend guarda la sesión en `localStorage` utilizando estas claves:

```text
carga_aerea_token
carga_aerea_usuario
```

El token debe enviarse a los endpoints protegidos mediante el encabezado:

```http
Authorization: Bearer TOKEN_JWT
```

Se recomienda usar un interceptor HTTP para añadirlo automáticamente.

Ejemplo simplificado:

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).obtenerToken();

  if (!token) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};
```

## Rutas principales

La aplicación puede manejar rutas similares a las siguientes:

| Ruta | Descripción | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Público |
| `/rastreo` | Rastreo público de encomiendas (asistente Valeria) | Público |
| `/dashboard` | Panel principal | Usuario autenticado |
| `/vuelos` | Gestión de vuelos | Usuario autenticado |
| `/encomiendas` | Gestión de encomiendas | Usuario autenticado |
| `/usuarios` | Gestión de usuarios | Administrador |
| `/auditoria` | Auditoría y recuperación | Administrador |

Definidas en `app.routes.ts`.

Si el dashboard utiliza rutas hijas, su componente de layout debe importar y mostrar `RouterOutlet`:

```typescript
import { RouterOutlet } from '@angular/router';
```

```html
<router-outlet />
```

## Estructura sugerida

```text
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── models/
│   │   │   └── services/
│   │   ├── layouts/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── vuelos/
│   │   ├── encomiendas/
│   │   ├── usuarios/
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/
│   ├── styles.css
│   └── main.ts
├── angular.json
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── README.md
```

La estructura real puede variar. No es necesario reorganizar el proyecto únicamente para que coincida con este ejemplo.

## Compilación

Para generar una compilación de producción:

```bash
pnpm build
```

Si no existe ese script:

```bash
pnpm exec ng build
```

Los archivos compilados se generarán dentro de `dist/`.

La carpeta `dist/` no debe editarse manualmente ni subirse normalmente al repositorio, porque puede regenerarse.

## Pruebas

Si el proyecto tiene pruebas configuradas:

```bash
pnpm test
```

Para verificar que el proyecto compile sin iniciar el servidor:

```bash
pnpm build
```

## Revisión de calidad

Antes de subir cambios al repositorio, se recomienda ejecutar:

```bash
pnpm build
```

Si existe un script de análisis de código:

```bash
pnpm lint
```

Comprueba los scripts disponibles con:

```bash
pnpm run
```

## Errores frecuentes

### No se puede conectar con el servidor

Comprueba que Spring Boot esté activo en el puerto `8080`:

```text
http://localhost:8080
```

Revisa también que el frontend utilice la URL correcta y que el backend permita el origen:

```text
http://localhost:4200
```

### Error de CORS

El backend debe tener una sola configuración CORS y permitir, como mínimo:

```text
http://localhost:4200
```

No dupliques el bean `corsConfigurationSource` en diferentes clases de Spring.

### El login responde correctamente, pero no abre el dashboard

Revisa:

- Que exista el `path: 'dashboard'` en `app.routes.ts`.
- Que el guard reconozca el token guardado.
- Que el token no esté vencido.
- Que `navigateByUrl('/dashboard')` coincida con la ruta declarada.
- Que el layout incluya `<router-outlet />` si utiliza rutas hijas.
- Que no exista una ruta comodín `**` antes de la ruta del dashboard.

También revisa la consola del navegador en `F12 → Console`.

### Error 401 Unauthorized

- Confirma que el usuario y la contraseña sean correctos.
- Para rutas protegidas, verifica que se envíe `Authorization: Bearer ...`.
- Comprueba que el token no haya expirado.

### Error 403 Forbidden

El usuario inició sesión, pero no cuenta con el rol requerido. Por ejemplo, `/api/usuarios/**` puede estar restringido al rol `ADMINISTRADOR`.

### Puerto 4200 ocupado

Ejecuta Angular en otro puerto:

```bash
pnpm exec ng serve --port 4201
```

Si cambias el puerto, también debes permitir el nuevo origen en la configuración CORS del backend.

### Dependencias dañadas o desactualizadas

Desde la carpeta `frontend`, vuelve a instalar las dependencias:

```bash
pnpm install
```

No elimines `pnpm-lock.yaml` salvo que sea realmente necesario, porque fija las versiones utilizadas por el proyecto.

## Archivos que no deben subirse a GitHub

El `.gitignore` debe excluir, como mínimo:

```gitignore
node_modules/
.angular/
dist/
coverage/
.env
.env.*
*.log
```

Sí deben subirse:

- `src/`.
- `public/`, si existe.
- `angular.json`.
- `package.json`.
- `pnpm-lock.yaml`.
- Archivos `tsconfig`.
- `README.md`.

## Subir cambios a GitHub

Desde la raíz del monorepo:

```powershell
cd C:\Users\User\Desktop\sistema-carga-aerea
git status
git add frontend
git commit -m "docs: agregar README del frontend"
git push
```

Para cambios posteriores pueden utilizarse mensajes como:

```bash
git commit -m "feat: implementar dashboard del frontend"
git commit -m "feat: agregar mantenimiento de vuelos"
git commit -m "fix: corregir redireccionamiento del login"
git commit -m "style: mejorar interfaz del panel principal"
```

## Seguridad

- No almacenes contraseñas de usuarios en el frontend.
- No publiques secretos JWT, credenciales de MySQL ni claves privadas en Angular.
- El frontend solo debe almacenar el token entregado por el backend.
- La autorización definitiva siempre debe validarse en Spring Security.
- Para producción, utiliza HTTPS.
- Las variables compiladas en Angular son visibles para el navegador; no deben contener secretos.

## URLs de desarrollo

| Servicio | Dirección |
|---|---|
| Frontend Angular | `http://localhost:4200` |
| Backend Spring Boot | `http://localhost:8080` |
| Login API | `http://localhost:8080/api/auth/login` |

## Autor

Proyecto académico desarrollado para la gestión de un sistema de carga aérea.

