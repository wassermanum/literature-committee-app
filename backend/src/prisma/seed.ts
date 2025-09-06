import { PrismaClient } from '@prisma/client';

// Enum types for SQLite compatibility
enum UserRole {
  GROUP = 'GROUP',
  LOCAL_SUBCOMMITTEE = 'LOCAL_SUBCOMMITTEE',
  LOCALITY = 'LOCALITY',
  REGION = 'REGION',
  ADMIN = 'ADMIN'
}

enum OrganizationType {
  GROUP = 'GROUP',
  LOCAL_SUBCOMMITTEE = 'LOCAL_SUBCOMMITTEE',
  LOCALITY = 'LOCALITY',
  REGION = 'REGION'
}

enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_ASSEMBLY = 'IN_ASSEMBLY',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

enum TransactionType {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
  ADJUSTMENT = 'ADJUSTMENT'
}
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.literature.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create organizations hierarchy
  console.log('Creating organizations...');
  
  // Region
  const region = await prisma.organization.create({
    data: {
      name: 'Регион Сибирь',
      type: OrganizationType.REGION,
      address: 'г. Новосибирск, ул. Ленина, 1',
      contactPerson: 'Иванов Иван Иванович',
      phone: '+7 (383) 123-45-67',
      email: 'region@siberia-na.org',
    },
  });

  // Localities
  const novosibirsk = await prisma.organization.create({
    data: {
      name: 'Местность Новосибирск',
      type: OrganizationType.LOCALITY,
      parentId: region.id,
      address: 'г. Новосибирск, ул. Красный проспект, 10',
      contactPerson: 'Петров Петр Петрович',
      phone: '+7 (383) 234-56-78',
      email: 'novosibirsk@siberia-na.org',
    },
  });

  const tomsk = await prisma.organization.create({
    data: {
      name: 'Местность Томск',
      type: OrganizationType.LOCALITY,
      parentId: region.id,
      address: 'г. Томск, пр. Ленина, 15',
      contactPerson: 'Сидоров Сидор Сидорович',
      phone: '+7 (3822) 345-67-89',
      email: 'tomsk@siberia-na.org',
    },
  });

  // Local subcommittees
  const centralSubcommittee = await prisma.organization.create({
    data: {
      name: 'Центральный местный подкомитет',
      type: OrganizationType.LOCAL_SUBCOMMITTEE,
      parentId: novosibirsk.id,
      address: 'г. Новосибирск, ул. Советская, 25',
      contactPerson: 'Козлов Андрей Викторович',
      phone: '+7 (383) 456-78-90',
      email: 'central@novosibirsk-na.org',
    },
  });

  // Groups
  const group1 = await prisma.organization.create({
    data: {
      name: 'Группа "Новая жизнь"',
      type: OrganizationType.GROUP,
      parentId: novosibirsk.id,
      address: 'г. Новосибирск, ул. Гоголя, 5',
      contactPerson: 'Морозов Алексей Сергеевич',
      phone: '+7 (383) 567-89-01',
      email: 'newlife@groups-na.org',
    },
  });

  const group2 = await prisma.organization.create({
    data: {
      name: 'Группа "Надежда"',
      type: OrganizationType.GROUP,
      parentId: tomsk.id,
      address: 'г. Томск, ул. Пушкина, 12',
      contactPerson: 'Волков Дмитрий Александрович',
      phone: '+7 (3822) 678-90-12',
      email: 'hope@groups-na.org',
    },
  });

  const group3 = await prisma.organization.create({
    data: {
      name: 'Группа "Свобода"',
      type: OrganizationType.GROUP,
      parentId: centralSubcommittee.id,
      address: 'г. Новосибирск, ул. Мира, 8',
      contactPerson: 'Лебедев Михаил Иванович',
      phone: '+7 (383) 789-01-23',
      email: 'freedom@groups-na.org',
    },
  });

  // Create users
  console.log('Creating users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@siberia-na.org',
      password: hashedPassword,
      firstName: 'Администратор',
      lastName: 'Системы',
      role: UserRole.ADMIN,
      organizationId: region.id,
    },
  });

  const regionUser = await prisma.user.create({
    data: {
      email: 'region@siberia-na.org',
      password: hashedPassword,
      firstName: 'Иван',
      lastName: 'Иванов',
      role: UserRole.REGION,
      organizationId: region.id,
    },
  });

  const localityUser1 = await prisma.user.create({
    data: {
      email: 'novosibirsk@siberia-na.org',
      password: hashedPassword,
      firstName: 'Петр',
      lastName: 'Петров',
      role: UserRole.LOCALITY,
      organizationId: novosibirsk.id,
    },
  });

  const localityUser2 = await prisma.user.create({
    data: {
      email: 'tomsk@siberia-na.org',
      password: hashedPassword,
      firstName: 'Сидор',
      lastName: 'Сидоров',
      role: UserRole.LOCALITY,
      organizationId: tomsk.id,
    },
  });

  const subcommitteeUser = await prisma.user.create({
    data: {
      email: 'central@novosibirsk-na.org',
      password: hashedPassword,
      firstName: 'Андрей',
      lastName: 'Козлов',
      role: UserRole.LOCAL_SUBCOMMITTEE,
      organizationId: centralSubcommittee.id,
    },
  });

  const groupUser1 = await prisma.user.create({
    data: {
      email: 'newlife@groups-na.org',
      password: hashedPassword,
      firstName: 'Алексей',
      lastName: 'Морозов',
      role: UserRole.GROUP,
      organizationId: group1.id,
    },
  });

  const groupUser2 = await prisma.user.create({
    data: {
      email: 'hope@groups-na.org',
      password: hashedPassword,
      firstName: 'Дмитрий',
      lastName: 'Волков',
      role: UserRole.GROUP,
      organizationId: group2.id,
    },
  });

  const groupUser3 = await prisma.user.create({
    data: {
      email: 'freedom@groups-na.org',
      password: hashedPassword,
      firstName: 'Михаил',
      lastName: 'Лебедев',
      role: UserRole.GROUP,
      organizationId: group3.id,
    },
  });

  // Create literature
  console.log('Creating literature...');
  
  const literature1 = await prisma.literature.create({
    data: {
      title: 'Базовый текст',
      description: 'Основная книга программы Анонимные Наркоманы',
      category: 'Основная литература',
      price: 150.00,
    },
  });

  const literature2 = await prisma.literature.create({
    data: {
      title: 'Это работает: Как и почему',
      description: 'Книга о 12 шагах программы АН',
      category: 'Основная литература',
      price: 120.00,
    },
  });

  const literature3 = await prisma.literature.create({
    data: {
      title: 'Просто на сегодня',
      description: 'Ежедневные размышления для выздоравливающих наркоманов',
      category: 'Медитации',
      price: 100.00,
    },
  });

  const literature4 = await prisma.literature.create({
    data: {
      title: 'Информационные буклеты (комплект)',
      description: 'Набор информационных буклетов о программе АН',
      category: 'Информационные материалы',
      price: 50.00,
    },
  });

  const literature5 = await prisma.literature.create({
    data: {
      title: 'Руководство по работе с группой',
      description: 'Практическое руководство для ведущих групп',
      category: 'Служебная литература',
      price: 80.00,
    },
  });

  // Create inventory
  console.log('Creating inventory...');
  
  // Region inventory (main warehouse)
  await prisma.inventory.createMany({
    data: [
      { organizationId: region.id, literatureId: literature1.id, quantity: 500, reservedQuantity: 0 },
      { organizationId: region.id, literatureId: literature2.id, quantity: 300, reservedQuantity: 0 },
      { organizationId: region.id, literatureId: literature3.id, quantity: 400, reservedQuantity: 0 },
      { organizationId: region.id, literatureId: literature4.id, quantity: 1000, reservedQuantity: 0 },
      { organizationId: region.id, literatureId: literature5.id, quantity: 200, reservedQuantity: 0 },
    ],
  });

  // Locality inventory
  await prisma.inventory.createMany({
    data: [
      { organizationId: novosibirsk.id, literatureId: literature1.id, quantity: 50, reservedQuantity: 0 },
      { organizationId: novosibirsk.id, literatureId: literature2.id, quantity: 30, reservedQuantity: 0 },
      { organizationId: novosibirsk.id, literatureId: literature3.id, quantity: 40, reservedQuantity: 0 },
      { organizationId: novosibirsk.id, literatureId: literature4.id, quantity: 100, reservedQuantity: 0 },
      { organizationId: novosibirsk.id, literatureId: literature5.id, quantity: 20, reservedQuantity: 0 },
      
      { organizationId: tomsk.id, literatureId: literature1.id, quantity: 25, reservedQuantity: 0 },
      { organizationId: tomsk.id, literatureId: literature2.id, quantity: 15, reservedQuantity: 0 },
      { organizationId: tomsk.id, literatureId: literature3.id, quantity: 20, reservedQuantity: 0 },
      { organizationId: tomsk.id, literatureId: literature4.id, quantity: 50, reservedQuantity: 0 },
      { organizationId: tomsk.id, literatureId: literature5.id, quantity: 10, reservedQuantity: 0 },
    ],
  });

  // Create sample orders
  console.log('Creating sample orders...');
  
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-001',
      fromOrganizationId: group1.id,
      toOrganizationId: novosibirsk.id,
      status: OrderStatus.PENDING,
      totalAmount: 370.00,
      notes: 'Срочный заказ для проведения презентации',
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        literatureId: literature1.id,
        quantity: 2,
        unitPrice: 150.00,
        totalPrice: 300.00,
      },
      {
        orderId: order1.id,
        literatureId: literature3.id,
        quantity: 1,
        unitPrice: 100.00,
        totalPrice: 100.00,
      },
    ],
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-002',
      fromOrganizationId: novosibirsk.id,
      toOrganizationId: region.id,
      status: OrderStatus.APPROVED,
      totalAmount: 1200.00,
      notes: 'Пополнение склада местности',
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order2.id,
        literatureId: literature1.id,
        quantity: 5,
        unitPrice: 150.00,
        totalPrice: 750.00,
      },
      {
        orderId: order2.id,
        literatureId: literature2.id,
        quantity: 3,
        unitPrice: 120.00,
        totalPrice: 360.00,
      },
      {
        orderId: order2.id,
        literatureId: literature5.id,
        quantity: 1,
        unitPrice: 80.00,
        totalPrice: 80.00,
      },
    ],
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-003',
      fromOrganizationId: group2.id,
      toOrganizationId: tomsk.id,
      status: OrderStatus.COMPLETED,
      totalAmount: 250.00,
      notes: 'Заказ выполнен и доставлен',
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order3.id,
        literatureId: literature3.id,
        quantity: 2,
        unitPrice: 100.00,
        totalPrice: 200.00,
      },
      {
        orderId: order3.id,
        literatureId: literature4.id,
        quantity: 1,
        unitPrice: 50.00,
        totalPrice: 50.00,
      },
    ],
  });

  // Create sample transactions
  console.log('Creating sample transactions...');
  
  await prisma.transaction.createMany({
    data: [
      {
        type: TransactionType.INCOMING,
        toOrganizationId: region.id,
        literatureId: literature1.id,
        quantity: 100,
        unitPrice: 150.00,
        totalAmount: 15000.00,
        notes: 'Поступление от издательства',
      },
      {
        type: TransactionType.OUTGOING,
        fromOrganizationId: region.id,
        toOrganizationId: novosibirsk.id,
        literatureId: literature1.id,
        quantity: 50,
        unitPrice: 150.00,
        totalAmount: 7500.00,
        orderId: order2.id,
        notes: 'Отгрузка по заказу ORD-2024-002',
      },
      {
        type: TransactionType.OUTGOING,
        fromOrganizationId: novosibirsk.id,
        toOrganizationId: group1.id,
        literatureId: literature1.id,
        quantity: 2,
        unitPrice: 150.00,
        totalAmount: 300.00,
        orderId: order1.id,
        notes: 'Отгрузка по заказу ORD-2024-001',
      },
      {
        type: TransactionType.OUTGOING,
        fromOrganizationId: tomsk.id,
        toOrganizationId: group2.id,
        literatureId: literature3.id,
        quantity: 2,
        unitPrice: 100.00,
        totalAmount: 200.00,
        orderId: order3.id,
        notes: 'Отгрузка по заказу ORD-2024-003',
      },
    ],
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Created:');
  console.log(`- ${await prisma.organization.count()} organizations`);
  console.log(`- ${await prisma.user.count()} users`);
  console.log(`- ${await prisma.literature.count()} literature items`);
  console.log(`- ${await prisma.order.count()} orders`);
  console.log(`- ${await prisma.orderItem.count()} order items`);
  console.log(`- ${await prisma.inventory.count()} inventory records`);
  console.log(`- ${await prisma.transaction.count()} transactions`);
  
  console.log('\n👤 Test users (password: password123):');
  console.log('- admin@siberia-na.org (Admin)');
  console.log('- region@siberia-na.org (Region)');
  console.log('- novosibirsk@siberia-na.org (Locality)');
  console.log('- tomsk@siberia-na.org (Locality)');
  console.log('- central@novosibirsk-na.org (Local Subcommittee)');
  console.log('- newlife@groups-na.org (Group)');
  console.log('- hope@groups-na.org (Group)');
  console.log('- freedom@groups-na.org (Group)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });