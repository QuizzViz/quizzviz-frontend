'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FC, useState, useEffect } from "react";
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
  "Software Engineer",
  "Associate Software Engineer (ASE)",
  "Associate Software Engineer (Open Stack)"
].sort();

const TECHNOLOGIES = [
    "Python", "Java", "JavaScript", "TypeScript", "C", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
    "Swift", "Kotlin", "Scala", "Perl", "Haskell", "MATLAB", "R", "SQL", "HTML5", "CSS3", "React", "Angular", "Vue", "Svelte", "Django", "Flask", "FastAPI",
    "Spring", "Express", "NextJS", "NestJS", "DotNet", ".NET", "Bootstrap", "Tailwind CSS", "jQuery",
    "MERN Stack", "MEAN Stack", "LAMP Stack", "JAMStack", "MEVN Stack",
    "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins", "Git", "GitHub", "GitLab", "CI/CD",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "DynamoDB", "Firebase", "Supabase",
    "Amazon Web Services (AWS)", "Microsoft Azure", "Google Cloud Platform (GCP)",
    "Compiler", "Interpreter", "Operating System", "Linux", "Unix", "Bash", "Shell", "Command Line", "API",
    "System Design", "Networking", "Database", "OOP", "DSA",
    "Node.js", "Maven", "GCC", "Make", "GDB", "CMake", "Cargo", "Ruby on Rails", "Laravel", "Xcode",
    "Redux", "Vuex", "Postman", "Vite", "Docker Compose", "Authentication", "Entity Framework", "Debugging", "Android"
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
  const [experience, setExperience] = useState('1-3');
  const [count, setCount] = useState(5);
  const [codePercentage, setCodePercentage] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [techSearch, setTechSearch] = useState('');
  const [showTechDropdown, setShowTechDropdown] = useState(false);

  // Role-based tech stack mapping
  const getRoleBasedTechStack = (selectedRole: string) => {
    const roleTechMap: { [key: string]: string[] } = {
      "Python Developer": ["Python", "Django", "Flask", "FastAPI", "PostgreSQL"],
      "Java Developer": ["Java", "Spring", "Maven", "MySQL", "Oracle"],
      "JavaScript Developer": ["JavaScript", "React", "Node.js", "Express", "MongoDB"],
      "TypeScript Developer": ["TypeScript", "React", "NextJS", "Node.js", "PostgreSQL"],
      "C Developer": ["C", "GCC", "Make", "GDB", "Linux"],
      "C++ Developer": ["C++", "GCC", "CMake", "GDB", "Linux"],
      "C# Developer": ["C#", ".NET", "Entity Framework", "MySQL", "Microsoft Azure"],
      "Go Developer": ["Go", "Docker", "Kubernetes", "PostgreSQL", "API"],
      "Rust Developer": ["Rust", "Cargo", "Linux", "API", "Database"],
      "Ruby Developer": ["Ruby", "Ruby on Rails", "PostgreSQL", "Redis", "API"],
      "PHP Developer": ["PHP", "Laravel", "MySQL", "Redis", "API"],
      "Swift Developer": ["Swift", "Xcode", "API", "Database", "Git"],
      "Kotlin Developer": ["Kotlin", "Android", "API", "Database", "Git"],
      "Scala Developer": ["Scala", "Java", "API", "Database", "Git"],
      "Perl Developer": ["Perl", "Linux", "API", "Database", "Git"],
      "Haskell Developer": ["Haskell", "Linux", "API", "Database", "Git"],
      "MATLAB Developer": ["MATLAB", "API", "Database", "Git", "Linux"],
      "R Developer": ["R", "API", "Database", "Git", "Linux"],
      "SQL Developer": ["SQL", "PostgreSQL", "MySQL", "Oracle", "Redis"],
      "HTML Developer": ["HTML5", "CSS3", "JavaScript", "Bootstrap", "jQuery"],
      "CSS Developer": ["CSS3", "Bootstrap", "Tailwind CSS", "HTML5", "JavaScript"],
      "React Developer": ["React", "JavaScript", "TypeScript", "Redux", "NextJS"],
      "Angular Developer": ["Angular", "TypeScript", "JavaScript", "Git", "API"],
      "Vue Developer": ["Vue", "JavaScript", "TypeScript", "Vuex", "Git"],
      "Svelte Developer": ["Svelte", "JavaScript", "TypeScript", "Vite", "Git"],
      "Django Developer": ["Django", "Python", "PostgreSQL", "Redis", "Docker"],
      "Flask Developer": ["Flask", "Python", "PostgreSQL", "Redis", "API"],
      "FastAPI Developer": ["FastAPI", "Python", "PostgreSQL", "Docker", "API"],
      "Spring Developer": ["Spring", "Java", "Maven", "MySQL", "API"],
      "Express Developer": ["Express", "Node.js", "JavaScript", "MongoDB", "API"],
      "NextJS Developer": ["NextJS", "React", "TypeScript", "Tailwind CSS"],
      "NestJS Developer": ["NestJS", "TypeScript", "Express", "PostgreSQL", "API"],
      ".NET Developer": [".NET", "C#", "Entity Framework", "Microsoft Azure", "Git"],
      "Bootstrap Developer": ["Bootstrap", "CSS3", "HTML5", "JavaScript", "jQuery"],
      "Tailwind CSS Developer": ["Tailwind CSS", "CSS3", "HTML5", "JavaScript", "React"],
      "jQuery Developer": ["jQuery", "JavaScript", "HTML5", "CSS3", "API"],
      "Docker Engineer": ["Docker", "Kubernetes", "Docker Compose", "Linux", "CI/CD"],
      "Kubernetes Engineer": ["Kubernetes", "Docker", "Linux", "CI/CD", "API"],
      "Terraform Engineer": ["Terraform", "Amazon Web Services (AWS)", "Microsoft Azure", "Google Cloud Platform (GCP)", "Git"],
      "Ansible Engineer": ["Ansible", "Python", "Linux", "Git", "API"],
      "Jenkins Engineer": ["Jenkins", "CI/CD", "Docker", "Linux", "Git"],
      "Git Specialist": ["Git", "GitHub", "GitLab", "Linux", "API"],
      "GitHub Specialist": ["GitHub", "Git", "CI/CD", "API", "Linux"],
      "GitLab Specialist": ["GitLab", "Git", "CI/CD", "Linux", "API"],
      "CI CD Engineer": ["CI/CD", "Jenkins", "Docker", "Linux", "Git"],
      "PostgreSQL Developer": ["PostgreSQL", "SQL", "Python", "Node.js", "Redis"],
      "MySQL Developer": ["MySQL", "SQL", "PHP", "Node.js", "MongoDB"],
      "MongoDB Developer": ["MongoDB", "Node.js", "Express", "API", "Database"],
      "Redis Developer": ["Redis", "Node.js", "Python", "API", "Database"],
      "SQLite Developer": ["SQLite", "SQL", "Python", "API", "Database"],
      "Oracle Database Developer": ["Oracle", "SQL", "Java", "API", "Database"],
      "DynamoDB Developer": ["DynamoDB", "Amazon Web Services (AWS)", "API", "Database", "Git"],
      "Firebase Developer": ["Firebase", "Google Cloud Platform (GCP)", "React", "Node.js", "API"],
      "Supabase Developer": ["Supabase", "PostgreSQL", "React", "Node.js", "Authentication"],
      "AWS Cloud Engineer": ["Amazon Web Services (AWS)", "Docker", "Linux", "API", "Git"],
      "Azure Cloud Engineer": ["Microsoft Azure", "Docker", "Linux", "API", "Git"],
      "GCP Cloud Engineer": ["Google Cloud Platform (GCP)", "Docker", "Linux", "API", "Git"],
      "Compiler Engineer": ["Compiler", "C++", "GCC", "Linux", "Git"],
      "Interpreter Engineer": ["Interpreter", "Python", "Java", "JavaScript", "Linux"],
      "Operating System Engineer": ["Operating System", "Linux", "C", "Git", "API"],
      "Linux Engineer": ["Linux", "Bash", "Shell", "Git", "API"],
      "Unix Engineer": ["Unix", "Shell", "C", "Git", "API"],
      "Bash Engineer": ["Bash", "Shell", "Linux", "Git", "API"],
      "Shell Scripting Engineer": ["Shell", "Bash", "Linux", "Git", "API"],
      "Command Line Engineer": ["Command Line", "Linux", "Bash", "Git", "API"],
      "API Developer": ["API", "Postman", "Authentication", "Git", "Linux"],
      "Software Engineer": ["System Design", "OOP", "DSA", "Database", "Networking"],
      "Associate Software Engineer (ASE)": ["System Design", "OOP", "DSA", "Database", "Networking"],
      "Associate Software Engineer (Open Stack)": ["System Design", "Networking", "Database", "OOP", "DSA"]
    };

    const techStack = roleTechMap[selectedRole];
    if (!techStack || techStack.length === 0) {
      return [];
    }

    // Filter to only include technologies that exist in the TECHNOLOGIES array
    const validTechs = techStack.filter(tech => TECHNOLOGIES.includes(tech));
    
    // Take first 3-4 technologies and distribute weights evenly
    const selectedTechs = validTechs.slice(0, 4);
    const weight = Math.floor(100 / selectedTechs.length);
    
    return selectedTechs.map((tech, index) => ({
      id: (index + 1).toString(),
      name: tech,
      weight: index === selectedTechs.length - 1 ? 100 - (weight * (selectedTechs.length - 1)) : weight
    }));
  };

  // Auto-select default stacks based on role
  useEffect(() => {
    if (role) {
      const defaultStacks = getRoleBasedTechStack(role);
      if (defaultStacks.length > 0) {
        setTechStack(defaultStacks);
      }
    }
  }, [role]);

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
                  
                  {/* Experience and Count */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-white font-medium text-sm">
                         Experience (Years)
                      </Label>
                      <Select value={experience} onValueChange={setExperience}>
                        <SelectTrigger className="h-10 bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500/50 transition-colors rounded-lg">
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                          <SelectItem value="0-1" className="text-white hover:bg-blue-500/20">0-1 years</SelectItem>
                          <SelectItem value="1-3" className="text-white hover:bg-blue-500/20">1-3 years</SelectItem>
                          <SelectItem value="3-5" className="text-white hover:bg-blue-500/20">3-5 years</SelectItem>
                          <SelectItem value="5+" className="text-white hover:bg-blue-500/20">5+ years</SelectItem>
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