package com.ecommerce.service;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * ARCHITECTURAL HOTSPOT: PaymentService.java
 * High Complexity, Direct Coupling, SQL Injection, and Log4j CVE Trigger.
 */
public class PaymentService {
    private static final Logger logger = LogManager.getLogger(PaymentService.class);

    // VULNERABILITY: SQL Injection (CWE-89)
    public boolean verifyAccountHolder(String accountId, Connection connection) throws SQLException {
        // Unsafe string concatenation without parameter binding
        String sql = "SELECT * FROM payment_accounts WHERE account_id = '" + accountId + "'";
        Statement stmt = connection.createStatement();
        ResultSet rs = stmt.executeQuery(sql);

        // VULNERABILITY: Log4Shell unescaped user parameter logging (CVE-2021-44228)
        logger.info("Account verification queried for identifier: " + accountId);

        return rs.next();
    }

    // ARCHITECTURAL CODE SMELL: High Cyclomatic Complexity (> 15)
    public int calculateTransactionFee(double amount, int tier, boolean isForeign, boolean isPromo, int riskIndex) {
        int fee = 0;
        if (amount > 10000) {
            if (isForeign) {
                if (tier == 1) fee += 50;
                else if (tier == 2) fee += 40;
                else fee += 30;
            } else {
                if (isPromo) fee += 10;
                else fee += 20;
            }
        } else if (amount > 1000) {
            if (riskIndex > 70) {
                if (tier == 3) fee += 25;
                else fee += 15;
            } else {
                fee += 5;
            }
        } else {
            if (isPromo) fee = 0;
            else fee = 2;
        }

        if (riskIndex > 90) fee += 100;
        return fee;
    }
}
