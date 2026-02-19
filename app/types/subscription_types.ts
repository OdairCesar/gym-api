/**
 * Constantes relacionadas a planos e subscriptions
 */
export const PLAN_SLUGS = {
  INITIAL: 'initial',
  INTERMEDIATE: 'intermediate',
  UNLIMITED: 'unlimited',
} as const

export type PlanSlug = (typeof PLAN_SLUGS)[keyof typeof PLAN_SLUGS]

/**
 * Status possíveis de uma subscription
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  PAST_DUE: 'past_due',
} as const

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS]

/**
 * Métodos de pagamento base
 */
export const PAYMENT_METHODS = {
  FREE: 'free',
  GOOGLE_PAY: 'google_pay',
  APPLE_PAY: 'apple_pay',
} as const
