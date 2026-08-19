import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';

import { SeguimientoService } from '@core/services/seguimiento.service';

type TipoAutorizado = 'persona' | 'empresa';

@Component({
  selector: 'app-consignatario',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DialogModule,
  ],
  templateUrl: './consignatario.html',
})
export class Consignatario {
  private readonly service = inject(SeguimientoService);
  private readonly ruta = inject(ActivatedRoute);

  readonly codigo = signal('');
  readonly dniDestinatarioOriginal = signal('');
  readonly nombre = signal('');
  readonly tipoAutorizado = signal<TipoAutorizado>('persona');
  readonly dni = signal('');
  readonly ruc = signal('');
  readonly motivo = signal('');
  readonly contacto = signal('');
  readonly cartaPoderArchivo = signal<File | null>(null);
  readonly aceptaTerminos = signal(false);

  readonly enviando = signal(false);
  readonly enviado = signal(false);
  readonly error = signal<string | null>(null);

  readonly infoModificarVisible = signal(false);

  abrirInfoModificar(): void {
    this.infoModificarVisible.set(true);
  }

  cerrarInfoModificar(): void {
    this.infoModificarVisible.set(false);
  }

  constructor() {
    const codigoQuery = this.ruta.snapshot.queryParamMap.get('codigo');

    if (codigoQuery) {
      this.codigo.set(codigoQuery);
    }
  }

  get identificacionAutorizado(): string {
    return this.tipoAutorizado() === 'empresa'
      ? this.ruc().trim()
      : this.dni().trim();
  }

  get formularioValido(): boolean {
    return (
      this.codigo().trim().length > 0 &&
      this.dniDestinatarioOriginal().trim().length > 0 &&
      this.nombre().trim().length > 0 &&
      this.identificacionAutorizado.length > 0 &&
      this.cartaPoderArchivo() !== null &&
      this.aceptaTerminos()
    );
  }

  private readonly TIPOS_PERMITIDOS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  seleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    if (!archivo) {
      this.cartaPoderArchivo.set(null);
      return;
    }

    if (!this.TIPOS_PERMITIDOS.includes(archivo.type)) {
      this.error.set('Solo se permiten imágenes (JPG, PNG, WEBP) o archivos PDF.');
      this.cartaPoderArchivo.set(null);
      input.value = '';
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      this.error.set('El archivo no puede superar los 5 MB.');
      this.cartaPoderArchivo.set(null);
      input.value = '';
      return;
    }

    this.error.set(null);
    this.cartaPoderArchivo.set(archivo);
  }

  enviar(): void {
    const archivo = this.cartaPoderArchivo();

    if (!this.formularioValido || !archivo || this.enviando()) {
      return;
    }

    const codigo = this.codigo().trim();

    this.error.set(null);
    this.enviando.set(true);

    this.service
      .autorizarRecojo(codigo, {
        dniDestinatarioOriginal: this.dniDestinatarioOriginal().trim(),
        nombre: this.nombre().trim(),
        dni: this.identificacionAutorizado,
        tipo: this.tipoAutorizado() === 'empresa' ? 'EMPRESA' : 'PERSONA',
        motivo: this.motivo().trim() || null,
        contacto: this.contacto().trim() || null,
      })
      .subscribe({
        next: () => {
          this.service.subirCartaPoder(codigo, archivo).subscribe({
            next: () => {
              this.enviando.set(false);
              this.enviado.set(true);
            },
            error: () => {
              this.enviando.set(false);
              this.error.set(
                'Autorizamos a la persona, pero no pudimos subir la ' +
                'carta poder. Vuelve a intentarlo o llévala impresa al ' +
                'momento del recojo.',
              );
            },
          });
        },
        error: (respuesta) => {
          this.enviando.set(false);
          this.error.set(
            respuesta?.error?.mensaje ??
            'No pudimos registrar el cambio de consignatario. Verifica ' +
            'que el código de seguimiento y el DNI del destinatario ' +
            'sean correctos e inténtalo de nuevo.',
          );
        },
      });
  }

  nuevaSolicitud(): void {
    this.codigo.set('');
    this.dniDestinatarioOriginal.set('');
    this.nombre.set('');
    this.tipoAutorizado.set('persona');
    this.dni.set('');
    this.ruc.set('');
    this.motivo.set('');
    this.contacto.set('');
    this.cartaPoderArchivo.set(null);
    this.aceptaTerminos.set(false);
    this.error.set(null);
    this.enviado.set(false);
  }
}
