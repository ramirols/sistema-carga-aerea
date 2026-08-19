package pe.edu.cibertec.cargaaerea.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.cibertec.cargaaerea.dto.AuthDtos;
import pe.edu.cibertec.cargaaerea.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.LoginResponse> login(
        @Valid @RequestBody AuthDtos.LoginRequest request
    ) {
        return ResponseEntity.ok(service.login(request));
    }
}