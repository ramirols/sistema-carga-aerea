export type EstadoVuelo = 'PROGRAMADO' | 'DESPACHADO' | 'CANCELADO';

export interface Vuelo {
    id: number;
    codigo: string;
    origen: string;
    destino: string;
    fechaSalida: string;
    horaSalida: string;
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
    fechaSalida: string;
    horaSalida: string;
    capacidadMaximaKg: number;
}