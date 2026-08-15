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

        return new EncomiendaDtos.Response(
                encomienda.getId(),
                encomienda.getCodigo(),
                encomienda.getDescripcion(),
                encomienda.getRemitente(),
                encomienda.getDestinatario(),
                encomienda.getPesoKg(),
                encomienda.getLargoCm(),
                encomienda.getAnchoCm(),
                encomienda.getAltoCm(),
                encomienda.getPesoVolumetricoKg(),
                encomienda.getPesoCobrableKg(),
                encomienda.getEstado(),
                vueloId,
                codigoVuelo,
                encomienda.getFechaRegistro(),
                encomienda.getFechaActualizacion()
        );
    }
}