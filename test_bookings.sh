#!/usr/bin/env bash

# Puerto y URLs
PORT=3000
BASE_URL="http://localhost:$PORT"
TIMESTAMP=$(date +%s)
ADMIN_EMAIL="admin.bookings.$TIMESTAMP@test.com"
CLIENT_EMAIL="client.bookings.$TIMESTAMP@test.com"
PASSWORD="password123"

echo "=========================================================="
echo "🧪 INICIANDO PRUEBA DE INTEGRACIÓN DE RESERVAS (E2E)"
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

# 3. Registrar e iniciar sesión como Administrador
echo -e "\n3. Creando usuario ADMINISTRADOR..."
REG_ADMIN_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -d "{\"name\":\"Admin Reservas\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"admin\"}" \
  "$BASE_URL/users")

ADMIN_LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/auth/login")

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.access_token || '');
} catch(e) {
  console.log('');
}
")

CARWASH_ID=$(echo "$ADMIN_LOGIN_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  const payload = JSON.parse(Buffer.from(res.access_token.split('.')[1], 'base64').toString());
  console.log(payload.carWashId || '');
} catch(e) {
  console.log('');
}
")

echo "   ↳ ✅ Admin logueado. Lavadero ID: $CARWASH_ID"

# 4. Registrar e iniciar sesión como Cliente
echo -e "\n4. Creando e iniciando sesión como CLIENTE..."
REG_CLIENT_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"name\":\"Cliente Didáctico\",\"email\":\"$CLIENT_EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"client\"}" \
  "$BASE_URL/users")

CLIENT_LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$CLIENT_EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/auth/login")

CLIENT_TOKEN=$(echo "$CLIENT_LOGIN_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.access_token || '');
} catch(e) {
  console.log('');
}
")
echo "   ↳ ✅ Cliente logueado."

# 5. Configurar el establecimiento comercial (Admin)
echo -e "\n5. Configurando establecimiento: Nombre, CVU, 2 Bahías, y Horario Lunes 08:00-12:00..."
# Actualizar a 2 bahías
curl -s -X PATCH -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Premium Bookings Wash","clientPaymentAlias":"alias.bookings","baysCount":2}' \
  "$BASE_URL/car-washes/my-wash" > /dev/null

# Crear horario regular (Lunes = 1, 08:00 - 12:00)
curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00"}' \
  "$BASE_URL/schedules" > /dev/null

# Crear servicio de 60 minutos (duración = 60, precio = 1500)
SERVICE_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Lavado Premium","description":"60 min completo","vehicleType":"auto","durationMinutes":60,"price":1500}' \
  "$BASE_URL/services")

SERVICE_ID=$(echo "$SERVICE_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.id || '');
} catch(e) {
  console.log('');
}
")
echo "   ↳ ✅ Configuración completada. Servicio ID: $SERVICE_ID"

# 6. Consultar disponibilidad inicial (Lunes 8 de Junio de 2026)
# 2026-06-08 es un Lunes. Debería estar abierto de 08:00 a 12:00, servicio dura 60 min.
echo -e "\n6. Consultando disponibilidad inicial para el Lunes 2026-06-08..."
AV1_RES=$(curl -s -X GET "$BASE_URL/bookings/availability?carWashId=$CARWASH_ID&date=2026-06-08&serviceId=$SERVICE_ID")
echo "   ↳ Bloques libres iniciales: $AV1_RES"

# 7. Crear primer bloqueo temporal (pre-reserva a las 09:00)
echo -e "\n7. Pre-reservando turno a las 09:00 (Bloqueo 1) vía POST /bookings/lock..."
LOCK1_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "{\"carWashId\":\"$CARWASH_ID\",\"serviceId\":\"$SERVICE_ID\",\"dateTime\":\"2026-06-08T09:00:00\"}" \
  "$BASE_URL/bookings/lock")

LOCK1_ID=$(echo "$LOCK1_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.id || '');
} catch(e) {
  console.log('');
}
")
echo "   ↳ ✅ Pre-reserva 1 creada. ID: $LOCK1_ID"

