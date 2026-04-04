import NavBar from "@/components/landing/NavBar";
import HeroSection from "@/components/landing/HeroSection";
import InstallPrompt from "@/components/InstallPrompt";
import TrustBarSection from "@/components/landing/TrustBarSection";
import PainSection from "@/components/landing/PainSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import DemoSection from "@/components/landing/DemoSection";
import PDFShowcaseSection from "@/components/landing/PDFShowcaseSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import SecuritySection from "@/components/landing/SecuritySection";
import GuaranteeSection from "@/components/landing/GuaranteeSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import FooterSection from "@/components/landing/FooterSection";

const Index = () => (
  <div className="min-h-screen">
    <NavBar />
    <HeroSection />
    <TrustBarSection />
    <PainSection />
    <HowItWorksSection />
    <DemoSection />
    <PDFShowcaseSection />
    <TestimonialsSection />
    <PricingSection />
    <SecuritySection />
    <GuaranteeSection />
    <FAQSection />
    <CTASection />
    <FooterSection />
    <InstallPrompt />
  </div>
);

export default Index;
