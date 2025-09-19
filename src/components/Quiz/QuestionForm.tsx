import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuestionFormData } from "./types";
import React from "react";

interface QuestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionFormData) => void;
  initialData: QuestionFormData;
  isSubmitting?: boolean;
}

export function QuestionForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData,
  isSubmitting = false 
}: QuestionFormProps) {
  const [form, setForm] = React.useState<QuestionFormData>(initialData);

  React.useEffect(() => {
    if (isOpen) {
      setForm(initialData);
    }
  }, [isOpen, initialData]);

  const handleFormChange = <K extends keyof QuestionFormData>(
    key: K, 
    value: QuestionFormData[K]
  ) => {
    setForm(prev => ({
      ...prev, 
      [key]: value,
      // Reset code_snippet when type changes to theory
      ...(key === 'type' && value === 'theory' ? { code_snippet: '' } : {})
    }));
  };

  const handleOptionChange = (key: "A" | "B" | "C" | "D", value: string) => {
    setForm(prev => ({
      ...prev, 
      options: { 
        ...prev.options, 
        [key]: value 
      } 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Update Question" : "Add Question"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="question" className="block text-sm mb-1">
                Question
              </Label>
              <textarea
                id="question"
                value={form.question}
                onChange={(e) => handleFormChange("question", e.target.value)}
                className="w-full rounded-md bg-zinc-900 border border-white/10 p-3 min-h-[100px]"
                required
              />
            </div>
            
            {form.type === "code_analysis" && (
              <div>
                <Label htmlFor="codeSnippet" className="block text-sm mb-1">
                  Code Snippet
                </Label>
                <textarea
                  id="codeSnippet"
                  value={form.code_snippet || ""}
                  onChange={(e) => handleFormChange("code_snippet", e.target.value)}
                  className="w-full rounded-md bg-zinc-900 border border-white/10 p-3 font-mono min-h-[120px]"
                  required={form.type === "code_analysis"}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="questionType" className="block text-sm mb-1">
                  Question Type
                </Label>
                <select
                  id="questionType"
                  value={form.type}
                  onChange={(e) => handleFormChange("type", e.target.value as "theory" | "code_analysis")}
                  className="w-full rounded-md bg-zinc-900 border border-white/10 p-2"
                >
                  <option value="theory">Theory</option>
                  <option value="code_analysis">Code Analysis</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="correctAnswer" className="block text-sm mb-1">
                  Correct Answer
                </Label>
                <select
                  id="correctAnswer"
                  value={form.correct_answer}
                  onChange={(e) => handleFormChange("correct_answer", e.target.value as "A" | "B" | "C" | "D")}
                  className="w-full rounded-md bg-zinc-900 border border-white/10 p-2"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['A', 'B', 'C', 'D'] as const).map((option) => (
                <div key={option}>
                  <Label htmlFor={`option-${option}`} className="block text-sm mb-1">
                    Option {option}
                  </Label>
                  <Input
                    id={`option-${option}`}
                    value={form.options[option]}
                    onChange={(e) => handleOptionChange(option, e.target.value)}
                    className="w-full rounded-md bg-zinc-900 border-white/10"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !form.question || !Object.values(form.options).every(Boolean) || (form.type === 'code_analysis' && !form.code_snippet)}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
