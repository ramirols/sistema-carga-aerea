package pe.edu.cibertec.cargaaerea.controller;

import java.time.LocalDate;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import pe.edu.cibertec.cargaaerea.dto.EncomiendaDtos;
import pe.edu.cibertec.cargaaerea.enums.EstadoEncomienda;
import pe.edu.cibertec.cargaaerea.service.EncomiendaService;

@RestController
@RequestMapping("/api/encomiendas")
@RequiredArgsConstructor
public class EncomiendaController {
	private final EncomiendaService s;

	@GetMapping
	public Page<EncomiendaDtos.Response> listar(
			@RequestParam(required = false) String busqueda,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
			@RequestParam(required = false) EstadoEncomienda estado,
			@PageableDefault(size = 10, sort = "fechaRegistro", direction = Sort.Direction.DESC) Pageable p) {
		return s.listar(busqueda, desde, hasta, estado, p);
	}

	@GetMapping("/{id}")
	public EncomiendaDtos.Response obtener(@PathVariable Long id) {
		return s.obtener(id);
	}

	@GetMapping("/por-vuelo/{vueloId}")
	public java.util.List<EncomiendaDtos.Response> porVuelo(@PathVariable Long vueloId) {
		return s.porVuelo(vueloId);
	}

	@PostMapping
	public ResponseEntity<EncomiendaDtos.Response> crear(@Valid @RequestBody EncomiendaDtos.Request r) {
		return ResponseEntity.status(HttpStatus.CREATED).body(s.crear(r));
	}

	@PutMapping("/{id}")
	public EncomiendaDtos.Response actualizar(@PathVariable Long id, @Valid @RequestBody EncomiendaDtos.Request r) {
		return s.actualizar(id, r);
	}

	@PatchMapping("/{id}/asignar-vuelo")
	public EncomiendaDtos.Response asignar(@PathVariable Long id, @Valid @RequestBody EncomiendaDtos.AsignarVuelo r) {
		return s.asignarVuelo(id, r);
	}

	@PatchMapping("/{id}/estado")
	public EncomiendaDtos.Response estado(@PathVariable Long id, @Valid @RequestBody EncomiendaDtos.Estado r) {
		return s.cambiarEstado(id, r);
	}

	@PatchMapping("/{id}/autorizacion")
	public EncomiendaDtos.Response cambiarEstadoAutorizacion(@PathVariable Long id,
			@Valid @RequestBody EncomiendaDtos.CambiarEstadoAutorizacion r) {
		return s.cambiarEstadoAutorizacion(id, r);
	}

	@PatchMapping("/{id}/abandonar")
	public EncomiendaDtos.Response marcarAbandonada(@PathVariable Long id) {
		return s.marcarAbandonada(id);
	}

	@PatchMapping("/{id}/desembarcar")
	public EncomiendaDtos.Response desembarcar(@PathVariable Long id) {
		return s.desembarcar(id);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void eliminar(@PathVariable Long id) {
		s.eliminar(id);
	}
}
