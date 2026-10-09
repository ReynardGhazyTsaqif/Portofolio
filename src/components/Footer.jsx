import { motion } from "framer-motion";
import { Link } from "react-scroll";
import { useProfile } from "../lib/content";

const Footer = () => {
  const { profile: personal } = useProfile();
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const footerLinks = [
    { name: "About", to: "about" },
    { name: "Experience", to: "experience" },
    { name: "Projects", to: "projects" },
    { name: "Contact", to: "contact" },
  ];

  return (
    <footer className="bg-black text-white px-6 lg:px-12 pt-16 pb-10">
      <div className="max-w-6xl mx-auto">

        {/* TOP — Nama besar + tech credit */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-12 border-b border-white/10">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.04em] leading-none font-poppins">
              {personal.name.split(" ").slice(0, 2).join(" ")}
              <br />
              {personal.name.split(" ").slice(2).join(" ")}
            </h2>
            <p className="mt-4 text-xs uppercase tracking-[0.12em] text-white/40 font-medium font-poppins">
              {personal.role}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xs text-white/25 md:text-right leading-relaxed self-end font-poppins"
          >
            Designed & built with
            <br />
            React · Tailwind CSS · Framer Motion
          </motion.p>
        </div>

        {/* BOTTOM — Copyright + Nav + Back to top */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8">

          <p className="text-xs text-white/25 order-3 md:order-1 font-poppins">
            © {new Date().getFullYear()} {personal.name}. All rights reserved.
          </p>

          <nav
            className="flex flex-wrap justify-center gap-4 sm:gap-6 order-1 md:order-2"
            aria-label="Footer navigation"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                smooth={true}
                offset={-80}
                duration={500}
                className="
                  text-[11px] uppercase tracking-[0.1em] font-medium
                  text-white/40 hover:text-white
                  transition-colors duration-200 cursor-pointer
                  font-poppins
                "
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="
              flex items-center gap-2 order-2 md:order-3
              text-[11px] uppercase tracking-[0.1em] font-medium
              text-white/40 hover:text-white
              transition-colors duration-200
              font-poppins
            "
          >
            <span>↑</span>
            Back to top
          </button>
        </div>

      </div>
    </footer>
  );
};

export default Footer;