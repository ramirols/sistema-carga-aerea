# Sistema de Carga Aérea

Aplicación web para administrar usuarios, vuelos, encomiendas y operaciones de carga aérea. El proyecto está organizado como un **monorepo** que integra un backend REST desarrollado con Spring Boot y un frontend desarrollado con Angular.

## Funcionalidades principales

- **Autenticación y roles**: inicio de sesión con JWT, dos roles (`ADMINISTRADOR` y `OPERADOR`) con permisos distintos tanto en el frontend (rutas y menú) como en el backend (endpoints protegidos por rol).
- **Gestión de vuelos**: registro, edición, cambio de estado (Programado/Despachado/Cancelado), búsqueda y filtros por fecha y estado. Al cancelar un vuelo, las encomiendas embarcadas en él se liberan automáticamente.
- **Gestión de encomiendas**: registro con cálculo de **peso volumétrico** (largo × ancho × alto ÷ 5000), asignación a vuelos con validación de capacidad disponible, cambio de estado y búsqueda con filtros.
- **Manifiesto de vuelo**: vista con el detalle de todas las encomiendas asignadas a un vuelo específico y su ocupación de capacidad.
- **Alertas de capacidad**: indicador visual cuando un vuelo supera el 90% de su capacidad.
- **Auditoría y recuperación**: historial completo de cambios (creación, modificación, eliminación) sobre vuelos, encomiendas y usuarios, con filtros por entidad, operación, usuario y rango de fechas, y la posibilidad de restaurar una versión anterior de cualquier registro. Implementado con Hibernate Envers.
- **Exportación de reportes**: descarga de vuelos y encomiendas en PDF y Excel, con encabezado de marca (logo, título, fecha de generación).
- **Gestión de usuarios**: solo para `ADMINISTRADOR`; incluye protección contra que un administrador se quite su propio rol, se desactive o se elimine a sí mismo.
- **Modo oscuro** y diseño responsive (escritorio, tablet y celular).

## Tecnologías utilizadas

### Backend

- Java 21
- Spring Boot
- Spring Web
- Spring Security
- Autenticación mediante JWT
- Spring Data JPA
- Hibernate
- Hibernate Envers (auditoría y versionado de entidades)
- Bean Validation
- Lombok
- Maven Wrapper
- MySQL

### Frontend

- Angular
- TypeScript
- Reactive Forms
- Angular Router
- Angular HTTP Client
- Angular Signals
- PrimeNG (componentes UI, tema Aura)
- Tailwind CSS
- Chart.js (gráficos del dashboard)
- jsPDF + jspdf-autotable (exportar a PDF)
- ExcelJS (exportar a Excel)

### Herramientas del monorepo

- Node.js
- pnpm
- Git

## Estructura del proyecto

```text
sistema-carga-aerea/
├── backend/             # API REST con Spring Boot
│   ├── .mvn/
│   ├── src/
│   ├── mvnw
│   ├── mvnw.cmd
│   └── pom.xml
├── frontend/            # Aplicación web con Angular
│   ├── src/
│   ├── angular.json
│   └── package.json
├── package.json         # Comandos generales del monorepo
├── pnpm-lock.yaml
└── README.md
```

## Requisitos previos

Antes de ejecutar el proyecto, instala lo siguiente:

| Programa | Versión recomendada | Comprobación |
|---|---:|---|
| Git | Última versión estable | `git --version` |
| Java JDK | 21 | `java -version` |
| Node.js | 22 LTS o compatible | `node --version` |
| pnpm | 10 o superior | `pnpm --version` |
| MySQL Server | 8.0 o superior | `mysql --version` |
| MySQL Workbench | Última estable | Interfaz gráfica |

> No es obligatorio instalar Maven globalmente, porque el backend incluye Maven Wrapper (`mvnw` y `mvnw.cmd`).

## 1. Instalar las herramientas

### Java 21

Instala un JDK 21, por ejemplo Eclipse Temurin u Oracle JDK. Después comprueba la instalación:

```powershell
java -version
javac -version
```

Ambos comandos deben indicar la versión 21.

Si Windows no reconoce Java, configura:

- `JAVA_HOME`: ruta donde se instaló el JDK 21.
- Agrega `%JAVA_HOME%\bin` a la variable `Path`.

### Node.js

Instala Node.js y verifica:

