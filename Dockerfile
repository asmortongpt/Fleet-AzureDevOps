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

# Configure nginx with proxy temp paths for read-only filesystem
RUN echo 'proxy_temp_path /var/cache/nginx/proxy_temp; \
    client_body_temp_path /var/cache/nginx/client_temp; \
    fastcgi_temp_path /var/cache/nginx/fastcgi_temp; \
    uwsgi_temp_path /var/cache/nginx/uwsgi_temp; \
    scgi_temp_path /var/cache/nginx/scgi_temp; \
    \
    server { \
    listen 3000; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    \
    location /api/ { \
    proxy_pass http://fleet-api-service.fleet-management.svc.cluster.local/api/; \
    proxy_ssl_verify off; \
    proxy_ssl_server_name on; \
    proxy_http_version 1.1; \
    proxy_set_header Host fleet-api-service.fleet-management.svc.cluster.local; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "upgrade"; \
    proxy_buffering on; \
    proxy_buffer_size 4k; \
    proxy_buffers 8 4k; \
    proxy_busy_buffers_size 8k; \
    proxy_connect_timeout 60s; \
    proxy_send_timeout 60s; \
    proxy_read_timeout 60s; \
    } \
    \
    location /ready { \
    access_log off; \
    return 200 "OK"; \
    add_header Content-Type text/plain; \
    } \
    }' > /etc/nginx/conf.d/default.conf && \
    # Create proxy temp directories
    mkdir -p /var/cache/nginx/proxy_temp /var/cache/nginx/client_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    # Update nginx.conf to run as non-root
    sed -i 's/user  nginx;/user  nginx-app;/g' /etc/nginx/nginx.conf && \
    # Allow nginx to write to necessary directories
    touch /var/run/nginx.pid && \
    chown nginx-app:nginx-app /var/run/nginx.pid

USER nginx-app
EXPOSE 3000
