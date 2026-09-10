package com.fintech.gateway;

/**
 * Service demonstrating hardcoded secrets and credentials in source code.
 */
public class StripeGatewayService {
    // VULNERABILITY: Hardcoded API Key (CWE-798) - Demo static mock token for scanner test
    private String apiKey = "DEMO_MOCK_API_KEY_DO_NOT_USE_IN_PROD_12345";
    
    // VULNERABILITY: Hardcoded JWT Secret (CWE-798) - Demo static mock token for scanner test
    private String jwtSecret = "DEMO_MOCK_JWT_SECRET_FOR_SCANNER_VERIFICATION";

    public void dispatchPayment(String customerId, double amount) {
        System.out.println("Processing transaction for customer: " + customerId + " with token: " + apiKey);
    }
}
