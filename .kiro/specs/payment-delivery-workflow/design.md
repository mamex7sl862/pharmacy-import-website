# Design Document — Payment & Delivery Workflow

## Overview

This document describes the technical design for extending the RFQ lifecycle with a payment proof submission, admin verification, shipment tracking, delivery confirmation, and per-RFQ chat system.

The current `CLOSED` terminal state is replaced by a five-step post-acceptance flow:

```
QUOTATION_SENT → AWAITING_PAYMENT → PAYMENT_SUBMITTED → PAYMENT_CONFIRMED → SHIPPED → DELIVERED
```

---

## 1. Database Schema Changes

### 1.1 Alter `rfqs` table

```sql
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS tracking_info VARCHAR(500);
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS payment_rejection_note TEXT;
```

### 1.2 New table: `rfq_payment_proofs`

Stores the customer's uploaded payment proof file. One active record per RFQ (upsert on re-upload).

```sql
CREATE TABLE IF NOT EXISTS rfq_payment_proofs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  file_url    VARCHAR(500) NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  file_size   INTEGER NOT NULL,
  mime_type   VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rfq_payment_proofs_rfq ON rfq_payment_proofs(rfq_id);
```

### 1.3 New table: `rfq_chats`

One chat thread per RFQ (UNIQUE on `rfq_id`).

```sql
CREATE TABLE IF NOT EXISTS rfq_chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id),
  status      VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  last_msg_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rfq_id)
);
CREATE INDEX IF NOT EXISTS idx_rfq_chats_rfq ON rfq_chats(rfq_id);
```

### 1.4 New table: `rfq_chat_messages`

```sql
CREATE TABLE IF NOT EXISTS rfq_chat_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_chat_id   UUID NOT NULL REFERENCES rfq_chats(id) ON DELETE CASCADE,
  sender_id     UUID REFERENCES users(id),
  sender_name   VARCHAR(255) NOT NULL,
  message       TEXT NOT NULL DEFAULT '',
  is_from_admin BOOLEAN NOT NULL DEFAULT false,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  file_url      VARCHAR(500),
  file_name     VARCHAR(255),
  mime_type     VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rfq_chat_messages_chat ON rfq_chat_messages(rfq_chat_id);
```

### 1.5 Auto-migration

All four DDL statements above are added to the startup auto-migration block in `backend/src/index.js` using `IF NOT EXISTS` / `IF NOT EXISTS` guards so they are idempotent.

---

## 2. Backend API Design

### 2.1 File upload middleware

Reuse the existing `upload` middleware from `backend/src/services/upload.js`. For payment proofs and chat file attachments, use a new Cloudinary folder `pharmalink/payment-proofs` and `pharmalink/rfq-chat` respectively, configured via a separate multer instance with `resource_type: 'auto'` to support both images and PDFs.

```js
// backend/src/services/upload.js — add alongside existing upload
const paymentUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: { folder: 'pharmalink/payment-proofs', resource_type: 'auto', use_filename: false },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/jpg','application/pdf']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('INVALID_FILE_TYPE'))
  },
}).single('file')

const chatFileUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: { folder: 'pharmalink/rfq-chat', resource_type: 'auto', use_filename: false },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file')
```

### 2.2 Customer routes — `backend/src/routes/customer.js`

#### Modify: `POST /api/customer/rfqs/:id/accept`

Change the final status from `CLOSED` to `AWAITING_PAYMENT` and create the RFQ chat thread atomically.

```
BEFORE: UPDATE rfqs SET status = 'CLOSED'
AFTER:  UPDATE rfqs SET status = 'AWAITING_PAYMENT'
        INSERT INTO rfq_chats (rfq_id, customer_id) VALUES ($rfqId, $customerId)
          ON CONFLICT (rfq_id) DO NOTHING
```

#### New: `POST /api/customer/rfqs/:id/payment-proof`

Upload payment proof, upsert into `rfq_payment_proofs`, transition status to `PAYMENT_SUBMITTED`.

