import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useProfile } from "../lib/content";

// Satu kata per komponen agar jumlah hook tetap stabil saat bio dimuat async.
const Word = ({ word, index, total, progress }) => {
  const start = index / total;
  const end = start + 0.5;
  const opacity = useTransform(progress, [start, end], [0.2, 1]);

  return (
    <motion.span style={{ opacity }} className="mr-2 text-black">
      {word}
    </motion.span>
  );
};

const AboutMe = () => {
  const { profile } = useProfile();
  const stats = profile.stats;
  const words = profile.bio ? profile.bio.split(" ") : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const paragraphRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: paragraphRef,
    offset: ["start 0.8", "start 0.3"],
  });

  return (
    <section id="about" className="section bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="section-heading text-center"
        >
          About
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-10 lg:gap-16 items-center">

          {/* Left Side - Photo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative flex justify-center"
            
          >
            {profile.aboutImage && (
              <img
                src={profile.aboutImage}
                alt="Profile"
                className="
                  w-[240px]
                  sm:w-[300px]
                  lg:w-[380px]
                  object-contain
                  transition-transform duration-500
                "
              />
            )}

            {/* Floating Stats */}
            <div
              className="
                absolute top-4 right-0  lg:-right-6
                flex flex-col
                gap-3
              "
            >
              {stats.slice(0, 3).map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="
                    bg-white/90
                    backdrop-blur-md
                    border border-gray-100
                    shadow-lg
                    rounded-2xl
                    px-3 py-2
                    w-[110px] sm:w-[130px]
                  "
                >
                  <div className="text-lg sm:text-xl font-bold text-primary font-poppins">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 font-poppins">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Bio */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <motion.p
              ref={paragraphRef}
              className="
                leading-relaxed
                text-lg
                lg:text-2xl
                font-poppins
                flex flex-wrap
              "
            >
              {words.map((word, index) => (
                <Word
                  key={index}
                  word={word}
                  index={index}
                  total={words.length}
                  progress={scrollYProgress}
                />
              ))}
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutMe;