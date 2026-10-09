import { motion } from "framer-motion";
import { Link } from "react-scroll";
import { FaChevronDown } from "react-icons/fa";
import { useProfile } from "../lib/content";

const Hero = () => {
  const { profile: personal } = useProfile();
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

  return (
    <section
      id="hero"
      className="relative bg-white min-h-screen overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Left side - Text content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pt-24 lg:py-16"
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight font-poppins"
            >
              {personal.name}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl lg:text-2xl text-gray-600 font-poppins"
            >
              {personal.role}
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="text-gray-600 max-w-sm lg:max-w-md font-poppins"
            >
              {personal.description}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href={personal.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dark w-full sm:w-[180px] text-center font-poppins"
              >
                View Resume
              </a>

              <Link
                to="contact"
                smooth={true}
                offset={-80}
                duration={500}
                className="btn-outline w-full sm:w-[180px] text-center font-poppins cursor-pointer"
              >
                Get in Touch
              </Link>
            </motion.div>
          </motion.div>

          {/* Right side - Image */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex justify-center lg:justify-end relative"
          >
            {personal.heroImage && (
              <motion.img
                src={personal.heroImage}
                alt="Reynard 3D Typography"
                whileHover={{ scale: 1.05 }}
                className="
                  w-[280px]
                  sm:w-[380px]
                  md:w-[460px]
                  lg:w-[560px]
                  xl:w-[640px]
                  object-contain
                  mix-blend-multiply
                  lg:translate-x-16
                  lg:-translate-y-8
                "
              />
            )}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="
  hidden lg:flex
  absolute bottom-10 left-1/2 -translate-x-1/2
  flex-col items-center gap-2 text-gray-500
"
        >
          <span className="text-sm font-poppins">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FaChevronDown className="text-lg" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;