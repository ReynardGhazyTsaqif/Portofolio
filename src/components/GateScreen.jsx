import { motion } from "framer-motion";
import { personal } from "../data/personal";

const GateScreen = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#f0efeb] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <motion.h1
          className="text-7xl font-script text-accent mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {personal.name}
        </motion.h1>
        <motion.p
          className="text-lg text-gray-600 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {personal.role}
        </motion.p>
        <motion.button
          onClick={onEnter}
          className="btn-pill"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          See Portfolio
        </motion.button>
      </motion.div>
    </div>
  );
};

export default GateScreen;
