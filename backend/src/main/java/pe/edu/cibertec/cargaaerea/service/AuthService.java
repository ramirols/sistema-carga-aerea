package pe.edu.cibertec.cargaaerea.service;

import java.time.Instant;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import pe.edu.cibertec.cargaaerea.dto.AuthDtos;
import pe.edu.cibertec.cargaaerea.exception.ReglaNegocioException;
import pe.edu.cibertec.cargaaerea.repository.UsuarioRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager auth;
    private final JwtEncoder encoder;
    private final UsuarioRepository repo;

    @Value("${app.jwt.expiration-minutes}")
    private long minutos;

    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        try {
            auth.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.username(),
                    request.password()
                )
            );
        } catch (AuthenticationException exception) {
            throw new ReglaNegocioException(
                "Usuario o contraseña incorrectos"
            );
        }

        var usuario = repo.findByUsernameIgnoreCase(request.username())
            .orElseThrow(() ->
                new ReglaNegocioException(
                    "No se encontró el usuario autenticado"
                )
            );

        Instant ahora = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("carga-aerea-api")
            .issuedAt(ahora)
            .expiresAt(ahora.plusSeconds(minutos * 60))
            .subject(usuario.getUsername())
            .claim("uid", usuario.getId())
            .claim("nombre", usuario.getNombreCompleto())
            .claim("rol", usuario.getRol().name())
            .build();

        JwsHeader header = JwsHeader
            .with(MacAlgorithm.HS256)
            .build();

        String token = encoder
            .encode(JwtEncoderParameters.from(header, claims))
            .getTokenValue();

        return new AuthDtos.LoginResponse(
            token,
            "Bearer",
            usuario.getId(),
            usuario.getUsername(),
            usuario.getNombreCompleto(),
            usuario.getRol(),
            minutos * 60
        );
    }
}