package pe.edu.cibertec.cargaaerea.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;
import pe.edu.cibertec.cargaaerea.enums.EstadoVuelo;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "vuelos")
@Audited
@Getter
@Setter
@NoArgsConstructor
public class Vuelo {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	@Column(nullable = false, unique = true, length = 15)
	private String codigo;
	@Column(nullable = false, length = 80)
	private String origen;
	@Column(nullable = false, length = 80)
	private String destino;
	@Column(name = "fecha_salida", nullable = false)
	private LocalDate fechaSalida;
	@Column(name = "hora_salida", nullable = false)
	private LocalTime horaSalida;
	@Column(name = "capacidad_maxima_kg", nullable = false, precision = 12, scale = 2)
	private BigDecimal capacidadMaximaKg;
	@Column(name = "peso_ocupado_kg", nullable = false, precision = 12, scale = 2)
	private BigDecimal pesoOcupadoKg = BigDecimal.ZERO;
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private EstadoVuelo estado = EstadoVuelo.PROGRAMADO;
	@Column(name = "fecha_creacion", nullable = false, updatable = false)
	private LocalDateTime fechaCreacion;
	@Column(name = "fecha_actualizacion", nullable = false)
	private LocalDateTime fechaActualizacion;
	@Version
	private Long version;

	@PrePersist
	void crear() {
		fechaCreacion = fechaActualizacion = LocalDateTime.now();
		if (pesoOcupadoKg == null)
			pesoOcupadoKg = BigDecimal.ZERO;
		if (estado == null)
			estado = EstadoVuelo.PROGRAMADO;
	}

	@PreUpdate
	void actualizar() {
		fechaActualizacion = LocalDateTime.now();
	}
}
