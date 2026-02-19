import type { PaymentStrategy } from './payment_strategy.js'
import FreePlanStrategy from './free_plan_strategy.js'
import GooglePayStrategy from './google_pay_strategy.js'
import ApplePayStrategy from './apple_pay_strategy.js'

// Tipos iniciais (v1) - extensível para novos métodos
export type PaymentMethodType = 'google_pay' | 'apple_pay' | 'free'

// Registry de estratégias - permite registrar novos providers dinamicamente
const strategies = new Map<string, () => PaymentStrategy>()

/**
 * Factory para criar instâncias de Payment Strategies
 *
 * Usa o padrão Registry para permitir registro dinâmico de novos providers
 * sem modificar o código existente.
 *
 * Exemplos de uso futuro:
 * PaymentFactory.register('stripe', () => new StripeStrategy())
 * PaymentFactory.register('mercadopago', () => new MercadoPagoStrategy())
 * PaymentFactory.register('pix', () => new PixStrategy())
 */
export class PaymentFactory {
  /**
   * Registra estratégias padrão
   * Deve ser chamado no boot da aplicação
   */
  static initialize() {
    strategies.clear()
    strategies.set('free', () => new FreePlanStrategy())
    strategies.set('google_pay', () => new GooglePayStrategy())
    strategies.set('apple_pay', () => new ApplePayStrategy())
  }

  /**
   * Cria uma instância da estratégia de pagamento
   */
  static create(method: string): PaymentStrategy {
    const factory = strategies.get(method)
    if (!factory) {
      throw new Error(`Payment method not supported: ${method}`)
    }
    return factory()
  }

  /**
   * Registra um novo provider de pagamento
   * Permite adicionar novos métodos sem modificar a factory
   */
  static register(method: string, factory: () => PaymentStrategy) {
    strategies.set(method, factory)
  }

  /**
   * Retorna lista de métodos de pagamento suportados
   */
  static getSupportedMethods(): string[] {
    return Array.from(strategies.keys())
  }

  /**
   * Retorna lista de métodos de pagamento configurados
   * (que têm credenciais definidas)
   */
  static getConfiguredMethods(): string[] {
    const configuredMethods: string[] = []

    for (const [method, factory] of strategies.entries()) {
      try {
        const strategy = factory()
        if (strategy.isConfigured()) {
          configuredMethods.push(method)
        }
      } catch (error) {
        // Ignorar erros de criação de estratégia
        continue
      }
    }

    return configuredMethods
  }
}
