/*
  # TaskMaster AI Database Schema

  ## Overview
  Complete database schema for TaskMaster AI task management application with authentication support.

  ## New Tables

  ### 1. tasks
  Main task storage with full task management capabilities:
  - `id` (uuid, primary key) - Unique task identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `title` (text) - Task title
  - `description` (text) - Task details
  - `priority` (integer) - Priority level (1=Critical, 2=High, 3=Medium, 4=Low)
  - `status` (text) - Task status (pending, in_progress, completed)
  - `category` (text) - Task category (Work, Personal, Urgent, Health, Finance, Other)
  - `due_date` (timestamptz) - Optional deadline
  - `reminder_time` (timestamptz) - Optional reminder
  - `time_estimate` (integer) - Estimated minutes to complete
  - `time_spent` (integer) - Actual minutes spent
  - `completed_at` (timestamptz) - Completion timestamp
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. subtasks
  Break down tasks into smaller actionable items:
  - `id` (uuid, primary key) - Unique subtask identifier
  - `task_id` (uuid, foreign key) - References tasks table
  - `title` (text) - Subtask title
  - `completed` (boolean) - Completion status
  - `order` (integer) - Display order
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. attachments
  File attachments for tasks:
  - `id` (uuid, primary key) - Unique attachment identifier
  - `task_id` (uuid, foreign key) - References tasks table
  - `file_name` (text) - Original filename
  - `file_type` (text) - MIME type
  - `file_url` (text) - Storage URL
  - `file_size` (integer) - File size in bytes
  - `created_at` (timestamptz) - Upload timestamp

  ### 4. task_streaks
  Track user productivity streaks:
  - `id` (uuid, primary key) - Unique streak identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `current_streak` (integer) - Current consecutive days
  - `longest_streak` (integer) - All-time longest streak
  - `last_completed_date` (date) - Last task completion date
  - `total_tasks_completed` (integer) - Lifetime task count
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. ai_recommendations
  AI-generated insights and suggestions:
  - `id` (uuid, primary key) - Unique recommendation identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `task_id` (uuid, foreign key, nullable) - Optional task reference
  - `recommendation_type` (text) - Type (suggestion, insight, reminder)
  - `content` (text) - Recommendation text
  - `shown` (boolean) - Display tracking
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Authenticated users required for all operations
  - Policies enforce data isolation by user_id

  ## Indexes
  - User-based queries optimized with user_id indexes
  - Task relationships indexed for fast lookups
  - Timestamp fields indexed for sorting and filtering
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  priority integer DEFAULT 3 CHECK (priority BETWEEN 1 AND 4),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  category text DEFAULT 'Personal',
  due_date timestamptz,
  reminder_time timestamptz,
  time_estimate integer DEFAULT 0,
  time_spent integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  completed boolean DEFAULT false,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index for task queries
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);

-- Enable RLS on subtasks
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Subtasks policies (access through task ownership)
CREATE POLICY "Users can view subtasks of own tasks"
  ON subtasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert subtasks for own tasks"
  ON subtasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subtasks of own tasks"
  ON subtasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subtasks of own tasks"
  ON subtasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  file_size integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index for task queries
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id);

-- Enable RLS on attachments
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Attachments policies (access through task ownership)
CREATE POLICY "Users can view attachments of own tasks"
  ON attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = attachments.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments for own tasks"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = attachments.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments of own tasks"
  ON attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = attachments.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Create task_streaks table
CREATE TABLE IF NOT EXISTS task_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_completed_date date,
  total_tasks_completed integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_task_streaks_user_id ON task_streaks(user_id);

-- Enable RLS on task_streaks
ALTER TABLE task_streaks ENABLE ROW LEVEL SECURITY;

-- Task streaks policies
CREATE POLICY "Users can view own streak"
  ON task_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
  ON task_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON task_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create ai_recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  recommendation_type text DEFAULT 'suggestion' CHECK (recommendation_type IN ('suggestion', 'insight', 'reminder')),
  content text NOT NULL,
  shown boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for queries
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_task_id ON ai_recommendations(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_shown ON ai_recommendations(shown);

-- Enable RLS on ai_recommendations
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- AI recommendations policies
CREATE POLICY "Users can view own recommendations"
  ON ai_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON ai_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON ai_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
  ON ai_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);