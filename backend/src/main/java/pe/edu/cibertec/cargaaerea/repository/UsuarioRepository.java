package pe.edu.cibertec.cargaaerea.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pe.edu.cibertec.cargaaerea.entity.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
	Optional<Usuario> findByUsernameIgnoreCase(String username);

	boolean existsByUsernameIgnoreCase(String username);

	@Query("""
			SELECT u FROM Usuario u
			WHERE (:busqueda IS NULL OR :busqueda = ''
				OR LOWER(u.username) LIKE LOWER(CONCAT('%', :busqueda, '%'))
				OR LOWER(u.nombreCompleto) LIKE LOWER(CONCAT('%', :busqueda, '%')))
			AND (:activo IS NULL OR u.activo = :activo)
			""")
	Page<Usuario> buscar(@Param("busqueda") String busqueda, @Param("activo") Boolean activo, Pageable pageable);
}
