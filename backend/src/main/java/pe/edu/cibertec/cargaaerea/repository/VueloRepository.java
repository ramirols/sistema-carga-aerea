package pe.edu.cibertec.cargaaerea.repository;

import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pe.edu.cibertec.cargaaerea.entity.Vuelo;
import pe.edu.cibertec.cargaaerea.enums.EstadoVuelo;

public interface VueloRepository extends JpaRepository<Vuelo, Long> {
	boolean existsByCodigoIgnoreCase(String codigo);

	@Query("""
			SELECT v FROM Vuelo v
			WHERE (:busqueda IS NULL OR :busqueda = ''
				OR LOWER(v.codigo) LIKE LOWER(CONCAT('%', :busqueda, '%'))
				OR LOWER(v.origen) LIKE LOWER(CONCAT('%', :busqueda, '%'))
				OR LOWER(v.destino) LIKE LOWER(CONCAT('%', :busqueda, '%')))
			AND (:desde IS NULL OR v.fechaSalida >= :desde)
			AND (:hasta IS NULL OR v.fechaSalida <= :hasta)
			AND (:estado IS NULL OR v.estado = :estado)
			""")
	Page<Vuelo> buscar(@Param("busqueda") String busqueda, @Param("desde") LocalDate desde,
			@Param("hasta") LocalDate hasta, @Param("estado") EstadoVuelo estado, Pageable pageable);
}
