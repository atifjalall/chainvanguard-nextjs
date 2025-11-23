#!/bin/bash

# Helper script to add usePageTitle to a page
# Usage: ./scripts/add-page-title.sh <file-path> <title>
# Example: ./scripts/add-page-title.sh src/app/(dashboard)/customer/orders/page.tsx "My Orders"

if [ $# -ne 2 ]; then
  echo "Usage: $0 <file-path> <title>"
  echo "Example: $0 src/app/(dashboard)/customer/orders/page.tsx \"My Orders\""
  exit 1
fi

FILE=$1
TITLE=$2

# Check if file exists
if [ ! -f "$FILE" ]; then
  echo "Error: File $FILE does not exist"
  exit 1
fi

# Check if file is a client component
if ! grep -q '"use client"' "$FILE"; then
  echo "Warning: $FILE is not a client component (missing 'use client')"
  echo "You should use metadata export instead for server components"
  exit 1
fi

# Check if usePageTitle already exists
if grep -q "usePageTitle" "$FILE"; then
  echo "Info: $FILE already uses usePageTitle"
  exit 0
fi

# Add import if not present
if ! grep -q "import.*usePageTitle" "$FILE"; then
  # Find the last import line
  last_import=$(grep -n "^import" "$FILE" | tail -1 | cut -d: -f1)

  if [ -n "$last_import" ]; then
    # Add import after last import
    sed -i "" "${last_import}a\\
import { usePageTitle } from \"@/hooks/use-page-title\";
" "$FILE"
    echo "✓ Added usePageTitle import"
  else
    echo "Error: Could not find import section in $FILE"
    exit 1
  fi
fi

# Find the default export function and add usePageTitle
# Look for patterns like "export default function ComponentName()"
function_line=$(grep -n "^export default function" "$FILE" | head -1 | cut -d: -f1)

if [ -n "$function_line" ]; then
  # Get the next line after function declaration (where hooks should go)
  insert_line=$((function_line + 1))

  # Read the line to check indentation
  next_line=$(sed -n "${insert_line}p" "$FILE")

  # Add the usePageTitle call with proper indentation
  sed -i "" "${insert_line}i\\
  usePageTitle(\"$TITLE\");
" "$FILE"

  echo "✓ Added usePageTitle(\"$TITLE\") to $FILE"
else
  echo "Error: Could not find default export function in $FILE"
  exit 1
fi

echo "Done! ✨"
