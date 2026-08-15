package pe.edu.cibertec.cargaaerea.audit;

import org.hibernate.envers.RevisionListener;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Se ejecuta automáticamente cada vez que Hibernate detecta un cambio en una
 * entidad marcada con @Audited (crear, editar o eliminar). Hibernate lo
 * instancia directamente (no es un bean de Spring), por eso se obtiene el
 * usuario autenticado desde el SecurityContextHolder en vez de inyectarlo.
 */
public class RevisionAuditoriaListener implements RevisionListener {

	@Override
	public void newRevision(Object revisionEntity) {
		RevisionAuditoria revision = (RevisionAuditoria) revisionEntity;

		Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();

		String usuario = (autenticacion != null && autenticacion.isAuthenticated())
				? autenticacion.getName()
				: "sistema";

		revision.setUsuario(usuario);
	}
}
