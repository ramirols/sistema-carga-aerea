import { effect, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const CLAVE_ALMACENAMIENTO = 'carga_aerea_tema';
const CLASE_OSCURO = 'app-dark';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private readonly router = inject(Router);

    private readonly oscuroSignal = signal(this.leerPreferencia());
    private readonly rutaActual = signal(this.router.url);

    readonly oscuro = this.oscuroSignal.asReadonly();

    constructor() {
        this.router.events
            .pipe(filter((evento) => evento instanceof NavigationEnd))
            .subscribe((evento) => {
                this.rutaActual.set(
                    (evento as NavigationEnd).urlAfterRedirects,
                );
            });

        effect(() => {
            const ruta = this.rutaActual();

            const enPaginaPublica =
                ruta.startsWith('/login') ||
                ruta.startsWith('/rastreo') ||
                ruta.startsWith('/consignatario');

            const activo = this.oscuroSignal() && !enPaginaPublica;

            document.documentElement.classList.toggle(
                CLASE_OSCURO,
                activo,
            );
        });
    }

    alternar(): void {
        const nuevo = !this.oscuroSignal();
        this.oscuroSignal.set(nuevo);
        localStorage.setItem(
            CLAVE_ALMACENAMIENTO,
            nuevo ? 'oscuro' : 'claro',
        );
    }

    private leerPreferencia(): boolean {
        const guardado = localStorage.getItem(
            CLAVE_ALMACENAMIENTO,
        );

        if (guardado) {
            return guardado === 'oscuro';
        }

        return window.matchMedia(
            '(prefers-color-scheme: dark)',
        ).matches;
    }
}
