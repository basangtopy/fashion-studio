"use client";

import { motion } from "framer-motion";

const pageVariants = {
    initial: { opacity: 0, y: 12 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export default function PageTransition({ children, className = "" }) {
    return (
        <motion.div
            initial="initial"
            animate="enter"
            exit="exit"
            variants={pageVariants}
            className={className}
        >
            {children}
        </motion.div>
    );
}
