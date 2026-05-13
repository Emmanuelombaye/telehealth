import { HeroSection } from "./landing/HeroSection";
import { TrustBar } from "./landing/TrustBar";
import { TreatmentsSection } from "./landing/TreatmentsSection";
import { HowItWorksSection } from "./landing/HowItWorksSection";
import { BeforeAfterSection } from "./landing/BeforeAfterSection";
import { TestimonialsSection } from "./landing/TestimonialsSection";
import { DoctorsSection } from "./landing/DoctorsSection";
import { FaqSection } from "./landing/FaqSection";

export function LandingPage() {
  return (
    <div className="bg-white font-sans text-[#0A0D14] selection:bg-blue-100 min-h-screen flex flex-col">
      <HeroSection />
      <TrustBar />
      <TreatmentsSection />
      <HowItWorksSection />
      <BeforeAfterSection />
      <TestimonialsSection />
      <DoctorsSection />
      <FaqSection />
    </div>
  );
}
