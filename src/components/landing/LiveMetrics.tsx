import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useState, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { formatUnits } from 'viem';
import { wagmiConfig, mezoTestnet } from '../../lib/wagmi';
import { MEZOLENS_CONTRACTS, EARN_VAULT_ABI } from '../../config/contracts';

export default function LiveMetrics() {
  const [hasViewed, setHasViewed] = useState(false);
  const [stats, setStats] = useState({ totalBtc: 0, compounded: 0, positions: 0, bestApr: 15 });

  useEffect(() => {
    const load = async () => {
      try {
        const result = await readContract(wagmiConfig, {
          address: MEZOLENS_CONTRACTS.earnVault,
          abi: EARN_VAULT_ABI,
          functionName: 'getVaultStats',
          chainId: mezoTestnet.id,
        }) as any;

        setStats({
          totalBtc: parseFloat(parseFloat(formatUnits(result.totalBtcLocked, 18)).toFixed(6)),
          compounded: parseFloat(parseFloat(formatUnits(result.totalCompounded, 18)).toFixed(6)),
          positions: Number(result.totalPositions),
          bestApr: 15,
        });
      } catch (e) { if (process.env.NODE_ENV === 'development') console.warn('RPC:', e); }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    {
      label: 'Total BTC Locked',
      icon: '₿',
      value: stats.totalBtc,
      decimals: 6,
      trend: 'Live',
      subtitle: 'across all vaults',
      progress: 78,
    },
    {
      label: 'Auto-Compounded',
      icon: '₿',
      value: stats.compounded,
      decimals: 6,
      trend: 'Live',
      subtitle: 're-locked automatically',
      progress: 65,
    },
    {
      label: 'Active Positions',
      icon: '👤',
      value: stats.positions,
      trend: 'Live',
      subtitle: 'earning compound yield',
      progress: 82,
    },
    {
      label: 'Best APR',
      icon: '🔥',
      value: stats.bestApr,
      decimals: 0,
      trend: 'Aggressive',
      trendColor: 'amber',
      subtitle: 'with compound boost',
      progress: 92,
    },
  ];

  return (
    <section className="py-14 bg-[#FAFBFA]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          onViewportEnter={() => setHasViewed(true)}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="text-[20px] font-[700] text-[#1A1A1A] uppercase tracking-[0.05em]">
            Protocol metrics
          </h2>
          <p className="text-[14px] text-[#AAA] mt-1">Live from Mezo Testnet</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ y: 24, scale: 0.96, opacity: 0 }}
              whileInView={{ y: 0, scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="bg-white border border-mezo-black rounded-[16px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-[12px] text-[#AAA] uppercase font-semibold tracking-wider">
                  {metric.label}
                </span>
                <span className="text-[16px] opacity-60">{metric.icon}</span>
              </div>

              <div className="flex items-end gap-3 mb-1">
                <span className="text-[34px] font-[800] text-[#1A1A1A] leading-none">
                  {hasViewed ? (
                    <CountUp end={metric.value} decimals={metric.decimals || 0} duration={1.5} />
                  ) : (
                    '0'
                  )}
                  {metric.label === 'Best APR' && '%'}
                </span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={hasViewed ? { scale: 1 } : { scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 1.5 + i * 0.1 }}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                    metric.trendColor === 'amber'
                      ? 'bg-[#FFF4E5] text-[#D4940A]'
                      : 'bg-[#E2F0E5] text-[#1A8C52]'
                  }`}
                >
                  {metric.trend}
                </motion.span>
              </div>

              <p className="text-[12px] text-[#BBB] mb-6">{metric.subtitle}</p>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-[5px] rounded-full bg-[#F0F0F0] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={hasViewed ? { width: `${metric.progress}%` } : { width: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 1.5 + i * 0.1 }}
                    className="h-full bg-gradient-to-r from-[#FF6B6B] via-[#FFD93D] to-[#4CAF50]"
                  />
                </div>
                <span className="text-[12px] text-[#AAA] font-medium w-8 text-right">
                  {metric.progress}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
