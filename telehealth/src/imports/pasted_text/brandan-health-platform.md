Act as a senior product architect, UX/UI designer, and full-stack engineer from a top-tier healthcare SaaS company.

Design a complete enterprise-grade TeleHealth platform called:

"Brandan Health"

This is a production-ready SaaS system inspired by global healthcare platforms like Teladoc Health and Amwell.

The output must be detailed, structured, and ready to convert into:
- Figma UI design
- React frontend implementation
- Backend architecture (Node.js)
- Database design (MySQL)

---

## 🧠 CORE SYSTEM GOAL

Build a full TeleHealth ecosystem with:
- Multi-portal architecture
- Real-time communication
- Secure medical data handling
- Scalable SaaS backend design
- HIPAA-aligned security principles
- Full audit logging system

---

## 🏥 PORTALS TO DESIGN

### 1. 👤 PATIENT PORTAL
Include:
- Health overview dashboard
- Appointment booking (async + instant scheduling)
- Intake forms (pre-consultation)
- Visit forms (during consultation)
- Secure messaging with doctors
- Visit summaries
- Prescriptions
- Lab results
- Medical documents
- Profile management
- Identity verification
- Family access (dependents)
- Notifications
- Insurance tracking

---

### 2. 🧑‍⚕️ DOCTOR PORTAL
Include:
- Dashboard (schedule + patient queue)
- Patient management
- Consultation workspace
- Medical notes & diagnosis tools
- Prescription builder
- Lab request system
- Messaging system
- Patient history access
- Analytics dashboard

---

### 3. 🛠 ADMIN PORTAL
Include:
- System overview dashboard
- User management (patients/doctors/staff)
- Treatments management
- Orders management
- Messaging oversight
- System analytics
- Audit logs (critical compliance feature)

---

### 4. 💰 FINANCE MODULE
- Payments dashboard
- Revenue tracking
- Invoices
- Discounts & promotions
- Subscription plans

---

### 5. 🧰 TOOLS & SERVICES MODULE
- Questionnaire builder (dynamic forms)
- Product catalog (medications & services)
- Workflow automation builder
- Sales tracking system

---

### 6. 🧪 LAB / PHARMACY PORTAL
- Test ordering system
- Results upload system
- Medicine fulfillment tracking

---

## 🎨 FRONTEND ENGINEERING REQUIREMENTS

The frontend must be designed as a **modern enterprise SaaS system**.

### 🧱 TECH STACK
- React (latest version)
- TypeScript recommended
- Feature-based architecture (not flat structure)

---

### 🎨 UI/UX DESIGN SYSTEM
- Clean healthcare SaaS design
- Card-based dashboards
- Sidebar navigation per portal
- Consistent design system (spacing, typography, colors)
- Dark/light mode support (optional)
- Accessibility-first design (WCAG compliant)

---

### ⚡ PERFORMANCE REQUIREMENTS
- Lazy loading per portal (Patient / Doctor / Admin)
- Code splitting by module
- Optimized dashboard rendering
- Minimal re-renders

---

### 🧩 COMPONENT ARCHITECTURE
Reusable components:
- Buttons
- Forms
- Tables
- Cards
- Modals
- Navigation system

Feature modules:
- /patient
- /doctor
- /admin
- /finance
- /tools

---

### 🧭 NAVIGATION SYSTEM
- Sidebar-based SaaS navigation
- Role-based dynamic menus
- Breadcrumb navigation

---

## 📱 RESPONSIVE & MOBILE-FIRST REQUIREMENTS (CRITICAL)

The system must be fully optimized for **all devices**, especially mobile.

### 📲 MOBILE-FIRST DESIGN
- Design starts from mobile first, then scales to tablet and desktop
- All core actions must work smoothly on a phone

### 📱 DEVICE SUPPORT
- Mobile phones (primary)
- Tablets
- Desktop (secondary for admin/doctor heavy use)

---

### 🧭 MOBILE UX REQUIREMENTS
- Bottom navigation for patient portal
- Collapsible sidebar for admin/doctor
- Large touch-friendly buttons
- One-hand usability design
- Simplified mobile dashboards

---

### ⚡ MOBILE PERFORMANCE
- Fast loading (2–3 seconds max)
- Lazy-loaded components
- Optimized API calls
- Offline fallback states

---

### 🎥 VIDEO CONSULTATION (MOBILE)
- Full-screen mobile video support
- Portrait/landscape adaptability
- Low-bandwidth fallback mode

---

### 🏥 ENTERPRISE MOBILE FEEL
Must feel like real healthcare apps such as:
- Teladoc Health mobile experience
- Amwell mobile experience

Not a desktop UI squeezed into mobile.

---

## 🔐 SECURITY REQUIREMENTS (HIPAA-STYLE)

The system must include:

- Role-Based Access Control (RBAC)
- Encrypted data (in transit and at rest)
- Secure authentication (JWT/OAuth)
- Rate limiting & API protection
- Full audit logging:
  - login events
  - record access
  - updates
  - prescriptions
  - admin actions

Security must be built into architecture, not added later.

---

## ⚙️ SYSTEM ARCHITECTURE OUTPUT

Provide:

1. Full frontend structure (React SaaS architecture)
2. Portal breakdown (Patient / Doctor / Admin / Finance / Lab)
3. Component architecture
4. User flows:
   - booking
   - consultation
   - messaging
5. Backend architecture overview
6. Database schema (high-level)
7. API endpoints structure

---

## 🧠 FINAL GOAL

This must be a **production-grade TeleHealth SaaS platform**, not a demo.

It should feel like a real hospital-grade system used globally by clinics, hospitals, and insurance providers.