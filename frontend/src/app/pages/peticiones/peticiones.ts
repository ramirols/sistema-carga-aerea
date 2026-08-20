import {
    Component,
    computed,
    effect,
    inject,
    OnInit,
    signal,
} from '@angular/core';

import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import {
    Encomienda,
    EncomiendaRequest,
    EstadoAutorizacion,
    EstadoEncomienda,
} from '@core/models/encomienda.model';
import { EncomiendaService } from '@core/services/encomienda.service';
import { AuditoriaService } from '@core/services/auditoria.service';

function textoONulo(valor: unknown): string | null {
    return valor == null ? null : String(valor);
}

interface RegistroOriginal {
    contenido: string;
    descripcion: string | null;
    remitente: string;
    remitenteDni: string | null;
    remitenteTelefono: string | null;
    remitenteCorreo: string | null;
    destinatario: string;
    destinatarioDni: string;
    pesoKg: number;
    largoCm: number | null;
    anchoCm: number | null;
    altoCm: number | null;
    pesoCobrableKg: number;
    fecha: string;
}

@Component({
    selector: 'app-peticiones',
    standalone: true,
    imports: [
        DatePipe,
        DecimalPipe,
        FormsModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        SelectModule,
        TableModule,
        TagModule,
    ],
    templateUrl: './peticiones.html',
})
export class Peticiones implements OnInit {
    private readonly encomiendaService = inject(EncomiendaService);
    private readonly auditoriaService = inject(AuditoriaService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    private readonly registrosOriginales =
        signal<Map<number, RegistroOriginal | null>>(new Map());

    private readonly idsSolicitados = new Set<number>();

    private readonly encomiendas = signal<Encomienda[]>([]);
    readonly cargando = signal(false);
    readonly eliminando = signal(false);
    readonly revisando = signal(false);

    readonly documentoPrevio = signal<string | null>(null);
    readonly documentoNoVisible = signal(false);

    readonly busqueda = signal('');
    readonly estadoFiltro = signal<EstadoEncomienda | null>(null);
    readonly vista = signal<'lista' | 'tarjetas'>('lista');
    readonly busquedaCodigo = signal('');

    readonly opcionesEstado: Array<{ label: string; value: EstadoEncomienda }> = [
        { label: 'En almacén', value: 'EN_ALMACEN' },
        { label: 'Embarcada', value: 'EMBARCADA' },
        { label: 'Arribada', value: 'ARRIBADA' },
        { label: 'Entregada', value: 'ENTREGADA' },
        { label: 'Cancelada', value: 'CANCELADA' },
    ];

    readonly peticiones = computed(() => {
        const busqueda = this.busqueda().trim().toLowerCase();
        const estado = this.estadoFiltro();
        const codigo = this.busquedaCodigo().trim().toLowerCase();

        return this.encomiendas()
            .filter((encomienda) => !!encomienda.personaAutorizadaNombre)
            .filter((encomienda) => !estado || encomienda.estado === estado)
            .filter(
                (encomienda) =>
                    !codigo || encomienda.codigo.toLowerCase().includes(codigo),
            )
            .filter((encomienda) => {
                if (!busqueda) {
                    return true;
                }

                return [
                    encomienda.codigo,
                    encomienda.remitente,
                    encomienda.destinatario,
                    encomienda.personaAutorizadaNombre,
                    encomienda.personaAutorizadaDni,
                ]
                    .filter((valor): valor is string => !!valor)
                    .some((valor) => valor.toLowerCase().includes(busqueda));
            });
    });

    constructor() {
        effect(() => {
            if (this.vista() !== 'tarjetas') {
                return;
            }

            for (const encomienda of this.peticiones()) {
                this.cargarRegistroOriginal(encomienda.id);
            }
        });
    }

    registroOriginalDe(id: number): RegistroOriginal | null | undefined {
        return this.registrosOriginales().get(id);
    }

    ngOnInit(): void {
        this.cargar();
    }

    cargar(): void {
        this.cargando.set(true);

        this.encomiendaService.listar(0, 100).subscribe({
            next: (pagina) => {
                this.encomiendas.set(pagina.content);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
            },
        });
    }

    buscarPorCodigo(valor: string): void {
        this.busquedaCodigo.set(valor);

        if (valor.trim().length > 0) {
            this.vista.set('tarjetas');
        }
    }

    puedeRevisar(encomienda: Encomienda): boolean {
        return (
            encomienda.estado === 'EN_ALMACEN' ||
            encomienda.estado === 'EMBARCADA' ||
            encomienda.estado === 'ARRIBADA'
        );
    }

    limpiarFiltros(): void {
        this.busqueda.set('');
        this.estadoFiltro.set(null);
        this.busquedaCodigo.set('');
    }

    private cargarRegistroOriginal(id: number): void {
        if (this.idsSolicitados.has(id)) {
            return;
        }

        this.idsSolicitados.add(id);

        this.auditoriaService.historial('Encomienda', id).subscribe({
            next: (revisiones) => {
                const primera = revisiones[revisiones.length - 1];
                const datos = primera?.datos as
                    | Record<string, unknown>
                    | undefined;

                this.registrosOriginales.update((mapa) => {
                    const copia = new Map(mapa);

                    copia.set(
                        id,
                        datos
                            ? {
                                  contenido: String(datos['contenido'] ?? ''),
                                  descripcion:
                                      datos['descripcion'] == null
                                          ? null
                                          : String(datos['descripcion']),
                                  remitente: String(datos['remitente'] ?? ''),
                                  remitenteDni: textoONulo(
                                      datos['remitenteDni'],
                                  ),
                                  remitenteTelefono: textoONulo(
                                      datos['remitenteTelefono'],
                                  ),
                                  remitenteCorreo: textoONulo(
                                      datos['remitenteCorreo'],
                                  ),
                                  destinatario: String(
                                      datos['destinatario'] ?? '',
                                  ),
                                  destinatarioDni: String(
                                      datos['destinatarioDni'] ?? '',
                                  ),
                                  pesoKg: Number(datos['pesoKg'] ?? 0),
                                  largoCm:
                                      datos['largoCm'] == null
                                          ? null
                                          : Number(datos['largoCm']),
                                  anchoCm:
                                      datos['anchoCm'] == null
                                          ? null
                                          : Number(datos['anchoCm']),
                                  altoCm:
                                      datos['altoCm'] == null
                                          ? null
                                          : Number(datos['altoCm']),
                                  pesoCobrableKg: Number(
                                      datos['pesoCobrableKg'] ?? 0,
                                  ),
                                  fecha: String(primera.fecha),
                              }
                            : null,
                    );

                    return copia;
                });
            },
            error: () => {
                this.registrosOriginales.update((mapa) => {
                    const copia = new Map(mapa);
                    copia.set(id, null);
                    return copia;
                });
            },
        });
    }

    verDocumento(url: string): void {
        this.documentoNoVisible.set(false);
        this.documentoPrevio.set(url);
    }

    cerrarDocumento(): void {
        this.documentoPrevio.set(null);
    }

    confirmarEliminar(encomienda: Encomienda): void {
        this.confirmationService.confirm({
            header: 'Eliminar petición',
            icon: 'pi pi-exclamation-triangle',
            message: `¿Deseas eliminar la autorización de recojo de ${encomienda.codigo}?`,
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

    confirmarAprobar(encomienda: Encomienda): void {
        this.confirmationService.confirm({
            header: 'Aprobar petición',
            icon: 'pi pi-check-circle',
            message: `¿Deseas aprobar la autorización de recojo de ${encomienda.codigo}? La persona indicada podrá recoger la encomienda.`,
            acceptLabel: 'Aprobar',
            rejectLabel: 'Cancelar',
            acceptButtonProps: {
                severity: 'success',
            },
            rejectButtonProps: {
                severity: 'secondary',
                outlined: true,
            },
            accept: () => {
                this.revisar(encomienda, 'APROBADA');
            },
        });
    }

    confirmarRechazar(encomienda: Encomienda): void {
        this.confirmationService.confirm({
            header: 'Rechazar petición',
            icon: 'pi pi-times-circle',
            message: `¿Deseas rechazar la autorización de recojo de ${encomienda.codigo}?`,
            acceptLabel: 'Rechazar',
            rejectLabel: 'Cancelar',
            acceptButtonProps: {
                severity: 'danger',
            },
            rejectButtonProps: {
                severity: 'secondary',
                outlined: true,
            },
            accept: () => {
                this.revisar(encomienda, 'RECHAZADA');
            },
        });
    }

    nombreEstadoAutorizacion(estado: EstadoAutorizacion): string {
        const nombres: Record<EstadoAutorizacion, string> = {
            PENDIENTE: 'Pendiente',
            APROBADA: 'Aprobada',
            RECHAZADA: 'Rechazada',
        };

        return nombres[estado];
    }

    severidadEstadoAutorizacion(
        estado: EstadoAutorizacion
    ): 'info' | 'warn' | 'success' | 'danger' {
        switch (estado) {
            case 'APROBADA':
                return 'success';
            case 'RECHAZADA':
                return 'danger';
            default:
                return 'warn';
        }
    }

    nombreEstado(estado: EstadoEncomienda): string {
        const nombres: Record<EstadoEncomienda, string> = {
            EN_ALMACEN: 'En almacén',
            EMBARCADA: 'Embarcada',
            ARRIBADA: 'Arribada',
            ENTREGADA: 'Entregada',
            CANCELADA: 'Cancelada',
            ABANDONADA: 'Abandonada',
        };

        return nombres[estado];
    }

    severidadEstado(estado: EstadoEncomienda): 'info' | 'warn' | 'success' | 'danger' | 'secondary' {
        switch (estado) {
            case 'EMBARCADA':
                return 'info';
            case 'ARRIBADA':
                return 'warn';
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

    private revisar(
        encomienda: Encomienda,
        estado: EstadoAutorizacion
    ): void {
        this.revisando.set(true);

        this.encomiendaService
            .cambiarEstadoAutorizacion(encomienda.id, estado)
            .subscribe({
                next: () => {
                    this.revisando.set(false);

                    this.messageService.add({
                        severity: estado === 'APROBADA' ? 'success' : 'info',
                        summary:
                            estado === 'APROBADA'
                                ? 'Petición aprobada'
                                : 'Petición rechazada',
                        detail:
                            estado === 'APROBADA'
                                ? `Se aprobó la autorización de recojo de ${encomienda.codigo}.`
                                : `Se rechazó la autorización de recojo de ${encomienda.codigo}.`,
                    });

                    this.cargar();
                },
                error: () => {
                    this.revisando.set(false);
                },
            });
    }

    private eliminar(encomienda: Encomienda): void {
        const request: EncomiendaRequest = {
            contenido: encomienda.contenido,
            descripcion: encomienda.descripcion,
            remitente: encomienda.remitente,
            remitenteDni: encomienda.remitenteDni,
            remitenteTelefono: encomienda.remitenteTelefono,
            remitenteCorreo: encomienda.remitenteCorreo,
            destinatario: encomienda.destinatario,
            destinatarioDni: encomienda.destinatarioDni,
            personaAutorizadaNombre: null,
            personaAutorizadaDni: null,
            tipoPersonaAutorizada: null,
            pesoKg: encomienda.pesoKg,
            largoCm: encomienda.largoCm,
            anchoCm: encomienda.anchoCm,
            altoCm: encomienda.altoCm,
        };

        this.eliminando.set(true);

        this.encomiendaService.actualizar(encomienda.id, request).subscribe({
            next: () => {
                this.eliminando.set(false);

                this.messageService.add({
                    severity: 'success',
                    summary: 'Petición eliminada',
                    detail: `Se eliminó la autorización de recojo de ${encomienda.codigo}.`,
                });

                this.cargar();
            },
            error: () => {
                this.eliminando.set(false);
            },
        });
    }
}
