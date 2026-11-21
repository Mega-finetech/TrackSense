import express from 'express';
import { env } from './src/config/env.js';
import cors from 'cors';
import healthRoutes from './src/routes/healthRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import goalsRoutes from './src/routes/goalsRoutes.js';
import milestonesRoutes from './src/routes/milestonesRoutes.js';
import tasksRoutes from './src/routes/tasksRoutes.js';
import coursesRoutes from './src/routes/coursesRoutes.js';
import assignmentsRoutes from './src/routes/assignmentsRoutes.js';
import examsRoutes from './src/routes/examsRoutes.js';
import studySessionsRoutes from './src/routes/studySessionsRoutes.js';
import spiritualRoutes from './src/routes/spiritualRoutes.js';
import biblePlansRoutes from './src/routes/biblePlansRoutes.js';
import streaksRoutes from './src/routes/streaksRoutes.js';
import projectsRoutes from './src/routes/projectsRoutes.js';
import focusSessionsRoutes from './src/routes/focusSessionsRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import notificationsRoutes from './src/routes/notificationsRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import preferencesRoutes from './src/routes/preferencesRoutes.js';
import errorHandler from './src/middleware/errorHandler.js';
import pool from './src/utils/db.js';
import { safeErrorCode } from './src/utils/safeError.js';



const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/study-sessions', studySessionsRoutes);
app.use('/api/spiritual', spiritualRoutes);
app.use('/api/bible-plans', biblePlansRoutes);
app.use('/api/streaks', streaksRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/focus-sessions', focusSessionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/preferences', preferencesRoutes);

app.use(errorHandler);

const PORT = env.port;

try {
  await pool.query('SELECT 1');
  const server = app.listen(PORT, () => {
    console.log(`Backend ready on port ${PORT}; database connection verified.`);
  });
  const shutdown = () => server.close(() => { pool.end().finally(() => process.exit(0)); });
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  server.on('error', async error => {
    console.error(`Backend listener failed (${safeErrorCode(error)}).`);
    await pool.end(); process.exitCode = 1;
  });
} catch (error) {
  console.error(`Backend startup refused: database connection failed (${safeErrorCode(error)}). Check the effective DATABASE_URL configuration.`);
  await pool.end(); process.exitCode = 1;
}
