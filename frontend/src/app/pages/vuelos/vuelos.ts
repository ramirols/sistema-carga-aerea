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
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import {
  TableLazyLoadEvent,
  TableModule,
} from 'primeng/table';
import { TagModule } from 'primeng/tag';

import {
  EstadoVuelo,
  Vuelo,
  VueloRequest,
} from '@core/models/vuelo.model';

import { Encomienda } from '@core/models/encomienda.model';

import { VueloService } from '@core/services/vuelo.service';
import { EncomiendaService } from '@core/services/encomienda.service';
import { ExportService } from '@core/services/export.service';

@Component({
  selector: 'app-vuelos',
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
    ProgressBarModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './vuelos.html',

  // No coloques providers aquí.
})
export class Vuelos implements OnInit {
  private readonly service =
    inject(VueloService);

  private readonly encomiendaService =
    inject(EncomiendaService);

  private readonly exportService =
    inject(ExportService);

  private readonly formBuilder =
    inject(FormBuilder);

  /*
   * Estas inyecciones sí permanecen.
   * Los servicios se registran globalmente
   * en app.config.ts.
   */
  private readonly confirmationService =
    inject(ConfirmationService);

  private readonly messageService =
    inject(MessageService);

  readonly vuelos = signal<Vuelo[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly dialogoVisible = signal(false);

  readonly vueloEditado =
    signal<Vuelo | null>(null);

  readonly manifiestoVisible = signal(false);
  readonly cargandoManifiesto = signal(false);
  readonly vueloManifiesto = signal<Vuelo | null>(null);
  readonly encomiendasManifiesto = signal<Encomienda[]>([]);

  readonly total = signal(0);
  readonly pagina = signal(0);
  readonly tamanio = signal(10);

  readonly exportando = signal(false);

  readonly busqueda = signal('');
  readonly desde = signal<string | null>(null);
  readonly hasta = signal<string | null>(null);
  readonly estado = signal<EstadoVuelo | null>(null);

  readonly opcionesEstado: Array<{
    label: string;
    value: EstadoVuelo;
  }> = [
    { label: 'Programado', value: 'PROGRAMADO' },
    { label: 'Despachado', value: 'DESPACHADO' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];

  readonly formulario =
    this.formBuilder.nonNullable.group({
      codigo: [
        '',
        [
          Validators.required,
          Validators.maxLength(15),
        ],
      ],

      origen: [
        '',
        [
          Validators.required,
          Validators.maxLength(80),
        ],
      ],

      destino: [
        '',
        [
          Validators.required,
          Validators.maxLength(80),
        ],
      ],

      fechaSalida: [
        '',
        Validators.required,
      ],

      horaSalida: [
        '',
        Validators.required,
      ],

      capacidadMaximaKg: [
        0,
        [
          Validators.required,
          Validators.min(0.01),
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
        this.desde() ?? undefined,
        this.hasta() ?? undefined,
        this.estado() ?? undefined,
      )
      .subscribe({
        next: (pagina) => {
          this.vuelos.set(pagina.content);
          this.total.set(
            pagina.totalElements,
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
    this.estado.set(null);
    this.buscar();
  }

  cambiarPagina(
    evento: TableLazyLoadEvent,
  ): void {
    const first = evento.first ?? 0;
    const rows = evento.rows ?? 10;

    this.tamanio.set(rows);
    this.pagina.set(
      Math.floor(first / rows),
    );

    this.cargar();
  }

  abrirNuevo(): void {
    this.vueloEditado.set(null);

    this.formulario.reset({
      codigo: '',
      origen: '',
      destino: '',
      fechaSalida: '',
      horaSalida: '',
      capacidadMaximaKg: 0,
    });

    this.dialogoVisible.set(true);
  }

  abrirEdicion(vuelo: Vuelo): void {
    if (vuelo.estado !== 'PROGRAMADO') {
      return;
    }

    this.vueloEditado.set(vuelo);

    this.formulario.setValue({
      codigo: vuelo.codigo,
      origen: vuelo.origen,
      destino: vuelo.destino,
      fechaSalida: vuelo.fechaSalida,
      horaSalida:
        vuelo.horaSalida.substring(0, 5),
      capacidadMaximaKg:
        vuelo.capacidadMaximaKg,
    });

    this.dialogoVisible.set(true);
  }

  cerrarDialogo(): void {
    if (this.guardando()) {
      return;
    }

    this.dialogoVisible.set(false);
    this.vueloEditado.set(null);
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores =
      this.formulario.getRawValue();

    if (
      valores.origen
        .trim()
        .toLowerCase() ===
      valores.destino
        .trim()
        .toLowerCase()
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos inválidos',
        detail:
          'El origen y el destino no pueden ser iguales.',
      });

      return;
    }

    const editado =
      this.vueloEditado();

    if (
      editado &&
      valores.capacidadMaximaKg <
      editado.pesoOcupadoKg
    ) {
      this.messageService.add({
        severity: 'warn',
        summary:
          'Capacidad insuficiente',
        detail:
          'La capacidad no puede ser menor al peso ocupado.',
      });

      return;
    }

    const request: VueloRequest = {
      codigo: valores.codigo
        .trim()
        .toUpperCase(),

      origen:
        valores.origen.trim(),

      destino:
        valores.destino.trim(),

      fechaSalida:
        valores.fechaSalida,

      horaSalida:
        valores.horaSalida.length === 5
          ? `${valores.horaSalida}:00`
          : valores.horaSalida,

      capacidadMaximaKg:
        valores.capacidadMaximaKg,
    };

    this.guardando.set(true);

    const peticion = editado
      ? this.service.actualizar(
        editado.id,
        request,
      )
      : this.service.crear(request);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogoVisible.set(false);
        this.vueloEditado.set(null);

        this.messageService.add({
          severity: 'success',
          summary:
            'Operación completada',
          detail: editado
            ? 'El vuelo fue actualizado.'
            : 'El vuelo fue registrado.',
        });

        this.cargar();
      },

      error: () => {
        this.guardando.set(false);
      },
    });
  }

  exportarExcel(): void {
    this.obtenerTodosParaExportar((vuelos) => {
      void this.exportService.exportarExcel({
        titulo: 'Reporte de vuelos',
        subtitulo: 'Reporte de vuelos',
        nombreArchivo: 'vuelos',
        columnas: this.columnasExportacion(),
        datos: vuelos,
      });
    });
  }

  exportarPdf(): void {
    this.obtenerTodosParaExportar((vuelos) => {
      void this.exportService.exportarPdf({
        titulo: 'Reporte de vuelos',
        subtitulo: 'Reporte de vuelos',
        nombreArchivo: 'vuelos',
        columnas: this.columnasExportacion(),
        datos: vuelos,
      });
    });
  }

  private columnasExportacion() {
    return [
      { encabezado: 'Código', valor: (v: Vuelo) => v.codigo },
      { encabezado: 'Origen', valor: (v: Vuelo) => v.origen },
      { encabezado: 'Destino', valor: (v: Vuelo) => v.destino },
      {
        encabezado: 'Fecha salida',
        valor: (v: Vuelo) => v.fechaSalida,
      },
      {
        encabezado: 'Hora salida',
        valor: (v: Vuelo) => v.horaSalida.substring(0, 5),
      },
      {
        encabezado: 'Capacidad (kg)',
        valor: (v: Vuelo) => v.capacidadMaximaKg,
      },
      {
        encabezado: 'Ocupado (kg)',
        valor: (v: Vuelo) => v.pesoOcupadoKg,
      },
      {
        encabezado: 'Ocupación',
        valor: (v: Vuelo) =>
          `${this.porcentaje(v).toFixed(0)}%`,
      },
      { encabezado: 'Estado', valor: (v: Vuelo) => v.estado },
    ];
  }

  private obtenerTodosParaExportar(
    callback: (vuelos: Vuelo[]) => void,
  ): void {
    this.exportando.set(true);

    this.service
      .listar(
        0,
        10000,
        this.busqueda(),
        this.desde() ?? undefined,
        this.hasta() ?? undefined,
        this.estado() ?? undefined,
      )
      .subscribe({
        next: (pagina) => {
          this.exportando.set(false);
          callback(pagina.content);
        },
        error: () => {
          this.exportando.set(false);
        },
      });
  }

  abrirManifiesto(vuelo: Vuelo): void {
    this.vueloManifiesto.set(vuelo);
    this.encomiendasManifiesto.set([]);
    this.manifiestoVisible.set(true);
    this.cargandoManifiesto.set(true);

    this.encomiendaService
      .porVuelo(vuelo.id)
      .subscribe({
        next: (encomiendas) => {
          this.encomiendasManifiesto.set(
            encomiendas,
          );
          this.cargandoManifiesto.set(false);
        },
        error: () => {
          this.cargandoManifiesto.set(false);
        },
      });
  }

  cerrarManifiesto(): void {
    this.manifiestoVisible.set(false);
    this.vueloManifiesto.set(null);
    this.encomiendasManifiesto.set([]);
  }

  nombreEstado(estado: string): string {
    const nombres: Record<string, string> = {
      PROGRAMADO: 'Programado',
      DESPACHADO: 'Despachado',
      CANCELADO: 'Cancelado',
    };

    return nombres[estado] ?? estado;
  }

  nombreEstadoEncomienda(
    estado: string,
  ): string {
    const nombres: Record<string, string> = {
      EN_ALMACEN: 'En almacén',
      EMBARCADA: 'Embarcada',
      ENTREGADA: 'Entregada',
      CANCELADA: 'Cancelada',
    };

    return nombres[estado] ?? estado;
  }

  severidadEncomienda(
    estado: string,
  ):
    | 'success'
    | 'warn'
    | 'danger'
    | 'info' {
    switch (estado) {
      case 'ENTREGADA':
        return 'success';
      case 'CANCELADA':
        return 'danger';
      case 'EMBARCADA':
        return 'info';
      default:
        return 'warn';
    }
  }

  confirmarEliminar(
    vuelo: Vuelo,
  ): void {
    this.confirmationService.confirm({
      header: 'Eliminar vuelo',
      icon:
        'pi pi-exclamation-triangle',

      message:
        `¿Deseas eliminar el vuelo ${vuelo.codigo}?`,

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
        this.eliminar(vuelo);
      },
    });
  }

  private eliminar(vuelo: Vuelo): void {
    this.service
      .eliminar(vuelo.id)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Vuelo eliminado',
            detail:
              `El vuelo ${vuelo.codigo} fue eliminado.`,
          });

          this.cargar();
        },
      });
  }

  colorOcupacion(vuelo: Vuelo): string {
    const porcentaje = this.porcentaje(vuelo);

    if (porcentaje >= 100) {
      return '#dc2626';
    }

    if (porcentaje >= 90) {
      return '#f59e0b';
    }

    return '#16a34a';
  }

  alertaOcupacion(vuelo: Vuelo): 'lleno' | 'casi-lleno' | null {
    const porcentaje = this.porcentaje(vuelo);

    if (porcentaje >= 100) {
      return 'lleno';
    }

    if (porcentaje >= 90) {
      return 'casi-lleno';
    }

    return null;
  }

  porcentaje(vuelo: Vuelo): number {
    if (vuelo.capacidadMaximaKg <= 0) {
      return 0;
    }

    return Math.min(
      100,
      (
        vuelo.pesoOcupadoKg /
        vuelo.capacidadMaximaKg
      ) * 100,
    );
  }

  severidad(
    estado: string,
  ):
    | 'success'
    | 'warn'
    | 'danger'
    | 'info' {
    switch (estado) {
      case 'DESPACHADO':
        return 'success';

      case 'CANCELADO':
        return 'danger';

      default:
        return 'info';
    }
  }
}