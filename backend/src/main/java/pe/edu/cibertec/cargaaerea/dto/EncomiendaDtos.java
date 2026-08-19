package pe.edu.cibertec.cargaaerea.dto;

import jakarta.validation.constraints.*;
import pe.edu.cibertec.cargaaerea.enums.EstadoAutorizacion;
import pe.edu.cibertec.cargaaerea.enums.EstadoEncomienda;
import pe.edu.cibertec.cargaaerea.enums.EstadoVuelo;
import pe.edu.cibertec.cargaaerea.enums.TipoAutorizado;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class EncomiendaDtos {
	private EncomiendaDtos() {
	}

	public record Request(@NotBlank @Size(max = 150) String contenido, @Size(max = 250) String descripcion,
			@NotBlank @Size(max = 120) String remitente, @Size(max = 15) String remitenteDni,
			@Size(max = 20) String remitenteTelefono, @Email @Size(max = 150) String remitenteCorreo,
			@NotBlank @Size(max = 120) String destinatario,
			@NotBlank @Size(max = 15) String destinatarioDni, @Size(max = 120) String personaAutorizadaNombre,
			@Size(max = 15) String personaAutorizadaDni, TipoAutorizado tipoPersonaAutorizada,
			@NotNull @DecimalMin("0.01") BigDecimal pesoKg, @DecimalMin("0.01") BigDecimal largoCm,
			@DecimalMin("0.01") BigDecimal anchoCm, @DecimalMin("0.01") BigDecimal altoCm) {
	}

	public record AsignarVuelo(@NotNull Long vueloId) {
	}

	public record Estado(@NotNull EstadoEncomienda estado, @Size(max = 120) String recibidoPorNombre,
			@Size(max = 15) String recibidoPorDni) {
	}

	public record AutorizarRecojo(@NotBlank @Size(max = 15) String dniDestinatarioOriginal,
			@NotBlank @Size(max = 120) String nombre, @NotBlank @Size(max = 15) String dni,
			@NotNull TipoAutorizado tipo, @Size(max = 250) String motivo, @Size(max = 150) String contacto) {
	}

	public record CambiarEstadoAutorizacion(@NotNull EstadoAutorizacion estado) {
	}

	public record Response(Long id, String codigo, String contenido, String descripcion, String remitente,
			String remitenteDni, String remitenteTelefono, String remitenteCorreo, String destinatario,
			String destinatarioDni,
			String personaAutorizadaNombre, String personaAutorizadaDni, String personaAutorizadaContacto,
			TipoAutorizado tipoPersonaAutorizada,
			String motivoCambio, String cartaPoderUrl, EstadoAutorizacion estadoAutorizacion, BigDecimal pesoKg,
			BigDecimal largoCm, BigDecimal anchoCm, BigDecimal altoCm, BigDecimal pesoVolumetricoKg,
			BigDecimal pesoCobrableKg, EstadoEncomienda estado, Long vueloId, String codigoVuelo,
			EstadoVuelo vueloEstado, Integer diasEnAlmacen, Boolean enRiesgoAbandono, LocalDateTime fechaAbandono,
			String recibidoPorNombre, String recibidoPorDni, LocalDateTime fechaRegistro,
			LocalDateTime fechaActualizacion) {
	}

	public record Seguimiento(String codigo, String contenido, String descripcion, String remitente,
			String destinatario, BigDecimal pesoCobrableKg, EstadoEncomienda estado, String personaAutorizadaNombre,
			EstadoAutorizacion estadoAutorizacion, String codigoVuelo, EstadoVuelo vueloEstado, String origenVuelo,
			String destinoVuelo, String codigoAeropuertoDestino, String terminalCargaDestino,
			java.time.LocalDate fechaSalidaVuelo, java.time.LocalDate fechaLlegadaVuelo,
			java.time.LocalTime horaLlegadaVuelo, LocalDateTime fechaRegistro, LocalDateTime fechaActualizacion) {
	}
}
