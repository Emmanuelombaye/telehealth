import { HeroSection } from "./landing/HeroSection";
import { TrustBar } from "./landing/TrustBar";
import { TreatmentsSection } from "./landing/TreatmentsSection";
import { HowItWorksSection } from "./landing/HowItWorksSection";
import { BeforeAfterSection } from "./landing/BeforeAfterSection";
import { TestimonialsSection } from "./landing/TestimonialsSection";
import { DoctorsSection } from "./landing/DoctorsSection";
import { FaqSection } from "./landing/FaqSection";
import { LandingFooter } from "./landing/LandingFooter";

export function LandingPage() {
  return (
    <div className="bg-white font-sans text-[#0A0D14] selection:bg-blue-100 min-h-screen flex flex-col">
      {/* Top Banner */}
      <div style={{ background:"#0a0d14", color:"#fff", textAlign:"center", padding:"10px 16px", fontSize:"0.8rem", fontWeight:700, letterSpacing:"0.04em" }}>
        SAVE UP TO $400 ON YOUR FIRST GLP-1 PROTOCOL — <span style={{ color:"#f97316" }}>OFFER ENDS SOON</span>
      </div>

      <HeroSection />
      <TrustBar />
      <TreatmentsSection />
      <HowItWorksSection />
      <BeforeAfterSection />
      <TestimonialsSection />
      <DoctorsSection />
      <FaqSection />
      <LandingFooter />
    </div>
  );
}
