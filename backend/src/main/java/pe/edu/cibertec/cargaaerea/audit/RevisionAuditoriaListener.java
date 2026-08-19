package pe.edu.cibertec.cargaaerea.audit;

import org.hibernate.envers.RevisionListener;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

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
