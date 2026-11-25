import app from './app.js';
import { connectDatabase } from './modules/auth/service.js';

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    await connectDatabase();
    console.log('MongoDB connected successfully.');
    app.listen(port, host, () => {
      console.log(`Skillpath API listening on http://${host}:${port}`);
    });
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exitCode = 1;
  }
}

startServer();
