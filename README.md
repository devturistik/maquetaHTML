# 📦 Proyecto Turistik: SistemaOC

> Este repositorio contiene el código fuente de SistemaOC, una solución interna diseñada para ser una versión mejorada del software anterior que se encuentra implementado en Power Apps.

---

## 📋 Instrucciones de Instalación

### 1. Requisitos Previos
- **Sistema operativo**: [Windows/Linux/MacOS].
- **Versión mínima de [Node.js]**: `v22.11.0`.
- Variables de entorno: Contactar al administrador del repositorio para obtenerlas.

### 2. Instalación
1. Clona este repositorio en tu máquina local:
   ```bash
   git clone https://github.com/devturistik/maquetaHTML.git
   ```
2. Accede al directorio del proyecto:
   ```bash
   cd maquetaHTML
   ```
3. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
4. Configura las variables de entorno:
   - Mueve el archivo `.env` al directorio del proyecto, este debe incluir:
     - API_USERNAME
     - API_PASSWORD
     - URL_API_AUTH_TOKEN
     - URL_API_AUTH_LOGIN
     - AZURE_STORAGE_CONNECTION_STRING
     - AZURE_STORAGE_CONTAINER_NAME
     - AZURE_STORAGE_ACCOUNT_KEY
     - AZURE_STORAGE_ACCOUNT_NAME
     - URL_API_CREATE_PDF
     - URL_API_APROBADORES
     - JWT_SECRET
5. Ejecuta la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```

---

## ⚙️ Guía de Uso

1. Accede al sistema en tu navegador en la URL [http://localhost:4000](http://localhost:4000).
2. Inicia sesión utilizando tus credenciales corporativas Turistik.
3. Navega por los módulos disponibles según tu rol (ej.: **Administrador**, **Comprador**, **Solicitante**).

---

## 🛡️ Seguridad y Acceso

- **Roles de usuario**: El sistema utiliza roles corporativos para controlar el acceso a diferentes funcionalidades.
- **Credenciales**: No compartas tus credenciales. Si necesitas acceso adicional, contacta al equipo de TI.
- **Auditorías**: Todas las acciones críticas quedan registradas para cumplimiento y revisión.

---

## 📈 Despliegue

1. **Ambiente de Desarrollo**:
   ```bash
   npm run dev
   ```
2. **Ambiente de Producción**:
   ```bash
   npm run build && npm start
   ```

El despliegue en producción se realiza mediante Azure App Service.

---