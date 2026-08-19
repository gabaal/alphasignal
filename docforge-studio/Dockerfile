FROM nginx:alpine

# Copy static web IDE files to Nginx default document root
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
