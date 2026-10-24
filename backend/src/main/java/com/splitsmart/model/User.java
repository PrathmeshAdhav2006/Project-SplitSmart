package com.splitsmart.model;

import java.time.Instant;

public class User {

    private final Long id;
    private final String fullName;
    private final String email;
    private final String passwordHash;
    private final Instant createdAt;

    public User(Long id, String fullName, String email, String passwordHash, Instant createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
