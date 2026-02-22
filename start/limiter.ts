/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from '@adonisjs/limiter/services/main'

/**
 * Global throttle - Rate limiting geral para toda a API
 * 60 requisições por minuto por IP
 */
export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(60).every('1 minute')
})

/**
 * Auth throttle - Rate limiting para endpoints de autenticação
 * 5 tentativas por minuto para prevenir brute force
 */
export const authThrottle = limiter.define('auth', () => {
  return limiter.allowRequests(30).every('1 minute')
})

/**
 * API throttle - Rate limiting para endpoints da API autenticados
 * 100 requisições por minuto por usuário
 */
export const apiThrottle = limiter.define('api', (ctx) => {
  if (ctx.auth.user) {
    return limiter.allowRequests(100).every('1 minute').usingKey(`user_${ctx.auth.user.id}`)
  }
  return limiter.allowRequests(60).every('1 minute')
})

/**
 * Public throttle - Rate limiting para endpoints públicos
 * 30 requisições por minuto
 */
export const publicThrottle = limiter.define('public', () => {
  return limiter.allowRequests(30).every('1 minute')
})
