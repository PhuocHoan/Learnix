import { api } from '@/lib/api';

export interface CreateCheckoutSessionDto {
  courseId: string;
}

export interface ProcessPaymentDto {
  paymentId: string;
  cardDetails: {
    cardNumber: string;
    expiryDate: string;
    cvc: string;
    cardHolderName: string;
  };
}

export interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  courseId: string;
  createdAt: string;
}

export const paymentApi = {
  createCheckoutSession: async (dto: CreateCheckoutSessionDto) => {
    const response = await api.post<Payment>('/payments/checkout', dto);
    return response.data;
  },

  processPayment: async (dto: ProcessPaymentDto) => {
    const response = await api.post<{ success: boolean; payment: Payment }>(
      '/payments/process',
      dto,
    );
    return response.data;
  },

  getUserPayments: async () => {
    const response = await api.get<Payment[]>('/payments/history');
    return response.data;
  },
};
