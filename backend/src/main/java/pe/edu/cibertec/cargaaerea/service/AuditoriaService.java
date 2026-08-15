package pe.edu.cibertec.cargaaerea.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import pe.edu.cibertec.cargaaerea.audit.RevisionAuditoria;
import pe.edu.cibertec.cargaaerea.dto.AuditoriaDtos;
import pe.edu.cibertec.cargaaerea.entity.Encomienda;
import pe.edu.cibertec.cargaaerea.entity.Usuario;
import pe.edu.cibertec.cargaaerea.entity.Vuelo;
import pe.edu.cibertec.cargaaerea.exception.RecursoNoEncontradoException;
import pe.edu.cibertec.cargaaerea.mapper.EncomiendaMapper;
import pe.edu.cibertec.cargaaerea.mapper.UsuarioMapper;
import pe.edu.cibertec.cargaaerea.mapper.VueloMapper;
import pe.edu.cibertec.cargaaerea.repository.EncomiendaRepository;
import pe.edu.cibertec.cargaaerea.repository.UsuarioRepository;
import pe.edu.cibertec.cargaaerea.repository.VueloRepository;

/**
 * Consulta y restaura el historial de cambios de las entidades auditadas
 * (Vuelo, Encomienda, Usuario), usando Hibernate Envers.
 */
@Service
@RequiredArgsConstructor
public class AuditoriaService {

	private final EntityManager entityManager;

	private final VueloRepository vueloRepository;
	private final EncomiendaRepository encomiendaRepository;
	private final UsuarioRepository usuarioRepository;

	private final VueloMapper vueloMapper;
	private final EncomiendaMapper encomiendaMapper;
	private final UsuarioMapper usuarioMapper;



	@Transactional(readOnly = true)
	@SuppressWarnings("unchecked")
	public List<AuditoriaDtos.RevisionVuelo> historialVuelo(Long id) {
		List<Object[]> filas = lector().createQuery()
				.forRevisionsOfEntity(Vuelo.class, false, true)
				.add(AuditEntity.id().eq(id))
				.addOrder(AuditEntity.revisionNumber().desc())
				.getResultList();

		return filas.stream().map(this::mapearVuelo).toList();
	}

	@Transactional(readOnly = true)
	@SuppressWarnings("unchecked")
	public List<AuditoriaDtos.RevisionEncomienda> historialEncomienda(Long id) {
		List<Object[]> filas = lector().createQuery()
				.forRevisionsOfEntity(Encomienda.class, false, true)
				.add(AuditEntity.id().eq(id))
				.addOrder(AuditEntity.revisionNumber().desc())
				.getResultList();

		return filas.stream().map(this::mapearEncomienda).toList();
	}

	@Transactional(readOnly = true)
	@SuppressWarnings("unchecked")
	public List<AuditoriaDtos.RevisionUsuario> historialUsuario(Long id) {
		List<Object[]> filas = lector().createQuery()
				.forRevisionsOfEntity(Usuario.class, false, true)
				.add(AuditEntity.id().eq(id))
				.addOrder(AuditEntity.revisionNumber().desc())
				.getResultList();

		return filas.stream().map(this::mapearUsuario).toList();
	}



	@Transactional(readOnly = true)
	public List<AuditoriaDtos.CambioReciente> cambiosRecientes(int limite, String tipoEntidad, String operacion,
			LocalDate desde, LocalDate hasta) {
		List<AuditoriaDtos.CambioReciente> resultado = new ArrayList<>();

		if (coincideTipo(tipoEntidad, "Vuelo")) {
			historialFiltrado(Vuelo.class, operacion, desde, hasta).forEach(fila -> {
				Vuelo v = (Vuelo) fila[0];
				resultado.add(cambioReciente("Vuelo", v.getId(), v.getCodigo(), fila));
			});
		}

		if (coincideTipo(tipoEntidad, "Encomienda")) {
			historialFiltrado(Encomienda.class, operacion, desde, hasta).forEach(fila -> {
				Encomienda e = (Encomienda) fila[0];
				resultado.add(cambioReciente("Encomienda", e.getId(), e.getCodigo(), fila));
			});
		}

		if (coincideTipo(tipoEntidad, "Usuario")) {
			historialFiltrado(Usuario.class, operacion, desde, hasta).forEach(fila -> {
				Usuario u = (Usuario) fila[0];
				resultado.add(cambioReciente("Usuario", u.getId(), u.getUsername(), fila));
			});
		}

		return resultado.stream()
				.sorted(Comparator.comparing(AuditoriaDtos.CambioReciente::fecha).reversed())
				.limit(limite)
				.toList();
	}

	private boolean coincideTipo(String tipoEntidad, String tipo) {
		return tipoEntidad == null || tipoEntidad.isBlank() || tipoEntidad.equalsIgnoreCase(tipo);
	}

	@SuppressWarnings("unchecked")
	private List<Object[]> historialFiltrado(Class<?> tipo, String operacion, LocalDate desde, LocalDate hasta) {
		var consulta = lector().createQuery()
				.forRevisionsOfEntity(tipo, false, true)
				.addOrder(AuditEntity.revisionNumber().desc());

		if (operacion != null && !operacion.isBlank()) {
			consulta.add(AuditEntity.revisionType().eq(RevisionType.valueOf(operacion)));
		}

		if (desde != null) {
			consulta.add(AuditEntity.revisionProperty("timestamp")
					.ge(desde.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()));
		}

		if (hasta != null) {
			consulta.add(AuditEntity.revisionProperty("timestamp")
					.le(hasta.atTime(LocalTime.MAX).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()));
		}

		return consulta.setMaxResults(500).getResultList();
	}

