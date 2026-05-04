# Requirements Document

## Introduction

This feature extends the existing pharmaceutical wholesale RFQ system by adding a post-acceptance workflow that covers payment proof submission, payment verification, order shipment, and delivery confirmation. It also introduces an RFQ-specific chat thread that opens once a customer accepts a quotation, giving both the customer and admin a dedicated, contextual communication channel for that order.

The current flow ends at `CLOSED` when a customer accepts a quotation. The new flow replaces `CLOSED` as the terminal state with a multi-step lifecycle: `AWAITING_PAYMENT → PAYMENT_SUBMITTED → PAYMENT_CONFIRMED → SHIPPED → DELIVERED`.

---

## Glossary

- **RFQ**: Request for Quotation — the core entity representing a customer's product inquiry.
- **RFQ_System**: The backend Node.js/Express application managing RFQ lifecycle and data.
- **Customer_Portal**: The React frontend interface used by authenticated customers.
- **Admin_Panel**: The React frontend interface used by administrators.
- **Payment_Proof**: A file (image or PDF) uploaded by the customer as evidence of a bank transfer or other payment.
- **RFQ_Chat**: A dedicated, per-RFQ chat thread between the customer and admin, distinct from the general live chat.
- **Chat_System**: The existing general live chat backend (chats + chat_messages tables).
- **Cloudinary**: The cloud storage service already configured for file uploads.
- **Tracking_Info**: An optional string (e.g., courier name and tracking number) provided by the admin when marking an order as shipped.
- **AWAITING_PAYMENT**: RFQ status indicating the customer has accepted the quotation and payment is expected.
- **PAYMENT_SUBMITTED**: RFQ status indicating the customer has uploaded payment proof.
- **PAYMENT_CONFIRMED**: RFQ status indicating the admin has verified the payment.
- **SHIPPED**: RFQ status indicating the admin has dispatched the order.
- **DELIVERED**: RFQ status indicating the customer has confirmed receipt — the final closed state.

---

## Requirements

### Requirement 1: Status Transition — Accept Quotation to Awaiting Payment

**User Story:** As a customer, I want accepting a quotation to move my order into a payment-pending state, so that I know I need to submit payment proof before the order proceeds.

#### Acceptance Criteria

1. WHEN a customer accepts a quotation, THE RFQ_System SHALL transition the RFQ status from `QUOTATION_SENT` to `AWAITING_PAYMENT` instead of `CLOSED`.
2. WHEN the RFQ status transitions to `AWAITING_PAYMENT`, THE RFQ_System SHALL preserve all existing stock deduction logic that currently runs on acceptance.
3. WHEN the RFQ status is `AWAITING_PAYMENT`, THE Customer_Portal SHALL display a clear prompt instructing the customer to upload payment proof.
4. WHEN the RFQ status is `AWAITING_PAYMENT`, THE Admin_Panel SHALL display the updated status badge so the admin is aware payment is pending.

---

### Requirement 2: Payment Proof Upload

**User Story:** As a customer, I want to upload a bank transfer receipt or payment screenshot, so that the admin can verify my payment and proceed with my order.

#### Acceptance Criteria

1. WHEN the RFQ status is `AWAITING_PAYMENT`, THE Customer_Portal SHALL present a file upload control that accepts JPEG, PNG, and PDF files up to 10 MB.
2. WHEN a customer submits a valid payment proof file, THE RFQ_System SHALL upload the file to Cloudinary and store the resulting URL, file name, file size, and MIME type in a `rfq_payment_proofs` table linked to the RFQ.
3. WHEN a payment proof is successfully saved, THE RFQ_System SHALL transition the RFQ status to `PAYMENT_SUBMITTED`.
4. IF a customer submits a file exceeding 10 MB, THEN THE RFQ_System SHALL return an error code `FILE_TOO_LARGE` and SHALL NOT change the RFQ status.
5. IF a customer submits a file with an unsupported MIME type, THEN THE RFQ_System SHALL return an error code `INVALID_FILE_TYPE` and SHALL NOT change the RFQ status.
6. WHEN the RFQ status is `PAYMENT_SUBMITTED`, THE Customer_Portal SHALL display the uploaded proof file name and a confirmation message indicating the proof is under review.
7. WHILE the RFQ status is `PAYMENT_SUBMITTED`, THE Customer_Portal SHALL allow the customer to replace the payment proof by uploading a new file, which SHALL overwrite the previous proof record and keep the status as `PAYMENT_SUBMITTED`.

