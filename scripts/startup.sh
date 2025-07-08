#!/bin/bash

# Script de inicio para PASTO!
echo "🌱 Iniciando PASTO! - Servicios de Jardinería"

# Verificar que MongoDB esté disponible
echo "Verificando conexión a MongoDB..."
python -c "
import pymongo
import os
try:
    client = pymongo.MongoClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017/'))
    client.admin.command('ping')
    print('✅ MongoDB conectado exitosamente')
except Exception as e:
    print(f'❌ Error conectando a MongoDB: {e}')
    exit(1)
"

# Instalar dependencias del backend si es necesario
echo "Verificando dependencias del backend..."
cd /app/backend
pip install -r requirements.txt

# Instalar dependencias del frontend si es necesario
echo "Verificando dependencias del frontend..."
cd /app/frontend
yarn install

# Iniciar servicios con supervisor
echo "Iniciando servicios..."
supervisord -c /app/scripts/supervisord.conf