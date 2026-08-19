package pe.edu.cibertec.cargaaerea.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cibertec.cargaaerea.dto.UsuarioDtos;
import pe.edu.cibertec.cargaaerea.entity.Usuario;
import pe.edu.cibertec.cargaaerea.enums.Rol;
import pe.edu.cibertec.cargaaerea.exception.*;
import pe.edu.cibertec.cargaaerea.repository.UsuarioRepository;

@Service
@RequiredArgsConstructor
public class UsuarioService {
	private final UsuarioRepository repo;
	private final PasswordEncoder encoder;

	@Transactional(readOnly = true)
	public Page<UsuarioDtos.Response> listar(String busqueda, Boolean activo, Pageable p) {
		return repo.buscar(busqueda, activo, p).map(this::dto);
	}

	@Transactional(readOnly = true)
	public UsuarioDtos.Response obtener(Long id) {
		return dto(buscar(id));
	}

	@Transactional
	public UsuarioDtos.Response crear(UsuarioDtos.Request r) {
		if (repo.existsByUsernameIgnoreCase(r.username()))
			throw new ReglaNegocioException("El nombre de usuario ya existe");
		Usuario u = new Usuario();
		u.setUsername(r.username().trim());
		u.setPassword(encoder.encode(r.password()));
		u.setNombreCompleto(r.nombreCompleto().trim());
		u.setRol(r.rol());
		return dto(repo.save(u));
	}

	@Transactional
	public UsuarioDtos.Response actualizar(Long id, UsuarioDtos.Update r) {
		Usuario u = buscar(id);
		if (esUsuarioActual(u) && r.rol() != Rol.ADMINISTRADOR)
			throw new ReglaNegocioException("No puedes quitarte tu propio rol de administrador");
		u.setNombreCompleto(r.nombreCompleto().trim());
		u.setRol(r.rol());
		if (r.password() != null && !r.password().isBlank()) {
			if (r.password().length() < 8)
				throw new ReglaNegocioException("La contraseña debe tener al menos 8 caracteres");
			u.setPassword(encoder.encode(r.password()));
		}
		return dto(u);
	}

	@Transactional
	public UsuarioDtos.Response estado(Long id, UsuarioDtos.Estado r) {
		Usuario u = buscar(id);
		if (esUsuarioActual(u) && !r.activo())
			throw new ReglaNegocioException("No puedes desactivar tu propia cuenta");
		u.setActivo(r.activo());
		return dto(u);
	}

	@Transactional
	public void eliminar(Long id) {
		Usuario u = buscar(id);
		if (esUsuarioActual(u))
			throw new ReglaNegocioException("No puedes eliminar tu propia cuenta");
		repo.delete(u);
	}

	private boolean esUsuarioActual(Usuario u) {
		Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
		return autenticacion != null && autenticacion.isAuthenticated()
				&& u.getUsername().equalsIgnoreCase(autenticacion.getName());
	}

	private Usuario buscar(Long id) {
		return repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
	}

	private UsuarioDtos.Response dto(Usuario u) {
		return new UsuarioDtos.Response(u.getId(), u.getUsername(), u.getNombreCompleto(), u.getRol(), u.getActivo(),
				u.getFechaCreacion(), u.getFechaActualizacion());
	}
}