```powershell
node --version
npm --version
```

### pnpm

Instala pnpm globalmente:

```powershell
npm install --global pnpm
```

Comprueba la instalación:

```powershell
pnpm --version
```

### MySQL

Instala MySQL Server y, opcionalmente, MySQL Workbench. Durante la instalación define y recuerda la contraseña del usuario `root`.

La configuración local utilizada como referencia es:

```text
Servidor: localhost
Puerto: 3306
Usuario: root
Base de datos: carga_aerea_db
```

## 2. Descargar el proyecto

Clona el repositorio y entra en su carpeta:

```powershell
git clone https://github.com/TU-USUARIO/sistema-carga-aerea.git
cd sistema-carga-aerea
```

Reemplaza `TU-USUARIO` por el usuario propietario del repositorio.

## 3. Crear la base de datos

Abre MySQL Workbench, conéctate a tu servidor local y ejecuta:

```sql
CREATE DATABASE IF NOT EXISTS carga_aerea_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Spring Boot creará o actualizará las tablas automáticamente mediante Hibernate porque el proyecto usa:

```properties
spring.jpa.hibernate.ddl-auto=update
```

Si el proyecto incluye un script SQL con información inicial, ejecútalo después de crear la base de datos.

## 4. Configurar el backend

El archivo de configuración se encuentra en:

```text
backend/src/main/resources/application.properties
```

Configuración actual del proyecto (valores literales, pensados para desarrollo local):

```properties
spring.application.name=backend
server.port=8080

spring.datasource.url=jdbc:mysql://localhost:3306/carga_aerea_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Lima
spring.datasource.username=root
spring.datasource.password=mysql
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.open-in-view=false

# Guarda el estado completo del registro al eliminarlo, para que el
# historial de auditoría muestre los datos y no solo el id.
spring.jpa.properties.org.hibernate.envers.store_data_at_delete=true

spring.jackson.time-zone=America/Lima

server.error.include-message=always
server.error.include-binding-errors=always

app.jwt.secret=SistemaCargaAereaJwtClaveSegura2026Cibertec
app.jwt.expiration-minutes=60

app.cors.allowed-origin=http://localhost:4200
```

> **Nota de seguridad**: el usuario/contraseña de MySQL y la clave JWT están escritos directamente en el archivo, lo cual es aceptable para un proyecto académico en local, pero **no debe hacerse así en producción**. Si vas a desplegar el proyecto o subir el repositorio a un lugar público, cambia estos valores por variables de entorno (`${DB_USERNAME}`, `${DB_PASSWORD}`, `${JWT_SECRET}`) y nunca subas la clave real al control de versiones.

> La clave JWT debe tener como mínimo 32 caracteres para trabajar con HS256.

## 5. Instalar las dependencias

Desde la raíz del monorepo ejecuta:

```powershell
pnpm install
```

Este comando instalará las dependencias de Node y Angular declaradas en el proyecto. Las dependencias de Java se descargarán automáticamente al iniciar o compilar el backend con Maven Wrapper.

## 6. Ejecutar el proyecto

### Opción A: ejecutar todo el monorepo

Desde la raíz:

```powershell
pnpm dev
```

Este comando debe iniciar el backend y el frontend simultáneamente, siempre que el script `dev` esté definido en el `package.json` de la raíz.

### Opción B: ejecutar cada aplicación por separado

Abre dos terminales.

Terminal 1 — backend:

```powershell
pnpm backend
```

También puedes iniciarlo directamente con Maven Wrapper:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

En Linux o macOS:

```bash
cd backend
./mvnw spring-boot:run
```

Terminal 2 — frontend:

```powershell
pnpm frontend
```

Si el monorepo no tiene ese script, ejecuta:

```powershell
cd frontend
pnpm install
pnpm start
```

## 7. Direcciones de la aplicación

Una vez iniciados ambos proyectos:

| Servicio | Dirección |
|---|---|
| Frontend Angular | `http://localhost:4200` |
| Backend Spring Boot | `http://localhost:8080` |
| API REST | `http://localhost:8080/api` |
| Inicio de sesión | `POST http://localhost:8080/api/auth/login` |

Para detener un proceso en la consola utiliza `Ctrl + C`.

## 8. Comprobar que funciona

El backend inició correctamente cuando la consola muestra mensajes parecidos a:

