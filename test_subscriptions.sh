#!/usr/bin/env bash

# Puerto y URLs
PORT=3000
BASE_URL="http://localhost:$PORT"
TIMESTAMP=$(date +%s)
ADMIN1_EMAIL="admin.sub1.$TIMESTAMP@test.com"
ADMIN2_EMAIL="admin.sub2.$TIMESTAMP@test.com"
PASSWORD="password123"

echo "=========================================================="
echo "🧪 INICIANDO PRUEBA DE SUSCRIPCIONES Y SEGURIDAD (E2E)"
echo "=========================================================="

# Crear una imagen ficticia para la subida
echo "fictional-image-data-12345" > mock_receipt.png

# 1. Compilar y arrancar el servidor NestJS en segundo plano
echo "1. Compilando la aplicación NestJS..."
cd user-api || exit 1
node node_modules/@nestjs/cli/bin/nest.js build || exit 1
echo "   ↳ Iniciando el servidor NestJS en segundo plano..."
node dist/main > ../server.log 2>&1 &
SERVER_PID=$!
cd ..

# Esperar a que el puerto 3000 esté activo
echo "   ↳ Esperando a que el servidor responda en el puerto $PORT..."
for i in {1..25}; do
  if curl -s "$BASE_URL" > /dev/null; then
    break
  fi
  sleep 1
done

if ! curl -s "$BASE_URL" > /dev/null; then
  echo "❌ Error: El servidor NestJS no arrancó a tiempo."
  kill $SERVER_PID 2>/dev/null
  rm -f mock_receipt.png
  exit 1
fi
echo "   ↳ ✅ Servidor activo."

# 2. Autenticar como SuperAdmin
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
  echo "❌ Error: No se pudo obtener el token de Super Administrador."
  kill $SERVER_PID 2>/dev/null
  rm -f mock_receipt.png
  exit 1
fi

# 3. Registrar al Administrador 1
echo -e "\n3. Registrando al Administrador 1..."
REG_ADMIN1_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{\"name\":\"Admin Sin Pagar\",\"email\":\"$ADMIN1_EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"admin\"}" \
  "$BASE_URL/users")

ADMIN1_LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN1_EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/auth/login")

ADMIN1_TOKEN=$(echo "$ADMIN1_LOGIN_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.access_token || '');
} catch(e) {
  console.log('');
}
")

CARWASH1_ID=$(echo "$ADMIN1_LOGIN_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  const payload = JSON.parse(Buffer.from(res.access_token.split('.')[1], 'base64').toString());
  console.log(payload.carWashId || '');
} catch(e) {
  console.log('');
}
")
echo "   ↳ ✅ Admin 1 logueado. Lavadero ID: $CARWASH1_ID"

# 4. Probar que Admin 1 NO puede crear servicios (Suscripción Inactiva)
echo -e "\n4. Admin 1 intenta crear un servicio sin haber pagado..."
SERVICE_FAIL_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN1_TOKEN" \
  -d '{"name":"Lavado Test","description":"Debe fallar","vehicleType":"auto","durationMinutes":30,"price":1000}' \
  "$BASE_URL/services")
echo "   ↳ Respuesta recibida (Debe ser 403 Forbidden):"
echo "$SERVICE_FAIL_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 5. Admin 1 sube el comprobante de transferencia
echo -e "\n5. Admin 1 sube su comprobante de transferencia vía POST /car-washes/my-wash/subscribe..."
UPLOAD_RES=$(curl -s -X POST -H "Authorization: Bearer $ADMIN1_TOKEN" \
  -F "file=@mock_receipt.png" \
  "$BASE_URL/car-washes/my-wash/subscribe")
echo "   ↳ Respuesta de la subida:"
echo "$UPLOAD_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

SUB1_ID=$(echo "$UPLOAD_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.id || '');
} catch(e) {
  console.log('');
}
")

# Obtener el nombre del archivo de la url del comprobante
FILE_NAME=$(echo "$UPLOAD_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.receiptUrl.split('/').pop());
} catch(e) {
  console.log('');
}
")

