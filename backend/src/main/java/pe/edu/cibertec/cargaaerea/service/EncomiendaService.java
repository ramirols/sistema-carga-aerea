package pe.edu.cibertec.cargaaerea.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.cibertec.cargaaerea.dto.EncomiendaDtos;
import pe.edu.cibertec.cargaaerea.entity.*;
import pe.edu.cibertec.cargaaerea.enums.*;
import pe.edu.cibertec.cargaaerea.exception.*;
import pe.edu.cibertec.cargaaerea.repository.EncomiendaRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class EncomiendaService {
	private final EncomiendaRepository repo;
	private final VueloService vuelos;

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
	public java.util.List<EncomiendaDtos.Response> porVuelo(Long vueloId) {
		return repo.findByVueloIdOrderByCodigoAsc(vueloId).stream().map(this::dto).toList();
	}

	@Transactional
	public EncomiendaDtos.Response crear(EncomiendaDtos.Request r) {
		if (repo.existsByCodigoIgnoreCase(r.codigo()))
			throw new ReglaNegocioException("El código de encomienda ya existe");
		Encomienda e = new Encomienda();
		copiar(e, r);
		return dto(repo.save(e));
	}

	@Transactional
	public EncomiendaDtos.Response actualizar(Long id, EncomiendaDtos.Request r) {
		Encomienda e = buscar(id);
		if (!e.getCodigo().equalsIgnoreCase(r.codigo()) && repo.existsByCodigoIgnoreCase(r.codigo()))
			throw new ReglaNegocioException("El código de encomienda ya existe");
		if (e.getEstado() != EstadoEncomienda.EN_ALMACEN)
			throw new ReglaNegocioException("Solo se puede editar una encomienda en almacén");
		if (e.getVuelo() != null) {
			Vuelo v = e.getVuelo();
			BigDecimal cobrableNuevo = pesoCobrable(r.pesoKg(), r.largoCm(), r.anchoCm(), r.altoCm());
			BigDecimal nuevo = v.getPesoOcupadoKg().subtract(e.getPesoCobrableKg()).add(cobrableNuevo);
			validarCapacidad(v, nuevo);
			v.setPesoOcupadoKg(nuevo);
		}
		copiar(e, r);
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
		return dto(e);
	}

	@Transactional
	public EncomiendaDtos.Response cambiarEstado(Long id, EncomiendaDtos.Estado r) {
		Encomienda e = buscar(id);
		if (r.estado() == EstadoEncomienda.EMBARCADA && e.getVuelo() == null)
			throw new ReglaNegocioException("Debe asignar un vuelo antes de embarcar");
		if (r.estado() == EstadoEncomienda.CANCELADA && e.getVuelo() != null) {
			Vuelo v = e.getVuelo();
			v.setPesoOcupadoKg(v.getPesoOcupadoKg().subtract(e.getPesoCobrableKg()));
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
		repo.delete(e);
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

	private void copiar(Encomienda e, EncomiendaDtos.Request r) {
		e.setCodigo(r.codigo().trim().toUpperCase());
		e.setDescripcion(r.descripcion().trim());
		e.setRemitente(r.remitente().trim());
		e.setDestinatario(r.destinatario().trim());
		e.setPesoKg(r.pesoKg());
		e.setLargoCm(r.largoCm());
		e.setAnchoCm(r.anchoCm());
		e.setAltoCm(r.altoCm());
	}

	private EncomiendaDtos.Response dto(Encomienda e) {
		return new EncomiendaDtos.Response(e.getId(), e.getCodigo(), e.getDescripcion(), e.getRemitente(),
				e.getDestinatario(), e.getPesoKg(), e.getLargoCm(), e.getAnchoCm(), e.getAltoCm(),
				e.getPesoVolumetricoKg(), e.getPesoCobrableKg(), e.getEstado(),
				e.getVuelo() == null ? null : e.getVuelo().getId(), e.getVuelo() == null ? null : e.getVuelo().getCodigo(),
				e.getFechaRegistro(), e.getFechaActualizacion());
	}
}
