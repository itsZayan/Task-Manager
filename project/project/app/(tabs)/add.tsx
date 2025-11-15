import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mic, Calendar, Clock, Tag, Save } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';

const PRIORITIES = [
  { value: 1, label: 'Critical', color: '#F44336' },
  { value: 2, label: 'High', color: '#FF9800' },
  { value: 3, label: 'Medium', color: '#2196F3' },
  { value: 4, label: 'Low', color: '#9E9E9E' },
];

const CATEGORIES = ['Work', 'Personal', 'Urgent', 'Health', 'Finance', 'Other'];

export default function AddTaskScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(3);
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [saving, setSaving] = useState(false);

  const micScale = useSharedValue(1);

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const handleVoiceInput = () => {
    setIsListening(!isListening);

    if (!isListening) {
      micScale.value = withSequence(
        withTiming(1.3, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
      Alert.alert(
        'Voice Input',
        'Voice input feature requires Gemini API key. Please add your key in .env file as EXPO_PUBLIC_GEMINI_API_KEY.\n\nFor now, you can type your task manually.'
      );
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create tasks');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        due_date: dueDate || null,
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert('Success', 'Task created successfully!');

      setTitle('');
      setDescription('');
      setPriority(3);
      setCategory('Personal');
      setDueDate('');

      router.push('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create New Task</Text>
        <TouchableOpacity onPress={handleVoiceInput}>
          <Animated.View style={[styles.voiceButton, micAnimatedStyle, isListening && styles.voiceButtonActive]}>
            <Mic size={24} color={isListening ? '#ffffff' : '#4CAF50'} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        <View style={styles.section}>
          <Text style={styles.label}>Task Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#9E9E9E"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add details about your task"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#9E9E9E"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityContainer}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityButton,
                  priority === p.value && {
                    backgroundColor: p.color + '20',
                    borderColor: p.color,
                  },
                ]}
                onPress={() => setPriority(p.value)}>
                <Text
                  style={[
                    styles.priorityText,
                    priority === p.value && { color: p.color, fontWeight: '700' },
                  ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}>
                <Tag
                  size={16}
                  color={category === cat ? '#ffffff' : '#4CAF50'}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextActive,
                  ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Due Date (Optional)</Text>
          <View style={styles.dateInputContainer}>
            <Calendar size={20} color="#4CAF50" />
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={dueDate}
              onChangeText={setDueDate}
              placeholderTextColor="#9E9E9E"
            />
          </View>
          <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 2025-12-31)</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          <Save size={20} color="#ffffff" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Creating Task...' : 'Create Task'}
          </Text>
        </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#4CAF50',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    color: '#212121',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#4CAF50',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  helperText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    marginTop: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
