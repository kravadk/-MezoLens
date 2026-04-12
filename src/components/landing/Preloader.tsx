import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 2400),
      setTimeout(() => setPhase(4), 3500),
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(onComplete, 600);
      }, 4800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  useEffect(() => {
    if (phase === 4) setParticles([1, 2, 3, 4, 5]);
  }, [phase]);

  const logoScale = phase === 0 ? 0.6 : phase === 1 ? 0.72 : phase === 2 ? 0.85 : 1;
  const breathing = phase === 4;

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Ripple rings on each compound */}
      {[1, 2, 3].map((ring) => (
        phase >= ring && (
          <motion.div
            key={`ripple-${ring}`}
            className="absolute rounded-full border-2 border-[#C8F0A0]"
            initial={{ width: 160, height: 160, opacity: 0.5 }}
            animate={{ width: 500, height: 500, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
          />
        )
      ))}


      {/* Logo + text as one group */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        animate={{
          scale: breathing ? [1, 1.04, 1] : logoScale,
        }}
        transition={breathing
          ? { duration: 1.2, ease: 'easeInOut', repeat: Infinity }
          : { type: 'spring', stiffness: 180, damping: 14 }
        }
      >
        <motion.img
          src="/logo.png"
          alt="MezoLens"
          className="w-72 h-72 object-contain"
          initial={{ scale: 0, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        />

        <motion.div
          className="flex overflow-hidden -mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0 }}
        >
          {"MezoLens".split('').map((char, i) => (
            <motion.span
              key={i}
              className="text-white font-extrabold text-[34px] tracking-tight"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.8 + i * 0.04 }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          className="text-white/50 text-[15px] mt-1 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 2 ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Auto-compound your Bitcoin
        </motion.p>
      </motion.div>

      {/* +₿ flashes on each compound */}
      {[1, 2, 3].map((n) => (
        phase === n && (
          <motion.span
            key={`btc-${n}`}
            className="absolute text-[#C8F0A0] font-extrabold text-[24px] z-20"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: -50 }}
            transition={{ duration: 0.7 }}
            style={{ top: '42%', left: 'calc(50% + 50px)' }}
          >
            +₿
          </motion.span>
        )
      ))}

      {/* Particles floating up on hold phase */}
      {particles.map((p) => (
        <motion.div
          key={`particle-${p}`}
          className="absolute w-2 h-2 rounded-full bg-[#C8F0A0] z-20"
          initial={{ opacity: 0.7, y: -60 }}
          animate={{ opacity: 0, y: -160 }}
          transition={{ duration: 1.5, delay: p * 0.12, ease: 'easeOut' }}
          style={{ top: '45%', left: `calc(50% + ${(p - 3) * 20}px)` }}
        />
      ))}

    </motion.div>
  );
}
