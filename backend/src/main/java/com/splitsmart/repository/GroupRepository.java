package com.splitsmart.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

import com.splitsmart.dto.GroupResponse;
import com.splitsmart.dto.MemberResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GroupRepository {
    private final JdbcTemplate jdbcTemplate;
    public GroupRepository(JdbcTemplate jdbcTemplate) { this.jdbcTemplate = jdbcTemplate; }

    public GroupResponse insert(String name, String description, Long ownerId) {
        jdbcTemplate.update("INSERT INTO expense_group (name, description, owner_id) VALUES (?, ?, ?)",
                name, description, ownerId);
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        jdbcTemplate.update("INSERT INTO group_member (group_id, user_id, role) VALUES (?, ?, 'OWNER')", id, ownerId);
        return findById(id);
    }

    public List<GroupResponse> findForUser(Long userId) {
        return jdbcTemplate.query("SELECT g.id, g.name, g.description, g.currency_code, g.owner_id, g.created_at " +
                        "FROM expense_group g JOIN group_member m ON m.group_id = g.id WHERE m.user_id = ? ORDER BY g.created_at DESC",
                this::mapGroup, userId);
    }

    public GroupResponse findById(Long groupId) {
        return jdbcTemplate.queryForObject("SELECT id, name, description, currency_code, owner_id, created_at " +
                "FROM expense_group WHERE id = ?", this::mapGroup, groupId);
    }

    public boolean isMember(Long groupId, Long userId) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM group_member WHERE group_id = ? AND user_id = ?",
                Integer.class, groupId, userId);
        return count != null && count > 0;
    }

    public boolean isOwner(Long groupId, Long userId) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM expense_group WHERE id = ? AND owner_id = ?",
                Integer.class, groupId, userId);
        return count != null && count > 0;
    }

    public List<MemberResponse> findMembers(Long groupId) {
        return jdbcTemplate.query("SELECT u.id, u.full_name, u.email, m.role FROM app_user u " +
                        "JOIN group_member m ON m.user_id = u.id WHERE m.group_id = ? ORDER BY u.full_name",
                (resultSet, rowNumber) -> new MemberResponse(resultSet.getLong("id"),
                        resultSet.getString("full_name"), resultSet.getString("email"), resultSet.getString("role")), groupId);
    }

    public void addMember(Long groupId, Long userId) {
        jdbcTemplate.update("INSERT INTO group_member (group_id, user_id, role) VALUES (?, ?, 'MEMBER')", groupId, userId);
    }

    private GroupResponse mapGroup(ResultSet resultSet, int rowNumber) throws SQLException {
        Timestamp createdAt = resultSet.getTimestamp("created_at");
        return new GroupResponse(resultSet.getLong("id"), resultSet.getString("name"),
                resultSet.getString("description"), resultSet.getString("currency_code"),
                resultSet.getLong("owner_id"), createdAt.toInstant());
    }
}
