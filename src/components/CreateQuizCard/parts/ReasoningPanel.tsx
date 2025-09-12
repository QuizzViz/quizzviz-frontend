import { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Cpu } from "lucide-react";

// Animated reasoning panel that shows step timeline, typing text, and progress
const ReasoningPanel: FC<{
  visible: boolean;
  steps: string[];
  stepIcons: LucideIcon[];
  stepIndex: number;
  typedText: string;
  progress: number; // 0-100
}> = ({ visible, steps, stepIcons, stepIndex, typedText, progress }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="mt-4 bg-background border border-border rounded-xl p-4 shadow-xl"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start space-x-4">
            {/* Timeline */}
            <div className="w-1/3">
              <div className="flex flex-col items-start space-y-3">
                {steps.map((_, i) => {
                  const Icon = stepIcons[i] ?? Cpu;
                  const active = i === stepIndex && visible;
                  const done = i < stepIndex;
                  return (
                    <div key={i} className="flex items-center space-x-3">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: done ? 0.95 : active ? 1.08 : 1,
                          boxShadow: active
                            ? "0 6px 18px rgba(99,102,241,0.12)"
                            : "0 4px 10px rgba(2,6,23,0.06)",
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          done ? "bg-foreground/10" : "bg-foreground/5"
                        } border border-border`}
                      >
                        <Icon className={`h-5 w-5 ${active ? "text-foreground" : "text-muted-foreground"}`} />
                      </motion.div>
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">
                          {i === stepIndex ? (
                            <span className="text-foreground font-medium">
                              {steps[i].replace(/^.*?[—:]/, "").slice(0, 28) || steps[i]}
                            </span>
                          ) : (
                            <span>{steps[i].slice(0, 36)}</span>
                          )}
                        </div>
                        <div className="w-full h-1 rounded-full bg-foreground/6 mt-2">
                          <motion.div
                            initial={{ width: done ? "100%" : "0%" }}
                            animate={{
                              width: done ? "100%" : i === stepIndex ? `${Math.min(100, Math.round((progress / 100) * 100))}%` : "0%",
                            }}
                            transition={{ duration: 0.6 }}
                            className="h-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Typing / progress */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Reasoning</div>
                  <div className="text-sm text-muted-foreground">How the model is thinking</div>
                </div>
                <div className="text-xs text-muted-foreground">{Math.min(100, progress)}%</div>
              </div>
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 bg-card/60 border border-border rounded-lg p-3 min-h-[72px] flex items-center">
                <div className="prose max-w-none">
                  <motion.p key={stepIndex + "-" + typedText} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28 }} className="text-foreground text-sm leading-6 break-words">
                    <span>{typedText}</span>
                    <motion.span aria-hidden animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.1 }} className="inline-block ml-1 align-middle w-[8px] h-4 bg-foreground" style={{ display: "inline-block", marginLeft: 6, height: 16 }} />
                  </motion.p>
                </div>
              </motion.div>
              <div className="mt-3 flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-2">
                    <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-foreground/80" />
                    <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.12 }} className="w-2 h-2 rounded-full bg-foreground/70" />
                    <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.24 }} className="w-2 h-2 rounded-full bg-foreground/60" />
                  </div>
                  <div className="text-xs text-muted-foreground ml-3">Streaming reasoning</div>
                </div>
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-foreground/6">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ type: "tween", duration: 0.45 }} className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReasoningPanel
