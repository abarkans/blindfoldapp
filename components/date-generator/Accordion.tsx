"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export type AccordionItem = {
  id: string;
  title: ReactNode;
  content: ReactNode;
};

// Same look and behaviour as the landing page FAQ: one item open at a time,
// height animated to 0 when closed. Closed panels stay in the server HTML
// (aria-hidden + inert) so search engines still index the content while
// keyboard users can't tab into links they can't see.
export default function Accordion({ items, idPrefix }: { items: AccordionItem[]; idPrefix: string }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ id, title, content }) => {
        const isOpen = openId === id;
        const panelId = `${idPrefix}-panel-${id}`;
        return (
          <div key={id} className="bg-white/[0.06] rounded-2xl px-6 md:px-8">
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : id)}
                className="w-full flex items-center justify-between gap-6 py-5 md:py-6 text-left group"
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span className="text-white font-semibold text-lg md:text-2xl leading-snug">{title}</span>
                <span
                  className={[
                    "shrink-0 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center transition-colors duration-200",
                    isOpen ? "bg-white/10 border-white/40" : "group-hover:border-white/35",
                  ].join(" ")}
                >
                  <Plus
                    className={`w-4 h-4 transition-[transform,color] duration-200 ${
                      isOpen ? "text-white rotate-45" : "text-white/40 group-hover:text-white/60 rotate-0"
                    }`}
                  />
                </span>
              </button>
            </h3>
            <motion.div
              id={panelId}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              initial={false}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
              aria-hidden={!isOpen}
              inert={!isOpen}
            >
              <div className="pb-6 md:pb-8">{content}</div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
