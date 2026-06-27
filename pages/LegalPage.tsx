import React from "react";

const NAVY = "#1B3A6B";
const BLUE = "#2B6CB8";
const CREAM = "#F8F5F0";

export type LegalPageKey =
  | "terms"
  | "privacy"
  | "refund"
  | "contact"
  | "about"
  | "pricing";

interface Props {
  page: LegalPageKey;
  onNavigate: (page: string) => void;
}

// Last reviewed: 2026-06-26. These pages need a legal review before launch.
// PLACEHOLDERS the founder must fill before going live:
//   [REGISTERED_ADDRESS]   — registered office address (from MCA)
//   [SUPPORT_PHONE]        — public support phone (any business mobile is fine)
//   [GSTIN]                — your 15-char GST number
//   [CIN]                  — your 21-char Corporate Identification Number
//
// Razorpay verifies these pages by URL during onboarding; keep them live at
// /terms, /privacy, /refund, /contact, /about, /pricing.

const COMPANY_LEGAL_NAME = "Any&All Private Limited";
const TRADE_NAME = "Any & All";
const PRIMARY_DOMAIN = "anynall.com";
const SUPPORT_EMAIL = "hello@anynall.com";
const REGISTERED_ADDRESS = "170/3, P L Sharma Road, Begum Bagh, Meerut – 250001, Uttar Pradesh, India";
const SUPPORT_PHONE = "+91 99539 77809";
const GSTIN = "[GSTIN — fill before launch]";
const CIN = "U62090UW2026PTC253793";
const PAN = "ABFCA7940J";
const TAN = "MRTA30854F";
const LAUNCH_YEAR = "2026";
const LAST_UPDATED = "26 June 2026";

const LEGAL: Record<LegalPageKey, { eyebrow: string; title: string; body: React.ReactNode }> = {
  /* ════════════════════════ TERMS ════════════════════════ */
  terms: {
    eyebrow: "LEGAL",
    title: "Terms & Conditions",
    body: (
      <>
        <p>
          <em>Last updated: {LAST_UPDATED}</em>
        </p>

        <p>
          Welcome to {TRADE_NAME} (operated by {COMPANY_LEGAL_NAME}, “we”, “us”, “our”). By accessing or using the
          website at {PRIMARY_DOMAIN} (the “Platform”) you agree to be bound by these Terms &amp; Conditions
          (“Terms”). If you do not agree, do not use the Platform.
        </p>

        <h2>1. About us</h2>
        <p>
          {COMPANY_LEGAL_NAME} is a private limited company incorporated under the Companies Act, 2013, with CIN {CIN}
          and registered office at {REGISTERED_ADDRESS}. We operate the Platform as a live commerce marketplace where
          verified sellers host real-time auction shows and buyers bid and purchase items.
        </p>

        <h2>2. Eligibility</h2>
        <ul>
          <li>You must be at least 18 years old and capable of forming a binding contract under Indian law.</li>
          <li>You must be an Indian resident with a valid PAN and bank account in India.</li>
          <li>Sellers must additionally complete KYC including Aadhaar verification via DigiLocker and bank account verification.</li>
        </ul>

        <h2>3. Your account</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials. You agree to provide
          accurate information during signup and to update it if it changes. We may suspend or terminate your account
          for breach of these Terms.
        </p>

        <h2>4. Listings and sales</h2>
        <ul>
          <li>Sellers warrant that they own or have the right to sell every item listed.</li>
          <li>Listings must be accurate descriptions including condition (new, like new, used, refurbished).</li>
          <li>Counterfeit, stolen, or prohibited items (see Section 5) are strictly forbidden.</li>
          <li>The platform is a venue; we are not a party to the sale contract between buyer and seller, except as
          a payment intermediary holding funds in escrow.</li>
        </ul>

        <h2>5. Prohibited items</h2>
        <p>The following items may not be listed on the Platform:</p>
        <ul>
          <li>Weapons, ammunition, replicas</li>
          <li>Drugs, controlled substances, tobacco, alcohol, vapes</li>
          <li>Counterfeit, replica, or unauthorised branded items</li>
          <li>Stolen goods or goods of suspect provenance</li>
          <li>Adult content</li>
          <li>Live animals or parts from endangered species</li>
          <li>Government documents, currency, lottery tickets</li>
          <li>Prescription items, hazardous materials</li>
          <li>Anything illegal under Indian law</li>
        </ul>

        <h2>6. Payments and escrow</h2>
        <p>
          All payments on the Platform are processed by Razorpay Software Private Limited or an equivalent licensed
          payment aggregator. We do not store full card details. Funds collected from buyers are held in an escrow
          account and released to the seller seven (7) days after delivery confirmation, subject to no dispute
          being raised. See our <a href="#" onClick={(e) => { e.preventDefault(); window.location.assign("/refund"); }}>Refund &amp; Cancellation Policy</a> for details.
        </p>

        <h2>7. Fees</h2>
        <p>
          Our fee structure is published at <a href="#" onClick={(e) => { e.preventDefault(); window.location.assign("/pricing"); }}>{PRIMARY_DOMAIN}/pricing</a>.
          Platform fee is 8% of each sale, deducted before payout. Payment gateway charges (2% + GST) are passed
          through. Fees may change with 30 days' notice.
        </p>

        <h2>8. Disputes</h2>
        <p>
          Buyers may file a dispute within 14 days of delivery if the item is not as described, damaged on arrival, or
          wrong. We mediate disputes; our decision is final and binding for the limited purpose of releasing escrowed
          funds. This does not affect either party's rights to pursue legal remedies separately.
        </p>

        <h2>9. Intellectual property</h2>
        <p>
          The Platform's design, code, logos, and brand assets are owned by {COMPANY_LEGAL_NAME}. Sellers retain
          ownership of their listings, photos, and live show content but grant us a non-exclusive licence to display,
          promote, and store that content for the purposes of operating the Platform.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, our liability for any claim arising from your use of the Platform
          is limited to the platform fee earned on the transaction giving rise to the claim. We are not liable for
          consequential, indirect, or punitive damages.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These Terms are governed by the laws of India. Any dispute will be subject to the exclusive jurisdiction of
          courts at our registered office location.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update these Terms from time to time. We will post the updated version with a new "Last updated"
          date. Continued use of the Platform after changes are posted constitutes acceptance.
        </p>

        <h2>13. Contact</h2>
        <p>
          Questions? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. See our{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); window.location.assign("/contact"); }}>Contact page</a> for more options.
        </p>
      </>
    ),
  },

  /* ════════════════════════ PRIVACY ════════════════════════ */
  privacy: {
    eyebrow: "LEGAL",
    title: "Privacy Policy",
    body: (
      <>
        <p><em>Last updated: {LAST_UPDATED}</em></p>

        <p>
          This Privacy Policy describes how {COMPANY_LEGAL_NAME} (“we”) collects, uses, and shares information
          about you when you use {PRIMARY_DOMAIN} (the “Platform”).
        </p>

        <h2>1. Information we collect</h2>
        <p><strong>You provide directly:</strong></p>
        <ul>
          <li>Name, email, password, phone, and username at signup</li>
          <li>Aadhaar verification details via DigiLocker (for sellers)</li>
          <li>PAN number (for sellers)</li>
          <li>Bank account details (for seller payouts)</li>
          <li>Shipping addresses</li>
          <li>Product listings and content you upload</li>
          <li>Communications with us and other users on the Platform</li>
        </ul>

        <p><strong>Automatically collected:</strong></p>
        <ul>
          <li>IP address, browser type, device identifiers</li>
          <li>Pages viewed, time on Platform, actions taken</li>
          <li>Cookies for session management and analytics</li>
        </ul>

        <h2>2. How we use it</h2>
        <ul>
          <li>To create and operate your account</li>
          <li>To verify your identity (KYC) where required by law</li>
          <li>To process payments and release escrowed funds</li>
          <li>To detect and prevent fraud, abuse, and violations of our Terms</li>
          <li>To send you transactional emails (verification, order updates, dispute notices)</li>
          <li>To send marketing communications, if you've opted in</li>
          <li>To improve the Platform via aggregated analytics</li>
        </ul>

        <h2>3. Aadhaar handling (sellers)</h2>
        <p>
          We use the Government of India's DigiLocker service to verify Aadhaar. Your full Aadhaar number is never
          received or stored by us; we receive only a digitally signed e-KYC document directly from UIDAI. We retain
          the masked Aadhaar (last 4 digits), full name on record, and verification timestamp for compliance.
        </p>

        <h2>4. Sharing your information</h2>
        <p>We share information with:</p>
        <ul>
          <li><strong>Payment processors</strong> (Razorpay) to handle payments and seller payouts</li>
          <li><strong>KYC providers</strong> (Sandbox.co.in, UIDAI via DigiLocker) for identity verification</li>
          <li><strong>Logistics partners</strong> (only buyer's shipping address, only on confirmed orders)</li>
          <li><strong>Other users</strong> only your public profile (name, store handle, ratings) — never Aadhaar/PAN/bank</li>
          <li><strong>Government authorities</strong> when required by law (tax, court order, regulatory request)</li>
        </ul>

        <p>We do NOT sell your personal information.</p>

        <h2>5. Data security</h2>
        <p>
          We use industry-standard security measures including TLS encryption in transit, encrypted storage of
          sensitive fields, role-based access controls, and regular security reviews. No system is 100% secure;
          please use a strong password and notify us promptly if you suspect unauthorised access.
        </p>

        <h2>6. Data retention</h2>
        <ul>
          <li>Account data: as long as your account is active, plus 7 years after closure (Companies Act and IT Act requirements)</li>
          <li>Transaction data: 8 years (Income Tax Act)</li>
          <li>KYC data: as long as legally required, typically 5 years after last transaction</li>
          <li>Marketing preferences: until you opt out</li>
        </ul>

        <h2>7. Your rights</h2>
        <p>You may at any time:</p>
        <ul>
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your account (subject to legal retention requirements above)</li>
          <li>Opt out of marketing communications via unsubscribe links</li>
          <li>Withdraw consent for non-essential data processing</li>
        </ul>
        <p>Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> to exercise any of these rights.</p>

        <h2>8. Cookies</h2>
        <p>
          We use first-party cookies for session management (keeping you logged in) and basic analytics. We do not
          use third-party advertising cookies. You can disable cookies in your browser; the Platform may not function
          properly without them.
        </p>

        <h2>9. Children</h2>
        <p>
          The Platform is not intended for users under 18. We do not knowingly collect information from minors. If
          you believe we have, contact us and we will delete it.
        </p>

        <h2>10. International transfers</h2>
        <p>
          The Platform's primary infrastructure is hosted in India (Firebase / Cloud Functions in asia-south1).
          Limited data may be processed in other regions by our service providers (e.g. Google Cloud's global
          infrastructure); all such providers offer contractual data protection guarantees.
        </p>

        <h2>11. Changes</h2>
        <p>
          We may update this Policy. Material changes will be notified by email or prominent notice on the Platform.
        </p>

        <h2>12. Contact</h2>
        <p>
          For privacy questions, complaints, or to exercise your rights:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
        <p>
          Grievance Officer per IT Rules 2021: contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{" "}
          (response within 15 days as required by law).
        </p>
      </>
    ),
  },

  /* ════════════════════════ REFUND ════════════════════════ */
  refund: {
    eyebrow: "LEGAL",
    title: "Refund & Cancellation Policy",
    body: (
      <>
        <p><em>Last updated: {LAST_UPDATED}</em></p>

        <h2>1. Buyer payments and escrow</h2>
        <p>
          When you win a bid or buy an item, your payment is collected immediately and held in an escrow account
          managed by our payment partner. Funds are released to the seller seven (7) days after delivery confirmation,
          provided no dispute is raised.
        </p>

        <h2>2. When you can get a refund</h2>
        <p>You are entitled to a full refund if any of the following occur within 7 days of delivery:</p>
        <ul>
          <li>The item is materially different from what was described or shown in the live show</li>
          <li>The item is damaged on arrival</li>
          <li>You received the wrong item</li>
          <li>The item is counterfeit</li>
          <li>The seller fails to ship within 5 working days of payment</li>
          <li>The seller's listed item never arrives (lost in transit) and the seller cannot provide proof of dispatch</li>
        </ul>

        <h2>3. When you cannot get a refund</h2>
        <ul>
          <li>Change of mind, unless the seller explicitly offered "no-questions returns" on the listing</li>
          <li>You ordered the wrong size when the size was clearly stated</li>
          <li>Cosmetic differences within the "Used" or "Pre-loved" condition stated on the listing</li>
          <li>Delay caused by buyer (wrong address, unavailable to receive)</li>
          <li>Request raised more than 7 days after delivery</li>
        </ul>

        <h2>4. How to request a refund</h2>
        <ol>
          <li>Open the order in your account</li>
          <li>Click "Report a problem"</li>
          <li>Choose the reason and upload photos / evidence</li>
          <li>The seller has 48 hours to respond</li>
          <li>If unresolved, we mediate and decide within 3 working days</li>
        </ol>

        <h2>5. Return shipping</h2>
        <ul>
          <li>If the seller is at fault (wrong item, damaged, not as described) — <strong>seller pays return shipping</strong></li>
          <li>If the buyer is at fault (changed mind, wrong size when stated correctly) — <strong>buyer pays return shipping</strong>, when returns are allowed by the seller</li>
        </ul>

        <h2>6. Refund timeline</h2>
        <p>
          Approved refunds are processed within 3 working days of approval. The amount is refunded to the original
          payment method. Depending on your bank or card issuer, it may take an additional 5-7 working days to
          reflect in your account.
        </p>

        <h2>7. Cancellations</h2>
        <ul>
          <li><strong>Buyer:</strong> You may cancel an order before it ships, with no penalty. After dispatch, only the return policy applies.</li>
          <li><strong>Seller:</strong> Sellers may cancel an order before dispatch if the item is no longer available; doing so repeatedly damages the seller's rating and may result in suspension.</li>
        </ul>

        <h2>8. Live auction final-sale rule</h2>
        <p>
          Items won in live auctions are final-sale at the bid price; the only grounds for refund are those listed
          in Section 2 above. "Buyer's remorse" is not grounds for a refund on auction items.
        </p>

        <h2>9. Disputed funds</h2>
        <p>
          If a dispute is open at the 7-day escrow release window, funds remain held until the dispute is resolved.
          Our decision is final and binding for the limited purpose of releasing funds.
        </p>

        <h2>10. Contact</h2>
        <p>
          For refund issues: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Include your order number.
        </p>
      </>
    ),
  },

  /* ════════════════════════ CONTACT ════════════════════════ */
  contact: {
    eyebrow: "GET IN TOUCH",
    title: "Contact Us",
    body: (
      <>
        <p>
          We're a small team and we read every message. The fastest way to reach us depends on what you need.
        </p>

        <h2>For buyers</h2>
        <ul>
          <li>Order issues, refunds, missing items → <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
          <li>Account problems, login trouble → <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
        </ul>

        <h2>For sellers</h2>
        <ul>
          <li>Onboarding help, KYC issues → <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
          <li>Payouts, fees, finances → <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
          <li>Live show technical issues → <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
        </ul>

        <h2>For legal &amp; press</h2>
        <ul>
          <li>Press, partnerships, business → <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
          <li>Privacy / grievance officer → <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
          <li>Legal notices → addressed to the registered office below</li>
        </ul>

        <h2>Phone</h2>
        <p>
          Support phone (10am–7pm IST, Mon–Sat): <strong>{SUPPORT_PHONE}</strong>
        </p>

        <h2>Registered office</h2>
        <p>
          <strong>{COMPANY_LEGAL_NAME}</strong><br />
          {REGISTERED_ADDRESS}<br />
          CIN: {CIN}<br />
          GSTIN: {GSTIN}
        </p>

        <h2>Response times</h2>
        <ul>
          <li>Email: within 1 working day (usually faster)</li>
          <li>Phone: live during business hours; voicemail returned within 1 working day</li>
          <li>Disputes: first response within 48 hours; resolution within 3 working days</li>
        </ul>
      </>
    ),
  },

  /* ════════════════════════ ABOUT ════════════════════════ */
  about: {
    eyebrow: "OUR STORY",
    title: "About Any & All",
    body: (
      <>
        <p>
          <strong>{TRADE_NAME}</strong> is India's live-auction marketplace. We host real-time video shows where
          verified sellers — from streetwear thrift stores to sneaker collectors to artisan jewellers — pitch their
          inventory and buyers bid live. Think eBay meets live TV, built for India.
        </p>

        <h2>Why we exist</h2>
        <p>
          Indian sellers running secondhand, vintage, and small-batch goods have nowhere good to go. Instagram is
          chat-based and hard to scale. eBay never invested here. Marketplaces like Amazon and Flipkart are built
          for new products at scale. Meanwhile, buyers don't trust random Instagram accounts with their money.
        </p>
        <p>
          We saw what live-commerce does for sellers in the US (Whatnot) and in China (Taobao Live) and wondered why
          no one had built it properly for India. So we did.
        </p>

        <h2>What makes us different</h2>
        <ul>
          <li><strong>Real-time auctions:</strong> Bid in live shows. See the item, ask questions, win at the price you set.</li>
          <li><strong>Verified sellers:</strong> Every seller is KYC'd via DigiLocker, PAN, and bank verification. Real people, real businesses.</li>
          <li><strong>Escrow for every order:</strong> Your money is held safely until your item arrives.</li>
          <li><strong>Buyer protection:</strong> Item not as described? Damaged? Counterfeit? Refund guaranteed within our 7-day return window.</li>
          <li><strong>Made for India:</strong> UPI payments, IFSC bank verification, GSTIN-aware accounting, Hindi/English support.</li>
        </ul>

        <h2>The company</h2>
        <p>
          {COMPANY_LEGAL_NAME} (CIN {CIN}) is incorporated under the Companies Act, 2013, with registered office at{" "}
          {REGISTERED_ADDRESS}. GST: {GSTIN}.
        </p>

        <h2>Founders</h2>
        <p>
          We're a founder-led team based in India. We're hiring as we grow — write to us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you want to build with us.
        </p>

        <h2>Stay in touch</h2>
        <p>
          Follow us on Instagram (@anynall — coming soon) and join our newsletter for new show drops and seller
          launches.
        </p>
      </>
    ),
  },

  /* ════════════════════════ PRICING ════════════════════════ */
  pricing: {
    eyebrow: "TRANSPARENT PRICING",
    title: "Fees & Pricing",
    body: (
      <>
        <p>
          We make money only when our sellers do. Here's what we charge and what we don't.
        </p>

        <h2>For buyers</h2>
        <p>
          <strong>Browsing, bidding, and buying are completely free.</strong> The price you see is the price you pay,
          plus shipping (set by the seller).
        </p>
        <ul>
          <li>No registration fee</li>
          <li>No subscription</li>
          <li>No bidding fee</li>
          <li>No buyer's premium</li>
        </ul>

        <h2>For sellers</h2>
        <table className="legal-table">
          <thead>
            <tr><th>Charge</th><th>Rate</th><th>When</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Platform fee</td>
              <td><strong>8%</strong></td>
              <td>Per successful sale, deducted before payout</td>
            </tr>
            <tr>
              <td>Payment gateway (Razorpay)</td>
              <td>2% + 18% GST on the gateway fee</td>
              <td>Per successful sale, pass-through</td>
            </tr>
            <tr>
              <td>Listing fee</td>
              <td><strong>Free</strong></td>
              <td>For the first 100 sellers; ₹0 thereafter</td>
            </tr>
            <tr>
              <td>Show hosting fee</td>
              <td><strong>Free</strong></td>
              <td>Always</td>
            </tr>
            <tr>
              <td>Monthly subscription</td>
              <td><strong>None</strong></td>
              <td>—</td>
            </tr>
            <tr>
              <td>Withdrawal fee</td>
              <td><strong>None</strong></td>
              <td>Razorpay payout to your bank is free</td>
            </tr>
          </tbody>
        </table>

        <h2>Example</h2>
        <p>You sell an item for <strong>₹1,000</strong>:</p>
        <ul>
          <li>Platform fee: ₹80 (8%)</li>
          <li>Razorpay gateway: ~₹23.60 (2% + GST)</li>
          <li><strong>You receive: ~₹896.40</strong> (89.6% of sale)</li>
        </ul>

        <h2>When you get paid</h2>
        <p>
          Seller payouts are released after the 7-day escrow window closes (no buyer dispute). Payouts hit your
          bank account within T+1 working day after release. So a sale on Monday clears to your bank around the
          following Monday.
        </p>

        <h2>What's NOT charged</h2>
        <ul>
          <li>Refunds — fees are refunded with the order; you don't pay platform fee on cancelled sales</li>
          <li>Returns — no penalty if the buyer initiates within 7 days and the return is approved</li>
          <li>Failed payments — we don't charge for payments that didn't go through</li>
        </ul>

        <h2>Changes</h2>
        <p>
          We give 30 days' notice before changing any fees. New rates apply only to sales made after the change date.
        </p>

        <h2>Questions</h2>
        <p>
          Fees questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </>
    ),
  },
};

