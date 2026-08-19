import {
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Router,
  RouterLink,
} from '@angular/router';

import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './login.html',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly mostrarPassword = signal(false);
  readonly mensajeError = signal('');

  readonly formulario = this.formBuilder.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  alternarPassword(): void {
    this.mostrarPassword.update((mostrar) => !mostrar);
  }

  ingresar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set('');

    this.authService
      .login(this.formulario.getRawValue())
      .subscribe({
        next: () => {
          this.cargando.set(false);
          void this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.cargando.set(false);

          this.mensajeError.set(
            error.error?.mensaje ??
            'El usuario o la contraseña son incorrectos.'
          );
        },
      });
  }
}