export type RoleType = "technical" | "non_technical";

export interface RoleOption {
  name: string;
  type: RoleType;
}

// Single source of truth for selectable roles across the app (quiz creation, role select combobox).
// `type` drives frontend behavior: non_technical roles hide tech-stack input, require a document
// upload, and relabel the question-type split as Theory vs Practical Scenario.
export const ROLES: RoleOption[] = [
  { name: "Python Developer", type: "technical" },
  { name: "Java Developer", type: "technical" },
  { name: "JavaScript Developer", type: "technical" },
  { name: "TypeScript Developer", type: "technical" },
  { name: "C Developer", type: "technical" },
  { name: "C++ Developer", type: "technical" },
  { name: "C# Developer", type: "technical" },
  { name: "Go Developer", type: "technical" },
  { name: "Rust Developer", type: "technical" },
  { name: "Ruby Developer", type: "technical" },
  { name: "PHP Developer", type: "technical" },
  { name: "Swift Developer", type: "technical" },
  { name: "Kotlin Developer", type: "technical" },
  { name: "Scala Developer", type: "technical" },
  { name: "Perl Developer", type: "technical" },
  { name: "Haskell Developer", type: "technical" },
  { name: "MATLAB Developer", type: "technical" },
  { name: "R Developer", type: "technical" },
  { name: "SQL Developer", type: "technical" },
  { name: "HTML Developer", type: "technical" },
  { name: "CSS Developer", type: "technical" },
  { name: "React Developer", type: "technical" },
  { name: "Angular Developer", type: "technical" },
  { name: "Vue Developer", type: "technical" },
  { name: "Svelte Developer", type: "technical" },
  { name: "Django Developer", type: "technical" },
  { name: "Flask Developer", type: "technical" },
  { name: "FastAPI Developer", type: "technical" },
  { name: "Spring Developer", type: "technical" },
  { name: "Express Developer", type: "technical" },
  { name: "NextJS Developer", type: "technical" },
  { name: "NestJS Developer", type: "technical" },
  { name: ".NET Developer", type: "technical" },
  { name: "Bootstrap Developer", type: "technical" },
  { name: "Tailwind CSS Developer", type: "technical" },
  { name: "jQuery Developer", type: "technical" },
  { name: "Docker Engineer", type: "technical" },
  { name: "Kubernetes Engineer", type: "technical" },
  { name: "Terraform Engineer", type: "technical" },
  { name: "Ansible Engineer", type: "technical" },
  { name: "Jenkins Engineer", type: "technical" },
  { name: "Git Specialist", type: "technical" },
  { name: "GitHub Specialist", type: "technical" },
  { name: "GitLab Specialist", type: "technical" },
  { name: "CI CD Engineer", type: "technical" },
  { name: "PostgreSQL Developer", type: "technical" },
  { name: "MySQL Developer", type: "technical" },
  { name: "MongoDB Developer", type: "technical" },
  { name: "Redis Developer", type: "technical" },
  { name: "SQLite Developer", type: "technical" },
  { name: "Oracle Database Developer", type: "technical" },
  { name: "DynamoDB Developer", type: "technical" },
  { name: "Firebase Developer", type: "technical" },
  { name: "Supabase Developer", type: "technical" },
  { name: "AWS Cloud Engineer", type: "technical" },
  { name: "Azure Cloud Engineer", type: "technical" },
  { name: "GCP Cloud Engineer", type: "technical" },
  { name: "Compiler Engineer", type: "technical" },
  { name: "Interpreter Engineer", type: "technical" },
  { name: "Operating System Engineer", type: "technical" },
  { name: "Linux Engineer", type: "technical" },
  { name: "Unix Engineer", type: "technical" },
  { name: "Bash Engineer", type: "technical" },
  { name: "Shell Scripting Engineer", type: "technical" },
  { name: "Command Line Engineer", type: "technical" },
  { name: "API Developer", type: "technical" },
  { name: "Software Engineer", type: "technical" },
  { name: "Associate Software Engineer (ASE)", type: "technical" },
  { name: "Associate Software Engineer (Open Stack)", type: "technical" },

  // Non-technical roles — quiz is generated from an uploaded document instead of a tech stack.
  { name: "HR Manager", type: "non_technical" },
  { name: "Recruiter / Talent Acquisition Specialist", type: "non_technical" },
  { name: "Financial Analyst", type: "non_technical" },
  { name: "Accountant", type: "non_technical" },
  { name: "Compliance Officer", type: "non_technical" },
  { name: "Legal Counsel", type: "non_technical" },
  { name: "Marketing Manager", type: "non_technical" },
  { name: "Sales Manager", type: "non_technical" },
  { name: "Business Analyst", type: "non_technical" },
  { name: "Operations Manager", type: "non_technical" },
  { name: "Project Manager", type: "non_technical" },
  { name: "Procurement Manager", type: "non_technical" },
  { name: "Customer Support Lead", type: "non_technical" },
  { name: "Administrative Manager", type: "non_technical" },
  { name: "Training & Development Specialist", type: "non_technical" },
];

export const ROLE_NAMES = ROLES.map((r) => r.name);

export function getRoleType(roleName: string): RoleType {
  return ROLES.find((r) => r.name === roleName)?.type ?? "technical";
}

export function isNonTechnicalRole(roleName: string): boolean {
  return getRoleType(roleName) === "non_technical";
}
