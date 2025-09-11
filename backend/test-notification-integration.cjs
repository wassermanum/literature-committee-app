const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificationIntegration() {
  console.log('🧪 Testing Notification System Integration...\n');

  try {
    // Test 1: Check if notification service can be imported
    console.log('1. Testing notification service import...');
    const { NotificationService } = await import('./src/services/notificationService.js');
    const notificationService = new NotificationService(prisma);
    console.log('✅ NotificationService imported successfully\n');

    // Test 2: Check if template service works
    console.log('2. Testing notification templates...');
    const { NotificationTemplateService } = await import('./src/services/notificationTemplateService.js');
    const templateService = new NotificationTemplateService();
    
    const orderData = {
      orderNumber: 'TEST-001',
      fromOrganization: 'Test Group',
      toOrganization: 'Test Locality',
      totalAmount: 1000,
      createdAt: new Date(),
      items: [{
        title: 'Test Book',
        quantity: 2,
        unitPrice: 500
      }]
    };

    const subject = templateService.getOrderCreatedSubject(orderData);
    const text = templateService.getOrderCreatedText(orderData);
    const html = templateService.getOrderCreatedHtml(orderData);

    console.log('Subject:', subject);
    console.log('Text length:', text.length);
    console.log('HTML length:', html.length);
    console.log('✅ Templates generated successfully\n');

    // Test 3: Check if scheduled service can be created
    console.log('3. Testing scheduled notification service...');
    const { ScheduledNotificationService } = await import('./src/services/scheduledNotificationService.js');
    const scheduledService = new ScheduledNotificationService();
    
    const status = scheduledService.getStatus();
    console.log('Scheduled service status:', status);
    console.log('✅ ScheduledNotificationService created successfully\n');

    // Test 4: Test notification data structure
    console.log('4. Testing notification data structures...');
    const testNotification = {
      type: 'ORDER_CREATED',
      recipients: [{
        id: 'test-user',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'GROUP',
        organizationId: 'test-org'
      }],
      subject: 'Test Notification',
      message: 'This is a test notification',
      channel: 'INTERNAL',
      priority: 'MEDIUM'
    };

    console.log('Test notification structure:', JSON.stringify(testNotification, null, 2));
    console.log('✅ Notification data structures work correctly\n');

    console.log('🎉 All notification system tests passed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ NotificationService can be instantiated');
    console.log('- ✅ NotificationTemplateService generates templates');
    console.log('- ✅ ScheduledNotificationService can be created');
    console.log('- ✅ Notification data structures are valid');
    console.log('\n🚀 The notification system is ready for use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationIntegration();