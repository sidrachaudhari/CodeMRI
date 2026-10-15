package com.ecommerce.repository;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * ============================================================================
 * REPOSITORY RISK AUDIT: UserRepository.java
 * ============================================================================
 * 
 * WHAT THIS FILE DOES:
 * Searches for user accounts in the database using custom filter criteria.
 * 
 * THE RISK IN PLAIN ENGLISH (SQL INJECTION):
 * The filter text entered by a user is glued directly onto the end of the SQL query.
 * A malicious visitor can inject database commands to bypass login, steal
 * user passwords, or delete entire user tables.
 * 
 * BUSINESS IMPACT:
 * Critical breach of user privacy, identity theft, and failure of security audits.
 * ============================================================================
 */
public class UserRepository {
    // RISK: Raw SQL concatenation (CWE-89)
    public String findByCustomFilter(String filterCriteria, Connection connection) throws SQLException {
        // DANGER: Unsanitized user input concatenated directly into database query
        String sql = "SELECT username, role FROM users WHERE active = 1 AND " + filterCriteria;
        Statement statement = connection.createStatement();
        ResultSet resultSet = statement.executeQuery(sql);

        if (resultSet.next()) {
            return resultSet.getString("username");
        }
        return null;
    }
}
