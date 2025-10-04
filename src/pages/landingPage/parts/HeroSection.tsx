import { FC, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { 
  ArrowRight, 
  Zap, 
  Users, 
  Briefcase, 
  User, 
  Shield, 
  Target,
  TrendingUp,
  CheckCircle, 
  Clock, 
  Lock,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useUserType, UserType } from "@/contexts/UserTypeContext";

export interface UserTypeConfig {
  id: UserType;
  label: string;
  icon: FC<{ className?: string }>;
  description: string;
}

export const USER_TYPES: UserTypeConfig[] = [
  { 
    id: 'individual', 
    label: 'Individual', 
    icon: User, 
    description: 'Practice, Learn & Evaluate' 
  },
  { 
    id: 'business', 
    label: 'Business', 
    icon: Briefcase, 
    description: 'Hire Smarter & Faster'
  }
 
];

interface DifficultyLevel {
  value: string;
  label: string;
}

const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { value: 'High School Level', label: 'High School Level' },
  { value: 'Bachelors Level', label: 'Bachelors Level' },
  { value: 'Masters Level', label: 'Masters Level' },
  { value: 'PhD Level', label: 'PhD Level' }
];

const HeroSection: FC = () => {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const { userType, setUserType } = useUserType();
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Bachelors Level');
  const [count, setCount] = useState<number>(5);
  const [codePercentage, setCodePercentage] = useState<number>(50);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic to generate your quiz.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    const queryParams = new URLSearchParams({
      topic: topic.trim(),
      difficulty,
      count: count.toString(),
      codePercentage: codePercentage.toString(),
      userType
    });

    if (!user) {
      await router.push(`/signup?redirect=/dashboard&${queryParams.toString()}`);
      return;
    }

    router.push(`/dashboard?${queryParams.toString()}`);
  };

  const updateCount = (value: number) => {
    const min = 1;
    const max = userType === 'individual' ? 20 : 50;
    setCount(Math.min(Math.max(value, min), max));
  };

  useEffect(() => {
    if (isGenerating) {
      const timer = setTimeout(() => setIsGenerating(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating]);

  const getHeadlineText = (): { main: string; sub: string } => {
    const common = {
      main: "AI-Powered Coding Quiz Generation",
      sub: "with Proctoring in Minutes"
    };
    
    switch(userType) {
      case 'individual':
      case 'business':
      default:
        return common;
    }
  };

  const getDescription = (): string => {
    switch(userType) {
      case 'individual':
        return "Generate coding quizzes in minutes that test coding concepts with real-world scenarios, practice in a secure proctored environment, and get instant feedback.";
      case 'business':
        return "Generate coding quizzes in minutes that test coding concepts with real-world scenarios, share secure proctored assessments, and analyze results for smarter hiring.";
      default:
        return "Generate coding quizzes in minutes with our AI-powered platform.";
    }
  };

  const headline = getHeadlineText();

  return (
    <section id="hero" className="relative overflow-hidden pt-8 sm:pt-10 md:pt-16 lg:pt-20 pb-6 min-h-[80vh] scroll-mt-20 sm:scroll-mt-24 md:scroll-mt-28">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-background" />
      <div aria-hidden className="absolute right-[-12%] top-10 w-[65vw] max-w-[980px] aspect-square rounded-[36%] bg-[radial-gradient(60%_60%_at_30%_30%,rgba(147,197,253,0.25),rgba(59,130,246,0.12)_45%,rgba(34,197,94,0.08)_75%,transparent_85%)] blur-3xl opacity-70" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(80vh-6rem)] py-6">
          
          {/* Headline Section */}
          <div className="text-center mb-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-md border border-green-500/30 text-white text-sm font-medium mb-4 shadow-md">
              <Sparkles className="w-4 h-4 text-green-300" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-blue-300">AI-Powered Proctored Coding Assessments</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
              {headline.main}
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">{headline.sub}</span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-200 mb-6 leading-relaxed max-w-3xl mx-auto">
              {getDescription()}
            </p>
          </div>

          {/* User Type Selector */}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {USER_TYPES.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => setUserType(id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm ${
                  userType === id
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md scale-105'
                    : 'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="text-xs opacity-80">{description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Quiz Generator Card - Full Width */}
          <div className="w-full max-w-5xl">
            <Card className="bg-black/30 backdrop-blur-lg border border-white/10 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-white/10">
                <CardTitle className="text-xl font-bold text-white text-center">
                  {userType === 'individual' ? 'Generate Your Practice Coding Quiz' : 'Create Your Coding Assessment'}
                </CardTitle>
                <CardDescription className="text-gray-300 text-center text-sm">
                  {userType === 'individual' 
                    ? 'Start practicing'
                    : 'Build secure assessments and evaluate candidates effectively'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  {/* Topic Input */}
                  <div className="space-y-1">
                    <Label htmlFor="topic" className="text-white font-medium text-sm">
                      Topic
                    </Label>
                    <Input
                      id="topic"
                      placeholder="e.g. React, Python, System Design"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="h-10 text-sm bg-white/5 border border-white/10 text-white placeholder:text-gray-400 focus:border-green-500/50 transition-colors rounded-lg"
                      required
                    />
                  </div>
                  
                  {/* Difficulty and Count */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="difficulty" className="text-white font-medium text-sm">
                        Difficulty Level
                      </Label>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger className="h-10 bg-white/5 border border-white/10 text-white text-sm focus:border-green-500/50 transition-colors rounded-lg">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value} className="text-white hover:bg-green-500/20">
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="count" className="text-white font-medium text-sm">
                        Questions: {count}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 text-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-lg transition-colors"
                          onClick={() => updateCount(count - 1)}
                          disabled={count <= 1}
                        >
                          −
                        </Button>
                        <Input
                          id="count"
                          type="number"
                          min="1"
                          max={userType === 'individual' ? 20 : 50}
                          value={count}
                          onChange={(e) => updateCount(parseInt(e.target.value) || 1)}
                          className="text-center h-10 text-lg font-bold bg-white/5 border border-white/10 text-white focus:border-green-500/50 rounded-lg transition-colors"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 text-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-lg transition-colors"
                          onClick={() => updateCount(count + 1)}
                          disabled={count >= (userType === 'individual' ? 20 : 50)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Code/Theory Mix */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="code-percentage" className="text-white font-medium text-sm">
                        Question Mix
                      </Label>
                      <div className="text-xs font-semibold  bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
                        {codePercentage}% Coding • {100 - codePercentage}% Theory
                      </div>
                    </div>
                    <input
                      type="range"
                      id="code-percentage"
                      min="0"
                      max="100"
                      step="10"
                      value={codePercentage}
                      onChange={(e) => setCodePercentage(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full  cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-green-400 [&::-webkit-slider-thumb]:to-blue-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-white/20 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-green-400 [&::-moz-range-thumb]:to-blue-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg"
                    />
                  </div>
                  
                  {/* Generate Button */}
                  <Button 
                    onClick={handleGenerate}
                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-xl group rounded-lg"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Generating...
                      </span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        {user 
                          ? 'Generate Quiz' 
                          : 'Generate Free Quiz'}
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>

                  {/* Trust Indicators */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-gray-300">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-green-400" />
                      <span>In minutes</span>
                    </div>
                    <span className="hidden sm:inline text-white/30">|</span>
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-blue-400" />
                      <span>Proctored</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;