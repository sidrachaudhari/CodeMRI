# CodeMRI Demo Testbed Repository Files

This folder contains the benchmark Java project and source files used by CodeMRI to test and demonstrate security, quality, and architectural risk detection.

---

## 1. `vulnerable-spring-ecommerce/` (Primary Demo Project)
An e-commerce payment and account service containing 4 critical business risks:

### What This Project Does:
It powers customer checkout, credit account lookups, and transaction fee billing for an online store.

### Key Risk Files & Plain-English Impact:
* **[PaymentService.java](file:///c:/Users/sidra/Desktop/BE/Project/CodeMRI/demo-files/vulnerable-spring-ecommerce/src/PaymentService.java)**:
  * **Risk 1: Customer Data Theft (SQL Injection)**: Direct string concatenation in database queries allows hackers to steal customer banking records, card details, and passwords.
  * **Risk 2: Total Server Takeover (Log4Shell / Remote Code Execution)**: Writing user input directly into an outdated Log4j logger allows attackers to download and run malicious ransomware on the company server.
  * **Risk 3: Checkout Outages & Overbilling (18-Branch Spaghetti Logic)**: The fee calculation has 18 tangled decision rules. Any small discount or price change by marketing easily causes checkout errors and lost sales.
* **[UserRepository.java](file:///c:/Users/sidra/Desktop/BE/Project/CodeMRI/demo-files/vulnerable-spring-ecommerce/src/UserRepository.java)**:
  * Contains unsanitized user search queries (SQL Injection) enabling unauthorized access to administrative accounts.
* **[pom.xml](file:///c:/Users/sidra/Desktop/BE/Project/CodeMRI/demo-files/vulnerable-spring-ecommerce/pom.xml)**:
  * Uses vulnerable libraries (`log4j-core 2.14.1` and `jackson-databind 2.9.10`) that make the entire application susceptible to remote attacks.

---

## 2. `payment-gateway-microservice/`
A financial transaction service containing hardcoded credentials:
* **`StripeGatewayService.java`**:
  * **Exposed Production Secrets**: Live Stripe payment API keys and authentication secrets are written directly into the code. Anyone with read access to the code repository can charge cards or steal funds.

---

## 3. `clean-architecture-service/`
A healthy reference project for comparison:
* All libraries are up to date with zero known security flaws.
* Code has clean boundaries and low complexity, meaning updates can be made without breaking other parts of the system.

---

### How to Test in CodeMRI:
1. In the CodeMRI dashboard, click **"Choose Repo"** in the top navigation bar.
2. Select **"vulnerable-spring-ecommerce"** from the Sample Testbeds tab, or upload any `.java` or `pom.xml` file.
3. Click **"Run Full Scan"** to watch CodeMRI detect each risk and highlight the exact lines and fixes needed.