```
Auth: verifyToken (customer must own RFQ)
Middleware: paymentUpload (multer)
Allowed statuses: AWAITING_PAYMENT, PAYMENT_SUBMITTED (re-upload)
Body: multipart/form-data { file }
Response: { success: true, proof: { fileUrl, fileName, fileSize, mimeType } }
Side effects:
  - DELETE FROM rfq_payment_proofs WHERE rfq_id = $id (remove old proof)
  - INSERT INTO rfq_payment_proofs ...
  - UPDATE rfqs SET status = 'PAYMENT_SUBMITTED', payment_rejection_note = NULL
  - Trigger admin notification (insert into a notifications queue or use polling)
```

#### New: `POST /api/customer/rfqs/:id/confirm-delivery`

```
Auth: verifyToken (customer must own RFQ)
Allowed status: SHIPPED
Response: { success: true }
Side effects:
  - UPDATE rfqs SET status = 'DELIVERED'
  - UPDATE rfq_chats SET status = 'CLOSED' WHERE rfq_id = $id
```

#### New: `GET /api/customer/rfqs/:id/chat`

Fetch the RFQ chat thread + messages for the customer.

```
Auth: verifyToken (customer must own RFQ)
Response: {
  chat: { id, status, lastMsgAt },
  messages: [{ id, senderName, message, isFromAdmin, isRead, fileUrl, fileName, mimeType, createdAt }]
}
Side effects: Mark all is_from_admin=true messages as is_read=true
```

#### New: `POST /api/customer/rfqs/:id/chat/messages`

Send a text or file message.

```
Auth: verifyToken
Middleware: chatFileUpload (optional — only if file attached)
Body: multipart/form-data { message?: string, file?: File }
Allowed chat status: OPEN
Response: { success: true, message: { ...messageRow } }
Side effects: UPDATE rfq_chats SET last_msg_at = NOW()
```

### 2.3 Admin routes — `backend/src/routes/admin.js`

#### New: `POST /api/admin/rfqs/:id/confirm-payment`

```
Auth: requireAdmin
Allowed status: PAYMENT_SUBMITTED
Response: { success: true }
Side effects: UPDATE rfqs SET status = 'PAYMENT_CONFIRMED', payment_rejection_note = NULL
```

#### New: `POST /api/admin/rfqs/:id/reject-payment`

```
Auth: requireAdmin
Allowed status: PAYMENT_SUBMITTED
Body: { rejectionNote: string } (required)
Response: { success: true }
Side effects:
  - UPDATE rfqs SET status = 'AWAITING_PAYMENT', payment_rejection_note = $note
```

#### New: `POST /api/admin/rfqs/:id/mark-shipped`

```
Auth: requireAdmin
Allowed status: PAYMENT_CONFIRMED
Body: { trackingInfo?: string }
Response: { success: true }
Side effects:
  - UPDATE rfqs SET status = 'SHIPPED', tracking_info = $trackingInfo
  - Send email to customer (shipped notification with tracking info)
```

#### New: `GET /api/admin/rfqs/:id/chat`

Fetch RFQ chat thread + messages for admin.

```
Auth: requireAdmin
Response: same shape as customer chat endpoint
Side effects: Mark all is_from_admin=false messages as is_read=true
```

#### New: `POST /api/admin/rfqs/:id/chat/messages`

Admin sends text-only message.

```
Auth: requireAdmin
Body: { message: string }
Allowed chat status: OPEN
Response: { success: true, message: { ...messageRow } }
```

#### Modify: `GET /api/admin/rfqs/:id`

Add payment proof and chat unread count to the response:

```js
// Add to existing query result enrichment:
const [{ rows: paymentProofs }, { rows: chatUnread }] = await Promise.all([
  pool.query('SELECT * FROM rfq_payment_proofs WHERE rfq_id = $1 ORDER BY uploaded_at DESC LIMIT 1', [rfq.id]),
  pool.query(
    `SELECT COUNT(*)::int AS count FROM rfq_chat_messages m
     JOIN rfq_chats c ON c.id = m.rfq_chat_id
     WHERE c.rfq_id = $1 AND m.is_from_admin = false AND m.is_read = false`,
    [rfq.id]
  ),
])
rfq.paymentProof = paymentProofs[0] || null
rfq.chatUnreadCount = chatUnread[0]?.count || 0
```

#### Modify: `GET /api/admin/rfqs` (list)

Add `chatUnreadCount` to each row so the RFQ list can show unread badges:

```sql
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS unread
  FROM rfq_chat_messages m
  JOIN rfq_chats c ON c.id = m.rfq_chat_id
  WHERE c.rfq_id = r.id AND m.is_from_admin = false AND m.is_read = false
) chat_unread ON true
```

#### Modify: `PATCH /api/admin/rfqs/:id/status`

Extend `VALID_STATUSES` to include the new statuses for display purposes, but block manual transitions into post-acceptance states (those are handled by dedicated endpoints).

```js
const VALID_STATUSES = [
  'NEW', 'UNDER_REVIEW', 'QUOTATION_SENT', 'CLOSED', 'DECLINED',
  // Post-acceptance — display only, not settable via this endpoint
  'AWAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_CONFIRMED', 'SHIPPED', 'DELIVERED'
]
const POST_ACCEPTANCE = ['AWAITING_PAYMENT','PAYMENT_SUBMITTED','PAYMENT_CONFIRMED','SHIPPED','DELIVERED']
// If current status is post-acceptance, reject manual status change
```

### 2.4 Admin notification for payment submission

The existing `AdminNotificationListener` polls `/api/admin/rfqs?status=NEW`. Add a second poll for `PAYMENT_SUBMITTED` RFQs using the same pattern:

```js
// In AdminNotificationListener.jsx — add alongside rfqStats query:
const { data: paymentStats } = useQuery({
  queryKey: ['admin-payment-notifications'],
  queryFn: () => api.get('/admin/rfqs?status=PAYMENT_SUBMITTED&limit=1').then(r => ({
    count: r.data.totalCount || 0,
    latest: r.data.items?.[0] || null
  })),
  refetchInterval: 10000,
  enabled: !!user && user.role === 'admin'
})
```

When `paymentStats.count` increases, show a toast navigating to `/admin/rfqs/:id`.

---

## 3. Frontend Component Architecture

### 3.1 Customer portal — `CustomerRFQDetail.jsx`

This page is extended with conditional sections based on RFQ status:

```
POST-ACCEPTANCE STATUSES → show OrderProgressStepper at top

AWAITING_PAYMENT:
  - PaymentProofUpload component
  - Show rejection note if payment_rejection_note is set
  - RFQChat component (below)

PAYMENT_SUBMITTED:
  - Show uploaded proof filename + "Under review" message
  - Option to re-upload
  - RFQChat component

PAYMENT_CONFIRMED:
  - "Payment verified" banner
  - RFQChat component

SHIPPED:
  - Tracking info display (if provided)
  - ConfirmDeliveryButton
  - RFQChat component

DELIVERED:
  - "Order complete" banner
  - RFQChat component (read-only)
```

### 3.2 New component: `OrderProgressStepper`

```
Location: frontend/src/components/OrderProgressStepper.jsx

Props: { status: string }

Steps: [
  { key: 'AWAITING_PAYMENT',   label: 'Payment Pending',   icon: 'payments' },
  { key: 'PAYMENT_SUBMITTED',  label: 'Proof Submitted',   icon: 'upload_file' },
  { key: 'PAYMENT_CONFIRMED',  label: 'Payment Confirmed', icon: 'verified' },
  { key: 'SHIPPED',            label: 'Shipped',           icon: 'local_shipping' },
  { key: 'DELIVERED',          label: 'Delivered',         icon: 'check_circle' },
]

Visual: horizontal stepper with completed (green check), active (blue filled), pending (gray) states
```

### 3.3 New component: `PaymentProofUpload`

```
Location: frontend/src/components/PaymentProofUpload.jsx

Props: { rfqId, rejectionNote, existingProof, onUploaded }

Behaviour:
  - Drag-and-drop + click-to-browse file input
  - Accepts: image/jpeg, image/png, application/pdf, max 10MB
  - Shows rejection note in red banner if present
  - On submit: POST /api/customer/rfqs/:id/payment-proof (multipart)
  - On success: calls onUploaded() to refetch RFQ data
```

### 3.4 New component: `RFQChat`

```
Location: frontend/src/components/RFQChat.jsx

Props: { rfqId, isAdmin, isReadOnly }

Behaviour:
  - Fetches messages via GET /api/[customer|admin]/rfqs/:id/chat
  - Polls every 5s (React Query refetchInterval)
  - Message bubbles: customer (right, blue), admin (left, gray)
  - File messages: show thumbnail for images, PDF icon for PDFs, with download link
  - Input: text field + file attach button (customer only)
  - File attach: opens file picker, uploads via POST .../chat/messages (multipart)
  - isReadOnly=true: hides input, shows "Chat closed" banner
  - Auto-scrolls to bottom on new messages
```

