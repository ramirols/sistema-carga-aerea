import {
  Component,
  inject,
  output,
} from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { Popover } from 'primeng/popover';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    Popover,
  ],
  templateUrl: './header.html',
})
export class Header {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  readonly abrirMenu = output<void>();

  salir(): void {
    this.authService.cerrarSesion();
    void this.router.navigate(['/login']);
  }
}