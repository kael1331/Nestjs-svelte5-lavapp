import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { CarWash } from './entities/car-wash.entity';
import { CarWashBay, BayStatus } from './entities/car-wash-bay.entity';
import { AdminSubscription, SubscriptionStatus } from './entities/admin-subscription.entity';
import { AppModule } from '../app.module';

describe('CarWashes Database Integration', () => {
  let moduleRef: TestingModule;
  let userRepository: Repository<User>;
  let carWashRepository: Repository<CarWash>;
  let bayRepository: Repository<CarWashBay>;
  let subscriptionRepository: Repository<AdminSubscription>;

  beforeAll(async () => {
    console.log('\n======================================================');
    console.log('🚀 INICIANDO ENTORNO DE PRUEBAS DE NESTJS Y TYPEORM');
    console.log('======================================================');
    console.log('NestJS inicializa todos los módulos declarados en AppModule.');
    console.log('TypeORM lee las clases de Entidades y sincroniza las tablas de SQLite.');

    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    carWashRepository = moduleRef.get<Repository<CarWash>>(getRepositoryToken(CarWash));
    bayRepository = moduleRef.get<Repository<CarWashBay>>(getRepositoryToken(CarWashBay));
    subscriptionRepository = moduleRef.get<Repository<AdminSubscription>>(getRepositoryToken(AdminSubscription));
    
    console.log('✅ Entorno de pruebas listo. Repositorios inyectados.');
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
      console.log('\n======================================================');
      console.log('🛑 ENTORNO DE PRUEBAS CERRADO CON ÉXITO');
      console.log('======================================================');
    }
  });

  it('debería crear un usuario admin, su lavadero, su bahía y su suscripción, y verificar sus relaciones en la base de datos', async () => {
    // -------------------------------------------------------------
    // PASO 1: Creación del Usuario Administrador
    // -------------------------------------------------------------
    console.log('\n[PASO 1] Creando el usuario Administrador comercial...');
    console.log('  ↳ Razón: Necesitamos un usuario con rol "admin" que sea el propietario legal del lavadero.');
    console.log('  ↳ Acción ORM: userRepository.save(...)');
    console.log('  ↳ Consulta SQL interna: INSERT INTO "user" ("name", "email", "role") VALUES (?, ?, ?)');
    
    const user = userRepository.create({
      name: 'Admin Test Comercial',
      email: `admin.didactico.${Date.now()}@lavadero.com`,
      role: UserRole.ADMIN,
    });
    const savedUser = await userRepository.save(user);
    console.log('  ↳ ✅ Usuario guardado en base de datos. ID generado:', savedUser.id);

    // -------------------------------------------------------------
    // PASO 2: Creación del Lavadero (CarWash)
    // -------------------------------------------------------------
    console.log('\n[PASO 2] Creando el establecimiento comercial (CarWash)...');
    console.log(`  ↳ Razón: El lavadero se vincula al administrador mediante una relación 1:1 usando "adminId" (${savedUser.id}).`);
    console.log('  ↳ Acción ORM: carWashRepository.save(...)');
    console.log('  ↳ Consulta SQL interna: INSERT INTO "car_washes" ("adminId", "name", "clientPaymentAlias", "isServiceActive", "baysCount") VALUES (?, ?, ?, ?, ?)');

    const carWash = carWashRepository.create({
      adminId: savedUser.id,
      name: 'Lavadero Didáctico Express',
      clientPaymentAlias: 'lavadero.didactico.cbu',
      isServiceActive: false, // Inactivo por defecto hasta que pague
      baysCount: 1,           // Comienza con 1 bahía por defecto
    });
    const savedCarWash = await carWashRepository.save(carWash);
    console.log('  ↳ ✅ Lavadero guardado. ID generado (UUID):', savedCarWash.id);

    // -------------------------------------------------------------
    // PASO 3: Creación de la Bahía física (CarWashBay)
    // -------------------------------------------------------------
    console.log('\n[PASO 3] Registrando una bahía física de lavado para el establecimiento...');
    console.log(`  ↳ Razón: Relación N:1. La bahía pertenece al lavadero y se vincula mediante "carWashId" (${savedCarWash.id}).`);
    console.log('  ↳ Acción ORM: bayRepository.save(...)');
    console.log('  ↳ Consulta SQL interna: INSERT INTO "car_wash_bays" ("carWashId", "bayNumber", "status") VALUES (?, ?, ?)');

    const bay = bayRepository.create({
      carWashId: savedCarWash.id,
      bayNumber: 1,
      status: BayStatus.FREE, // Disponible por defecto
    });
    const savedBay = await bayRepository.save(bay);
    console.log('  ↳ ✅ Bahía física registrada. ID generado (UUID):', savedBay.id);

    // -------------------------------------------------------------
    // PASO 4: Registro de una Suscripción (AdminSubscription)
    // -------------------------------------------------------------
    console.log('\n[PASO 4] Cargando una solicitud de suscripción de prueba para habilitar el lavadero...');
    console.log(`  ↳ Razón: Relación N:1. Registra el comprobante de transferencia adjunto al lavadero "carWashId" (${savedCarWash.id}).`);
    console.log('  ↳ Acción ORM: subscriptionRepository.save(...)');
    console.log('  ↳ Consulta SQL interna: INSERT INTO "admin_subscriptions" ("carWashId", "receiptUrl", "status", "amountPaid") VALUES (?, ?, ?, ?)');

    const subscription = subscriptionRepository.create({
      carWashId: savedCarWash.id,
      receiptUrl: 'http://bucket.lavados.com/comprobante-admin.jpg',
      amountPaid: 1500.00,
      status: SubscriptionStatus.PENDING, // Queda pendiente de validación por el Superadmin
    });
    const savedSub = await subscriptionRepository.save(subscription);
    console.log('  ↳ ✅ Suscripción registrada. ID generado (UUID):', savedSub.id);

    // -------------------------------------------------------------
    // PASO 5: Consulta Relacional Avanzada (Eager Loading)
    // -------------------------------------------------------------
    console.log('\n[PASO 5] Recuperando el administrador de la base de datos cargando todas sus relaciones anidadas...');
    console.log('  ↳ Razón: Validamos que el ORM arme la estructura de objetos correcta (User -> CarWash -> Bays & Subscriptions).');
    console.log('  ↳ Acción ORM: userRepository.findOne(...) con mapa de relaciones.');
    console.log('  ↳ Consulta SQL interna: SELECT ... FROM "user" LEFT JOIN "car_washes" ... LEFT JOIN "car_wash_bays" ... LEFT JOIN "admin_subscriptions" ... WHERE user.id = ?');

    const fetchedUser = await userRepository.findOne({
      where: { id: savedUser.id },
      relations: {
        carWash: {
          bays: true,
          subscriptions: true,
        },
      },
    });

    console.log('  ↳ 📦 OBJETO DE RESULTADO DEVUELTO POR TYPEORM:');
    console.log(JSON.stringify(fetchedUser, null, 2));

    // Aserciones Jest (Verifican la integridad)
    expect(fetchedUser).toBeDefined();
    expect(fetchedUser.carWash).toBeDefined();
    expect(fetchedUser.carWash.name).toBe('Lavadero Didáctico Express');
    expect(fetchedUser.carWash.bays).toHaveLength(1);
    expect(fetchedUser.carWash.bays[0].bayNumber).toBe(1);
    expect(fetchedUser.carWash.subscriptions).toHaveLength(1);
    expect(Number(fetchedUser.carWash.subscriptions[0].amountPaid)).toBe(1500.00);
    console.log('  ↳ ✅ Aserciones exitosas. Las relaciones y tipos de datos coinciden a la perfección.');

    // -------------------------------------------------------------
    // PASO 6: Limpieza y Garbage Collection
    // -------------------------------------------------------------
    console.log('\n[PASO 6] Eliminando los registros creados durante la prueba...');
    console.log('  ↳ Razón: Dejamos la base de datos limpia para que las pruebas subsiguientes no se contaminen.');
    console.log('  ↳ Acción ORM: Repository.remove(...) en orden inverso de dependencias para evitar violaciones de claves foráneas.');
    
    await subscriptionRepository.remove(savedSub);
    await bayRepository.remove(savedBay);
    await carWashRepository.remove(savedCarWash);
    await userRepository.remove(savedUser);
    console.log('  ↳ ✅ Limpieza completada. Base de datos restablecida.');
  });
});
