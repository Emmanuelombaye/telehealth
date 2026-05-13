import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Is this safe and legal?", a: "Yes. All treatments are prescribed by U.S. board-certified physicians and fulfilled by licensed U.S. compounding pharmacies operating under strict federal oversight." },
  { q: "How long does shipping take?", a: "Once your prescription is authorized by our medical team, your medication is typically dispatched from the pharmacy within 24-48 hours via free expedited shipping." },
  { q: "Are there any hidden fees?", a: "No. Our pricing is transparent and all-inclusive. It covers your clinical consultation, the medication, and shipping. There are no surprise bills." },
  { q: "Do I need blood work?", a: "In most cases, our comprehensive clinical intake questionnaire provides enough information for our physicians to safely prescribe. If recent labs are required, our medical team will let you know." },
  { q: "What if I don't qualify?", a: "If our medical team determines that a specific treatment is not clinically appropriate for you, your payment will be fully refunded." }
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#0a0d14] tracking-tight m-0">Frequently asked questions.</h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((f,i) => (
            <div key={i} className={`rounded-2xl border border-[#e8edf3] overflow-hidden transition-all duration-200 ${open === i ? 'bg-[#f7f9fc]' : 'bg-white'}`}>
              <button onClick={() => setOpen(open===i ? null : i)}
                className="w-full text-left p-5 md:p-6 flex justify-between items-center bg-transparent border-none cursor-pointer text-[15px] font-bold text-[#0a0d14]">
                <span>{f.q}</span>
                <ChevronDown size={20} className={`text-slate-500 transition-transform duration-200 ${open === i ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              {open === i && (
                <div className="px-5 md:px-6 pb-6 text-sm text-slate-500 leading-relaxed">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
