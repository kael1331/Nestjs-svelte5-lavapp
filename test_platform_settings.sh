#!/usr/bin/env bash

# Puerto y URLs
PORT=3000
BASE_URL="http://localhost:$PORT"

echo "===================================================="
echo "🧪 INICIANDO PRUEBA DE PLATFORM SETTINGS (E2E)"
echo "===================================================="

# 1. Arrancar el servidor NestJS en segundo plano
echo "1. Arrancando el servidor NestJS en segundo plano..."
cd user-api || exit 1
node node_modules/@nestjs/cli/bin/nest.js start > ../server.log 2>&1 &
SERVER_PID=$!
cd ..

# Esperar a que el puerto 3000 esté activo
echo "   ↳ Esperando a que el servidor responda en el puerto $PORT..."
for i in {1..15}; do
  if curl -s "$BASE_URL" > /dev/null; then
    break
  fi
  sleep 1
done

if ! curl -s "$BASE_URL" > /dev/null; then
  echo "❌ Error: El servidor NestJS no arrancó a tiempo."
  kill $SERVER_PID 2>/dev/null
  exit 1
fi
echo "   ↳ ✅ Servidor activo."

# 2. Consultar PlatformSettings
echo -e "\n2. Realizando curl a $BASE_URL/platform-settings..."
RESPONSE=$(curl -s "$BASE_URL/platform-settings")

if [ -z "$RESPONSE" ]; then
  echo "❌ Error: Respuesta vacía del servidor."
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

echo "✅ Respuesta obtenida del servidor:"
echo "----------------------------------------------------"
echo "$RESPONSE" | node -e "
const fs = require('fs');
const data = fs.readFileSync(0, 'utf-8');
try {
  console.log(JSON.stringify(JSON.parse(data), null, 2));
} catch (e) {
  console.log(data);
}
"
echo "----------------------------------------------------"

# 3. Detener el servidor NestJS
echo -e "\n3. Deteniendo el servidor NestJS..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ↳ ✅ Servidor detenido."
echo -e "\n===================================================="
echo "🎉 ¡PRUEBA DE PLATFORM SETTINGS FINALIZADA!"
echo "===================================================="
