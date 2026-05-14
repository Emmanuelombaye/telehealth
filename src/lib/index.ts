export { useI18n, I18nProvider, LOCALES, getGreeting } from "./i18n.tsx";
export type { Locale } from "./i18n.tsx";
export { useTheme, ThemeProvider } from "./theme.tsx";
export {
  ORDER_STEPS,
  getStepIndex,
  getActiveOrder,
  getAwaitingReviewCount,
  brand,
  patientUser,
  usePatientStore,
} from "./patient-store";
export type { Order, OrderStatus, DoctorAvailability } from "./patient-store";
export {
  buildOrderFulfillmentRail,
  getOrderFulfillmentRailIndex,
  getOrderTrackingVerticalIndex,
  buildOrderTrackingVerticalSteps,
  orderHasConsultationRail,
} from "./orderFulfillmentRail";
export type { FulfillmentRailStep } from "./orderFulfillmentRail";
export { useDoctorClinicalMetrics } from "./doctorClinicalMetrics";
export { useAuthStore } from "./auth-store";
export type { Role } from "./auth-store";
export { runProductionPreflight } from "./productionPreflight";
export type { PreflightIssue } from "./productionPreflight";
export {
  DEFAULT_PRODUCT_GATEWAYS,
  GATEWAY_DISPLAY,
  normalizeProductGateways,
  effectiveProductGateways,
  sortGateways,
} from "./productGateways";
