import { motion } from "framer-motion";
import { useProfile } from "../lib/content";

const GateScreen = ({ onEnter }) => {
  const { profile: personal } = useProfile();
  return (
    <motion.div
      className="min-h-screen bg-white flex items-center justify-center px-6"
      /*
        Exit animation: gate geser ke atas dan menghilang.
        Dipicu saat komponen di-unmount oleh App.jsx.
      */
      exit={{
        y: "-100%",
        opacity: 1, // jangan fade biar terasa “slide scene”
        transition: {
          duration: 1.6,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <motion.h1
          className="text-7xl sm:text-8xl lg:text-9xl font-script text-accent mb-8 sm:mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {personal.name || " "}
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-gray-800 mb-8 font-poppins"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {personal.role || " "}
        </motion.p>

        <motion.button
          onClick={onEnter}
          className="btn-pill font-poppins"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          See Portfolio
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default GateScreen;
