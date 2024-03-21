// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database"
import BomUser from "App/Models/BomUser"

export default class BomsController {
  public async index({response}) {
    const data = await BomUser.query().orderBy('bom', 'asc')

    if (data.length === 0) {
      return response.status(404).send({
        success: false,
        message: 'No data found.',
      })
    }

    return response.send({
      success: true,
      data
    }, 200)
  }

  public async show({response, params}) {
    try {
      const data = await BomUser.findOrFail(params.id)
      return response.send({
        success: true,
        data
      }, 200)
    } catch (error) {
      return response.send({
        success: false,
        msg: error.message
      }, 403)
    }
  }

  public async showByUser({response, params}) {
    try {
      const data = await BomUser.query()
                              .where('user_id', params.user_id)
                              .first()
      return response.send({
        success: true,
        data
      }, 200)
    } catch (error) {
      return response.send({
        success: false,
        msg: error.message
      }, 403)
    }
  }

  public async update({ response, request, params }) {
    const trx = await Database.transaction()

    try {

      const data = await BomUser.findOrFail(params.id)

      data.bom = request.input('bom')
      const newData = await data.save()

      await trx.commit()

      return response.send({
        success: true,
        data: newData
      }, 200)
    } catch (error) {
      await trx.rollback()

      const mistake = error.messages ? error.messages : error.message

      return response.status(500).json({
          success: false,
          errors: mistake,
      })
    }
  }

  public async create({ response, request }) {
    const trx = await Database.transaction()

    try {
      const report = await BomUser.query()
                      .where('user_id', request.input('bom'))
                      .first()

      if (report) {
        throw new Error('Bom for this users already exists')
      }

      const newReport = await BomUser.create({
        user_id: request.input('user_id'),
        bom: request.input('bom')
      })

      newReport.useTransaction(trx)
      await newReport.save()

      await trx.commit()

      return response.send({
        success: true,
        data: newReport
      }, 200)

    } catch (error) {
      await trx.rollback()
      const mistake = error.messages ? error.messages : error.message

      return response.status(500).json({
        success: false,
        errors: mistake,
        stack: error.stack,
      })
    }
  }
}
