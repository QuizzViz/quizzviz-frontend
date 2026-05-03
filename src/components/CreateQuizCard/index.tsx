import { Card, CardContent } from "@/components/ui/card";
import { Zap, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import QuizHeader from "./parts/QuizHeader";
import ExperienceCountRow from "./parts/ExperienceCountRow";
import CodeTheorySlider from "./parts/CodeTheorySlider";
import ReasoningPanel from "./parts/ReasoningPanel";
import FileUpload from "./parts/FileUpload";
import { useCreateQuizV2 } from "./hooks/useCreateQuizV2";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useQuizUsage } from "@/hooks/useQuizUsage";
import { usePlanLimits, getLimitMessage, getUpgradeCTA } from "@/hooks/usePlanLimits";
import { useUser } from "@clerk/nextjs";
import { useUserPlan } from "@/hooks/useUserPlan";
import { RoleSelect } from "./parts/RoleSelect";
import { TechStackInput } from "./parts/TechStackInput";
import { TECHNOLOGIES } from "@/constants/technologies";

interface CreateQuizCardProps {
  maxQuestions?: number;
  isLimitReached?: boolean;
  onUpgradeClick?: () => void;
  userRole?: "OWNER" | "ADMIN" | "MEMBER";
}

interface TechStackItem {
  id: string;
  name: string;
  weight: number;
}

