# Construction Contractor Management System

A modern web application for managing construction contractors, assets, teams, and documents. Built with React, TypeScript, and Firebase.

## Features

- 🔐 **Secure Authentication**: Email/password and Google sign-in options
- 📊 **Interactive Dashboard**: Real-time statistics and activity tracking
- 🚛 **Asset Register**: Comprehensive equipment, tools, and vehicle tracking
- 👥 **Team Management**: Invite and manage team members with role-based access
- 📂 **Document Management**: Advanced document upload and categorization system
- 🏢 **Enhanced Vendor Management**: 
  - Detailed vendor profiles with compliance tracking
  - Seamless editing functionality with clear update/create workflows
  - Real-time validation and robust error handling
  - Animated progress indicators for all operations
  - Consistent UI styling between create and edit modes
  - Collapsible form sections for improved user experience
- 🎨 **Modern UI**: Responsive design with gradient elements
- 🔄 **Real-time Updates**: Live data synchronization
- 📝 **Forms**: Rich form components with validation and categorization
- 🎯 **Intuitive Navigation**: Clear labeling and organized structure

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Authentication**: Firebase Auth
- **Database**: Firebase Realtime Database
- **Storage**: Firebase Storage
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20.x or later
- A Firebase project with authentication enabled
- Firebase project credentials

### Environment Variables

Create a `.env` file with the following variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
npm run start
```

## Usage

1. **Authentication**: Sign in using email/password or Google account
2. **Dashboard**: View key metrics and recent activity
3. **Asset Register**: Add and manage construction equipment
4. **Team**: Invite team members and assign roles
5. **Documents**: Upload and categorize project files
6. **Vendors**: 
   - Add new vendors with detailed profiles
   - Edit existing vendors with instant updates
   - Track vendor compliance and documentation
   - Manage supplier relationships effectively
7. **Profile**: Customize business information

## Development

- Uses Vite for fast development
- TailwindCSS for styling
- TypeScript for type safety
- Zod for schema validation
- React Hook Form for form management

## License

MIT License - see LICENSE file for details

## Support

For support, email support@constructionpro.com or open an issue in the repository.