```text
Tomcat started on port 8080
Started BackendApplication
```

El frontend inició correctamente cuando Angular indica que está escuchando en:

```text
http://localhost:4200
```

Luego abre `http://localhost:4200` en el navegador e inicia sesión. El backend crea automáticamente un usuario administrador la primera vez que arranca (ver `DataInitializer`), con estas credenciales:

```text
Usuario: admin
Contraseña: Admin123*
```

Para probar el rol `OPERADOR`, inicia sesión como `admin`, ve a **Usuarios → Nuevo usuario** y crea uno con ese rol.

## 9. Compilar el proyecto

### Backend

En Windows:

```powershell
cd backend
.\mvnw.cmd clean package
```

El archivo ejecutable se generará dentro de `backend/target/`.

Para ejecutar el JAR generado:

```powershell
java -jar target/NOMBRE-DEL-ARCHIVO.jar
```

### Frontend

```powershell
cd frontend
pnpm build
```

La compilación se generará en el directorio configurado por Angular, normalmente `frontend/dist/`.

## 10. Autenticación y seguridad

El sistema utiliza autenticación JWT:

1. El frontend envía las credenciales a `/api/auth/login`.
2. El backend valida al usuario y devuelve un token.
3. Angular guarda la sesión localmente.
4. Las solicitudes protegidas envían `Authorization: Bearer TOKEN`.
5. Spring Security valida el token y los roles del usuario.

La configuración CORS permite durante el desarrollo solicitudes desde:

```text
http://localhost:4200
```

Para producción, reemplaza esa dirección por el dominio real del frontend.

## 11. Errores frecuentes

### `Access denied for user 'root'@'localhost'`

La contraseña o el usuario de MySQL son incorrectos. Revisa `DB_USERNAME` y `DB_PASSWORD`.

### `Unknown database 'carga_aerea_db'`

Crea la base de datos ejecutando el script SQL indicado anteriormente.

### `Port 8080 was already in use`

Otro programa está usando el puerto del backend. Detén ese proceso o cambia `server.port`.

### `Port 4200 is already in use`

Otra instancia de Angular está ejecutándose. Detén el proceso anterior con `Ctrl + C`.

### Error de CORS

Comprueba que:

- Angular esté ejecutándose en `http://localhost:4200`.
- `CORS_ALLOWED_ORIGIN` tenga exactamente esa dirección.
- Exista un solo bean `CorsConfigurationSource` en Spring Boot.

### El login responde, pero no abre el dashboard

Revisa:

- Que Angular tenga la ruta `/dashboard`.
- Que el guard de autenticación reconozca el token guardado.
- Que el layout contenga `<router-outlet />`.
- Que la consola del navegador no muestre errores de rutas o imports.

### `JAVA_HOME is not defined correctly`

Configura `JAVA_HOME` con la carpeta del JDK 21 y agrega `%JAVA_HOME%\bin` al `Path`.

### `pnpm` no se reconoce como comando

Ejecuta:

```powershell
npm install --global pnpm
```

Después cierra y vuelve a abrir la terminal.

## 12. Archivos que no deben subirse a GitHub

El `.gitignore` de la raíz debe excluir, como mínimo:

```gitignore
node_modules/
.pnpm-store/
.angular/
dist/
coverage/
backend/target/

.env
.env.*
!.env.example

.idea/
.vscode/
*.iml
.classpath
.project
.settings/
.sts4-cache/

*.log
logs/
.DS_Store
Thumbs.db
desktop.ini
```

No subas contraseñas, claves JWT, tokens, archivos `.env`, `node_modules/` ni `backend/target/`.

Sí debes conservar en el repositorio:

- `backend/mvnw`
- `backend/mvnw.cmd`
- `backend/.mvn/`
- `package.json`
- `pnpm-lock.yaml`
- Código fuente del backend y frontend

## 13. Subir cambios a GitHub

```powershell
git status
git add .
git commit -m "feat: implementar sistema de carga aérea"
git push
```

Antes de ejecutar `git add .`, verifica con `git status` que no se incluyan credenciales ni archivos generados.

## Autor

Proyecto académico desarrollado para la gestión de operaciones de carga aérea.

## Licencia

Este proyecto se utiliza con fines académicos. Si se desea distribuir o reutilizar públicamente, se recomienda agregar una licencia al repositorio.