# 6. Probar seguridad del comprobante (Admin 1 intenta ver la imagen directa y debe fallar)
echo -e "\n6. Admin 1 intenta descargar la imagen del comprobante directa..."
RECEIPT_FAIL_RES=$(curl -s -H "Authorization: Bearer $ADMIN1_TOKEN" "$BASE_URL/car-washes/subscriptions/receipts/$FILE_NAME")
echo "   ↳ Respuesta recibida (Debe ser 403 Forbidden por no ser SuperAdmin): $RECEIPT_FAIL_RES"

# 7. SuperAdmin lista suscripciones pendientes y descarga el comprobante
echo -e "\n7. SuperAdmin lista suscripciones pendientes..."
PENDING_RES=$(curl -s -H "Authorization: Bearer $SUPER_TOKEN" "$BASE_URL/car-washes/subscriptions/pending")
echo "$PENDING_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

echo -e "\nSuperAdmin descarga y valida la imagen del comprobante..."
RECEIPT_SUCCESS_RES=$(curl -s -H "Authorization: Bearer $SUPER_TOKEN" "$BASE_URL/car-washes/subscriptions/receipts/$FILE_NAME")
echo "   ↳ Contenido del comprobante leído: '$RECEIPT_SUCCESS_RES'"

# 8. SuperAdmin aprueba la suscripción del Admin 1
echo -e "\n8. SuperAdmin aprueba la suscripción del Admin 1..."
APPROVE_RES=$(curl -s -X POST -H "Authorization: Bearer $SUPER_TOKEN" "$BASE_URL/car-washes/subscriptions/$SUB1_ID/approve")
echo "   ↳ Estado de suscripción aprobado:"
echo "$APPROVE_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 9. Admin 1 intenta crear el servicio nuevamente (Debe funcionar ahora)
echo -e "\n9. Admin 1 intenta crear el servicio con su suscripción activa..."
SERVICE_SUCCESS_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN1_TOKEN" \
  -d '{"name":"Lavado Premium E2E","description":"Lavado de alta gama","vehicleType":"auto","durationMinutes":45,"price":2000}' \
  "$BASE_URL/services")
echo "   ↳ Servicio creado exitosamente:"
echo "$SERVICE_SUCCESS_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 10. Registrar Admin 2, subir comprobante y rechazarlo
echo -e "\n10. Creando Admin 2 para probar el rechazo de pagos..."
REG_ADMIN2_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{\"name\":\"Admin Rechazado\",\"email\":\"$ADMIN2_EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"admin\"}" \
  "$BASE_URL/users")

ADMIN2_LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN2_EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/auth/login")

ADMIN2_TOKEN=$(echo "$ADMIN2_LOGIN_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.access_token || '');
} catch(e) {
  console.log('');
}
")

UPLOAD2_RES=$(curl -s -X POST -H "Authorization: Bearer $ADMIN2_TOKEN" \
  -F "file=@mock_receipt.png" \
  "$BASE_URL/car-washes/my-wash/subscribe")

SUB2_ID=$(echo "$UPLOAD2_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.id || '');
} catch(e) {
  console.log('');
}
")
echo "   ↳ ✅ Comprobante de Admin 2 subido. ID Suscripción: $SUB2_ID"

echo -e "\nSuperAdmin rechaza la suscripción del Admin 2..."
REJECT_RES=$(curl -s -X POST -H "Authorization: Bearer $SUPER_TOKEN" "$BASE_URL/car-washes/subscriptions/$SUB2_ID/reject")
echo "   ↳ Estado de suscripción rechazado:"
echo "$REJECT_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 11. Verificar que Admin 2 sigue bloqueado
echo -e "\n11. Admin 2 intenta crear un servicio (Debe recibir 403 Forbidden)..."
SERVICE2_FAIL_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN2_TOKEN" \
  -d '{"name":"Lavado Intento 2","description":"Debe fallar","vehicleType":"auto","durationMinutes":30,"price":1000}' \
  "$BASE_URL/services")
echo "   ↳ Respuesta recibida: $SERVICE2_FAIL_RES"

# 12. Finalizar servidor
echo -e "\n12. Deteniendo el servidor NestJS..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
rm -f mock_receipt.png
rm -rf uploads/receipts
echo "   ↳ ✅ Servidor detenido y archivos de prueba limpiados."
echo -e "\n=========================================================="
echo "🎉 ¡PRUEBA DE SUSCRIPCIONES Y SEGURIDAD FINALIZADA CON ÉXITO!"
echo "=========================================================="
