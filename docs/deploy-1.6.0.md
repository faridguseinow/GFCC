# Деплой GFCC Oasis 1.6.0

1. В phpMyAdmin выбрать базу `cl449121_gfcc` и выполнить `002_create_app_visit_daily.sql`.
2. Создать каталог `/www/api.gfcc-oasis.ru/app-visits/` и загрузить в него `app-visits/index.php`.
3. Распаковать `gfcc-oasis-web-1.6.0.zip` в `/www/gfcc-oasis.ru/` с заменой файлов.
4. Открыть `https://gfcc-oasis.ru/`, затем `https://gfcc-oasis.ru/admin/login.php`.
5. Проверить в админке:
   - количество подключённых клиентов;
   - отдельную страницу списка клиентов;
   - посещения за день и месяц;
   - источники Web, PWA, APK, RuStore и Telegram;
   - светлую и тёмную тему.

Обычный APK собран с каналом `apk`. Отдельный APK для публикации в RuStore собран с каналом `rustore`. Release APK необходимо подписать существующим production-ключом приложения.
