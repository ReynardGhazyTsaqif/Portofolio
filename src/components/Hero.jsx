import { motion } from "framer-motion";
import { Link } from "react-scroll";
import { FaChevronDown } from "react-icons/fa";
import { personal } from "../data/personal";

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const keyboardKeys = ["R", "E", "Y", "N"];

  return (
    <section id="hero" className="section bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.h1
              variants={itemVariants}
              className="text-6xl font-bold tracking-tight leading-tight"
            >
              {personal.name}
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl text-gray-600">
              {personal.role}
            </motion.p>
            <motion.p
              variants={itemVariants}
              className="text-gray-600 max-w-sm"
            >
              {personal.description}
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="projects" smooth={true} offset={-80} duration={500}>
                <button className="btn-dark">View Projects</button>
              </Link>
              <Link to="contact" smooth={true} offset={-80} duration={500}>
                <button className="btn-outline">Get in Touch</button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right side - Keyboard keys */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col items-center space-y-8"
          >
            <div className="grid grid-cols-2 gap-6">
              {keyboardKeys.map((key, index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: index % 2 === 0 ? -5 : 5,
                  }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.6 }}
                  className="w-20 h-20 bg-primary text-white rounded-lg shadow-lg flex items-center justify-center text-2xl font-bold"
                >
                  {key}
                </motion.div>
              ))}
            </div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="flex flex-col items-center space-y-2 text-gray-500"
            >
              <span className="text-sm">Scroll to explore</span>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FaChevronDown className="text-lg" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
