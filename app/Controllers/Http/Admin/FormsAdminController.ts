// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database"
import Form from "App/Models/Form"
import FormCancelValidator from "App/Validators/FormCancelValidator"

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

  public async approvePanjar({ response, params, request }) {
    const trx = await Database.transaction();

    try {
      const data = await Form.query()
        .where('id', params.id)
        .preload('pemberiTugas', (userQuery) => {
          userQuery.preload('div');
          userQuery.preload('dept');
        })
        .firstOrFail();

      const userData = request['decoded'];

      data.merge({
        status: 1,
        info: 'Menunggu persetujuan dari ' + data.pemberiTugas.name,
      });

      await data.save();

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'APPROVE DP',
        info: '-',
      });

      await trx.commit();

      return response.send({
        success: true,
      }, 200);
    } catch (error) {
      await trx.rollback();
      const mistake = error.messages ? error.messages : error.message;

      return response.status(500).json({
        success: false,
        errors: mistake,
        stack: error.stack,
      });
    }
  }

  public async revisiPanjar({response, request, params}){
    const trx = await Database.transaction()

    try {
      await request.validate(FormCancelValidator)

      const data = await Form.findOrFail(params.id)

      const userData = request['decoded']

      data.merge({
        status: 303,
        info: "Revisi Panjar",
        note: request.input('keterangan'),
      })

      data.useTransaction(trx)
      await data.save()

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'REVISION DP',
        info: request.input('keterangan'),
      })

      await trx.commit()

      return response.send({
        success: true,
        data: data
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
