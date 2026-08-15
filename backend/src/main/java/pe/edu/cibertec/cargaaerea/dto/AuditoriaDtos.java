package pe.edu.cibertec.cargaaerea.dto;

import java.time.LocalDateTime;

public final class AuditoriaDtos {
	private AuditoriaDtos() {
	}

	public record RevisionVuelo(int revision, LocalDateTime fecha, String usuario, String nombreCompletoUsuario,
			String rolUsuario, String operacion, VueloDtos.Response datos) {
	}

	public record RevisionEncomienda(int revision, LocalDateTime fecha, String usuario, String nombreCompletoUsuario,
			String rolUsuario, String operacion, EncomiendaDtos.Response datos) {
	}

	public record RevisionUsuario(int revision, LocalDateTime fecha, String usuario, String nombreCompletoUsuario,
			String rolUsuario, String operacion, UsuarioDtos.Response datos) {
	}

	public record CambioReciente(String tipoEntidad, Long entidadId, String descripcion, int revision,
			LocalDateTime fecha, String usuario, String nombreCompletoUsuario, String rolUsuario, String operacion) {
	}
}
