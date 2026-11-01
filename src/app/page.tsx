import Build from "@/components/Build";
import Contact from "@/components/Contact";
import Effects from "@/components/Effects";
import Footer from "@/components/Footer";
import Feature from "@/components/Feature";
import Process from "@/components/Process";
import ActionBar from "@/components/ActionBar";
import { Chapter, PencilFilter } from "@/components/Sketch";
import Gate from "@/components/Gate";
import Hud from "@/components/Hud";
import Index from "@/components/Index";
import Marquee from "@/components/Marquee";
import Services from "@/components/Services";
import SmoothScroll from "@/components/SmoothScroll";
import Stats from "@/components/Stats";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Gate />
      <Effects />
      <Hud />
      <PencilFilter />
      <main>
        <Build />
        <Marquee />
        <Feature />
        <Chapter n="02" />
        <Services />
        <Chapter n="03" side="left" />
        <Process />
        <Chapter n="04" />
        <Stats />
        <Chapter n="05" side="left" />
        <Index />
        <Chapter n="06" />
        <Contact />
      </main>
      <Footer />
      <ActionBar />
    </>
  );
}
