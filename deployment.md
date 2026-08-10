# Deployment Guide — jinnar-gamify-frontend (Manual SSH + Docker)

## Context
Aaj `jinnar-gamify-frontend` ko production server (`195.110.58.111`) pe manually deploy kiya gaya, `deploy.cjs` script chalane ke bajaye direct terminal commands se — taake har step ka output dikhta rahe. Ye document un exact steps ko likhta hai taake user khud, bina Claude ke, next time deployment repeat kar sake.

Ye sirf ek **documentation task** hai — koi code change nahi. Isliye ye plan seedha final steps likhta hai, exploration ki zaroorat nahi thi kyunke sab kuch already is session mein execute ho chuka hai.

## Prerequisites
- Local machine se `root@195.110.58.111` tak SSH access (password-based abhi; key-based setup karna recommended hai — neeche "Security Note" dekhein).
- Local repo path: `/Users/hashirmehmood/Documents/Jinnar/jinnar-gamify-frontend`
- Docker already server pe installed hai.

## Step-by-Step Deployment

### 1. Fresh deployment bundle banao
Local machine pe, project folder ke andar se, current source code ka tar.gz bundle banao — `node_modules`, `dist`, `.git`, aur purana bundle exclude karke:

```bash
cd /Users/hashirmehmood/Documents/Jinnar/jinnar-gamify-frontend
tar -czf deployment-bundle.tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='deployment-bundle.tar.gz' \
  --exclude='.DS_Store' \
  .
```

**Why:** Purana bundle (28 July ka) stale tha — fresh bundle current code reflect karta hai.

### 2. Bundle server pe upload karo
```bash
scp /Users/hashirmehmood/Documents/Jinnar/jinnar-gamify-frontend/deployment-bundle.tar.gz \
  root@195.110.58.111:/root/jinnar-gamify-frontend-bundle.tar.gz
```

### 3. Server pe purana container hatao aur bundle extract karo
```bash
ssh root@195.110.58.111 '
set -e
docker stop jinnar-frontend || true
docker rm jinnar-frontend || true

rm -rf /root/jinnar-frontend-new
mkdir -p /root/jinnar-frontend-new
tar -xzf /root/jinnar-gamify-frontend-bundle.tar.gz -C /root/jinnar-frontend-new
'
```

### 4. Naya Docker image build karo
```bash
ssh root@195.110.58.111 '
cd /root/jinnar-frontend-new
docker build -t jinnar-viral-app:latest .
'
```
Ye Dockerfile ke steps follow karta hai: `npm install` → `npm run build` (Vite build) → image ready.

### 5. Naya container start karo
```bash
ssh root@195.110.58.111 '
docker run -d --name jinnar-frontend -p 6190:6190 --restart unless-stopped jinnar-viral-app:latest
'
```

### 6. Verify karo
```bash
ssh root@195.110.58.111 '
docker ps | grep jinnar-frontend
curl -sI http://localhost:6190 | head -5
'
```
`HTTP/1.1 200 OK` milna chahiye. Site check karo: `http://195.110.58.111:6190`

## Quick reference — sab ek sath (copy-paste)
```bash
cd /Users/hashirmehmood/Documents/Jinnar/jinnar-gamify-frontend
tar -czf deployment-bundle.tar.gz --exclude='node_modules' --exclude='dist' --exclude='.git' --exclude='deployment-bundle.tar.gz' --exclude='.DS_Store' .
scp deployment-bundle.tar.gz root@195.110.58.111:/root/jinnar-gamify-frontend-bundle.tar.gz
ssh root@195.110.58.111 '
set -e
docker stop jinnar-frontend || true
docker rm jinnar-frontend || true
rm -rf /root/jinnar-frontend-new
mkdir -p /root/jinnar-frontend-new
tar -xzf /root/jinnar-gamify-frontend-bundle.tar.gz -C /root/jinnar-frontend-new
cd /root/jinnar-frontend-new
docker build -t jinnar-viral-app:latest .
docker run -d --name jinnar-frontend -p 6190:6190 --restart unless-stopped jinnar-viral-app:latest
docker ps | grep jinnar-frontend
curl -sI http://localhost:6190 | head -5
'
```

## Security Note (pending action)
`deploy.cjs` mein SSH root password plaintext hardcoded hai aur repo `.git` mein committed hai. Recommended:
1. Server ka root password rotate karo.
2. `deploy.cjs` se password hata kar env variable (`SSH_PASSWORD`) ya SSH key-based auth use karo.
3. Check karo password `.git` history mein leak to nahi hua — agar hua hai to history clean karna padega.

Ye deployment guide se alag concern hai, isliye deployment steps mein include nahi kiya — lekin agla kaam yehi hona chahiye.
