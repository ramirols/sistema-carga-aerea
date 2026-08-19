import {
    EstadoAutorizacion,
    EstadoEncomienda,
    TipoAutorizado
} from './encomienda.model';
import { EstadoVuelo } from './vuelo.model';

export interface SeguimientoPublico {
    codigo: string;
    contenido: string;
    descripcion: string | null;
    remitente: string;
    destinatario: string;
    pesoCobrableKg: number;
    estado: EstadoEncomienda;
    personaAutorizadaNombre: string | null;
    estadoAutorizacion: EstadoAutorizacion | null;
    codigoVuelo: string | null;
    vueloEstado: EstadoVuelo | null;
    origenVuelo: string | null;
    destinoVuelo: string | null;
    codigoAeropuertoDestino: string | null;
    terminalCargaDestino: string | null;
    fechaSalidaVuelo: string | null;
    fechaLlegadaVuelo: string | null;
    horaLlegadaVuelo: string | null;
    fechaRegistro: string;
    fechaActualizacion: string;
}

export interface AutorizarRecojoRequest {
    dniDestinatarioOriginal: string;
    nombre: string;
    dni: string;
    tipo: TipoAutorizado;
    motivo: string | null;
    contacto: string | null;
}
