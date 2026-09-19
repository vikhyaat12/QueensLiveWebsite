export interface EmailTemplateDefinition {
  id: string;
  name: string;
  category: "Authentication" | "Orders" | "Fulfillment" | "Prescriptions" | "Operations";
  subject: string;
  variables: string[];
  description: string;
  defaultHtml: string;
  defaultText: string;
}

const BRAND_WRAPPER_START = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Queens Care Laboratories</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px 0; color: #180524; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #EAE4D8; overflow: hidden; }
    .header { background: #2A0F3A; padding: 28px 32px; text-align: center; border-bottom: 2px solid #D4AF37; }
    .header h1 { font-family: Georgia, serif; color: #ffffff; margin: 0; font-size: 22px; font-weight: normal; letter-spacing: 0.05em; }
    .header p { color: #D4AF37; margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: bold; }
    .body { padding: 32px; font-size: 15px; line-height: 1.6; color: #333333; }
    .cta-btn { display: inline-block; background: #2A0F3A; color: #D4AF37 !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; margin: 20px 0; border: 1px solid #D4AF37; }
    .footer { background: #FAF8F5; padding: 24px 32px; font-size: 12px; color: #777777; border-top: 1px solid #EAE4D8; text-align: center; }
    .footer a { color: #2A0F3A; text-decoration: none; font-weight: 600; }
    .badge { display: inline-block; padding: 3px 8px; background: #F0E8F8; color: #2A0F3A; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .info-box { background: #FBF9F5; border-left: 3px solid #D4AF37; padding: 14px 18px; margin: 18px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>QUEENS CARE LABORATORIES</h1>
      <p>Precision Pharmaceutical Care</p>
    </div>
    <div class="body">`;

const BRAND_WRAPPER_END = `    </div>
    <div class="footer">
      <p style="margin: 0 0 8px;">Queens Care Laboratories Pvt. Ltd. • Mumbai, Maharashtra, India</p>
      <p style="margin: 0;">For clinical or customer inquiries: <a href="mailto:care@queenscare.in">care@queenscare.in</a></p>
      <p style="margin: 12px 0 0; font-size: 11px; color: #999999;">This is an authoritative transactional communication regarding your Queens Care account.</p>
    </div>
  </div>
</body>
</html>`;

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  {
    id: "auth_welcome",
    name: "Welcome / Account Registration",
    category: "Authentication",
    subject: "Welcome to Queens Care Laboratories",
    variables: ["customer_name", "customer_email", "login_url"],
    description: "Dispatched upon successful customer registration.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">Welcome, {{customer_name}}</h2>
      <p>Thank you for creating an account with Queens Care Laboratories. Your profile has been registered in our patient and formulation registry.</p>
      <div class="info-box">
        <strong>Account Email:</strong> {{customer_email}}<br>
        <strong>Formulation Quality:</strong> 100% Validated cGMP &amp; ISO Standards
      </div>
      <p>You can now save delivery addresses, upload prescriptions, track order consignments in real time, and access clinical batch assay reports.</p>
      <center><a href="{{login_url}}" class="cta-btn">Access Your Queens Care Account →</a></center>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Welcome to Queens Care Laboratories, {{customer_name}}!\n\nThank you for creating an account. Your email {{customer_email}} is now registered.\n\nSign in here: {{login_url}}\n\nQueens Care Laboratories • Precision Pharmaceutical Care`,
  },
  {
    id: "auth_password_reset",
    name: "Password Reset Request",
    category: "Authentication",
    subject: "Reset Your Queens Care Password",
    variables: ["customer_name", "reset_url", "expiry_minutes"],
    description: "Dispatched when an account password reset is requested.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">Password Reset Request</h2>
      <p>Hello {{customer_name}},</p>
      <p>We received a request to securely reset the password for your Queens Care account. To proceed, please click the verification button below:</p>
      <center><a href="{{reset_url}}" class="cta-btn">Reset Account Password →</a></center>
      <div class="info-box">
        This single-use security link expires in <strong>{{expiry_minutes}} minutes</strong>. If you did not initiate this request, you can safely ignore this email.
      </div>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Hello {{customer_name}},\n\nWe received a request to reset your Queens Care password.\n\nClick the link below to set a new password:\n{{reset_url}}\n\nThis link expires in {{expiry_minutes}} minutes.\n\nIf you did not request this, please ignore this email.`,
  },
  {
    id: "order_placed",
    name: "Order Placed / Order Confirmation",
    category: "Orders",
    subject: "Queens Care Order Confirmation #{{order_id}}",
    variables: ["customer_name", "order_id", "order_total", "payment_method", "item_summary", "order_url"],
    description: "Dispatched immediately when an order is created by the customer.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">Order Confirmed: #{{order_id}}</h2>
      <p>Dear {{customer_name}},</p>
      <p>Your order has been received by Queens Care Laboratories and routed to our central fulfillment pharmacy.</p>
      <div class="info-box">
        <strong>Order Reference:</strong> #{{order_id}}<br>
        <strong>Payable Amount:</strong> ₹{{order_total}}<br>
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Items:</strong> {{item_summary}}
      </div>
      <p>Our pharmacists are reviewing batch availability and preparing tamper-evident cold-chain packaging.</p>
      <center><a href="{{order_url}}" class="cta-btn">View Order &amp; Invoice Status →</a></center>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Dear {{customer_name}},\n\nYour order #{{order_id}} for ₹{{order_total}} has been received.\nPayment: {{payment_method}}\nItems: {{item_summary}}\n\nView details: {{order_url}}\n\nQueens Care Laboratories`,
  },
  {
    id: "order_confirmed",
    name: "Order Verified / Processing",
    category: "Orders",
    subject: "Order #{{order_id}} Verified &amp; Processing",
    variables: ["customer_name", "order_id", "order_url"],
    description: "Dispatched when order is confirmed by fulfillment staff.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">Order Verified &amp; Packed</h2>
      <p>Dear {{customer_name}},</p>
      <p>Order #{{order_id}} has passed clinical verification and is packaged with security seals for carrier handover.</p>
      <center><a href="{{order_url}}" class="cta-btn">Track Order Progress →</a></center>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Dear {{customer_name}},\n\nOrder #{{order_id}} has been verified and packed for dispatch.\nTrack here: {{order_url}}`,
  },
  {
    id: "order_dispatched",
    name: "Order Dispatched / Shipped",
    category: "Fulfillment",
    subject: "Your Queens Care Order #{{order_id}} has been Dispatched",
    variables: ["customer_name", "order_id", "carrier_name", "tracking_number", "tracking_url"],
    description: "Dispatched when consignment is handed to courier with tracking code.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">Order Dispatched</h2>
      <p>Dear {{customer_name}},</p>
      <p>Your order #{{order_id}} has been handed over to our logistics partner for pan-India delivery.</p>
      <div class="info-box">
        <strong>Carrier:</strong> {{carrier_name}}<br>
        <strong>AWB / Tracking Number:</strong> {{tracking_number}}
      </div>
      <center><a href="{{tracking_url}}" class="cta-btn">Live Shipment Tracking →</a></center>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Dear {{customer_name}},\n\nOrder #{{order_id}} has dispatched via {{carrier_name}}.\nTracking #: {{tracking_number}}\nTrack link: {{tracking_url}}`,
  },
  {
    id: "order_delivered",
    name: "Order Delivered Confirmation",
    category: "Fulfillment",
    subject: "Delivered: Your Queens Care Order #{{order_id}}",
    variables: ["customer_name", "order_id", "invoice_url", "review_url"],
    description: "Dispatched upon verified delivery to patient.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">Delivered Successfully</h2>
      <p>Dear {{customer_name}},</p>
      <p>Your Queens Care order #{{order_id}} has been successfully delivered. Please inspect the packaging to ensure all tamper-evident seals remain intact.</p>
      <p>Your finalized GST tax invoice is available for download at any time.</p>
      <center><a href="{{invoice_url}}" class="cta-btn">Download Tax Invoice (PDF) →</a></center>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Dear {{customer_name}},\n\nOrder #{{order_id}} has been delivered.\nDownload invoice: {{invoice_url}}\n\nThank you for choosing Queens Care Laboratories.`,
  },
  {
    id: "order_cancelled",
    name: "Order Cancelled Notification",
    category: "Orders",
    subject: "Order #{{order_id}} Cancellation Notice",
    variables: ["customer_name", "order_id", "cancellation_reason"],
    description: "Dispatched when an order is cancelled.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">Order Cancelled</h2>
      <p>Dear {{customer_name}},</p>
      <p>Order #{{order_id}} has been cancelled as requested.</p>
      <div class="info-box">
        <strong>Reason / Note:</strong> {{cancellation_reason}}
      </div>
      <p>If payment was debited online, a full refund has been initiated to your original payment source.</p>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Dear {{customer_name}},\n\nOrder #{{order_id}} was cancelled.\nReason: {{cancellation_reason}}\nAny online payment has been refunded.`,
  },
  {
    id: "order_refunded",
    name: "Refund Processed Confirmation",
    category: "Orders",
    subject: "Refund Processed for Order #{{order_id}}",
    variables: ["customer_name", "order_id", "refund_amount", "refund_reference"],
    description: "Dispatched when a payment refund is settled.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">Refund Processed</h2>
      <p>Dear {{customer_name}},</p>
      <p>A refund of <strong>₹{{refund_amount}}</strong> for order #{{order_id}} has been processed.</p>
      <div class="info-box">
        <strong>Refund Reference:</strong> {{refund_reference}}<br>
        <strong>Timeline:</strong> Funds typically reflect in your bank account within 3–5 business days depending on your card issuer.
      </div>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Dear {{customer_name}},\n\nRefund of ₹{{refund_amount}} for order #{{order_id}} has been processed.\nRef: {{refund_reference}}\nExpected in 3-5 business days.`,
  },
  {
    id: "prescription_received",
    name: "Prescription Received / In Review",
    category: "Prescriptions",
    subject: "Prescription Received for Order #{{order_id}}",
    variables: ["customer_name", "order_id"],
    description: "Dispatched when customer uploads a medical prescription.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">Prescription Under Clinical Review</h2>
      <p>Dear {{customer_name}},</p>
      <p>Thank you for uploading your prescription for order #{{order_id}}. Our licensed pharmacists are reviewing the document for regulatory compliance and dosage safety.</p>
      <div class="info-box">
        <strong>Review Status:</strong> In Progress by Pharmacist Desk<br>
        <strong>Estimated Review Time:</strong> 15–30 minutes during pharmacy business hours.
      </div>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Dear {{customer_name}},\n\nYour prescription for order #{{order_id}} has been received and is under review by our pharmacy team.`,
  },
  {
    id: "prescription_approved",
    name: "Prescription Approved",
    category: "Prescriptions",
    subject: "Prescription Verified &amp; Approved — Order #{{order_id}}",
    variables: ["customer_name", "order_id", "pharmacist_note", "order_url"],
    description: "Dispatched when duty pharmacist approves prescription.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">Prescription Approved ✓</h2>
      <p>Dear {{customer_name}},</p>
      <p>Your uploaded prescription for order #{{order_id}} has been verified and approved by our registered pharmacist.</p>
      {{pharmacist_note}}
      <p>Your order has been released to dispensing and packing.</p>
      <center><a href="{{order_url}}" class="cta-btn">View Order Details →</a></center>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Dear {{customer_name}},\n\nYour prescription for order #{{order_id}} has been approved by the pharmacist. Dispensing has commenced.`,
  },
  {
    id: "prescription_rejected",
    name: "Prescription Discrepancy / Action Required",
    category: "Prescriptions",
    subject: "Prescription Action Required — Order #{{order_id}}",
    variables: ["customer_name", "order_id", "rejection_reason", "upload_url"],
    description: "Dispatched when pharmacist notes an issue with uploaded Rx.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #B71C1C; font-family: Georgia, serif; margin-top: 0;">Prescription Clarification Required</h2>
      <p>Dear {{customer_name}},</p>
      <p>Our duty pharmacist reviewed the prescription file submitted for order #{{order_id}} and requires clarification:</p>
      <div class="info-box" style="border-left-color: #B71C1C;">
        <strong>Pharmacist Observation:</strong> {{rejection_reason}}
      </div>
      <p>Please upload a clear, un-cropped photograph of your valid medical practitioner prescription to allow fulfillment.</p>
      <center><a href="{{upload_url}}" class="cta-btn" style="background: #B71C1C; color: #fff !important; border-color: #B71C1C;">Re-upload Prescription →</a></center>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Dear {{customer_name}},\n\nYour prescription for order #{{order_id}} requires clarification:\n{{rejection_reason}}\n\nPlease re-upload a clear file: {{upload_url}}`,
  },
  {
    id: "admin_order_alert",
    name: "Operations Alert: New Order Placed",
    category: "Operations",
    subject: "🚨 New Order #{{order_id}} Placed — ₹{{order_total}}",
    variables: ["order_id", "order_total", "customer_name", "customer_city", "items_count", "admin_order_url"],
    description: "Internal alert to warehouse & pharmacy staff when a new order arrives.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">New Order Alert #{{order_id}}</h2>
      <p>A new order has been received on the Queens Care storefront.</p>
      <div class="info-box">
        <strong>Order:</strong> #{{order_id}}<br>
        <strong>Amount:</strong> ₹{{order_total}}<br>
        <strong>Customer:</strong> {{customer_name}} ({{customer_city}})<br>
        <strong>Items:</strong> {{items_count}} item(s)
      </div>
      <center><a href="{{admin_order_url}}" class="cta-btn">Open in Operations Portal →</a></center>
    ${BRAND_WRAPPER_END}`,
    defaultText: `New Order Alert #{{order_id}}\nAmount: ₹{{order_total}}\nCustomer: {{customer_name}} ({{customer_city}})\nOpen: {{admin_order_url}}`,
  },
  {
    id: "admin_rx_alert",
    name: "Operations Alert: Prescription Awaiting Verification",
    category: "Operations",
    subject: "⚕️ Pharmacist Alert: Prescription Awaiting Review #{{order_id}}",
    variables: ["order_id", "customer_name", "admin_rx_url"],
    description: "Internal alert to duty pharmacist for new Schedule H prescription upload.",
    defaultHtml: `${BRAND_WRAPPER_START}
      <h2 style="color: #2A0F3A; font-family: Georgia, serif; margin-top: 0;">Prescription Awaiting Review</h2>
      <p>Patient {{customer_name}} has uploaded a prescription for order #{{order_id}} requiring pharmacist verification before packing.</p>
      <center><a href="{{admin_rx_url}}" class="cta-btn">Open Pharmacist Review Desk →</a></center>
    ${BRAND_WRAPPER_END}`,
    defaultText: `Prescription Awaiting Review for Order #{{order_id}} by {{customer_name}}.\nOpen desk: {{admin_rx_url}}`,
  },
];
