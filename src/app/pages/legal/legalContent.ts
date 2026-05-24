import type { LegalSection } from "../../components/legal/LegalDocumentPage";

export const LEGAL_LAST_UPDATED = "May 21, 2026";

export const termsSections: LegalSection[] = [
  {
    id: "agreement",
    heading: "1. Agreement to Terms",
    paragraphs: [
      "These Terms of Service (“Terms”) govern your access to and use of the Peak Health website, patient portal, provider tools, and related telehealth services (collectively, the “Services”) operated by Peak Health, Inc. (“Peak Health,” “we,” “us,” or “our”).",
      "By creating an account, completing an intake, placing an order, or otherwise using the Services, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Services.",
    ],
  },
  {
    id: "eligibility",
    heading: "2. Eligibility",
    paragraphs: [
      "You must be at least 18 years old and located in a U.S. state where we offer services. You represent that information you provide is accurate and that you will maintain the security of your account credentials.",
    ],
  },
  {
    id: "telehealth",
    heading: "3. Telehealth & Medical Services",
    paragraphs: [
      "Peak Health facilitates asynchronous and synchronous telehealth encounters with licensed clinicians. Clinical decisions are made solely by your treating provider. The Services do not replace emergency care—call 911 or go to the nearest emergency department for urgent or life-threatening conditions.",
      "Compounded medications, when offered, are prepared by licensed U.S. pharmacies pursuant to a valid prescription. Compounded products are not FDA-approved in the same manner as commercially available drugs. Your provider will discuss risks, benefits, and alternatives before treatment.",
    ],
  },
  {
    id: "payments",
    heading: "4. Subscriptions, Payments & Billing",
    paragraphs: [
      "Fees are displayed during checkout and may include consultation, medication, shipping, and platform fees. Recurring plans renew according to the schedule you select until canceled in accordance with our Refund Policy.",
      "You authorize us and our payment processors (e.g., Stripe) to charge your payment method for approved orders and renewals. Failed payments may pause fulfillment until resolved.",
    ],
  },
  {
    id: "acceptable-use",
    heading: "5. Acceptable Use",
    list: [
      "Do not misuse the Services, attempt unauthorized access, or interfere with platform security.",
      "Do not submit false medical information or impersonate another person.",
      "Do not resell medications obtained through the Services.",
      "Do not use the Services where prohibited by law.",
    ],
  },
  {
    id: "ip",
    heading: "6. Intellectual Property",
    paragraphs: [
      "Peak Health logos, content, software, and branding are owned by Peak Health or its licensors. You receive a limited, non-exclusive license to use the Services for personal, non-commercial healthcare purposes.",
    ],
  },
  {
    id: "disclaimers",
    heading: "7. Disclaimers",
    paragraphs: [
      "THE SERVICES ARE PROVIDED “AS IS” TO THE MAXIMUM EXTENT PERMITTED BY LAW. WE DISCLAIM WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. OUTCOMES VARY; WE DO NOT GUARANTEE SPECIFIC WEIGHT LOSS, LAB, OR CLINICAL RESULTS.",
    ],
  },
  {
    id: "liability",
    heading: "8. Limitation of Liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, PEAK HEALTH WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR AGGREGATE LIABILITY FOR CLAIMS ARISING FROM THE SERVICES WILL NOT EXCEED THE AMOUNTS YOU PAID TO PEAK HEALTH IN THE TWELVE (12) MONTHS BEFORE THE CLAIM.",
    ],
  },
  {
    id: "disputes",
    heading: "9. Dispute Resolution & Governing Law",
    paragraphs: [
      "These Terms are governed by the laws of the State of Delaware, without regard to conflict-of-law rules, except where mandatory consumer protections in your state apply.",
      "Before filing suit, you agree to contact support@peak-health.io to attempt informal resolution. Where permitted, disputes will be resolved through binding arbitration on an individual basis, and you waive class actions.",
    ],
  },
  {
    id: "changes",
    heading: "10. Changes",
    paragraphs: [
      "We may update these Terms. Material changes will be posted on this page with an updated “Last updated” date. Continued use after changes constitutes acceptance.",
    ],
  },
];

