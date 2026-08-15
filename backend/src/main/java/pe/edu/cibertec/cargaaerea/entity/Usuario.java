package pe.edu.cibertec.cargaaerea.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;
import pe.edu.cibertec.cargaaerea.enums.Rol;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Audited
@Getter
@Setter
@NoArgsConstructor
public class Usuario {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	@Column(nullable = false, unique = true, length = 50)
	private String username;
	@NotAudited
	@Column(nullable = false)
	private String password;
	@Column(name = "nombre_completo", nullable = false, length = 120)
	private String nombreCompleto;
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Rol rol;
	@Column(nullable = false)
	private Boolean activo = true;
	@Column(name = "fecha_creacion", nullable = false, updatable = false)
	private LocalDateTime fechaCreacion;
	@Column(name = "fecha_actualizacion", nullable = false)
	private LocalDateTime fechaActualizacion;

	@PrePersist
	void crear() {
		fechaCreacion = fechaActualizacion = LocalDateTime.now();
		if (activo == null)
			activo = true;
	}

	@PreUpdate
	void actualizar() {
		fechaActualizacion = LocalDateTime.now();
	}
}
