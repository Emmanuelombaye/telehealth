const doctors = [
  { img:"/generatedImages/image4.png", name:"Dr. Michael Wasef, MD", title:"Internal Medicine Physician", bio:"Board-certified in internal medicine with expertise in metabolic health, obesity medicine, and telemedicine protocols." },
  { img:"/generatedImages/image5.png", name:"Dr. Andrew Sakla, DO", title:"Internal Medicine Physician", bio:"Specialist in preventative care, hormonal optimization, and advanced clinical intake auditing across 50 states." },
];

export function DoctorsSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-orange-500 block mb-2">Clinical Leadership</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#0a0d14] tracking-tight m-0">Board-certified oversight.</h2>
          <p className="mt-3 text-slate-500 text-base font-medium">Every treatment is reviewed and authorized by licensed U.S. physicians.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((d,i) => (
            <div key={i} className="bg-[#f7f9fc] rounded-[28px] overflow-hidden border border-[#e8edf3]">
              <img src={d.img} alt={d.name} className="w-full h-[280px] sm:h-[320px] object-cover object-top" />
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-black text-[#0a0d14] m-0 mb-1">{d.name}</h3>
                <span className="text-[11px] font-extrabold text-blue-500 uppercase tracking-widest block mb-3">{d.title}</span>
                <p className="text-slate-500 text-sm md:text-[15px] leading-relaxed m-0">{d.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
