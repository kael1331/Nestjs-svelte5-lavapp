#!/usr/bin/env bash

# Puerto y URLs
PORT=3000
BASE_URL="http://localhost:$PORT"
TIMESTAMP=$(date +%s)
EMAIL="admin.e2e.$TIMESTAMP@test.com"
PASSWORD="password123"
NAME="Admin Didáctico E2E"

echo "=========================================================="
echo "🧪 INICIANDO PRUEBA DE INTEGRACIÓN DE LAVADEROS (E2E)"
echo "=========================================================="

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

# 2. Autenticar como SuperAdmin para obtener privilegios de creación
echo -e "\n2. Iniciando sesión como Super Administrador para autorizar registro de Admin..."
SUPER_LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"superadmin@lavaapp.com","password":"superpassword123"}' \
  "$BASE_URL/auth/login")

SUPER_TOKEN=$(echo "$SUPER_LOGIN_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.access_token || '');
} catch(e) {
  console.log('');
}
")

if [ -z "$SUPER_TOKEN" ] || [ "$SUPER_TOKEN" == "undefined" ]; then
  echo "❌ Error: No se pudo obtener el token de Super Administrador. Respuesta: $SUPER_LOGIN_RES"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi
echo "   ↳ ✅ Token de Super Administrador obtenido."

# 3. Registrar usuario Administrador (POST /users) utilizando el token de SuperAdmin
echo -e "\n3. Creando usuario ADMINISTRADOR comercial vía POST /users..."
echo "   ↳ Payload enviado: {\"name\": \"$NAME\", \"email\": \"$EMAIL\", \"role\": \"admin\"}"
REG_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"admin\"}" \
  "$BASE_URL/users")
echo "   ↳ Respuesta recibida: $REG_RES"

# 4. Iniciar sesión como el Administrador recién creado para obtener su token JWT
echo -e "\n4. Autenticando al Administrador vía POST /auth/login..."
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
  echo "❌ Error: No se pudo obtener el token JWT del Administrador. Respuesta: $LOGIN_RES"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi
echo "   ↳ ✅ Token JWT obtenido. Decodificando carga útil..."
echo "$LOGIN_RES" | node -e "
const fs = require('fs');
const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
const payload = JSON.parse(Buffer.from(res.access_token.split('.')[1], 'base64').toString());
console.log('     ↳ Payload del JWT del Admin:', JSON.stringify(payload, null, 2));
"

# 5. Obtener perfil de lavadero inicial (GET /car-washes/my-wash)
echo -e "\n5. Consultando lavadero autocreado vía GET /car-washes/my-wash..."
GET_WASH_RES=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$BASE_URL/car-washes/my-wash")
echo "   ↳ Lavadero autogenerado (debe tener isServiceActive=false y 1 bahía):"
echo "$GET_WASH_RES" | node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(0, 'utf-8'));
console.log(JSON.stringify(data, null, 2));
"

# 6. Parametrizar y actualizar lavadero (PATCH /car-washes/my-wash)
echo -e "\n6. Parametrizando el lavadero (Nombre, Alias, Ampliación a 3 Bahías) vía PATCH /car-washes/my-wash..."
echo '   ↳ Payload enviado: {"name": "Didáctico CarWash", "clientPaymentAlias": "alias.didactico", "baysCount": 3}'
PATCH_WASH_RES=$(curl -s -X PATCH -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Didáctico CarWash", "clientPaymentAlias": "alias.didactico", "baysCount": 3}' \
  "$BASE_URL/car-washes/my-wash")
echo "   ↳ Respuesta recibida del PATCH: $PATCH_WASH_RES"

# 7. Consultar nuevamente el lavadero para confirmar la sincronización física de las bahías
echo -e "\n7. Verificando sincronización de bahías y datos actualizados vía GET /car-washes/my-wash..."
CONFIRM_WASH_RES=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$BASE_URL/car-washes/my-wash")
echo "   ↳ Perfil final del lavadero (debe tener 3 bahías en el array de bays):"
echo "$CONFIRM_WASH_RES" | node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(0, 'utf-8'));
console.log(JSON.stringify(data, null, 2));
"

# 8. Finalizar servidor
echo -e "\n8. Deteniendo el servidor NestJS..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ↳ ✅ Servidor detenido."
echo -e "\n=========================================================="
echo "🎉 ¡PRUEBA E2E DE LAVADEROS FINALIZADA CON ÉXITO!"
echo "=========================================================="
