# Validación de Datos - Estudiantes

Este proyecto es una aplicación web full-stack que demuestra la implementación de **Buenas Prácticas en Validación de Datos**, contando con validaciones tanto en el cliente como en el servidor.

El sistema permite gestionar un catálogo de estudiantes (Crear, Leer, Actualizar y Eliminar) asegurando la integridad de la información.

## Tecnologías y Librerías Utilizadas

### Backend (API REST)
- **Django 6.0.1**: Framework web principal.
- **Django REST Framework (DRF) 3.16.1**: Creación de la API.
- **django-cors-headers**: Manejo de CORS para la comunicación con el frontend.
- **Pillow**: Validación profunda de imágenes.
- *Base de datos:* SQLite (por defecto).

### Frontend (SPA)
- **React 19** con **TypeScript**.
- **Vite**: Empaquetador y servidor de desarrollo.
- **Tailwind CSS v4** + **shadcn/ui**: Diseño y componentes accesibles.
- **React Hook Form**: Manejo eficiente del estado del formulario.
- **Zod**: Declaración de esquemas y validación en el cliente.
- **@tanstack/react-table**: Tabla de datos avanzada con paginación y ordenamiento.
- **Lucide React**: Íconos.

## Buena Práctica Implementada

El proyecto implementa una **Validación Multicapa (Defensa en Profundidad)**:

1. **Capa Cliente (Frontend):** Zod y React Hook Form previenen el envío de datos incorrectos al servidor entregando feedback visual inmediato (ej. formatos de email, longitudes de texto, regex para matrículas, tipos de archivo).
2. **Capa Serializador (DRF):** Valida los tipos de datos en la API, ejecuta reglas de formato y, muy importante, **validaciones cruzadas** de negocio (ej. "Para inscribirse en Medicina se requiere tener al menos 18 años").
3. **Capa Modelo (Django):** Tercera línea de defensa en la BD usando `clean()` y `Validators` personalizados, asegurando la integridad desde cualquier punto de entrada.
4. **Validación Segura de Archivos:** Reglas estrictas contra binarios maliciosos y _Zip bombs_ validando firmas (Magic Numbers) y procesando _headers_ con librerías como `Pillow`, en lugar de solo confiar en la extensión del archivo.

## Instalación y Ejecución Local

Para correr el proyecto localmente, necesitas tener instalado **Python 3.10+** y **Node.js 18+**.

### 1. Clonar el repositorio
```bash
git clone https://github.com/gust2050308/ValidacionDeDatos.git
cd ValidacionDeDatos
```

### 2. Levantar el Backend (Django)

Abre una terminal en la raíz del proyecto.

```bash
# Instalar dependencias backend
pip install -r requirements.txt

# Ejecutar las migraciones de la base de datos
python manage.py migrate

# Iniciar el servidor local
python manage.py runserver
```
El servidor backend se ejecutará en `http://127.0.0.1:8000/`.

### 3. Levantar el Frontend (React/Vite)

Abre **otra ventana** de terminal y navega a la carpeta `frontend/`.

```bash
cd frontend

# Instalar dependencias frontend
npm install

# Iniciar el entorno de desarrollo
npm run dev
```
El cliente frontend estará disponible usualmente en `http://localhost:5173/`. 

Una vez que ambos servidores estén corriendo, abre la URL del frontend en tu navegador para interactuar con la aplicación.

---

## Tutorial de uso del proyecto

### Flujo general

1. **Backend** (`http://127.0.0.1:8000/`): La API de Django expone endpoints para CRUD de estudiantes. Al crear o actualizar un estudiante con foto o boleta PDF, esos archivos se suben a **Supabase Storage** y en la base de datos solo se guardan las URLs públicas.
2. **Frontend** (`http://localhost:5173/`): La SPA de React consume la API, valida los datos en el cliente con Zod y muestra la tabla de estudiantes. Desde ahí puedes crear, editar y eliminar registros.

### Uso de la aplicación

