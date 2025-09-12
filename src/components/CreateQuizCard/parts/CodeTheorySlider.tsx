import { FC } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Two-way slider to balance code vs theory question percentages
const CodeTheorySlider: FC<{
  balance: number[];
  setBalance: (v: number[]) => void;
}> = ({ balance, setBalance }) => {
  return (
    <div className="space-y-3">
      <Label className="text-foreground">
        Move the slider to choose how much is Code and how much is Theory <span className="text-white">{balance[0]}% Code</span>,
        <span className="text-white"> {100 - balance[0]}% Theory</span>
      </Label>
      <Slider value={balance} onValueChange={(v) => setBalance(v)} max={100} step={5} className="w-full" />
    </div>
  );
};

export default CodeTheorySlider
