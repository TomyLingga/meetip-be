// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Form from "App/Models/Form"

export default class FormsAdminController {
  public async index({ response }) {
    try {

      const data = await Form.query()
        .orderBy('created_at', 'desc')
        .preload('bteLuarNegeri')
        .preload('dpLuarNegeri')
        .preload('panjar')
        .preload('destinations')
        .preload('user', (userQuery) => {
          userQuery.preload('div')
          userQuery.preload('dept')
        })
        .preload('pemberiTugas', (userQuery) => {
          userQuery.preload('div')
          userQuery.preload('dept')
        })
        .preload('atasan', (userQuery) => {
          userQuery.preload('div')
          userQuery.preload('dept')
        })
        .preload('log', (logQuery) => {
          logQuery.orderBy('created_at', 'asc')
        })

      return response.send({
        success: true,
        data: data,
      }, 200)
    } catch (error) {
      return response.send({
        success: false,
        msg: error.message,
      }, 403)
    }
  }

}
