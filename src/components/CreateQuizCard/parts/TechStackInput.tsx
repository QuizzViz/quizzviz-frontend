import { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Plus, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from "@/components/ui/combobox";
import { TOPICS } from "@/constants/topics";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export interface TechStackItem {
  id: string;
  name: string;
  weight: number;
}

interface TechStackInputProps {
  value: TechStackItem[];
  onChange: (value: TechStackItem[]) => void;
  availableTechs?: Array<{ value: string; label: string }>;
}

const DEFAULT_TECHS = [
  { id: '1', name: 'Python', weight: 70 },
  { id: '2', name: 'Git', weight: 10 },
  { id: '3', name: 'SQL', weight: 20 }
];

export function TechStackInput({ value, onChange, availableTechs: externalAvailableTechs }: TechStackInputProps) {
  const { toast } = useToast();
  const [selectedTech, setSelectedTech] = useState('');
  const maxTechs = 7;
  
  // Set default techs on component mount if no value is provided
  useEffect(() => {
    if (value.length === 0) {
      onChange([...DEFAULT_TECHS]);
    }
  }, []);
  
  // Get available topics that haven't been selected yet
  const internalAvailableTechs = useMemo(() => {
    const selectedTechs = new Set(value.map(item => item.name));
    return TOPICS
      .filter(tech => !selectedTechs.has(tech.value))
      .map(tech => ({ value: tech.value, label: tech.label }));
  }, [value]);

  // Use provided availableTechs if available, otherwise use internal ones
  const availableTechs = externalAvailableTechs || internalAvailableTechs;

  const addTech = useCallback((techName: string) => {
    if (!techName) return;
    
    if (value.length >= maxTechs) {
      toast({
        title: 'Maximum technologies reached',
        description: `You can add up to ${maxTechs} technologies.`,
        variant: 'destructive',
      });
      return;
    }

    const existingTech = value.find(item => 
      item.name.toLowerCase() === techName.toLowerCase()
    );

    if (existingTech) {
      toast({
        title: 'Technology already added',
        description: `${techName} is already in your tech stack.`,
        variant: 'destructive',
      });
      return;
    }

    const newTechItem: TechStackItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: techName,
      weight: 0,
    };

    // Update weights of existing items
    const updatedItems = [...value, newTechItem];
    
    // Distribute weights equally
    const equalWeight = Math.floor(100 / updatedItems.length);
    updatedItems.forEach(item => {
      item.weight = equalWeight;
    });
    
    // Adjust the last item to make sure total is 100
    const totalWeight = updatedItems.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight !== 100) {
      updatedItems[updatedItems.length - 1].weight += 100 - totalWeight;
    }

    onChange(updatedItems);
    setSelectedTech('');
  }, [value, onChange, toast]);

  const removeTech = useCallback((id: string) => {
    const updatedItems = value.filter(item => item.id !== id);
    
    // If there are remaining items, redistribute weights equally
    if (updatedItems.length > 0) {
      const equalWeight = Math.floor(100 / updatedItems.length);
      updatedItems.forEach(item => {
        item.weight = equalWeight;
      });
      
      // Ensure the total is exactly 100 due to rounding
      const total = updatedItems.reduce((sum, item) => sum + item.weight, 0);
      if (total !== 100) {
        updatedItems[0].weight += 100 - total;
      }
    }
    
    onChange(updatedItems);
    setSelectedTech('');
  }, [value, onChange]);

  const updateWeight = useCallback((id: string, newWeight: number) => {
    // Find the item being changed
    const changedItem = value.find(item => item.id === id);
    if (!changedItem) return;

    const oldWeight = changedItem.weight;
    const weightDiff = newWeight - oldWeight;

    // Get other items that can be adjusted
    const otherItems = value.filter(item => item.id !== id);
    
    if (otherItems.length === 0) {
      // Only one item, set it to 100
      onChange([{ ...changedItem, weight: 100 }]);
      return;
    }

    // Calculate total weight of other items
    const othersTotalWeight = otherItems.reduce((sum, item) => sum + item.weight, 0);
    
    // Check if we can make this change
    const newOthersTotalWeight = othersTotalWeight - weightDiff;
    
    if (newOthersTotalWeight < 0) {
      // Can't reduce others enough, set changed item to maximum possible
      const maxPossible = 100 - otherItems.length * 0; // Each other item can go to 0
      const updatedItems = value.map(item => 
        item.id === id ? { ...item, weight: Math.min(newWeight, maxPossible) } : { ...item, weight: 0 }
      );
      onChange(updatedItems);
      return;
    }

    // Distribute the weight difference proportionally among other items
    const updatedItems = value.map(item => {
      if (item.id === id) {
        return { ...item, weight: newWeight };
      }
      
      // Calculate proportional adjustment
      if (othersTotalWeight > 0) {
        const proportion = item.weight / othersTotalWeight;
        const adjustment = weightDiff * proportion;
        const newItemWeight = Math.max(0, item.weight - adjustment);
        return { ...item, weight: newItemWeight };
      } else {
        // If others are all 0, distribute equally
        return { ...item, weight: (100 - newWeight) / otherItems.length };
      }
    });

    // Final adjustment to ensure total is exactly 100
    const total = updatedItems.reduce((sum, item) => sum + item.weight, 0);
    if (Math.abs(total - 100) > 0.01) {
      const diff = 100 - total;
      // Apply difference to first item that's not being changed and is not at 0
      const adjustableItem = updatedItems.find(item => item.id !== id && item.weight > 0);
      if (adjustableItem) {
        adjustableItem.weight = Math.max(0, adjustableItem.weight + diff);
      } else if (updatedItems.length > 1) {
        // If all others are 0, adjust the changed item
        const changedInUpdated = updatedItems.find(item => item.id === id);
        if (changedInUpdated) {
          changedInUpdated.weight = 100;
        }
      }
    }
    
    onChange(updatedItems);
  }, [value, onChange]);

  const handleTechSelect = (techValue: string) => {
    if (!techValue) return;
    addTech(techValue);
    setSelectedTech('');
  };

  const distributeEqually = () => {
    if (value.length === 0) return;
    
    const equalWeight = Math.floor(100 / value.length);
    const updatedItems = value.map(item => ({
      ...item,
      weight: equalWeight
    }));
    
    // Adjust for rounding
    const total = updatedItems.reduce((sum, item) => sum + item.weight, 0);
    if (total !== 100) {
      updatedItems[0].weight += 100 - total;
    }
    
    onChange(updatedItems);
  };

  const totalWeight = value.reduce((sum, item) => sum + item.weight, 0);
  const isValidTotal = Math.abs(totalWeight - 100) < 0.1;

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-foreground text-lg font-semibold">Tech Stack</Label>
          </div>
          <Badge variant="outline" className="text-xs">
            {value.length}/{maxTechs} technologies
          </Badge>
        </div>
        
        {/* Add Technology Combobox */}
        <div className="space-y-2">
          {value.length < maxTechs && (
            <div className="relative">
              <Combobox
                options={availableTechs}
                value={selectedTech}
                onChange={(val) => {
                  setSelectedTech(val);
                  if (val) {
                    handleTechSelect(val);
                  }
                }}
                placeholder="Search and add technology..."
                className="w-full"
                inputClassName="h-11 text-base"
              />
            </div>
          )}
          
          {value.length >= maxTechs && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              Maximum number of technologies reached
            </div>
          )}
        </div>
        
        {/* Technology Pills */}
        {value.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
              {value.map((tech) => (
                <Badge
                  key={tech.id}
                  variant="secondary"
                  className="px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-all shadow-sm"
                >
                  <span>{tech.name}</span>
                  <span className="text-xs opacity-70">({Math.round(tech.weight)}%)</span>
                  <button
                    type="button"
                    onClick={() => removeTech(tech.id)}
                    className="hover:text-destructive transition-colors ml-1 hover:scale-110"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Weight Distribution Sliders */}
        {value.length > 0 && (
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span>Drag to adjust MCQ distribution</span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={distributeEqually}
                className="text-xs h-8"
              >
                Distribute Equally
              </Button>
            </div>
            
            <div className="space-y-4">
              {value.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-foreground">
                      {item.name}
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {Math.round(item.weight)}%
                    </span>
                  </div>
                  <Slider
                    value={[item.weight]}
                    onValueChange={([val]) => updateWeight(item.id, val)}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {value.length === 0 && (
          <div className="text-center py-12 px-4 border-2 border-dashed border-border rounded-lg">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No technologies selected. Add technologies to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}