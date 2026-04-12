import { useState, useMemo } from 'react';
import { calculateCompoundYield, calculateSimpleYield, calculateCompoundAdvantage } from '../utils/compound';

export function useCalculator() {
  const [btcAmount, setBtcAmount] = useState(1);
  const [months, setMonths] = useState(12);
  const [strategy, setStrategy] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  const aprs: Record<string, number> = {
    conservative: 600,  // 6% in bps
    balanced: 850,      // 8.5%
    aggressive: 1240,   // 12.4%
  };

  const currentAprBps = aprs[strategy];
  const epochs = Math.floor(months * 4.33); // ~4.33 weeks per month

  const results = useMemo(() => {
    const compoundTotal = calculateCompoundYield(btcAmount, currentAprBps, epochs);
    const simpleGains = calculateSimpleYield(btcAmount, currentAprBps, epochs);
    const advantage = calculateCompoundAdvantage(btcAmount, currentAprBps, epochs);

    return {
      autoCompoundGains: compoundTotal - btcAmount,
      manualGains: simpleGains,
      compoundAdvantage: advantage,
      totalWithCompound: compoundTotal,
      totalWithoutCompound: btcAmount + simpleGains,
    };
  }, [btcAmount, currentAprBps, epochs]);

  return {
    btcAmount, setBtcAmount,
    months, setMonths,
    strategy, setStrategy,
    currentAprBps,
    ...results,
  };
}
