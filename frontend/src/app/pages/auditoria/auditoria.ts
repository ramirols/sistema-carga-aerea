import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ConfirmationService,
  MessageService,
} from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import {
  CambioReciente,
  RevisionGenerica,
} from '@core/models/auditoria.model';

import { AuditoriaService } from '@core/services/auditoria.service';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './auditoria.html',
})
export class Auditoria implements OnInit {
  private readonly service = inject(AuditoriaService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly cambios = signal<CambioReciente[]>([]);
  readonly cargando = signal(false);

  readonly dialogoHistorialVisible = signal(false);
  readonly cargandoHistorial = signal(false);
  readonly registroSeleccionado = signal<CambioReciente | null>(null);
  readonly historial = signal<RevisionGenerica[]>([]);
  readonly restaurando = signal(false);

  readonly tipoEntidadFiltro = signal<'Vuelo' | 'Encomienda' | 'Usuario' | null>(null);
  readonly operacionFiltro = signal<'ADD' | 'MOD' | 'DEL' | null>(null);
  readonly desde = signal<string | null>(null);
  readonly hasta = signal<string | null>(null);
  readonly busquedaUsuario = signal('');

  readonly opcionesTipoEntidad = [
    { label: 'Vuelo', value: 'Vuelo' as const },
    { label: 'Encomienda', value: 'Encomienda' as const },
    { label: 'Usuario', value: 'Usuario' as const },
  ];

  readonly opcionesOperacion = [
    { label: 'Creación', value: 'ADD' as const },
    { label: 'Modificación', value: 'MOD' as const },
    { label: 'Eliminación', value: 'DEL' as const },
  ];

  readonly cambiosFiltrados = computed(() => {
    const texto = this.busquedaUsuario().trim().toLowerCase();

    if (!texto) {
      return this.cambios();
    }

    return this.cambios().filter((cambio) => {
      const usuario = cambio.usuario.toLowerCase();
      const nombreCompleto = (
        cambio.nombreCompletoUsuario ?? ''
      ).toLowerCase();
      const rol = this.nombreRol(cambio.rolUsuario).toLowerCase();

      return (
        usuario.includes(texto) ||
        nombreCompleto.includes(texto) ||
        rol.includes(texto)
      );
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);

    this.service
      .recientes(
        50,
        this.tipoEntidadFiltro() ?? undefined,
        this.operacionFiltro() ?? undefined,
        this.desde() ?? undefined,
        this.hasta() ?? undefined,
      )
      .subscribe({
        next: (datos) => {
          this.cambios.set(datos);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
        },
      });
  }

  limpiarFiltros(): void {
    this.tipoEntidadFiltro.set(null);
    this.operacionFiltro.set(null);
    this.desde.set(null);
    this.hasta.set(null);
    this.busquedaUsuario.set('');
    this.cargar();
  }

  verHistorial(cambio: CambioReciente): void {
    this.registroSeleccionado.set(cambio);
    this.dialogoHistorialVisible.set(true);
    this.cargandoHistorial.set(true);
    this.historial.set([]);

    this.service
      .historial(cambio.tipoEntidad, cambio.entidadId)
      .subscribe({
        next: (datos) => {
          this.historial.set(datos);
          this.cargandoHistorial.set(false);
        },
        error: () => {
          this.cargandoHistorial.set(false);
        },
      });
  }

  cerrarHistorial(): void {
    if (this.restaurando()) {
      return;
    }

    this.dialogoHistorialVisible.set(false);
    this.registroSeleccionado.set(null);
  }

  confirmarRestaurar(revision: RevisionGenerica): void {
    const registro = this.registroSeleccionado();

    if (!registro) {
      return;
    }

    this.confirmationService.confirm({
      header: 'Restaurar versión anterior',
      icon: 'pi pi-history',
      message:
        `¿Deseas restaurar "${registro.descripcion}" a como estaba el ` +
        `${this.formatearFecha(revision.fecha)}? Esto sobrescribirá los datos actuales.`,
      acceptLabel: 'Restaurar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'warn' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.restaurar(registro, revision.revision);
      },
    });
  }

  private restaurar(registro: CambioReciente, revision: number): void {
    this.restaurando.set(true);

    this.service
      .restaurar(registro.tipoEntidad, registro.entidadId, revision)
      .subscribe({
        next: () => {
          this.restaurando.set(false);

          this.messageService.add({
            severity: 'success',
            summary: 'Versión restaurada',
            detail: `"${registro.descripcion}" fue restaurado correctamente.`,
          });

          this.cerrarHistorial();
          this.cargar();
        },
        error: () => {
          this.restaurando.set(false);
        },
      });
  }

  nombreRol(rol: string | null): string {
    if (!rol) {
      return '—';
    }

    return rol === 'ADMINISTRADOR' ? 'Administrador' : 'Operador';
  }

  severidad(
    operacion: string,
  ): 'success' | 'warn' | 'danger' | 'info' {
    switch (operacion) {
      case 'CREACION':
        return 'success';
      case 'ELIMINACION':
        return 'danger';
      default:
        return 'warn';
    }
  }

  private readonly etiquetasCampo: Record<string, string> = {
    codigo: 'Código',
    contenido: 'Contenido',
    descripcion: 'Descripción',
    remitente: 'Remitente',
    remitenteDni: 'DNI del remitente',
    remitenteTelefono: 'Teléfono del remitente',
    remitenteCorreo: 'Correo del remitente',
    destinatario: 'Destinatario',
    destinatarioDni: 'DNI del destinatario',
    personaAutorizadaNombre: 'Persona autorizada',
    personaAutorizadaDni: 'DNI autorizado',
    personaAutorizadaContacto: 'Contacto del solicitante',
    tipoPersonaAutorizada: 'Tipo de autorizado',
    motivoCambio: 'Motivo del cambio',
    estadoAutorizacion: 'Estado de la autorización',
    recibidoPorNombre: 'Recibido por',
    recibidoPorDni: 'DNI de quien recibió',
    fechaAbandono: 'Fecha de abandono',
    origen: 'Origen',
    destino: 'Destino',
    codigoAeropuertoOrigen: 'Aeropuerto de origen',
    codigoAeropuertoDestino: 'Aeropuerto de destino',
    terminalCargaDestino: 'Terminal de carga destino',
    fechaSalida: 'Fecha de salida',
    horaSalida: 'Hora de salida',
    fechaLlegada: 'Fecha de llegada',
    horaLlegada: 'Hora de llegada',
    capacidadMaximaKg: 'Capacidad máxima',
    pesoOcupadoKg: 'Peso ocupado',
    capacidadDisponibleKg: 'Capacidad disponible',
    pesoKg: 'Peso',
    largoCm: 'Largo',
    anchoCm: 'Ancho',
    altoCm: 'Alto',
    pesoVolumetricoKg: 'Peso volumétrico',
    pesoCobrableKg: 'Peso cobrable',
    codigoVuelo: 'Vuelo asignado',
    vueloEstado: 'Estado del vuelo',
    estado: 'Estado',
    username: 'Usuario',
    nombreCompleto: 'Nombre completo',
    rol: 'Rol',
    activo: 'Activo',
    fechaCreacion: 'Fecha de creación',
    fechaActualizacion: 'Última actualización',
    fechaRegistro: 'Fecha de registro',
  };

  private readonly etiquetasValor: Record<string, string> = {
    EN_ALMACEN: 'En almacén',
    EMBARCADA: 'Embarcada',
    ENTREGADA: 'Entregada',
    CANCELADA: 'Cancelada',
    ABANDONADA: 'Abandonada',
    PROGRAMADO: 'Programado',
    DESPACHADO: 'Despachado',
    CANCELADO: 'Cancelado',
    ADMINISTRADOR: 'Administrador',
    OPERADOR: 'Operador',
    PENDIENTE: 'Pendiente',
    APROBADA: 'Aprobada',
    RECHAZADA: 'Rechazada',
    PERSONA: 'Persona',
    EMPRESA: 'Empresa',
  };

  private readonly camposValorEtiquetado = new Set([
    'estado',
    'rol',
    'vueloEstado',
    'estadoAutorizacion',
    'tipoPersonaAutorizada',
  ]);

  private readonly camposOcultos = new Set([
    'id',
    'vueloId',
    'cartaPoderUrl',
    'diasEnAlmacen',
    'enRiesgoAbandono',
  ]);
  private readonly camposKg = new Set([
    'capacidadMaximaKg',
    'pesoOcupadoKg',
    'capacidadDisponibleKg',
    'pesoKg',
    'pesoVolumetricoKg',
    'pesoCobrableKg',
  ]);

  private readonly camposCm = new Set(['largoCm', 'anchoCm', 'altoCm']);

  private readonly camposFechaHora = new Set([
    'fechaCreacion',
    'fechaActualizacion',
    'fechaRegistro',
  ]);

  campos(
    datos: Record<string, unknown>,
    anterior?: Record<string, unknown>,
  ): Array<{
    etiqueta: string;
    valor: string;
    valorAnterior: string | null;
    cambio: boolean;
  }> {
    return Object.entries(datos)
      .filter(([clave]) => !this.camposOcultos.has(clave))
      .map(([clave, valor]) => {
        const valorFormateado = this.formatearValor(clave, valor);

        const valorAnteriorFormateado = anterior
          ? this.formatearValor(clave, anterior[clave])
          : null;

        const cambio =
          valorAnteriorFormateado !== null &&
          valorFormateado !== valorAnteriorFormateado;

        return {
          etiqueta: this.etiquetasCampo[clave] ?? clave,
          valor: valorFormateado,
          valorAnterior: cambio ? valorAnteriorFormateado : null,
          cambio,
        };
      });
  }

  contarCambios(
    campos: Array<{ cambio: boolean }>,
  ): number {
    return campos.filter((campo) => campo.cambio).length;
  }

  private formatearValor(clave: string, valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') {
      return '—';
    }

    if (typeof valor === 'boolean') {
      return valor ? 'Activo' : 'Inactivo';
    }

    if (this.camposValorEtiquetado.has(clave)) {
      return this.etiquetasValor[valor as string] ?? String(valor);
    }

    if (this.camposFechaHora.has(clave)) {
      return new Date(valor as string).toLocaleString('es-PE');
    }

    if (clave === 'fechaSalida' || clave === 'fechaLlegada') {
      return new Date(`${valor}T00:00:00`).toLocaleDateString('es-PE');
    }

    if (clave === 'horaSalida' || clave === 'horaLlegada') {
      return String(valor).substring(0, 5);
    }

    if (this.camposKg.has(clave)) {
      return `${Number(valor).toFixed(2)} kg`;
    }

    if (this.camposCm.has(clave)) {
      return `${Number(valor).toFixed(0)} cm`;
    }

    return String(valor);
  }

  iconoEntidad(tipo: string): string {
    switch (tipo) {
      case 'Vuelo':
        return 'pi pi-send';
      case 'Encomienda':
        return 'pi pi-box';
      default:
        return 'pi pi-user';
    }
  }

  private formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE');
  }
}
