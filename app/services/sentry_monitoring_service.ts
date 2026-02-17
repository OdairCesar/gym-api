import * as Sentry from '@sentry/node'
import type { ErrorMonitoringService } from './error_monitoring_service.js'
import env from '#start/env'

/**
 * Implementação do serviço de monitoramento usando Sentry
 */
export class SentryMonitoringService implements ErrorMonitoringService {
  private initialized = false

  initialize(): void {
    if (this.initialized) {
      return
    }

    const dsn = env.get('SENTRY_DSN', '')

    // Apenas inicializa se DSN estiver configurado
    if (!dsn) {
      console.warn('Sentry DSN not configured. Error monitoring disabled.')
      return
    }

    Sentry.init({
      dsn,
      environment: env.get('NODE_ENV'),
      tracesSampleRate: env.get('NODE_ENV') === 'production' ? 0.1 : 1.0,

      // Não enviar informações sensíveis
      beforeSend(event) {
        // Remove informações de autenticação dos headers
        if (event.request?.headers) {
          delete event.request.headers['authorization']
          delete event.request.headers['cookie']
        }
        return event
      },
    })

    this.initialized = true
    console.log('Sentry monitoring initialized')
  }

  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) {
      return
    }

    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value)
        })
        Sentry.captureException(error)
      })
    } else {
      Sentry.captureException(error)
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.initialized) {
      return
    }

    Sentry.captureMessage(message, level)
  }

  setUser(user: { id: number | string; email?: string; username?: string }): void {
    if (!this.initialized) {
      return
    }

    Sentry.setUser({
      id: String(user.id),
      email: user.email,
      username: user.username,
    })
  }

  setTags(tags: Record<string, string>): void {
    if (!this.initialized) {
      return
    }

    Sentry.setTags(tags)
  }

  setContext(key: string, context: Record<string, any>): void {
    if (!this.initialized) {
      return
    }

    Sentry.setContext(key, context)
  }
}
