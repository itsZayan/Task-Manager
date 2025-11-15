import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types/database';
import { Calendar, CheckCircle2, Circle, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const CATEGORIES = ['All', 'Work', 'Personal', 'Urgent', 'Health', 'Finance'];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
      filterTasks(data || [], selectedCategory);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedCategory]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filterTasks = (taskList: Task[], category: string) => {
    if (category === 'All') {
      setFilteredTasks(taskList);
    } else {
      setFilteredTasks(
        taskList.filter((task) => task.category.toLowerCase() === category.toLowerCase())
      );
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterTasks(tasks, category);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return '#EF4444';
      case 2: return '#F59E0B';
      case 3: return '#3B82F6';
      case 4: return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Critical';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      default: return 'Low';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderTaskCard = (task: Task, index: number) => (
    <Animated.View
      key={task.id}
      entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        style={styles.taskCardWrapper}
        onPress={() => router.push(`/task/${task.id}`)}>
        <BlurView intensity={20} tint="dark" style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <View style={styles.taskTitleRow}>
              {task.status === 'completed' ? (
                <CheckCircle2 size={24} color="#10B981" />
              ) : (
                <Circle size={24} color="#6B7280" />
              )}
              <Text
                style={[
                  styles.taskTitle,
                  task.status === 'completed' && styles.taskTitleCompleted,
                ]}
                numberOfLines={2}>
                {task.title}
              </Text>
            </View>
            <LinearGradient
              colors={[getPriorityColor(task.priority) + '40', getPriorityColor(task.priority) + '20']}
              style={styles.priorityBadge}>
              <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                {getPriorityLabel(task.priority)}
              </Text>
            </LinearGradient>
          </View>

          {task.description ? (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}

          <View style={styles.taskFooter}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
            <View style={styles.dateContainer}>
              <Calendar size={14} color="#A0AEC0" />
              <Text style={styles.dateText}>{formatDate(task.due_date)}</Text>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <LinearGradient colors={['#0A0E27', '#1A1F3A', '#2E3856']} style={styles.container}>
      <BlurView intensity={30} tint="dark" style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello!</Text>
            <Text style={styles.subtitle}>Let's get things done</Text>
          </View>
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.avatarGradient}>
            <Sparkles size={24} color="#ffffff" />
          </LinearGradient>
        </View>
      </BlurView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}>
        {CATEGORIES.map((category, index) => (
          <Animated.View key={category} entering={FadeInRight.delay(index * 50)}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => handleCategoryChange(category)}>
              {selectedCategory === category ? (
                <LinearGradient
                  colors={['#667EEA', '#764BA2']}
                  style={styles.categoryChipGradient}>
                  <Text style={styles.categoryChipTextActive}>{category}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.categoryChipText}>{category}</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.taskList}
        contentContainerStyle={styles.taskListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667EEA" />
        }>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading tasks...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle2 size={64} color="#4B5563" />
            <Text style={styles.emptyText}>No tasks found</Text>
            <Text style={styles.emptySubtext}>
              {selectedCategory === 'All'
                ? 'Create your first task to get started'
                : `No tasks in ${selectedCategory} category`}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task, index) => renderTaskCard(task, index))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    marginTop: 4,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  categoryScroll: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryChip: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryChipGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  categoryChipActive: {
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  categoryChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A0AEC0',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    padding: 20,
  },
  taskCardWrapper: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  taskCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  taskDescription: {
    fontSize: 15,
    color: '#A0AEC0',
    marginBottom: 16,
    lineHeight: 22,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667EEA',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#4B5563',
    marginTop: 8,
    textAlign: 'center',
  },
});
