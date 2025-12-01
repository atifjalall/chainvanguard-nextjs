"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { AnimatePresence, motion, Variants } from "framer-motion";

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  );
}

// Previously we relied on Radix CollapsibleContent which applied inline styles interfering
// with framer-motion exit animations. Use a motion-based content wrapper controlled by isOpen.
function CollapsibleContent({
  isOpen,
  ...props
}: {
  isOpen?: boolean;
  children?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  // Motion variants for open/close
  const variants: Variants = {
    closed: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
    },
    open: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
    },
  };

  return (
    // Top-level wrapper provides the data-slot and any CSS targetting
    <div data-slot="collapsible-content" {...props}>
      <AnimatePresence initial={false} mode="wait">
        {isOpen && (
          <motion.div
            role="region"
            aria-hidden={!isOpen}
            key="collapsible-motion-content"
            initial="closed"
            animate="open"
            exit="closed"
            variants={variants}
            style={{ overflow: "hidden", transformOrigin: "top" }}
          >
            {props.children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