	private AuditoriaDtos.CambioReciente cambioReciente(String tipoEntidad, Long id, String descripcion,
			Object[] fila) {
		RevisionAuditoria revision = (RevisionAuditoria) fila[1];
		RevisionType tipo = (RevisionType) fila[2];
		Usuario autor = buscarAutor(revision.getUsuario());

		return new AuditoriaDtos.CambioReciente(
				tipoEntidad,
				id,
				descripcion,
				revision.getId(),
				fechaDeRevision(revision),
				revision.getUsuario(),
				nombreCompletoDe(autor),
				rolDe(autor),
				traducir(tipo));
	}



	@Transactional
	public void restaurarVuelo(Long id, int revision) {
		Vuelo historico = lector().find(Vuelo.class, id, revision);

		if (historico == null) {
			throw new RecursoNoEncontradoException("No existe esa revisión del vuelo");
		}

		Vuelo actual = vueloRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Vuelo no encontrado"));

		actual.setCodigo(historico.getCodigo());
		actual.setOrigen(historico.getOrigen());
		actual.setDestino(historico.getDestino());
		actual.setFechaSalida(historico.getFechaSalida());
		actual.setHoraSalida(historico.getHoraSalida());
		actual.setCapacidadMaximaKg(historico.getCapacidadMaximaKg());
		actual.setPesoOcupadoKg(historico.getPesoOcupadoKg());
		actual.setEstado(historico.getEstado());

		vueloRepository.save(actual);
	}

	@Transactional
	public void restaurarEncomienda(Long id, int revision) {
		Encomienda historico = lector().find(Encomienda.class, id, revision);

		if (historico == null) {
			throw new RecursoNoEncontradoException("No existe esa revisión de la encomienda");
		}

		Encomienda actual = encomiendaRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Encomienda no encontrada"));

		actual.setCodigo(historico.getCodigo());
		actual.setDescripcion(historico.getDescripcion());
		actual.setRemitente(historico.getRemitente());
		actual.setDestinatario(historico.getDestinatario());
		actual.setPesoKg(historico.getPesoKg());
		actual.setEstado(historico.getEstado());
		actual.setVuelo(historico.getVuelo());

		encomiendaRepository.save(actual);
	}

	@Transactional
	public void restaurarUsuario(Long id, int revision) {
		Usuario historico = lector().find(Usuario.class, id, revision);

		if (historico == null) {
			throw new RecursoNoEncontradoException("No existe esa revisión del usuario");
		}

		Usuario actual = usuarioRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));

		// La contraseña no se audita ni se restaura por seguridad.
		actual.setNombreCompleto(historico.getNombreCompleto());
		actual.setRol(historico.getRol());
		actual.setActivo(historico.getActivo());

		usuarioRepository.save(actual);
	}


	private AuditReader lector() {
		return AuditReaderFactory.get(entityManager);
	}

	private AuditoriaDtos.RevisionVuelo mapearVuelo(Object[] fila) {
		Vuelo vuelo = (Vuelo) fila[0];
		RevisionAuditoria revision = (RevisionAuditoria) fila[1];
		RevisionType tipo = (RevisionType) fila[2];
		Usuario autor = buscarAutor(revision.getUsuario());

		return new AuditoriaDtos.RevisionVuelo(
				revision.getId(),
				fechaDeRevision(revision),
				revision.getUsuario(),
				nombreCompletoDe(autor),
				rolDe(autor),
				traducir(tipo),
				vueloMapper.toResponse(vuelo));
	}

	private AuditoriaDtos.RevisionEncomienda mapearEncomienda(Object[] fila) {
		Encomienda encomienda = (Encomienda) fila[0];
		RevisionAuditoria revision = (RevisionAuditoria) fila[1];
		RevisionType tipo = (RevisionType) fila[2];
		Usuario autor = buscarAutor(revision.getUsuario());

		return new AuditoriaDtos.RevisionEncomienda(
				revision.getId(),
				fechaDeRevision(revision),
				revision.getUsuario(),
				nombreCompletoDe(autor),
				rolDe(autor),
				traducir(tipo),
				encomiendaMapper.toResponse(encomienda));
	}

	private AuditoriaDtos.RevisionUsuario mapearUsuario(Object[] fila) {
		Usuario usuario = (Usuario) fila[0];
		RevisionAuditoria revision = (RevisionAuditoria) fila[1];
		RevisionType tipo = (RevisionType) fila[2];
		Usuario autor = buscarAutor(revision.getUsuario());

		return new AuditoriaDtos.RevisionUsuario(
				revision.getId(),
				fechaDeRevision(revision),
				revision.getUsuario(),
				nombreCompletoDe(autor),
				rolDe(autor),
				traducir(tipo),
				usuarioMapper.toResponse(usuario));
	}

	private Usuario buscarAutor(String nombreUsuario) {
		if (nombreUsuario == null) {
			return null;
		}

		return usuarioRepository.findByUsernameIgnoreCase(nombreUsuario).orElse(null);
	}

	private String nombreCompletoDe(Usuario autor) {
		return autor != null ? autor.getNombreCompleto() : null;
	}

	private String rolDe(Usuario autor) {
		return autor != null ? autor.getRol().name() : null;
	}

	private LocalDateTime fechaDeRevision(RevisionAuditoria revision) {
		return Instant.ofEpochMilli(revision.getTimestamp())
				.atZone(ZoneId.systemDefault())
				.toLocalDateTime();
	}

	private String traducir(RevisionType tipo) {
		return switch (tipo) {
			case ADD -> "CREACION";
			case MOD -> "MODIFICACION";
			case DEL -> "ELIMINACION";
		};
	}
}