- **Listar estudiantes:** Al abrir el frontend verás la tabla con todos los estudiantes (paginação y ordenamiento incluidos).
- **Crear estudiante:** Usa el formulario para ingresar matrícula, nombre, email, carrera, edad, y opcionalmente **foto de perfil** (imagen) y **boleta en PDF**. Las validaciones del cliente te avisarán si algo no cumple el formato (por ejemplo, email inválido o edad mínima según carrera).
- **Editar / Eliminar:** Desde la tabla puedes editar o borrar un estudiante. Si subes una nueva foto o boleta al editar, se reemplazarán en Supabase y se actualizará la URL en el registro.

---

## Configuración y uso de Supabase

Este proyecto utiliza **Supabase** únicamente como **almacenamiento de archivos (Storage)** para las fotos de perfil y las boletas en PDF. La base de datos de estudiantes sigue siendo **SQLite** (Django); Supabase no se usa como base de datos aquí.

### 1. Crear un proyecto en Supabase

1. Entra en [https://supabase.com](https://supabase.com) y crea una cuenta si no la tienes.
2. Crea un **nuevo proyecto**: dale nombre, contraseña a la base de datos (guárdala por si la necesitas) y elige una región.
3. Espera a que el proyecto esté listo.

### 2. Obtener URL y clave (API Key)

1. En el panel del proyecto, ve a **Project Settings** (ícono de engranaje) → **API**.
2. Ahí encontrarás:
   - **Project URL** → esta es tu `SUPABASE_URL`.
   - **Project API keys** → usa la clave **anon / public** (no la `service_role` a menos que sepas qué estás haciendo) como `SUPABASE_KEY`.

### 3. Crear los buckets de Storage

1. En el menú lateral, entra a **Storage**.
2. Crea **dos buckets** (si no existen):
   - **Nombre sugerido:** `estudiantes-perfiles` → para las fotos de perfil.
   - **Nombre sugerido:** `estudiantes-boletas` → para los PDFs de boletas.
3. Para que las URLs que devuelve la API sean accesibles desde el navegador (ver foto o enlace a boleta), marca cada bucket como **Public** al crearlo, o en **Storage → nombre del bucket → Configuration** activa el acceso público.

### 4. Configurar el archivo `.env` en la raíz del proyecto

En la **raíz del proyecto** (donde está `manage.py`), crea o edita un archivo llamado `.env` con el siguiente contenido (sustituye por tus valores reales):

```env
# =========== SUPABASE CONFIGURATION ===========
# Crea un proyecto en https://supabase.com y obtén estos valores en:
# Project Settings → API (URL y anon key) y en Storage (nombres de buckets).

SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_KEY=tu_anon_key_aqui

# Nombres de los buckets que creaste en Storage (por defecto los del tutorial)
SUPABASE_BUCKET_NAME=estudiantes-perfiles
SUPABASE_BUCKET_BOLETAS=estudiantes-boletas
```

- **SUPABASE_URL:** La *Project URL* de tu proyecto.
- **SUPABASE_KEY:** La clave *anon public* de la API.
- **SUPABASE_BUCKET_NAME:** Nombre del bucket de fotos de perfil (por defecto `estudiantes-perfiles`).
- **SUPABASE_BUCKET_BOLETAS:** Nombre del bucket de boletas PDF (por defecto `estudiantes-boletas`).

**Importante:** No subas el archivo `.env` a Git; debe estar en `.gitignore` para no exponer tus claves.

### 5. Cómo usa el backend Supabase

- Al **crear** o **actualizar** un estudiante con archivos adjuntos, el backend (en `estudiante/views.py`):
  1. Recibe la foto y/o el PDF validados por el serializador.
  2. Genera un nombre único (por ejemplo `perfiles/uuid.ext` o `boletas/uuid.pdf`).
  3. Sube el archivo al bucket correspondiente con el cliente de Supabase (`supabase.storage.from_(bucket).upload(...)`).
  4. Obtiene la URL pública con `get_public_url()` y guarda esa URL en los campos `foto_perfil` y `boleta_pdf` del modelo en SQLite.

Así, la base de datos local solo almacena enlaces; los archivos pesados viven en Supabase Storage y se sirven por su URL pública.
