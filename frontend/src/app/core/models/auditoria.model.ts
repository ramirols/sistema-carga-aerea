export interface CambioReciente {
    tipoEntidad: 'Vuelo' | 'Encomienda' | 'Usuario';
    entidadId: number;
    descripcion: string;
    revision: number;
    fecha: string;
    usuario: string;
    nombreCompletoUsuario: string | null;
    rolUsuario: 'ADMINISTRADOR' | 'OPERADOR' | null;
    operacion: 'CREACION' | 'MODIFICACION' | 'ELIMINACION';
}

export interface RevisionGenerica {
    revision: number;
    fecha: string;
    usuario: string;
    nombreCompletoUsuario: string | null;
    rolUsuario: 'ADMINISTRADOR' | 'OPERADOR' | null;
    operacion: 'CREACION' | 'MODIFICACION' | 'ELIMINACION';
    datos: Record<string, unknown>;
}
