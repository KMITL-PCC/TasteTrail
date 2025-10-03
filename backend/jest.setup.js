// Mock environment variables
process.env.EMAIL_USER = "test@example.com";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Set longer timeout for all tests
jest.setTimeout(10000);
