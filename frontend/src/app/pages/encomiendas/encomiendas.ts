import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  DatePipe,
  DecimalPipe,
} from '@angular/common';

import {
  FormBuilder,
  FormControl,
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
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
  TableLazyLoadEvent,
  TableModule,
} from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

import {
  Encomienda,
  EncomiendaRequest,
  EstadoEncomienda,
} from '@core/models/encomienda.model';

import {
  Vuelo,
} from '@core/models/vuelo.model';

import {
  EncomiendaService,
} from '@core/services/encomienda.service';

import {
  VueloService,
} from '@core/services/vuelo.service';

import {
  ExportService,
} from '@core/services/export.service';

@Component({
  selector: 'app-encomiendas',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
  ],
  templateUrl: './encomiendas.html',
})
export class Encomiendas implements OnInit {
  private readonly service =
    inject(EncomiendaService);

  private readonly vueloService =
    inject(VueloService);

  private readonly exportService =
    inject(ExportService);

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly confirmationService =
    inject(ConfirmationService);

  private readonly messageService =
    inject(MessageService);

  readonly encomiendas =
    signal<Encomienda[]>([]);

  readonly vuelosDisponibles =
    signal<Vuelo[]>([]);

  readonly vueloIdSeleccionado = signal(0);

  readonly vueloSeleccionadoInfo = computed(() =>
    this.vuelosDisponibles().find(
      (vuelo) => vuelo.id === this.vueloIdSeleccionado(),
    ) ?? null,
  );

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly asignando = signal(false);
  readonly cambiandoEstado = signal(false);

  readonly dialogoVisible = signal(false);

  readonly dialogoAsignacionVisible =
    signal(false);

  readonly dialogoEstadoVisible =
    signal(false);

  readonly encomiendaEditada =
    signal<Encomienda | null>(null);

  readonly encomiendaSeleccionada =
    signal<Encomienda | null>(null);

  readonly total = signal(0);
  readonly pagina = signal(0);
  readonly tamanio = signal(10);

  readonly exportando = signal(false);

  readonly busqueda = signal('');
  readonly desde = signal<string | null>(null);
  readonly hasta = signal<string | null>(null);
  readonly estadoFiltro = signal<EstadoEncomienda | null>(null);

  readonly tipoAutorizado =
    signal<'persona' | 'empresa'>('persona');

  readonly opcionesTipoAutorizado: Array<{
    label: string;
    value: 'persona' | 'empresa';
  }> = [
      {
        label: 'Persona',
        value: 'persona',
      },
      {
        label: 'Empresa',
        value: 'empresa',
      },
    ];

  readonly opcionesEstado: Array<{
    label: string;
    value: EstadoEncomienda;
  }> = [
      {
        label: 'En almacén',
        value: 'EN_ALMACEN',
      },
      {
        label: 'Embarcada',
        value: 'EMBARCADA',
      },
      {
        label: 'Entregada',
        value: 'ENTREGADA',
      },
      {
        label: 'Cancelada',
        value: 'CANCELADA',
      },
    ];

  readonly opcionesEstadoFiltro: Array<{
    label: string;
    value: EstadoEncomienda;
  }> = [
      ...this.opcionesEstado,
      {
        label: 'Abandonada',
        value: 'ABANDONADA',
      },
    ];

  readonly codigoGenerado =
    signal<string | null>(null);

