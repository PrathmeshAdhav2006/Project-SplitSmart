package com.splitsmart.controller;

import java.util.List;

import com.splitsmart.dto.AddMemberRequest;
import com.splitsmart.dto.CreateGroupRequest;
import com.splitsmart.dto.GroupResponse;
import com.splitsmart.dto.MemberResponse;
import com.splitsmart.model.User;
import com.splitsmart.service.AuthService;
import com.splitsmart.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups")
public class GroupController {
    private final GroupService groupService;
    private final AuthService authService;
    public GroupController(GroupService groupService, AuthService authService) {
        this.groupService = groupService; this.authService = authService;
    }
    @GetMapping
    public List<GroupResponse> list(Authentication authentication) {
        return groupService.list(currentUser(authentication));
    }
    @PostMapping
    public org.springframework.http.ResponseEntity<GroupResponse> create(@Valid @RequestBody CreateGroupRequest request,
                                                                          Authentication authentication) {
        return org.springframework.http.ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.create(request, currentUser(authentication)));
    }
    @GetMapping("/{groupId}")
    public GroupResponse get(@PathVariable Long groupId, Authentication authentication) {
        return groupService.get(groupId, currentUser(authentication));
    }
    @GetMapping("/{groupId}/members")
    public List<MemberResponse> members(@PathVariable Long groupId, Authentication authentication) {
        return groupService.members(groupId, currentUser(authentication));
    }
    @PostMapping("/{groupId}/members")
    public MemberResponse addMember(@PathVariable Long groupId, @Valid @RequestBody AddMemberRequest request,
                                    Authentication authentication) {
        return groupService.addMember(groupId, request, currentUser(authentication));
    }
    private User currentUser(Authentication authentication) {
        return authService.findByEmail(authentication.getName());
    }
}
