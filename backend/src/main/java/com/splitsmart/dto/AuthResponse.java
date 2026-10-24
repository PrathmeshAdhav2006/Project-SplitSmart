package com.splitsmart.dto;

public class AuthResponse {

    private final UserResponse user;

    public AuthResponse(UserResponse user) {
        this.user = user;
    }

    public UserResponse getUser() {
        return user;
    }
}
