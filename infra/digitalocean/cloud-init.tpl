#cloud-config
packages:
  - docker.io
  - docker-compose-plugin

runcmd:
  - systemctl enable --now docker
  - usermod -aG docker root
  - mkdir -p /opt/ujuz

write_files:
  - path: /opt/ujuz/deploy.sh
    permissions: '0755'
    content: |
      #!/usr/bin/env bash
      set -euo pipefail
      IMAGE="${image}:${tag}"
      echo "Deploying image: $IMAGE"

      cd /opt/ujuz

      # Pull latest image
      docker pull "$IMAGE" || true

      # Stop existing containers
      docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

      # Start services
      docker compose -f docker-compose.prod.yml up -d

      # Cleanup old images
      docker image prune -f

  - path: /opt/ujuz/docker-compose.prod.yml
    permissions: '0644'
    content: |
      services:
        redis:
          image: redis:7-alpine
          restart: unless-stopped
          healthcheck:
            test: ["CMD", "redis-cli", "ping"]
            interval: 10s
            timeout: 3s
            retries: 3

        api:
          image: ${image}:${tag}
          environment:
            APP_NAME: api
          env_file: .env
          ports:
            - "3000:3000"
          depends_on:
            redis:
              condition: service_healthy
          restart: unless-stopped
          healthcheck:
            test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
            interval: 15s
            timeout: 5s
            retries: 3
            start_period: 10s

        worker-alerts:
          image: ${image}:${tag}
          environment:
            APP_NAME: worker-alerts
          env_file: .env
          depends_on:
            redis:
              condition: service_healthy
          restart: unless-stopped

        worker-ai:
          image: ${image}:${tag}
          environment:
            APP_NAME: worker-ai
          env_file: .env
          depends_on:
            redis:
              condition: service_healthy
          restart: unless-stopped

  - path: /etc/systemd/system/ujuz-deploy.service
    permissions: '0644'
    content: |
      [Unit]
      Description=UJUz Deploy Service
      After=network.target docker.service

      [Service]
      Type=oneshot
      ExecStart=/opt/ujuz/deploy.sh

      [Install]
      WantedBy=multi-user.target
