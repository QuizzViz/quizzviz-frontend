'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FC, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Zap, X, Code, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";

const ROLES = [
  "Python Developer",
  "Java Developer",
  "JavaScript Developer",
  "TypeScript Developer",
  "C Developer",
  "C++ Developer",
  "C# Developer",
  "Go Developer",
  "Rust Developer",
  "Ruby Developer",
  "PHP Developer",
  "Swift Developer",
  "Kotlin Developer",
  "Scala Developer",
  "Perl Developer",
  "Haskell Developer",
  "MATLAB Developer",
  "R Developer",
  "SQL Developer",
  "HTML Developer",
  "CSS Developer",
  "React Developer",
  "Angular Developer",
  "Vue Developer",
  "Svelte Developer",
  "Django Developer",
  "Flask Developer",
  "FastAPI Developer",
  "Spring Developer",
  "Express Developer",
  "NextJS Developer",
  "NestJS Developer",
  ".NET Developer",
  "Bootstrap Developer",
  "Tailwind CSS Developer",
  "jQuery Developer",
  "Docker Engineer",
  "Kubernetes Engineer",
  "Terraform Engineer",
  "Ansible Engineer",
  "Jenkins Engineer",
  "Git Specialist",
  "GitHub Specialist",
  "GitLab Specialist",
  "CI CD Engineer",
  "PostgreSQL Developer",
  "MySQL Developer",
  "MongoDB Developer",
  "Redis Developer",
  "SQLite Developer",
  "Oracle Database Developer",
  "DynamoDB Developer",
  "Firebase Developer",
  "Supabase Developer",
  "AWS Cloud Engineer",
  "Azure Cloud Engineer",
  "GCP Cloud Engineer",
  "Compiler Engineer",
  "Interpreter Engineer",
  "Operating System Engineer",
  "Linux Engineer",
  "Unix Engineer",
  "Bash Engineer",
  "Shell Scripting Engineer",
  "Command Line Engineer",
  "API Developer",
  "Software Engineer"
].sort();

const TECHNOLOGIES = [
  "JavaScript", "Python", "Java", "TypeScript", "C++", "C#", "Ruby", "Go", "Rust", "PHP",
  "React", "Vue", "Angular", "Svelte", "Node.js", "Django", "Flask", "Spring", "Express",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP", "PostgreSQL", "MongoDB", "MySQL", "Redis",
  "Git", "GitHub", "GitLab", "Jenkins", "Terraform", "Ansible"
].sort();

