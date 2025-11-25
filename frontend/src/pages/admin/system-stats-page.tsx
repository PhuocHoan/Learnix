import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/features/admin/api/admin-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BookOpen, GraduationCap, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// Skeleton component
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function SystemStatsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getSystemStats,
  });

  const statCards = [
    { 
      label: 'Total Users', 
      value: stats?.totalUsers || 0, 
      icon: Users,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      description: 'Registered accounts'
    },
    { 
      label: 'Total Courses', 
      value: stats?.totalCourses || 0, 
      icon: BookOpen,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
      description: 'Published courses'
    },
    { 
      label: 'Total Enrollments', 
      value: stats?.totalEnrollments || 0, 
      icon: GraduationCap,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-500',
      description: 'Course enrollments'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-white">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm font-medium">Analytics</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">System Statistics</h1>
          <p className="text-white/80 max-w-xl">
            Monitor platform metrics, user activity, and growth trends in real-time.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.label}
              className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={cn("p-3 rounded-xl", stat.iconBg)}>
                    <Icon className={cn("w-6 h-6", stat.iconColor)} />
                  </div>
                </div>
                <div className="mt-4">
                  {isLoading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <p className="text-4xl font-bold text-foreground">{stat.value}</p>
                  )}
                  <p className="text-sm font-medium text-foreground mt-1">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Growth Trends
            </CardTitle>
            <CardDescription>Platform growth over time</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Charts Coming Soon</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Detailed analytics will be available in Week 4
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Activity Feed Coming Soon</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time activity logs will be available in Week 4
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Platform Overview</h3>
              <p className="text-muted-foreground mt-1">
                This dashboard will display comprehensive analytics including user growth charts, 
                course completion rates, quiz performance statistics, and revenue metrics as the 
                platform scales. Real-time data visualization coming in Week 4.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