### 3.5 Admin portal — `RFQDetails.jsx`

Extended with:

```
POST-ACCEPTANCE STATUS BADGE: colored badge replacing the status dropdown for post-acceptance states

PAYMENT_SUBMITTED:
  - Payment proof preview (image inline / PDF link via proxy)
  - "Confirm Payment" button → POST /api/admin/rfqs/:id/confirm-payment
  - "Reject Payment" button → opens modal with required rejection note input
    → POST /api/admin/rfqs/:id/reject-payment

PAYMENT_CONFIRMED:
  - "Mark as Shipped" button → opens modal with optional tracking info input
    → POST /api/admin/rfqs/:id/mark-shipped

SHIPPED / DELIVERED:
  - Read-only status display

RFQChat component (isAdmin=true) shown for all post-acceptance statuses
```

### 3.6 Admin RFQ list — `RFQList.jsx`

Add unread chat badge to each row when `chatUnreadCount > 0`:

```jsx
{rfq.chatUnreadCount > 0 && (
  <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
    {rfq.chatUnreadCount}
  </span>
)}
```

### 3.7 `AdminNotificationListener.jsx`

Add a third polling query for `PAYMENT_SUBMITTED` RFQs (alongside existing NEW RFQ and chat polls). Toast navigates to the specific RFQ detail page.

---

## 4. Email Notifications

Add two new functions to `backend/src/services/email.js`:

### `sendAwaitingPaymentEmail(email, customerName, rfqNumber, bankDetails)`

Triggered when status → `AWAITING_PAYMENT`. Sends bank transfer instructions.

### `sendPaymentConfirmedEmail(email, customerName, rfqNumber)`

Triggered when status → `PAYMENT_CONFIRMED`.

### `sendShippedEmail(email, customerName, rfqNumber, trackingInfo)`

Triggered when status → `SHIPPED`. Includes tracking info if provided.

All three follow the existing pattern: try/catch, log error, never throw (non-blocking).

---

## 5. Status Transition Guard

All status-changing endpoints validate the current status before proceeding:

```js
const POST_ACCEPTANCE_TRANSITIONS = {
  'QUOTATION_SENT':    'AWAITING_PAYMENT',   // accept endpoint
  'AWAITING_PAYMENT':  'PAYMENT_SUBMITTED',  // payment-proof upload
  'PAYMENT_SUBMITTED': 'PAYMENT_CONFIRMED',  // confirm-payment (admin)
  'PAYMENT_SUBMITTED': 'AWAITING_PAYMENT',   // reject-payment (admin)
  'PAYMENT_CONFIRMED': 'SHIPPED',            // mark-shipped (admin)
  'SHIPPED':           'DELIVERED',          // confirm-delivery (customer)
}
```

If current status doesn't match the expected source status, return `400 { error: 'INVALID_STATUS_TRANSITION' }`.

If status is `DELIVERED`, return `400 { error: 'RFQ_LOCKED' }` for any mutation attempt.

---

## 6. File Structure Summary

### New files
```
backend/src/routes/rfq-chat.js          — RFQ chat routes (mounted at /api/rfq-chat)
frontend/src/components/OrderProgressStepper.jsx
frontend/src/components/PaymentProofUpload.jsx
frontend/src/components/RFQChat.jsx
```

### Modified files
```
backend/src/index.js                    — auto-migrations for new tables
backend/src/routes/customer.js          — accept (status change), payment-proof, confirm-delivery, chat endpoints
backend/src/routes/admin.js             — confirm/reject payment, mark-shipped, chat endpoints, enrich rfq detail
backend/src/services/upload.js          — paymentUpload + chatFileUpload multer instances
backend/src/services/email.js           — 3 new email functions
frontend/src/pages/CustomerRFQDetail.jsx — stepper, payment upload, chat, delivery confirm
frontend/src/pages/RFQDetails.jsx       — payment proof view, action buttons, chat
frontend/src/pages/RFQList.jsx          — unread chat badge
frontend/src/components/AdminNotificationListener.jsx — payment submission poll
```
