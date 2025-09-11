# Руководство по развертыванию системы

## Системные требования

### Минимальные требования
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Диск**: 20 GB свободного места
- **ОС**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

### Рекомендуемые требования
- **CPU**: 4 ядра
- **RAM**: 8 GB
- **Диск**: 50 GB SSD
- **ОС**: Ubuntu 22.04 LTS

### Программное обеспечение
- **Node.js**: версия 18.0.0 или выше
- **PostgreSQL**: версия 14 или выше
- **Redis**: версия 6.0 или выше
- **Docker**: версия 20.10 или выше (опционально)
- **Nginx**: версия 1.18 или выше (для продакшена)

## Установка зависимостей

### Ubuntu/Debian
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Установка Redis
sudo apt install redis-server -y

# Установка Nginx
sudo apt install nginx -y

# Установка PM2 глобально
sudo npm install -g pm2
```

### CentOS/RHEL
```bash
# Обновление системы
sudo yum update -y

# Установка Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Установка PostgreSQL
sudo yum install postgresql-server postgresql-contrib -y
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Установка Redis
sudo yum install redis -y
sudo systemctl enable redis
sudo systemctl start redis

# Установка Nginx
sudo yum install nginx -y
sudo systemctl enable nginx

# Установка PM2
sudo npm install -g pm2
```

## Настройка базы данных

### PostgreSQL
```bash
# Вход в PostgreSQL
sudo -u postgres psql

# Создание базы данных и пользователя
CREATE DATABASE literature_committee;
CREATE USER literature_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE literature_committee TO literature_user;
\q
```

### Redis
```bash
# Редактирование конфигурации Redis
sudo nano /etc/redis/redis.conf

# Настройки безопасности
requirepass your_redis_password
bind 127.0.0.1

# Перезапуск Redis
sudo systemctl restart redis
```

## Развертывание приложения

### 1. Клонирование репозитория
```bash
git clone <repository-url> literature-committee-app
cd literature-committee-app
```

### 2. Установка зависимостей
```bash
# Установка зависимостей для всего проекта
npm install

# Установка зависимостей для backend
cd backend
npm install

# Установка зависимостей для frontend
cd ../frontend
npm install

cd ..
```

### 3. Настройка переменных окружения

#### Backend (.env)
```bash
# Создание файла конфигурации backend
cp backend/.env.example backend/.env
nano backend/.env
```

Содержимое файла `.env`:
```env
# Основные настройки
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# База данных
DATABASE_URL="postgresql://literature_user:secure_password@localhost:5432/literature_committee"

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Email настройки
SMTP_HOST=smtp.your-domain.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=noreply@your-domain.com

# Файлы и загрузки
UPLOAD_DIR=/var/www/literature-committee/uploads
MAX_FILE_SIZE=10485760

# Логирование
LOG_LEVEL=info
LOG_DIR=/var/log/literature-committee

# Безопасность
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Уведомления
NOTIFICATION_QUEUE_ENABLED=true
LOW_STOCK_THRESHOLD=10
ORDER_TIMEOUT_DAYS=7
```

#### Frontend (переменные сборки)
```bash
# Создание файла конфигурации frontend
nano frontend/.env.production
```

Содержимое файла `.env.production`:
```env
VITE_API_BASE_URL=https://your-domain.com/api
VITE_APP_NAME=Литературный Комитет АН Сибирь
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
```

### 4. Инициализация базы данных
```bash
cd backend

# Генерация Prisma клиента
npx prisma generate

# Выполнение миграций
npx prisma migrate deploy

# Заполнение начальными данными
npm run db:seed
```

### 5. Сборка приложения
```bash
# Сборка backend
cd backend
npm run build

# Сборка frontend
cd ../frontend
npm run build

cd ..
```

## Настройка веб-сервера (Nginx)

### Конфигурация Nginx
```bash
sudo nano /etc/nginx/sites-available/literature-committee
```

Содержимое конфигурации:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Перенаправление на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL сертификаты
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Основные настройки
    client_max_body_size 10M;
    
    # Статические файлы frontend
    location / {
        root /var/www/literature-committee/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Кэширование статических ресурсов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Загруженные файлы
    location /uploads {
        alias /var/www/literature-committee/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

Активация конфигурации:
```bash
sudo ln -s /etc/nginx/sites-available/literature-committee /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Настройка PM2 для управления процессами

### Конфигурация PM2
```bash
nano ecosystem.config.js
```

