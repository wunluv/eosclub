# EOS CLUB — Step-by-Step Server Setup Guide

This guide is tailored to your DigitalOcean structure at `/var/www/public`.

## 1. What is a GitHub Deploy Key?
A **Deploy Key** is a unique SSH key stored on your server and added to your GitHub repository's settings. It gives your server (specifically the TinaCMS backend) permission to:
1. **Pull** the latest code (for deployments).
2. **Push** content changes (when an editor saves in the CMS).

Using a deploy key is more secure than using your personal password because it's limited to just this one repository.

---

## 2. Directory Structure on your Server
Based on your existing setup, we will use the directory `eos.khanyi.com` as the "Source of Truth" (the Git repo).

- **Git Repo (Source):** `/var/www/public/eos.khanyi.com`
- **Build Output (Live Site):** `/var/www/public/eos.khanyi.com/dist`
- **Private Config (Secrets):** `/var/www/private/eosclub`

---

## 3. Step 1: Generate the SSH Key on your Server
Run these commands in your server terminal:

```bash
# 1. Create the private config directory
mkdir -p /var/www/private/eosclub

# 2. Generate the SSH key (press Enter for no passphrase)
ssh-keygen -t ed25519 -C "eosclub-deploy-key" -f /var/www/private/eosclub/deploy_key

# 3. View the public key — copy this entire string starting with "ssh-ed25519..."
cat /var/www/private/eosclub/deploy_key.pub
```

---

## 4. Step 2: Add it to GitHub
1. Go to your repository on GitHub: `https://github.com/wunluv/eosclub`
2. Click **Settings** (top tab)
3. On the left sidebar, click **Deploy keys**
4. Click **Add deploy key**
5. **Title:** `DO-Droplet-EOS`
6. **Key:** Paste the string you copied in Step 3
7. **IMPORTANT:** Check the box **"Allow write access"** (the CMS needs to push changes)
8. Click **Add key**

---

## 5. Step 3: Clone the Repo to your Server
Now that the key is registered, use it to clone the repository:

```bash
# 1. Temporarily tell your current terminal session to use this key
export GIT_SSH_COMMAND="ssh -i /var/www/private/eosclub/deploy_key -o StrictHostKeyChecking=no"

# 2. Navigate to your public directory
cd /var/www/public

# 3. If the directory already exists (the landing page), move it aside
mv eos.khanyi.com eos.khanyi.com_backup

# 4. Clone the repository
git clone git@github.com:wunluv/eosclub.git eos.khanyi.com
```

---

## 6. Step 4: Environment Variables (.env)
Create the production `.env` file on your server:

```bash
nano /var/www/private/eosclub/.env
```

Paste and fill in these values:
```bash
# Site
PUBLIC_SITE_URL=https://staging.prod.khanyi.com
PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/AKfycbyG2JAWvplQX6JgHlCD0VybEAYzzTJmoldiV8qYwjf8kJY4La9CKkspgpnMjyX7sMvq/exec

# TinaCMS Self-Hosted
TINA_SELF_HOSTED=true
TINA_ADMIN_PASSWORD_HASH=$2a$10$CdSEIss36mTFtwB89tbBhe/k4etMl2iIkfzn52GzY640ZIaVjgeZ6    # I can help you generate this bcrypt hash
TINA_JWT_SECRET=asdjaksewrjszdnbzldksfzsdkjfzsdkfzskdf             # Type a random long string here
TINA_JWT_EXPIRY=7d
```

---

## 7. Step 5: Start the Docker Services
Now navigate to the deployment directory and start the services:

```bash
cd /var/www/public/eos.khanyi.com/deploy
docker compose -f docker-compose.eosclub.yml up -d --build
```

---

## 8. Summary of Nginx Symlinks
Once the initial build is done (manually for the first time):

```bash
# Navigate to the repo
cd /var/www/public/eos.khanyi.com

# Build the site
pnpm install
pnpm run build

# Your staging link already points to the right place:
# staging.eos-club.de -> eos.khanyi.com/dist
```

I can help you with each step as you go. Which step would you like to start with?