  readonly formulario =
    this.formBuilder.nonNullable.group({
      contenido: [
        '',
        [
          Validators.required,
          Validators.maxLength(150),
        ],
      ],
      descripcion: new FormControl<string | null>(
        null,
        Validators.maxLength(250),
      ),
      remitente: [
        '',
        [
          Validators.required,
          Validators.maxLength(120),
        ],
      ],
      remitenteDni: new FormControl<string | null>(
        null,
        Validators.maxLength(15),
      ),
      remitenteTelefono: new FormControl<string | null>(
        null,
        Validators.maxLength(20),
      ),
      remitenteCorreo: new FormControl<string | null>(
        null,
        [Validators.maxLength(150), Validators.email],
      ),
      destinatario: [
        '',
        [
          Validators.required,
          Validators.maxLength(120),
        ],
      ],
      destinatarioDni: [
        '',
        [
          Validators.required,
          Validators.maxLength(15),
        ],
      ],
      personaAutorizadaNombre: new FormControl<string | null>(
        null,
        Validators.maxLength(120),
      ),
      personaAutorizadaDni: new FormControl<string | null>(
        null,
        Validators.maxLength(15),
      ),
      pesoKg: [
        0,
        [
          Validators.required,
          Validators.min(0.01),
        ],
      ],
      largoCm: new FormControl<number | null>(
        null,
        Validators.min(0.01),
      ),
      anchoCm: new FormControl<number | null>(
        null,
        Validators.min(0.01),
      ),
      altoCm: new FormControl<number | null>(
        null,
        Validators.min(0.01),
      ),
    });

  readonly formularioAsignacion =
    this.formBuilder.nonNullable.group({
      vueloId: [
        0,
        Validators.min(1),
      ],
    });

