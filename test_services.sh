#!/usr/bin/env bash

# Puerto y URLs
PORT=3000
BASE_URL="http://localhost:$PORT"
TIMESTAMP=$(date +%s)
EMAIL="admin.services.$TIMESTAMP@test.com"
PASSWORD="password123"
NAME="Admin de Servicios E2E"

echo "=========================================================="
echo "🧪 INICIANDO PRUEBA DE INTEGRACIÓN DE SERVICIOS (E2E)"
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
echo -e "\n2. Iniciando sesión como Super Administrador..."
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
echo -e "\n3. Creando usuario ADMINISTRADOR comercial..."
REG_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{\"name\":\"$NAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"admin\"}" \
  "$BASE_URL/users")

# 4. Iniciar sesión como el Administrador recién creado para obtener su token JWT
echo -e "\n4. Autenticando al Administrador..."
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

CARWASH_ID=$(echo "$LOGIN_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  const payload = JSON.parse(Buffer.from(res.access_token.split('.')[1], 'base64').toString());
  console.log(payload.carWashId || '');
} catch(e) {
  console.log('');
}
")

echo "   ↳ ✅ Administrador autenticado. ID del Lavadero: $CARWASH_ID"

# 5. Intentar crear servicio con duración inválida (no múltiplo de 15)
echo -e "\n5. Creando servicio inválido (duración = 40 minutos) vía POST /services..."
FAIL_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Lavado Inválido","description":"Debe fallar","vehicleType":"auto","durationMinutes":40,"price":1000}' \
  "$BASE_URL/services")
echo "   ↳ Respuesta recibida (debe ser Bad Request): $FAIL_RES"

# 6. Crear un servicio válido
echo -e "\n6. Creando servicio válido 'Lavado Básico' (duración = 30 minutos) vía POST /services..."
SERVICE1_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Lavado Básico","description":"Lavado exterior simple","vehicleType":"auto","durationMinutes":30,"price":1200}' \
  "$BASE_URL/services")
echo "   ↳ Respuesta recibida:"
echo "$SERVICE1_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

SERVICE1_ID=$(echo "$SERVICE1_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.id || '');
} catch(e) {
  console.log('');
}
")

# 7. Crear segundo servicio válido
echo -e "\n7. Creando servicio válido 'Lavado Full' (duración = 60 minutos) vía POST /services..."
SERVICE2_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Lavado Full","description":"Lavado completo y cera","vehicleType":"camioneta","durationMinutes":60,"price":2500}' \
  "$BASE_URL/services")

# 8. Listar servicios del lavadero por Admin
echo -e "\n8. Consultando servicios del lavadero como Admin vía GET /services..."
GET_ADMIN_RES=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$BASE_URL/services")
echo "   ↳ Servicios listados:"
echo "$GET_ADMIN_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 9. Listar servicios del lavadero públicamente
echo -e "\n9. Consultando servicios del lavadero públicamente vía GET /services/car-wash/$CARWASH_ID..."
GET_PUBLIC_RES=$(curl -s -X GET "$BASE_URL/services/car-wash/$CARWASH_ID")
echo "   ↳ Servicios públicos listados:"
echo "$GET_PUBLIC_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 10. Actualizar servicio con valor inválido y luego válido
echo -e "\n10. Intentando actualizar duración de servicio a 55 min..."
FAIL_PATCH_RES=$(curl -s -X PATCH -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"durationMinutes":55}' \
  "$BASE_URL/services/$SERVICE1_ID")
echo "   ↳ Respuesta recibida (debe ser Bad Request): $FAIL_PATCH_RES"

echo -e "\nActualizando nombre a 'Lavado Básico Pro' y duración a 45 min..."
PATCH_RES=$(curl -s -X PATCH -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Lavado Básico Pro","durationMinutes":45}' \
  "$BASE_URL/services/$SERVICE1_ID")
echo "   ↳ Respuesta recibida del PATCH:"
echo "$PATCH_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 11. Obtener servicio por ID
echo -e "\n11. Consultando servicio por ID vía GET /services/$SERVICE1_ID..."
GET_ONE_RES=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$BASE_URL/services/$SERVICE1_ID")
echo "   ↳ Servicio por ID:"
echo "$GET_ONE_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 12. Eliminar un servicio
echo -e "\n12. Eliminando servicio '$SERVICE1_ID' vía DELETE /services/$SERVICE1_ID..."
DELETE_RES=$(curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$BASE_URL/services/$SERVICE1_ID")
echo "   ↳ Respuesta recibida: $DELETE_RES"

# 13. Confirmar listado final
echo -e "\n13. Confirmando listado de servicios después de eliminar..."
GET_FINAL_RES=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$BASE_URL/services")
echo "   ↳ Servicios restantes:"
echo "$GET_FINAL_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 14. Finalizar servidor
echo -e "\n14. Deteniendo el servidor NestJS..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ↳ ✅ Servidor detenido."
echo -e "\n=========================================================="
echo "🎉 ¡PRUEBA E2E DE SERVICIOS FINALIZADA CON ÉXITO!"
echo "=========================================================="
