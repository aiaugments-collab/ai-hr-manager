import { FeatureGrid } from "@/components/features";
import { Hero } from "@/components/hero";
import { PricingGrid } from "@/components/pricing";
import { stackServerApp } from "@/stack";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ComponentIcon, Users } from "lucide-react";

export default async function IndexPage() {
  const project = await stackServerApp.getProject();
  if (!project.config.clientTeamCreationEnabled) {
    return (
      <div className="w-full min-h-96 flex items-center justify-center">
        <div className="max-w-xl gap-4">
          <p className="font-bold text-xl">Setup Required</p>
          <p className="">
            {
              "To start using this project, please enable client-side team creation in the Stack Auth dashboard (Project > Team Settings). This message will disappear once the feature is enabled."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Hero
        capsuleText="AI-Powered HR Management"
        capsuleLink="#features"
        title="Transform Your HR with Intelligent Automation"
        subtitle="Streamline candidate management, automate document processing, and leverage AI assistance for smarter HR decisions."
        primaryCtaText="Start Free Trial"
        primaryCtaLink={stackServerApp.urls.signUp}
        secondaryCtaText="View Features"
        secondaryCtaLink="#features"
        credits={
          <>
            Empowering HR teams with{" "}
            <span className="text-gradient-primary font-semibold">
              cutting-edge AI technology
            </span>
          </>
        }
      />

      <div id="features" />
      <FeatureGrid
        title="Powerful HR Features"
        subtitle="Everything you need to streamline your human resource operations."
        items={[
          {
            icon: <Users className="h-12 w-12" />,
            title: "AI Candidate Management",
            description:
              "Intelligent candidate scoring, automated screening, and smart recommendations.",
          },
          {
            icon: (
              <svg className="h-12 w-12 fill-current" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6"/>
                <path d="M16 13H8"/>
                <path d="M16 17v-2"/>
                <path d="M8 17v-2"/>
              </svg>
            ),
            title: "Document Processing",
            description:
              "Automated CV parsing, document categorization, and intelligent search.",
          },
          {
            icon: (
              <svg className="h-12 w-12 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            ),
            title: "Smart Analytics",
            description:
              "Comprehensive dashboard with AI-powered insights and performance metrics.",
          },
          {
            icon: (
              <svg className="h-12 w-12 fill-current" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            ),
            title: "AI Assistant",
            description:
              "24/7 intelligent assistant for HR queries, policy questions, and guidance.",
          },
          {
            icon: (
              <svg className="h-12 w-12 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ),
            title: "Enterprise Security",
            description: "SOC 2 compliant with advanced encryption and access controls.",
          },
          {
            icon: <ComponentIcon className="h-12 w-12" />,
            title: "Seamless Integration",
            description: "Connect with your existing HRIS, ATS, and productivity tools.",
          },
        ]}
      />

      <div id="pricing" />
      <PricingGrid
        title="Simple, Transparent Pricing"
        subtitle="Choose the perfect plan for your organization's HR needs."
        items={[
          {
            title: "Starter",
            price: "$29",
            description: "Perfect for small teams and startups.",
            features: [
              "Up to 50 candidates",
              "Basic AI scoring",
              "Document storage (5GB)",
              "Email support",
              "Core HR features",
            ],
            buttonText: "Start Free Trial",
            buttonHref: stackServerApp.urls.signUp,
          },
          {
            title: "Professional",
            price: "$79",
            description: "Ideal for growing businesses.",
            features: [
              "Up to 500 candidates",
              "Advanced AI insights",
              "Document storage (50GB)",
              "Priority support",
              "Custom integrations",
              "Advanced analytics",
            ],
            buttonText: "Start Free Trial",
            isPopular: true,
            buttonHref: stackServerApp.urls.signUp,
          },
          {
            title: "Enterprise",
            price: "Custom",
            description: "For large organizations with specific needs.",
            features: [
              "Unlimited candidates",
              "Custom AI models",
              "Unlimited storage",
              "24/7 dedicated support",
              "Custom integrations",
              "Advanced security & compliance",
            ],
            buttonText: "Contact Sales",
            buttonHref: stackServerApp.urls.signUp,
          },
        ]}
      />
    </>
  );
}
