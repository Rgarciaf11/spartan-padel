# Spartan Padel 4015 · Reservas

Aplicación web de reserva de pistas para un club de pádel en Mutxamel (Alicante). Los clientes se registran, reservan y gestionan sus reservas; los administradores del club bloquean pistas para clases y ven los datos de contacto desde el mismo calendario.

<!-- Añade aquí capturas: ![Calendario de reservas](docs/reservas.png) -->

## Funcionalidades

- Calendario de **4 pistas** con navegación de **10 días** y franjas de **90 minutos** (8:00–23:00).
- **Área de clientes**: registro (nombre, apellidos, email, teléfono y contraseña), inicio de sesión y redirección a la página de origen.
- **Mis reservas** con pestañas de próximas y pasadas, y cancelación de reservas futuras.
- **Mi perfil**: el cliente edita sus datos.
- Reserva en un clic con los datos del perfil; el calendario marca "Tu reserva".
- **Roles** (cliente / administrador) en la tabla `perfiles`, con el mismo login.
- Los administradores bloquean o liberan franjas como **clases** y ven nombre y teléfono de cada reserva.
- Página de inicio con fotos del club, servicios y mapa de Google Maps.

## Stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS 4**
- **Supabase**: PostgreSQL, Auth y Row Level Security
- **React Router**, con rutas protegidas y contexto de autenticación
- Desplegada en **Vercel**

## Seguridad

- Las credenciales van en variables de entorno, nunca en el código (ver `.env.example`).
- En el navegador solo se usa la clave pública `anon`. Los permisos reales se aplican en la base de datos con **Row Level Security**, privilegios por columna y funciones `security definer` (ver [`supabase/`](supabase/)):
  - Los visitantes solo ven la ocupación de las pistas, sin datos personales.
  - Cada cliente ve y cancela solo sus reservas y edita solo su perfil (nunca su rol).
  - Solo un administrador crea clases, borra reservas de otros y consulta nombre y teléfono, a través de la función `reservas_admin`.
  - Un índice único impide reservar dos veces la misma pista y franja.
- El perfil se crea con un trigger al registrarse, siempre como cliente.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # rellena la URL y la clave anon de tu proyecto Supabase
npm run dev
```

## Autor

Desarrollado por **Raúl García Ferrer** · [LinkedIn](https://www.linkedin.com/in/raul-g-aa6730140/) · [GitHub](https://github.com/Rgarciaf11)
