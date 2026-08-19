package pe.edu.cibertec.cargaaerea.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cibertec.cargaaerea.dto.EncomiendaDtos;
import pe.edu.cibertec.cargaaerea.entity.*;
import pe.edu.cibertec.cargaaerea.enums.*;
import pe.edu.cibertec.cargaaerea.exception.*;
import pe.edu.cibertec.cargaaerea.repository.EncomiendaRepository;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EncomiendaService {
	private static final Map<EstadoEncomienda, Set<EstadoEncomienda>> TRANSICIONES_VALIDAS = Map.of(
			EstadoEncomienda.EN_ALMACEN, Set.of(EstadoEncomienda.EMBARCADA, EstadoEncomienda.CANCELADA),
			EstadoEncomienda.EMBARCADA, Set.of(EstadoEncomienda.ENTREGADA, EstadoEncomienda.CANCELADA),
			EstadoEncomienda.ENTREGADA, Set.of(),
			EstadoEncomienda.CANCELADA, Set.of(),
			EstadoEncomienda.ABANDONADA, Set.of());

	private final EncomiendaRepository repo;
	private final VueloService vuelos;
	private final ArchivoService archivos;

	@Value("${carga.almacenaje.dias-limite-abandono:30}")
	private int diasLimiteAbandono;

	@Transactional(readOnly = true)
	public Page<EncomiendaDtos.Response> listar(String busqueda, LocalDate desde, LocalDate hasta,
			EstadoEncomienda estado, Pageable p) {
		var desdeFechaHora = desde == null ? null : desde.atStartOfDay();
		var hastaFechaHora = hasta == null ? null : hasta.atTime(LocalTime.MAX);
		return repo.buscar(busqueda, desdeFechaHora, hastaFechaHora, estado, p).map(this::dto);
	}

	@Transactional(readOnly = true)
	public EncomiendaDtos.Response obtener(Long id) {
		return dto(buscar(id));
	}

	@Transactional(readOnly = true)
	public EncomiendaDtos.Seguimiento seguimientoPublico(String codigo) {
		Encomienda e = repo.findByCodigoIgnoreCase(codigo)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe una encomienda con ese código"));

		Vuelo v = e.getVuelo();

		return new EncomiendaDtos.Seguimiento(
				e.getCodigo(),
				e.getContenido(),
				e.getDescripcion(),
				e.getRemitente(),
				e.getDestinatario(),
				e.getPesoCobrableKg(),
				e.getEstado(),
				e.getPersonaAutorizadaNombre(),
				e.getEstadoAutorizacion(),
				v == null ? null : v.getCodigo(),
				v == null ? null : v.getEstado(),
				v == null ? null : v.getOrigen(),
				v == null ? null : v.getDestino(),
				v == null ? null : v.getCodigoAeropuertoDestino(),
				v == null ? null : v.getTerminalCargaDestino(),
				v == null ? null : v.getFechaSalida(),
				v == null ? null : v.getFechaLlegada(),
				v == null ? null : v.getHoraLlegada(),
				e.getFechaRegistro(),
				e.getFechaActualizacion());
	}

	@Transactional
	public void autorizarRecojo(String codigo, EncomiendaDtos.AutorizarRecojo r) {
		Encomienda e = repo.findByCodigoIgnoreCase(codigo)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe una encomienda con ese código"));

		if (e.getEstado() == EstadoEncomienda.ENTREGADA || e.getEstado() == EstadoEncomienda.CANCELADA)
			throw new ReglaNegocioException("No se puede autorizar el recojo de una encomienda ya finalizada");

		if (e.getDestinatarioDni() == null
				|| !e.getDestinatarioDni().equalsIgnoreCase(r.dniDestinatarioOriginal().trim()))
			throw new ReglaNegocioException(
					"El DNI ingresado no coincide con el destinatario registrado para esta encomienda");

		if (e.getEstadoAutorizacion() == EstadoAutorizacion.PENDIENTE
				|| e.getEstadoAutorizacion() == EstadoAutorizacion.APROBADA)
			throw new ReglaNegocioException(
					"Ya existe una solicitud de cambio de consignatario en trámite para esta encomienda. "
							+ "Contacta con la aerolínea si necesitas modificarla.");

		e.setPersonaAutorizadaNombre(r.nombre().trim());
		e.setPersonaAutorizadaDni(r.dni().trim());
		e.setTipoPersonaAutorizada(r.tipo());
		e.setMotivoCambio(r.motivo() == null || r.motivo().isBlank() ? null : r.motivo().trim());
		e.setPersonaAutorizadaContacto(r.contacto() == null || r.contacto().isBlank() ? null : r.contacto().trim());
		e.setEstadoAutorizacion(EstadoAutorizacion.PENDIENTE);
	}

	@Transactional
	public EncomiendaDtos.Response cambiarEstadoAutorizacion(Long id, EncomiendaDtos.CambiarEstadoAutorizacion r) {
		Encomienda e = buscar(id);

		if (e.getPersonaAutorizadaNombre() == null)
			throw new ReglaNegocioException("La encomienda no tiene una autorización de recojo registrada");

		if (e.getEstadoAutorizacion() != EstadoAutorizacion.PENDIENTE)
			throw new ReglaNegocioException("Esta autorización ya fue revisada");

		if (r.estado() == EstadoAutorizacion.PENDIENTE)
			throw new ReglaNegocioException("Estado de autorización inválido");

		e.setEstadoAutorizacion(r.estado());
		return dto(e);
	}

	@Transactional
	public void subirCartaPoder(String codigo, MultipartFile archivo) {
		Encomienda e = repo.findByCodigoIgnoreCase(codigo)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe una encomienda con ese código"));

		if (e.getEstado() == EstadoEncomienda.ENTREGADA || e.getEstado() == EstadoEncomienda.CANCELADA)
			throw new ReglaNegocioException("No se puede adjuntar la carta poder de una encomienda ya finalizada");

		e.setCartaPoderPublicId(archivos.subirCartaPoder(archivo));
	}

	@Transactional(readOnly = true)
	public java.util.List<EncomiendaDtos.Response> porVuelo(Long vueloId) {
		return repo.findByVueloIdOrderByCodigoAsc(vueloId).stream().map(this::dto).toList();
	}

	@Transactional
	public EncomiendaDtos.Response crear(EncomiendaDtos.Request r) {
		Encomienda e = new Encomienda();
		copiar(e, r);
		e.setCodigo(generarCodigo());
		Encomienda guardada = repo.save(e);
		return dto(guardada);
	}

	@Transactional
	public EncomiendaDtos.Response actualizar(Long id, EncomiendaDtos.Request r) {
		Encomienda e = buscar(id);
		if (e.getEstado() != EstadoEncomienda.EN_ALMACEN)
			throw new ReglaNegocioException("Solo se puede editar una encomienda en almacén");
		if (e.getVuelo() != null) {
			Vuelo v = e.getVuelo();
			BigDecimal cobrableNuevo = pesoCobrable(r.pesoKg(), r.largoCm(), r.anchoCm(), r.altoCm());
			BigDecimal nuevo = v.getPesoOcupadoKg().subtract(e.getPesoCobrableKg()).add(cobrableNuevo);
			validarCapacidad(v, nuevo);
			v.setPesoOcupadoKg(nuevo);
		}
		boolean seQuitaAutorizacion = (r.personaAutorizadaNombre() == null || r.personaAutorizadaNombre().isBlank())
				&& e.getCartaPoderPublicId() != null;
		copiar(e, r);
		if (seQuitaAutorizacion) {
			archivos.eliminar(e.getCartaPoderPublicId());
			e.setCartaPoderPublicId(null);
			e.setEstadoAutorizacion(null);
			e.setTipoPersonaAutorizada(null);
			e.setMotivoCambio(null);
			e.setPersonaAutorizadaContacto(null);
		}
		return dto(e);
	}

	@Transactional
	public EncomiendaDtos.Response asignarVuelo(Long id, EncomiendaDtos.AsignarVuelo r) {
		Encomienda e = buscar(id);
		if (e.getEstado() != EstadoEncomienda.EN_ALMACEN)
			throw new ReglaNegocioException("La encomienda no está disponible para asignación");
		Vuelo nuevo = vuelos.buscar(r.vueloId());
		if (nuevo.getEstado() != EstadoVuelo.PROGRAMADO)
			throw new ReglaNegocioException("El vuelo no está programado");
		if (e.getVuelo() != null) {
			Vuelo anterior = e.getVuelo();
			anterior.setPesoOcupadoKg(anterior.getPesoOcupadoKg().subtract(e.getPesoCobrableKg()));
		}
		BigDecimal ocupado = nuevo.getPesoOcupadoKg().add(e.getPesoCobrableKg());
		validarCapacidad(nuevo, ocupado);
		nuevo.setPesoOcupadoKg(ocupado);
		e.setVuelo(nuevo);
		e.setEstado(EstadoEncomienda.EMBARCADA);
		return dto(e);
	}

	@Transactional
	public EncomiendaDtos.Response desembarcar(Long id) {
		Encomienda e = buscar(id);

		if (e.getEstado() != EstadoEncomienda.EMBARCADA)
			throw new ReglaNegocioException("Solo se puede desembarcar una encomienda embarcada");

		Vuelo v = e.getVuelo();
		if (v == null || v.getEstado() != EstadoVuelo.PROGRAMADO)
			throw new ReglaNegocioException("No se puede desembarcar, el vuelo ya fue despachado");

		v.setPesoOcupadoKg(v.getPesoOcupadoKg().subtract(e.getPesoCobrableKg()));
		e.setVuelo(null);
		e.setEstado(EstadoEncomienda.EN_ALMACEN);
		return dto(e);
	}

	@Transactional
	public EncomiendaDtos.Response cambiarEstado(Long id, EncomiendaDtos.Estado r) {
		Encomienda e = buscar(id);
		if (!TRANSICIONES_VALIDAS.get(e.getEstado()).contains(r.estado()))
			throw new ReglaNegocioException(
					"No se puede cambiar el estado de " + e.getEstado() + " a " + r.estado());
		if (r.estado() == EstadoEncomienda.EMBARCADA && e.getVuelo() == null)
			throw new ReglaNegocioException("Debe asignar un vuelo antes de embarcar");
		if (r.estado() == EstadoEncomienda.ENTREGADA) {
			if (e.getVuelo() == null || e.getVuelo().getEstado() != EstadoVuelo.DESPACHADO
					|| e.getVuelo().getFechaLlegada().isAfter(LocalDate.now()))
				throw new ReglaNegocioException("No se puede entregar una encomienda cuyo vuelo aún no ha llegado");
			if (r.recibidoPorNombre() == null || r.recibidoPorNombre().isBlank() || r.recibidoPorDni() == null
					|| r.recibidoPorDni().isBlank())
				throw new ReglaNegocioException("Debes registrar el nombre y DNI de quien recibió la encomienda");

			String dniRecibido = r.recibidoPorDni().trim();
			boolean esDestinatario = e.getDestinatarioDni() != null
					&& e.getDestinatarioDni().equalsIgnoreCase(dniRecibido);
			boolean esAutorizadoAprobado = e.getEstadoAutorizacion() == EstadoAutorizacion.APROBADA
					&& e.getPersonaAutorizadaDni() != null && e.getPersonaAutorizadaDni().equalsIgnoreCase(dniRecibido);

			if (!esDestinatario && !esAutorizadoAprobado)
				throw new ReglaNegocioException(
						"El DNI de quien recibe debe coincidir con el destinatario registrado o con la persona autorizada aprobada");

			e.setRecibidoPorNombre(r.recibidoPorNombre().trim());
			e.setRecibidoPorDni(dniRecibido);
		}
		if (r.estado() == EstadoEncomienda.CANCELADA && e.getVuelo() != null) {
			Vuelo v = e.getVuelo();
			if (v.getEstado() == EstadoVuelo.DESPACHADO)
				throw new ReglaNegocioException("No se puede cancelar una encomienda cuyo vuelo ya fue despachado");
			v.setPesoOcupadoKg(v.getPesoOcupadoKg().subtract(e.getPesoCobrableKg()));
			e.setVuelo(null);
		}
		e.setEstado(r.estado());
		return dto(e);
	}

	@Transactional
	public void eliminar(Long id) {
		Encomienda e = buscar(id);
		if (e.getVuelo() != null) {
			Vuelo v = e.getVuelo();
			v.setPesoOcupadoKg(v.getPesoOcupadoKg().subtract(e.getPesoCobrableKg()));
		}
		archivos.eliminar(e.getCartaPoderPublicId());
		repo.delete(e);
	}

	@Transactional
	public EncomiendaDtos.Response marcarAbandonada(Long id) {
		Encomienda e = buscar(id);

		if (e.getEstado() != EstadoEncomienda.EMBARCADA)
			throw new ReglaNegocioException("Solo se puede declarar en abandono una encomienda embarcada");

		if (e.getVuelo() == null || e.getVuelo().getEstado() != EstadoVuelo.DESPACHADO
				|| e.getVuelo().getFechaLlegada().isAfter(LocalDate.now()))
			throw new ReglaNegocioException("La encomienda todavía no ha llegado a su destino");

		declararAbandono(e);
		return dto(e);
	}

	@Scheduled(cron = "0 0 3 * * *")
	@Transactional
	public void declararAbandonosVencidos() {
		LocalDate fechaLimite = LocalDate.now().minusDays(diasLimiteAbandono);
		for (Encomienda e : repo.buscarVencidasParaAbandono(fechaLimite)) {
			declararAbandono(e);
		}
	}

	private void declararAbandono(Encomienda e) {
		Vuelo v = e.getVuelo();
		if (v != null) {
			v.setPesoOcupadoKg(v.getPesoOcupadoKg().subtract(e.getPesoCobrableKg()));
			e.setVuelo(null);
		}
		archivos.eliminar(e.getCartaPoderPublicId());
		e.setCartaPoderPublicId(null);
		e.setPersonaAutorizadaNombre(null);
		e.setPersonaAutorizadaDni(null);
		e.setTipoPersonaAutorizada(null);
		e.setMotivoCambio(null);
		e.setEstadoAutorizacion(null);
		e.setEstado(EstadoEncomienda.ABANDONADA);
		e.setFechaAbandono(LocalDateTime.now());
	}

	private void validarCapacidad(Vuelo v, BigDecimal ocupado) {
		if (ocupado.compareTo(v.getCapacidadMaximaKg()) > 0)
			throw new ReglaNegocioException("La encomienda supera la capacidad disponible del vuelo");
	}

	private BigDecimal pesoCobrable(BigDecimal pesoKg, BigDecimal largoCm, BigDecimal anchoCm, BigDecimal altoCm) {
		if (largoCm == null || anchoCm == null || altoCm == null)
			return pesoKg;
		BigDecimal volumetrico = largoCm.multiply(anchoCm).multiply(altoCm)
				.divide(BigDecimal.valueOf(5000), 2, java.math.RoundingMode.HALF_UP);
		return pesoKg.max(volumetrico);
	}

	private Encomienda buscar(Long id) {
		return repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Encomienda no encontrada"));
	}

	private static final String CARACTERES_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	private static final java.security.SecureRandom RANDOM = new java.security.SecureRandom();

	private String generarCodigo() {
		String codigo;
		do {
			StringBuilder sb = new StringBuilder("EA-");
			for (int i = 0; i < 8; i++) {
				sb.append(CARACTERES_CODIGO.charAt(RANDOM.nextInt(CARACTERES_CODIGO.length())));
			}
			codigo = sb.toString();
		} while (repo.existsByCodigoIgnoreCase(codigo));
		return codigo;
	}

	private void copiar(Encomienda e, EncomiendaDtos.Request r) {
		e.setContenido(r.contenido().trim());
		e.setDescripcion(limpiar(r.descripcion()));
		e.setRemitente(r.remitente().trim());
		e.setRemitenteDni(limpiar(r.remitenteDni()));
		e.setRemitenteTelefono(limpiar(r.remitenteTelefono()));
		e.setRemitenteCorreo(limpiar(r.remitenteCorreo()));
		e.setDestinatario(r.destinatario().trim());
		e.setDestinatarioDni(r.destinatarioDni().trim());
		e.setPersonaAutorizadaNombre(limpiar(r.personaAutorizadaNombre()));
		e.setPersonaAutorizadaDni(limpiar(r.personaAutorizadaDni()));
		e.setTipoPersonaAutorizada(r.tipoPersonaAutorizada());
		e.setPesoKg(r.pesoKg());
		e.setLargoCm(r.largoCm());
		e.setAnchoCm(r.anchoCm());
		e.setAltoCm(r.altoCm());
	}

	private String limpiar(String valor) {
		return valor == null || valor.isBlank() ? null : valor.trim();
	}

	private Integer diasEnAlmacen(Encomienda e) {
		if (e.getEstado() != EstadoEncomienda.EMBARCADA || e.getVuelo() == null)
			return null;
		if (e.getVuelo().getEstado() != EstadoVuelo.DESPACHADO)
			return null;
		LocalDate llegada = e.getVuelo().getFechaLlegada();
		if (llegada.isAfter(LocalDate.now()))
			return null;
		return (int) ChronoUnit.DAYS.between(llegada, LocalDate.now());
	}

	private EncomiendaDtos.Response dto(Encomienda e) {
		Integer dias = diasEnAlmacen(e);
		boolean enRiesgo = dias != null && dias >= diasLimiteAbandono;

		return new EncomiendaDtos.Response(e.getId(), e.getCodigo(), e.getContenido(), e.getDescripcion(),
				e.getRemitente(), e.getRemitenteDni(), e.getRemitenteTelefono(), e.getRemitenteCorreo(),
				e.getDestinatario(), e.getDestinatarioDni(), e.getPersonaAutorizadaNombre(), e.getPersonaAutorizadaDni(),
				e.getPersonaAutorizadaContacto(),
				e.getTipoPersonaAutorizada(), e.getMotivoCambio(), archivos.urlFirmada(e.getCartaPoderPublicId()),
				e.getEstadoAutorizacion(),
				e.getPesoKg(), e.getLargoCm(), e.getAnchoCm(), e.getAltoCm(), e.getPesoVolumetricoKg(),
				e.getPesoCobrableKg(), e.getEstado(), e.getVuelo() == null ? null : e.getVuelo().getId(),
				e.getVuelo() == null ? null : e.getVuelo().getCodigo(),
				e.getVuelo() == null ? null : e.getVuelo().getEstado(), dias, enRiesgo, e.getFechaAbandono(),
				e.getRecibidoPorNombre(), e.getRecibidoPorDni(), e.getFechaRegistro(), e.getFechaActualizacion());
	}
}
