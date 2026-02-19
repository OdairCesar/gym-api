export interface PaymentResult {
  success: boolean
  transactionId: string | null
  provider: string
  metadata?: Record<string, any>
  errorMessage?: string
}

export interface RefundResult {
  success: boolean
  refundId: string | null
  errorMessage?: string
}

export interface PaymentStrategy {
  readonly name: string
  readonly providerType: 'wallet' | 'gateway' | 'pix' | 'free'
  processPayment(amount: number, currency: string, paymentData: any): Promise<PaymentResult>
  validatePaymentData(paymentData: any): Promise<boolean>
  refund(transactionId: string, amount?: number): Promise<RefundResult>
  supportsRecurring(): boolean
  isConfigured(): boolean
}
