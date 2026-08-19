package pe.edu.cibertec.cargaaerea.mapper;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import pe.edu.cibertec.cargaaerea.dto.VueloDtos;
import pe.edu.cibertec.cargaaerea.entity.Vuelo;

@Component
public class VueloMapper {

    public VueloDtos.Response toResponse(Vuelo vuelo) {
        if (vuelo == null) {
            return null;
        }

        BigDecimal capacidadMaxima = valorSeguro(
                vuelo.getCapacidadMaximaKg()
        );

        BigDecimal pesoOcupado = valorSeguro(
                vuelo.getPesoOcupadoKg()
        );

        BigDecimal capacidadDisponible =
                capacidadMaxima.subtract(pesoOcupado);

        return new VueloDtos.Response(
                vuelo.getId(),
                vuelo.getCodigo(),
                vuelo.getOrigen(),
                vuelo.getDestino(),
                vuelo.getCodigoAeropuertoOrigen(),
                vuelo.getCodigoAeropuertoDestino(),
                vuelo.getTerminalCargaDestino(),
                vuelo.getFechaSalida(),
                vuelo.getHoraSalida(),
                vuelo.getFechaLlegada(),
                vuelo.getHoraLlegada(),
                capacidadMaxima,
                pesoOcupado,
                capacidadDisponible,
                vuelo.getEstado(),
                vuelo.getFechaCreacion(),
                vuelo.getFechaActualizacion()
        );
    }

    private BigDecimal valorSeguro(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }
}