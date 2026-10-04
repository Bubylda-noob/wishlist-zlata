# MY WISHLIST — GitHub Pages + Supabase

В форме добавления желания теперь два способа добавить фото:
1. **ПО ССЫЛКЕ** — прямая ссылка на изображение.
2. **ИЗ ГАЛЕРЕИ** — выбрать JPG/PNG/WEBP/GIF с телефона или компьютера. Файл загружается в Supabase Storage.

## Настройка
1. В `app.js` вставь Supabase Project URL и Publishable key.
2. В Supabase → SQL Editor запусти **весь** `supabase.sql`. Он создаёт таблицу, Realtime, публичный bucket `wishlist-images` и политики Storage.
3. Загрузи файлы проекта в GitHub и включи GitHub Pages.

Важно: в `app.js` нельзя использовать `service_role` key — только Publishable key.

Так как в этой версии доступ открыт, любой посетитель сайта может добавить, забронировать/снять бронь и удалить желание.
