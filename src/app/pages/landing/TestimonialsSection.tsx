import { Link } from "react-router";
import { ArrowRight, MessageSquare, ShieldCheck, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal } from "../../components/ui/Reveal";
import { cn } from "../../components/ui/utils";

type PatientStory = {
  quote: string;
  detail: string;
  name: string;
  location: string;
  program: string;
  timeframe: string;
};

const stories: PatientStory[] = [
  {
    quote:
      "I kept putting off the doctor's office because of work travel. I finished the intake on a Sunday night and had a message in the portal by Tuesday afternoon with next steps.",
    detail: "Started on compounded semaglutide after a short follow-up about prior labs.",
    name: "Rachel T.",
    location: "Austin, TX",
    program: "Weight management",
    timeframe: "Patient since 2025",
  },
  {
    quote:
      "The first two weeks I felt nauseous — I messaged through the app instead of sitting on hold. My clinician lowered the starting dose and checked back in a few days later.",
    detail: "Dose was adjusted without me rebooking or paying for another visit.",
    name: "Marcus D.",
    location: "Columbus, OH",
    program: "Tirzepatide protocol",
    timeframe: "4 months on program",
  },
  {
    quote:
      "What sold me was how normal the process felt: ID upload, consent forms, and tracking in one place. Shipping text came the day it left the pharmacy.",
    detail: "Uses the portal for refill questions; video visit only when required for her state.",
    name: "Linda K.",
    location: "Phoenix, AZ",
    program: "GLP-1 maintenance",
    timeframe: "Renewed twice",
  },
];

const trustNotes = [
  "Board-certified clinicians",
  "HIPAA-aligned patient portal",
  "Licensed U.S. pharmacy partners",
];

function StoryCard({ story, featured = false, index }: { story: PatientStory; featured?: boolean; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className={cn(
        "relative rounded-[22px] border bg-white transition-shadow duration-300",
        featured
          ? "border-emerald-200/80 p-7 md:p-8 shadow-[0_12px_40px_rgba(10,46,31,0.08)]"
          : "border-[#e8edf3] p-6 shadow-sm hover:shadow-md hover:border-emerald-100/80",
      )}
    >
      {featured ? (
        <div className="absolute -top-px left-6 right-6 h-1 rounded-b-full bg-gradient-to-r from-emerald-400 to-teal-500" />
      ) : null}

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex gap-0.5" aria-label="5 out of 5 rating">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          Verified patient
        </span>
      </div>

      <p className="text-[#0a0d14] text-[15px] md:text-base leading-relaxed font-medium m-0">{story.quote}</p>
      <p className="text-slate-500 text-sm leading-relaxed mt-3 m-0">{story.detail}</p>

      <footer className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#0A2E1F] m-0">{story.name}</p>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            {story.location} · {story.program}
          </p>
        </div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide m-0">{story.timeframe}</p>
      </footer>
    </motion.article>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 px-6 bg-[#f7f9fc]" aria-labelledby="patient-stories-heading">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
            <span className="text-[11px] font-extrabold tracking-[0.28em] uppercase text-emerald-600 block mb-3">
              Patient stories
            </span>
            <h2
              id="patient-stories-heading"
              className="text-3xl md:text-4xl lg:text-[2.75rem] font-black text-[#0a0d14] tracking-tight m-0 leading-[1.12]"
            >
              What it&apos;s like after{" "}
              <span className="font-serif italic font-medium text-emerald-600">you enroll.</span>
            </h2>
            <p className="mt-4 text-slate-500 text-base md:text-lg font-medium leading-relaxed m-0">
              Unedited-style feedback from members on intake, clinician messaging, and pharmacy shipping — not
              stock marketing lines.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] gap-10 lg:gap-14 items-start">
          {/* App preview */}
          <Reveal direction="left">
            <div className="relative mx-auto max-w-[340px] lg:max-w-none lg:sticky lg:top-28">
              <div
                className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-emerald-200/40 via-white to-teal-100/50 blur-2xl -z-10"
                aria-hidden
              />
              <div className="rounded-[28px] border border-white/80 bg-white p-3 shadow-[0_24px_64px_rgba(15,23,42,0.12)]">
                <div className="rounded-[22px] overflow-hidden bg-[#0A2E1F] ring-1 ring-black/5">
                  <img
                    src="/generatedImages/image6.png"
                    alt="Peak Health patient portal on mobile — messages, progress, and visit status"
                    className="w-full block"
                    loading="lazy"
                  />
                </div>
                <div className="mt-4 px-2 pb-1 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-emerald-700" aria-hidden />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">
                    Most follow-ups happen in the secure inbox — you&apos;re not stuck on hold for routine dose or
                    shipping questions.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Stories */}
          <div className="flex flex-col gap-4 md:gap-5">
            {stories.map((story, i) => (
              <StoryCard key={story.name} story={story} featured={i === 0} index={i} />
            ))}

            <div className="flex flex-wrap gap-2 pt-2">
              {trustNotes.map((note) => (
                <span
                  key={note}
                  className="inline-flex items-center rounded-full border border-[#e8edf3] bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600"
                >
                  {note}
                </span>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed m-0 pt-1">
              Individual results vary. Testimonials reflect personal experiences and are not a guarantee of outcomes.
              Compounded medications are prescribed only when clinically appropriate.
            </p>

            <Link
              to="/patient/shop"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 self-start bg-[#0d2137] text-white py-4 px-8 rounded-full font-bold text-sm no-underline mt-1 hover:bg-[#0A2E1F] transition-colors shadow-lg shadow-slate-900/10"
            >
              Start your clinical intake
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
