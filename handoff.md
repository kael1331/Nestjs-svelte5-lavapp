# Guía de Traspaso del Proyecto: LavaApp (NestJS + Svelte 5)

Este documento sirve como un manual técnico de arquitectura y estado del proyecto. Está redactado específicamente para que un agente de Inteligencia Artificial (como Antigravity) en un nuevo hilo de conversación comprenda de inmediato la estructura completa del proyecto, sus tecnologías, flujos de seguridad, la compatibilidad con el entorno Termux, y pueda continuar editándolo de forma segura sin provocar regresiones o errores.

---

## 1. Contexto General y Stack de Tecnologías

LavaApp es una aplicación web full-stack para la administración de pedidos de lavandería con un sistema de tres roles de usuario (`super_admin`, `admin`, y `client`).

### Backend (`user-api/`)
* **Framework:** NestJS (Node.js).
* **Base de Datos:** SQLite gestionado a través de **TypeORM**.
* **Seguridad:** JWT (JSON Web Tokens) + Inactivación por Revocación de Tokens en SQLite (para logout seguro).
* **Documentación:** Swagger UI (disponible en `http://localhost:3000/api`).

### Frontend (`user-web/`)
* **Framework:** Svelte 5 (utilizando el sistema de Runas reactivas: `$state`, `$derived`, `$effect`, y `$props`).
* **Bundler & Server:** Vite.
* **Estilos:** CSS puro (Vanilla CSS) premium, responsivo y adaptado para dispositivos móviles, sin frameworks de utilidades CSS.

---

## 2. Mapa y Estructura de Directorios

El repositorio unificado tiene la siguiente estructura jerárquica clave:

```text
/data/data/com.termux/files/home/Nestjs-svelte5-lavapp/
├── user-api/                        # Servidor NestJS
│   ├── src/
│   │   ├── auth/                    # Control de acceso, JWT, Revocación y Guards
│   │   │   ├── entities/            # revoked-token.entity.ts (Tabla para Tokens invalidados)
│   │   │   ├── auth.guard.ts        # Guardián JWT básico
│   │   │   ├── roles.decorator.ts   # Decorador @Roles(...) para rutas
│   │   │   └── roles.guard.ts       # Validador de roles jerárquicos
│   │   ├── users/                   # Módulo de usuarios (CRUD)
│   │   │   ├── dto/                 # DTOs de creación y actualización de usuarios
│   │   │   ├── entities/            # user.entity.ts (Definición de tabla e interceptores de contraseñas)
│   │   │   └── users.controller.ts  # Endpoints de usuario protegidos con roles
│   │   └── main.ts                  # Configuración de CORS y Swagger
│   └── package.json
│
├── user-web/                        # Cliente Svelte 5
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/layout/   # Elementos estructurales y comunes
│   │   │   │   ├── Header.svelte    # Barra superior con controles y hamburguesa
│   │   │   │   ├── Footer.svelte    # Pie de página
│   │   │   │   ├── Sidebar.svelte   # Cajón lateral dinámico que lee navStore y authStore
│   │   │   │   ├── PageFrame.svelte # Layout de envoltura visual
│   │   │   │   └── nav-store.svelte.ts # Almacén global reactivo del menú y navegación
│   │   │   ├── features/            # Lógica desacoplada y encapsulada por dominios
│   │   │   │   ├── auth/            # Sesión, Login, Login de Google y Registro
│   │   │   │   │   └── services/auth-store.svelte.ts # Store reactivo de sesión activa
│   │   │   │   └── users/           # CRUD de Usuarios del Super Admin
│   │   │   │       ├── components/UserCrud.svelte # Interfaz CRUD completa
│   │   │   │       └── services/users-api.ts # Conectividad Fetch hacia /users
│   │   │   └── types/               # Tipos de datos TS (incluye api.generated.ts)
│   │   └── routes/                  # Enrutador por directorios (SvelteKit)
│   │       ├── +layout.svelte       # Guardián de redirección según el rol de sesión
│   │       ├── login/               # Formulario de acceso/registro + Google Auth
│   │       └── dashboard/           # Rutas protegidas (super-admin, admin, client)
│   └── package.json
│
└── skills/
    └── termux-git-ops.skill         # Directrices de compilación/ejecución para Termux
```

---

## 3. Funcionamiento Detallado del Sistema

