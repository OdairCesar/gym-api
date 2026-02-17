import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errorMonitoring } from '#services/error_monitoring_factory'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    // Envia erro para o serviço de monitoramento (Sentry, etc.)
    if (error instanceof Error) {
      // Define informações do usuário se estiver autenticado
      if (ctx.auth && ctx.auth.user) {
        errorMonitoring.setUser({
          id: ctx.auth.user.id,
          email: ctx.auth.user.email,
          username: ctx.auth.user.name,
        })
      }

      // Define contexto adicional
      errorMonitoring.setContext('request', {
        method: ctx.request.method(),
        url: ctx.request.url(true),
        ip: ctx.request.ip(),
        userAgent: ctx.request.header('user-agent'),
      })

      // Define tags
      errorMonitoring.setTags({
        environment: app.nodeEnvironment,
        method: ctx.request.method(),
      })

      // Captura a exceção
      errorMonitoring.captureException(error)
    }

    return super.report(error, ctx)
  }
}
