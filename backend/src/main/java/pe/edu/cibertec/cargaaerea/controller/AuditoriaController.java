package pe.edu.cibertec.cargaaerea.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pe.edu.cibertec.cargaaerea.dto.AuditoriaDtos;
import pe.edu.cibertec.cargaaerea.service.AuditoriaService;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {

	private final AuditoriaService servicio;

	@GetMapping("/recientes")
	public List<AuditoriaDtos.CambioReciente> recientes(
			@RequestParam(defaultValue = "50") int limite,
			@RequestParam(required = false) String tipoEntidad,
			@RequestParam(required = false) String operacion,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
		return servicio.cambiosRecientes(limite, tipoEntidad, operacion, desde, hasta);
	}

	@GetMapping("/vuelos/{id}")
	public List<AuditoriaDtos.RevisionVuelo> historialVuelo(@PathVariable Long id) {
		return servicio.historialVuelo(id);
	}

	@GetMapping("/encomiendas/{id}")
	public List<AuditoriaDtos.RevisionEncomienda> historialEncomienda(@PathVariable Long id) {
		return servicio.historialEncomienda(id);
	}

	@GetMapping("/usuarios/{id}")
	public List<AuditoriaDtos.RevisionUsuario> historialUsuario(@PathVariable Long id) {
		return servicio.historialUsuario(id);
	}

	@PostMapping("/vuelos/{id}/restaurar/{revision}")
	public ResponseEntity<Void> restaurarVuelo(@PathVariable Long id, @PathVariable int revision) {
		servicio.restaurarVuelo(id, revision);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/encomiendas/{id}/restaurar/{revision}")
	public ResponseEntity<Void> restaurarEncomienda(@PathVariable Long id, @PathVariable int revision) {
		servicio.restaurarEncomienda(id, revision);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/usuarios/{id}/restaurar/{revision}")
	public ResponseEntity<Void> restaurarUsuario(@PathVariable Long id, @PathVariable int revision) {
		servicio.restaurarUsuario(id, revision);
		return ResponseEntity.noContent().build();
	}
}
