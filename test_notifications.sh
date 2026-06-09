#!/usr/bin/env bash

# Puerto en el que corre la API
PORT=3000
BASE_URL="http://localhost:$PORT"
TIMESTAMP=$(date +%s)
EMAIL="notif.$TIMESTAMP@test.com"
PASSWORD="password123"
NAME="Cliente Didáctico"

echo "=========================================================="
echo "🧪 INICIANDO PRUEBA DE INTEGRACIÓN DE NOTIFICACIONES (E2E)"
echo "=========================================================="

# Cambiar al directorio del backend
cd user-api || exit 1

# 1. Arrancar el servidor NestJS en segundo plano
echo "1. Arrancando el servidor NestJS en segundo plano..."
node node_modules/@nestjs/cli/bin/nest.js start > /dev/null 2>&1 &
SERVER_PID=$!

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

# 2. Registrar usuario de prueba
echo -e "\n2. Creando usuario de prueba vía POST /users..."
echo "   ↳ Payload enviado: {\"name\": \"$NAME\", \"email\": \"$EMAIL\", \"role\": \"client\"}"
REG_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"client\"}" \
  "$BASE_URL/users")
echo "   ↳ Respuesta recibida: $REG_RES"

# 3. Iniciar sesión para obtener el token JWT
echo -e "\n3. Autenticando usuario vía POST /auth/login..."
echo "   ↳ Payload enviado: {\"email\": \"$EMAIL\", \"password\": \"******\"}"
LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/auth/login")

TOKEN=$(echo "$LOGIN_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.access_token || '');
} catch(e) {
  console.log('');
}
")

if [ -z "$TOKEN" ] || [ "$TOKEN" == "undefined" ]; then
  echo "❌ Error: No se pudo obtener el token JWT. Respuesta: $LOGIN_RES"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi
echo "   ↳ ✅ Token JWT obtenido con éxito."

# 4. Generar una notificación de prueba (POST /notifications/test)
echo -e "\n4. Generando notificación de prueba vía POST /notifications/test..."
echo "   ↳ Enviando cabecera: Authorization: Bearer <token>"
NOTIF_CREATE_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Membresía por Vencer","message":"Tu membresía vencerá en 5 días. Por favor realiza la transferencia."}' \
  "$BASE_URL/notifications/test")
echo "   ↳ Respuesta recibida: $NOTIF_CREATE_RES"

# 5. Listar notificaciones del usuario (GET /notifications)
echo -e "\n5. Consultando bandeja del usuario vía GET /notifications..."
NOTIF_LIST_RES=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$BASE_URL/notifications")

echo "   ↳ Notificaciones en bandeja:"
echo "$NOTIF_LIST_RES" | node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(0, 'utf-8'));
console.log(JSON.stringify(data, null, 2));
"

# Obtener ID de la notificación para marcarla como leída
NOTIF_ID=$(echo "$NOTIF_LIST_RES" | node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(0, 'utf-8'));
console.log(data[0] ? data[0].id : '');
")

if [ -z "$NOTIF_ID" ]; then
  echo "❌ Error: No se encontró la notificación creada."
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

# 6. Marcar la notificación como leída (PATCH /notifications/:id/read)
echo -e "\n6. Marcando notificación como leída vía PATCH /notifications/$NOTIF_ID/read..."
READ_RES=$(curl -s -X PATCH -H "Authorization: Bearer $TOKEN" "$BASE_URL/notifications/$NOTIF_ID/read")

echo "   ↳ Respuesta recibida (isRead actualizado):"
echo "$READ_RES" | node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(0, 'utf-8'));
console.log(JSON.stringify(data, null, 2));
"

# 7. Finalizar servidor
echo -e "\n7. Deteniendo el servidor NestJS..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ↳ ✅ Servidor detenido."
echo -e "\n=========================================================="
echo "🎉 ¡PRUEBA E2E DE NOTIFICACIONES FINALIZADA CON ÉXITO!"
echo "=========================================================="
