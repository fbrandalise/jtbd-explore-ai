import { ChevronRight, Home } from 'lucide-react';
import { Button } from './ui/button';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Button
        variant="ghost"
        size="sm"
        onClick={items[0]?.onClick}
        className="h-8 px-2 text-muted-foreground hover:text-foreground"
      >
        <Home className="h-4 w-4" />
      </Button>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          {item.onClick ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={item.onClick}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Button>
          ) : (
            <span className="font-medium text-foreground px-2">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}