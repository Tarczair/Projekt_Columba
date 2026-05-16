FROM node:20-alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package*.json ./
# Instalujemy wszystko
RUN npm install
# Kopiujemy folder prisma przed generowaniem
COPY prisma ./prisma/
# Generujemy klienta (tutaj może wywalić błąd, jeśli schema jest zła)
RUN npx prisma generate
# Kopiujemy resztę kodu
COPY . .
EXPOSE 5000
CMD ["npm", "start"]