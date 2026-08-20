import { EstadoVuelo } from './vuelo.model';

export type EstadoEncomienda =
    | 'EN_ALMACEN'
    | 'EMBARCADA'
    | 'ARRIBADA'
    | 'ENTREGADA'
    | 'CANCELADA'
    | 'ABANDONADA';

export type EstadoAutorizacion = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export type TipoAutorizado = 'PERSONA' | 'EMPRESA';

export interface Encomienda {
    id: number;
    codigo: string;
    contenido: string;
    descripcion: string | null;
    remitente: string;
    remitenteDni: string | null;
    remitenteTelefono: string | null;
    remitenteCorreo: string | null;
    destinatario: string;
    destinatarioDni: string;
    personaAutorizadaNombre: string | null;
    personaAutorizadaDni: string | null;
    personaAutorizadaContacto: string | null;
    tipoPersonaAutorizada: TipoAutorizado | null;
    motivoCambio: string | null;
    cartaPoderUrl: string | null;
    estadoAutorizacion: EstadoAutorizacion | null;
    pesoKg: number;
    largoCm: number | null;
    anchoCm: number | null;
    altoCm: number | null;
    pesoVolumetricoKg: number;
    pesoCobrableKg: number;
    estado: EstadoEncomienda;
    vueloId: number | null;
    codigoVuelo: string | null;
    vueloEstado: EstadoVuelo | null;
    diasEnAlmacen: number | null;
    enRiesgoAbandono: boolean;
    fechaAbandono: string | null;
    recibidoPorNombre: string | null;
    recibidoPorDni: string | null;
    fechaRegistro: string;
    fechaActualizacion: string;
}

export interface EncomiendaRequest {
    contenido: string;
    descripcion: string | null;
    remitente: string;
    remitenteDni: string | null;
    remitenteTelefono: string | null;
    remitenteCorreo: string | null;
    destinatario: string;
    destinatarioDni: string;
    personaAutorizadaNombre: string | null;
    personaAutorizadaDni: string | null;
    tipoPersonaAutorizada: TipoAutorizado | null;
    pesoKg: number;
    largoCm: number | null;
    anchoCm: number | null;
    altoCm: number | null;
}

export interface AsignarVueloRequest {
    vueloId: number;
}