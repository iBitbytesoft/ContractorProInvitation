// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

console.log('Validating environment variables...');

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`- ${varName}`);
  });
  console.error('\nMake sure these environment variables are set in your Vercel project settings.');
  process.exit(1);
}

console.log('✓ All required environment variables are present');
process.exit(0);