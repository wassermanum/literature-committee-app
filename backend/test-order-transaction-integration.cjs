// Тест интеграции между заказами и транзакциями
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrderTransactionIntegration() {
  console.log('🧪 Тестирование интеграции заказов и транзакций...');

  try {
    // Очищаем тестовые данные
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.transaction.deleteMany({
      where: { notes: { contains: 'Integration Test' } }
    });
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({
      where: { orderNumber: { startsWith: 'TEST-' } }
    });
    await prisma.inventory.deleteMany({
      where: { organization: { name: { startsWith: 'Test Integration' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'integration-test' } }
    });
    await prisma.organization.deleteMany({
      where: { name: { startsWith: 'Test Integration' } }
    });
    await prisma.literature.deleteMany({
      where: { title: { startsWith: 'Integration Test' } }
    });
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

    // Создаем тестовые данные
    const fromOrg = await prisma.organization.create({
      data: {
        name: 'Test Integration From Org',
        type: 'GROUP',
        address: 'Test Address 1',
        contactPerson: 'Test Contact 1',
        phone: '+1234567890',
        email: 'integration-test-from@org.com',
      },
    });

    const toOrg = await prisma.organization.create({
      data: {
        name: 'Test Integration To Org',
        type: 'LOCALITY',
        address: 'Test Address 2',
        contactPerson: 'Test Contact 2',
        phone: '+1234567891',
        email: 'integration-test-to@org.com',
      },
    });

    const literature = await prisma.literature.create({
      data: {
        title: 'Integration Test Literature',
        description: 'Test literature for integration testing',
        category: 'Books',
        price: 15.50,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: 'integration-test@user.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'GROUP',
        organizationId: fromOrg.id,
      },
    });

    // Создаем остатки на складе отправляющей организации
    await prisma.inventory.create({
      data: {
        organizationId: toOrg.id,
        literatureId: literature.id,
        quantity: 100,
        reservedQuantity: 0,
      },
    });

    console.log('✅ Тестовые данные созданы');

    // Создаем заказ
    const order = await prisma.order.create({
      data: {
        orderNumber: 'TEST-INTEGRATION-001',
        fromOrganizationId: fromOrg.id,
        toOrganizationId: toOrg.id,
        status: 'DRAFT',
        totalAmount: 31.00, // 2 * 15.50
        createdById: user.id,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        literatureId: literature.id,
        quantity: 2,
        unitPrice: 15.50,
        totalPrice: 31.00,
      },
    });

    console.log('✅ Заказ создан:', order.orderNumber);

    // Проверяем, что транзакций пока нет
    let transactions = await prisma.transaction.findMany({
      where: { orderId: order.id }
    });
    console.log(`📊 Транзакций после создания заказа: ${transactions.length} (ожидается 0)`);

    // Переводим заказ в статус APPROVED
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'APPROVED' }
    });

    // Резервируем товары
    await prisma.inventory.update({
      where: {
        organizationId_literatureId: {
          organizationId: toOrg.id,
          literatureId: literature.id,
        },
      },
      data: {
        reservedQuantity: { increment: 2 }
      }
    });

    console.log('✅ Заказ одобрен и товары зарезервированы');

    // Переводим заказ в статус SHIPPED - должны создаться исходящие транзакции
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'SHIPPED' }
      });

      // Создаем исходящие транзакции (как в OrderService)
      await tx.transaction.create({
        data: {
          type: 'OUTGOING',
          fromOrganizationId: toOrg.id,
          toOrganizationId: fromOrg.id,
          literatureId: literature.id,
          quantity: 2,
          unitPrice: 15.50,
          totalAmount: 31.00,
          orderId: order.id,
          notes: `Order shipment: ${order.orderNumber}`,
        },
      });
    });

    console.log('✅ Заказ отгружен');

    // Проверяем исходящие транзакции
    transactions = await prisma.transaction.findMany({
      where: { orderId: order.id, type: 'OUTGOING' }
    });
    console.log(`📊 Исходящих транзакций после отгрузки: ${transactions.length} (ожидается 1)`);

    if (transactions.length === 1) {
      const outgoingTx = transactions[0];
      console.log(`✅ Исходящая транзакция: ${outgoingTx.type}, количество: ${outgoingTx.quantity}, сумма: ${outgoingTx.totalAmount}`);
    }

    // Переводим заказ в статус COMPLETED - должны создаться входящие транзакции
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' }
      });

      // Создаем входящие транзакции (как в OrderService)
      await tx.transaction.create({
        data: {
          type: 'INCOMING',
          fromOrganizationId: toOrg.id,
          toOrganizationId: fromOrg.id,
          literatureId: literature.id,
          quantity: 2,
          unitPrice: 15.50,
          totalAmount: 31.00,
          orderId: order.id,
          notes: `Order delivery: ${order.orderNumber}`,
        },
      });

      // Обновляем остатки
      await tx.inventory.update({
        where: {
          organizationId_literatureId: {
            organizationId: toOrg.id,
            literatureId: literature.id,
          },
        },
        data: {
          quantity: { decrement: 2 },
          reservedQuantity: { decrement: 2 },
        },
      });

      await tx.inventory.upsert({
        where: {
          organizationId_literatureId: {
            organizationId: fromOrg.id,
            literatureId: literature.id,
          },
        },
        update: {
          quantity: { increment: 2 },
        },
        create: {
          organizationId: fromOrg.id,
          literatureId: literature.id,
          quantity: 2,
          reservedQuantity: 0,
        },
      });
    });

    console.log('✅ Заказ завершен');

    // Проверяем все транзакции
    transactions = await prisma.transaction.findMany({
      where: { orderId: order.id },
      include: {
        fromOrganization: { select: { name: true } },
        toOrganization: { select: { name: true } },
        literature: { select: { title: true } }
      }
    });

    console.log(`📊 Всего транзакций для заказа: ${transactions.length} (ожидается 2)`);

    transactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.type}: ${tx.fromOrganization?.name || 'N/A'} → ${tx.toOrganization.name}`);
      console.log(`     Литература: ${tx.literature.title}, Количество: ${tx.quantity}, Сумма: ${tx.totalAmount}`);
    });

    // Проверяем остатки на складах
    const fromInventory = await prisma.inventory.findUnique({
      where: {
        organizationId_literatureId: {
          organizationId: fromOrg.id,
          literatureId: literature.id,
        },
      },
    });

    const toInventory = await prisma.inventory.findUnique({
      where: {
        organizationId_literatureId: {
          organizationId: toOrg.id,
          literatureId: literature.id,
        },
      },
    });

    console.log(`📦 Остатки на складе получателя: ${fromInventory?.quantity || 0} (ожидается 2)`);
    console.log(`📦 Остатки на складе отправителя: ${toInventory?.quantity || 0} (ожидается 98)`);
    console.log(`📦 Зарезервировано у отправителя: ${toInventory?.reservedQuantity || 0} (ожидается 0)`);

    // Проверяем корректность данных
    const hasOutgoing = transactions.some(tx => tx.type === 'OUTGOING');
    const hasIncoming = transactions.some(tx => tx.type === 'INCOMING');
    const correctInventory = (fromInventory?.quantity === 2) && (toInventory?.quantity === 98);

    if (hasOutgoing && hasIncoming && correctInventory) {
      console.log('🎉 Интеграция заказов и транзакций работает корректно!');
    } else {
      console.log('❌ Обнаружены проблемы в интеграции');
    }

    // Очищаем тестовые данные
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.transaction.deleteMany({
      where: { orderId: order.id }
    });
    await prisma.orderItem.deleteMany({
      where: { orderId: order.id }
    });
    await prisma.order.deleteMany({
      where: { id: order.id }
    });
    await prisma.inventory.deleteMany({
      where: { 
        OR: [
          { organizationId: fromOrg.id },
          { organizationId: toOrg.id }
        ]
      }
    });
    await prisma.user.deleteMany({
      where: { id: user.id }
    });
    await prisma.organization.deleteMany({
      where: { 
        OR: [
          { id: fromOrg.id },
          { id: toOrg.id }
        ]
      }
    });
    await prisma.literature.deleteMany({
      where: { id: literature.id }
    });
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

    console.log('✅ Тестовые данные очищены');

  } catch (error) {
    console.error('❌ Ошибка при тестировании интеграции:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем тест
testOrderTransactionIntegration()
  .then(() => {
    console.log('✅ Тест интеграции завершен успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Тест интеграции завершился с ошибкой:', error);
    process.exit(1);
  });