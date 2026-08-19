package pe.edu.cibertec.cargaaerea.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	record ErrorApi(LocalDateTime fecha, int estado, String error, String mensaje, String ruta,
			Map<String, String> errores) {
	}

	@ExceptionHandler(RecursoNoEncontradoException.class)
	ResponseEntity<ErrorApi> noEncontrado(RuntimeException e, HttpServletRequest r) {
		return crear(HttpStatus.NOT_FOUND, e.getMessage(), r, null);
	}

	@ExceptionHandler(ReglaNegocioException.class)
	ResponseEntity<ErrorApi> negocio(RuntimeException e, HttpServletRequest r) {
		return crear(HttpStatus.BAD_REQUEST, e.getMessage(), r, null);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ErrorApi> validacion(MethodArgumentNotValidException e, HttpServletRequest r) {
		Map<String, String> m = new LinkedHashMap<>();
		for (FieldError f : e.getBindingResult().getFieldErrors())
			m.putIfAbsent(f.getField(), f.getDefaultMessage());
		return crear(HttpStatus.BAD_REQUEST, "Existen datos inválidos", r, m);
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ErrorApi> general(Exception e, HttpServletRequest r) {
		log.error("Error no controlado en {}", r.getRequestURI(), e);
		return crear(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error interno", r, null);
	}

	private ResponseEntity<ErrorApi> crear(HttpStatus s, String m, HttpServletRequest r, Map<String, String> errores) {
		return ResponseEntity.status(s)
				.body(new ErrorApi(LocalDateTime.now(), s.value(), s.getReasonPhrase(), m, r.getRequestURI(), errores));
	}
}
