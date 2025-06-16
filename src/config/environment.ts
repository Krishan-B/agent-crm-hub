
interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isTesting: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  enableLogging: boolean;
  enableErrorReporting: boolean;
  apiBaseUrl: string;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  const isTesting = import.meta.env.MODE === 'test';

  return {
    isDevelopment,
    isProduction,
    isTesting,
    supabaseUrl: 'https://zknyyltinlagwkbbedrx.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprbnl5bHRpbmxhZ3drYmJlZHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjIyNzAsImV4cCI6MjA2NTUzODI3MH0.C-DFrJ9xI-KXPDHbXLTr8Ym7V1eRxL8FTJfylwT9UBg',
    enableLogging: isDevelopment || isTesting,
    enableErrorReporting: isProduction,
    apiBaseUrl: isProduction 
      ? 'https://zknyyltinlagwkbbedrx.supabase.co/functions/v1' 
      : 'https://zknyyltinlagwkbbedrx.supabase.co/functions/v1'
  };
};

export const env = getEnvironmentConfig();
export default env;
