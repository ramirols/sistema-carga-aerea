package pe.edu.cibertec.cargaaerea.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.cibertec.cargaaerea.exception.ReglaNegocioException;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ArchivoService {
	private static final Set<String> TIPOS_PERMITIDOS = Set.of(
			"image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf");

	private final Cloudinary cloudinary;

	public String subirCartaPoder(MultipartFile archivo) {
		if (archivo == null || archivo.isEmpty())
			throw new ReglaNegocioException("Debes adjuntar la carta poder");

		if (archivo.getSize() > 5 * 1024 * 1024)
			throw new ReglaNegocioException("El archivo no puede superar los 5 MB");

		String tipo = archivo.getContentType();
		if (tipo == null || !TIPOS_PERMITIDOS.contains(tipo.toLowerCase()))
			throw new ReglaNegocioException("Solo se permiten imágenes (JPG, PNG, WEBP) o archivos PDF");

		try {
			@SuppressWarnings("unchecked")
			Map<String, Object> resultado = cloudinary.uploader().upload(archivo.getBytes(), ObjectUtils.asMap(
					"folder", "carga-aerea/cartas-poder",
					"resource_type", "auto",
					"type", "authenticated"));

			return (String) resultado.get("public_id");
		} catch (IOException e) {
			throw new ReglaNegocioException("No se pudo subir la carta poder, inténtalo de nuevo");
		}
	}

	public String urlFirmada(String publicId) {
		if (publicId == null)
			return null;

		return cloudinary.url()
				.type("authenticated")
				.signed(true)
				.secure(true)
				.generate(publicId);
	}

	public void eliminar(String publicId) {
		if (publicId == null)
			return;

		try {
			cloudinary.uploader().destroy(publicId, ObjectUtils.asMap(
					"type", "authenticated",
					"resource_type", "image"));
		} catch (IOException e) {
			throw new ReglaNegocioException("No se pudo eliminar la carta poder, inténtalo de nuevo");
		}
	}
}