### A. Autenticación y Cierre de Sesión (Logout Seguro)
1. **Inicio de Sesión:** Cuando el usuario se autentica en `/auth/login` (o mediante Google Sign-In), el backend devuelve un token JWT firmado.
2. **Cierre de Sesión:** El método `logout()` en `authStore` (frontend) realiza una llamada `POST /auth/logout` enviando el token en la cabecera `Authorization`. El backend almacena el Hash de este token en la tabla `RevokedToken`.
3. **Verificación de Tokens:** El `AuthGuard` intercepta cada petición a la API y consulta la base de datos para verificar si el token ya ha sido revocado. Si es así, deniega la llamada con `401 Unauthorized` inmediatamente, impidiendo ataques de repetición de tokens JWT confiscados.

### B. Navegación Dinámica por Roles en el Frontend
* **Estructura Reutilizable:** El menú lateral (`Sidebar.svelte`) y el enrutador no están duplicados. Todos los dashboards cargan el mismo componente `<Sidebar />` insertado en `<PageFrame />`.
* **Stores Reactivos (Runes):**
  * `authStore.user` contiene la información de sesión actual (`role: 'super_admin' | 'admin' | 'client'`).
  * `navStore` define la lista global de pestañas y sus roles autorizados:
    ```typescript
    export const MENU_ITEMS = [
      { id: 'home', label: 'Resumen', roles: ['client', 'admin', 'super_admin'] },
      { id: 'users', label: 'Gestión de Usuarios', roles: ['super_admin'] },
      { id: 'config', label: 'Configuración', roles: ['super_admin'] },
      { id: 'operations', label: 'Operaciones', roles: ['admin'] },
      { id: 'orders', label: 'Mis Pedidos', roles: ['client'] },
    ];
    ```
  * `navStore.activeTab` utiliza un **getter** y **setter** inteligente. Si un rol no autorizado intenta cambiar de pestaña (ej. un cliente intentando establecer `users`), el setter intercepta la maniobra, la bloquea y el getter redirige automáticamente al tab seguro de inicio de su rol.

### C. Seguridad Jerárquica en la API
* **Decorador `@Roles(...)`:** Asigna privilegios requeridos a un endpoint.
* **`RolesGuard`:** Valida que el rol descodificado en el payload del JWT esté en la lista permitida de la ruta.
* **Controladores Protegidos:** `UsersController` restringe su CRUD administrativo (ver, actualizar, borrar) solo a `super_admin`.
* **Registro Público Seguro:** El método `create` en `UsersController` es público para permitir auto-registros, pero tiene una regla crítica: si el payload de la petición intenta forzar un `role` diferente de `client` (es decir, `admin` o `super_admin`), la API exige la firma de un token de `super_admin` administrador. Si no existe tal cabecera, la petición falla inmediatamente con `403 Forbidden` impidiendo la escalación de privilegios no autorizada.

---

## 4. Directrices de Compatibilidad de Ejecución en Termux (OBLIGATORIO)

Debido al entorno sandboxed de Termux en Android, la ejecución habitual de scripts npm puede fallar por problemas de rutas de shebang (`/usr/bin/env` no mapeado). Debes seguir estrictamente estas instrucciones:

### A. Para el Frontend (`user-web/`)
* **NO EJECUTAR `npm run build`** (fallará con `vite: not found`).
* **Compilación (Build):**
  ```bash
  node node_modules/vite/bin/vite.js build
  ```
* **Servidor de Desarrollo:**
  ```bash
  node node_modules/vite/bin/vite.js dev
  ```

### B. Para el Backend (`user-api/`)
* **NO EJECUTAR `npm run build` o `nest build` directamente.**
* **Compilación (Build):**
  ```bash
  node node_modules/@nestjs/cli/bin/nest.js build
  ```
* **Servidor de Desarrollo (Watch Mode):**
  ```bash
  node node_modules/@nestjs/cli/bin/nest.js start --watch
  ```
* **Generación de recursos (CLI NestJS):**
  ```bash
  node node_modules/@nestjs/cli/bin/nest.js generate module <nombre>
  node node_modules/@nestjs/cli/bin/nest.js generate service <nombre> --no-spec
  node node_modules/@nestjs/cli/bin/nest.js generate controller <nombre> --no-spec
  ```

### C. Instalaciones de paquetes npm
* Si es necesario instalar nuevas dependencias, agrega siempre el flag `--legacy-peer-deps` para evitar conflictos estrictos con versiones de TypeScript o React/Svelte:
  ```bash
  npm install <paquete> --legacy-peer-deps
  ```

---

## 5. Protocolo de Sincronización con Git

Al terminar cualquier cambio:
1. Asegúrate de ejecutar un build completo en frontend y backend para comprobar la integridad del tipado y la compilación.
2. Añade todos los cambios locales: `git add .`.
3. Haz un commit estructurado: `git commit -m "feat/fix: <descripción descriptiva>"`.
4. Sube la rama al remoto configurado:
   - Repositorio del Proyecto: `git push origin main`


