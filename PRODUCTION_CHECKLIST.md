# Production Checklist

## Environment

- [ ] `.env` configured
- [ ] `MONGO_URI` configured
- [ ] `JWT_SECRET` is strong
- [ ] `CLIENT_URL` set to frontend domain
- [ ] Cloudinary credentials configured
- [ ] `NODE_ENV=production`

## Security

- [ ] Helmet enabled
- [ ] CORS restricted
- [ ] Rate limiting enabled
- [ ] Request body limit enabled
- [ ] Upload file size limit enabled
- [ ] Upload MIME validation enabled
- [ ] JWT secret not committed
- [ ] `.env` ignored by Git

## Database

- [ ] MongoDB connected
- [ ] Indexes created
- [ ] Search index tested
- [ ] Production database URI used

## API

- [ ] Health route works
- [ ] Auth routes tested
- [ ] Notes routes tested
- [ ] Upload routes tested
- [ ] Error responses tested
- [ ] Pagination tested

## Deployment

- [ ] Build/start command configured
- [ ] Environment variables added to hosting platform
- [ ] Health check endpoint configured
- [ ] Logs checked after deploy
- [ ] Graceful shutdown tested