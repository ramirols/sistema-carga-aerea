package pe.edu.cibertec.cargaaerea.dto;

import jakarta.validation.constraints.*;
import pe.edu.cibertec.cargaaerea.enums.EstadoVuelo;
import java.math.BigDecimal;
import java.time.*;

public final class VueloDtos {
	private VueloDtos() {
	}

	public record Request(@NotBlank @Size(max = 15) String codigo, @NotBlank @Size(max = 80) String origen,
			@NotBlank @Size(max = 80) String destino,
			@NotBlank @Pattern(regexp = "[A-Za-z]{3}") String codigoAeropuertoOrigen,
			@NotBlank @Pattern(regexp = "[A-Za-z]{3}") String codigoAeropuertoDestino,
			@Size(max = 80) String terminalCargaDestino, @NotNull LocalDate fechaSalida, @NotNull LocalTime horaSalida,
			@NotNull LocalDate fechaLlegada, @NotNull LocalTime horaLlegada,
			@NotNull @DecimalMin("0.01") BigDecimal capacidadMaximaKg) {
	}

	public record Estado(@NotNull EstadoVuelo estado) {
	}

	public record Response(Long id, String codigo, String origen, String destino, String codigoAeropuertoOrigen,
			String codigoAeropuertoDestino, String terminalCargaDestino, LocalDate fechaSalida, LocalTime horaSalida,
			LocalDate fechaLlegada, LocalTime horaLlegada, BigDecimal capacidadMaximaKg, BigDecimal pesoOcupadoKg,
			BigDecimal capacidadDisponibleKg, EstadoVuelo estado, LocalDateTime fechaCreacion,
			LocalDateTime fechaActualizacion) {
	}
}