Содержимое файла:
```javascript
module.exports = {
  apps: [
    {
      name: 'literature-committee-backend',
      script: './backend/dist/server.js',
      cwd: '/var/www/literature-committee',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/literature-committee/backend-error.log',
      out_file: '/var/log/literature-committee/backend-out.log',
      log_file: '/var/log/literature-committee/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
```

### Запуск приложения
```bash
# Создание директорий
sudo mkdir -p /var/www/literature-committee
sudo mkdir -p /var/log/literature-committee
sudo mkdir -p /var/www/literature-committee/uploads

# Копирование файлов
sudo cp -r . /var/www/literature-committee/
sudo chown -R www-data:www-data /var/www/literature-committee
sudo chmod -R 755 /var/www/literature-committee

# Запуск через PM2
cd /var/www/literature-committee
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save
pm2 startup
```

## SSL сертификат (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Мониторинг и логирование

### Настройка логирования
```bash
# Создание конфигурации logrotate
sudo nano /etc/logrotate.d/literature-committee
```

Содержимое:
```
/var/log/literature-committee/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload literature-committee-backend
    endscript
}
```

### Мониторинг с помощью PM2
```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs literature-committee-backend

# Мониторинг ресурсов
pm2 monit

# Перезапуск приложения
pm2 restart literature-committee-backend

# Остановка приложения
pm2 stop literature-committee-backend
```

## Резервное копирование

### Скрипт резервного копирования
```bash
sudo nano /usr/local/bin/backup-literature-committee.sh
```

Содержимое скрипта:
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/literature-committee"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="literature_committee"
DB_USER="literature_user"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Бэкап базы данных
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Бэкап загруженных файлов
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C /var/www/literature-committee uploads/

# Бэкап конфигурационных файлов
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz \
    /var/www/literature-committee/backend/.env \
    /etc/nginx/sites-available/literature-committee \
    /var/www/literature-committee/ecosystem.config.js

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Настройка автоматического резервного копирования:
```bash
sudo chmod +x /usr/local/bin/backup-literature-committee.sh
sudo crontab -e
# Добавить строку для ежедневного бэкапа в 2:00
0 2 * * * /usr/local/bin/backup-literature-committee.sh
```

## Обновление системы

### Процедура обновления
```bash
# 1. Создание бэкапа
/usr/local/bin/backup-literature-committee.sh

# 2. Остановка приложения
pm2 stop literature-committee-backend

# 3. Обновление кода
cd /var/www/literature-committee
git pull origin main

# 4. Установка новых зависимостей
npm install
cd backend && npm install
cd ../frontend && npm install && cd ..

# 5. Выполнение миграций базы данных
cd backend
npx prisma migrate deploy
cd ..

# 6. Сборка приложения
npm run build

# 7. Перезапуск приложения
pm2 restart literature-committee-backend

# 8. Проверка работоспособности
pm2 status
curl -f http://localhost:3000/api/health
```

## Устранение неполадок

### Проверка статуса сервисов
```bash
# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis

# Nginx
sudo systemctl status nginx

# PM2 процессы
pm2 status
```

### Просмотр логов
```bash
# Логи приложения
pm2 logs literature-committee-backend

# Логи Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Логи PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Системные логи
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

### Частые проблемы и решения

#### Проблема: Приложение не запускается
```bash
# Проверка переменных окружения
cat backend/.env

# Проверка подключения к базе данных
cd backend
npx prisma db pull

# Проверка портов
sudo netstat -tlnp | grep :3000
```

#### Проблема: Ошибки базы данных
```bash
# Проверка подключения
sudo -u postgres psql -c "\l"

# Восстановление из бэкапа
gunzip -c /var/backups/literature-committee/db_backup_YYYYMMDD_HHMMSS.sql.gz | sudo -u postgres psql literature_committee
```

#### Проблема: Высокое потребление памяти
```bash
# Мониторинг ресурсов
pm2 monit

# Перезапуск с ограничением памяти
pm2 restart literature-committee-backend --max-memory-restart 512M
```

## Безопасность

### Настройки файрвола (UFW)
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Закрываем прямой доступ к backend
sudo ufw deny 5432  # Закрываем прямой доступ к PostgreSQL
sudo ufw deny 6379  # Закрываем прямой доступ к Redis
```

### Регулярные обновления безопасности
```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Мониторинг безопасности
```bash
# Установка fail2ban
sudo apt install fail2ban -y

# Конфигурация для Nginx
sudo nano /etc/fail2ban/jail.local
```

Содержимое конфигурации fail2ban:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

Эта документация покрывает все основные аспекты развертывания и эксплуатации системы литературного комитета в продакшен среде.