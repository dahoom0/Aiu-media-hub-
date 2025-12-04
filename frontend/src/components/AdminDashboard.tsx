import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Users, 
  Package, 
  Calendar, 
  Video, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const pendingApprovals = [
    {
      id: 1,
      type: 'booking',
      student: 'John Smith',
      item: 'Studio A',
      date: '2025-11-15',
      time: '10:00 - 12:00',
      requestedAt: '2 hours ago',
    },
    {
      id: 2,
      type: 'rental',
      student: 'Sarah Johnson',
      item: 'Canon EOS R5',
      duration: '3 days',
      requestedAt: '5 hours ago',
    },
    {
      id: 3,
      type: 'booking',
      student: 'Mike Chen',
      item: 'Editing Room 2',
      date: '2025-11-16',
      time: '14:00 - 16:00',
      requestedAt: '1 day ago',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Equipment returned',
      student: 'Alice Williams',
      item: 'Sony A7S III',
      time: '30 min ago',
      status: 'completed',
    },
    {
      id: 2,
      action: 'Booking completed',
      student: 'Bob Taylor',
      item: 'Studio B',
      time: '2 hours ago',
      status: 'completed',
    },
    {
      id: 3,
      action: 'Rental approved',
      student: 'Carol Davis',
      item: 'Rode NTG4+ Microphone',
      time: '4 hours ago',
      status: 'approved',
    },
  ];

  const stats = [
    {
      label: 'Active Students',
      value: '248',
      change: '+12',
      trend: 'up',
      icon: Users,
      color: 'teal',
    },
    {
      label: 'Equipment in Use',
      value: '18',
      change: '-3',
      trend: 'down',
      icon: Package,
      color: 'cyan',
    },
    {
      label: 'Active Bookings',
      value: '24',
      change: '+5',
      trend: 'up',
      icon: Calendar,
      color: 'purple',
    },
    {
      label: 'Tutorial Views',
      value: '1,247',
      change: '+142',
      trend: 'up',
      icon: Video,
      color: 'orange',
    },
  ];

  const getTypeIcon = (type: string) => {
    return type === 'booking' ? Calendar : Package;
  };

  const getTypeColor = (type: string) => {
    return type === 'booking' 
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-teal-400';
      case 'approved':
        return 'text-cyan-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">
          Manage bookings, equipment, and content
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorMap: Record<string, string> = {
            teal: 'from-teal-500/20 to-teal-500/10',
            cyan: 'from-cyan-500/20 to-cyan-500/10',
            purple: 'from-purple-500/20 to-purple-500/10',
            orange: 'from-orange-500/20 to-orange-500/10',
          };
          const iconColorMap: Record<string, string> = {
            teal: 'text-teal-400',
            cyan: 'text-cyan-400',
            purple: 'text-purple-400',
            orange: 'text-orange-400',
          };
          return (
            <Card key={index} className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${colorMap[stat.color]}`}>
                    <Icon className={`h-6 w-6 ${iconColorMap[stat.color]}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-teal-400' : 'text-red-400'}`}>
                    <TrendingUp className={`h-4 w-4 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl text-white mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Pending Approvals</CardTitle>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                {pendingApprovals.length} Pending
              </Badge>
            </div>
            <CardDescription className="text-gray-400">
              Requests awaiting your review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.map((approval) => {
              const TypeIcon = getTypeIcon(approval.type);
              return (
                <div
                  key={approval.id}
                  className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${approval.type === 'booking' ? 'bg-purple-500/20' : 'bg-cyan-500/20'}`}>
                        <TypeIcon className={`h-5 w-5 ${approval.type === 'booking' ? 'text-purple-400' : 'text-cyan-400'}`} />
                      </div>
                      <div>
                        <p className="text-white">{approval.student}</p>
                        <p className="text-sm text-gray-400">{approval.item}</p>
                        {approval.type === 'booking' ? (
                          <p className="text-xs text-gray-500 mt-1">
                            {approval.date} • {approval.time}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            Duration: {approval.duration}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={getTypeColor(approval.type)}>
                      {approval.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-500">{approval.requestedAt}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">
              Latest system activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
                  <CheckCircle2 className={`h-4 w-4 ${getStatusColor(activity.status)}`} />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.action}</p>
                  <p className="text-sm text-gray-400">{activity.student} • {activity.item}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Equipment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Available</span>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">
                32 items
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">In Use</span>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                18 items
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Maintenance</span>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                2 items
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Lab Utilization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Studio A</span>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">
                85%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Studio B</span>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                72%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Editing Rooms</span>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                68%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Database</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-teal-400" />
                <span className="text-sm text-teal-400">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">API Server</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-teal-400" />
                <span className="text-sm text-teal-400">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Storage</span>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                78% Used
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white mb-2">Content Management</h3>
                <p className="text-gray-400">
                  Upload new tutorials and manage existing content
                </p>
              </div>
              <Button 
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                onClick={() => onNavigate('admin-tutorials')}
              >
                <Video className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white mb-2">User Management</h3>
                <p className="text-gray-400">
                  Manage student accounts and permissions
                </p>
              </div>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                onClick={() => onNavigate('admin-profiles')}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}