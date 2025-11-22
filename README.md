# Contacts

A modern personal contacts management application with web and Android interfaces.

## Features

- **Contact Management**: Store and organize contacts with addresses, phone numbers, emails, and custom attributes
- **Upcoming Events**: Track birthdays and anniversaries with reminders
- **User Sharing**: Share your contacts with other users (full CRUD access)
- **Dark Mode**: Full dark mode support on both web and mobile
- **Responsive Design**: Optimized for desktop, tablet, and mobile (including foldables like Samsung Fold)

## Architecture

```
contacts/
├── backend/          # FastAPI + PostgreSQL API
├── webapp/           # Next.js 14 web application
├── android/          # Kotlin + Jetpack Compose Android app
└── docker-compose.yml
```

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM with async support
- **Pydantic** - Data validation

### Web Application
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching
- **TypeScript** - Type safety

### Android Application
- **Kotlin** - Programming language
- **Jetpack Compose** - Modern UI toolkit
- **Hilt** - Dependency injection
- **Retrofit** - HTTP client

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for webapp development)
- Python 3.11+ (for backend development)
- Android Studio (for Android development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/contacts.git
   cd contacts
   ```

2. **Start the backend with Docker**
   ```bash
   docker-compose up -d db backend
   ```

3. **Run database migrations and import data**
   ```bash
   docker-compose exec backend python scripts/migrate_data.py
   ```

4. **Register users and set up sharing**
   ```bash
   # Register users via API
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username": "mindsignals", "password": "your_password"}'

   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username": "momo", "password": "momo_password"}'

   # Share data from mindsignals to momo
   curl -X POST http://localhost:8000/api/v1/auth/share \
     -u mindsignals:your_password \
     -H "Content-Type: application/json" \
     -d '{"username": "momo"}'
   ```

5. **Start the webapp**
   ```bash
   cd webapp
   npm install
   npm run dev
   ```

6. **Open Android project**
   - Open `android/` in Android Studio
   - Update `API_BASE_URL` in `app/build.gradle.kts` for your server
   - Build and run on device/emulator

### Production Deployment (Coolify)

1. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

2. **Deploy with docker-compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## API Authentication

The API uses HTTP Basic Authentication. All endpoints except `/auth/register` require authentication.

```bash
# Example: Get contacts
curl -u username:password http://localhost:8000/api/v1/persons/
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/share` - Share contacts with another user
- `DELETE /api/v1/auth/share/{username}` - Remove sharing

### Contacts
- `GET /api/v1/persons/` - List contacts
- `GET /api/v1/persons/{id}` - Get contact details
- `POST /api/v1/persons/` - Create contact
- `PUT /api/v1/persons/{id}` - Update contact
- `DELETE /api/v1/persons/{id}` - Delete contact

### Upcoming Events
- `GET /api/v1/upcoming/birthdays?days=30` - Upcoming birthdays
- `GET /api/v1/upcoming/anniversaries?days=30` - Upcoming anniversaries
- `GET /api/v1/upcoming/all?days=30` - All upcoming events

## Testing

```bash
# Backend tests
cd backend
pip install -e ".[dev]"
pytest

# Webapp tests
cd webapp
npm test

# Android tests
cd android
./gradlew test
```

## License

Private repository - All rights reserved.
