"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CloseButton from "@/components/ui/CloseButton";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Drawer({ open, onClose, title, children }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            onClick={onClose}
          />
          <motion.div
            variants={{
              hidden: { y: "100%", transition: { duration: 0.18, ease: "easeIn" } },
              visible: { y: 0, transition: { type: "spring", damping: 28, stiffness: 280 } },
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed left-4 right-4 bottom-4 z-[60] bg-[#030303] border border-white/14 rounded-3xl max-h-[75vh] overflow-y-auto shadow-2xl shadow-black/60 md:hidden"
          >
            <div className="sticky top-0 bg-[#030303] pt-6 px-6 pb-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white">{title}</h4>
                <CloseButton onClick={onClose} />
              </div>
            </div>
            <div className="px-6 pt-3" style={{ paddingBottom: "40px" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
