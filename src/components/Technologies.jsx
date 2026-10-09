import { motion } from "framer-motion";
import { useTechnologies } from "../lib/content";
import SectionStatus from "./SectionStatus";

const Technologies = () => {
  const { status, data, retry } = useTechnologies();
  const technologies = data ?? [];
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section id="technologies" className="section bg-light">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="section-heading"
        >
          Technologies
        </motion.h2>

        {(status !== "success" || technologies.length === 0) && (
          <SectionStatus
            status={status}
            label="technologies"
            onRetry={retry}
            rows={2}
          />
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="
            grid
            grid-cols-3
            sm:grid-cols-4
            md:grid-cols-5
            lg:grid-cols-6
            gap-6
            md:gap-10
          "
        >
          {technologies.map((tech) => (
            <motion.div
              key={tech.id}
              variants={itemVariants}
              className="flex flex-col items-center space-y-3 group cursor-pointer"
            >
              <div
                className="
                  w-14 h-14
                  sm:w-18 sm:h-18
                  md:w-20 md:h-20
                  flex items-center justify-center
                  rounded-2xl
                  transition-all duration-300 ease-out
                  group-hover:-translate-y-2
                  group-hover:scale-110
                  group-hover:bg-primary/5
                  group-hover:shadow-xl
                  group-hover:shadow-primary/20
                "
              >
                <tech.icon
                  className="
                    w-10 h-10
                    sm:w-12 sm:h-12
                    md:w-14 md:h-14
                    text-primary
                    transition-all duration-300
                    group-hover:rotate-6
                  "
                />
              </div>

              <span
                className="
                  text-xs
                  sm:text-sm
                  md:text-base
                  text-gray-600
                  text-center
                  font-poppins
                  transition-all duration-300
                  group-hover:text-primary
                "
              >
                {tech.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Technologies;