'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Zap } from 'lucide-react';

interface Props {
  profit: number;
  trend: string;
  todayProfit: number;
}

const ProfitPulseCenter: React.FC<Props> = ({ profit, trend, todayProfit }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [pulseClass, setPulseClass] = useState('');
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Animate on profit increase
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setPulseClass('animate-pulse-once');
      
      setTimeout(() => {
        setIsAnimating(false);
        setPulseClass('');
      }, 1000);
    }, 5000); // Pulse every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const isPositiveTrend = trend.includes('+');
  const trendValue = trend.replace(/[^0-9]/g, '');

  return (
    <div className="profit-center flex flex-col items-center justify-center my-8">
      {/* Main Profit Circle */}
      <div className={`relative ${pulseClass}`}>
        <div className="profit-circle bg-gradient-to-br from-green-400 to-green-600 rounded-full w-64 h-64 flex flex-col items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-105">
          {/* Animated Background Effect */}
          {isAnimating && (
            <div className="absolute inset-0 rounded-full bg-green-400 opacity-30 animate-ping" />
          )}
          
          {/* Content */}
          <div className="relative z-10 text-center">
            <DollarSign className="h-8 w-8 text-white/80 mx-auto mb-2" />
            <span className="profit-number text-white text-4xl font-bold block">
              {formatCurrency(profit)}
            </span>
            <span className="profit-trend text-white text-xl flex items-center justify-center gap-1 mt-2">
              {isPositiveTrend ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {trend}
            </span>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-4 -right-4 bg-yellow-400 rounded-full p-3 shadow-lg animate-bounce">
          <Zap className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mt-8 grid grid-cols-2 gap-6 text-center">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Dagens profit</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(todayProfit)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Månadsprognos</p>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(profit * 30)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Animated Status Bar */}
      <div className="mt-6 w-full max-w-md">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(parseInt(trendValue) * 4, 100)}%` }}
          />
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
          Profittillväxt: {trendValue}% över genomsnitt
        </p>
      </div>
    </div>
  );
};

export default ProfitPulseCenter;