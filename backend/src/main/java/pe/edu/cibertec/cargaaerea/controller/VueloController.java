package pe.edu.cibertec.cargaaerea.controller;

import java.time.LocalDate;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import pe.edu.cibertec.cargaaerea.dto.VueloDtos;
import pe.edu.cibertec.cargaaerea.enums.EstadoVuelo;
import pe.edu.cibertec.cargaaerea.service.VueloService;

@RestController
@RequestMapping("/api/vuelos")
@RequiredArgsConstructor
public class VueloController {
	private final VueloService s;

	@GetMapping
	public Page<VueloDtos.Response> listar(
			@RequestParam(required = false) String busqueda,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
			@RequestParam(required = false) EstadoVuelo estado,
			@PageableDefault(size = 10, sort = "fechaSalida") Pageable p) {
		return s.listar(busqueda, desde, hasta, estado, p);
	}

	@GetMapping("/{id}")
	public VueloDtos.Response obtener(@PathVariable Long id) {
		return s.obtener(id);
	}

	@PostMapping
	public ResponseEntity<VueloDtos.Response> crear(@Valid @RequestBody VueloDtos.Request r) {
		return ResponseEntity.status(HttpStatus.CREATED).body(s.crear(r));
	}

	@PutMapping("/{id}")
	public VueloDtos.Response actualizar(@PathVariable Long id, @Valid @RequestBody VueloDtos.Request r) {
		return s.actualizar(id, r);
	}

	@PatchMapping("/{id}/estado")
	public VueloDtos.Response estado(@PathVariable Long id, @Valid @RequestBody VueloDtos.Estado r) {
		return s.cambiarEstado(id, r);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void eliminar(@PathVariable Long id) {
		s.eliminar(id);
	}
}
