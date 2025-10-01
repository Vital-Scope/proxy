FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

#COPY src ./src

COPY . .

# Каталог для датасета монтируем томом (не копируем внутрь образа)
#VOLUME ["/app/dataset"]

# Каталог для выходных файлов, куда пишет `DIR_PATH`
RUN mkdir -p /app/output

# Базовые значения; переопределяйте при запуске
ENV PORT=3000 
  #  DIR_PATH=output

EXPOSE 3000

USER node
CMD ["npm", "start"]