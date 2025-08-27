import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  TrendingUp, 
  Shield, 
  Clock,
  Award,
  Zap,
  Users,
  BarChart3
} from 'lucide-react';

interface MLMarketingProps {
  mlAccuracy?: number;
  enhancedAccuracy?: number;
  avgTimeSavings?: number;
  totalMovesAnalyzed?: number;
}

export function MLMarketingMessages({
  mlAccuracy = 87,
  enhancedAccuracy = 43,
  avgTimeSavings = 15,
  totalMovesAnalyzed = 10000
}: MLMarketingProps) {
  
  const heroMessages = [
    {
      icon: <Sparkles className="w-6 h-6 text-purple-600" />,
      title: "AI-Powered Precision Moving",
      subtitle: `${mlAccuracy}% prediction accuracy with machine learning`,
      cta: "Get AI Quote",
      variant: "ml"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      title: `${enhancedAccuracy}% More Accurate Than Competitors`,
      subtitle: "Enhanced Algorithm v2.1 + ML predictions",
      cta: "See the Difference",
      variant: "enhanced"
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      title: `Save ${avgTimeSavings}% Time on Your Move`,
      subtitle: "AI optimizes every aspect of your relocation",
      cta: "Start Saving Time",
      variant: "efficiency"
    }
  ];

  const trustBadges = [
    {
      icon: <Shield className="w-4 h-4" />,
      text: "AI-Verified Estimates",
      color: "bg-green-100 text-green-800"
    },
    {
      icon: <Award className="w-4 h-4" />,
      text: "World's Most Advanced",
      color: "bg-purple-100 text-purple-800"
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      text: `${totalMovesAnalyzed.toLocaleString()}+ Moves Analyzed`,
      color: "bg-blue-100 text-blue-800"
    }
  ];

  const comparisonData = [
    {
      feature: "Estimation Accuracy",
      traditional: "60-70%",
      nordflytt: `${mlAccuracy}%`,
      advantage: "+27%"
    },
    {
      feature: "Quote Generation",
      traditional: "24-48 hours",
      nordflytt: "Instant",
      advantage: "100x faster"
    },
    {
      feature: "Route Optimization",
      traditional: "Manual",
      nordflytt: "AI-Powered",
      advantage: `${avgTimeSavings}% savings`
    },
    {
      feature: "Price Transparency",
      traditional: "Hidden fees",
      nordflytt: "AI-calculated",
      advantage: "100% transparent"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {heroMessages.map((message, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                {message.icon}
                <Badge variant="outline" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  AI-Enhanced
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2">{message.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{message.subtitle}</p>
              <Button className="w-full" variant={message.variant === 'ml' ? 'default' : 'outline'}>
                {message.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap gap-2 justify-center">
        {trustBadges.map((badge, index) => (
          <Badge key={index} className={`${badge.color} flex items-center gap-1 px-3 py-1`}>
            {badge.icon}
            <span className="text-sm font-medium">{badge.text}</span>
          </Badge>
        ))}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Why Choose AI-Powered Moving?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-sm font-medium">Feature</th>
                  <th className="text-center py-2 px-3 text-sm font-medium">Traditional</th>
                  <th className="text-center py-2 px-3 text-sm font-medium">
                    <span className="text-purple-600">Nordflytt AI</span>
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-medium">Your Advantage</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3 text-sm">{row.feature}</td>
                    <td className="py-3 px-3 text-sm text-center text-gray-500">
                      {row.traditional}
                    </td>
                    <td className="py-3 px-3 text-sm text-center font-medium">
                      {row.nordflytt}
                    </td>
                    <td className="py-3 px-3 text-sm text-center">
                      <Badge variant="outline" className="text-green-600">
                        {row.advantage}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Social Proof */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Join Sweden's AI Moving Revolution</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Over {totalMovesAnalyzed.toLocaleString()} successful moves powered by our AI technology. 
              Experience the future of moving with {mlAccuracy}% accurate predictions and {enhancedAccuracy}% 
              better estimates than traditional methods.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Get Your AI Quote Now
              </Button>
              <Button size="lg" variant="outline">
                See AI in Action
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email/SMS Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Marketing Message Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Email Subject Lines:</h4>
            <ul className="space-y-1 text-sm">
              <li>• 🤖 Your AI-powered move: {mlAccuracy}% accurate estimate inside</li>
              <li>• Save {avgTimeSavings}% on your Stockholm move with AI technology</li>
              <li>• {totalMovesAnalyzed.toLocaleString()} moves analyzed: Your personalized AI quote ready</li>
            </ul>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">SMS Templates:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Nordflytt: AI predicts your move takes X hours. {mlAccuracy}% accuracy. Get quote: [link]</li>
              <li>• 🚀 {enhancedAccuracy}% more accurate than others. Your AI quote expires in 24h: [link]</li>
              <li>• Last chance! AI-optimized price for your move. Save {avgTimeSavings}%: [link]</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Social Media:</h4>
            <ul className="space-y-1 text-sm">
              <li>• 🏆 Stockholm's first AI-powered moving company! {mlAccuracy}% prediction accuracy.</li>
              <li>• 📊 We analyzed {totalMovesAnalyzed.toLocaleString()}+ moves. Your turn to save {avgTimeSavings}%!</li>
              <li>• 🤖 Machine Learning + Moving = Perfect Match. Get your AI quote today!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}