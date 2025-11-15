# TaskMaster AI

A modern, AI-powered task management app built with React Native, Expo, and Supabase.

## Features

- **Smart Task Management**: Create, organize, and track tasks with priorities and categories
- **AI-Powered Insights**: Get personalized recommendations and productivity tips
- **Task Streaks**: Build momentum with daily task completion tracking
- **Subtasks**: Break down complex tasks into manageable steps
- **Voice Input**: Add tasks using voice commands (Gemini API integration)
- **Beautiful UI**: Modern green & white theme with smooth animations
- **Real-time Sync**: Supabase backend for instant data synchronization
- **Secure Authentication**: Email/password authentication with Supabase

## Tech Stack

- **Framework**: Expo (React Native)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini API
- **Animations**: React Native Reanimated
- **Icons**: Lucide React Native

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Expo CLI installed: `npm install -g expo-cli`
- Supabase account (database is already configured)
- Google Gemini API key (optional, for voice features)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:

The `.env` file is already set up with Supabase credentials. To enable AI voice features, add your Gemini API key:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

### Running the App

Start the development server:

```bash
npm run dev
```

Then:
- Press `w` to open in web browser
- Press `i` to open in iOS simulator (Mac only)
- Press `a` to open in Android emulator
- Scan QR code with Expo Go app on your phone

## Database Schema

The app uses the following tables in Supabase:

- **tasks**: Main task data with priority, status, category, and deadlines
- **subtasks**: Breakdowns of main tasks
- **attachments**: File attachments for tasks
- **task_streaks**: User streak tracking and statistics
- **ai_recommendations**: AI-generated insights and suggestions

All tables have Row Level Security (RLS) enabled for data privacy.

## App Structure

```
app/
├── (tabs)/           # Tab navigation screens
│   ├── home.tsx      # Main task feed
│   ├── add.tsx       # Create new tasks
│   ├── insights.tsx  # Analytics and streaks
│   └── profile.tsx   # User profile
├── task/
│   └── [id].tsx      # Task detail view
├── auth.tsx          # Authentication screen
└── index.tsx         # Splash screen

contexts/
└── AuthContext.tsx   # Authentication state

lib/
└── supabase.ts       # Supabase client

services/
└── gemini.ts         # AI service integration
```

## Key Features Explained

### Task Management
- Create tasks with title, description, priority (Critical/High/Medium/Low)
- Organize by categories (Work, Personal, Urgent, Health, Finance)
- Set due dates and reminders
- Track time estimates and actual time spent

### AI Integration
- Voice-to-text task creation (requires Gemini API key)
- Personalized productivity insights
- Smart task recommendations
- Completion pattern analysis

### Streak System
- Daily task completion tracking
- Current and longest streak display
- Total tasks completed counter
- Motivational progress tracking

### Modern UI/UX
- Smooth animations with React Native Reanimated
- Clean white and green theme
- Intuitive gestures and interactions
- Responsive design for all screen sizes

## Authentication

Users must create an account to use the app:
1. Open the app
2. Sign up with email and password
3. Sign in to access your tasks
4. All data is securely stored and synced

## Tips for Best Experience

- Enable notifications for task reminders
- Complete at least one task daily to maintain your streak
- Use subtasks to break down complex projects
- Check the Insights tab to track your productivity
- Try voice input for quick task creation (requires API key)

## Troubleshooting

**Authentication issues:**
- Ensure you're using a valid email format
- Check your internet connection
- Try signing out and back in

**Tasks not syncing:**
- Check your internet connection
- Refresh the home screen by pulling down

**Voice input not working:**
- Verify your Gemini API key is correctly set in `.env`
- Check console for API errors

## License

MIT License - feel free to use this project as a template for your own apps!
