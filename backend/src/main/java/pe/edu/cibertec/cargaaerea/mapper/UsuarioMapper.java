package pe.edu.cibertec.cargaaerea.mapper;

import org.springframework.stereotype.Component;

import pe.edu.cibertec.cargaaerea.dto.UsuarioDtos;
import pe.edu.cibertec.cargaaerea.entity.Usuario;

@Component
public class UsuarioMapper {

    public UsuarioDtos.Response toResponse(Usuario usuario) {
        if (usuario == null) {
            return null;
        }

        return new UsuarioDtos.Response(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getNombreCompleto(),
                usuario.getRol(),
                usuario.getActivo(),
                usuario.getFechaCreacion(),
                usuario.getFechaActualizacion()
        );
    }
}