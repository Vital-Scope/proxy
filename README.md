### Proxy (Node.js) — сборка и запуск через Docker

Ниже — краткая инструкция, как собрать и запустить сервис с помощью `Dockerfile`, используя ваш `.env` и пробрасывая внешний порт 8081.

## Что это
- **HTTP API** на `Express`
- Эндпоинты:
  - **POST** `/proxy/random` — тело: `{ "monitoringId": "<uuid>" }`
  - **GET** `/proxy/health-proxy` — проверка здоровья (возвращает `true`)
- Читает CSV из каталога `dataset` и построчно публикует данные в MQTT

## Требования
- Docker 20+
- Docker Desktop (Windows/Mac)
- MQTT-брокер (по умолчанию `MQTT_HOST=localhost`, `MQTT_PORT=1883`)

## Переменные окружения
Сервис использует файл `.env` (подключён в образ):
- `PORT` — внутренний порт сервиса (например `3000`)
- `MQTT_HOST`, `MQTT_PORT`, `MQTT_TOPIC` — параметры MQTT
- `DIR_PATH=proxy` — каталог внутри контейнера, куда сервис пишет результаты
- При необходимости добавьте и другие переменные в `.env`

Пример `.env`:
```
PORT=3000
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_TOPIC=your/topic
DIR_PATH=proxy
```

## Сборка образа
```
docker build -t proxy:latest .
```

## Запуск контейнера
- Внешний порт 8081, внутренний — из вашего `.env` (`PORT`).
- Если в `.env` `PORT=3000`:
```
docker run --rm -it \
  -p 8081:3000 \
  proxy:latest
```

- Если в `.env` другой порт (например `8080`), замените вторую часть маппинга:
```
docker run --rm -it \
  -p 8081:8080 \
  proxy:latest
```

### Монтирование датасета
Приложение читает данные из `./dataset` относительно корня проекта. Рекомендуется монтировать каталог хоста в контейнер, чтобы не увеличивать образ:

- Linux/Mac:
```
docker run --rm -it \
  -p 8081:3000 \
  -v $(pwd)/dataset:/app/dataset \
  proxy:latest
```

- Windows PowerShell:
```
docker run --rm -it \
  -p 8081:3000 \
  -v ${PWD}\dataset:/app/dataset \
  proxy:latest
```

## Проверка
- Health-check:
```
curl http://localhost:8081/proxy/health-proxy
```

- Старт стрима:
```
curl -X POST http://localhost:8081/proxy/random \
  -H "Content-Type: application/json" \
  -d "{\"monitoringId\":\"<uuid>\"}"
```

## Типичные проблемы и решения

- EACCES: permission denied при создании директорий в `/app/proxy`
  - В образе каталог создаётся и помечается владельцем `node`. Если используете bind-mount в Windows и всё ещё получаете EACCES:
    - Запустите контейнер под `root` (устраняет проблемы прав при bind-mount на Windows):
      ```
      docker run --rm -it \
        --user root \
        -p 8081:3000 \
        -v ${PWD}\dataset:/app/dataset \
        proxy:latest
      ```
    - Или не делайте bind-mount для выходного каталога и используйте анонимный том.

- Порт не совпадает
  - Убедитесь, что внешний порт 8081 маппится на внутренний из `.env`:
    - `-p 8081:3000` если `PORT=3000`
    - `-p 8081:<значение PORT из .env>` в общем случае

## Полезно знать
- `.env` копируется в образ и используется автоматически; флаги `--env-file`/`-e` не нужны.
- Каталог записи из `.env` (`DIR_PATH=proxy`) уже создаётся и доступен пользователю `node` в контейнере.
- Исходные CSV внутри контейнера ожидаются по пути `/app/dataset` (поэтому монтируйте `./dataset`).

## Лицензия
ISC.


