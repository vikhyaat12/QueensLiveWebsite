# Queens Care Laboratories — Master Production Deployment Guide

## 1. Hosting Options Overview

Queens Care is built to be **100% hosting-agnostic**. It can be deployed with equal stability on:
- **Vercel** (Recommended for zero-maintenance edge CDN and serverless scale)
- **Node.js VPS / Dedicated Server** (Ubuntu 22.04 LTS / 24.04 LTS with PM2 and Nginx)
- **Docker / Kubernetes / Cloud Containers** (AWS ECS, Google Cloud Run, Railway, Render, Coolify)

---

## 2. Option A: Vercel Production Deployment

### 2.1 Git Push & Project Import
1. Push the repository to GitHub, GitLab, or Bitbucket:
   ```bash
   git add .
   git commit -m "feat(release): Queens Care Production Ready"
   git push origin main
   ```
2. Open the [Vercel Dashboard](https://vercel.com/new).
3. Select your repository and configure:
   - **Root Directory**: `next-app`
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.2 Configure Environment Variables
In the Vercel Dashboard under **Project Settings → Environment Variables**, add:
- `NEXT_PUBLIC_SITE_URL`: `https://queenscare.in`
- `JWT_SECRET`: Random 64-character secret
- `NODE_ENV`: `production`
- `RESEND_API_KEY`: Your Resend API token
- `EMAIL_FROM`: `Queens Care <care@queenscare.in>`
- `RAZORPAY_KEY_ID`: `rzp_live_...`
- `RAZORPAY_KEY_SECRET`: `...`
- `CASHFREE_APP_ID`: `...`
- `CASHFREE_SECRET_KEY`: `...`
- `CASHFREE_ENV`: `PRODUCTION`

### 2.3 Deploy
Click **Deploy**. Build output will compile all 129 routes cleanly in under 80 seconds.

---

## 3. Option B: Docker / Container Deployment

### 3.1 Build the Docker Image
```bash
docker build -t queenscare-app:latest .
```

### 3.2 Run the Production Container
```bash
docker run -d \
  --name queenscare-prod \
  -p 3000:3000 \
  --restart always \
  -e NEXT_PUBLIC_SITE_URL="https://queenscare.in" \
  -e JWT_SECRET="your-secure-secret" \
  -e RESEND_API_KEY="your-resend-key" \
  -v queenscare_data:/app/data \
  -v queenscare_uploads:/app/public/uploads \
  queenscare-app:latest
```

---

## 4. Option C: Node.js VPS Deployment (Ubuntu + PM2 + Nginx)

### 4.1 System Prerequisites
```bash
sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

### 4.2 Application Setup
```bash
cd /var/www/queenscare/next-app
npm ci
cp .env.example .env.local
# Edit .env.local with production credentials
npm run build
pm2 start npm --name "queenscare" -- start -- -p 3000
pm2 save
pm2 startup
```

### 4.3 Nginx Reverse Proxy Configuration (`/etc/nginx/sites-available/queenscare`)
```nginx
server {
    server_name queenscare.in www.queenscare.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 100M;
}
```

Enable SSL:
```bash
sudo ln -s /etc/nginx/sites-available/queenscare /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d queenscare.in -d www.queenscare.in
```

---

## 5. Webhook Configuration

1. **Razorpay Webhooks**:
   - Webhook URL: `https://queenscare.in/api/webhooks/razorpay`
   - Active Events: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`
   - Secret: Match `RAZORPAY_WEBHOOK_SECRET` in your environment.
2. **Cashfree Webhooks**:
   - Webhook URL: `https://queenscare.in/api/checkout/payment-intent`
   - Active Events: `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`
