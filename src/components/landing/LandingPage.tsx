import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Preloader from './Preloader';
import Navbar from './Navbar';
import Hero from './Hero';
import TrustStrip from './TrustStrip';
import LiveMetrics from './LiveMetrics';
import ProblemSolution from './ProblemSolution';
import HowItWorks from './HowItWorks';
import CompoundChart from './CompoundChart';
import Strategies from './Strategies';
import Integrations from './Integrations';
import Fees from './Fees';
import ComparisonTable from './ComparisonTable';
import BottomCTA from './BottomCTA';
import Footer from './Footer';

export function LandingPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('ml-loaded')) {
      setLoading(false);
    }
  }, []);

  const handlePreloaderComplete = () => {
    sessionStorage.setItem('ml-loaded', '1');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFA] text-[#1A1A1A] font-sans overflow-x-hidden">
      <AnimatePresence>
        {loading && <Preloader onComplete={handlePreloaderComplete} />}
      </AnimatePresence>

      <Navbar />

      <main>
        <Hero />
        <TrustStrip />
        <div id="live-metrics"><LiveMetrics /></div>
        <div id="features"><ProblemSolution /></div>
        <div id="how-it-works"><HowItWorks /></div>
        <CompoundChart />
        <div id="strategies"><Strategies /></div>
        <Integrations />
        <div id="transparency"><Fees /></div>
        <ComparisonTable />
        <BottomCTA />
      </main>

      <Footer />
    </div>
  );
}
