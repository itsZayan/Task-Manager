export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4;
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
  due_date: string | null;
  reminder_time: string | null;
  time_estimate: number;
  time_spent: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Subtask = {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  order: number;
  created_at: string;
};

export type Attachment = {
  id: string;
  task_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  created_at: string;
};

export type TaskStreak = {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  total_tasks_completed: number;
  updated_at: string;
};

export type AIRecommendation = {
  id: string;
  user_id: string;
  task_id: string | null;
  recommendation_type: 'suggestion' | 'insight' | 'reminder';
  content: string;
  shown: boolean;
  created_at: string;
};
