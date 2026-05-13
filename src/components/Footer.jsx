import { motion } from "framer-motion";
import { Link } from "react-scroll";
import { FaArrowUp } from "react-icons/fa";
import { personal } from "../data/personal";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const footerLinks = [
    { name: "About", to: "about" },
    { name: "Projects", to: "projects" },
    { name: "Contact", to: "contact" },
  ];

  return (
    <footer className="bg-primary text-white py-12">
      <div className="max-w-6xl mx-auto px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Left - Name and role */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-bold mb-2">{personal.name}</h3>
            <p className="text-gray-300">{personal.role}</p>
          </motion.div>

          {/* Center - Copyright */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center text-gray-300"
          >
            © {new Date().getFullYear()} {personal.name}. All rights reserved.
          </motion.div>

          {/* Right - Navigation and back to top */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col items-end space-y-4"
          >
            <div className="flex space-x-6">
              {footerLinks.map((link, index) => (
                <Link
                  key={link.name}
                  to={link.to}
                  smooth={true}
                  offset={-80}
                  duration={500}
                  className="text-gray-300 hover:text-white transition-colors duration-300 cursor-pointer"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <button
              onClick={scrollToTop}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
              <FaArrowUp />
              <span>Back to Top</span>
            </button>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
