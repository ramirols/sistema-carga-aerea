package pe.edu.cibertec.cargaaerea.mapper;

import org.springframework.stereotype.Component;

import pe.edu.cibertec.cargaaerea.dto.EncomiendaDtos;
import pe.edu.cibertec.cargaaerea.entity.Encomienda;
import pe.edu.cibertec.cargaaerea.entity.Vuelo;

@Component
public class EncomiendaMapper {

    public EncomiendaDtos.Response toResponse(
            Encomienda encomienda
    ) {
        if (encomienda == null) {
            return null;
        }

        Vuelo vuelo = encomienda.getVuelo();

        Long vueloId = vuelo != null
                ? vuelo.getId()
                : null;

        String codigoVuelo = vuelo != null
                ? vuelo.getCodigo()
                : null;

        pe.edu.cibertec.cargaaerea.enums.EstadoVuelo vueloEstado = vuelo != null
                ? vuelo.getEstado()
                : null;

        return new EncomiendaDtos.Response(
                encomienda.getId(),
                encomienda.getCodigo(),
                encomienda.getContenido(),
                encomienda.getDescripcion(),
                encomienda.getRemitente(),
                encomienda.getRemitenteDni(),
                encomienda.getRemitenteTelefono(),
                encomienda.getRemitenteCorreo(),
                encomienda.getDestinatario(),
                encomienda.getDestinatarioDni(),
                encomienda.getPersonaAutorizadaNombre(),
                encomienda.getPersonaAutorizadaDni(),
                encomienda.getPersonaAutorizadaContacto(),
                encomienda.getTipoPersonaAutorizada(),
                encomienda.getMotivoCambio(),
                null,
                encomienda.getEstadoAutorizacion(),
                encomienda.getPesoKg(),
                encomienda.getLargoCm(),
                encomienda.getAnchoCm(),
                encomienda.getAltoCm(),
                encomienda.getPesoVolumetricoKg(),
                encomienda.getPesoCobrableKg(),
                encomienda.getEstado(),
                vueloId,
                codigoVuelo,
                vueloEstado,
                null,
                null,
                encomienda.getFechaAbandono(),
                encomienda.getRecibidoPorNombre(),
                encomienda.getRecibidoPorDni(),
                encomienda.getFechaRegistro(),
                encomienda.getFechaActualizacion()
        );
    }
}