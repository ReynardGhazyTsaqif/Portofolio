import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import emailjs from "@emailjs/browser";
import { personal, emailjs as emailjsConfig } from "../data/personal";

// Validasi sederhana sebelum kirim
function validate(data) {
  if (!data.name.trim()) return "Name is required.";
  if (!data.email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return "Please enter a valid email.";
  if (!data.message.trim()) return "Message is required.";
  return null;
}

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-clear status setelah 5 detik
  useEffect(() => {
    if (status === "success" || status === "error") {
      const t = setTimeout(() => setStatus("idle"), 5000);
      return () => clearTimeout(t);
    }
  }, [status]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear inline error saat user mulai mengetik
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationError = validate(formData);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    emailjs
      .send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
          to_name: personal.name,
        },
        emailjsConfig.publicKey
      )
      .then(() => {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
      })
      .catch(() => setStatus("error"));
  };

  const socialLinks = [
    { icon: FaGithub, url: personal.github, label: "GitHub" },
    { icon: FaLinkedin, url: `https://${personal.linkedin}`, label: "LinkedIn" },
    { icon: FaEnvelope, url: `mailto:${personal.email}`, label: "Email" },
  ];

  const isSending = status === "sending";

  return (
    <section className="relative py-40 px-6 bg-white overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-gray-50 to-white" />

      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-16">

        {/* LEFT — Identity */}
        <div className="col-span-5 flex flex-col justify-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}  // FIX: animasi hanya sekali
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-light leading-tight"
          >
            Let's build
            <br />
            something meaningful
          </motion.h2>

          <p className="text-gray-500 mt-6 max-w-sm leading-relaxed">
            I'm open for internships, freelance projects, and collaborations.
          </p>

          {/* Availability */}
          <div className="mt-8 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm text-gray-500">Available for opportunities</p>
          </div>

          {/* Social links */}
          <div className="flex gap-4 mt-10">
            {socialLinks.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer" // FIX: keamanan external link
                aria-label={s.label}
                className="
                  w-12 h-12 flex items-center justify-center
                  rounded-full border border-black/10
                  hover:scale-110 hover:shadow-md
                  transition duration-200
                "
              >
                <s.icon className="text-black/70 w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* RIGHT — Form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} // FIX: animasi hanya sekali
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="col-span-7"
        >
          <div className="backdrop-blur-xl bg-white/60 border border-black/10 rounded-3xl p-10 shadow-sm">
            <form onSubmit={handleSubmit} noValidate className="space-y-10">

              {/* Name */}
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  disabled={isSending}
                  className="
                    w-full bg-transparent
                    border-b border-black/20
                    py-3 outline-none
                    focus:border-black transition
                    disabled:opacity-50
                  "
                />
              </div>

              {/* Email — FIX: type="email" untuk validasi browser */}
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email"
                  disabled={isSending}
                  className="
                    w-full bg-transparent
                    border-b border-black/20
                    py-3 outline-none
                    focus:border-black transition
                    disabled:opacity-50
                  "
                />
              </div>

              {/* Message */}
              <div>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell me about your project..."
                  rows="5"
                  disabled={isSending}
                  className="
                    w-full bg-transparent
                    border-b border-black/20
                    py-3 outline-none
                    focus:border-black transition resize-none
                    disabled:opacity-50
                  "
                />
              </div>

              {/* Inline validation error */}
              {errorMsg && (
                <p className="text-red-500 text-sm -mt-6">{errorMsg}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSending}
                className="
                  w-full py-4 rounded-full
                  bg-black text-white
                  hover:scale-[1.02] active:scale-[0.98]
                  transition duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
              >
                {/* FIX: spinner saat sending */}
                {isSending && (
                  <svg
                    className="animate-spin w-4 h-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                )}
                {isSending ? "Sending..." : "Send Message"}
              </button>

              {/* Status feedback — FIX: auto-clear setelah 5 detik */}
              {status === "success" && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-600 text-sm text-center"
                >
                  Message sent successfully ✨
                </motion.p>
              )}
              {status === "error" && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm text-center"
                >
                  Something went wrong. Please try again.
                </motion.p>
              )}

            </form>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Contact;