package pe.edu.cibertec.cargaaerea.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;
import pe.edu.cibertec.cargaaerea.enums.EstadoAutorizacion;
import pe.edu.cibertec.cargaaerea.enums.EstadoEncomienda;
import pe.edu.cibertec.cargaaerea.enums.TipoAutorizado;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "encomiendas")
@Audited
@Getter
@Setter
@NoArgsConstructor
public class Encomienda {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	@Column(nullable = false, unique = true, length = 20)
	private String codigo;
	@Column(nullable = false, length = 150)
	private String contenido;
	@Column(length = 250)
	private String descripcion;
	@Column(nullable = false, length = 120)
	private String remitente;
	@Column(name = "remitente_dni", length = 15)
	private String remitenteDni;
	@Column(name = "remitente_telefono", length = 20)
	private String remitenteTelefono;
	@Column(name = "remitente_correo", length = 150)
	private String remitenteCorreo;
	@Column(nullable = false, length = 120)
	private String destinatario;
	@Column(name = "destinatario_dni", length = 15)
	private String destinatarioDni;
	@Column(name = "persona_autorizada_nombre", length = 120)
	private String personaAutorizadaNombre;
	@Column(name = "persona_autorizada_dni", length = 15)
	private String personaAutorizadaDni;
	@Column(name = "persona_autorizada_contacto", length = 150)
	private String personaAutorizadaContacto;
	@Enumerated(EnumType.STRING)
	@Column(name = "tipo_persona_autorizada", length = 20)
	private TipoAutorizado tipoPersonaAutorizada;
	@Column(name = "motivo_cambio", length = 250)
	private String motivoCambio;
	@Column(name = "carta_poder_public_id", length = 200)
	private String cartaPoderPublicId;
	@Enumerated(EnumType.STRING)
	@Column(name = "estado_autorizacion", length = 20)
	private EstadoAutorizacion estadoAutorizacion;
	@Column(name = "peso_kg", nullable = false, precision = 10, scale = 2)
	private BigDecimal pesoKg;
	@Column(name = "largo_cm", precision = 8, scale = 2)
	private BigDecimal largoCm;
	@Column(name = "ancho_cm", precision = 8, scale = 2)
	private BigDecimal anchoCm;
	@Column(name = "alto_cm", precision = 8, scale = 2)
	private BigDecimal altoCm;
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private EstadoEncomienda estado = EstadoEncomienda.EN_ALMACEN;
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "vuelo_id")
	private Vuelo vuelo;
	@Column(name = "fecha_registro", nullable = false, updatable = false)
	private LocalDateTime fechaRegistro;
	@Column(name = "fecha_actualizacion", nullable = false)
	private LocalDateTime fechaActualizacion;
	@Column(name = "fecha_abandono")
	private LocalDateTime fechaAbandono;
	@Column(name = "recibido_por_nombre", length = 120)
	private String recibidoPorNombre;
	@Column(name = "recibido_por_dni", length = 15)
	private String recibidoPorDni;

	@PrePersist
	void crear() {
		fechaRegistro = fechaActualizacion = LocalDateTime.now();
		if (estado == null)
			estado = EstadoEncomienda.EN_ALMACEN;
	}

	@PreUpdate
	void actualizar() {
		fechaActualizacion = LocalDateTime.now();
	}

	public BigDecimal getPesoVolumetricoKg() {
		if (largoCm == null || anchoCm == null || altoCm == null)
			return BigDecimal.ZERO;
		return largoCm.multiply(anchoCm).multiply(altoCm)
				.divide(BigDecimal.valueOf(5000), 2, RoundingMode.HALF_UP);
	}

	public BigDecimal getPesoCobrableKg() {
		return pesoKg.max(getPesoVolumetricoKg());
	}
}
