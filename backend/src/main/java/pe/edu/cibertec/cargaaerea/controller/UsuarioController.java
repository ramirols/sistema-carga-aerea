package pe.edu.cibertec.cargaaerea.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import pe.edu.cibertec.cargaaerea.dto.UsuarioDtos;
import pe.edu.cibertec.cargaaerea.service.UsuarioService;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {
	private final UsuarioService s;

	@GetMapping
	public Page<UsuarioDtos.Response> listar(
			@RequestParam(required = false) String busqueda,
			@RequestParam(required = false) Boolean activo,
			@PageableDefault(size = 10, sort = "nombreCompleto") Pageable p) {
		return s.listar(busqueda, activo, p);
	}

	@GetMapping("/{id}")
	public UsuarioDtos.Response obtener(@PathVariable Long id) {
		return s.obtener(id);
	}

	@PostMapping
	public ResponseEntity<UsuarioDtos.Response> crear(@Valid @RequestBody UsuarioDtos.Request r) {
		return ResponseEntity.status(HttpStatus.CREATED).body(s.crear(r));
	}

	@PutMapping("/{id}")
	public UsuarioDtos.Response actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioDtos.Update r) {
		return s.actualizar(id, r);
	}

	@PatchMapping("/{id}/estado")
	public UsuarioDtos.Response estado(@PathVariable Long id, @Valid @RequestBody UsuarioDtos.Estado r) {
		return s.estado(id, r);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void eliminar(@PathVariable Long id) {
		s.eliminar(id);
	}
}
