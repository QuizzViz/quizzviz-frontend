import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Sparkles,
  Zap,
  Send,
  Cpu,
  Code,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default  function CreateQuizCard() {
  // form state (unchanged sizes/colors)
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Bachelors");
  const [count, setCount] = useState(5);
  const [balance, setBalance] = useState<number[]>([50]);

  // reasoning state
  const [isReasoning, setIsReasoning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const steps = [
    "🔍 Parsing and understanding the topic semantics...",
    "⚖️ Balancing code-analysis and theoretical coverage...",
    "🧩 Generating question templates & code scaffolds...",
    "✅ Validating difficulty and finalizing the quiz...",
  ];
  const stepIcons = [Cpu, Code, Sparkles, CheckCircle];

  const [stepIndex, setStepIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 - 100

  // typing configuration
  const TYPING_SPEED = 18; // ms per char
  const HOLD_AFTER_TYPING = 900; // ms before next step
  const FINISH_HOLD = 600; // ms after final step before closing

  // map UI difficulty to API expected values
  const difficultyToApi = (val: string) => {
    switch (val) {
      case "High School":
        return "High School Level";
      case "Bachelors":
        return "Bachelors Level";
      case "Masters":
        return "Masters Level";
      case "PhD":
        return "PhD Level";
      default:
        return "Bachelors Level";
    }
  };

  // start reasoning and fire API
  const handleGenerate = async () => {
    if (isReasoning || isFetching) return;

    // validate required fields
    const numQuestions = Number.isFinite(count) ? Math.max(1, count) : 1;
    if (!topic.trim()) {
      setError("Topic is required");
      return;
    }
    if (!difficulty) {
      setError("Difficulty is required");
      return;
    }
    if (!numQuestions) {
      setError("Number of questions is required");
      return;
    }

    setError(null);
    setQuizData(null);
    setIsReasoning(true);
    setIsFetching(true);
    setStepIndex(0);
    setCharIndex(0);
    setTypedText("");
    setProgress(0);

    // prepare payload mapping slider balance (Code%) to theory/code split
    const codePct = Math.max(0, Math.min(100, balance[0] ?? 50));
    const payload = {
      topic: topic.trim(),
      difficulty_level: difficultyToApi(difficulty),
      num_questions: numQuestions,
      theory_questions_percentage: 100 - codePct,
      code_analysis_questions_percentage: codePct,
    };

    try {
      const resp = await fetch(
        "/api/quiz",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        const msg = text || `Request failed with status ${resp.status}`;
        throw new Error(msg);
      }
      const data = await resp.json();
      setQuizData(data);
    } catch (e: any) {
      console.error("Error generating quiz:", e);
      setError(e?.message || "Failed to generate quiz. Please try again.");
    } finally {
      setIsFetching(false);
      // allow the animation loop to conclude before hiding panel
      setTimeout(() => {
        setIsReasoning(false);
      }, 400);
    }
  };

  // typing & progress effect
  useEffect(() => {
    if (!isReasoning) return;

    let typingTimer: ReturnType<typeof setInterval> | null = null;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;

    // finished all steps
    if (stepIndex >= steps.length) {
      // if still fetching, loop steps to keep animation going
      if (isFetching) {
        holdTimer = setTimeout(() => {
          setStepIndex(0);
          setTypedText("");
          setCharIndex(0);
        }, HOLD_AFTER_TYPING);
      } else {
        // show full progress then stop
        setProgress(100);
        holdTimer = setTimeout(() => {
          setIsReasoning(false);
          setStepIndex(0);
          setTypedText("");
          setCharIndex(0);
          setProgress(0);
        }, FINISH_HOLD);
      }
      return () => {
        if (typingTimer) clearInterval(typingTimer);
        if (holdTimer) clearTimeout(holdTimer);
      };
    }

    const current = steps[stepIndex];
    setTypedText("");
    setCharIndex(0);

    // start typing characters
    typingTimer = setInterval(() => {
      setCharIndex((prev) => {
        const next = prev + 1;
        if (next <= current.length) {
          const slice = current.slice(0, next);
          setTypedText(slice);

          // compute overall progress: (completed steps + fraction-of-current) / total
          const fraction = next / Math.max(1, current.length);
          const overall = ((stepIndex + fraction) / steps.length) * 100;
          setProgress(Math.min(100, Math.round(overall)));
          return next;
        } else {
          // finished typing current message
          if (typingTimer) {
            clearInterval(typingTimer);
            typingTimer = null;
          }
          // hold then go to next step
          holdTimer = setTimeout(() => setStepIndex((s) => s + 1), HOLD_AFTER_TYPING);
          return prev;
        }
      });
    }, TYPING_SPEED);

    return () => {
      if (typingTimer) clearInterval(typingTimer);
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [isReasoning, stepIndex, isFetching]); // re-run when stepIndex changes or reasoning stops

  // Quiz rendering (page-like) after response
  if (quizData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Quiz</h2>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => {
                setQuizData(null);
                setError(null);
              }}
            >
              Back
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          <div className="space-y-6">
            {Array.isArray(quizData.quiz) && quizData.quiz.map((q: any, idx: number) => (
              <div key={q.id ?? idx} className="border border-border rounded-xl p-4 bg-background">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-foreground/10 text-foreground flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="text-foreground font-medium">{q.question}</div>
                    {q.type === 'code_analysis' && q.code_snippet && (
                      <div className="rounded-md overflow-hidden border border-border">
                        <div className="bg-[#0b0b0b] text-gray-200 font-mono text-sm p-4 overflow-x-auto">
                          <pre className="whitespace-pre leading-6">
{`$ python
${q.code_snippet}`}
                          </pre>
                        </div>
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-3">
                      {Object.entries(q.options || {}).map(([key, value]) => (
                        <label
                          key={key}
                          className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:border-foreground/30"
                        >
                          <input type="radio" name={`q-${idx}`} value={key} className="accent-foreground" required />
                          <span className="font-semibold">{key}.</span>
                          <span className="text-foreground/90">{String(value)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button className="bg-foreground text-background" onClick={() => { /* placeholder submit */ }}>
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-8 space-y-6">
        {/* Header */}
        <div className="text-center mb-2">
          <div
            className="inline-flex items-center justify-center w-16 h-16 bg-foreground rounded-full mb-3 shadow-lg"
            aria-hidden
          >
            <Sparkles className="h-8 w-8 text-background" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Create Your Next Quiz
          </h2>
          <p className="text-muted-foreground">
            Describe your vision and watch AI bring it to life
          </p>
        </div>

        {/* Topic Input */}
        <div className="space-y-2">
          <Label className="text-foreground">Topic</Label>
          <div className="relative">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Quantum Mechanics"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground/70 pr-12 py-6 text-lg focus:border-foreground"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Difficulty + Count in a row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-foreground">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="High School">High School</SelectItem>
                <SelectItem value="Bachelors">Bachelors</SelectItem>
                <SelectItem value="Masters">Masters</SelectItem>
                <SelectItem value="PhD">PhD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Number of Questions</Label>
            <Input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value || "0"))}
              className="bg-background border-border text-foreground focus:border-foreground"
              min={1}
              required
            />
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-3">
          <Label className="text-foreground">
            Code vs Theory:{" "}
            <span className="text-blue-500">{balance[0]}% Code</span>,{" "}
            <span className="text-purple-500">{100 - balance[0]}% Theory</span>
          </Label>
          <Slider
            value={balance}
            onValueChange={(v) => setBalance(v)}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Small Generate Button aligned right */}
        <div className="flex justify-end">
          <motion.div whileHover={{ scale: isReasoning ? 1 : 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleGenerate}
              className="bg-foreground hover:bg-muted-foreground text-background transition-all duration-300 px-5 py-2 rounded-lg shadow-md flex items-center"
              disabled={isReasoning || isFetching}
              aria-disabled={isReasoning || isFetching}
              aria-busy={isReasoning || isFetching}
            >
              {isReasoning || isFetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isReasoning || isFetching ? "Thinking..." : "Generate"}
            </Button>
          </motion.div>
        </div>

        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}

        {/* World-class Reasoning Panel */}
        <AnimatePresence>
          {isReasoning && (
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
                {/* Timeline / Steps */}
                <div className="w-1/3">
                  <div className="flex flex-col items-start space-y-3">
                    {steps.map((_, i) => {
                      const Icon = stepIcons[i] ?? Cpu;
                      const active = i === stepIndex && isReasoning;
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
                            <Icon
                              className={`h-5 w-5 ${
                                active ? "text-foreground" : "text-muted-foreground"
                              }`}
                            />
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

                            {/* small progress under each item */}
                            <div className="w-full h-1 rounded-full bg-foreground/6 mt-2">
                              <motion.div
                                initial={{ width: done ? "100%" : "0%" }}
                                animate={{
                                  width:
                                    done
                                      ? "100%"
                                      : i === stepIndex
                                      ? `${Math.min(100, Math.round((progress / 100) * 100))}%`
                                      : "0%",
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

                {/* Typing / Streaming area */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Reasoning
                      </div>
                      <div className="text-sm text-muted-foreground">How the model is thinking</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{Math.min(100, progress)}%</div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 bg-card/60 border border-border rounded-lg p-3 min-h-[72px] flex items-center"
                  >
                    <div className="prose max-w-none">
                      <motion.p
                        key={stepIndex + "-" + typedText}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.28 }}
                        className="text-foreground text-sm leading-6 break-words"
                      >
                        <span>{typedText}</span>
                        {/* animated cursor */}
                        <motion.span
                          aria-hidden
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 1.1 }}
                          className="inline-block ml-1 align-middle w-[8px] h-4 bg-foreground"
                          style={{ display: "inline-block", marginLeft: 6, height: 16 }}
                        />
                      </motion.p>
                    </div>
                  </motion.div>

                  {/* streaming dots + progress bar */}
                  <div className="mt-3 flex items-center justify-between space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-2">
                        <motion.span
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 rounded-full bg-foreground/80"
                        />
                        <motion.span
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.12 }}
                          className="w-2 h-2 rounded-full bg-foreground/70"
                        />
                        <motion.span
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.24 }}
                          className="w-2 h-2 rounded-full bg-foreground/60"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground ml-3">Streaming reasoning</div>
                    </div>

                    {/* overall progress bar */}
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-foreground/6">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ type: "tween", duration: 0.45 }}
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