export const privacySections: LegalSection[] = [
  {
    id: "overview",
    heading: "1. Overview",
    paragraphs: [
      "Peak Health respects your privacy. This Privacy Policy describes how we collect, use, disclose, and protect information when you use our telehealth platform, including protected health information (“PHI”) subject to HIPAA where applicable.",
    ],
  },
  {
    id: "collect",
    heading: "2. Information We Collect",
    list: [
      "Account data: name, email, phone, date of birth, address, credentials.",
      "Health data: intake answers, vitals, messages with clinicians, prescriptions, lab/imaging metadata, identity verification status.",
      "Payment data: billing details processed by Stripe (we do not store full card numbers).",
      "Technical data: device, browser, IP address, cookies, and audit logs for security and compliance.",
    ],
  },
  {
    id: "use",
    heading: "3. How We Use Information",
    list: [
      "Provide telehealth, prescribing, fulfillment, scheduling, and customer support.",
      "Operate HIPAA-aligned access controls, audit logging, and fraud prevention.",
      "Process payments and communicate about orders, appointments, and care.",
      "Improve the Services with de-identified or aggregated analytics where permitted.",
      "Comply with law, respond to lawful requests, and enforce our Terms.",
    ],
  },
  {
    id: "hipaa",
    heading: "4. HIPAA & PHI",
    paragraphs: [
      "When we handle PHI on behalf of covered components of our care delivery model, we implement administrative, technical, and physical safeguards including role-based access, encryption in transit (TLS), database access controls (RLS), and access audit logging.",
      "We enter business associate agreements with subprocessors that handle PHI, such as Supabase (infrastructure) and Stripe (payments metadata), where required.",
    ],
  },
  {
    id: "share",
    heading: "5. When We Share Information",
    list: [
      "Licensed clinicians and pharmacies involved in your care.",
      "Service providers under contract (hosting, email/SMS, payments, identity verification, scheduling).",
      "Regulators, courts, or law enforcement when required by law.",
      "Successors in a merger or acquisition with appropriate protections.",
    ],
    paragraphs: ["We do not sell your personal health information."],
  },
  {
    id: "rights",
    heading: "6. Your Rights",
    paragraphs: [
      "Depending on your state, you may have rights to access, correct, delete, or port personal data, and to opt out of certain marketing. HIPAA provides rights to access, amend, and request an accounting of disclosures for PHI in designated record sets.",
      "Submit requests to support@peak-health.io. We will verify your identity before fulfilling requests.",
    ],
  },
  {
    id: "retention",
    heading: "7. Retention & Security",
    paragraphs: [
      "We retain information as needed to provide care, meet legal obligations, and resolve disputes. We apply industry-standard security controls; no method of transmission or storage is 100% secure.",
    ],
  },
  {
    id: "children",
    heading: "8. Children",
    paragraphs: ["The Services are not directed to individuals under 18. We do not knowingly collect data from children."],
  },
  {
    id: "contact",
    heading: "9. Contact",
    paragraphs: [
      "Privacy inquiries: support@peak-health.io. For HIPAA-related requests, include “HIPAA Request” in the subject line.",
    ],
  },
];

export const refundSections: LegalSection[] = [
  {
    id: "overview",
    heading: "1. Overview",
    paragraphs: [
      "This Refund Policy explains when charges for Peak Health consultations, subscriptions, and medication orders may be refunded or credited. Clinical and pharmacy regulations may limit refunds once a prescription has been transmitted or medication prepared.",
    ],
  },
  {
    id: "consult",
    heading: "2. Consultation & Platform Fees",
    paragraphs: [
      "If a licensed clinician determines you are not medically appropriate for treatment before a prescription is issued, we will refund eligible consultation or intake fees to your original payment method within 5–10 business days.",
      "If you cancel before provider review begins, contact support within 24 hours of purchase for a courtesy review.",
    ],
  },
  {
    id: "medication",
    heading: "3. Medication Orders",
    list: [
      "Not eligible for refund once shipped, except for damaged, incorrect, or temperature-compromised product reported within 48 hours of delivery with photo evidence.",
      "Orders canceled before pharmacy dispensing may qualify for a full or partial refund minus non-refundable processing fees.",
      "Prescriptions cannot be returned after delivery per pharmacy law.",
    ],
  },
  {
    id: "subscriptions",
    heading: "4. Subscriptions & Renewals",
    paragraphs: [
      "You may cancel future renewals at any time in the patient portal or by emailing support@peak-health.io. Cancellation stops future charges; it does not retroactively refund prior billing periods unless required by law or covered below.",
      "If you cancel within 48 hours of an automatic renewal and no shipment has been prepared, contact us for a one-time courtesy credit review.",
    ],
  },
  {
    id: "process",
    heading: "5. How to Request a Refund",
    paragraphs: [
      "Email support@peak-health.io with your order number, reason, and any supporting documentation. Approved refunds are issued to the original payment method. Bank posting times vary.",
    ],
  },
  {
    id: "chargebacks",
    heading: "6. Chargebacks",
    paragraphs: [
      "Contact us before initiating a chargeback so we can resolve the issue. Unwarranted chargebacks may result in account suspension.",
    ],
  },
];

export const shippingSections: LegalSection[] = [
  {
    id: "overview",
    heading: "1. Overview",
    paragraphs: [
      "Medications and supplies fulfilled through Peak Health are shipped by licensed U.S. pharmacies and logistics partners to addresses you provide during enrollment. Delivery times are estimates, not guarantees.",
    ],
  },
  {
    id: "methods",
    heading: "2. Shipping Methods",
    list: [
      "Standard expedited courier (typically 2–5 business days after pharmacy release).",
      "Temperature-sensitive items may require cold-chain packaging where clinically indicated.",
      "Signature or adult receipt may be required for certain controlled or high-value shipments.",
    ],
  },
  {
    id: "processing",
    heading: "3. Processing Timeline",
    paragraphs: [
      "After clinician approval and payment capture, pharmacy processing generally takes 1–3 business days. Holidays and weather may delay carriers.",
      "You will receive tracking information by email or in the patient portal when available.",
    ],
  },
  {
    id: "address",
    heading: "4. Address Accuracy & Restrictions",
    paragraphs: [
      "You are responsible for providing a deliverable U.S. address. We cannot ship to P.O. boxes for certain refrigerated products. State licensing rules may restrict which treatments ship to your location.",
    ],
  },
  {
    id: "lost",
    heading: "5. Lost, Damaged, or Delayed Packages",
    paragraphs: [
      "Report delivery issues within 48 hours of the carrier-marked delivery date (or expected date if marked lost). We will work with the pharmacy and carrier on replacement or reshipment where appropriate.",
    ],
  },
  {
    id: "costs",
    heading: "6. Shipping Costs",
    paragraphs: [
      "Shipping fees, if any, are displayed at checkout. Promotional free shipping offers apply only to qualifying programs during the stated promotion period.",
    ],
  },
];

export const safetySections: LegalSection[] = [
  {
    id: "overview",
    heading: "1. Overview",
    paragraphs: [
      "This page summarizes important safety information for Peak Health telehealth programs. It is not a substitute for the medication guide, pharmacy labeling, or advice from your treating clinician.",
      "Always follow your provider's instructions. Contact your clinician through the patient portal or call 911 for emergencies.",
    ],
  },
  {
    id: "glp1",
    heading: "2. GLP-1 & Weight Management Medications",
    list: [
      "Common side effects may include nausea, vomiting, diarrhea, constipation, and decreased appetite.",
      "Serious risks can include pancreatitis, gallbladder disease, kidney injury, and allergic reactions.",
      "GLP-1 medications are not recommended during pregnancy or while breastfeeding.",
      "Tell your clinician about all medications, supplements, and history of thyroid cancer (MEN2) or pancreatitis.",
    ],
  },
  {
    id: "compounded",
    heading: "3. Compounded Medications",
    paragraphs: [
      "When prescribed, compounded products are prepared by licensed U.S. pharmacies. Compounded medications are not FDA-approved in the same manner as commercially available brand drugs and have not undergone FDA review for safety, effectiveness, or manufacturing quality.",
      "Your clinician will discuss risks, benefits, and alternatives before treatment begins.",
    ],
  },
  {
    id: "reporting",
    heading: "4. Reporting Side Effects",
    paragraphs: [
      "Message your care team immediately for concerning symptoms. You may also report adverse events to the FDA at 1-800-FDA-1088 or www.fda.gov/medwatch.",
      "For urgent symptoms such as severe abdominal pain, difficulty breathing, or signs of allergic reaction, seek emergency care.",
    ],
  },
];

