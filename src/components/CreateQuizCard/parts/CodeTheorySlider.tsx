"use client";

import { FC, useState } from "react";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";

const CodeTheoryInput: FC = () => {
  const [code, setCode] = useState(50);

  const handleCodeChange = (value: number) => {
    if (value < 0) value = 0;
    if (value > 100) value = 100;
    setCode(value);
  };

  return (
    <div className="space-y-3">
      <Label className="text-foreground">
        Choose percentage split between Code and Theory
      </Label>

      <div className="flex items-center gap-8">
        {/* Code */}
        <div className="flex items-center gap-2">
          <span className="text-white">Code:</span>
          <div className="flex items-center bg-white/10 rounded-xl shadow-inner">
            <button
              onClick={() => handleCodeChange(code - 5)}
              className="p-2 text-white hover:bg-white/20 rounded-l-xl"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              min={0}
              max={100}
              value={code}
              onChange={(e) => handleCodeChange(Number(e.target.value))}
              className="w-16 px-2 py-1 text-center bg-transparent text-white focus:outline-none"
            />
            <button
              onClick={() => handleCodeChange(code + 5)}
              className="p-2 text-white hover:bg-white/20 rounded-r-xl"
            >
              <Plus size={16} />
            </button>
          </div>
          <span className="text-white">%</span>
        </div>

        {/* Theory (readonly) */}
        <div className="flex items-center gap-2">
          <span className="text-white">Theory:</span>
          <div className="w-16 px-2 py-1 text-center bg-white/10 rounded-xl text-white opacity-80">
            {100 - code}
          </div>
          <span className="text-white">%</span>
        </div>
      </div>
    </div>
  );
};

export default CodeTheoryInput;
