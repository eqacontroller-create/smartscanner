import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ScannerSkeleton() {
  return (
    <Card className="glass border-border/50">
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function LiveDataSkeleton() {
  return (
    <Card className="glass border-border/50">
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function VisualMechanicSkeleton() {
  return (
    <Card className="glass border-border/50">
      <CardHeader className="text-center space-y-2">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-56 mx-auto" />
        <Skeleton className="h-4 w-72 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Skeleton className="h-32 flex-1 max-w-[200px] rounded-lg" />
          <Skeleton className="h-32 flex-1 max-w-[200px] rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function BatteryTestSkeleton() {
  return (
    <Card className="glass border-border/50">
      <CardHeader className="text-center space-y-2">
        <Skeleton className="h-6 w-6 rounded mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
