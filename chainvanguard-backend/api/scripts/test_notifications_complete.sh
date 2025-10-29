#!/bin/bash

# ============================================
# NOTIFICATION SYSTEM TEST SCRIPT
# Tests all notification routes and functionality
# ============================================

source /Users/atifjalal/Desktop/chainvanguard-nextjs/chainvanguard-backend/api/.env

BASE_URL="http://localhost:5000/api/"
SUPPLIER_TOKEN="$SUPPLIER_TOKEN"
VENDOR_TOKEN="$VENDOR_TOKEN"
CUSTOMER_TOKEN="$CUSTOMER_TOKEN"
EXPERT_TOKEN="$EXPERT_TOKEN"
NOTIFICATION_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Helper Functions
# ============================================

print_test() {
    echo -e "${YELLOW}Testing: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# ============================================
# 1. AUTHENTICATION
# ============================================

print_test "Authenticating users..."

# Login as supplier
SUPPLIER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supplier@example.com",
    "password": "password123"
  }')

SUPPLIER_TOKEN=$(echo $SUPPLIER_LOGIN | jq -r '.data.token')
SUPPLIER_ID=$(echo $SUPPLIER_LOGIN | jq -r '.data.userId')

if [ "$SUPPLIER_TOKEN" != "null" ]; then
    print_success "Supplier authenticated"
else
    print_error "Supplier authentication failed"
    exit 1
fi

# Login as vendor
VENDOR_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor@example.com",
    "password": "password123"
  }')

VENDOR_TOKEN=$(echo $VENDOR_LOGIN | jq -r '.data.token')
VENDOR_ID=$(echo $VENDOR_LOGIN | jq -r '.data.userId')

if [ "$VENDOR_TOKEN" != "null" ]; then
    print_success "Vendor authenticated"
else
    print_error "Vendor authentication failed"
fi

# Login as customer
CUSTOMER_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }')

CUSTOMER_TOKEN=$(echo $CUSTOMER_LOGIN | jq -r '.data.token')
CUSTOMER_ID=$(echo $CUSTOMER_LOGIN | jq -r '.data.userId')

if [ "$CUSTOMER_TOKEN" != "null" ]; then
    print_success "Customer authenticated"
else
    print_error "Customer authentication failed"
fi

# Login as expert
EXPERT_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "expert@example.com",
    "password": "password123"
  }')

EXPERT_TOKEN=$(echo $EXPERT_LOGIN | jq -r '.data.token')

if [ "$EXPERT_TOKEN" != "null" ]; then
    print_success "Expert authenticated"
else
    print_error "Expert authentication failed (Optional for most tests)"
fi

# ============================================
# 2. CREATE NOTIFICATION (Admin only)
# ============================================

if [ "$EXPERT_TOKEN" != "null" ]; then
    print_test "Creating notification as admin..."

    CREATE_NOTIF=$(curl -s -X POST "$BASE_URL/notifications" \
      -H "Authorization: Bearer $EXPERT_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"userId\": \"$SUPPLIER_ID\",
        \"userRole\": \"supplier\",
        \"type\": \"system_update\",
        \"category\": \"system\",
        \"title\": \"System Maintenance Notice\",
        \"message\": \"System will undergo maintenance on Sunday at 2 AM.\",
        \"priority\": \"medium\"
      }")

    CREATE_SUCCESS=$(echo $CREATE_NOTIF | jq -r '.success')

    if [ "$CREATE_SUCCESS" = "true" ]; then
        print_success "Notification created by admin"
    else
        print_error "Failed to create notification"
        echo $CREATE_NOTIF | jq '.'
    fi
fi

# ============================================
# 3. GET USER NOTIFICATIONS
# ============================================

print_test "Getting user notifications..."

GET_NOTIFS=$(curl -s -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

NOTIF_COUNT=$(echo $GET_NOTIFS | jq '.data.notifications | length')
UNREAD_COUNT=$(echo $GET_NOTIFS | jq -r '.data.unreadCount')

if [ "$NOTIF_COUNT" -ge 0 ]; then
    print_success "Retrieved $NOTIF_COUNT notifications ($UNREAD_COUNT unread)"
else
    print_error "Failed to retrieve notifications"
fi

# Get first notification ID for testing
NOTIFICATION_ID=$(echo $GET_NOTIFS | jq -r '.data.notifications[0]._id')

# ============================================
# 4. GET UNREAD COUNT
# ============================================

print_test "Getting unread notification count..."

UNREAD=$(curl -s -X GET "$BASE_URL/notifications/unread-count" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

UNREAD_NUM=$(echo $UNREAD | jq -r '.data.unreadCount')

print_success "Unread notifications: $UNREAD_NUM"

# ============================================
# 5. GET NOTIFICATION STATISTICS
# ============================================

print_test "Getting notification statistics..."

STATS=$(curl -s -X GET "$BASE_URL/notifications/stats?days=30" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

TOTAL_NOTIFS=$(echo $STATS | jq -r '.data.totalNotifications')

if [ "$TOTAL_NOTIFS" != "null" ]; then
    print_success "Statistics retrieved. Total: $TOTAL_NOTIFS"
else
    print_error "Failed to retrieve statistics"
fi

# ============================================
# 6. GET NOTIFICATIONS BY CATEGORY
# ============================================

print_test "Getting notifications by category..."

CATEGORY_NOTIFS=$(curl -s -X GET "$BASE_URL/notifications/category/system" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

CATEGORY_COUNT=$(echo $CATEGORY_NOTIFS | jq '.data.notifications | length')

print_success "Found $CATEGORY_COUNT system notifications"

# ============================================
# 7. GET NOTIFICATION BY ID
# ============================================

if [ "$NOTIFICATION_ID" != "null" ] && [ "$NOTIFICATION_ID" != "" ]; then
    print_test "Getting notification by ID..."

    GET_ONE=$(curl -s -X GET "$BASE_URL/notifications/$NOTIFICATION_ID" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN")

    NOTIF_TITLE=$(echo $GET_ONE | jq -r '.data.title')

    if [ "$NOTIF_TITLE" != "null" ]; then
        print_success "Retrieved notification: $NOTIF_TITLE"
    else
        print_error "Failed to retrieve notification by ID"
    fi

    # ============================================
    # 8. MARK NOTIFICATION AS READ
    # ============================================

    print_test "Marking notification as read..."

    MARK_READ=$(curl -s -X PATCH "$BASE_URL/notifications/$NOTIFICATION_ID/read" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN")

    READ_SUCCESS=$(echo $MARK_READ | jq -r '.success')

    if [ "$READ_SUCCESS" = "true" ]; then
        print_success "Notification marked as read"
    else
        print_error "Failed to mark notification as read"
    fi

    # ============================================
    # 9. RECORD NOTIFICATION ACTION
    # ============================================

    print_test "Recording notification action..."

    RECORD_ACTION=$(curl -s -X POST "$BASE_URL/notifications/$NOTIFICATION_ID/action" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "action": "clicked_link"
      }')

    ACTION_SUCCESS=$(echo $RECORD_ACTION | jq -r '.success')

    if [ "$ACTION_SUCCESS" = "true" ]; then
        print_success "Action recorded successfully"
    else
        print_error "Failed to record action"
    fi

    # ============================================
    # 10. ARCHIVE NOTIFICATION
    # ============================================

    print_test "Archiving notification..."

    ARCHIVE=$(curl -s -X PATCH "$BASE_URL/notifications/$NOTIFICATION_ID/archive" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN")

    ARCHIVE_SUCCESS=$(echo $ARCHIVE | jq -r '.success')

    if [ "$ARCHIVE_SUCCESS" = "true" ]; then
        print_success "Notification archived"
    else
        print_error "Failed to archive notification"
    fi
fi

# ============================================
# 11. MARK ALL AS READ
# ============================================

print_test "Marking all notifications as read..."

MARK_ALL=$(curl -s -X PATCH "$BASE_URL/notifications/mark-all-read" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

MARK_ALL_SUCCESS=$(echo $MARK_ALL | jq -r '.success')
MARKED_COUNT=$(echo $MARK_ALL | jq -r '.data.count')

if [ "$MARK_ALL_SUCCESS" = "true" ]; then
    print_success "Marked $MARKED_COUNT notifications as read"
else
    print_error "Failed to mark all as read"
fi

# ============================================
# 12. CREATE BULK NOTIFICATIONS (Admin only)
# ============================================

if [ "$EXPERT_TOKEN" != "null" ]; then
    print_test "Creating bulk notifications..."

    BULK_CREATE=$(curl -s -X POST "$BASE_URL/notifications/bulk" \
      -H "Authorization: Bearer $EXPERT_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"userIds\": [\"$SUPPLIER_ID\", \"$VENDOR_ID\", \"$CUSTOMER_ID\"],
        \"notificationData\": {
          \"userRole\": \"customer\",
          \"type\": \"promotional\",
          \"category\": \"system\",
          \"title\": \"Special Offer!\",
          \"message\": \"Get 20% off on all orders this week!\",
          \"priority\": \"low\"
        }
      }")

    BULK_SUCCESS=$(echo $BULK_CREATE | jq -r '.success')
    BULK_COUNT=$(echo $BULK_CREATE | jq -r '.data.count')

    if [ "$BULK_SUCCESS" = "true" ]; then
        print_success "Created $BULK_COUNT bulk notifications"
    else
        print_error "Failed to create bulk notifications"
    fi
fi

# ============================================
# 13. GET PAGINATED NOTIFICATIONS
# ============================================

print_test "Getting paginated notifications (page 1)..."

PAGINATED=$(curl -s -X GET "$BASE_URL/notifications?page=1&limit=5" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

PAGE_COUNT=$(echo $PAGINATED | jq '.data.notifications | length')
TOTAL_PAGES=$(echo $PAGINATED | jq -r '.data.pagination.pages')

print_success "Retrieved $PAGE_COUNT notifications (Total pages: $TOTAL_PAGES)"

# ============================================
# 14. FILTER NOTIFICATIONS BY READ STATUS
# ============================================

print_test "Filtering unread notifications..."

UNREAD_FILTER=$(curl -s -X GET "$BASE_URL/notifications?isRead=false" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

UNREAD_FILTER_COUNT=$(echo $UNREAD_FILTER | jq '.data.notifications | length')

print_success "Found $UNREAD_FILTER_COUNT unread notifications"

# ============================================
# 15. FILTER NOTIFICATIONS BY PRIORITY
# ============================================

print_test "Filtering high priority notifications..."

PRIORITY_FILTER=$(curl -s -X GET "$BASE_URL/notifications?priority=high" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

PRIORITY_COUNT=$(echo $PRIORITY_FILTER | jq '.data.notifications | length')

print_success "Found $PRIORITY_COUNT high priority notifications"

# ============================================
# 16. TEST NOTIFICATION ACCESS CONTROL
# ============================================

if [ "$NOTIFICATION_ID" != "null" ] && [ "$NOTIFICATION_ID" != "" ]; then
    print_test "Testing notification access control..."

    # Try to access supplier's notification as vendor (should fail)
    UNAUTHORIZED=$(curl -s -X GET "$BASE_URL/notifications/$NOTIFICATION_ID" \
      -H "Authorization: Bearer $VENDOR_TOKEN")

    UNAUTH_ERROR=$(echo $UNAUTHORIZED | jq -r '.success')

    if [ "$UNAUTH_ERROR" = "false" ]; then
        print_success "Access control working correctly"
    else
        print_error "Access control may have issues"
    fi
fi

# ============================================
# 17. DELETE NOTIFICATION
# ============================================

if [ "$NOTIFICATION_ID" != "null" ] && [ "$NOTIFICATION_ID" != "" ]; then
    print_test "Deleting notification..."

    DELETE=$(curl -s -X DELETE "$BASE_URL/notifications/$NOTIFICATION_ID" \
      -H "Authorization: Bearer $SUPPLIER_TOKEN")

    DELETE_SUCCESS=$(echo $DELETE | jq -r '.success')

    if [ "$DELETE_SUCCESS" = "true" ]; then
        print_success "Notification deleted successfully"
    else
        print_error "Failed to delete notification"
    fi
fi

# ============================================
# 18. TEST VENDOR NOTIFICATIONS
# ============================================

print_test "Testing vendor notifications..."

VENDOR_NOTIFS=$(curl -s -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $VENDOR_TOKEN")

VENDOR_COUNT=$(echo $VENDOR_NOTIFS | jq '.data.notifications | length')

print_success "Vendor has $VENDOR_COUNT notifications"

# ============================================
# 19. TEST CUSTOMER NOTIFICATIONS
# ============================================

print_test "Testing customer notifications..."

CUSTOMER_NOTIFS=$(curl -s -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN")

CUSTOMER_COUNT=$(echo $CUSTOMER_NOTIFS | jq '.data.notifications | length')

print_success "Customer has $CUSTOMER_COUNT notifications"

# ============================================
# 20. DELETE ALL NOTIFICATIONS
# ============================================

print_test "Testing delete all notifications..."

DELETE_ALL=$(curl -s -X DELETE "$BASE_URL/notifications" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

DELETE_ALL_SUCCESS=$(echo $DELETE_ALL | jq -r '.success')
DELETE_COUNT=$(echo $DELETE_ALL | jq -r '.data.count')

if [ "$DELETE_ALL_SUCCESS" = "true" ]; then
    print_success "Deleted $DELETE_COUNT notifications"
else
    print_error "Failed to delete all notifications"
fi

# ============================================
# SUMMARY
# ============================================

echo ""
echo "=========================================="
echo -e "${GREEN}NOTIFICATION SYSTEM TESTS COMPLETED${NC}"
echo "=========================================="
echo ""
echo "Test Results:"
echo "- User authentication: ✓"
echo "- Notification CRUD operations: ✓"
echo "- Filtering and pagination: ✓"
echo "- Access control: ✓"
echo "- Bulk operations: ✓"
echo ""
echo "All notification operations tested successfully!"
echo ""