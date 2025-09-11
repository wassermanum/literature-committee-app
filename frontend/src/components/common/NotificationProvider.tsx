import React from 'react';
import { ToastContainer, toast, ToastOptions } from 'react-toastify';
import { useTheme } from '@mui/material/styles';
import 'react-toastify/dist/ReactToastify.css';

interface NotificationProviderProps {
  children: React.ReactNode;
}

// Кастомные стили для уведомлений
const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const theme = useTheme();

  const toastOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    style: {
      fontFamily: theme.typography.fontFamily,
    },
  };

  return (
    <>
      {children}
      <ToastContainer
        {...toastOptions}
        theme={theme.palette.mode === 'dark' ? 'dark' : 'light'}
        toastStyle={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      />
    </>
  );
};

// Утилиты для показа уведомлений
export const showNotification = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, options);
  },
  
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, options);
  },
  
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, options);
  },
  
  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, options);
  },
  
  // Специальные уведомления для бизнес-операций
  orderCreated: (orderNumber: string) => {
    toast.success(`Заказ ${orderNumber} успешно создан`);
  },
  
  orderUpdated: (orderNumber: string) => {
    toast.success(`Заказ ${orderNumber} обновлен`);
  },
  
  orderStatusChanged: (orderNumber: string, status: string) => {
    const statusNames: Record<string, string> = {
      'draft': 'Черновик',
      'pending': 'Ожидает обработки',
      'approved': 'Одобрен',
      'in_assembly': 'В сборке',
      'shipped': 'Отгружен',
      'delivered': 'Доставлен',
      'completed': 'Завершен',
      'rejected': 'Отклонен'
    };
    
    toast.info(`Статус заказа ${orderNumber} изменен на "${statusNames[status] || status}"`);
  },
  
  literatureAdded: (title: string) => {
    toast.success(`Литература "${title}" добавлена в каталог`);
  },
  
  literatureUpdated: (title: string) => {
    toast.success(`Литература "${title}" обновлена`);
  },
  
  userCreated: (name: string) => {
    toast.success(`Пользователь ${name} создан`);
  },
  
  inventoryUpdated: () => {
    toast.success('Остатки на складе обновлены');
  },
  
  reportGenerated: (type: string) => {
    toast.success(`Отчет "${type}" сгенерирован`);
  },
  
  // Предупреждения
  lowInventory: (itemName: string, quantity: number) => {
    toast.warning(`Низкий остаток: ${itemName} (${quantity} шт.)`);
  },
  
  orderLocked: (orderNumber: string) => {
    toast.warning(`Заказ ${orderNumber} заблокирован для редактирования`);
  },
  
  orderUnlocked: (orderNumber: string) => {
    toast.info(`Заказ ${orderNumber} разблокирован для редактирования`);
  }
};

export default NotificationProvider;