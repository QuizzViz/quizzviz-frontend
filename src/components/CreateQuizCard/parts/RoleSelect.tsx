import { useState, useMemo } from 'react';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { ROLE_NAMES } from '@/constants/roles';

const ROLES = [...ROLE_NAMES].sort();

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
