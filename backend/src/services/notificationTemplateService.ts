import { 
  OrderNotificationData, 
  InventoryNotificationData, 
  ReminderNotificationData 
} from '../types/notification.js';
import { emailTemplateConfig } from '../config/email.js';

export class NotificationTemplateService {
  
  // Order created templates
  getOrderCreatedSubject(data: OrderNotificationData): string {
    return `Новый заказ #${data.orderNumber} от ${data.fromOrganization}`;
  }

  getOrderCreatedText(data: OrderNotificationData): string {
    const itemsList = data.items?.map(item => 
      `- ${item.title}: ${item.quantity} шт. по ${item.unitPrice} руб.`
    ).join('\n') || '';

    return `
Уважаемые коллеги!

Получен новый заказ литературы:

Номер заказа: ${data.orderNumber}
От: ${data.fromOrganization}
Для: ${data.toOrganization}
Дата создания: ${data.createdAt.toLocaleDateString('ru-RU')}
Общая сумма: ${data.totalAmount} руб.

Позиции заказа:
${itemsList}

${data.notes ? `Примечания: ${data.notes}` : ''}

Пожалуйста, обработайте заказ в системе управления литературой.

С уважением,
Система управления литературой
    `.trim();
  }

  getOrderCreatedHtml(data: OrderNotificationData): string {
    const itemsList = data.items?.map(item => 
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice} руб.</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity * item.unitPrice} руб.</td>
      </tr>`
    ).join('') || '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Новый заказ литературы</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c5aa0;">Новый заказ литературы</h2>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Детали заказа</h3>
      <p><strong>Номер заказа:</strong> ${data.orderNumber}</p>
      <p><strong>От:</strong> ${data.fromOrganization}</p>
      <p><strong>Для:</strong> ${data.toOrganization}</p>
      <p><strong>Дата создания:</strong> ${data.createdAt.toLocaleDateString('ru-RU')}</p>
      <p><strong>Общая сумма:</strong> ${data.totalAmount} руб.</p>
    </div>

    ${data.items && data.items.length > 0 ? `
    <h3>Позиции заказа</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <thead>
        <tr style="background: #e9ecef;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Литература</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Количество</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Цена</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Сумма</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
    </table>
    ` : ''}

    ${data.notes ? `
    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h4 style="margin-top: 0;">Примечания</h4>
      <p>${data.notes}</p>
    </div>
    ` : ''}

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
      <p>Пожалуйста, обработайте заказ в системе управления литературой.</p>
      <p><a href="${emailTemplateConfig.baseUrl}" style="color: #2c5aa0;">Перейти в систему</a></p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  // Order status changed templates
  getOrderStatusChangedSubject(data: OrderNotificationData): string {
    return `Изменение статуса заказа #${data.orderNumber}: ${this.getStatusDisplayName(data.status!)}`;
  }

  getOrderStatusChangedText(data: OrderNotificationData): string {
    return `
Уважаемые коллеги!

Статус заказа литературы изменен:

Номер заказа: ${data.orderNumber}
От: ${data.fromOrganization}
Для: ${data.toOrganization}
Предыдущий статус: ${this.getStatusDisplayName(data.previousStatus!)}
Новый статус: ${this.getStatusDisplayName(data.status!)}
Дата изменения: ${data.updatedAt?.toLocaleDateString('ru-RU')}
Общая сумма: ${data.totalAmount} руб.

${data.notes ? `Примечания: ${data.notes}` : ''}

Проверьте детали заказа в системе управления литературой.

С уважением,
Система управления литературой
    `.trim();
  }

  getOrderStatusChangedHtml(data: OrderNotificationData): string {
    const statusColor = this.getStatusColor(data.status!);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Изменение статуса заказа</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c5aa0;">Изменение статуса заказа</h2>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Детали заказа</h3>
      <p><strong>Номер заказа:</strong> ${data.orderNumber}</p>
      <p><strong>От:</strong> ${data.fromOrganization}</p>
      <p><strong>Для:</strong> ${data.toOrganization}</p>
      <p><strong>Дата изменения:</strong> ${data.updatedAt?.toLocaleDateString('ru-RU')}</p>
      <p><strong>Общая сумма:</strong> ${data.totalAmount} руб.</p>
    </div>

    <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2c5aa0;">
      <h3 style="margin-top: 0;">Изменение статуса</h3>
      <p><strong>Предыдущий статус:</strong> ${this.getStatusDisplayName(data.previousStatus!)}</p>
      <p><strong>Новый статус:</strong> <span style="color: ${statusColor}; font-weight: bold;">${this.getStatusDisplayName(data.status!)}</span></p>
    </div>

    ${data.notes ? `
    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h4 style="margin-top: 0;">Примечания</h4>
      <p>${data.notes}</p>
    </div>
    ` : ''}

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
      <p>Проверьте детали заказа в системе управления литературой.</p>
      <p><a href="${emailTemplateConfig.baseUrl}" style="color: #2c5aa0;">Перейти в систему</a></p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  // Low inventory templates
  getLowInventorySubject(data: InventoryNotificationData): string {
    return `Низкие остатки: ${data.literatureTitle} в ${data.organizationName}`;
  }

  getLowInventoryText(data: InventoryNotificationData): string {
    return `
Внимание! Низкие остатки литературы!

Литература: ${data.literatureTitle}
Организация: ${data.organizationName}
Категория: ${data.category}
Текущий остаток: ${data.currentQuantity} шт.
Минимальный порог: ${data.threshold} шт.
Последнее обновление: ${data.lastUpdated.toLocaleDateString('ru-RU')}

Рекомендуется пополнить запасы литературы.

С уважением,
Система управления литературой
    `.trim();
  }

  getLowInventoryHtml(data: InventoryNotificationData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Низкие остатки литературы</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc3545;">⚠️ Низкие остатки литературы</h2>
    
    <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
      <h3 style="margin-top: 0; color: #721c24;">Требуется внимание</h3>
      <p><strong>Литература:</strong> ${data.literatureTitle}</p>
      <p><strong>Организация:</strong> ${data.organizationName}</p>
      <p><strong>Категория:</strong> ${data.category}</p>
      <p><strong>Текущий остаток:</strong> <span style="color: #dc3545; font-weight: bold;">${data.currentQuantity} шт.</span></p>
      <p><strong>Минимальный порог:</strong> ${data.threshold} шт.</p>
      <p><strong>Последнее обновление:</strong> ${data.lastUpdated.toLocaleDateString('ru-RU')}</p>
    </div>

    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h4 style="margin-top: 0;">Рекомендация</h4>
      <p>Рекомендуется пополнить запасы данной литературы для обеспечения непрерывности поставок.</p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
      <p><a href="${emailTemplateConfig.baseUrl}" style="color: #2c5aa0;">Перейти в систему управления</a></p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  // Order reminder templates
  getOrderReminderSubject(data: ReminderNotificationData): string {
    return `Напоминание о заказе #${data.orderNumber} (${data.daysSinceCreated} дней)`;
  }

  getOrderReminderText(data: ReminderNotificationData): string {
    return `
Напоминание о заказе литературы!

Номер заказа: ${data.orderNumber}
От: ${data.fromOrganization}
Для: ${data.toOrganization}
Текущий статус: ${this.getStatusDisplayName(data.status)}
Дней с момента создания: ${data.daysSinceCreated}
${data.daysUntilDeadline ? `Дней до крайнего срока: ${data.daysUntilDeadline}` : ''}
Общая сумма: ${data.totalAmount} руб.

Пожалуйста, проверьте статус заказа и примите необходимые меры.

С уважением,
Система управления литературой
    `.trim();
  }

  getOrderReminderHtml(data: ReminderNotificationData): string {
    const urgencyColor = data.daysUntilDeadline && data.daysUntilDeadline <= 3 ? '#dc3545' : '#ffc107';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Напоминание о заказе</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: ${urgencyColor};">⏰ Напоминание о заказе</h2>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
      <h3 style="margin-top: 0;">Детали заказа</h3>
      <p><strong>Номер заказа:</strong> ${data.orderNumber}</p>
      <p><strong>От:</strong> ${data.fromOrganization}</p>
      <p><strong>Для:</strong> ${data.toOrganization}</p>
      <p><strong>Текущий статус:</strong> ${this.getStatusDisplayName(data.status)}</p>
      <p><strong>Дней с момента создания:</strong> ${data.daysSinceCreated}</p>
      ${data.daysUntilDeadline ? `<p><strong>Дней до крайнего срока:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${data.daysUntilDeadline}</span></p>` : ''}
      <p><strong>Общая сумма:</strong> ${data.totalAmount} руб.</p>
    </div>

    <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2c5aa0;">
      <h4 style="margin-top: 0;">Действие требуется</h4>
      <p>Пожалуйста, проверьте статус заказа и примите необходимые меры для его обработки.</p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
      <p><a href="${emailTemplateConfig.baseUrl}" style="color: #2c5aa0;">Перейти к заказу</a></p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  // Helper methods
  private getStatusDisplayName(status: string): string {
    const statusNames: Record<string, string> = {
      'DRAFT': 'Черновик',
      'PENDING': 'Ожидает обработки',
      'APPROVED': 'Одобрен',
      'IN_ASSEMBLY': 'В сборке',
      'SHIPPED': 'Отгружен',
      'DELIVERED': 'Доставлен',
      'COMPLETED': 'Завершен',
      'REJECTED': 'Отклонен'
    };
    return statusNames[status] || status;
  }

  private getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'DRAFT': '#6c757d',
      'PENDING': '#ffc107',
      'APPROVED': '#17a2b8',
      'IN_ASSEMBLY': '#fd7e14',
      'SHIPPED': '#20c997',
      'DELIVERED': '#28a745',
      'COMPLETED': '#28a745',
      'REJECTED': '#dc3545'
    };
    return statusColors[status] || '#6c757d';
  }
}