const HeroSection: FC = () => {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [role, setRole] = useState('Software Engineer');
  const [techStack, setTechStack] = useState<Array<{ id: string; name: string; weight: number }>>([
    { id: '1', name: 'Python', weight: 70 },
    { id: '2', name: 'Git', weight: 10 },
    { id: '3', name: 'SQL', weight: 20 }
  ]);
  const [difficulty, setDifficulty] = useState('Bachelors Level');
  const [count, setCount] = useState(5);
  const [codePercentage, setCodePercentage] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [techSearch, setTechSearch] = useState('');
  const [showTechDropdown, setShowTechDropdown] = useState(false);

  const updateCount = (value: number) => {
    const min = 1;
    const max = 20;
    setCount(Math.min(Math.max(value, min), max));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true); // Show loading state

    try {
      if (!isSignedIn) {
        await router.push(`/signin?redirect_url=${encodeURIComponent('/dashboard')}`);
      } else {
        await router.push('/dashboard');
      }
    } finally {
      // Reset loading state if navigation fails
      setTimeout(() => setIsGenerating(false), 2000);
    }
  };

  const addTechnology = (tech: string) => {
    if (!techStack.find(t => t.name === tech)) {
      const newId = (Math.max(0, ...techStack.map(t => parseInt(t.id))) + 1).toString();
      setTechStack([...techStack, { id: newId, name: tech, weight: 0 }]);
    }
    setTechSearch('');
    setShowTechDropdown(false);
  };

  const removeTechnology = (id: string) => {
    setTechStack(techStack.filter(t => t.id !== id));
  };

  const updateTechWeight = (id: string, weight: number) => {
    setTechStack(techStack.map(t => t.id === id ? { ...t, weight: Math.max(0, Math.min(100, weight)) } : t));
  };

  const distributeEqually = () => {
    if (techStack.length === 0) return;
    const equalWeight = Math.floor(100 / techStack.length);
    const remainder = 100 - (equalWeight * techStack.length);
    setTechStack(techStack.map((t, i) => ({ ...t, weight: equalWeight + (i === 0 ? remainder : 0) })));
  };

  const filteredTechs = TECHNOLOGIES.filter(tech => 
    tech.toLowerCase().includes(techSearch.toLowerCase()) &&
    !techStack.find(t => t.name === tech)
  );

  const totalWeight = techStack.reduce((sum, t) => sum + t.weight, 0);

  const headline = {
    main: "Stop Interviewing Devs who can't code",
    sub: "Send a quiz. Only interview devs who pass."
  };

  return (
    <section id="hero" className="relative overflow-hidden pt-8 sm:pt-10 md:pt-16 lg:pt-20 pb-6 min-h-[80vh] scroll-mt-20 sm:scroll-mt-24 md:scroll-mt-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-background" />
      <div aria-hidden className="absolute right-[-12%] top-10 w-[65vw] max-w-[980px] aspect-square rounded-[36%] bg-[radial-gradient(60%_60%_at_30%_30%,rgba(147,197,253,0.25),rgba(59,130,246,0.12)_45%,rgba(34,197,94,0.08)_75%,transparent_85%)] blur-3xl opacity-70" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(80vh-6rem)] py-6">
          
          <div className="text-center mb-10 max-w-4xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
              {headline.main}
            </h1>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent max-w-3xl mx-auto">
              {headline.sub}
            </p>
          </div>

          <div className="w-full max-w-5xl">
            <Card className="bg-black/30 backdrop-blur-lg border border-white/10 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-white/10">
                <CardTitle className="text-xl font-bold text-center">
                  <span className="bg-gradient-to-r from-teal-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                    Create a Technical Assessment
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-300 text-center text-sm">
                  Design secure coding tests to identify top technical talent
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  {/* Role */}
                  <div className="space-y-2 w-full">
                    <Label className="text-white font-medium text-sm">Role</Label>
                    <Combobox
                      options={ROLES.map(role => ({ value: role, label: role }))}
                      value={role}
                      onChange={setRole}
                      placeholder="Select or search for a role..."
                      className="w-full text-white"
                      inputClassName="h-10 bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                      popoverClassName="bg-gray-900 border border-white/10"
                    />
                  </div>
                  
                  {/* Tech Stack */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white font-medium text-sm">Tech Stack</Label>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white">
                        {techStack.length}/{TECHNOLOGIES.length} technologies
                      </span>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={techSearch}
                        onChange={(e) => {
                          setTechSearch(e.target.value);
                          setShowTechDropdown(true);
                        }}
                        onFocus={() => setShowTechDropdown(true)}
                        placeholder="Search and add technology..."
                        className="h-10 pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                      {showTechDropdown && filteredTechs.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-gray-900 border border-white/10 rounded-lg shadow-lg">
                          {filteredTechs.map(tech => (
                            <div
                              key={tech}
                              onClick={() => addTechnology(tech)}
                              className="px-3 py-2 text-sm text-white hover:bg-blue-500/20 cursor-pointer"
                            >
                              {tech}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Technologies as Chips */}
                    {techStack.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {techStack.map(tech => (
                          <div
                            key={tech.id}
                            className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white"
                          >
                            <span>{tech.name}</span>
                            <span className="text-xs text-gray-400">({tech.weight}%)</span>
                            <button
                              onClick={() => removeTechnology(tech.id)}
                              className="ml-1 hover:text-red-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Distribution Instruction */}
                    {techStack.length > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-400 text-xs">Drag to adjust MCQ distribution</Label>
                          <Button
                            onClick={distributeEqually}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 hover:brightness-110"
                          >
                            Distribute Equally
                          </Button>
                        </div>

                        {/* Technology Sliders */}
                        <div className="space-y-3">
                          {techStack.map(tech => (
                            <div key={tech.id} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Label className="text-white text-sm">{tech.name}</Label>
                                <span className="text-white font-bold text-sm">{tech.weight}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={tech.weight}
                                onChange={(e) => updateTechWeight(tech.id, parseInt(e.target.value))}
                                className="w-full h-2 rounded-full cursor-pointer appearance-none"
                                style={{
                                  background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(59, 130, 246) ${tech.weight}%, rgba(255,255,255,0.1) ${tech.weight}%, rgba(255,255,255,0.1) 100%)`
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Difficulty and Count */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="difficulty" className="text-white font-medium text-sm">
                        Difficulty Level
                      </Label>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger className="h-10 bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500/50 transition-colors rounded-lg">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                          <SelectItem value="High School Level" className="text-white hover:bg-blue-500/20">High School Level</SelectItem>
                          <SelectItem value="Bachelors Level" className="text-white hover:bg-blue-500/20">Bachelors Level</SelectItem>
                          <SelectItem value="Masters Level" className="text-white hover:bg-blue-500/20">Masters Level</SelectItem>
                          <SelectItem value="PhD Level" className="text-white hover:bg-blue-500/20">PhD Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="count" className="text-white font-medium text-sm">
                        Total Questions
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
                          max="20"
                          value={count}
                          onChange={(e) => updateCount(parseInt(e.target.value) || 1)}
                          className="text-center h-10 text-lg font-bold bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:ring-0 focus:ring-offset-0 rounded-lg transition-colors"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 text-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-lg transition-colors"
                          onClick={() => updateCount(count + 1)}
                          disabled={count >= 20}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Question Distribution */}
                  <div className="space-y-3">
                    <Label className="text-white font-medium text-sm">Question Distribution</Label>
                    
                    <div className="text-center text-sm text-gray-400">
                      Drag to choose how many MCQs from Code vs Theory
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div className="text-left">
                        <div className="flex items-center gap-2 text-white">
                          <Code className="w-3 h-4" />
                          <span className="font-medium">Code</span>
                        </div>
                        <div className="text-2xl font-bold text-white mt-1">{codePercentage}%</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end text-white">
                          <BookOpen className="w-4 h-4" />
                          <span className="font-medium">Theory</span>
                        </div>
                        <div className="text-2xl font-bold text-white mt-1">{100 - codePercentage}%</div>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={codePercentage}
                      onChange={(e) => setCodePercentage(parseInt(e.target.value))}
                      className="w-full h-2 rounded-full cursor-pointer appearance-none"
                      style={{
                        background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(59, 130, 246) ${codePercentage}%, rgb(75, 85, 99) ${codePercentage}%, rgb(75, 85, 99) 100%)`
                      }}
                    />
                  </div>
                  
                  {/* Generate Button */}
                  <Button
                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-green-500 to-blue-500 hover:brightness-110 text-white transition-all duration-300 shadow-md hover:shadow-xl rounded-lg"
                    onClick={handleGenerate}
                    disabled={!role || techStack.length === 0 || isGenerating}
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Redirecting...
                      </span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Generate Quiz
                      </>
                    )}
                  </Button>
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