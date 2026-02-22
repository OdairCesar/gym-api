import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default class SwaggerController {
  /**
   * Serve Landing Page
   */
  async index({ response }: HttpContext) {
    try {
      const htmlPath = join(app.publicPath(), 'index.html')
      const htmlContent = await readFile(htmlPath, 'utf-8')
      return response.header('Content-Type', 'text/html').send(htmlContent)
    } catch (error) {
      return response.status(404).json({ message: 'Index not found' })
    }
  }

  /**
   * Serve Swagger UI HTML
   */
  async ui({ response }: HttpContext) {
    try {
      const htmlPath = join(app.publicPath(), 'swagger.html')
      const htmlContent = await readFile(htmlPath, 'utf-8')
      return response.header('Content-Type', 'text/html').send(htmlContent)
    } catch (error) {
      return response.status(404).json({ message: 'Swagger UI not found' })
    }
  }

  /**
   * Serve Privacy Policy page
   */
  async privacy({ response }: HttpContext) {
    try {
      const htmlPath = join(app.publicPath(), 'privacy.html')
      const htmlContent = await readFile(htmlPath, 'utf-8')
      return response.header('Content-Type', 'text/html').send(htmlContent)
    } catch (error) {
      return response.status(404).json({ message: 'Privacy policy not found' })
    }
  }

  /**
   * Serve Terms of Use page
   */
  async terms({ response }: HttpContext) {
    try {
      const htmlPath = join(app.publicPath(), 'terms.html')
      const htmlContent = await readFile(htmlPath, 'utf-8')
      return response.header('Content-Type', 'text/html').send(htmlContent)
    } catch (error) {
      return response.status(404).json({ message: 'Terms of use not found' })
    }
  }

  /**
   * Serve Swagger JSON specification
   */
  async json({ response }: HttpContext) {
    try {
      const swaggerPath = join(app.publicPath(), 'swagger.json')
      const swaggerContent = await readFile(swaggerPath, 'utf-8')
      return response.json(JSON.parse(swaggerContent))
    } catch (error) {
      return response.status(404).json({ message: 'Swagger specification not found' })
    }
  }
}
