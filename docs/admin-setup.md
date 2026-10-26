# Настройка статистики подключений

## Требования

- PHP 8.1+ с расширениями `pdo_mysql` и `curl` (без `curl` используется HTTPS stream wrapper).
- MySQL 5.7+ / MariaDB 10.2+.
- Apache с `mod_rewrite` и разрешёнными `.htaccess`.

## Установка

1. Выполнить SQL из `database/001_create_card_connections.sql`, затем из `database/002_create_app_visit_daily.sql`.
2. В панели хостинга / FastCGI настроить server-only переменные:

   - `GFCC_DB_HOST`
   - `GFCC_DB_PORT` (по умолчанию `3306`)
   - `GFCC_DB_NAME`
   - `GFCC_DB_USER`
   - `GFCC_DB_PASSWORD`
   - `GFCC_ADMIN_PASSWORD_HASH`
   - `GFCC_CLIENT_LOOKUP_API_URL` (необязательно)
   - `GFCC_CLIENT_INDEX_FILE` (необязательно)
   - `GFCC_ANALYTICS_SALT` (необязательно, рекомендуется)

3. Создать хеш пароля на сервере с PHP:

   ```bash
   php -r "echo password_hash('ЗАМЕНИТЕ_ПАРОЛЬ', PASSWORD_DEFAULT), PHP_EOL;"
   ```

4. Собрать проект командой `npm run build` и опубликовать содержимое `dist` как корень сайта.

Секретные значения не следует добавлять в `.env` Vite или переменные с префиксом `VITE_`: они попадают в клиентскую сборку.

## Маршруты

- `POST https://api.gfcc-oasis.ru/card-connections/` — серверная проверка и идемпотентная регистрация.
- `POST https://gfcc-oasis.ru/api/app-visits.php` — анонимная регистрация посещения и источника приложения.
- `GET /api/admin-dashboard.php` — защищённая сводка посещаемости.
- `GET /api/admin-card-connections.php` — защищённая статистика с пагинацией.
- `GET /admin/login.php` — вход.
- `GET /admin/` — закрытая сводная страница статистики.
- `GET /admin/clients.php` — отдельный список подключённых клиентов.
- `POST /admin/logout.php` — выход.

## Smoke-test

1. Подключить `123456` в Oasis и проверить одну строку в таблице.
2. Повторить подключение: количество не меняется.
3. Подключить тот же код в Golden: появляется отдельная строка.
4. Проверить отклонение кода не из шести цифр и несуществующего клиента.
5. В приватном окне проверить `401` для admin API и редирект `/admin/` на login.
6. После входа проверить показатели посещений и открыть отдельный список нажатием на карточку подключённых клиентов.
7. Временно указать недоступный client API: коды и базы остаются в таблице, имена заменяются нейтральным сообщением.

## Размещение endpoint на Webnames

Файл `server/api.gfcc-oasis.ru/card-connections/index.php` нужно загрузить в:

```text
/var/www/cl449121/data/www/api.gfcc-oasis.ru/card-connections/index.php
```

Endpoint посещений `public/api/app-visits.php` входит в обычную Web-сборку и отдельной загрузки на API-поддомен не требует.

Приватный файл `/var/www/cl449121/data/backend/config/gfcc-statistics.php` должен возвращать массив с ключами `db_host`, `db_port`, `db_name`, `db_user` и `db_password`.
Необязательный ключ `analytics_salt` позволяет задать отдельную стабильную соль для анонимных идентификаторов посещений; если он не указан, используется пароль БД.
