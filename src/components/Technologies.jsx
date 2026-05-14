import { motion } from "framer-motion";
import { technologies } from "../data/technologies";

const Technologies = () => {
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
          className="
        text-4xl
        sm:text-5xl
        md:text-6xl
        font-light
        mb-12
        md:mb-16
        font-poppins
      "
        >
          Technologies
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="
        grid
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        lg:grid-cols-6
        gap-8
        md:gap-10
      "
        >
          {technologies.map((tech) => (
            <motion.div
              key={tech.name}
              variants={itemVariants}
              className="
            flex flex-col items-center
            space-y-3 md:space-y-4
            group cursor-pointer
          "
            >
              <div
                className="
              w-16 h-16
              sm:w-20 sm:h-20
              md:w-24 md:h-24

              flex items-center justify-center
              rounded-2xl md:rounded-3xl

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
                sm:w-14 sm:h-14
                md:w-20 md:h-20

                text-primary
                transition-all duration-300
                group-hover:rotate-6
              "
                />
              </div>

              <span
                className="
              text-sm
              sm:text-base
              md:text-lg
              lg:text-xl

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
