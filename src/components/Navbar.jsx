import { motion } from "framer-motion";
import { Link } from "react-scroll";

const Navbar = () => {
  const navItems = [
    { name: "About Me", to: "about" },
    { name: "Experience", to: "experience" },
    { name: "Projects", to: "projects" },
    { name: "Contact", to: "contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50 bg-white backdrop-blur-sm border-b border-gray-100"
    >
      <div className="max-w-6xl mx-auto px-12 py-4">
        <div className="flex justify-center">
          <ul className="flex space-x-8">
            {navItems.map((item, index) => (
              <motion.li
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Link
                  to={item.to}
                  smooth={true}
                  offset={-80}
                  duration={500}
                  className="text-primary hover:text-accent transition-colors duration-300 cursor-pointer relative group"
                  activeClass="text-accent"
                  spy={true}
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
