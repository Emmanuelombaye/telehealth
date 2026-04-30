import { Link } from "react-router";
import { 
  User, 
  Stethoscope, 
  ShieldCheck, 
  CreditCard, 
  FlaskConical, 
  Activity,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, Button } from "../components/ui/shared";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function LandingPage() {
  const portals = [
    {
      title: "Patient Portal",
      description: "Manage your health, book appointments, and chat with doctors.",
      icon: User,
      href: "/patient",
      color: "bg-blue-500",
      image: "https://images.unsplash.com/photo-1758691462743-f9fc9e430d39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZG9jdG9yJTIwaG9zcGl0YWwlMjBwYXRpZW50JTIwdGVsZW1lZGljaW5lfGVufDF8fHx8MTc3NzU2ODg3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      title: "Doctor Portal",
      description: "Access patient records, manage schedule, and conduct consultations.",
      icon: Stethoscope,
      href: "/doctor",
      color: "bg-emerald-500",
      image: "https://images.unsplash.com/photo-1758691463620-188ca7c1a04f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRseSUyMGRvY3RvciUyMGNvbnN1bHRhdGlvbiUyMGRpZ2l0YWwlMjBoZWFsdGh8ZW58MXx8fHwxNzc3NTY4ODczfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      title: "Admin Portal",
      description: "Oversee system operations, audit logs, and user management.",
      icon: ShieldCheck,
      href: "/admin",
      color: "bg-slate-700",
      image: "https://images.unsplash.com/photo-1777269749032-d8d458ae594d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3NwaXRhbCUyMGludGVyaW9yJTIwY2xlYW4lMjBjbGluaWN8ZW58MXx8fHwxNzc3NTY4ODc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <div className="flex justify-center mb-4">
          <Activity className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Brandan Health</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The next-generation enterprise TeleHealth platform. Secure, scalable, and patient-centered.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {portals.map((portal) => (
          <Link key={portal.href} to={portal.href} className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden border-2 hover:border-primary">
              <div className="h-48 overflow-hidden">
                <ImageWithFallback 
                  src={portal.image} 
                  alt={portal.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-6">
                <div className={`${portal.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4`}>
                  <portal.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{portal.title}</h3>
                <p className="text-muted-foreground mb-6">
                  {portal.description}
                </p>
                <div className="flex items-center text-primary font-semibold">
                  Enter Portal <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-20 grid md:grid-cols-2 gap-8 items-center bg-muted/30 p-8 rounded-3xl">
        <div>
          <h2 className="text-2xl font-bold mb-4">Enterprise-Grade Security</h2>
          <ul className="space-y-3">
            {[
              "HIPAA-aligned data encryption at rest and in transit",
              "Role-based access control (RBAC) with granular permissions",
              "Comprehensive audit logging for compliance",
              "Real-time secure video and messaging protocols"
            ].map((item, i) => (
              <li key={i} className="flex items-start">
                <ShieldCheck className="h-5 w-5 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Button className="mt-8">Get Started</Button>
        </div>
        <div className="hidden md:block">
           <ImageWithFallback 
              src="https://images.unsplash.com/photo-1579154204601-01588f351e67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwbGFib3JhdG9yeSUyMHBoYXJtYWN5JTIwZGFzaGJvYXJkfGVufDF8fHx8MTc3NzU2ODg3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
              alt="Security" 
              className="rounded-2xl shadow-lg"
            />
        </div>
      </div>
    </div>
  );
}
