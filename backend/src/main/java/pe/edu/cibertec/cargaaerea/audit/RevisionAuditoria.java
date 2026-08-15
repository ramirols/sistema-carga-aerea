package pe.edu.cibertec.cargaaerea.audit;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.RevisionEntity;
import org.hibernate.envers.RevisionNumber;
import org.hibernate.envers.RevisionTimestamp;

/**
 * Representa una "revisión" (un punto en el tiempo en el que algo cambió).
 * Se define desde cero, sin heredar de DefaultRevisionEntity, para tener
 * control total sobre el mapeo y evitar problemas de compatibilidad entre
 * versiones de Hibernate.
 */
@Entity
@Table(name = "revision_auditoria")
@RevisionEntity(RevisionAuditoriaListener.class)
@Getter
@Setter
public class RevisionAuditoria {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@RevisionNumber
	private int id;

	@RevisionTimestamp
	private long timestamp;

	private String usuario;
}
