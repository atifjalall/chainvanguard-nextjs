#!/bin/bash

# Batch script to add usePageTitle to all pages
# Usage: ./scripts/add-all-page-titles.sh

echo "🚀 Adding page titles to all pages..."
echo "======================================"
echo ""

# Function to add title to a page
add_title() {
  local file=$1
  local title=$2

  # Skip if file doesn't exist
  if [ ! -f "$file" ]; then
    return
  fi

  # Check if it's a client component
  if ! grep -q '"use client"' "$file"; then
    return
  fi

  # Skip if already has usePageTitle
  if grep -q "usePageTitle" "$file"; then
    echo "⏭️  Skipped: $file (already has title)"
    return
  fi

  # Add import if not present
  if ! grep -q "import.*usePageTitle" "$file"; then
    last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
    if [ -n "$last_import" ]; then
      # Use a temporary file for safer editing
      awk -v line="$last_import" -v import='import { usePageTitle } from "@/hooks/use-page-title";' '
        NR == line { print; print import; next }
        { print }
      ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    fi
  fi

  # Find and add usePageTitle call
  function_line=$(grep -n "^export default function" "$file" | head -1 | cut -d: -f1)
  if [ -n "$function_line" ]; then
    insert_line=$((function_line + 1))
    awk -v line="$insert_line" -v call="  usePageTitle(\"$title\");" '
      NR == line { print call; print; next }
      { print }
    ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    echo "✓ Added: $file → \"$title\""
  fi
}

# Auth Pages
add_title "src/app/(auth)/login/page.tsx" "Login"
add_title "src/app/(auth)/register/page.tsx" "Register"
add_title "src/app/(auth)/role-selection/page.tsx" "Select Role"
add_title "src/app/(auth)/forgot-password/page.tsx" "Forgot Password"

# Customer Pages
add_title "src/app/(dashboard)/customer/checkout/page.tsx" "Checkout"
add_title "src/app/(dashboard)/customer/orders/page.tsx" "My Orders"
add_title "src/app/(dashboard)/customer/orders/[id]/page.tsx" "Order Details"
add_title "src/app/(dashboard)/customer/returns/page.tsx" "My Returns"
add_title "src/app/(dashboard)/customer/returns/[id]/page.tsx" "Return Details"
add_title "src/app/(dashboard)/customer/saved-items/page.tsx" "Saved Items"
add_title "src/app/(dashboard)/customer/wallet/page.tsx" "My Wallet"
add_title "src/app/(dashboard)/customer/product/[id]/page.tsx" "Product Details"
add_title "src/app/(dashboard)/customer/profile/page.tsx" "My Profile"
add_title "src/app/(dashboard)/customer/notifications/page.tsx" "Notifications"
add_title "src/app/(dashboard)/customer/transactions/page.tsx" "Transactions"
add_title "src/app/(dashboard)/customer/transactions/[id]/page.tsx" "Transaction Details"
add_title "src/app/(dashboard)/customer/vendor/[id]/page.tsx" "Vendor Profile"
add_title "src/app/(dashboard)/customer/history/page.tsx" "Order History"

# Vendor Pages
add_title "src/app/(dashboard)/vendor/add-product/page.tsx" "Add Product"
add_title "src/app/(dashboard)/vendor/my-products/page.tsx" "My Products"
add_title "src/app/(dashboard)/vendor/my-products/[id]/page.tsx" "Product Details"
add_title "src/app/(dashboard)/vendor/my-products/[id]/edit/page.tsx" "Edit Product"
add_title "src/app/(dashboard)/vendor/browse/page.tsx" "Browse Inventory"
add_title "src/app/(dashboard)/vendor/my-inventory/page.tsx" "My Inventory"
add_title "src/app/(dashboard)/vendor/orders/page.tsx" "Orders"
add_title "src/app/(dashboard)/vendor/orders/[id]/page.tsx" "Order Details"
add_title "src/app/(dashboard)/vendor/orders/[id]/edit/page.tsx" "Edit Order"
add_title "src/app/(dashboard)/vendor/returns/page.tsx" "Returns"
add_title "src/app/(dashboard)/vendor/customers/page.tsx" "Customers"
add_title "src/app/(dashboard)/vendor/my-requests/page.tsx" "My Requests"
add_title "src/app/(dashboard)/vendor/saved-items/page.tsx" "Saved Items"
add_title "src/app/(dashboard)/vendor/transactions/page.tsx" "Transactions"
add_title "src/app/(dashboard)/vendor/insights/page.tsx" "Business Insights"
add_title "src/app/(dashboard)/vendor/history/page.tsx" "Order History"

# Supplier Pages
add_title "src/app/(dashboard)/supplier/page.tsx" "Supplier Dashboard"
add_title "src/app/(dashboard)/supplier/add-inventory/page.tsx" "Add Inventory"
add_title "src/app/(dashboard)/supplier/inventory/page.tsx" "Inventory Management"
add_title "src/app/(dashboard)/supplier/inventory/[id]/page.tsx" "Inventory Details"
add_title "src/app/(dashboard)/supplier/inventory/[id]/edit/page.tsx" "Edit Inventory"
add_title "src/app/(dashboard)/supplier/vendor-requests/page.tsx" "Vendor Requests"
add_title "src/app/(dashboard)/supplier/vendors/page.tsx" "My Vendors"
add_title "src/app/(dashboard)/supplier/transactions/page.tsx" "Transactions"
add_title "src/app/(dashboard)/supplier/insights/page.tsx" "Business Insights"

# Blockchain Expert Pages
add_title "src/app/(dashboard)/blockchain-expert/page.tsx" "Blockchain Dashboard"
add_title "src/app/(dashboard)/blockchain-expert/all-transactions/page.tsx" "All Transactions"
add_title "src/app/(dashboard)/blockchain-expert/blockchain-logs/page.tsx" "Blockchain Logs"
add_title "src/app/(dashboard)/blockchain-expert/consensus/page.tsx" "Consensus Mechanism"
add_title "src/app/(dashboard)/blockchain-expert/fault-tolerance/page.tsx" "Fault Tolerance"
add_title "src/app/(dashboard)/blockchain-expert/security/page.tsx" "Security"
add_title "src/app/(dashboard)/blockchain-expert/system-health/page.tsx" "System Health"

# Shared Pages
add_title "src/app/(dashboard)/wallet/page.tsx" "Wallet"
add_title "src/app/(dashboard)/notifications/page.tsx" "Notifications"
add_title "src/app/page.tsx" "Home"

echo ""
echo "======================================"
echo "✨ Done! Run ./scripts/check-page-titles.sh to verify"
