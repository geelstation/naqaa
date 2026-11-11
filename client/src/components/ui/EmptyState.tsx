import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-naqaa-50 flex items-center justify-center mb-4">
        <Icon size={36} className="text-naqaa-300" />
      </div>
      <h3 className="text-lg font-bold text-naqaa-900 mb-2">{title}</h3>
      {description && <p className="text-sand-500 max-w-md mb-6">{description}</p>}
      {action}
    </div>
  );
}
