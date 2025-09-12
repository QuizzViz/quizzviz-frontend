import { FC } from "react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

// Primary CTA button used to trigger quiz generation
export const GenerateButton: FC<{
  isBusy: boolean;
  onClick: () => void;
  labelBusy: string;
  labelIdle: string;
  leftIconBusy: LucideIcon;
  leftIconIdle: LucideIcon;
}> = ({ isBusy, onClick, labelBusy, labelIdle, leftIconBusy: BusyIcon, leftIconIdle: IdleIcon }) => {
  return (
    <div className="flex justify-end">
      <motion.div whileHover={{ scale: isBusy ? 1 : 1.04 }} whileTap={{ scale: 0.97 }}>
        <Button
          onClick={onClick}
          className="bg-foreground hover:bg-muted-foreground text-background transition-all duration-300 px-5 py-2 rounded-lg shadow-md flex items-center"
          disabled={isBusy}
          aria-disabled={isBusy}
          aria-busy={isBusy}
        >
          {isBusy ? <BusyIcon className="h-4 w-4 mr-2 animate-spin" /> : <IdleIcon className="h-4 w-4 mr-2" />}
          {isBusy ? labelBusy : labelIdle}
        </Button>
      </motion.div>
    </div>
  );
};
