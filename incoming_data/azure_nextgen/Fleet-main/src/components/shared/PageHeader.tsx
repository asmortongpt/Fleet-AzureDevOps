import { Plus, Download, Upload } from "lucide-react";
import React from 'react';

import { Button } from "@/components/ui/button";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    icon?: 'add' | 'export' | 'import';
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  }>;
}

const iconMap = {
  add: Plus,
  export: Download,
  import: Upload,
};

export function PageHeader({ title, description, actions = [] }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground mt-2">{description}</p>}
      </div>
      {actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map((action, idx) => {
            const Icon = action.icon ? iconMap[action.icon] : null;
            return (
              <Button
                key={idx}
                onClick={action.onClick}
                variant={action.variant || 'default'}
              >
                {Icon && <Icon className="w-4 h-4 mr-2" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
