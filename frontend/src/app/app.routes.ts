import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./pages/auth/login/login').then(
                (component) => component.Login
            )
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
                loadComponent: () =>
                    import('./pages/dashboard/dashboard').then(
                        (component) => component.Dashboard
                    )
            },
            {
                path: 'usuarios',
                canActivate: [adminGuard],
                loadComponent: () =>
                    import('./pages/usuarios/usuarios').then(
                        (component) => component.Usuarios
                    )
            },
            {
                path: 'auditoria',
                canActivate: [adminGuard],
                loadComponent: () =>
                    import('./pages/auditoria/auditoria').then(
                        (component) => component.Auditoria
                    )
            },
            {
                path: 'vuelos',
                loadComponent: () =>
                    import('./pages/vuelos/vuelos').then(
                        (component) => component.Vuelos
                    )
            },
            {
                path: 'encomiendas',
                loadComponent: () =>
                    import('./pages/encomiendas/encomiendas').then(
                        (component) => component.Encomiendas
                    )
            },
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard'
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];