package pe.edu.cibertec.cargaaerea.security;

import java.nio.charset.StandardCharsets;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

	private final SecretKey secretKey;

	public SecurityConfig(
			@org.springframework.beans.factory.annotation.Value("${app.jwt.secret}") String secret) {
		this.secretKey = new SecretKeySpec(
				secret.getBytes(StandardCharsets.UTF_8),
				"HmacSHA256");
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationManager authenticationManager(
			AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	@Bean
	public JwtEncoder jwtEncoder() {
		return NimbusJwtEncoder
				.withSecretKey(secretKey)
				.algorithm(MacAlgorithm.HS256)
				.build();
	}

	@Bean
	public JwtDecoder jwtDecoder() {
		return NimbusJwtDecoder
				.withSecretKey(secretKey)
				.macAlgorithm(MacAlgorithm.HS256)
				.build();
	}

	@Bean
	public Converter<Jwt, ? extends AbstractAuthenticationToken> jwtConverter() {

		JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

		converter.setJwtGrantedAuthoritiesConverter(jwt -> {
			String rol = jwt.getClaimAsString("rol");

			if (rol == null || rol.isBlank()) {
				return List.of();
			}

			return List.of(
					new SimpleGrantedAuthority("ROLE_" + rol));
		});

		return converter;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(
			HttpSecurity http,
			Converter<Jwt, ? extends AbstractAuthenticationToken> jwtConverter) throws Exception {

		return http
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.sessionManagement(session -> session.sessionCreationPolicy(
						SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(authorize -> authorize
						.requestMatchers(
								HttpMethod.POST,
								"/api/auth/login")
						.permitAll()
						.requestMatchers("/api/usuarios/**")
						.hasRole("ADMINISTRADOR")
						.requestMatchers("/api/auditoria/**")
						.hasRole("ADMINISTRADOR")
						.anyRequest()
						.authenticated())
				.oauth2ResourceServer(
						resourceServer -> resourceServer.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter)))
				.build();
	}
}