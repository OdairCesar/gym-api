/**
 * Interface para serviços de monitoramento de erros
 * Permite trocar facilmente entre diferentes providers (Sentry, Bugsnag, etc.)
 */
export interface ErrorMonitoringService {
  /**
   * Inicializa o serviço de monitoramento
   */
  initialize(): void

  /**
   * Captura uma exceção
   */
  captureException(error: Error, context?: Record<string, any>): void

  /**
   * Captura uma mensagem customizada
   */
  captureMessage(message: string, level?: 'info' | 'warning' | 'error'): void

  /**
   * Define contexto do usuário
   */
  setUser(user: { id: number | string; email?: string; username?: string }): void

  /**
   * Define tags adicionais
   */
  setTags(tags: Record<string, string>): void

  /**
   * Define contexto adicional
   */
  setContext(key: string, context: Record<string, any>): void
}
