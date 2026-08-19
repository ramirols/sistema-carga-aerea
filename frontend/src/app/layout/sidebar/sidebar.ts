import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  private readonly router = inject(Router);

  @ViewChild('perfilContenedor')
  private perfilContenedor?: ElementRef<HTMLElement>;

  readonly abierto = input.required<boolean>();
  readonly cerrar = output<void>();

  readonly perfilAbierto = signal(false);

  readonly usuario = computed(() =>
    this.authService.usuario()
  );

  readonly esAdministrador = computed(() =>
    this.authService.esAdministrador()
  );

  readonly nombreRol = computed(() =>
    this.usuario()?.rol === 'ADMINISTRADOR'
      ? 'Administrador'
      : 'Operador'
  );

  readonly inicial = computed(() =>
    this.usuario()
      ?.nombreCompleto
      ?.trim()
      .charAt(0)
      .toUpperCase() || 'U'
  );

  alternarPerfil(): void {
    this.perfilAbierto.update((abierto) => !abierto);
  }

  alternarTema(): void {
    this.themeService.alternar();
    this.cerrarPerfil();
  }

  cerrarPerfil(): void {
    this.perfilAbierto.set(false);
  }

  cerrarMenu(): void {
    this.cerrarPerfil();
    this.cerrar.emit();
  }

  salir(): void {
    this.cerrarPerfil();
    this.cerrar.emit();

    this.authService.cerrarSesion();
    void this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  cerrarPerfilAlHacerClickFuera(evento: MouseEvent): void {
    if (!this.perfilAbierto()) {
      return;
    }

    const elementoSeleccionado = evento.target as Node | null;
    const contenedor = this.perfilContenedor?.nativeElement;

    if (
      contenedor &&
      elementoSeleccionado &&
      !contenedor.contains(elementoSeleccionado)
    ) {
      this.cerrarPerfil();
    }
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    this.cerrarPerfil();
  }
}