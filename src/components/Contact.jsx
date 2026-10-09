import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaEnvelope, FaInstagram } from "react-icons/fa";
import emailjs from "@emailjs/browser";
import { emailjs as emailjsConfig } from "../data/personal";
import { useProfile } from "../lib/content";

function validate(data) {
  if (!data.name.trim()) return "Name is required.";
  if (!data.email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return "Please enter a valid email.";
  if (!data.message.trim()) return "Message is required.";
  return null;
}

const Contact = () => {
  const { profile: personal } = useProfile();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (status === "success" || status === "error") {
      const t = setTimeout(() => setStatus("idle"), 5000);
      return () => clearTimeout(t);
    }
  }, [status]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
          to_email: personal.email,
          reply_to: formData.email,
        },
        emailjsConfig.publicKey,
      )
      .then(() => {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
      })
      .catch((err) => {
        console.error("EmailJS error:", err);
        setStatus("error");
      });
  };

  const socialLinks = [
    { icon: FaGithub, url: personal.github, label: "GitHub" },
    {
      icon: FaLinkedin,
      url: personal.linkedin,
      label: "LinkedIn",
    },
    { icon: FaEnvelope, url: personal.email && `mailto:${personal.email}`, label: "Email" },
    { icon: FaInstagram, url: personal.instagram, label: "Instagram" },
  ].filter((s) => s.url);

  const isSending = status === "sending";

  return (
    <section id="contact" className="section bg-white overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-gray-50 to-white pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* LEFT — Identity */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl font-light leading-tight font-poppins"
            >
              Let's build
              <br />
              something meaningful
            </motion.h2>

            <p className="text-gray-500 mt-6 max-w-sm leading-relaxed font-poppins">
              I'm open for internships, freelance projects, and collaborations.
            </p>

            {/* Availability */}
            <div className="mt-8 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm text-gray-500 font-poppins">
                Available for opportunities
              </p>
            </div>

            {/* Social links */}
            <div className="flex gap-4 mt-10">
              {socialLinks.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
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
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <div className="backdrop-blur-xl bg-white/60 border border-black/10 rounded-3xl p-8 sm:p-10 shadow-sm">
              <form onSubmit={handleSubmit} noValidate className="space-y-8">
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
                      font-poppins text-sm
                    "
                  />
                </div>

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
                      font-poppins text-sm
                    "
                  />
                </div>

                <div>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell me about your project..."
                    rows="4"
                    disabled={isSending}
                    className="
                      w-full bg-transparent
                      border-b border-black/20
                      py-3 outline-none
                      focus:border-black transition resize-none
                      disabled:opacity-50
                      font-poppins text-sm
                    "
                  />
                </div>

                {errorMsg && (
                  <p className="text-red-500 text-sm font-poppins">
                    {errorMsg}
                  </p>
                )}

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
                    font-poppins text-sm font-medium
                  "
                >
                  {isSending && (
                    <svg
                      className="animate-spin w-4 h-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
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

                {status === "success" && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-600 text-sm text-center font-poppins"
                  >
                    Message sent successfully ✨
                  </motion.p>
                )}
                {status === "error" && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm text-center font-poppins"
                  >
                    Something went wrong. Please try again.
                  </motion.p>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
