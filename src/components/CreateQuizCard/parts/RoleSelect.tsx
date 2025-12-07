import { useState, useMemo } from 'react';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';

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

interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RoleSelect({ value, onChange, className }: RoleSelectProps) {
  const roleOptions = useMemo(() => 
    ROLES.map(role => ({
      value: role,
      label: role
    })),
    []
  );

  return (
    <div className="space-y-2 w-full">
      <Label className="text-sm text-white ">Role</Label>
      <Combobox
        options={roleOptions}
        value={value}
        onChange={onChange}
        placeholder="Select or search for a role..."
        className="w-full"
        inputClassName="h-10"
      />
    </div>
  );
}
