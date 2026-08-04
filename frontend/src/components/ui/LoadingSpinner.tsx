import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ size = 'md', className, fullPage }: Props) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className={cn('animate-spin text-primary-500', sizes[size])} />
      </div>
    );
  }

  return <Loader2 className={cn('animate-spin text-primary-500', sizes[size], className)} />;
}