# 8. Consultar disponibilidad con 1 bloqueo (debe seguir disponible a las 09:00 porque hay 2 bahías)
AV2_RES=$(curl -s -X GET "$BASE_URL/bookings/availability?carWashId=$CARWASH_ID&date=2026-06-08&serviceId=$SERVICE_ID")
echo "   ↳ Bloques libres tras pre-reserva 1: $AV2_RES"

# 9. Crear segundo bloqueo temporal (pre-reserva a las 09:00, ocupando la última bahía libre)
echo -e "\n9. Pre-reservando segundo turno a las 09:00 (Bloqueo 2) para ocupar la capacidad total..."
LOCK2_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "{\"carWashId\":\"$CARWASH_ID\",\"serviceId\":\"$SERVICE_ID\",\"dateTime\":\"2026-06-08T09:00:00\"}" \
  "$BASE_URL/bookings/lock")

LOCK2_ID=$(echo "$LOCK2_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.id || '');
} catch(e) {
  console.log('');
}
")
echo "   ↳ ✅ Pre-reserva 2 creada. ID: $LOCK2_ID"

# 10. Consultar disponibilidad (el slot 09:00 y los solapados de 08:15 a 09:45 NO deben estar disponibles)
echo -e "\n10. Consultando disponibilidad con capacidad completa a las 09:00..."
AV3_RES=$(curl -s -X GET "$BASE_URL/bookings/availability?carWashId=$CARWASH_ID&date=2026-06-08&serviceId=$SERVICE_ID")
echo "   ↳ Bloques libres resultantes (no debe aparecer 09:00): $AV3_RES"

# 11. Confirmar bloqueo 1 enviando el comprobante de pago
echo -e "\n11. Confirmando Reserva 1 subiendo comprobante vía POST /bookings/$LOCK1_ID/confirm..."
CONF1_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{"receiptUrl":"http://screenshot.com/comprobante1.png"}' \
  "$BASE_URL/bookings/$LOCK1_ID/confirm")
echo "    ↳ Respuesta confirmación:"
echo "$CONF1_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 12. Cancelar bloqueo 2 (para liberar capacidad)
echo -e "\n12. Cancelando Reserva 2 desde el panel de Cliente para liberar una bahía..."
REJ2_RES=$(curl -s -X POST -H "Authorization: Bearer $CLIENT_TOKEN" "$BASE_URL/bookings/$LOCK2_ID/cancel")
echo "    ↳ Respuesta cancelación: $REJ2_RES"

# 13. Consultar disponibilidad (slot 09:00 debe volver a estar libre)
echo -e "\n13. Consultando disponibilidad tras liberar Reserva 2..."
AV4_RES=$(curl -s -X GET "$BASE_URL/bookings/availability?carWashId=$CARWASH_ID&date=2026-06-08&serviceId=$SERVICE_ID")
echo "   ↳ Bloques libres restablecidos: $AV4_RES"

# 14. Aprobar la Reserva 1 (Admin asigna bahía)
echo -e "\n14. Aprobando Reserva 1 vía POST /bookings/$LOCK1_ID/approve..."
APP1_RES=$(curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/bookings/$LOCK1_ID/approve")
echo "    ↳ Reserva Aprobada y Bahía asignada:"
echo "$APP1_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 15. Consultar reservas de cliente y notificaciones
echo -e "\n15. Verificando notificaciones del cliente..."
NOTIF_RES=$(curl -s -X GET -H "Authorization: Bearer $CLIENT_TOKEN" "$BASE_URL/notifications")
echo "$NOTIF_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 16. Cancelar la Reserva 1 (Cliente)
echo -e "\n16. Cancelando Reserva 1 por el cliente vía POST /bookings/$LOCK1_ID/cancel..."
CANCEL_RES=$(curl -s -X POST -H "Authorization: Bearer $CLIENT_TOKEN" "$BASE_URL/bookings/$LOCK1_ID/cancel")
echo "    ↳ Respuesta cancelación:"
echo "$CANCEL_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 17. Finalizar servidor
echo -e "\n17. Deteniendo el servidor NestJS..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ↳ ✅ Servidor detenido."
echo -e "\n=========================================================="
echo "🎉 ¡PRUEBA E2E DE RESERVAS FINALIZADA CON ÉXITO!"
echo "=========================================================="