export default function CreateQuizCard({
  maxQuestions: propMaxQuestions,
  isLimitReached = false,
  onUpgradeClick,
  userRole,
}: CreateQuizCardProps) {
  const maxQuestions = propMaxQuestions || 100;
  const [codePercentage, setCodePercentage] = useState(50);
  const [role, setRole] = useState("Software Engineer");
  const [techStack, setTechStack] = useState<TechStackItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const getRoleBasedTechStack = (selectedRole: string): TechStackItem[] => {
    const roleTechMap: { [key: string]: string[] } = {
      "Python Developer": ["Python", "Django", "Flask", "FastAPI", "PostgreSQL"],
      "Java Developer": ["Java", "Spring", "Maven", "MySQL", "Oracle"],
      "JavaScript Developer": ["JavaScript", "Node.js", "React", "Database", "API"],
      "TypeScript Developer": ["TypeScript", "React", "NextJS", "Node.js", "PostgreSQL"],
      "C Developer": ["C", "GCC", "Make", "GDB", "Linux"],
      "C++ Developer": ["C++", "GCC", "CMake", "GDB", "Linux"],
      "C# Developer": ["C#", ".NET", "Entity Framework", "MySQL", "Microsoft Azure"],
      "Go Developer": ["Go", "API", "Database", "System Design"],
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
      "Frontend Developer": ["JavaScript", "React", "HTML5", "API", "Tailwind CSS"],
      "React Developer": ["React", "JavaScript", "TypeScript", "Redux", "NextJS"],
      "Angular Developer": ["Angular", "TypeScript", "JavaScript", "Git", "API"],
      "Vue Developer": ["Vue", "JavaScript", "TypeScript", "Vuex", "Git"],
      "Svelte Developer": ["Svelte", "JavaScript", "TypeScript", "Vite", "Git"],
      "Django Developer": ["Django", "Python", "PostgreSQL", "Redis", "Docker"],
      "Flask Developer": ["Flask", "Python", "PostgreSQL", "Redis", "API"],
      "FastAPI Developer": ["FastAPI", "Python", "PostgreSQL", "Docker", "API"],
      "Spring Developer": ["Spring", "Java", "Maven", "MySQL", "API"],
      "Express Developer": ["Express", "Node.js", "JavaScript", "MongoDB", "API"],
      "NextJS Developer": ["NextJS", "React", "TypeScript", "Tailwind CSS", "Vercel"],
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
      "Software Engineer": ["DSA", "OOP", "System Design", "Database", "API"],
      "Associate Software Engineer (ASE)": ["DSA", "OOP", "Database", "System Design", "Debugging"],
      "Associate Software Engineer (Open Stack)": ["System Design", "Networking", "Database", "OOP", "DSA"],
    };

    const techList = roleTechMap[selectedRole];
    if (!techList || techList.length === 0) return [];

    const validTechs = techList.filter((tech) => TECHNOLOGIES.includes(tech));
    const selectedTechs = validTechs.slice(0, 4);
    const weight = Math.floor(100 / selectedTechs.length);

    return selectedTechs.map((tech, index) => ({
      id: (index + 1).toString(),
      name: tech,
      weight:
        index === selectedTechs.length - 1
          ? 100 - weight * (selectedTechs.length - 1)
          : weight,
    }));
  };

  useEffect(() => {
    if (role) {
      const defaultStacks = getRoleBasedTechStack(role);
      if (defaultStacks.length > 0) {
        setTechStack(defaultStacks);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const { user, isLoaded: isUserLoaded } = useUser();

  const quizUsage = useQuizUsage();
  const { data: userPlanData } = useUserPlan();
  const plan = userPlanData?.plan_name || "Free";
  const currentUsage = {
    quizzesThisMonth: quizUsage?.data?.current_month?.quiz_count || 0,
    totalCandidates: 0,
    teamMembers: 0,
  };
  const planLimits = usePlanLimits(currentUsage);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const refetchQuizUsage = quizUsage?.refetch;

    const refetchAllData = async () => {
      if (!user) return;
      try {
        await user.reload();
        await queryClient.invalidateQueries({
          queryKey: ["quiz-usage"],
          refetchType: "active",
        });
        if (refetchQuizUsage) {
          await refetchQuizUsage();
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error refreshing data:", error);
        }
      }
    };

    refetchAllData();
    const refreshInterval = setInterval(refetchAllData, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [user, queryClient, maxQuestions]);

  const {
    experience,
    setExperience,
    count,
    setCount,
    isReasoning,
    error,
    setError,
    steps,
    stepIcons,
    stepIndex,
    typedText,
    handleGenerate: _handleGenerate,
  } = useCreateQuizV2();

  const handleGenerateClick = (codePct: number) => {
    setError("");

    if (!uploadedFiles || uploadedFiles.length === 0) {
      if (!techStack || techStack.length === 0) {
        setError(
          "Please add at least one technology to your tech stack or upload files"
        );
        return;
      }

      const validTechStack = techStack.filter(
        (tech) => tech && tech.name && tech.weight !== undefined
      );

      if (validTechStack.length === 0) {
        setError("Invalid tech stack configuration");
        return;
      }

      const totalWeight = validTechStack.reduce(
        (sum, tech) => sum + tech.weight,
        0
      );

      if (Math.abs(totalWeight - 100) > 1) {
        setError("Tech stack weights must sum to 100%");
        return;
      }

      const sanitizedTechStack: TechStackItem[] = validTechStack.map(
        (tech) => ({
          id: tech.id || Math.random().toString(36).substr(2, 9),
          name: tech.name.trim(),
          weight: Math.round(tech.weight),
        })
      );

      _handleGenerate(sanitizedTechStack, codePct, role, uploadedFiles);
      return;
    }

    _handleGenerate([], codePct, role, uploadedFiles);
  };

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else if (plan === "Enterprise") {
      window.location.href = "mailto:support@quizzviz.com";
    } else {
      router.push("/pricing");
    }
  };

  return (
    <Card className="bg-background border-border">
      <CardContent className="p-8 space-y-6">
        <QuizHeader />

        {planLimits.isQuizLimitReached && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg text-yellow-200">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Monthly Quiz Limit Reached</h4>
                <p className="text-sm mt-1">
                  {getLimitMessage("quiz", plan as any)}
                </p>
                <Button
                  onClick={handleUpgradeClick}
                  className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                  size="sm"
                >
                  {getUpgradeCTA(plan as any).text}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <RoleSelect value={role} onChange={setRole} />
          </div>

          <div className="space-y-2">
            <TechStackInput
              value={techStack}
              onChange={setTechStack}
              availableTechs={TECHNOLOGIES.map((tech) => ({
                value: tech,
                label: tech,
              }))}
            />
          </div>

          <div className="space-y-2">
            <FileUpload value={uploadedFiles} onChange={setUploadedFiles} maxFiles={5} />
          </div>

          <ExperienceCountRow
            experience={experience}
            setExperience={setExperience}
            count={count}
            setCount={setCount}
            maxQuestions={maxQuestions}
            className="pt-4"
          />

          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Question Distribution</Label>
            </div>
            <CodeTheorySlider
              codePercentage={codePercentage}
              onCodePercentageChange={setCodePercentage}
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col space-y-2">
          <div className="flex justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      className={`transition-all duration-300 px-5 py-2 rounded-lg shadow-md flex items-center ${
                        planLimits.isQuizLimitReached
                          ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                          : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 duration-300 transition-all hover:to-blue-700 text-white"
                      }`}
                      disabled={
                        !role ||
                        (techStack.length === 0 &&
                          uploadedFiles.length === 0) ||
                        planLimits.isQuizLimitReached
                      }
                      onClick={() => handleGenerateClick(codePercentage)}
                    >
                      {planLimits.isQuizLimitReached ? (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          {getUpgradeCTA(plan as any).text}
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          {!role ||
                          (techStack.length === 0 &&
                            uploadedFiles.length === 0)
                            ? "Role and Tech Stack or Files are required"
                            : "Generate Quiz"}
                        </>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {(!role ||
                  (techStack.length === 0 && uploadedFiles.length === 0) ||
                  planLimits.isQuizLimitReached) && (
                  <TooltipContent className="w-64 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-yellow-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {planLimits.isQuizLimitReached
                              ? "Quiz Limit Reached"
                              : "Missing Information"}
                          </p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {planLimits.isQuizLimitReached
                              ? `${getLimitMessage(
                                  "quiz",
                                  plan as any
                                )} Click to upgrade your plan.`
                              : !role
                              ? "Please select a role before generating."
                              : "Please add at least one technology to your tech stack or upload files."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <ReasoningPanel
          visible={isReasoning}
          steps={steps}
          stepIcons={stepIcons}
          stepIndex={stepIndex}
          typedText={typedText}
        />
      </CardContent>
    </Card>
  );
}