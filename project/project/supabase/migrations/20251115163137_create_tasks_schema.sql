/*
  # TaskMaster AI Database Schema

  ## Overview
  This migration creates the complete database schema for TaskMaster AI, a modern task management application with AI-powered features.

  ## New Tables

  ### 1. `tasks`
  Main tasks table storing all task information
  - `id` (uuid, primary key) - Unique task identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `title` (text) - Task title
  - `description` (text) - Detailed task description
  - `priority` (integer) - Priority level (1=Critical, 2=High, 3=Medium, 4=Low)
  - `status` (text) - Task status (pending, in_progress, completed)
  - `category` (text) - Task category (work, personal, urgent, etc.)
  - `due_date` (timestamptz) - Task deadline
  - `reminder_time` (timestamptz) - Reminder notification time
  - `time_estimate` (integer) - Estimated time in minutes
  - `time_spent` (integer) - Actual time spent in minutes
  - `completed_at` (timestamptz) - Completion timestamp
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `subtasks`
  Subtasks belonging to main tasks
  - `id` (uuid, primary key) - Unique subtask identifier
  - `task_id` (uuid, foreign key) - References tasks table
  - `title` (text) - Subtask title
  - `completed` (boolean) - Completion status
  - `order` (integer) - Display order
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. `attachments`
  File attachments for tasks
  - `id` (uuid, primary key) - Unique attachment identifier
  - `task_id` (uuid, foreign key) - References tasks table
  - `file_name` (text) - Original file name
  - `file_type` (text) - MIME type
  - `file_url` (text) - Storage URL
  - `file_size` (integer) - File size in bytes
  - `created_at` (timestamptz) - Upload timestamp

  ### 4. `task_streaks`
  Track user task completion streaks
  - `id` (uuid, primary key) - Unique streak identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `current_streak` (integer) - Current consecutive days
  - `longest_streak` (integer) - Longest streak achieved
  - `last_completed_date` (date) - Last task completion date
  - `total_tasks_completed` (integer) - Total lifetime completed tasks
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. `ai_recommendations`
  AI-generated task recommendations and insights
  - `id` (uuid, primary key) - Unique recommendation identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `task_id` (uuid, foreign key, nullable) - Optional task reference
  - `recommendation_type` (text) - Type (suggestion, insight, reminder)
  - `content` (text) - Recommendation content
  - `shown` (boolean) - Whether shown to user
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Users can only access their own data
  - Policies enforce user_id matching for all operations

  ## Indexes
  - Create indexes on foreign keys for performance
  - Add composite indexes for common queries
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  priority integer DEFAULT 3 CHECK (priority >= 1 AND priority <= 4),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  category text DEFAULT 'personal',
  due_date timestamptz,
  reminder_time timestamptz,
  time_estimate integer DEFAULT 0,
  time_spent integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  completed boolean DEFAULT false,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
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

-- Create ai_recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL CHECK (recommendation_type IN ('suggestion', 'insight', 'reminder')),
  content text NOT NULL,
  shown boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

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

-- Subtasks policies
CREATE POLICY "Users can view own subtasks"
  ON subtasks FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = subtasks.task_id
    AND tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own subtasks"
  ON subtasks FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = subtasks.task_id
    AND tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own subtasks"
  ON subtasks FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = subtasks.task_id
    AND tasks.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = subtasks.task_id
    AND tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own subtasks"
  ON subtasks FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = subtasks.task_id
    AND tasks.user_id = auth.uid()
  ));

-- Attachments policies
CREATE POLICY "Users can view own attachments"
  ON attachments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = attachments.task_id
    AND tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own attachments"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = attachments.task_id
    AND tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own attachments"
  ON attachments FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = attachments.task_id
    AND tasks.user_id = auth.uid()
  ));

-- Task streaks policies
CREATE POLICY "Users can view own streaks"
  ON task_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON task_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON task_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_streaks_updated_at
  BEFORE UPDATE ON task_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
