package com.splitsmart.dto;

public class MemberResponse {
    private final Long userId;
    private final String fullName;
    private final String email;
    private final String role;

    public MemberResponse(Long userId, String fullName, String email, String role) {
        this.userId = userId; this.fullName = fullName; this.email = email; this.role = role;
    }
    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
}
