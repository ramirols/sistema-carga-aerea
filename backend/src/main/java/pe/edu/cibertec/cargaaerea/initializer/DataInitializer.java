package pe.edu.cibertec.cargaaerea.initializer;

import lombok.RequiredArgsConstructor;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.cibertec.cargaaerea.entity.Usuario;
import pe.edu.cibertec.cargaaerea.enums.Rol;
import pe.edu.cibertec.cargaaerea.repository.UsuarioRepository;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

	private final UsuarioRepository repo;
	private final PasswordEncoder encoder;

	@Override
	@Transactional
	public void run(String... args) {
		crearSiNoExiste(
				"admin",
				"Admin123*",
				"Administrador del sistema",
				Rol.ADMINISTRADOR);

		crearSiNoExiste(
				"operador01",
				"Operador123*",
				"Operador de carga",
				Rol.OPERADOR);
	}

	private void crearSiNoExiste(
			String username,
			String password,
			String nombreCompleto,
			Rol rol) {
		if (repo.existsByUsernameIgnoreCase(username)) {
			return;
		}

		Usuario usuario = new Usuario();
		usuario.setUsername(username);
		usuario.setPassword(
				encoder.encode(password));
		usuario.setNombreCompleto(nombreCompleto);
		usuario.setRol(rol);
		usuario.setActivo(true);

		repo.save(usuario);
	}
}