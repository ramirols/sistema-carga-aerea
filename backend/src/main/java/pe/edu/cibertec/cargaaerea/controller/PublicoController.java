package pe.edu.cibertec.cargaaerea.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import pe.edu.cibertec.cargaaerea.dto.EncomiendaDtos;
import pe.edu.cibertec.cargaaerea.service.EncomiendaService;

@RestController
@RequestMapping("/api/publico")
@RequiredArgsConstructor
public class PublicoController {

	private final EncomiendaService servicio;

	@GetMapping("/encomiendas/{codigo}")
	public EncomiendaDtos.Seguimiento rastrear(@PathVariable String codigo) {
		return servicio.seguimientoPublico(codigo);
	}

	@PatchMapping("/encomiendas/{codigo}/autorizado")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void autorizarRecojo(@PathVariable String codigo, @Valid @RequestBody EncomiendaDtos.AutorizarRecojo r) {
		servicio.autorizarRecojo(codigo, r);
	}

	@PostMapping("/encomiendas/{codigo}/carta-poder")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void subirCartaPoder(@PathVariable String codigo, @RequestParam("archivo") MultipartFile archivo) {
		servicio.subirCartaPoder(codigo, archivo);
	}
}
