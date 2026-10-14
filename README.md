# Spartan Padel 4015 · Reservas

Aplicación web de reserva de pistas para un club de pádel en Mutxamel (Alicante). Los jugadores reservan sin registrarse y los administradores del club gestionan las clases desde el mismo calendario.

<!-- Añade aquí capturas: ![Calendario de reservas](docs/reservas.png) -->

## Funcionalidades

- Calendario de **4 pistas** con navegación de **10 días** y franjas de **90 minutos** (8:00–23:00).
- Reserva en dos pasos con nombre y teléfono opcional.
- **Panel de administración** con login (Supabase Auth, email y contraseña) y roles definidos en una tabla `perfiles`.
- Los administradores bloquean o liberan franjas como **clases** directamente sobre el calendario.
- Página de inicio con fotos del club, servicios y mapa de Google Maps.

## Stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS 4**
- **Supabase**: PostgreSQL, Auth y Row Level Security
- **React Router**
- Desplegada en **Vercel**

## Seguridad

- Las credenciales van en variables de entorno, nunca en el código (ver `.env.example`).
- En el cliente solo se usa la clave pública `anon`. Los permisos reales se controlan en la base de datos con **RLS** y privilegios por columna:
  - Los visitantes solo pueden leer las columnas necesarias para pintar el calendario. El teléfono de quien reserva no es legible desde la web.
  - Crear clases y borrar reservas está restringido a administradores.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # rellena la URL y la clave anon de tu proyecto Supabase
npm run dev
```

## Autor

Desarrollado por **Raúl García Ferrer** · [LinkedIn](https://www.linkedin.com/in/raul-g-aa6730140/) · [GitHub](https://github.com/Rgarciaf11)
