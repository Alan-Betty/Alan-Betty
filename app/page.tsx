import Hero from '@/components/sections/Hero';
import Ticker from '@/components/sections/Ticker';
import Flagship from '@/components/sections/Flagship';
import Work from '@/components/sections/Work';
import Awards from '@/components/sections/Awards';
import Stack from '@/components/sections/Stack';
import About from '@/components/sections/About';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/sections/Footer';

export default function Page() {
  return (
    <>
      <Hero />
      <Ticker />
      <Flagship />
      <Work />
      <Awards />
      <Stack />
      <About />
      <Contact />
      <Footer />
    </>
  );
}