---

### Requirement 3: Admin Payment Verification

**User Story:** As an admin, I want to review the customer's payment proof and confirm or reject it, so that I can proceed with order fulfillment or request a corrected proof.

#### Acceptance Criteria

1. WHEN the RFQ status is `PAYMENT_SUBMITTED`, THE Admin_Panel SHALL display a link or inline preview of the uploaded payment proof file directly on the RFQ detail page.
2. WHEN an admin confirms a payment, THE RFQ_System SHALL transition the RFQ status to `PAYMENT_CONFIRMED`.
3. WHEN an admin rejects a payment proof, THE RFQ_System SHALL transition the RFQ status back to `AWAITING_PAYMENT` and SHALL store a rejection note (required on rejection) in the `payment_rejection_note` column on the RFQ record.
4. WHEN the RFQ status is `AWAITING_PAYMENT` and a `payment_rejection_note` is present, THE Customer_Portal SHALL display the rejection note prominently alongside the file upload control so the customer can submit a corrected proof.
5. WHEN the RFQ status is `AWAITING_PAYMENT` following a rejection, THE Customer_Portal SHALL allow the customer to upload a new payment proof file, which SHALL replace the previous proof record and transition the status back to `PAYMENT_SUBMITTED`.
6. IF an admin attempts to confirm or reject a payment on an RFQ whose status is not `PAYMENT_SUBMITTED`, THEN THE RFQ_System SHALL return an error code `INVALID_STATUS_TRANSITION`.

---

### Requirement 4: Admin Marks Order as Shipped

**User Story:** As an admin, I want to mark an order as shipped and optionally provide tracking information, so that the customer knows their order is on the way.

#### Acceptance Criteria

1. WHEN the RFQ status is `PAYMENT_CONFIRMED`, THE Admin_Panel SHALL display a "Mark as Shipped" action.
2. WHEN an admin marks an order as shipped, THE RFQ_System SHALL accept an optional `tracking_info` string (maximum 500 characters) and SHALL transition the RFQ status to `SHIPPED`.
3. WHEN the RFQ status transitions to `SHIPPED`, THE RFQ_System SHALL persist the `tracking_info` value (or null if not provided) on the RFQ record.
4. WHEN the RFQ status is `SHIPPED`, THE Customer_Portal SHALL display the tracking information if it was provided.
5. IF an admin attempts to mark an order as shipped when the RFQ status is not `PAYMENT_CONFIRMED`, THEN THE RFQ_System SHALL return an error code `INVALID_STATUS_TRANSITION`.

---

### Requirement 5: Customer Confirms Delivery

**User Story:** As a customer, I want to confirm that I have received my order, so that the transaction is formally closed.

#### Acceptance Criteria

1. WHEN the RFQ status is `SHIPPED`, THE Customer_Portal SHALL display a "Confirm Delivery" action.
2. WHEN a customer confirms delivery, THE RFQ_System SHALL transition the RFQ status to `DELIVERED`.
3. WHEN the RFQ status is `DELIVERED`, THE Customer_Portal SHALL display a final confirmation message and SHALL NOT show any further action buttons.
4. WHEN the RFQ status is `DELIVERED`, THE Admin_Panel SHALL display the status as the terminal closed state with no further admin actions available.
5. WHEN the RFQ status is `DELIVERED`, THE RFQ_System SHALL reject any status transition request for that RFQ with error code `RFQ_LOCKED`.
6. IF a customer attempts to confirm delivery when the RFQ status is not `SHIPPED`, THEN THE RFQ_System SHALL return an error code `INVALID_STATUS_TRANSITION`.

---

### Requirement 6: RFQ-Specific Chat Thread

**User Story:** As a customer or admin, I want a dedicated chat thread for each accepted RFQ, so that all payment, shipping, and delivery communication is organized per order and not mixed with general support chat.

#### Acceptance Criteria

