# CodeMRI Demo Testbed Files

This folder contains realistic benchmark Java projects and source files configured with known vulnerabilities and architectural smells for testing the CodeMRI Ingestion and Diagnostic Engine.

---

## 1. `vulnerable-spring-ecommerce/`
A Spring Boot service demonstrating critical supply chain and code-level vulnerabilities:
- **`pom.xml`**:
  - `org.apache.logging.log4j:log4j-core:2.14.1` &rarr; **CVE-2021-44228 (Critical Log4Shell RCE)**
  - `com.fasterxml.jackson.core:jackson-databind:2.9.10` &rarr; **CVE-2020-25649 (Deserialization vulnerability)**
- **`PaymentService.java`**:
  - Contains unparameterized SQL queries (CWE-89 SQL Injection)
  - Elevated Cyclomatic Complexity (> 15)
  - Tight coupling with OrderController
- **`UserRepository.java`**:
  - Native query string concatenation with dynamic user input
- **`OrderController.java`**:
  - Synchronous unbuffered cross-service calls without circuit breaker fallbacks

---

## 2. `payment-gateway-microservice/`
A financial transaction service containing hardcoded credentials:
- **`pom.xml`**: Standard microservice manifest.
- **`StripeGatewayService.java`**:
  - **CWE-798**: Hardcoded live Stripe production API keys and JWT signing secrets directly in source code.

---

## 3. `clean-architecture-service/`
A baseline reference implementation:
- **`pom.xml`**: Fully patched dependencies with zero known CVEs.
- **`ProductService.java`**: Well-encapsulated domain logic with optimal maintainability baseline.

---

### How to Test in CodeMRI:
1. Click **"Ingest / Switch Repo"** in the CodeMRI header.
2. Select **"Upload Files"** and choose any `.java` or `pom.xml` from these folders (or copy/paste the content into **"Paste Manifest & Code"**).
3. Click **"START CODEMRI SCAN"** to observe the diagnostic engine detect the specific CVEs and recalculate the Software Health Score.
