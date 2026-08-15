import {
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { AuthService } from '@core/services/auth.service';

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

  readonly abierto = input.required<boolean>();
  readonly cerrar = output<void>();

  readonly esAdministrador = computed(() => {
    return this.authService.esAdministrador();
  });

  readonly nombreRol = computed(() => {
    return this.authService.usuario()?.rol ===
      'ADMINISTRADOR'
      ? 'Administrador'
      : 'Operador';
  });
}