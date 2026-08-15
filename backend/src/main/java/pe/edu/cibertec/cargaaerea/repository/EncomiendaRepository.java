package pe.edu.cibertec.cargaaerea.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pe.edu.cibertec.cargaaerea.entity.Encomienda;
import pe.edu.cibertec.cargaaerea.enums.EstadoEncomienda;

public interface EncomiendaRepository extends JpaRepository<Encomienda, Long> {
	boolean existsByCodigoIgnoreCase(String codigo);

	boolean existsByVueloId(Long vueloId);

	List<Encomienda> findByVueloIdOrderByCodigoAsc(Long vueloId);

	List<Encomienda> findByVueloIdAndEstado(Long vueloId, EstadoEncomienda estado);

	@Query("""
			SELECT e FROM Encomienda e
			WHERE (:busqueda IS NULL OR :busqueda = ''
				OR LOWER(e.codigo) LIKE LOWER(CONCAT('%', :busqueda, '%'))
				OR LOWER(e.remitente) LIKE LOWER(CONCAT('%', :busqueda, '%'))
				OR LOWER(e.destinatario) LIKE LOWER(CONCAT('%', :busqueda, '%')))
			AND (:desde IS NULL OR e.fechaRegistro >= :desde)
			AND (:hasta IS NULL OR e.fechaRegistro <= :hasta)
			AND (:estado IS NULL OR e.estado = :estado)
			""")
	Page<Encomienda> buscar(@Param("busqueda") String busqueda, @Param("desde") LocalDateTime desde,
			@Param("hasta") LocalDateTime hasta, @Param("estado") EstadoEncomienda estado, Pageable pageable);
}
