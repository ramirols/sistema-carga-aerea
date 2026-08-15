export type EstadoEncomienda =
    | 'EN_ALMACEN'
    | 'EMBARCADA'
    | 'ENTREGADA'
    | 'CANCELADA';

export interface Encomienda {
    id: number;
    codigo: string;
    descripcion: string;
    remitente: string;
    destinatario: string;
    pesoKg: number;
    largoCm: number | null;
    anchoCm: number | null;
    altoCm: number | null;
    pesoVolumetricoKg: number;
    pesoCobrableKg: number;
    estado: EstadoEncomienda;
    vueloId: number | null;
    codigoVuelo: string | null;
    fechaRegistro: string;
    fechaActualizacion: string;
}

export interface EncomiendaRequest {
    codigo: string;
    descripcion: string;
    remitente: string;
    destinatario: string;
    pesoKg: number;
    largoCm: number | null;
    anchoCm: number | null;
    altoCm: number | null;
}

export interface AsignarVueloRequest {
    vueloId: number;
}