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

import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';

import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
  ],
  templateUrl: './login.html',
})
export class Login {
  private readonly formBuilder =
    inject(FormBuilder);

  private readonly authService =
    inject(AuthService);

  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly mensajeError = signal('');

  readonly formulario =
    this.formBuilder.nonNullable.group({
      username: [
        '',
        Validators.required,
      ],
      password: [
        '',
        Validators.required,
      ],
    });

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
          void this.router.navigate([
            '/dashboard',
          ]);
        },
        error: (error) => {
          this.cargando.set(false);

          this.mensajeError.set(
            error.error?.mensaje ??
            'No fue posible iniciar sesión.',
          );
        },
      });
  }
}