1. WHEN the RFQ status transitions to `AWAITING_PAYMENT`, THE RFQ_System SHALL create a new RFQ chat thread linked to that RFQ's ID and the customer's user ID.
2. THE RFQ_System SHALL store RFQ chat threads in a dedicated `rfq_chats` table with columns for `id`, `rfq_id`, `customer_id`, `status`, `last_msg_at`, and `created_at`.
3. THE RFQ_System SHALL store RFQ chat messages in a dedicated `rfq_chat_messages` table with columns for `id`, `rfq_chat_id`, `sender_id`, `sender_name`, `message`, `is_from_admin`, `is_read`, `file_url`, `file_name`, `mime_type`, and `created_at`.
4. WHEN a customer views an RFQ in `AWAITING_PAYMENT`, `PAYMENT_SUBMITTED`, `PAYMENT_CONFIRMED`, `SHIPPED`, or `DELIVERED` status, THE Customer_Portal SHALL display the RFQ chat thread inline on the RFQ detail page.
5. WHEN a customer sends a text message in the RFQ chat, THE RFQ_System SHALL save the message to `rfq_chat_messages` and SHALL update `last_msg_at` on the `rfq_chats` record.
6. WHEN a customer attaches a file (JPEG, PNG, PDF, or other document up to 10 MB) to an RFQ chat message, THE RFQ_System SHALL upload the file to Cloudinary, save the resulting `file_url`, `file_name`, and `mime_type` on the `rfq_chat_messages` record, and SHALL update `last_msg_at` on the `rfq_chats` record.
7. WHEN an admin views an RFQ in any post-acceptance status, THE Admin_Panel SHALL display the RFQ chat thread inline on the RFQ detail page.
8. WHEN an admin sends a message in the RFQ chat, THE RFQ_System SHALL save the message with `is_from_admin = true` and SHALL accept text content only — file attachments SHALL NOT be available for admin messages.
9. WHEN the RFQ chat contains unread messages from the customer, THE Admin_Panel SHALL display an unread message count badge on the RFQ list and RFQ detail views.
10. WHEN an admin opens the RFQ chat, THE RFQ_System SHALL mark all customer messages in that thread as read.
11. WHEN the RFQ chat contains unread messages from the admin, THE Customer_Portal SHALL display an unread message count badge on the RFQ detail view.
12. WHEN a customer opens the RFQ chat, THE RFQ_System SHALL mark all admin messages in that thread as read.
13. WHEN the RFQ status is `DELIVERED`, THE RFQ_System SHALL reject any new message or file submission for that chat thread with error code `CHAT_LOCKED`, and THE Customer_Portal and Admin_Panel SHALL display the chat as read-only with the message input permanently disabled.

---

### Requirement 7: Status Visibility and Stepper UI

**User Story:** As a customer, I want to see a visual progress indicator showing where my order is in the post-acceptance workflow, so that I always know the current state at a glance.

#### Acceptance Criteria

1. WHEN the RFQ status is one of `AWAITING_PAYMENT`, `PAYMENT_SUBMITTED`, `PAYMENT_CONFIRMED`, `SHIPPED`, or `DELIVERED`, THE Customer_Portal SHALL render a step-by-step progress indicator showing all five stages in order.
2. THE Customer_Portal SHALL visually distinguish completed steps, the current active step, and upcoming steps.
3. WHEN the RFQ status is `AWAITING_PAYMENT`, THE Customer_Portal SHALL highlight the "Awaiting Payment" step as active.
4. WHEN the RFQ status is `PAYMENT_SUBMITTED`, THE Customer_Portal SHALL highlight the "Payment Submitted" step as active.
5. WHEN the RFQ status is `PAYMENT_CONFIRMED`, THE Customer_Portal SHALL highlight the "Payment Confirmed" step as active.
6. WHEN the RFQ status is `SHIPPED`, THE Customer_Portal SHALL highlight the "Shipped" step as active.
7. WHEN the RFQ status is `DELIVERED`, THE Customer_Portal SHALL highlight the "Delivered" step as active and SHALL mark all prior steps as completed.

---

### Requirement 8: Admin Status Management for Post-Acceptance States

**User Story:** As an admin, I want the RFQ detail page to expose the correct actions for each post-acceptance status, so that I can drive the workflow forward without manually editing status values.

#### Acceptance Criteria

