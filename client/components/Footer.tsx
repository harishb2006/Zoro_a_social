'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  const handleOpen = useCallback((url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-orange-500 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-500 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="container mx-auto px-6 py-16 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {/* About Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div>
                <h3 className="mb-4 text-3xl font-bold text-white">
                  <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                    Zoro
                  </span>
                </h3>
                <motion.div
                  className="h-1 w-20 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"
                  initial={{ width: 0 }}
                  whileInView={{ width: 80 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  viewport={{ once: true }}
                />
              </div>
              <p className="max-w-md leading-relaxed text-gray-300">
                Welcome to Zoro, a platform dedicated to celebrating India&apos;s rich
                heritage! From vibrant festivals and traditional arts to diverse cuisines
                and historical wonders, we bring you an immersive experience of India&apos;s
                traditions.
              </p>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div>
                <h3 className="mb-4 text-2xl font-bold text-white">Explore</h3>
                <motion.div
                  className="h-1 w-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"
                  initial={{ width: 0 }}
                  whileInView={{ width: 64 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  viewport={{ once: true }}
                />
              </div>
              <ul className="space-y-3">
                {['States & Culture', 'Festivals', 'Cuisine', 'Heritage Sites', 'Art & Music'].map(
                  (link, index) => (
                    <motion.li
                      key={link}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      viewport={{ once: true }}
                    >
                      <a
                        href="#"
                        className="group inline-flex items-center text-gray-300 transition-colors hover:text-orange-400"
                      >
                        <span className="mr-2 text-orange-500 transition-transform group-hover:translate-x-1">
                          →
                        </span>
                        {link}
                      </a>
                    </motion.li>
                  )
                )}
              </ul>
            </motion.div>

            {/* Contact & Social */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div>
                <h3 className="mb-4 text-2xl font-bold text-white">Connect</h3>
                <motion.div
                  className="h-1 w-16 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"
                  initial={{ width: 0 }}
                  whileInView={{ width: 64 }}
                  transition={{ duration: 1, delay: 0.7 }}
                  viewport={{ once: true }}
                />
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="h-5 w-5 text-orange-500" />
                  <span>info@indiaculture.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Phone className="h-5 w-5 text-orange-500" />
                  <span>+91 1234567890</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  <span>India</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Follow Us
                </p>
                <div className="flex gap-4">
                  {[
                    { icon: FaGithub, url: 'https://github.com/harishb2006', label: 'GitHub' },
                    {
                      icon: FaLinkedin,
                      url: 'https://www.linkedin.com/in/harish-b-41450232a/',
                      label: 'LinkedIn',
                    },
                    { icon: FaTwitter, url: '#', label: 'Twitter' },
                    { icon: FaInstagram, url: '#', label: 'Instagram' },
                  ].map((social, index) => (
                    <motion.button
                      key={social.label}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleOpen(social.url)}
                      className="group relative rounded-full bg-slate-800 p-3 transition-all duration-300 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600"
                      aria-label={social.label}
                    >
                      <social.icon className="h-6 w-6 text-gray-300 transition-colors group-hover:text-white" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700/50 bg-black/30 px-6 py-6 backdrop-blur-sm md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row"
          >
            <p className="text-center text-sm text-gray-400 md:text-left">
              © {new Date().getFullYear()} India Culture. All rights reserved. Made with{' '}
              <span className="text-red-500">❤</span> for India
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="transition-colors hover:text-orange-400">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="#" className="transition-colors hover:text-orange-400">
                Terms of Service
              </a>
              <span>•</span>
              <a href="#" className="transition-colors hover:text-orange-400">
                Sitemap
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
