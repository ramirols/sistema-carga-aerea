package pe.edu.cibertec.cargaaerea.dto;

import jakarta.validation.constraints.*;
import pe.edu.cibertec.cargaaerea.enums.EstadoVuelo;
import java.math.BigDecimal;
import java.time.*;

public final class VueloDtos {
	private VueloDtos() {
	}

	public record Request(@NotBlank @Size(max = 15) String codigo, @NotBlank @Size(max = 80) String origen,
			@NotBlank @Size(max = 80) String destino, @NotNull LocalDate fechaSalida, @NotNull LocalTime horaSalida,
			@NotNull @DecimalMin("0.01") BigDecimal capacidadMaximaKg) {
	}

	public record Estado(@NotNull EstadoVuelo estado) {
	}

	public record Response(Long id, String codigo, String origen, String destino, LocalDate fechaSalida,
			LocalTime horaSalida, BigDecimal capacidadMaximaKg, BigDecimal pesoOcupadoKg,
			BigDecimal capacidadDisponibleKg, EstadoVuelo estado, LocalDateTime fechaCreacion,
			LocalDateTime fechaActualizacion) {
	}
}
