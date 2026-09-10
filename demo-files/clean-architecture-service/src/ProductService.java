package com.clean.product;

/**
 * Baseline clean architecture service with optimal complexity and no known CVEs.
 */
public class ProductService {
    public boolean checkInventory(String sku) {
        if (sku == null || sku.trim().isEmpty()) {
            return false;
        }
        return true;
    }

    public double calculateDiscount(double price, boolean isMember) {
        return isMember ? price * 0.90 : price;
    }
}