  readonly formularioEstado =
    this.formBuilder.nonNullable.group({
      estado: [
        'EN_ALMACEN' as EstadoEncomienda,
        Validators.required,
      ],
      recibidoPorNombre: new FormControl<string | null>(
        null,
        Validators.maxLength(120),
      ),
      recibidoPorDni: new FormControl<string | null>(
        null,
        Validators.maxLength(15),
      ),
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
        this.desde() ?? undefined,
        this.hasta() ?? undefined,
        this.estadoFiltro() ?? undefined,
      )
      .subscribe({
        next: (respuesta) => {
          this.encomiendas.set(
            respuesta.content,
          );
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
    this.desde.set(null);
    this.hasta.set(null);
    this.estadoFiltro.set(null);
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

  abrirNueva(): void {
    this.encomiendaEditada.set(null);
    this.tipoAutorizado.set('persona');

    this.formulario.reset({
      contenido: '',
      descripcion: null,
      remitente: '',
      remitenteDni: null,
      remitenteTelefono: null,
      remitenteCorreo: null,
      destinatario: '',
      destinatarioDni: '',
      personaAutorizadaNombre: null,
      personaAutorizadaDni: null,
      pesoKg: 0,
      largoCm: null,
      anchoCm: null,
      altoCm: null,
    });

    this.dialogoVisible.set(true);
  }

  abrirEdicion(
    encomienda: Encomienda,
  ): void {
    if (
      encomienda.estado !== 'EN_ALMACEN'
    ) {
      return;
    }

    this.encomiendaEditada.set(encomienda);
    this.tipoAutorizado.set(
      encomienda.tipoPersonaAutorizada === 'EMPRESA' ? 'empresa' : 'persona',
    );

    this.formulario.setValue({
      contenido: encomienda.contenido,
      descripcion: encomienda.descripcion,
      remitente: encomienda.remitente,
      remitenteDni: encomienda.remitenteDni,
      remitenteTelefono: encomienda.remitenteTelefono,
      remitenteCorreo: encomienda.remitenteCorreo,
      destinatario: encomienda.destinatario,
      destinatarioDni: encomienda.destinatarioDni,
      personaAutorizadaNombre: encomienda.personaAutorizadaNombre,
      personaAutorizadaDni: encomienda.personaAutorizadaDni,
      pesoKg: encomienda.pesoKg,
      largoCm: encomienda.largoCm,
      anchoCm: encomienda.anchoCm,
      altoCm: encomienda.altoCm,
    });

    this.dialogoVisible.set(true);
  }

  cerrarCodigoGenerado(): void {
    this.codigoGenerado.set(null);
  }

  copiarCodigoGenerado(): void {
    const codigo = this.codigoGenerado();

    if (codigo) {
      void navigator.clipboard.writeText(codigo);

      this.messageService.add({
        severity: 'info',
        summary: 'Copiado',
        detail: 'El código se copió al portapapeles.',
      });
    }
  }

  cerrarFormulario(): void {
    if (!this.guardando()) {
      this.dialogoVisible.set(false);
    }
  }

  alOcultarFormulario(): void {
    if (!this.guardando()) {
      this.encomiendaEditada.set(null);
      this.formulario.markAsUntouched();
    }
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores =
      this.formulario.getRawValue();

    const request: EncomiendaRequest = {
      contenido: valores.contenido.trim(),
      descripcion:
        valores.descripcion?.trim() || null,
      remitente: valores.remitente.trim(),
      remitenteDni:
        valores.remitenteDni?.trim() || null,
      remitenteTelefono:
        valores.remitenteTelefono?.trim() || null,
      remitenteCorreo:
        valores.remitenteCorreo?.trim() || null,
      destinatario:
        valores.destinatario.trim(),
      destinatarioDni:
        valores.destinatarioDni.trim(),
      personaAutorizadaNombre:
        valores.personaAutorizadaNombre?.trim() || null,
      personaAutorizadaDni:
        valores.personaAutorizadaDni?.trim() || null,
      tipoPersonaAutorizada: valores.personaAutorizadaNombre?.trim()
        ? this.tipoAutorizado() === 'empresa'
          ? 'EMPRESA'
          : 'PERSONA'
        : null,
      pesoKg: valores.pesoKg,
      largoCm: valores.largoCm,
      anchoCm: valores.anchoCm,
      altoCm: valores.altoCm,
    };

    const editada =
      this.encomiendaEditada();

    this.guardando.set(true);

    const peticion = editada
      ? this.service.actualizar(
        editada.id,
        request,
      )
      : this.service.crear(request);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando.set(false);
        this.dialogoVisible.set(false);
        this.encomiendaEditada.set(null);

        this.messageService.add({
          severity: 'success',
          summary: 'Operación completada',
          detail: editada
            ? 'La encomienda fue actualizada.'
            : 'La encomienda fue registrada.',
        });

        if (!editada) {
          this.codigoGenerado.set(respuesta.codigo);
        }

        this.cargar();
      },
      error: () => {
        this.guardando.set(false);
      },
    });
  }

  exportarExcel(): void {
    this.obtenerTodasParaExportar((encomiendas) => {
      void this.exportService.exportarExcel({
        titulo: 'Reporte de encomiendas',
        subtitulo: 'Reporte de encomiendas',
        nombreArchivo: 'encomiendas',
        columnas: this.columnasExportacion(),
        datos: encomiendas,
      });
    });
  }

  exportarPdf(): void {
    this.obtenerTodasParaExportar((encomiendas) => {
      void this.exportService.exportarPdf({
        titulo: 'Reporte de encomiendas',
        subtitulo: 'Reporte de encomiendas',
        nombreArchivo: 'encomiendas',
        columnas: this.columnasExportacion(),
        datos: encomiendas,
      });
    });
  }

  private columnasExportacion() {
    return [
      { encabezado: 'Código', valor: (e: Encomienda) => e.codigo, ancho: 28 },
      {
        encabezado: 'Contenido',
        valor: (e: Encomienda) => e.contenido,
        ancho: 55,
      },
      {
        encabezado: 'Remitente',
        valor: (e: Encomienda) => e.remitente,
        ancho: 35,
      },
      {
        encabezado: 'Destinatario',
        valor: (e: Encomienda) => e.destinatario,
        ancho: 35,
      },
      {
        encabezado: 'Peso cobrable (kg)',
        valor: (e: Encomienda) => e.pesoCobrableKg,
        ancho: 28,
      },
      {
        encabezado: 'Vuelo',
        valor: (e: Encomienda) => e.codigoVuelo ?? 'Sin asignar',
        ancho: 28,
      },
      { encabezado: 'Estado', valor: (e: Encomienda) => e.estado, ancho: 24 },
    ];
  }

  private obtenerTodasParaExportar(
    callback: (encomiendas: Encomienda[]) => void,
  ): void {
    this.exportando.set(true);

    this.service
      .listar(
        0,
        10000,
        this.busqueda(),
        this.desde() ?? undefined,
        this.hasta() ?? undefined,
        this.estadoFiltro() ?? undefined,
      )
      .subscribe({
        next: (respuesta) => {
          this.exportando.set(false);
          callback(respuesta.content);
        },
        error: () => {
          this.exportando.set(false);
        },
      });
  }

  abrirAsignacion(
    encomienda: Encomienda,
  ): void {
    this.encomiendaSeleccionada.set(
      encomienda,
    );

    this.formularioAsignacion.reset({
      vueloId: encomienda.vueloId ?? 0,
    });

    this.vueloIdSeleccionado.set(encomienda.vueloId ?? 0);

    this.cargarVuelosDisponibles();
    this.dialogoAsignacionVisible.set(true);
  }

  cerrarAsignacion(): void {
    if (!this.asignando()) {
      this.dialogoAsignacionVisible.set(false);
    }
  }

  alOcultarAsignacion(): void {
    if (!this.asignando()) {
      this.encomiendaSeleccionada.set(null);
    }
  }

  asignarVuelo(): void {
    if (this.formularioAsignacion.invalid) {
      this.formularioAsignacion
        .markAllAsTouched();
      return;
    }

    const encomienda =
      this.encomiendaSeleccionada();

    if (!encomienda) {
      return;
    }

    const vueloId =
      this.formularioAsignacion
        .getRawValue().vueloId;

    this.asignando.set(true);

    this.service
      .asignarVuelo(encomienda.id, vueloId)
      .subscribe({
        next: () => {
          this.asignando.set(false);

          this.dialogoAsignacionVisible.set(
            false,
          );

          this.encomiendaSeleccionada.set(
            null,
          );

          this.messageService.add({
            severity: 'success',
            summary: 'Vuelo asignado',
            detail:
              'La encomienda quedó asignada y embarcada en el vuelo.',
          });

          this.cargar();
        },
        error: () => {
          this.asignando.set(false);
        },
      });
  }

  abrirCambioEstado(
    encomienda: Encomienda,
  ): void {
    this.encomiendaSeleccionada.set(
      encomienda,
    );

    const tieneAutorizadoAprobado =
      encomienda.estadoAutorizacion === 'APROBADA' &&
      !!encomienda.personaAutorizadaNombre;

    this.formularioEstado.reset({
      estado: encomienda.estado,
      recibidoPorNombre: tieneAutorizadoAprobado
        ? encomienda.personaAutorizadaNombre
        : encomienda.destinatario,
      recibidoPorDni: tieneAutorizadoAprobado
        ? encomienda.personaAutorizadaDni
        : encomienda.destinatarioDni,
    });

    this.dialogoEstadoVisible.set(true);
  }

  cerrarEstado(): void {
    if (!this.cambiandoEstado()) {
      this.dialogoEstadoVisible.set(false);
    }
  }

  alOcultarEstado(): void {
    if (!this.cambiandoEstado()) {
      this.encomiendaSeleccionada.set(null);
    }
  }

  cambiarEstado(): void {
    if (this.formularioEstado.invalid) {
      this.formularioEstado.markAllAsTouched();
      return;
    }

    const encomienda =
      this.encomiendaSeleccionada();

    if (!encomienda) {
      return;
    }

    const valores =
      this.formularioEstado
        .getRawValue();

    const estado = valores.estado;

    if (
      estado === 'EMBARCADA' &&
      !encomienda.vueloId
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Vuelo requerido',
        detail:
          'Debes asignar un vuelo antes de embarcar.',
      });

      return;
    }

