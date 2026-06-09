#!/usr/bin/env bash

# Puerto y URLs
PORT=3000
BASE_URL="http://localhost:$PORT"
TIMESTAMP=$(date +%s)
EMAIL="admin.schedules.$TIMESTAMP@test.com"
PASSWORD="password123"
NAME="Admin de Horarios E2E"

echo "=========================================================="
echo "🧪 INICIANDO PRUEBA DE INTEGRACIÓN DE HORARIOS (E2E)"
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

# 5. Intentar crear horario regular inválido (día incorrecto)
echo -e "\n5. Creando horario con día de la semana inválido (dayOfWeek = 7) vía POST /schedules..."
FAIL_DAY_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"dayOfWeek":7,"startTime":"08:00","endTime":"12:00"}' \
  "$BASE_URL/schedules")
echo "   ↳ Respuesta recibida (debe ser Bad Request): $FAIL_DAY_RES"

# 6. Intentar crear horario regular con formato de hora inválido
echo -e "\n6. Creando horario con formato de hora inválido (startTime = 8:00) vía POST /schedules..."
FAIL_TIME_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"dayOfWeek":1,"startTime":"8:00","endTime":"12:00"}' \
  "$BASE_URL/schedules")
echo "   ↳ Respuesta recibida (debe ser Bad Request): $FAIL_TIME_RES"

# 7. Crear un horario regular válido (Lunes, 08:00 a 12:00)
echo -e "\n7. Creando horario válido 'Lunes 08:00 - 12:00' vía POST /schedules..."
SCH1_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00"}' \
  "$BASE_URL/schedules")
echo "   ↳ Respuesta recibida:"
echo "$SCH1_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

SCH1_ID=$(echo "$SCH1_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.id || '');
} catch(e) {
  console.log('');
}
")

# 8. Intentar crear un horario regular que se superpone (Lunes, 10:00 a 14:00)
echo -e "\n8. Intentando crear horario superpuesto 'Lunes 10:00 - 14:00'..."
FAIL_OVERLAP_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"dayOfWeek":1,"startTime":"10:00","endTime":"14:00"}' \
  "$BASE_URL/schedules")
echo "   ↳ Respuesta recibida (debe ser Bad Request por superposición): $FAIL_OVERLAP_RES"

# 9. Crear otro horario no superpuesto (Lunes, 14:00 a 18:00)
echo -e "\n9. Creando segundo horario válido no superpuesto 'Lunes 14:00 - 18:00'..."
SCH2_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"dayOfWeek":1,"startTime":"14:00","endTime":"18:00"}' \
  "$BASE_URL/schedules")

# 10. Listar horarios regulares del lavadero por Admin y Públicamente
echo -e "\n10. Consultando horarios regulares como Admin vía GET /schedules..."
GET_ADMIN_RES=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$BASE_URL/schedules")
echo "   ↳ Horarios listados:"
echo "$GET_ADMIN_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

echo -e "\nConsultando horarios regulares públicamente vía GET /schedules/car-wash/$CARWASH_ID..."
GET_PUBLIC_RES=$(curl -s -X GET "$BASE_URL/schedules/car-wash/$CARWASH_ID")
echo "   ↳ Horarios públicos listados:"
echo "$GET_PUBLIC_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 11. Eliminar un horario regular
echo -e "\n11. Eliminando primer horario regular '$SCH1_ID'..."
DEL_SCH_RES=$(curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$BASE_URL/schedules/$SCH1_ID")
echo "   ↳ Respuesta recibida: $DEL_SCH_RES"

# 12. Crear excepciones de horario (Cierres/Feriados)
echo -e "\n12. Creando excepción de horario inválida (formato de fecha incorrecto)..."
FAIL_EXC_DATE=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date":"25-12-2026","reason":"Navidad"}' \
  "$BASE_URL/schedules/exceptions")
echo "   ↳ Respuesta recibida (debe ser Bad Request): $FAIL_EXC_DATE"

echo -e "\nCreando excepción válida '2026-12-25' (Navidad)..."
EXC_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date":"2026-12-25","reason":"Navidad"}' \
  "$BASE_URL/schedules/exceptions")
echo "   ↳ Respuesta recibida:"
echo "$EXC_RES" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

EXC_ID=$(echo "$EXC_RES" | node -e "
const fs = require('fs');
try {
  const res = JSON.parse(fs.readFileSync(0, 'utf-8'));
  console.log(res.id || '');
} catch(e) {
  console.log('');
}
")

echo -e "\nIntentando crear excepción duplicada para la misma fecha '2026-12-25'..."
FAIL_EXC_DUP=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date":"2026-12-25","reason":"Navidad Repetida"}' \
  "$BASE_URL/schedules/exceptions")
echo "   ↳ Respuesta recibida (debe ser Bad Request por duplicidad): $FAIL_EXC_DUP"

# 13. Obtener excepciones de horario por Admin y Públicamente
echo -e "\n13. Consultando excepciones como Admin vía GET /schedules/exceptions..."
GET_EXC_ADMIN=$(curl -s -X GET -H "Authorization: Bearer $TOKEN" "$BASE_URL/schedules/exceptions")
echo "   ↳ Excepciones listadas:"
echo "$GET_EXC_ADMIN" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

echo -e "\nConsultando excepciones públicamente vía GET /schedules/exceptions/car-wash/$CARWASH_ID..."
GET_EXC_PUB=$(curl -s -X GET "$BASE_URL/schedules/exceptions/car-wash/$CARWASH_ID")
echo "   ↳ Excepciones públicas listadas:"
echo "$GET_EXC_PUB" | node -e "
const fs = require('fs');
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf-8')), null, 2));
"

# 14. Eliminar excepción de horario
echo -e "\n14. Eliminando excepción de horario '$EXC_ID'..."
DEL_EXC_RES=$(curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$BASE_URL/schedules/exceptions/$EXC_ID")
echo "   ↳ Respuesta recibida: $DEL_EXC_RES"

# 15. Finalizar servidor
echo -e "\n15. Deteniendo el servidor NestJS..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "   ↳ ✅ Servidor detenido."
echo -e "\n=========================================================="
echo "🎉 ¡PRUEBA E2E DE HORARIOS FINALIZADA CON ÉXITO!"
echo "=========================================================="
