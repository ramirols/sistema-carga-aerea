package pe.edu.cibertec.cargaaerea.dto;

import jakarta.validation.constraints.*;
import pe.edu.cibertec.cargaaerea.enums.Rol;

public final class AuthDtos {
	private AuthDtos() {
	}

	public record LoginRequest(@NotBlank String username, @NotBlank String password) {
	}

	public record LoginResponse(String token, String tipo, Long usuarioId, String username, String nombreCompleto,
			Rol rol, long expiraEnSegundos) {
	}
}
