import { useState, useCallback, useMemo } from 'react';
import { X, Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
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
}

// Convert topics to the format expected by Combobox
const topicOptions = TOPICS.map(topic => ({
  value: topic.value,
  label: topic.label
}));

export function TechStackInput({ value, onChange }: TechStackInputProps) {
  const { toast } = useToast();
  const [selectedTech, setSelectedTech] = useState('');
  const maxTechs = 5; // Reduced for better UX
  
  // Get available topics that haven't been selected yet
  const availableTechs = useMemo(() => {
    const selectedTechs = new Set(value.map(item => item.name));
    return TOPICS
      .filter(tech => !selectedTechs.has(tech.value))
      .map(tech => ({ value: tech.value, label: tech.label }));
  }, [value]);

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
      weight: value.length > 0 ? 0 : 100, // First item gets 100%, others start at 0
    };

    // Update weights of existing items
    const updatedItems = [...value, newTechItem];
    
    // If this is not the first item, distribute weights
    if (value.length > 0) {
      const equalWeight = Math.floor(100 / updatedItems.length);
      updatedItems.forEach(item => {
        item.weight = equalWeight;
      });
      
      // Adjust the last item to make sure total is 100
      const totalWeight = updatedItems.reduce((sum, item) => sum + item.weight, 0);
      if (totalWeight !== 100) {
        updatedItems[updatedItems.length - 1].weight += 100 - totalWeight;
      }
    }

    onChange(updatedItems);
    setSelectedTech('');
  }, [value, onChange, toast]);

  const removeTech = useCallback((id: string) => {
    const updatedItems = value.filter(item => item.id !== id);
    
    // If there are remaining items, redistribute weights
    if (updatedItems.length > 0) {
      const remainingWeight = updatedItems.reduce((sum, item) => sum + item.weight, 0);
      const adjustment = (100 - remainingWeight) / updatedItems.length;
      
      updatedItems.forEach(item => {
        item.weight = Math.round((item.weight + adjustment) * 100) / 100;
      });
      
      // Ensure the total is exactly 100 due to rounding
      const total = updatedItems.reduce((sum, item) => sum + item.weight, 0);
      if (total !== 100 && updatedItems.length > 0) {
        updatedItems[0].weight += 100 - total;
      }
    }
    
    onChange(updatedItems);
    setSelectedTech('');
  }, [value, onChange]);

  const updateWeight = useCallback((id: string, newWeight: number) => {
    const updatedItems = value.map(item => 
      item.id === id ? { ...item, weight: newWeight } : item
    );
    
    // Ensure the total is 100 by adjusting the first item if needed
    const totalWeight = updatedItems.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight !== 100 && updatedItems.length > 0) {
      updatedItems[0].weight += 100 - totalWeight;
    }
    
    onChange(updatedItems);
  }, [value, onChange]);

  const handleTechSelect = (techValue: string) => {
    if (!techValue) return;
    addTech(techValue);
    setSelectedTech('');
  };

  const totalWeight = value.reduce((sum, item) => sum + item.weight, 0);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-foreground text-base">Tech Stack</Label>
          <div className="text-sm text-muted-foreground">
            {value.length}/{maxTechs} selected
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Combobox
              options={availableTechs}
              value={selectedTech}
              onChange={(val) => {
                setSelectedTech(val);
                if (val) {
                  handleTechSelect(val);
                }
              }}
              placeholder="Search technologies..."
              className="w-full"
              inputClassName="h-10"
            />
          </div>
        </div>

        {value.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            {value.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-sm font-medium">
                        {item.name}
                      </Badge>
                      <span className="text-sm font-medium text-muted-foreground">
                        {Math.round(item.weight)}%
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeTech(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[item.weight]}
                      onValueChange={([val]) => updateWeight(item.id, val)}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${item.weight}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Distribution</span>
            <span>Total: {Math.round(value.reduce((sum, item) => sum + item.weight, 0))}%</span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