1. WHEN the RFQ status is `AWAITING_PAYMENT` or `PAYMENT_SUBMITTED`, THE Admin_Panel SHALL display the current status badge and SHALL NOT allow the admin to manually select an arbitrary status from a dropdown for post-acceptance states.
2. WHEN the RFQ status is `PAYMENT_SUBMITTED`, THE Admin_Panel SHALL display "Confirm Payment" and "Reject Payment" action buttons.
3. WHEN the RFQ status is `PAYMENT_CONFIRMED`, THE Admin_Panel SHALL display a "Mark as Shipped" action with an optional tracking info input field.
4. WHEN the RFQ status is `SHIPPED` or `DELIVERED`, THE Admin_Panel SHALL display the status as read-only with no further admin actions available.
5. THE Admin_Panel status dropdown SHALL include the new statuses `AWAITING_PAYMENT`, `PAYMENT_SUBMITTED`, `PAYMENT_CONFIRMED`, `SHIPPED`, and `DELIVERED` as display-only labels when the RFQ is in those states.

---

### Requirement 9: Database Schema Migration

**User Story:** As a developer, I want the database schema to be extended with the new columns and tables required by this feature, so that all new data can be persisted correctly.

#### Acceptance Criteria

1. THE RFQ_System SHALL add a `tracking_info` column (VARCHAR 500, nullable) to the `rfqs` table.
2. THE RFQ_System SHALL add a `payment_rejection_note` column (TEXT, nullable) to the `rfqs` table.
3. THE RFQ_System SHALL create a `rfq_payment_proofs` table with columns: `id` (UUID PK), `rfq_id` (UUID FK → rfqs, CASCADE DELETE), `file_url` (VARCHAR 500 NOT NULL), `file_name` (VARCHAR 255 NOT NULL), `file_size` (INTEGER NOT NULL), `mime_type` (VARCHAR 100 NOT NULL), `uploaded_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW()).
4. THE RFQ_System SHALL create a `rfq_chats` table with columns: `id` (UUID PK), `rfq_id` (UUID FK → rfqs, CASCADE DELETE, UNIQUE), `customer_id` (UUID FK → users), `status` (VARCHAR 20 NOT NULL DEFAULT 'OPEN'), `last_msg_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW()), `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW()).
5. THE RFQ_System SHALL create a `rfq_chat_messages` table with columns: `id` (UUID PK), `rfq_chat_id` (UUID FK → rfq_chats, CASCADE DELETE), `sender_id` (UUID FK → users, nullable), `sender_name` (VARCHAR 255 NOT NULL), `message` (TEXT NOT NULL), `is_from_admin` (BOOLEAN NOT NULL DEFAULT false), `is_read` (BOOLEAN NOT NULL DEFAULT false), `file_url` (VARCHAR 500), `file_name` (VARCHAR 255), `mime_type` (VARCHAR 100), `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW()).
6. THE RFQ_System SHALL add appropriate indexes on `rfq_payment_proofs(rfq_id)`, `rfq_chats(rfq_id)`, and `rfq_chat_messages(rfq_chat_id)`.
7. THE RFQ_System SHALL extend the valid status values accepted by the status validation logic to include `AWAITING_PAYMENT`, `PAYMENT_SUBMITTED`, `PAYMENT_CONFIRMED`, `SHIPPED`, and `DELIVERED`.

---

### Requirement 10: Notifications for Workflow Events

**User Story:** As a customer or admin, I want to be notified at key workflow transitions, so that I am informed of progress without having to manually check the portal.

#### Acceptance Criteria

1. WHEN the RFQ status transitions to `AWAITING_PAYMENT`, THE RFQ_System SHALL send an email to the customer with the bank transfer details and instructions to upload payment proof.
2. WHEN a customer submits a payment proof and the RFQ status transitions to `PAYMENT_SUBMITTED`, THE RFQ_System SHALL trigger a dashboard notification for the admin using the existing AdminNotificationListener polling mechanism, so that the admin sees a toast notification and can navigate directly to the RFQ detail page.
3. WHEN the RFQ status transitions to `PAYMENT_CONFIRMED`, THE RFQ_System SHALL send an email to the customer confirming that payment has been verified and the order is being prepared.
4. WHEN the RFQ status transitions to `SHIPPED`, THE RFQ_System SHALL send an email to the customer including the tracking information if provided.
5. IF an email dispatch fails at any transition, THEN THE RFQ_System SHALL log the error and SHALL NOT roll back the status transition.
