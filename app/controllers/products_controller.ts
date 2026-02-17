import Product from '#models/product'
import { createProductValidator, updateProductValidator } from '#validators/product_validator'
import { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class ProductsController {
  /**
   * List all products from current gym
   * GET /products
   */
  async index({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Listing products: user ${currentUser.id}, gym ${currentUser.gym_id}`)

    // Pagination
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    // Search
    const search = request.input('search')
    const category = request.input('category')
    const published = request.input('published')

    let query = Product.query().where('gym_id', currentUser.gym_id)

    // Search by name or code
    if (search) {
      query = query.where((builder) => {
        builder.whereILike('name', `%${search}%`).orWhereILike('code', `%${search}%`)
      })
    }

    // Filter by category
    if (category) {
      query = query.where('category', category)
    }

    // Filter by published status (only for admins/personals)
    if (published !== undefined && (currentUser.is_admin || currentUser.is_personal)) {
      query = query.where('published', published === 'true' || published === true)
    } else {
      // Regular clients only see published products
      if (!currentUser.is_admin && !currentUser.is_personal) {
        query = query.where('published', true)
      }
    }

    const products = await query.orderBy('name', 'asc').paginate(page, limit)

    return response.ok(products)
  }

  /**
   * Create product (admin or personal only)
   * POST /products
   */
  async store({ auth, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Creating new product: user ${currentUser.id}`)

    // Only admin and personal can create products
    if (!currentUser.is_admin && !currentUser.is_personal) {
      return response.forbidden({ message: 'Only admins and personals can create products' })
    }

    const data = await request.validateUsing(createProductValidator)

    // Check if code is unique in this gym (if provided)
    if (data.code) {
      const existingProduct = await Product.query()
        .where('gym_id', currentUser.gym_id)
        .where('code', data.code)
        .first()

      if (existingProduct) {
        return response.conflict({ message: 'Product code already exists in this gym' })
      }
    }

    const product = await Product.create({
      gym_id: currentUser.gym_id,
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      category: data.category,
      code: data.code,
      published: data.published ?? true,
    })

    logger.info(`Product created successfully: ${product.id}`)

    return response.created(product)
  }

  /**
   * Show single product
   * GET /products/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Fetching product details: product ${params.id}, user ${currentUser.id}`)

    const product = await Product.query()
      .where('id', params.id)
      .where('gym_id', currentUser.gym_id)
      .firstOrFail()

    // Regular clients can only see published products
    if (!currentUser.is_admin && !currentUser.is_personal && !product.published) {
      return response.notFound({ message: 'Product not found' })
    }

    return response.ok(product)
  }

  /**
   * Update product (admin or personal only)
   * PUT/PATCH /products/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Updating product: ${params.id} by user ${currentUser.id}`)

    // Only admin and personal can update products
    if (!currentUser.is_admin && !currentUser.is_personal) {
      return response.forbidden({ message: 'Only admins and personals can update products' })
    }

    const product = await Product.query()
      .where('id', params.id)
      .where('gym_id', currentUser.gym_id)
      .firstOrFail()

    const data = await request.validateUsing(updateProductValidator)

    // Check if code is unique in this gym (if being changed)
    if (data.code && data.code !== product.code) {
      const existingProduct = await Product.query()
        .where('gym_id', currentUser.gym_id)
        .where('code', data.code)
        .first()

      if (existingProduct) {
        return response.conflict({ message: 'Product code already exists in this gym' })
      }
    }

    product.merge({
      name: data.name ?? product.name,
      description: data.description ?? product.description,
      price: data.price ?? product.price,
      stock: data.stock ?? product.stock,
      category: data.category ?? product.category,
      code: data.code ?? product.code,
      published: data.published ?? product.published,
    })

    await product.save()

    return response.ok(product)
  }

  /**
   * Delete product (admin only)
   * DELETE /products/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Deleting product: ${params.id} by user ${currentUser.id}`)

    // Only admin can delete products
    if (!currentUser.is_admin) {
      return response.forbidden({ message: 'Only admins can delete products' })
    }

    const product = await Product.query()
      .where('id', params.id)
      .where('gym_id', currentUser.gym_id)
      .firstOrFail()

    await product.delete()

    logger.info(`Product deleted successfully: ${product.id}`)

    return response.noContent()
  }

  /**
   * Update product stock (admin or personal only)
   * PATCH /products/:id/stock
   */
  async updateStock({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.getUserOrFail()
    logger.info(`Updating product stock: product ${params.id}, user ${currentUser.id}`)

    // Only admin and personal can update stock
    if (!currentUser.is_admin && !currentUser.is_personal) {
      return response.forbidden({ message: 'Only admins and personals can update stock' })
    }

    const product = await Product.query()
      .where('id', params.id)
      .where('gym_id', currentUser.gym_id)
      .firstOrFail()

    const stock = request.input('stock')

    if (typeof stock !== 'number' || stock < 0) {
      return response.badRequest({ message: 'Stock must be a positive number' })
    }

    product.stock = stock
    await product.save()

    logger.info(`Product updated successfully: ${product.id}`)

    return response.ok(product)
  }
}
