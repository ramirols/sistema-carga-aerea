import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        title: 'Iniciar sesión | Sistema de Carga Aérea',
        loadComponent: () =>
            import('./pages/auth/login/login').then(
                (component) => component.Login
            ),
    },

    {
        path: 'rastreo',
        title: 'Rastrear encomienda | Sistema de Carga Aérea',
        loadComponent: () =>
            import('./pages/rastreo/rastreo').then(
                (component) => component.Rastreo
            ),
    },
    {
        path: 'consignatario',
        title: 'Consignatario | Sistema de Carga Aérea',
        loadComponent: () =>
            import('./pages/consignatario/consignatario').then(
                (component) => component.Consignatario
            ),
    },

    {
        path: '',
        loadComponent: () =>
            import('./layout/public/public-layout').then(
                (component) => component.PublicLayout
            ),
        children: [
            {
                path: '',
                pathMatch: 'full',
                title: 'Inicio | Sistema de Carga Aérea',
                loadComponent: () =>
                    import('./pages/inicio/inicio').then(
                        (component) => component.Inicio
                    ),
            },
        ],
    },

    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./layout/dashboard/dashboard-layout').then(
                (component) => component.DashboardLayout
            ),
        children: [
            {
                path: 'dashboard',
                title: 'Dashboard | Sistema de Carga Aérea',
                loadComponent: () =>
                    import('./pages/dashboard/dashboard').then(
                        (component) => component.Dashboard
                    ),
            },
            {
                path: 'usuarios',
                title: 'Usuarios | Sistema de Carga Aérea',
                canActivate: [adminGuard],
                loadComponent: () =>
                    import('./pages/usuarios/usuarios').then(
                        (component) => component.Usuarios
                    ),
            },
            {
                path: 'auditoria',
                title: 'Auditoría | Sistema de Carga Aérea',
                canActivate: [adminGuard],
                loadComponent: () =>
                    import('./pages/auditoria/auditoria').then(
                        (component) => component.Auditoria
                    ),
            },
            {
                path: 'vuelos',
                title: 'Vuelos | Sistema de Carga Aérea',
                loadComponent: () =>
                    import('./pages/vuelos/vuelos').then(
                        (component) => component.Vuelos
                    ),
            },
            {
                path: 'encomiendas',
                title: 'Encomiendas | Sistema de Carga Aérea',
                loadComponent: () =>
                    import('./pages/encomiendas/encomiendas').then(
                        (component) => component.Encomiendas
                    ),
            },
            {
                path: 'peticiones',
                title: 'Peticiones | Sistema de Carga Aérea',
                loadComponent: () =>
                    import('./pages/peticiones/peticiones').then(
                        (component) => component.Peticiones
                    ),
            },
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard',
            },
        ],
    },

    {
        path: '**',
        redirectTo: '',
    },
];