package pe.edu.cibertec.cargaaerea.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
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

@Service
@RequiredArgsConstructor
public class VueloService {
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
		if (v.getEstado() == EstadoVuelo.CANCELADO)
			throw new ReglaNegocioException("Un vuelo cancelado no puede cambiar de estado");
		v.setEstado(r.estado());
		if (r.estado() == EstadoVuelo.CANCELADO)
			liberarEncomiendas(v);
		return dto(v);
	}

	private void liberarEncomiendas(Vuelo v) {
		for (Encomienda e : encomiendaRepo.findByVueloIdAndEstado(v.getId(), EstadoEncomienda.EMBARCADA)) {
			e.setVuelo(null);
			e.setEstado(EstadoEncomienda.EN_ALMACEN);
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
	}

	private void copiar(Vuelo v, VueloDtos.Request r) {
		v.setCodigo(r.codigo().trim().toUpperCase());
		v.setOrigen(r.origen().trim());
		v.setDestino(r.destino().trim());
		v.setFechaSalida(r.fechaSalida());
		v.setHoraSalida(r.horaSalida());
		v.setCapacidadMaximaKg(r.capacidadMaximaKg());
	}

	private VueloDtos.Response dto(Vuelo v) {
		BigDecimal d = v.getCapacidadMaximaKg().subtract(v.getPesoOcupadoKg());
		return new VueloDtos.Response(v.getId(), v.getCodigo(), v.getOrigen(), v.getDestino(), v.getFechaSalida(),
				v.getHoraSalida(), v.getCapacidadMaximaKg(), v.getPesoOcupadoKg(), d, v.getEstado(),
				v.getFechaCreacion(), v.getFechaActualizacion());
	}
}
