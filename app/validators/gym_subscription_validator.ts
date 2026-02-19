import vine from '@vinejs/vine'
import { PLAN_SLUGS } from '#types/subscription_types'

/**
 * Validator para criar ou atualizar uma subscription
 */
export const createSubscriptionValidator = vine.compile(
  vine.object({
    plan_slug: vine.enum([PLAN_SLUGS.INITIAL, PLAN_SLUGS.INTERMEDIATE, PLAN_SLUGS.UNLIMITED]),
    payment_method: vine.string().minLength(2).maxLength(50),
    payment_data: vine.any().optional(),
  })
)
