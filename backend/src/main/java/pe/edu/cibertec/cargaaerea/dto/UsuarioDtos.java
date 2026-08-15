package pe.edu.cibertec.cargaaerea.dto;

import jakarta.validation.constraints.*;
import pe.edu.cibertec.cargaaerea.enums.Rol;
import java.time.LocalDateTime;

public final class UsuarioDtos {
	private UsuarioDtos() {
	}

	public record Request(@NotBlank @Size(max = 50) String username,
			@NotBlank @Size(min = 8, max = 100) String password, @NotBlank @Size(max = 120) String nombreCompleto,
			@NotNull Rol rol) {
	}

	public record Update(@NotBlank @Size(max = 120) String nombreCompleto, @NotNull Rol rol, String password) {
	}

	public record Estado(@NotNull Boolean activo) {
	}

	public record Response(Long id, String username, String nombreCompleto, Rol rol, Boolean activo,
			LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion) {
	}
}
