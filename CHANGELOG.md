# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-03-10

### Added
- Enhanced asset management interface with View, Edit, and Delete actions
- Responsive asset form dialog with viewport optimization
- Improved asset listing with proper Firestore indexing
- Status indicators with color coding for asset states

### Fixed
- Asset collection Firestore index configuration for proper sorting
- Asset form viewport scaling across different device sizes
- Actions column layout and icon consistency

## [1.0.2] - 2025-03-11

### Fixed
- Fixed "VendorOperations.updateVendor is not a function" error in edit vendor form
- Enhanced error handling in vendor update operations
- Improved loading states and progress indicators during vendor updates
- Added consistency to form styling between create and edit modes

## [1.0.1] - 2025-03-10

### Fixed
- Vendor form edit functionality now correctly updates existing vendors instead of creating new ones
- "Update Vendor" button text now shows correctly in edit mode
- Improved error handling and logging in vendor operations
- Fixed state management in vendor form to prevent UI freezes

## [1.0.0] - 2025-03-04

### Added
- Enhanced VendorForm with collapsible sections and comprehensive vendor management
- New UploadDocumentForm component with file validation and categorization
- Updated landing page with "Try Free For 7 Days" call-to-action
- Renamed "Assets" to "Asset Register" in navigation for better clarity

### Features
- User authentication and authorization
- Role-based access control (Admin, Manager, User)
- Asset tracking and management
- Vendor relationship management
- Team collaboration tools
- Document storage and organization
- Business profile customization
- Interactive dashboard with analytics
- File upload capabilities
- Responsive mobile-first design

### Security
- Secure Firebase authentication
- Protected API routes
- Role-based access control
- Secure file uploads