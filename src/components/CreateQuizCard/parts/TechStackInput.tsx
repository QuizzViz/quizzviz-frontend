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
    const items = [...value];
    const changedIndex = items.findIndex(item => item.id === id);
    
    if (changedIndex === -1) return;
    
    // If this is the only item, set it to 100%
    if (items.length === 1) {
      onChange([{ ...items[0], weight: 100 }]);
      return;
    }
    
    // Clamp the new weight between 0 and 100
    let clampedWeight = Math.max(0, Math.min(100, Math.round(newWeight)));
    
    // Set the new weight for the changed item
    items[changedIndex].weight = clampedWeight;
    
    // Calculate remaining weight to distribute among other items
    let remainingWeight = 100 - clampedWeight;
    
    // Get other items (excluding the one being changed)
    const otherIndices = items.map((_, i) => i).filter(i => i !== changedIndex);
    
    // If no weight left or only one item, set all others to 0
    if (remainingWeight <= 0 || otherIndices.length === 0) {
      otherIndices.forEach(i => { items[i].weight = 0; });
      items[changedIndex].weight = 100;
      onChange([...items]);
      return;
    }
    
    // Calculate the total current weight of other items
    const totalOtherWeight = otherIndices.reduce((sum, i) => sum + items[i].weight, 0);
    
    if (totalOtherWeight <= 0) {
      // If other items have no weight, distribute remaining weight equally
      const baseWeight = Math.floor(remainingWeight / otherIndices.length);
      let distributed = 0;
      
      otherIndices.forEach((i, idx) => {
        if (idx === otherIndices.length - 1) {
          // Last item gets whatever is left to ensure total is exactly 100
          items[i].weight = remainingWeight - distributed;
        } else {
          items[i].weight = baseWeight;
          distributed += baseWeight;
        }
      });
    } else {
      // Distribute remaining weight proportionally based on current weights
      let distributed = 0;
      
      otherIndices.forEach((i, idx) => {
        if (idx === otherIndices.length - 1) {
          // Last item gets whatever is left to ensure total is exactly 100
          items[i].weight = remainingWeight - distributed;
        } else {
          // Distribute proportionally and round
          const proportion = items[i].weight / totalOtherWeight;
          const newWeight = Math.round(proportion * remainingWeight);
          items[i].weight = newWeight;
          distributed += newWeight;
        }
      });
    }
    
    // Final safety check: ensure total is exactly 100
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    if (total !== 100) {
      // Adjust the first non-changed item to compensate
      const adjustIndex = otherIndices[0];
      if (adjustIndex !== undefined) {
        items[adjustIndex].weight += (100 - total);
        // Ensure it doesn't go negative
        if (items[adjustIndex].weight < 0) {
          items[adjustIndex].weight = 0;
          items[changedIndex].weight += items[adjustIndex].weight;
        }
      }
    }
    
    onChange([...items]);
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
    <div className="space-y-3">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-foreground text-sm">Tech Stack</Label>
          </div>
          <Badge className="text-xs bg-gradient-to-r from-green-500 to-blue-500 text-white border-0">
            {value.length}/{maxTechs} technologies
          </Badge>
        </div>
        
        {/* Add Technology Combobox */}
        <div className="space-y-1">
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
                inputClassName="h-9 text-sm"
              />
            </div>
          )}
          
          {value.length >= maxTechs && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 p-2 bg-muted/50 rounded-md">
              <AlertCircle className="h-3.5 w-3.5" />
              Maximum number of technologies reached
            </div>
          )}
        </div>
        
        {/* Technology Pills */}
        {value.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 p-2 bg-muted/20 rounded-md border border-border/30">
              {value.map((tech) => (
                <Badge
                  key={tech.id}
                  variant="secondary"
                  className="px-2.5 py-1 text-xs font-normal flex items-center gap-1 hover:bg-secondary/80 transition-all"
                >
                  <span>{tech.name}</span>
                  <span className="text-[11px] opacity-70">({Math.round(tech.weight)}%)</span>
                  <button
                    type="button"
                    onClick={() => removeTech(tech.id)}
                    className="hover:text-destructive transition-colors -mr-1 hover:scale-110"
                  >
                    <X className="h-3 w-3" />
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
                className="text-xs h-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
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