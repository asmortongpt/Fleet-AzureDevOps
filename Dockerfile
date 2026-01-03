FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } location /api/ { proxy_pass https://fleet-api.gentlepond-ec715fc2.eastus2.azurecontainerapps.io/api/; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
