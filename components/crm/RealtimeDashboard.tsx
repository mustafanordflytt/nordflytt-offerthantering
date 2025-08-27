'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Activity, Users, TrendingUp, Calendar } from 'lucide-react';
import { useRealtimeJobs, useRealtimeOffers, useRealtimeLeads, useRealtimeNotifications } from '@/hooks/use-realtime';
import { motion, AnimatePresence } from 'framer-motion';

export default function RealtimeDashboard() {
  const [userId, setUserId] = useState<string>('admin-123'); // Mock user ID
  const { jobs, loading: jobsLoading } = useRealtimeJobs();
  const { offers, loading: offersLoading } = useRealtimeOffers();
  const { leads, loading: leadsLoading } = useRealtimeLeads();
  const { notifications, unreadCount, markAllAsRead } = useRealtimeNotifications(userId, 'admin');
  const [showNotifications, setShowNotifications] = useState(false);

  // Calculate real-time statistics
  const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
  const pendingOffers = offers.filter(o => o.status === 'sent').length;
  const newLeads = leads.filter(l => l.status === 'Ny').length;
  
  // Request notification permission
  useEffect(() => {
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Real-time Status Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Activity className="h-5 w-5 animate-pulse" />
            <span className="font-medium">Live Dashboard</span>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Realtidsuppdateringar aktiva
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            {unreadCount > 0 ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-4 top-20 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Notifikationer</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  Markera alla som lästa
                </Button>
              )}
            </div>
            <div className="divide-y">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-gray-500">Inga notifikationer</p>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                  >
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.created_at).toLocaleString('sv-SE')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktiva Jobb</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeJobs}</div>
              <p className="text-xs text-muted-foreground">
                {jobs.length} totalt
              </p>
              {!jobsLoading && activeJobs > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="h-1 bg-green-500 rounded-full mt-2"
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Väntande Offerter</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOffers}</div>
              <p className="text-xs text-muted-foreground">
                {offers.length} totalt
              </p>
              {!offersLoading && pendingOffers > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="h-1 bg-yellow-500 rounded-full mt-2"
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nya Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newLeads}</div>
              <p className="text-xs text-muted-foreground">
                {leads.length} totalt
              </p>
              {!leadsLoading && newLeads > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="h-1 bg-blue-500 rounded-full mt-2"
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dagens Schema</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs.filter(j => j.scheduled_date === new Date().toISOString().split('T')[0]).length}
              </div>
              <p className="text-xs text-muted-foreground">
                uppdrag idag
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Live Aktivitet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {notifications.slice(0, 5).map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className={`w-2 h-2 rounded-full ${
                  notification.type === 'success' ? 'bg-green-500' :
                  notification.type === 'error' ? 'bg-red-500' :
                  notification.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                } animate-pulse`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleTimeString('sv-SE')}
                  </p>
                </div>
              </motion.div>
            ))}
            {notifications.length === 0 && (
              <p className="text-center text-gray-500">Ingen aktivitet än</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}