FROM nginx:alpine

# Create nginx user with UID 1001
RUN addgroup -g 1001 -S nginx-app && \
    adduser -u 1001 -S nginx-app -G nginx-app

# Create required directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx /var/run /var/log/nginx

# Copy application files
COPY --chown=nginx-app:nginx-app dist/ /usr/share/nginx/html/

# Configure nginx for port 3000 and non-root
RUN echo 'server { \
    listen 3000; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api/ { \
        proxy_pass https://fleet-api.gentlepond-ec715fc2.eastus2.azurecontainerapps.io/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
    \
    location /ready { \
        access_log off; \
        return 200 "OK"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf && \
    # Update nginx.conf to run as non-root
    sed -i 's/user  nginx;/user  nginx-app;/g' /etc/nginx/nginx.conf && \
    # Allow nginx to write to necessary directories
    touch /var/run/nginx.pid && \
    chown nginx-app:nginx-app /var/run/nginx.pid

USER nginx-app
EXPOSE 3000
