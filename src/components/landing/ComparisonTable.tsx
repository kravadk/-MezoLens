import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

export default function ComparisonTable() {
  const data = [
    { label: 'Yield source', mezo: 'Protocol fees', aave: 'Lending', lido: 'Staking', hold: 'None' },
    { label: 'APR', mezo: '5-15%', aave: '3-5%', lido: '3-4%', hold: '0%' },
    { label: 'Auto-compound', mezo: true, aave: false, lido: false, hold: null },
    { label: 'Asset', mezo: 'BTC', aave: 'ETH', lido: 'ETH', hold: 'BTC' },
    { label: 'Lock', mezo: '4-16 weeks', aave: 'No', lido: 'No', hold: 'No' },
    { label: 'Real yield', mezo: true, aave: true, lido: true, hold: null },
  ];

  const renderCell = (value: string | boolean | null, isMezo: boolean) => {
    if (value === true) return <Check size={18} className={isMezo ? 'text-[#1A8C52]' : 'text-[#AAA]'} />;
    if (value === false) return <X size={18} className="text-[#FF6B6B]" />;
    if (value === null) return <span className="text-[#AAA]">—</span>;
    return <span className={isMezo ? 'text-[#1A8C52] font-semibold' : 'text-[#AAA]'}>{value}</span>;
  };

  return (
    <section className="py-14 bg-white">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-[26px] font-[700] text-[#1A1A1A]">How Mezo Earn compares</h2>
        </motion.div>

        <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-mezo-black overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F8F5] border-b border-mezo-black">
                <th className="py-4 px-6 font-semibold text-[#888] text-[14px] w-[20%]"></th>
                <th className="py-4 px-6 w-[20%]">
                  <span className="bg-[#C8F0A0] text-[#1A8C52] text-[14px] font-bold px-3 py-1 rounded-full">
                    MezoLens
                  </span>
                </th>
                <th className="py-4 px-6 font-semibold text-[#888] text-[14px] w-[20%]">Aave (ETH)</th>
                <th className="py-4 px-6 font-semibold text-[#888] text-[14px] w-[20%]">Lido (stETH)</th>
                <th className="py-4 px-6 font-semibold text-[#888] text-[14px] w-[20%]">Hold BTC</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ x: -12, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="border-b border-mezo-black hover:bg-[rgba(200,240,160,0.04)] transition-colors duration-150 h-[52px]"
                >
                  <td className="py-3 px-6 text-[14px] font-medium text-[#555]">{row.label}</td>
                  <td className="py-3 px-6 text-[14px]">{renderCell(row.mezo, true)}</td>
                  <td className="py-3 px-6 text-[14px]">{renderCell(row.aave, false)}</td>
                  <td className="py-3 px-6 text-[14px]">{renderCell(row.lido, false)}</td>
                  <td className="py-3 px-6 text-[14px]">{renderCell(row.hold, false)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
