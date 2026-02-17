import type { ErrorMonitoringService } from './error_monitoring_service.js'

/**
 * Implementação null do serviço de monitoramento
 * Usada quando o monitoramento está desabilitado ou em ambiente de testes
 */
export class NullMonitoringService implements ErrorMonitoringService {
  initialize(): void {
    // No-op
  }

  captureException(_error: Error, _context?: Record<string, any>): void {
    // No-op
  }

  captureMessage(_message: string, _level?: 'info' | 'warning' | 'error'): void {
    // No-op
  }

  setUser(_user: { id: number | string; email?: string; username?: string }): void {
    // No-op
  }

  setTags(_tags: Record<string, string>): void {
    // No-op
  }

  setContext(_key: string, _context: Record<string, any>): void {
    // No-op
  }
}
