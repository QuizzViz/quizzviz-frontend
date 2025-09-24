import { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Cpu } from "lucide-react";

// Simple panel that shows the current reasoning step
export const ReasoningPanel: FC<{
  visible: boolean;
  steps: string[];
  stepIcons: LucideIcon[];
  stepIndex: number;
  typedText: string;
}> = ({ visible, steps, stepIcons, stepIndex, typedText }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="mt-4 bg-background border border-border rounded-lg p-4 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center"
              >
                <Cpu className="h-3.5 w-3.5 text-foreground/70" />
              </motion.div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground/90 mb-1">
                {steps[stepIndex]?.replace(/^.*?[—:]/, "").trim() || "Processing..."}
              </div>
              <div className="text-sm text-muted-foreground">
                <motion.span 
                  key={stepIndex + "-" + typedText} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-flex items-center"
                >
                  <span>{typedText}</span>
                  <motion.span 
                    aria-hidden 
                    animate={{ opacity: [0, 1, 0] }} 
                    transition={{ repeat: Infinity, duration: 1.5 }} 
                    className="inline-block w-0.5 h-4 bg-foreground/80 ml-1.5"
                  />
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReasoningPanel
