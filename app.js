const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { validateEnv } = require('./utils/envValidator');
const env = validateEnv({
  required: ['MONGO_URL', 'JWT_SECRET', 'PORT'],
  optional: ['NODE_ENV', 'CLIENT_URL', 'ALLOWED_ORIGINS', 'JWT_EXPIRES_IN', 'DEFAULT_WEBSITE_SLUG'],
  defaults: { NODE_ENV: 'development', PORT: 5000, DEFAULT_WEBSITE_SLUG: 'similaris' },
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const parseLocale = require('./middleware/parseLocale');
const authRoutes = require('./routes/authRoutes');
const siteRoutes = require('./routes/siteRoutes');
const submitRoutes = require('./routes/submitRoutes');
const contactRoutes = require('./routes/contactRoutes');
const removeRoutes = require('./routes/removeRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const reportRoutes = require('./routes/reportRoutes');
const blogRoutes = require('./routes/blogRoutes');
const faqRoutes = require('./routes/faqRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const resolveWebsite = require('./middleware/resolveWebsite');
const { requireAdmin } = require('./middleware/adminAuth');
const adminWebsiteRoutes = require('./routes/adminWebsiteRoutes');
const adminSiteRoutes = require('./routes/adminSiteRoutes');
const adminSubmissionRoutes = require('./routes/adminSubmissionRoutes');
const adminContactRoutes = require('./routes/adminContactRoutes');
const adminRemoveRoutes = require('./routes/adminRemoveRoutes');
const adminNewsletterRoutes = require('./routes/adminNewsletterRoutes');
const adminBlogRoutes = require('./routes/adminBlogRoutes');
const adminFaqRoutes = require('./routes/adminFaqRoutes');
const adminSponsoredRoutes = require('./routes/adminSponsoredRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminReviewRoutes = require('./routes/adminReviewRoutes');
const adminSimilarityVoteRoutes = require('./routes/adminSimilarityVoteRoutes');
const sitemapRoutes = require('./routes/sitemapRoutes');
const robotsRoutes = require('./routes/robotsRoutes');
const staticPageRoutes = require('./routes/staticPageRoutes');
const adminStaticPageRoutes = require('./routes/adminStaticPageRoutes');

const app = express();
app.set('trust proxy', 1);

app.use(requestId);

const isDev = env.NODE_ENV !== 'production';
const envAllowed =
  env.ALLOWED_ORIGINS && typeof env.ALLOWED_ORIGINS === 'string'
    ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
const allowedOrigins = [
  env.CLIENT_URL,
  ...envAllowed,
  'https://ubiquitous-alfajores-f4baae.netlify.app',
  'https://starlit-conkies-b6b727.netlify.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin && isDev) return cb(null, true);
      if (isDev && origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')))
        return cb(null, true);
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Website-Slug', 'X-Locale'],
    credentials: true,
  })
);


app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests' },
  })
);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(parseLocale);

mongoose
  .connect(env.MONGO_URL)
  .then(() => logger.info('MongoDB connected'))
  .catch((err) => {
    logger.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: env.NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/sites', resolveWebsite, siteRoutes);
app.use('/api/submit', resolveWebsite, submitRoutes);
app.use('/api/contact', resolveWebsite, contactRoutes);
app.use('/api/remove', resolveWebsite, removeRoutes);
app.use('/api/newsletter', resolveWebsite, newsletterRoutes);
app.use('/api/report', resolveWebsite, reportRoutes);
app.use('/api/blog', resolveWebsite, blogRoutes);
app.use('/api/faq', resolveWebsite, faqRoutes);
app.use('/api/pages', resolveWebsite, staticPageRoutes);
app.use('/api/sitemap.xml', resolveWebsite, sitemapRoutes);
app.use('/api/robots.txt', resolveWebsite, robotsRoutes);

app.use('/api/admin/websites', requireAdmin[0], requireAdmin[1], adminWebsiteRoutes);
app.use('/api/admin/sites', requireAdmin[0], requireAdmin[1], adminSiteRoutes);
app.use('/api/admin/submissions', requireAdmin[0], requireAdmin[1], adminSubmissionRoutes);
app.use('/api/admin/contact', requireAdmin[0], requireAdmin[1], adminContactRoutes);
app.use('/api/admin/remove', requireAdmin[0], requireAdmin[1], adminRemoveRoutes);
app.use('/api/admin/newsletter', requireAdmin[0], requireAdmin[1], adminNewsletterRoutes);
app.use('/api/admin/pages', requireAdmin[0], requireAdmin[1], adminStaticPageRoutes);
app.use('/api/admin/blog', requireAdmin[0], requireAdmin[1], adminBlogRoutes);
app.use('/api/admin/faq', requireAdmin[0], requireAdmin[1], adminFaqRoutes);
app.use('/api/admin/sponsored', requireAdmin[0], requireAdmin[1], adminSponsoredRoutes);
app.use('/api/admin/dashboard', requireAdmin[0], requireAdmin[1], adminDashboardRoutes);
app.use('/api/admin/reviews', requireAdmin[0], requireAdmin[1], adminReviewRoutes);
app.use('/api/admin/similarity-votes', requireAdmin[0], requireAdmin[1], adminSimilarityVoteRoutes);

app.use(errorHandler);
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = env.PORT;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

module.exports = app;
