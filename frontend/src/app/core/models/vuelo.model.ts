export type EstadoVuelo = 'PROGRAMADO' | 'DESPACHADO' | 'CANCELADO';

export interface Vuelo {
    id: number;
    codigo: string;
    origen: string;
    destino: string;
    codigoAeropuertoOrigen: string;
    codigoAeropuertoDestino: string;
    terminalCargaDestino: string | null;
    fechaSalida: string;
    horaSalida: string;
    fechaLlegada: string;
    horaLlegada: string;
    capacidadMaximaKg: number;
    pesoOcupadoKg: number;
    capacidadDisponibleKg: number;
    estado: EstadoVuelo;
    fechaCreacion: string;
    fechaActualizacion: string;
}

export interface VueloRequest {
    codigo: string;
    origen: string;
    destino: string;
    codigoAeropuertoOrigen: string;
    codigoAeropuertoDestino: string;
    terminalCargaDestino: string | null;
    fechaSalida: string;
    horaSalida: string;
    fechaLlegada: string;
    horaLlegada: string;
    capacidadMaximaKg: number;
}