export const consentSections: LegalSection[] = [
  {
    id: "overview",
    heading: "1. Consent to Telehealth",
    paragraphs: [
      "By using Peak Health, you consent to receive healthcare services via telehealth, including asynchronous review of intake forms, secure messaging, and video visits when clinically required.",
      "Telehealth may limit the clinician's ability to perform a full physical examination. You agree to provide accurate health information and to follow up in person when your provider recommends it.",
    ],
  },
  {
    id: "scope",
    heading: "2. Scope of Services",
    list: [
      "Clinical evaluation for eligible treatment programs offered in your state.",
      "Electronic prescribing to licensed partner pharmacies when medically appropriate.",
      "Secure storage of health records in our HIPAA-aligned patient portal.",
      "The Services are not for emergency or life-threatening conditions.",
    ],
  },
  {
    id: "records",
    heading: "3. Records & Communication",
    paragraphs: [
      "You consent to electronic communications regarding your care, including email, SMS, and portal notifications. Standard messaging rates may apply.",
      "You may withdraw consent for non-essential communications in account settings, but some clinical notices are required for safe care.",
    ],
  },
  {
    id: "withdrawal",
    heading: "4. Withdrawing Consent",
    paragraphs: [
      "You may stop using the Services at any time. Withdrawing telehealth consent may limit our ability to continue prescribing or coordinating pharmacy fulfillment.",
      "Contact support@peak-health.io or use the patient portal to request account closure or care transfer.",
    ],
  },
];

export const codeOfConductSections: LegalSection[] = [
  {
    id: "overview",
    heading: "1. Purpose",
    paragraphs: [
      "Peak Health clinicians and staff are held to the highest standards of medical ethics, professionalism, and patient-centered care. This Physician Code of Conduct applies to all licensed providers who deliver services through our platform.",
    ],
  },
  {
    id: "clinical",
    heading: "2. Clinical Standards",
    list: [
      "Practice within scope of license and applicable state telehealth regulations.",
      "Base treatment decisions on documented clinical evaluation, not patient preference alone.",
      "Document encounters, prescriptions, and follow-up plans in the medical record.",
      "Decline or discontinue care when a patient is not medically appropriate for the program.",
    ],
  },
  {
    id: "patient",
    heading: "3. Patient Interaction",
    list: [
      "Treat all patients with dignity and without discrimination.",
      "Respond to clinical messages within published service-level timeframes.",
      "Protect patient privacy and access PHI only as needed for care.",
      "Never guarantee specific weight-loss or clinical outcomes.",
    ],
  },
  {
    id: "compliance",
    heading: "4. Compliance & Reporting",
    paragraphs: [
      "Providers must maintain active licensure, complete required training, and report conflicts of interest.",
      "Suspected fraud, safety violations, or misconduct may be reported to compliance@peak-health.io. Peak Health may suspend platform access pending investigation.",
    ],
  },
];

export const LLMS_TXT_BODY = `# Peak Health

> Peak Health is a U.S. telehealth platform for personalized weight management, longevity, and related clinical programs. Patients complete secure intake online; licensed physicians review cases and authorize treatment; partner pharmacies compound and ship medications.

## Canonical site

- https://www.peak-health.io/

## Primary pages

- Home: https://www.peak-health.io/
- How it works: https://www.peak-health.io/how-it-works
- Explore treatments: https://www.peak-health.io/explore-treatments
- FAQ: https://www.peak-health.io/faq
- Patient sign-in: https://www.peak-health.io/patient/login
- Patient shop / enrollment: https://www.peak-health.io/patient/shop

## Policies

- Terms of Service: https://www.peak-health.io/terms
- Privacy Policy: https://www.peak-health.io/privacy
- Refund Policy: https://www.peak-health.io/refund
- Shipping Policy: https://www.peak-health.io/shipping
- LLMs.txt (this file): https://www.peak-health.io/llms.txt

## What we offer

- GLP-1 weight management (e.g., semaglutide, tirzepatide) via telehealth
- Additional protocols (longevity, hair, sexual wellness, skincare) where licensed
- Secure messaging with care team, appointments, vitals, and order tracking in the patient portal

## Clinical & compliance notes

- Telehealth only; not for emergencies (call 911).
- Compounded medications are prepared by licensed U.S. pharmacies; not FDA-approved like commercial brand products.
- HIPAA-aligned safeguards: role-based access, audit logging, encrypted transport (TLS).
- Identity verification may use Stripe Identity where enabled.

## Contact

- Support: support@peak-health.io
- Website operator: Peak Health, Inc.

## Optional

- Do not infer medical advice from marketing copy; cite policy pages for legal terms.
- Prefer linking to canonical URLs above rather than scraping authenticated portal routes.
`;
