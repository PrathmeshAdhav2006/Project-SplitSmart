package com.splitsmart.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

import com.splitsmart.model.User;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<User> findByEmail(String email) {
        List<User> users = jdbcTemplate.query(
                "SELECT id, full_name, email, password_hash, created_at FROM app_user WHERE email = ?",
                this::mapUser,
                email
        );
        return users.stream().findFirst();
    }

    public User insert(String fullName, String email, String passwordHash) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            java.sql.PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO app_user (full_name, email, password_hash) VALUES (?, ?, ?)",
                    new String[]{"id"}
            );
            statement.setString(1, fullName);
            statement.setString(2, email);
            statement.setString(3, passwordHash);
            return statement;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        if (generatedId == null) {
            throw new DataAccessException("User ID was not generated") {
            };
        }
        return findById(generatedId.longValue())
                .orElseThrow(() -> new DataAccessException("Created user could not be loaded") {
                });
    }

    private Optional<User> findById(Long id) {
        List<User> users = jdbcTemplate.query(
                "SELECT id, full_name, email, password_hash, created_at FROM app_user WHERE id = ?",
                this::mapUser,
                id
        );
        return users.stream().findFirst();
    }

    private User mapUser(ResultSet resultSet, int rowNumber) throws SQLException {
        Timestamp createdAt = resultSet.getTimestamp("created_at");
        return new User(
                resultSet.getLong("id"),
                resultSet.getString("full_name"),
                resultSet.getString("email"),
                resultSet.getString("password_hash"),
                createdAt.toInstant()
        );
    }
}
