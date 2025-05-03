import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { PlusCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Item {
  id: string;
  name: string;
  createdAt: Date;
  type?: string;
}

interface RecentItemsListProps {
  title: string;
  description: string;
  items: Item[] | null;
  isLoading: boolean;
  emptyMessage: string;
  viewAllLink: string;
  addItemText: string;
  onAddItem?: () => void;      // New callback prop
  addItemLink?: string;        // Made optional since we might use onAddItem instead
}

const RecentItemsList: React.FC<RecentItemsListProps> = ({
  title,
  description,
  items,
  isLoading,
  emptyMessage,
  addItemLink,
  viewAllLink,
  addItemText,
  onAddItem,
}) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href={viewAllLink} className="font-medium">
            View all <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !items || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-muted-foreground mb-4">{emptyMessage}</p>
            {onAddItem ? (
              <Button onClick={onAddItem}>
                <PlusCircle className="mr-2 h-4 w-4" /> {addItemText}
              </Button>
            ) : addItemLink ? (
              <Button asChild>
                <Link href={addItemLink}>
                  <PlusCircle className="mr-2 h-4 w-4" /> {addItemText}
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {item.type && `${item.type} • `}
                      {item.createdAt && item.createdAt instanceof Date 
                          ? formatDistanceToNow(item.createdAt, { addSuffix: true })
                          : typeof item.createdAt === 'object' && 'toDate' in item.createdAt 
                            ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })
                            : 'recently'}
                    </p>
                  </div>
                  <Button asChild size="icon" variant="ghost" className="shrink-0">
                    <Link href={`${viewAllLink}/${item.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentItemsList;