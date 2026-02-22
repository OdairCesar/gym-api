import type { Payment, PaymentResult, RefundResult } from '../interfaces/payment.js'

export default class FreePlanStrategy implements Payment {
  readonly name = 'free'
  readonly providerType = 'free' as const

  async processPayment(
    amount: number,
    currency: string,
    _paymentData: any
  ): Promise<PaymentResult> {
    // Plano free não processa pagamento
    return {
      success: true,
      transactionId: `free_${Date.now()}`,
      provider: 'free',
      metadata: {
        amount,
        currency,
        note: 'Free plan - no payment processed',
      },
    }
  }

  async validatePaymentData(_paymentData: any): Promise<boolean> {
    // Free plan não requer dados de pagamento
    return true
  }

  async refund(_transactionId: string, _amount?: number): Promise<RefundResult> {
    // Free plan não tem o que reembolsar
    return {
      success: true,
      refundId: null,
    }
  }

  supportsRecurring(): boolean {
    return true // Não cobra nada mesmo
  }

  isConfigured(): boolean {
    return true // Sempre disponível
  }
}
