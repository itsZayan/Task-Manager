import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Task, TaskStreak } from '@/types/database';
import { TrendingUp, CheckCircle, Clock, Target, Flame } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function InsightsScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState<TaskStreak | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*');

      if (tasksData) {
        setTasks(tasksData);
        calculateStats(tasksData);
      }

      const { data: streakData } = await supabase
        .from('task_streaks')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (streakData) {
        setStreak(streakData);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const calculateStats = (taskList: Task[]) => {
    const total = taskList.length;
    const completed = taskList.filter((t) => t.status === 'completed').length;
    const pending = taskList.filter((t) => t.status === 'pending').length;
    const inProgress = taskList.filter((t) => t.status === 'in_progress').length;

    setStats({ total, completed, pending, inProgress });
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TrendingUp size={32} color="#4CAF50" />
        <Text style={styles.headerTitle}>Your Insights</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Flame size={40} color="#FF9800" />
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{streak?.current_streak || 0}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
          <View style={styles.streakStats}>
            <View style={styles.streakStat}>
              <Text style={styles.streakStatLabel}>Longest</Text>
              <Text style={styles.streakStatValue}>{streak?.longest_streak || 0} days</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.streakStat}>
              <Text style={styles.streakStatLabel}>Total Completed</Text>
              <Text style={styles.streakStatValue}>{streak?.total_tasks_completed || 0}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Target size={24} color="#2196F3" />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <CheckCircle size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <Clock size={24} color="#FF9800" />
            <Text style={styles.statValue}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <Clock size={24} color="#9C27B0" />
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.progressCard}>
          <Text style={styles.progressTitle}>Completion Rate</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
            </View>
            <Text style={styles.progressPercentage}>{completionRate}%</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>AI Insights</Text>
          <View style={styles.tip}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              You're doing great! Keep up the momentum to build your streak.
            </Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipIcon}>📊</Text>
            <Text style={styles.tipText}>
              Your completion rate is {completionRate}%. {completionRate >= 70 ? 'Excellent work!' : 'Try to focus on completing pending tasks.'}
            </Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipIcon}>🎯</Text>
            <Text style={styles.tipText}>
              Break down large tasks into smaller subtasks for better productivity.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
  },
  streakCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF9800',
  },
  streakLabel: {
    fontSize: 16,
    color: '#757575',
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  streakStat: {
    alignItems: 'center',
  },
  streakStatLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  streakStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  divider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212121',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    minWidth: 45,
  },
  tipsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  tip: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tipIcon: {
    fontSize: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
});
