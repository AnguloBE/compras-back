# Compras Angostura - Backend

API backend para sistema de compras y entregas de Angostura.

## 🚀 Tecnologías

- **NestJS** - Framework Node.js
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **WhatsApp Business API** - Notificaciones
- **JWT** - Autenticación

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repo-url>
cd compras-back
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/compras_db
JWT_SECRET=tu_secreto_jwt_aqui
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id
WHATSAPP_ACCESS_TOKEN=tu_token
PORT=3000
```

4. **Configurar base de datos**
```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# (Opcional) Ver base de datos
npx prisma studio
```

## 🏃 Ejecutar en Desarrollo

```bash
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000`

## 🏗️ Build para Producción

```bash
npm run build
npm run start:prod
```

## 📁 Estructura del Proyecto

```
src/
├── auth/           # Autenticación JWT y WhatsApp
├── usuarios/       # Gestión de usuarios
├── productos/      # Catálogo de productos
├── categorias/     # Categorías de productos
├── pedidos/        # Gestión de pedidos
├── ubicaciones/    # Ubicaciones de envío
├── horarios/       # Horarios de atención
├── whatsapp/       # Integración WhatsApp Business
└── prisma/         # Servicio de Prisma ORM
```

## 🔐 Roles de Usuario

- **ADMIN** - Acceso completo al sistema
- **REPARTIDOR** - Gestión de entregas
- **USUARIO** - Cliente final

## 📝 Variables de Entorno

Ver `.env.example` para lista completa de variables requeridas.

### Variables Críticas:

- `DATABASE_URL` - Conexión PostgreSQL
- `JWT_SECRET` - Secreto para tokens (⚠️ cambiar en producción)
- `WHATSAPP_PHONE_NUMBER_ID` - ID de número WhatsApp Business
- `WHATSAPP_ACCESS_TOKEN` - Token de acceso WhatsApp
- `WHATSAPP_VERIFY_TOKEN` - Token de verificación webhook
- `PORT` - Puerto del servidor (default: 3000)
- `FRONTEND_URL` - URL del frontend para CORS

## 🗄️ Base de Datos

### Ejecutar Migraciones

```bash
npx prisma migrate deploy
```

### Ver Base de Datos (GUI)

```bash
npx prisma studio
```

### Crear Nueva Migración

```bash
npx prisma migrate dev --name nombre_migracion
```

## 📤 Uploads

Las imágenes de productos se guardan en `/uploads/productos/`

Asegúrate de que el directorio tenga permisos de escritura:
```bash
chmod 755 uploads/productos/
```

## 🔄 API Endpoints Principales

### Autenticación
- `POST /auth/solicitar-codigo` - Solicitar código WhatsApp
- `POST /auth/verificar-codigo` - Login con código
- `GET /auth/profile` - Perfil del usuario autenticado

### Productos
- `GET /productos` - Lista de productos
- `GET /productos/:id` - Detalle de producto
- `POST /productos` - Crear producto (Admin)
- `PATCH /productos/:id` - Actualizar producto (Admin)

### Pedidos
- `POST /pedidos` - Crear nuevo pedido
- `GET /pedidos` - Lista de pedidos (filtrable)
- `GET /pedidos/:id` - Detalle de pedido
- `PATCH /pedidos/:id` - Actualizar estado (Admin/Repartidor)

### Horarios
- `GET /horarios` - Horarios de atención actuales
- `POST /horarios` - Crear/actualizar horario (Admin)
- `POST /horarios/initialize` - Inicializar horarios por defecto (Admin)

### Ubicaciones
- `GET /ubicaciones` - Lista de ubicaciones de envío
- `POST /ubicaciones` - Crear ubicación (Admin)
- `PATCH /ubicaciones/:id` - Actualizar ubicación (Admin)

## 🚀 Deployment en VPS

### 1. Instalar dependencias del sistema
```bash
sudo apt update
sudo apt install postgresql nodejs npm nginx
```

### 2. Configurar PostgreSQL
```bash
sudo -u postgres createuser compras_user
sudo -u postgres createdb compras_db
sudo -u postgres psql -c "ALTER USER compras_user WITH PASSWORD 'tu_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE compras_db TO compras_user;"
```

### 3. Clonar y configurar proyecto
```bash
cd /var/www
git clone <tu-repo>
cd compras-back
cp .env.example .env
nano .env  # Editar variables de producción
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

### 4. Configurar PM2
```bash
npm install -g pm2
pm2 start dist/main.js --name compras-api
pm2 save
pm2 startup
```

### 5. Configurar Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads estáticos
    location /uploads {
        alias /var/www/compras-back/uploads;
    }
}
```

## 🐛 Troubleshooting

### Error de conexión a PostgreSQL
```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

### Error en migraciones
Reset de base de datos (⚠️ solo desarrollo):
```bash
npx prisma migrate reset
```

### Ver logs de PM2
```bash
pm2 logs compras-api
pm2 restart compras-api
```

### Problemas con WhatsApp
Verificar credenciales en `.env` y que el token no haya expirado en Meta Developer Console.

## 📄 Licencia

Proyecto privado - Todos los derechos reservados
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
