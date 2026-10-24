package com.splitsmart.service;

import java.util.List;

import com.splitsmart.dto.AddMemberRequest;
import com.splitsmart.dto.CreateGroupRequest;
import com.splitsmart.dto.GroupResponse;
import com.splitsmart.dto.MemberResponse;
import com.splitsmart.exception.AuthenticationException;
import com.splitsmart.model.User;
import com.splitsmart.repository.GroupRepository;
import com.splitsmart.repository.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GroupService {
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    public GroupService(GroupRepository groupRepository, UserRepository userRepository) {
        this.groupRepository = groupRepository; this.userRepository = userRepository;
    }

    @Transactional
    public GroupResponse create(CreateGroupRequest request, User user) {
        return groupRepository.insert(request.getName().trim(), request.getDescription(), user.getId());
    }

    public List<GroupResponse> list(User user) { return groupRepository.findForUser(user.getId()); }

    public GroupResponse get(Long groupId, User user) {
        requireMember(groupId, user);
        return groupRepository.findById(groupId);
    }

    public List<MemberResponse> members(Long groupId, User user) {
        requireMember(groupId, user);
        return groupRepository.findMembers(groupId);
    }

    @Transactional
    public MemberResponse addMember(Long groupId, AddMemberRequest request, User user) {
        if (!groupRepository.isOwner(groupId, user.getId())) {
            throw new AuthenticationException(HttpStatus.FORBIDDEN, "Only the group owner can add members");
        }
        User member = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new AuthenticationException(HttpStatus.NOT_FOUND, "No registered user has this email"));
        try {
            groupRepository.addMember(groupId, member.getId());
        } catch (DuplicateKeyException exception) {
            throw new AuthenticationException(HttpStatus.CONFLICT, "User is already a group member");
        }
        return new MemberResponse(member.getId(), member.getFullName(), member.getEmail(), "MEMBER");
    }

    public void requireMember(Long groupId, User user) {
        if (!groupRepository.isMember(groupId, user.getId())) {
            throw new AuthenticationException(HttpStatus.FORBIDDEN, "You are not a member of this group");
        }
    }
}
