import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';

import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  ConfirmationService,
  MessageService,
} from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import {
  TableLazyLoadEvent,
  TableModule,
} from 'primeng/table';
import { TagModule } from 'primeng/tag';

import {
  RolUsuario,
} from '@core/models/auth.model';

import {
  Usuario,
  UsuarioRequest,
  UsuarioUpdate,
} from '@core/models/usuario.model';

import {
  UsuarioService,
} from '@core/services/usuario.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private readonly service =
    inject(UsuarioService);

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly confirmationService =
    inject(ConfirmationService);

  private readonly messageService =
    inject(MessageService);

  readonly usuarios = signal<Usuario[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly dialogoVisible = signal(false);

  readonly usuarioEditado =
    signal<Usuario | null>(null);

  readonly total = signal(0);
  readonly pagina = signal(0);
  readonly tamanio = signal(10);

  readonly busqueda = signal('');
  readonly activoFiltro = signal<boolean | null>(null);

  readonly opcionesActivo: Array<{
    label: string;
    value: boolean;
  }> = [
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false },
  ];

  readonly cantidadActivos = computed(() =>
    this.usuarios().filter(
      (usuario) => usuario.activo,
    ).length,
  );

  readonly cantidadInactivos = computed(() =>
    this.usuarios().filter(
      (usuario) => !usuario.activo,
    ).length,
  );

  readonly opcionesRol: Array<{
    label: string;
    value: RolUsuario;
  }> = [
      {
        label: 'Administrador',
        value: 'ADMINISTRADOR',
      },
      {
        label: 'Operador',
        value: 'OPERADOR',
      },
    ];

  readonly formulario =
    this.formBuilder.nonNullable.group({
      username: [
        '',
        [
          Validators.required,
          Validators.maxLength(50),
        ],
      ],
      nombreCompleto: [
        '',
        [
          Validators.required,
          Validators.maxLength(120),
        ],
      ],
      rol: [
        'OPERADOR' as RolUsuario,
        Validators.required,
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100),
        ],
      ],
    });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);

    this.service
      .listar(
        this.pagina(),
        this.tamanio(),
        this.busqueda(),
        this.activoFiltro() ?? undefined,
      )
      .subscribe({
        next: (respuesta) => {
          this.usuarios.set(respuesta.content);
          this.total.set(
            respuesta.totalElements,
          );
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
        },
      });
  }

  buscar(): void {
    this.pagina.set(0);
    this.cargar();
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.activoFiltro.set(null);
    this.buscar();
  }

  cambiarPagina(
    evento: TableLazyLoadEvent,
  ): void {
    const first = evento.first ?? 0;
    const rows = evento.rows ?? 10;

    this.pagina.set(Math.floor(first / rows));
    this.tamanio.set(rows);
    this.cargar();
  }

  abrirNuevo(): void {
    this.usuarioEditado.set(null);

    this.formulario.controls.username.enable();

    this.formulario.controls.password.setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(100),
    ]);

    this.formulario.reset({
      username: '',
      nombreCompleto: '',
      rol: 'OPERADOR',
      password: '',
    });

    this.formulario.controls.password
      .updateValueAndValidity();

    this.dialogoVisible.set(true);
  }

  abrirEdicion(usuario: Usuario): void {
    this.usuarioEditado.set(usuario);

    this.formulario.controls.username.enable();

    this.formulario.reset({
      username: usuario.username,
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
      password: '',
    });

    this.formulario.controls.username.disable();

    this.formulario.controls.password.setValidators([
      Validators.minLength(8),
      Validators.maxLength(100),
    ]);

    this.formulario.controls.password
      .updateValueAndValidity();

    this.dialogoVisible.set(true);
  }

  cerrarDialogo(): void {
    if (this.guardando()) {
      return;
    }

    this.dialogoVisible.set(false);
  }

  alOcultarDialogo(): void {
    if (this.guardando()) {
      return;
    }

    this.usuarioEditado.set(null);
    this.formulario.markAsUntouched();
    this.formulario.controls.username.enable();
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const editado = this.usuarioEditado();
    const valores = this.formulario.getRawValue();

    this.guardando.set(true);

    if (editado) {
      const request: UsuarioUpdate = {
        nombreCompleto:
          valores.nombreCompleto.trim(),
        rol: valores.rol,
      };

      if (valores.password.trim()) {
        request.password = valores.password;
      }

      this.service
        .actualizar(editado.id, request)
        .subscribe({
          next: () => {
            this.finalizarGuardado(
              'El usuario fue actualizado.',
            );
          },
          error: () => {
            this.guardando.set(false);
          },
        });

      return;
    }

    const request: UsuarioRequest = {
      username: valores.username.trim(),
      password: valores.password,
      nombreCompleto:
        valores.nombreCompleto.trim(),
      rol: valores.rol,
    };

    this.service.crear(request).subscribe({
      next: () => {
        this.finalizarGuardado(
          'El usuario fue registrado.',
        );
      },
      error: () => {
        this.guardando.set(false);
      },
    });
  }

  confirmarCambioEstado(
    usuario: Usuario,
  ): void {
    const activar = !usuario.activo;

    this.confirmationService.confirm({
      header: activar
        ? 'Activar usuario'
        : 'Desactivar usuario',
      icon: activar
        ? 'pi pi-check-circle'
        : 'pi pi-exclamation-triangle',
      message: activar
        ? `¿Deseas activar al usuario ${usuario.username}?`
        : `¿Deseas desactivar al usuario ${usuario.username}?`,
      acceptLabel: activar
        ? 'Activar'
        : 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {
        severity: activar
          ? 'success'
          : 'warn',
      },
      rejectButtonProps: {
        severity: 'secondary',
        outlined: true,
      },
      accept: () => {
        this.cambiarEstado(usuario, activar);
      },
    });
  }

  confirmarEliminar(usuario: Usuario): void {
    this.confirmationService.confirm({
      header: 'Eliminar usuario',
      icon: 'pi pi-exclamation-triangle',
      message:
        `¿Deseas eliminar definitivamente al usuario ${usuario.username}?`,
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {
        severity: 'danger',
      },
      rejectButtonProps: {
        severity: 'secondary',
        outlined: true,
      },
      accept: () => {
        this.eliminar(usuario);
      },
    });
  }

  nombreRol(rol: RolUsuario): string {
    return rol === 'ADMINISTRADOR'
      ? 'Administrador'
      : 'Operador';
  }

  severidadRol(
    rol: RolUsuario,
  ): 'info' | 'secondary' {
    return rol === 'ADMINISTRADOR'
      ? 'info'
      : 'secondary';
  }

  private cambiarEstado(
    usuario: Usuario,
    activo: boolean,
  ): void {
    this.service
      .cambiarEstado(usuario.id, activo)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: activo
              ? 'Usuario activado'
              : 'Usuario desactivado',
            detail:
              `${usuario.username} fue actualizado correctamente.`,
          });

          this.cargar();
        },
      });
  }

  private eliminar(usuario: Usuario): void {
    this.service
      .eliminar(usuario.id)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Usuario eliminado',
            detail:
              `${usuario.username} fue eliminado.`,
          });

          this.cargar();
        },
      });
  }

  private finalizarGuardado(
    mensaje: string,
  ): void {
    this.guardando.set(false);
    this.dialogoVisible.set(false);
    this.usuarioEditado.set(null);

    this.messageService.add({
      severity: 'success',
      summary: 'Operación completada',
      detail: mensaje,
    });

    this.cargar();
  }
}