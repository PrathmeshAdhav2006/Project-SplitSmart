package com.splitsmart.service;

import java.util.Locale;

import com.splitsmart.dto.LoginRequest;
import com.splitsmart.dto.RegisterRequest;
import com.splitsmart.exception.AuthenticationException;
import com.splitsmart.model.User;
import com.splitsmart.repository.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.findByEmail(email).isPresent()) {
            throw new AuthenticationException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        try {
            return userRepository.insert(
                    request.getFullName().trim(),
                    email,
                    passwordEncoder.encode(request.getPassword())
            );
        } catch (DuplicateKeyException exception) {
            throw new AuthenticationException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
    }

    public User authenticate(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> invalidCredentials());
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        return user;
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new AuthenticationException(HttpStatus.UNAUTHORIZED, "Authentication is required"));
    }

    private AuthenticationException invalidCredentials() {
        return new AuthenticationException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
