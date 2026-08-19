FROM nginx:alpine

# Copy static landing portal files to Nginx default document root
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
