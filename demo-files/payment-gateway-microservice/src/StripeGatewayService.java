package com.fintech.gateway;

/**
 * Service demonstrating hardcoded secrets and credentials in source code.
 */
public class StripeGatewayService {
    // VULNERABILITY: Hardcoded API Key (CWE-798)
    private String apiKey = "sk_live_51M0abcdef1234567890XYZSECRETKEY";
    
    // VULNERABILITY: Hardcoded JWT Secret (CWE-798)
    private String jwtSecret = "super_secret_signing_key_never_share_in_prod";

    public void dispatchPayment(String customerId, double amount) {
        System.out.println("Processing transaction for customer: " + customerId + " with token: " + apiKey);
    }
}
