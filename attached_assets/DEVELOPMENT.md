# Development Documentation

This document provides technical details and guidelines for developing the Construction Contractor Management System.

## Architecture

### Frontend Architecture

```
client/
├── src/
│   ├── components/
│   │   ├── forms/          # Form components
│   │   │   ├── VendorForm.tsx       # Enhanced vendor management
│   │   │   ├── UploadDocumentForm.tsx # Document upload handling
│   │   │   └── ...
│   │   ├── ui/            # shadcn/ui components
│   │   └── layout/        # Layout components
│   ├── pages/             # Page components
│   ├── lib/               # Utilities and configurations
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript types
```

### Backend Architecture

```
server/
├── routes/            # API route handlers
├── middleware/        # Express middleware
├── firebase-admin.ts  # Firebase admin configuration
└── storage.ts         # Storage interface
```

## Component Guidelines

### Forms
- Use React Hook Form with Zod validation
- Import schemas from `@shared/schema`
- Use shadcn/ui form components
- Handle file uploads through Firebase Storage
- Implement collapsible sections for complex forms
- For edit mode forms:
  - Pass vendorId prop to enable update functionality
  - Use initialData prop to populate form fields
  - Update button text based on mode ("Create" vs "Update")
  - Handle form state reset only for create mode

Example:
```typescript
const form = useForm<BusinessProfile>({
  resolver: zodResolver(businessProfileSchema),
  defaultValues: initialData || {
    // ... default values
  }
});
```

### Vendor Form Best Practices
- Always provide mode prop ("create" or "edit")
- Pass vendorId for edit operations
- Use proper error handling and progress indicators
- Implement proper form state management
- Clear form only after successful creation
- Preserve form data during updates
- Show appropriate button text based on mode
- Use consistent UI styling between create and edit modes
- Properly handle API function calls with appropriate method names
- Display user-friendly error messages for API failures
- Implement animated progress indicators for long-running operations
- Use consistent validation feedback across all form fields

### API Calls
- Use TanStack Query for data fetching
- Handle mutations with optimistic updates
- Use query invalidation for cache management
- For vendor operations:
  - Create: Use VendorOperations.create()
  - Update: Use VendorOperations.update(vendorId, data)
  - Properly handle errors and loading states

Example:
```typescript
const { mutate } = useMutation({
  mutationFn: async (data) => {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      body: JSON.stringify(data)
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["key"] });
  }
});
```

### Authentication
- Use Firebase Authentication
- Implement role-based access control
- Protect routes with auth middleware

Example:
```typescript
const { user, loading } = useAuth();
if (loading) return <LoadingSpinner />;
if (!user) return <Navigate to="/login" />;
```

## State Management

### Query Keys
Follow this pattern for query keys:
- List: `["/api/resource"]`
- Detail: `["/api/resource", id]`
- Filtered: `["/api/resource", { filters }]`

### Form State
- Use React Hook Form for form state
- Implement controlled inputs
- Handle validation with Zod schemas
- Use accordion components for complex forms

## Styling Guidelines

### Theme Configuration
- Use theme.json for global styles
- Follow the color scheme:
  - Primary: Brand colors
  - Secondary: Supporting colors
  - Accent: Highlight colors

### CSS Classes
- Use TailwindCSS utilities
- Create custom components for repeated patterns
- Follow mobile-first approach

## Testing

### Unit Tests
- Test components in isolation
- Mock Firebase services
- Test form validation

### Integration Tests
- Test component interactions
- Verify API integrations
- Test authentication flows

## Performance Considerations

### Optimization
- Implement lazy loading for routes
- Use proper image optimization
- Minimize bundle size

### Caching
- Configure proper cache policies
- Implement service workers
- Use query caching effectively

## Deployment

### Build Process
```bash
# Production build
npm run build

# Start production server
npm run start
```

### Environment Configuration
Required environment variables:
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

## Contributing

1. Follow the branching strategy:
   - feature/
   - bugfix/
   - hotfix/

2. Code Review Process:
   - Write descriptive PR titles
   - Include test coverage
   - Update documentation

3. Commit Message Format:
   ```
   type(scope): description

   [optional body]
   ```

## Troubleshooting

Common issues and solutions:
1. Firebase Connection Issues
   - Verify environment variables
   - Check Firebase console settings

2. Build Errors
   - Clear node_modules and reinstall
   - Verify TypeScript types
   - Check for circular dependencies

## Security Best Practices

1. Data Validation
   - Validate all input with Zod
   - Sanitize file uploads
   - Implement rate limiting

2. Authentication
   - Use Firebase security rules
   - Implement proper role checks
   - Secure API endpoints

3. File Upload Security
   - Validate file types
   - Implement size limits
   - Use secure URLs