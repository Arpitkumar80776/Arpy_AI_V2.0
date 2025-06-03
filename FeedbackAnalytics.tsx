import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Star, ThumbsUp, ThumbsDown, TrendingUp, MessageSquare } from 'lucide-react';

interface FeedbackAnalyticsProps {
  neonColor: string;
}

export function FeedbackAnalytics({ neonColor }: FeedbackAnalyticsProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/feedback'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/feedback');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="glass-morphism rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded"></div>
          <div className="h-32 bg-white/20 rounded"></div>
          <div className="h-32 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalFeedbacks === 0) {
    return (
      <div className="glass-morphism rounded-xl p-6 text-center">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">No Feedback Yet</h3>
        <p className="text-gray-400 text-sm">
          Start conversations to collect feedback on AI responses
        </p>
      </div>
    );
  }

  const ratingData = Object.entries(analytics.ratingDistribution).map(([rating, count]) => ({
    rating: `${rating} Star${rating !== '1' ? 's' : ''}`,
    count: count as number,
  }));

  const helpfulnessData = [
    { name: 'Helpful', value: analytics.helpfulCount, color: neonColor },
    { name: 'Not Helpful', value: analytics.notHelpfulCount, color: '#EF4444' },
  ];

  const statsCards = [
    {
      title: 'Total Feedback',
      value: analytics.totalFeedbacks,
      icon: MessageSquare,
      color: neonColor,
    },
    {
      title: 'Average Rating',
      value: analytics.averageRating.toFixed(1),
      icon: Star,
      color: '#F59E0B',
    },
    {
      title: 'Helpful Responses',
      value: `${((analytics.helpfulCount / (analytics.helpfulCount + analytics.notHelpfulCount)) * 100).toFixed(1)}%`,
      icon: ThumbsUp,
      color: '#10B981',
    },
    {
      title: 'Satisfaction Trend',
      value: analytics.averageRating >= 4 ? '↗' : analytics.averageRating >= 3 ? '→' : '↘',
      icon: TrendingUp,
      color: analytics.averageRating >= 4 ? '#10B981' : analytics.averageRating >= 3 ? '#F59E0B' : '#EF4444',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="glass-morphism rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">{stat.title}</p>
                <p className="text-xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className="w-6 h-6 opacity-70" style={{ color: stat.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="glass-morphism rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2" style={{ color: neonColor }} />
            Rating Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="rating" 
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                axisLine={false}
              />
              <YAxis 
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Bar dataKey="count" fill={neonColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Helpfulness Breakdown */}
        <div className="glass-morphism rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ThumbsUp className="w-5 h-5 mr-2" style={{ color: neonColor }} />
            Helpfulness Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={helpfulnessData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {helpfulnessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="glass-morphism rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">AI Learning Insights</h3>
        <div className="space-y-3 text-sm">
          {analytics.averageRating >= 4.5 && (
            <div className="flex items-center text-green-400">
              <TrendingUp className="w-4 h-4 mr-2" />
              Excellent performance! Users are highly satisfied with AI responses.
            </div>
          )}
          {analytics.averageRating >= 3.5 && analytics.averageRating < 4.5 && (
            <div className="flex items-center text-yellow-400">
              <TrendingUp className="w-4 h-4 mr-2" />
              Good performance with room for improvement in response quality.
            </div>
          )}
          {analytics.averageRating < 3.5 && (
            <div className="flex items-center text-red-400">
              <TrendingUp className="w-4 h-4 mr-2" />
              AI responses need improvement. Consider adjusting prompts or model parameters.
            </div>
          )}
          {analytics.helpfulCount > analytics.notHelpfulCount && (
            <div className="flex items-center text-blue-400">
              <ThumbsUp className="w-4 h-4 mr-2" />
              Most users find responses helpful ({analytics.helpfulCount} vs {analytics.notHelpfulCount}).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}