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
    # ================================================================ \
    # Security Headers \
    # ================================================================ \
    \
    # Prevent clickjacking attacks - only allow same origin iframes \
    add_header X-Frame-Options "DENY" always; \
    \
    # Prevent MIME type sniffing \
    add_header X-Content-Type-Options "nosniff" always; \
    \
    # Enable XSS protection (legacy browsers) \
    add_header X-XSS-Protection "1; mode=block" always; \
    \
    # Control referrer information sent with requests \
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \
    \
    # Control which browser features and APIs can be used \
    add_header Permissions-Policy "geolocation=(self), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(self)" always; \
    \
    # Content Security Policy - Comprehensive protection against XSS and injection attacks \
    # Allows: \
    #   - Self-hosted assets \
    #   - Google Maps API (maps.googleapis.com, maps.gstatic.com) \
    #   - DiceBear avatars API (api.dicebear.com) \
    #   - Google Fonts (fonts.googleapis.com, fonts.gstatic.com) \
    #   - CDN resources (cdn.jsdelivr.net, unpkg.com) \
    #   - WebSocket connections for real-time features \
    #   - Data URLs for inline images and fonts \
    #   - Blob URLs for dynamic content \
    add_header Content-Security-Policy "default-src '\''self'\''; script-src '\''self'\'' '\''unsafe-inline'\'' '\''unsafe-eval'\'' https://maps.googleapis.com https://cdn.jsdelivr.net https://unpkg.com; style-src '\''self'\'' '\''unsafe-inline'\'' https://fonts.googleapis.com; font-src '\''self'\'' https://fonts.gstatic.com data:; img-src '\''self'\'' data: https: blob: https://api.dicebear.com https://maps.googleapis.com https://maps.gstatic.com; connect-src '\''self'\'' wss: ws: https://maps.googleapis.com https://api.dicebear.com https://*.azure.com https://*.windows.net; frame-src '\''self'\'' https://login.microsoftonline.com; worker-src '\''self'\'' blob:; object-src '\''none'\''; base-uri '\''self'\''; form-action '\''self'\''; frame-ancestors '\''none'\'';" always; \
    \
    # Enable HSTS for production (uncomment when serving over HTTPS) \
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always; \
    \
    # ================================================================ \
    # Application Routes \
    # ================================================================ \
    \
    location / { \
    try_files $uri $uri/ /index.html; \
    \
    # Cache control for HTML files - never cache \
    location = /index.html { \
    add_header Cache-Control "no-cache, no-store, must-revalidate" always; \
    add_header Pragma "no-cache" always; \
    add_header Expires "0" always; \
    } \
    } \
    \
    # Static assets caching \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
    expires 1y; \
    add_header Cache-Control "public, immutable" always; \
    access_log off; \
    } \
    \
    # API proxy with WebSocket support \
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
    \
    # Hide backend server information \
    proxy_hide_header X-Powered-By; \
    proxy_hide_header Server; \
    } \
    \
    # Health check endpoint \
    location /ready { \
    access_log off; \
    return 200 "OK"; \
    add_header Content-Type text/plain; \
    } \
    \
    # Deny access to hidden files (security) \
    location ~ /\. { \
    deny all; \
    access_log off; \
    log_not_found off; \
    } \
    \
    # Deny access to backup and sensitive files \
    location ~* \.(env|log|git|sql|md|sh|yml|yaml|bak|swp|~)$ { \
    deny all; \
    access_log off; \
    log_not_found off; \
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
