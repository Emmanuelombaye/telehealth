/** Default brand on the live Peak Health OS marketing site */
export const DEFAULT_BRAND_ID = "a009d8db-c770-4287-a15e-cc82515437ef";

export const REGISTER_PATH = `/auth/register?brandId=${DEFAULT_BRAND_ID}`;

export const BRAND_LOGOS = [
  { title: "Ro", src: "/images/brand/ro.png", alt: "Ro Logo" },
  { title: "Hims", src: "/images/brand/hims.png", alt: "Hims Logo" },
  { title: "Medvi", src: "/images/brand/medvi.png", alt: "Medvi Logo" },
  { title: "Yucca", src: "/images/brand/yucca.svg", alt: "Yucca Logo" },
  { title: "Mycare", src: "/images/brand/mycare.png", alt: "Mycare Logo" },
  { title: "Lifemd", src: "/images/brand/lifemd.webp", alt: "Lifemd Logo" },
  { title: "Eden", src: "/images/brand/eden.png", alt: "Eden Logo" },
] as const;

export const PLATFORM_FEATURES = [
  {
    icon: "zap" as const,
    iconBg: "bg-amber-50 text-amber-600",
    title: "Intake Engine",
    description:
      "Dynamic, rule-based questionnaires that adapt to patient data in real-time.",
  },
  {
    icon: "stethoscope" as const,
    iconBg: "bg-emerald-50 text-emerald-600",
    title: "Clinical Triage",
    description:
      "Automated routing to licensed physicians based on state laws and medical markers.",
  },
  {
    icon: "database" as const,
    iconBg: "bg-indigo-50 text-indigo-600",
    title: "Secure Records",
    description:
      "End-to-end encrypted medical data storage with full HIPAA compliance.",
  },
] as const;

export const CLINICAL_FLOW_STEPS = [
  {
    step: "01",
    title: "Seamless Intake",
    description: "Patients complete high-fidelity medical questionnaires.",
  },
  {
    step: "02",
    title: "Provider Review",
    description: "Our licensed physicians evaluate and authorize protocols.",
  },
  {
    step: "03",
    title: "Direct Fulfillment",
    description: "Orders are dispatched from our compounding pharmacy network.",
  },
] as const;
