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
		if (!repo.existsByUsernameIgnoreCase("admin")) {
			Usuario u = new Usuario();
			u.setUsername("admin");
			u.setPassword(encoder.encode("Admin123*"));
			u.setNombreCompleto("Administrador del sistema");
			u.setRol(Rol.ADMINISTRADOR);
			u.setActivo(true);
			repo.save(u);
		}
	}
}
