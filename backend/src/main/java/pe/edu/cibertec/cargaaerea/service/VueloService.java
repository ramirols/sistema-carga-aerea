package pe.edu.cibertec.cargaaerea.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cibertec.cargaaerea.dto.VueloDtos;
import pe.edu.cibertec.cargaaerea.entity.Encomienda;
import pe.edu.cibertec.cargaaerea.entity.Vuelo;
import pe.edu.cibertec.cargaaerea.enums.EstadoEncomienda;
import pe.edu.cibertec.cargaaerea.enums.EstadoVuelo;
import pe.edu.cibertec.cargaaerea.exception.*;
import pe.edu.cibertec.cargaaerea.repository.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class VueloService {
	private static final Map<EstadoVuelo, Set<EstadoVuelo>> TRANSICIONES_VALIDAS = Map.of(
			EstadoVuelo.PROGRAMADO, Set.of(EstadoVuelo.DESPACHADO, EstadoVuelo.CANCELADO),
			EstadoVuelo.DESPACHADO, Set.of(),
			EstadoVuelo.CANCELADO, Set.of());

	private final VueloRepository repo;
	private final EncomiendaRepository encomiendaRepo;

	@Transactional(readOnly = true)
	public Page<VueloDtos.Response> listar(String busqueda, LocalDate desde, LocalDate hasta, EstadoVuelo estado,
			Pageable p) {
		return repo.buscar(busqueda, desde, hasta, estado, p).map(this::dto);
	}

	@Transactional(readOnly = true)
	public VueloDtos.Response obtener(Long id) {
		return dto(buscar(id));
	}

	@Transactional
	public VueloDtos.Response crear(VueloDtos.Request r) {
		validar(r, null);
		Vuelo v = new Vuelo();
		copiar(v, r);
		return dto(repo.save(v));
	}

	@Transactional
	public VueloDtos.Response actualizar(Long id, VueloDtos.Request r) {
		Vuelo v = buscar(id);
		if (v.getEstado() != EstadoVuelo.PROGRAMADO)
			throw new ReglaNegocioException("Solo se puede editar un vuelo programado");
		validar(r, v);
		if (r.capacidadMaximaKg().compareTo(v.getPesoOcupadoKg()) < 0)
			throw new ReglaNegocioException("La capacidad no puede ser menor al peso ocupado");
		copiar(v, r);
		return dto(v);
	}

	@Transactional
	public VueloDtos.Response cambiarEstado(Long id, VueloDtos.Estado r) {
		Vuelo v = buscar(id);
		if (!TRANSICIONES_VALIDAS.get(v.getEstado()).contains(r.estado()))
			throw new ReglaNegocioException("No se puede cambiar el estado de " + v.getEstado() + " a " + r.estado());
		v.setEstado(r.estado());
		if (r.estado() == EstadoVuelo.CANCELADO)
			liberarEncomiendas(v);
		if (r.estado() == EstadoVuelo.DESPACHADO)
			embarcarEncomiendasPendientes(v);
		return dto(v);
	}

	@Scheduled(cron = "0 */5 * * * *")
	@Transactional
	public void despacharVuelosProgramados() {
		LocalDateTime ahora = LocalDateTime.now();
		for (Vuelo v : repo.findByEstado(EstadoVuelo.PROGRAMADO)) {
			if (!v.getFechaSalida().atTime(v.getHoraSalida()).isAfter(ahora)) {
				v.setEstado(EstadoVuelo.DESPACHADO);
				embarcarEncomiendasPendientes(v);
			}
		}
	}

	private void embarcarEncomiendasPendientes(Vuelo v) {
		for (Encomienda e : encomiendaRepo.findByVueloIdOrderByCodigoAsc(v.getId())) {
			if (e.getEstado() == EstadoEncomienda.EN_ALMACEN)
				e.setEstado(EstadoEncomienda.EMBARCADA);
		}
	}

	private void liberarEncomiendas(Vuelo v) {
		for (Encomienda e : encomiendaRepo.findByVueloIdOrderByCodigoAsc(v.getId())) {
			if (e.getEstado() == EstadoEncomienda.EMBARCADA || e.getEstado() == EstadoEncomienda.EN_ALMACEN) {
				e.setVuelo(null);
				e.setEstado(EstadoEncomienda.EN_ALMACEN);
			}
		}
		v.setPesoOcupadoKg(BigDecimal.ZERO);
	}

	@Transactional
	public void eliminar(Long id) {
		Vuelo v = buscar(id);
		if (encomiendaRepo.existsByVueloId(id))
			throw new ReglaNegocioException("No se puede eliminar un vuelo que tiene encomiendas");
		repo.delete(v);
	}

	Vuelo buscar(Long id) {
		return repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Vuelo no encontrado"));
	}

	private void validar(VueloDtos.Request r, Vuelo actual) {
		if (r.origen().trim().equalsIgnoreCase(r.destino().trim()))
			throw new ReglaNegocioException("El origen y destino no pueden ser iguales");
		if (repo.existsByCodigoIgnoreCase(r.codigo())
				&& (actual == null || !actual.getCodigo().equalsIgnoreCase(r.codigo())))
			throw new ReglaNegocioException("El código de vuelo ya existe");
		if (r.fechaSalida().atTime(r.horaSalida()).isBefore(LocalDateTime.now()))
			throw new ReglaNegocioException("La fecha y hora de salida no puede estar en el pasado");
		if (!r.fechaLlegada().atTime(r.horaLlegada()).isAfter(r.fechaSalida().atTime(r.horaSalida())))
			throw new ReglaNegocioException("La llegada debe ser posterior a la salida");
	}

	private void copiar(Vuelo v, VueloDtos.Request r) {
		v.setCodigo(r.codigo().trim().toUpperCase());
		v.setOrigen(r.origen().trim());
		v.setDestino(r.destino().trim());
		v.setCodigoAeropuertoOrigen(r.codigoAeropuertoOrigen().trim().toUpperCase());
		v.setCodigoAeropuertoDestino(r.codigoAeropuertoDestino().trim().toUpperCase());
		v.setTerminalCargaDestino(
				r.terminalCargaDestino() == null || r.terminalCargaDestino().isBlank() ? null
						: r.terminalCargaDestino().trim());
		v.setFechaSalida(r.fechaSalida());
		v.setHoraSalida(r.horaSalida());
		v.setFechaLlegada(r.fechaLlegada());
		v.setHoraLlegada(r.horaLlegada());
		v.setCapacidadMaximaKg(r.capacidadMaximaKg());
	}

	private VueloDtos.Response dto(Vuelo v) {
		BigDecimal d = v.getCapacidadMaximaKg().subtract(v.getPesoOcupadoKg());
		return new VueloDtos.Response(v.getId(), v.getCodigo(), v.getOrigen(), v.getDestino(),
				v.getCodigoAeropuertoOrigen(), v.getCodigoAeropuertoDestino(), v.getTerminalCargaDestino(),
				v.getFechaSalida(), v.getHoraSalida(), v.getFechaLlegada(), v.getHoraLlegada(),
				v.getCapacidadMaximaKg(), v.getPesoOcupadoKg(), d, v.getEstado(), v.getFechaCreacion(),
				v.getFechaActualizacion());
	}
}
