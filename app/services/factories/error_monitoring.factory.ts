import type { ErrorMonitoring } from '../interfaces/error_monitoring.js'
import { SentryMonitoringService } from '../sentry_monitoring.service.js'
import { NullMonitoringService } from '../null_monitoring.service.js'
import env from '#start/env'

/**
 * Factory para criar o serviço de monitoramento apropriado
 * Permite trocar facilmente entre diferentes implementações
 */
class ErrorMonitoringFactory {
  private static instance: ErrorMonitoring | null = null

  static getInstance(): ErrorMonitoring {
    if (!this.instance) {
      this.instance = this.createService()
      this.instance.initialize()
    }
    return this.instance
  }

  private static createService(): ErrorMonitoring {
    const provider = env.get('ERROR_MONITORING_PROVIDER', 'none')

    switch (provider) {
      case 'sentry':
        return new SentryMonitoringService()
      case 'none':
      default:
        return new NullMonitoringService()
    }
  }

  /**
   * Reseta a instância (útil para testes)
   */
  static reset(): void {
    this.instance = null
  }
}

// Exporta uma instância singleton
export const errorMonitoring = ErrorMonitoringFactory.getInstance()
