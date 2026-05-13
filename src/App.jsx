import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import GateScreen from "./components/GateScreen";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Technologies from "./components/Technologies";
import AboutMe from "./components/AboutMe";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

function App() {
  const [hasEntered, setHasEntered] = useState(false);

  const handleEnter = () => {
    setHasEntered(true);
  };

  return (
    <AnimatePresence mode="wait">
      {!hasEntered ? (
        <GateScreen key="gate" onEnter={handleEnter} />
      ) : (
        <div key="portfolio" className="min-h-screen">
          <Navbar />
          <main>
            <Hero />
            <Technologies />
            <AboutMe />
            <Experience />
            <Projects />
            <Contact />
          </main>
          <Footer />
        </div>
      )}
    </AnimatePresence>
  );
}

export default App;