    const recibidoPorNombre =
      valores.recibidoPorNombre?.trim() || '';
    const recibidoPorDni =
      valores.recibidoPorDni?.trim() || '';

    if (
      estado === 'ENTREGADA' &&
      (!recibidoPorNombre || !recibidoPorDni)
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos de entrega requeridos',
        detail:
          'Debes registrar el nombre y DNI de quien recibió la encomienda.',
      });

      return;
    }

    this.cambiandoEstado.set(true);

    this.service
      .cambiarEstado(
        encomienda.id,
        estado,
        recibidoPorNombre || undefined,
        recibidoPorDni || undefined,
      )
      .subscribe({
        next: () => {
          this.cambiandoEstado.set(false);
          this.dialogoEstadoVisible.set(false);
          this.encomiendaSeleccionada.set(null);

          this.messageService.add({
            severity: 'success',
            summary: 'Estado actualizado',
            detail:
              'La encomienda fue actualizada.',
          });

          this.cargar();
        },
        error: () => {
          this.cambiandoEstado.set(false);
        },
      });
  }

  confirmarEliminar(
    encomienda: Encomienda,
  ): void {
    this.confirmationService.confirm({
      header: 'Eliminar encomienda',
      icon: 'pi pi-exclamation-triangle',
      message:
        `¿Deseas eliminar la encomienda ${encomienda.codigo}?`,
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
        this.eliminar(encomienda);
      },
    });
  }

  contarEstado(
    estado: EstadoEncomienda,
  ): number {
    return this.encomiendas().filter(
      (encomienda) =>
        encomienda.estado === estado,
    ).length;
  }

  nombreEstado(
    estado: EstadoEncomienda,
  ): string {
    const nombres: Record<
      EstadoEncomienda,
      string
    > = {
      EN_ALMACEN: 'En almacén',
      EMBARCADA: 'Embarcada',
      ENTREGADA: 'Entregada',
      CANCELADA: 'Cancelada',
      ABANDONADA: 'Abandonada',
    };

    return nombres[estado];
  }

  severidadEstado(
    estado: EstadoEncomienda,
  ): 'info' | 'warn' | 'success' | 'danger' | 'secondary' {
    switch (estado) {
      case 'EMBARCADA':
        return 'info';
      case 'ENTREGADA':
        return 'success';
      case 'CANCELADA':
        return 'danger';
      case 'ABANDONADA':
        return 'secondary';
      default:
        return 'warn';
    }
  }

  private cargarVuelosDisponibles(): void {
    this.vueloService
      .listar(0, 100)
      .subscribe({
        next: (respuesta) => {
          this.vuelosDisponibles.set(
            respuesta.content.filter(
              (vuelo) =>
                vuelo.estado === 'PROGRAMADO',
            ),
          );
        },
      });
  }

  private eliminar(
    encomienda: Encomienda,
  ): void {
    this.service
      .eliminar(encomienda.id)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Encomienda eliminada',
            detail:
              `${encomienda.codigo} fue eliminada.`,
          });

          this.cargar();
        },
      });
  }

  confirmarAbandonar(
    encomienda: Encomienda,
  ): void {
    this.confirmationService.confirm({
      header: 'Declarar en abandono',
      icon: 'pi pi-exclamation-triangle',
      message:
        `¿Deseas declarar en abandono la encomienda ${encomienda.codigo}? ` +
        'Se liberará el vuelo asignado y se eliminará cualquier autorización de recojo pendiente.',
      acceptLabel: 'Declarar abandono',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {
        severity: 'danger',
      },
      rejectButtonProps: {
        severity: 'secondary',
        outlined: true,
      },
      accept: () => {
        this.marcarAbandonada(encomienda);
      },
    });
  }

  private marcarAbandonada(
    encomienda: Encomienda,
  ): void {
    this.service
      .marcarAbandonada(encomienda.id)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Encomienda declarada en abandono',
            detail:
              `${encomienda.codigo} quedó marcada como abandonada.`,
          });

          this.cargar();
        },
      });
  }

  confirmarDesembarcar(
    encomienda: Encomienda,
  ): void {
    this.confirmationService.confirm({
      header: 'Desembarcar encomienda',
      icon: 'pi pi-exclamation-triangle',
      message:
        `¿Deseas desembarcar la encomienda ${encomienda.codigo}? ` +
        'Volverá a "En almacén" y se liberará el espacio en el vuelo.',
      acceptLabel: 'Desembarcar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: {
        severity: 'warn',
      },
      rejectButtonProps: {
        severity: 'secondary',
        outlined: true,
      },
      accept: () => {
        this.desembarcar(encomienda);
      },
    });
  }

  private desembarcar(
    encomienda: Encomienda,
  ): void {
    this.service
      .desembarcar(encomienda.id)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Encomienda desembarcada',
            detail:
              `${encomienda.codigo} volvió a "En almacén".`,
          });

          this.cargar();
        },
      });
  }
}