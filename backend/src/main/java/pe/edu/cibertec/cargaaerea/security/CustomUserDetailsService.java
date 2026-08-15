package pe.edu.cibertec.cargaaerea.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import pe.edu.cibertec.cargaaerea.repository.UsuarioRepository;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
	private final UsuarioRepository repo;

	public UserDetails loadUserByUsername(String username) {
		var u = repo.findByUsernameIgnoreCase(username)
				.orElseThrow(() -> new UsernameNotFoundException("Credenciales incorrectas"));
		return User.withUsername(u.getUsername()).password(u.getPassword()).roles(u.getRol().name())
				.disabled(!u.getActivo()).build();
	}
}