/* ════════════════════════ PAGE COMPONENT ════════════════════════ */
const LegalPage: React.FC<Props> = ({ page, onNavigate }) => {
  const content = LEGAL[page];
  const otherPages: { key: LegalPageKey; label: string }[] = [
    { key: "terms",   label: "Terms & Conditions" },
    { key: "privacy", label: "Privacy Policy" },
    { key: "refund",  label: "Refund Policy" },
    { key: "pricing", label: "Pricing" },
    { key: "about",   label: "About Us" },
    { key: "contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${CREAM} 0%, #FFFFFF 100%)` }}>
      <style>{`
        .legal-prose h2 { color: ${NAVY}; font-size: 1.25rem; font-weight: 700; margin: 1.75rem 0 0.5rem; }
        .legal-prose p { color: #334155; line-height: 1.7; margin: 0.5rem 0; }
        .legal-prose ul, .legal-prose ol { color: #334155; line-height: 1.7; padding-left: 1.25rem; margin: 0.5rem 0; }
        .legal-prose li { margin: 0.25rem 0; }
        .legal-prose a { color: ${BLUE}; font-weight: 600; text-decoration: underline; }
        .legal-prose strong { color: ${NAVY}; }
        .legal-table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.95rem; }
        .legal-table th, .legal-table td { border: 1px solid rgba(43,108,184,0.18); padding: 0.6rem 0.75rem; text-align: left; }
        .legal-table th { background: rgba(43,108,184,0.08); color: ${NAVY}; }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <button
          onClick={() => onNavigate("home")}
          className="text-sm font-semibold mb-6 inline-flex items-center gap-1"
          style={{ color: BLUE }}
        >
          ← Back to {TRADE_NAME}
        </button>

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BLUE }}>
            {content.eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: NAVY }}>
            {content.title}
          </h1>
        </div>

        <div className="rounded-2xl p-6 sm:p-10 legal-prose" style={{
          background: "#FFFFFF",
          border: "1.5px solid rgba(43,108,184,0.14)",
          boxShadow: "0 2px 12px rgba(43,108,184,0.06)",
        }}>
          {content.body}
        </div>

        {/* Cross-links */}
        <div className="mt-8 rounded-2xl p-6" style={{ background: "rgba(43,108,184,0.05)", border: "1.5px solid rgba(43,108,184,0.12)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BLUE }}>More legal</p>
          <div className="flex flex-wrap gap-2">
            {otherPages.filter((p) => p.key !== page).map((p) => (
              <button
                key={p.key}
                onClick={() => onNavigate(p.key)}
                className="text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors"
                style={{ background: "#FFFFFF", color: NAVY, border: "1.5px solid rgba(43,108,184,0.18)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(43,108,184,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-center" style={{ color: "#94A3B8" }}>
          © {LAUNCH_YEAR} {COMPANY_LEGAL_NAME}. CIN {CIN}.
        </p>
      </div>
    </div>
  );
};

export default LegalPage;
