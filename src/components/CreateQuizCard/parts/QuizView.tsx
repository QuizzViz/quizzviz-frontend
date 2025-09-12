import { FC } from "react";
import { Button } from "@/components/ui/button";

// Renders the generated quiz list with a back action
const QuizView: FC<{
  data: any;
  onBack: () => void;
}> = ({ data, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Quiz</h2>
        <Button variant="outline" className="border-border" onClick={onBack}>
          Back
        </Button>
      </div>

      {Array.isArray(data?.quiz) && data.quiz.length === 0 && (
        <div className="text-sm text-muted-foreground">No questions returned.</div>
      )}

      <div className="space-y-6">
        {Array.isArray(data?.quiz) &&
          data.quiz.map((q: any, idx: number) => (
            <div key={q.id ?? idx} className="border border-border rounded-xl p-4 bg-background">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-foreground/10 text-foreground flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="text-foreground font-medium">{q.question}</div>
                  {q.type === "code_analysis" && q.code_snippet && (
                    <div className="rounded-md overflow-hidden border border-border">
                      <div className="bg-[#0b0b0b] text-gray-200 font-mono text-sm p-4 overflow-x-auto">
                        <pre className="whitespace-pre leading-6">{`$ python\n${q.code_snippet}`}</pre>
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
        <Button className="bg-foreground text-background" onClick={() => { /* TODO: submit */ }}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default QuizView
