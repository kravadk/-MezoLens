export default function Footer() {
  return (
    <footer className="bg-[#111111] border-t border-white/5 py-10 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* Left */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="MezoLens" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-[15px] text-white">MezoLens</span>
          </div>
          <p className="text-[13px] text-white/40">Self-service Bitcoin banking on Mezo</p>
          <div className="flex flex-col gap-1 mt-2">
            <p className="text-[11px] text-white/30 font-bold uppercase tracking-wider">Roadmap</p>
            {['Mainnet deploy', 'Mobile app', 'Multi-collateral MUSD', 'Keeper bot SDK'].map((item) => (
              <p key={item} className="text-[12px] text-white/30">→ {item}</p>
            ))}
          </div>
        </div>

        {/* Center */}
        <div className="flex items-center md:justify-center gap-6">
          {[
            { label: 'Docs', href: 'https://mezo.org/docs/developers/' },
            { label: 'GitHub', href: 'https://github.com/kravadk/mezolens' },
            { label: 'Mezo', href: 'https://mezo.org' },
            { label: 'Explorer', href: 'https://explorer.test.mezo.org' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-white/50 hover:text-[#C8F0A0] transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center md:justify-end gap-3">
          <span className="bg-[#C8F0A0]/10 text-[#C8F0A0] text-[12px] font-bold px-3 py-1 rounded-full">
            Mezo Testnet
          </span>
          <span className="text-[12px] text-white/30">Hackathon 2026</span>
        </div>
      </div>

      <div className="text-center text-[12px] text-white/20 pt-6 border-t border-white/5">
        © 2026 MezoLens · Not financial advice
      </div>
    </footer>
  );
}
