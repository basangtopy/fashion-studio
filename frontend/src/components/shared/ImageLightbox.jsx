import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

export default function ImageLightbox({ lightboxImage, setLightboxImage }) {
    return (
            <AnimatePresence>
                {lightboxImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setLightboxImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="relative max-w-3xl max-h-[85vh] w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setLightboxImage(null)}
                                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
                            >
                                <X size={16} className="text-foreground" />
                            </button>
                            <div className="relative w-full h-[70vh] rounded-xl overflow-hidden bg-black">
                                {/* blurred background */}
                                <Image
                                    src={lightboxImage}
                                    alt="Payment Proof"
                                    fill
                                    className="object-cover blur-xl scale-110 opacity-80" />
                                <Image
                                    src={lightboxImage}
                                    alt="Payment Proof"
                                    fill
                                    className="object-contain" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        )
    }