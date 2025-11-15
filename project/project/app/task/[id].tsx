import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Task, Subtask } from '@/types/database';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Tag,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (taskError) throw taskError;
      setTask(taskData);

      const { data: subtasksData, error: subtasksError } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', id)
        .order('order', { ascending: true });

      if (subtasksError) throw subtasksError;
      setSubtasks(subtasksData || []);

      generateAIInsight(taskData);
    } catch (error) {
      console.error('Error fetching task:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsight = (taskData: Task | null) => {
    if (!taskData) return;

    const insights = [
      '💡 Break this task into smaller steps for better progress tracking.',
      '⏰ Consider setting a reminder 30 minutes before the deadline.',
      '🎯 Focus on completing this task during your most productive hours.',
      '📊 This task aligns well with your weekly goals.',
      '✨ You\'re making great progress! Keep up the momentum.',
    ];

    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
    setAiInsight(randomInsight);
  };

  const toggleTaskStatus = async () => {
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, completed_at: completedAt })
        .eq('id', task.id);

      if (error) throw error;

      setTask({ ...task, status: newStatus, completed_at: completedAt });

      if (newStatus === 'completed') {
        await updateStreak();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const updateStreak = async () => {
    try {
      const { data: existingStreak } = await supabase
        .from('task_streaks')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0];

      if (existingStreak) {
        const newTotal = existingStreak.total_tasks_completed + 1;
        let newCurrent = existingStreak.current_streak;
        let newLongest = existingStreak.longest_streak;

        if (existingStreak.last_completed_date !== today) {
          newCurrent += 1;
          if (newCurrent > newLongest) {
            newLongest = newCurrent;
          }
        }

        await supabase
          .from('task_streaks')
          .update({
            current_streak: newCurrent,
            longest_streak: newLongest,
            total_tasks_completed: newTotal,
            last_completed_date: today,
          })
          .eq('id', existingStreak.id);
      } else {
        await supabase.from('task_streaks').insert({
          user_id: user?.id,
          current_streak: 1,
          longest_streak: 1,
          total_tasks_completed: 1,
          last_completed_date: today,
        });
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const deleteTask = async () => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('tasks').delete().eq('id', id);

            if (error) throw error;

            router.back();
          } catch (error) {
            console.error('Error deleting task:', error);
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;

    try {
      const { error } = await supabase.from('subtasks').insert({
        task_id: id as string,
        title: newSubtask.trim(),
        order: subtasks.length,
      });

      if (error) throw error;

      setNewSubtask('');
      fetchTaskDetails();
    } catch (error) {
      console.error('Error adding subtask:', error);
      Alert.alert('Error', 'Failed to add subtask');
    }
  };

  const toggleSubtask = async (subtask: Subtask) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed: !subtask.completed })
        .eq('id', subtask.id);

      if (error) throw error;

      fetchTaskDetails();
    } catch (error) {
      console.error('Error updating subtask:', error);
      Alert.alert('Error', 'Failed to update subtask');
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return '#F44336';
      case 2:
        return '#FF9800';
      case 3:
        return '#2196F3';
      case 4:
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return 'Critical';
      case 2:
        return 'High';
      case 3:
        return 'Medium';
      case 4:
        return 'Low';
      default:
        return 'Low';
    }
  };

  if (loading || !task) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <TouchableOpacity onPress={deleteTask}>
          <Trash2 size={24} color="#F44336" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.taskCard}>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={toggleTaskStatus}>
            {task.status === 'completed' ? (
              <CheckCircle2 size={32} color="#4CAF50" />
            ) : (
              <Circle size={32} color="#9E9E9E" />
            )}
          </TouchableOpacity>

          <Text
            style={[
              styles.taskTitle,
              task.status === 'completed' && styles.taskTitleCompleted,
            ]}>
            {task.title}
          </Text>

          {task.description ? (
            <Text style={styles.taskDescription}>{task.description}</Text>
          ) : null}

          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Tag size={18} color="#4CAF50" />
              <Text style={styles.metadataText}>{task.category}</Text>
            </View>

            <View style={styles.metadataItem}>
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: getPriorityColor(task.priority) },
                ]}
              />
              <Text style={styles.metadataText}>
                {getPriorityLabel(task.priority)}
              </Text>
            </View>

            {task.due_date && (
              <View style={styles.metadataItem}>
                <Calendar size={18} color="#FF9800" />
                <Text style={styles.metadataText}>
                  {new Date(task.due_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {aiInsight && (
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.aiCard}>
            <Sparkles size={24} color="#9C27B0" />
            <View style={styles.aiContent}>
              <Text style={styles.aiTitle}>AI Insight</Text>
              <Text style={styles.aiText}>{aiInsight}</Text>
            </View>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.subtasksCard}>
          <Text style={styles.sectionTitle}>Subtasks</Text>

          {subtasks.map((subtask) => (
            <TouchableOpacity
              key={subtask.id}
              style={styles.subtaskItem}
              onPress={() => toggleSubtask(subtask)}>
              {subtask.completed ? (
                <CheckCircle2 size={20} color="#4CAF50" />
              ) : (
                <Circle size={20} color="#9E9E9E" />
              )}
              <Text
                style={[
                  styles.subtaskText,
                  subtask.completed && styles.subtaskTextCompleted,
                ]}>
                {subtask.title}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.addSubtaskContainer}>
            <TextInput
              style={styles.subtaskInput}
              placeholder="Add a subtask..."
              value={newSubtask}
              onChangeText={setNewSubtask}
              placeholderTextColor="#9E9E9E"
            />
            <TouchableOpacity style={styles.addButton} onPress={addSubtask}>
              <Plus size={20} color="#4CAF50" />
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusButton: {
    marginBottom: 16,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9E9E9E',
  },
  taskDescription: {
    fontSize: 16,
    color: '#757575',
    lineHeight: 24,
    marginBottom: 16,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    color: '#757575',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  aiCard: {
    flexDirection: 'row',
    backgroundColor: '#F3E5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9C27B0',
    marginBottom: 4,
  },
  aiText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  subtasksCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  subtaskText: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  subtaskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9E9E9E',
  },
  addSubtaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  subtaskInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#212121',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
