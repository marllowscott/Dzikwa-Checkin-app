# Digital Check-In System

A modern, responsive web application for digital check-in/check-out with real-time data storage and analytics dashboard.

## Features

- **Real-time Check-in/Out**: Streamlined attendance tracking with instant feedback
- **Dashboard Analytics**: Monthly and yearly categorized statistics and insights
- **Responsive Design**: Mobile-first design that works beautifully on all devices
- **Modern UI**: Shadow-themed design with smooth animations and transitions
- **Data Export**: CSV export functionality for attendance records
- **Supabase Backend**: Real-time database with automatic data persistence

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL)
- **Routing**: React Router
- **Icons**: Lucide React
- **Notifications**: Sonner

## Setup Instructions

### 1. Database Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. In the SQL Editor, run the schema from `database-schema.sql`:

```sql
-- Create check_ins table
CREATE TABLE check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  time_in TIMESTAMPTZ DEFAULT NOW(),
  time_out TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_check_ins_time_in ON check_ins(time_in);
CREATE INDEX idx_check_ins_name_surname ON check_ins(name, surname);

-- Enable Row Level Security (RLS)
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for anon users" ON check_ins
  FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_check_ins_updated_at
  BEFORE UPDATE ON check_ins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. Copy your project URL and anon key from Settings > API

### 2. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your Supabase credentials from Settings > API in your Supabase dashboard:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Installation

```bash
npm install
```

### 4. Development

```bash
npm run dev
```

The app will be available at `http://localhost:8083`

### 5. Build for Production

```bash
npm run build
```

### 6. Deployment

The built files in `dist/` can be deployed to any static hosting service:

- **Vercel**: Connect your GitHub repo and deploy automatically
- **Netlify**: Drag and drop the `dist` folder or connect via Git
- **GitHub Pages**: Use GitHub Actions for automated deployment
- **AWS S3 + CloudFront**: For scalable static hosting

## Usage

1. **Check-in/Out**: Enter your first name and surname, then click Check In or Check Out
2. **Dashboard**: View analytics, monthly breakdowns, and key statistics
3. **Logs**: Browse detailed attendance records with filtering options
4. **Export**: Download CSV files of attendance data

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── Navigation.tsx
│   └── CheckInForm.tsx
├── pages/
│   ├── Index.tsx     # Check-in/out page
│   ├── Dashboard.tsx # Analytics dashboard
│   ├── Logs.tsx      # Detailed logs view
│   └── NotFound.tsx
├── lib/
│   ├── supabase.ts   # Database client
│   └── utils.ts
└── App.tsx
```

## Design System

- **Colors**: Deep indigo background, electric cyan accents, warm gray text
- **Typography**: Poppins font family
- **Shadows**: Multi-layered shadows for 3D depth effect
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first with touch-friendly interfaces

## Security Notes

- Row Level Security (RLS) is enabled on the database
- For production, consider implementing proper authentication
- API keys are exposed on the client side (standard for Supabase)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
1
