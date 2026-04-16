import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LiveJar } from "@/components/sections/LiveJar";
import { FounderNote } from "@/components/sections/FounderNote";
import { Charity } from "@/components/sections/Charity";
import { Waitlist } from "@/components/sections/Waitlist";
import { FAQ } from "@/components/sections/FAQ";
import { Footer } from "@/components/sections/Footer";

// LiveJar queries Postgres for the "we eat our own cooking" numbers;
// cache the page for 5 minutes so landing hits hit edge, not DB.
export const revalidate = 300;

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <LiveJar />
        <FounderNote />
        <Charity />
        <Waitlist />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
