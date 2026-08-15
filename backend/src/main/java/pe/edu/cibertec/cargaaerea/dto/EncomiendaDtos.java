package pe.edu.cibertec.cargaaerea.dto;

import jakarta.validation.constraints.*;
import pe.edu.cibertec.cargaaerea.enums.EstadoEncomienda;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class EncomiendaDtos {
	private EncomiendaDtos() {
	}

	public record Request(@NotBlank @Size(max = 20) String codigo, @NotBlank @Size(max = 250) String descripcion,
			@NotBlank @Size(max = 120) String remitente, @NotBlank @Size(max = 120) String destinatario,
			@NotNull @DecimalMin("0.01") BigDecimal pesoKg, @DecimalMin("0.01") BigDecimal largoCm,
			@DecimalMin("0.01") BigDecimal anchoCm, @DecimalMin("0.01") BigDecimal altoCm) {
	}

	public record AsignarVuelo(@NotNull Long vueloId) {
	}

	public record Estado(@NotNull EstadoEncomienda estado) {
	}

	public record Response(Long id, String codigo, String descripcion, String remitente, String destinatario,
			BigDecimal pesoKg, BigDecimal largoCm, BigDecimal anchoCm, BigDecimal altoCm,
			BigDecimal pesoVolumetricoKg, BigDecimal pesoCobrableKg, EstadoEncomienda estado, Long vueloId,
			String codigoVuelo, LocalDateTime fechaRegistro, LocalDateTime fechaActualizacion) {
	}
}
