import {
  Component,
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

  readonly formulario =
    this.formBuilder.nonNullable.group({
      codigo: [
        '',
        [
          Validators.required,
          Validators.maxLength(20),
        ],
      ],
      descripcion: [
        '',
        [
          Validators.required,
          Validators.maxLength(250),
        ],
      ],
      remitente: [
        '',
        [
          Validators.required,
          Validators.maxLength(120),
        ],
      ],
      destinatario: [
        '',
        [
          Validators.required,
          Validators.maxLength(120),
        ],
      ],
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

    this.formulario.reset({
      codigo: '',
      descripcion: '',
      remitente: '',
      destinatario: '',
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

    this.formulario.setValue({
      codigo: encomienda.codigo,
      descripcion: encomienda.descripcion,
      remitente: encomienda.remitente,
      destinatario: encomienda.destinatario,
      pesoKg: encomienda.pesoKg,
      largoCm: encomienda.largoCm,
      anchoCm: encomienda.anchoCm,
      altoCm: encomienda.altoCm,
    });

    this.dialogoVisible.set(true);
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
      codigo: valores.codigo
        .trim()
        .toUpperCase(),
      descripcion:
        valores.descripcion.trim(),
      remitente: valores.remitente.trim(),
      destinatario:
        valores.destinatario.trim(),
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
      next: () => {
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
      { encabezado: 'Código', valor: (e: Encomienda) => e.codigo },
      {
        encabezado: 'Descripción',
        valor: (e: Encomienda) => e.descripcion,
      },
      {
        encabezado: 'Remitente',
        valor: (e: Encomienda) => e.remitente,
      },
      {
        encabezado: 'Destinatario',
        valor: (e: Encomienda) => e.destinatario,
      },
      {
        encabezado: 'Peso cobrable (kg)',
        valor: (e: Encomienda) => e.pesoCobrableKg,
      },
      {
        encabezado: 'Vuelo',
        valor: (e: Encomienda) => e.codigoVuelo ?? 'Sin asignar',
      },
      { encabezado: 'Estado', valor: (e: Encomienda) => e.estado },
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
              'La asignación fue realizada correctamente.',
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

    this.formularioEstado.reset({
      estado: encomienda.estado,
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

    const estado =
      this.formularioEstado
        .getRawValue().estado;

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

    this.cambiandoEstado.set(true);

    this.service
      .cambiarEstado(encomienda.id, estado)
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
    };

    return nombres[estado];
  }

  severidadEstado(
    estado: EstadoEncomienda,
  ): 'info' | 'warn' | 'success' | 'danger' {
    switch (estado) {
      case 'EMBARCADA':
        return 'info';
      case 'ENTREGADA':
        return 'success';
      case 'CANCELADA':
        return 'danger';
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
}