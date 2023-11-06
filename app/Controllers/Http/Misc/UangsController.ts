// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database"
import Uang from "App/Models/Uang"
import UangValidator  from 'App/Validators/UangValidator'

export default class UangsController {
  public async index({response}) {
      const data = await Uang.query().orderBy('jabatan', 'asc')

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
      const data = await Uang.findOrFail(params.id)
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

  public async showByJabatanWilayah({response, params}) {
    try {
      const data = await Uang.query()
                            .where('wilayah', params.wilayah)
                            .andWhere('jabatan', params.jabatan)
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
      await request.validate(UangValidator)

      const data = await Uang.findOrFail(params.id)

      data.pagi = request.input('pagi')
      data.siang = request.input('siang')
      data.malam = request.input('malam')
      data.makan_dollar = 0
      data.hotel = request.input('hotel')
      data.laundry = request.input('laundry')
      data.pp = request.input('pp')
      data.transport_lokal = request.input('transport_lokal')
      data.tiket = request.input('tiket')
      data.saku = request.input('saku')
      data.komunikasi = request.input('komunikasi')
      data.airport = request.input('airport')
      data.official = request.input('official')
      data.dualima = request.input('dualima')
      data.seratus = request.input('seratus')
      data.duaratus = request.input('duaratus')

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
}

