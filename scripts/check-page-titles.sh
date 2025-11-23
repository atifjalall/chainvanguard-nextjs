#!/bin/bash

# Script to check which pages are missing the usePageTitle hook
# Usage: ./scripts/check-page-titles.sh

echo "📋 Checking page titles across the application..."
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
total=0
with_title=0
without_title=0

# Find all page.tsx files
while IFS= read -r file; do
  ((total++))

  # Get relative path
  rel_path="${file#./}"

  # Check if file uses usePageTitle
  if grep -q "usePageTitle" "$file"; then
    echo -e "${GREEN}✓${NC} $rel_path"
    ((with_title++))
  else
    # Check if it's a client component
    if grep -q '"use client"' "$file"; then
      echo -e "${RED}✗${NC} $rel_path ${YELLOW}(needs usePageTitle)${NC}"
      ((without_title++))
    else
      # Server component - can use metadata export
      if grep -q "export.*metadata" "$file"; then
        echo -e "${GREEN}✓${NC} $rel_path ${YELLOW}(uses metadata)${NC}"
        ((with_title++))
      else
        echo -e "${RED}✗${NC} $rel_path ${YELLOW}(needs metadata export)${NC}"
        ((without_title++))
      fi
    fi
  fi
done < <(find ./src/app -name "page.tsx" -type f | sort)

echo ""
echo "=================================================="
echo "Summary:"
echo "  Total pages: $total"
echo -e "  ${GREEN}With titles: $with_title${NC}"
echo -e "  ${RED}Without titles: $without_title${NC}"
echo ""

if [ $without_title -eq 0 ]; then
  echo -e "${GREEN}🎉 All pages have titles!${NC}"
else
  echo -e "${YELLOW}💡 Tip: Check PAGE_TITLES_REFERENCE.md for suggested titles${NC}"
fi
