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

import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from 'primeng/autocomplete';
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

const PATRON_HORA_12 = /^(0?[1-9]|1[0-2]):[0-5][0-9]$/;
const PATRON_AEROPUERTO = /^[A-Za-z]{3}$/;

@Component({
  selector: 'app-vuelos',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    ReactiveFormsModule,
    AutoCompleteModule,
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

  private readonly confirmationService =
    inject(ConfirmationService);

  private readonly messageService =
    inject(MessageService);

  readonly fechaMinima = new Date().toISOString().slice(0, 10);

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

  readonly dialogoEstadoVisible = signal(false);
  readonly cambiandoEstado = signal(false);
  readonly vueloSeleccionado = signal<Vuelo | null>(null);

  readonly formularioEstado =
    this.formBuilder.nonNullable.group({
      estado: ['PROGRAMADO' as EstadoVuelo, Validators.required],
    });

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

  readonly opcionesHora = this.generarOpcionesHora();
  readonly sugerenciasHora = signal<string[]>([]);

  filtrarHora(
    evento: AutoCompleteCompleteEvent,
    control: 'horaSalidaValor' | 'horaLlegadaValor',
  ): void {
    const formateada = this.formatearHora(evento.query);

    if (formateada !== evento.query) {
      this.formulario.controls[control].setValue(formateada, {
        emitEvent: false,
      });
    }

    const consulta = formateada.toLowerCase();

    this.sugerenciasHora.set(
      this.opcionesHora
        .filter((opcion) => opcion.label.toLowerCase().includes(consulta))
        .map((opcion) => opcion.value),
    );
  }

  private formatearHora(texto: string): string {
    const digitos = texto.replace(/\D/g, '').slice(0, 4);

    if (digitos.length === 0) {
      return '';
    }

    const primerDigito = digitos[0];
    const segundoDigito = digitos[1];

    const horaDeDosDigitos =
      primerDigito === '1' &&
      segundoDigito !== undefined &&
      Number(primerDigito + segundoDigito) <= 12;

    const largoHora = horaDeDosDigitos ? 2 : 1;
    const hora = digitos.slice(0, largoHora);
    const minutos = digitos.slice(largoHora, largoHora + 2);

    return minutos ? `${hora}:${minutos}` : hora;
  }

  readonly opcionesPeriodo: Array<{
    label: string;
    value: 'AM' | 'PM';
  }> = [
    { label: 'AM', value: 'AM' },
    { label: 'PM', value: 'PM' },
  ];

  private generarOpcionesHora(): Array<{
    label: string;
    value: string;
  }> {
    const opciones: Array<{ label: string; value: string }> = [];

    for (let hora = 1; hora <= 12; hora++) {
      for (const minuto of [0, 15, 30, 45]) {
        const valor =
          `${String(hora).padStart(2, '0')}:` +
          `${String(minuto).padStart(2, '0')}`;

        opciones.push({ label: valor, value: valor });
      }
    }

    return opciones;
  }

  private combinarHora(
    valor12: string,
    periodo: 'AM' | 'PM',
  ): string {
    const [horaTexto, minutoTexto] = valor12.split(':');
    let hora = Number(horaTexto);

    if (periodo === 'PM' && hora !== 12) {
      hora += 12;
    } else if (periodo === 'AM' && hora === 12) {
      hora = 0;
    }

    return `${String(hora).padStart(2, '0')}:${minutoTexto}:00`;
  }

  private separarHora(hora24: string): {
    valor: string;
    periodo: 'AM' | 'PM';
  } {
    const [horaTexto, minutoTexto] = hora24.split(':');
    const hora = Number(horaTexto);

    const periodo: 'AM' | 'PM' = hora < 12 ? 'AM' : 'PM';
    const hora12 = hora % 12 === 0 ? 12 : hora % 12;

    return {
      valor: `${String(hora12).padStart(2, '0')}:${minutoTexto}`,
      periodo,
    };
  }

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

      codigoAeropuertoOrigen: [
        '',
        [
          Validators.required,
          Validators.pattern(PATRON_AEROPUERTO),
        ],
      ],

      destino: [
        '',
        [
          Validators.required,
          Validators.maxLength(80),
        ],
      ],

      codigoAeropuertoDestino: [
        '',
        [
          Validators.required,
          Validators.pattern(PATRON_AEROPUERTO),
        ],
      ],

      terminalCargaDestino: new FormControl<string | null>(
        null,
        Validators.maxLength(80),
      ),

      fechaSalida: [
        '',
        Validators.required,
      ],

      horaSalidaValor: [
        '',
        [
          Validators.required,
          Validators.pattern(PATRON_HORA_12),
        ],
      ],

      horaSalidaPeriodo: [
        'AM' as 'AM' | 'PM',
        Validators.required,
      ],

      fechaLlegada: [
        '',
        Validators.required,
      ],

      horaLlegadaValor: [
        '',
        [
          Validators.required,
          Validators.pattern(PATRON_HORA_12),
        ],
      ],

      horaLlegadaPeriodo: [
        'AM' as 'AM' | 'PM',
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
      codigoAeropuertoOrigen: '',
      destino: '',
      codigoAeropuertoDestino: '',
      terminalCargaDestino: null,
      fechaSalida: '',
      horaSalidaValor: '',
      horaSalidaPeriodo: 'AM',
      fechaLlegada: '',
      horaLlegadaValor: '',
      horaLlegadaPeriodo: 'AM',
      capacidadMaximaKg: 0,
    });

    this.dialogoVisible.set(true);
  }

  abrirEdicion(vuelo: Vuelo): void {
    if (vuelo.estado !== 'PROGRAMADO') {
      return;
    }

    this.vueloEditado.set(vuelo);

    const salida = this.separarHora(vuelo.horaSalida);
    const llegada = this.separarHora(vuelo.horaLlegada);

    this.formulario.setValue({
      codigo: vuelo.codigo,
      origen: vuelo.origen,
      codigoAeropuertoOrigen: vuelo.codigoAeropuertoOrigen,
      destino: vuelo.destino,
      codigoAeropuertoDestino: vuelo.codigoAeropuertoDestino,
      terminalCargaDestino: vuelo.terminalCargaDestino,
      fechaSalida: vuelo.fechaSalida,
      horaSalidaValor: salida.valor,
      horaSalidaPeriodo: salida.periodo,
      fechaLlegada: vuelo.fechaLlegada,
      horaLlegadaValor: llegada.valor,
      horaLlegadaPeriodo: llegada.periodo,
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

    const horaSalida24 = this.combinarHora(
      valores.horaSalidaValor,
      valores.horaSalidaPeriodo,
    );

    const horaLlegada24 = this.combinarHora(
      valores.horaLlegadaValor,
      valores.horaLlegadaPeriodo,
    );

    const salida = new Date(
      `${valores.fechaSalida}T${horaSalida24}`,
    );

    const llegada = new Date(
      `${valores.fechaLlegada}T${horaLlegada24}`,
    );

    if (llegada.getTime() <= salida.getTime()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos inválidos',
        detail:
          'La llegada debe ser posterior a la salida.',
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

      codigoAeropuertoOrigen:
        valores.codigoAeropuertoOrigen.trim().toUpperCase(),

      destino:
        valores.destino.trim(),

      codigoAeropuertoDestino:
        valores.codigoAeropuertoDestino.trim().toUpperCase(),

      terminalCargaDestino:
        valores.terminalCargaDestino?.trim() || null,

      fechaSalida:
        valores.fechaSalida,

      horaSalida: horaSalida24,

      fechaLlegada:
        valores.fechaLlegada,

      horaLlegada: horaLlegada24,

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
      {
        encabezado: 'Origen',
        valor: (v: Vuelo) => `${v.origen} (${v.codigoAeropuertoOrigen})`,
      },
      {
        encabezado: 'Destino',
        valor: (v: Vuelo) => `${v.destino} (${v.codigoAeropuertoDestino})`,
      },
      {
        encabezado: 'Fecha salida',
        valor: (v: Vuelo) => v.fechaSalida,
      },
      {
        encabezado: 'Hora salida',
        valor: (v: Vuelo) => v.horaSalida.substring(0, 5),
      },
      {
        encabezado: 'Fecha llegada',
        valor: (v: Vuelo) => v.fechaLlegada,
      },
      {
        encabezado: 'Hora llegada',
        valor: (v: Vuelo) => v.horaLlegada.substring(0, 5),
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

  abrirCambioEstado(vuelo: Vuelo): void {
    this.vueloSeleccionado.set(vuelo);

    this.formularioEstado.reset({
      estado: vuelo.estado,
    });

    this.dialogoEstadoVisible.set(true);
  }

  cerrarEstado(): void {
    if (this.cambiandoEstado()) {
      return;
    }

    this.dialogoEstadoVisible.set(false);
    this.vueloSeleccionado.set(null);
  }

  opcionesEstadoDisponibles(): Array<{
    label: string;
    value: EstadoVuelo;
  }> {
    const transiciones: Record<EstadoVuelo, EstadoVuelo[]> = {
      PROGRAMADO: ['DESPACHADO', 'CANCELADO'],
      DESPACHADO: [],
      CANCELADO: [],
    };

    const actual = this.vueloSeleccionado()?.estado ?? 'PROGRAMADO';

    return this.opcionesEstado.filter(
      (opcion) =>
        opcion.value === actual ||
        transiciones[actual].includes(opcion.value),
    );
  }

  cambiarEstado(): void {
    if (this.formularioEstado.invalid) {
      this.formularioEstado.markAllAsTouched();
      return;
    }

    const vuelo = this.vueloSeleccionado();

    if (!vuelo) {
      return;
    }

    const estado =
      this.formularioEstado.getRawValue().estado;

    this.cambiandoEstado.set(true);

    this.service.cambiarEstado(vuelo.id, estado).subscribe({
      next: () => {
        this.cambiandoEstado.set(false);
        this.dialogoEstadoVisible.set(false);
        this.vueloSeleccionado.set(null);

        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `El vuelo ${vuelo.codigo} fue actualizado.`,
        });

        this.cargar();
      },
      error: () => {
        this.cambiandoEstado.set(false);
      },
    });
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
      ARRIBADA: 'Arribada',
      ENTREGADA: 'Entregada',
      CANCELADA: 'Cancelada',
      ABANDONADA: 'Abandonada',
    };

    return nombres[estado] ?? estado;
  }

  severidadEncomienda(
    estado: string,
  ):
    | 'success'
    | 'warn'
    | 'danger'
    | 'info'
    | 'secondary' {
    switch (estado) {
      case 'ENTREGADA':
        return 'success';
      case 'CANCELADA':
        return 'danger';
      case 'EMBARCADA':
        return 'info';
      case 'ARRIBADA':
        return 'warn';
      case 'ABANDONADA':
        return 'secondary';
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

  estaAtrasado(vuelo: Vuelo): boolean {
    if (vuelo.estado !== 'PROGRAMADO') {
      return false;
    }

    const salida = new Date(
      `${vuelo.fechaSalida}T${vuelo.horaSalida}`,
    );

    return salida.getTime() < Date.now();
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