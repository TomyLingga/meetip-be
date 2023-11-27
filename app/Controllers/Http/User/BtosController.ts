// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database"
import Form from "App/Models/Form"
import FormCancelValidator from "App/Validators/FormCancelValidator"

export default class BtosController {
  // pemberi tugas
  public async indexPemberiTugas({response, request}){
    const userData = request['decoded']
    try {
      const data = await Form.query()
        .where('atasan_id', userData.sub)
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

      if (data.length === 0) {
        throw new Error('No data found');
      }
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

  public async approveBto({ response, params, request }) {
    const trx = await Database.transaction();

    try {
      const data = await Form.query()
        .where('id', params.id)
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
        .firstOrFail();

      const userData = request['decoded'];

      if (data.status != 1) {
        throw new Error('Cant approve if status not 1, current status '+data.status)
      }

      if (userData.sub != data.atasan_id) {
        throw new Error('Not the assignor')
      }

      data.merge({
        status: 2,
        info: 'Menunggu persetujuan dari Departemen HC',
      });

      await data.save();

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'APPROVE BTO',
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

  public async declineBto({response, request, params}){
    const trx = await Database.transaction()

    try {
      await request.validate(FormCancelValidator)

      const data = await Form.findOrFail(params.id)

      const userData = request['decoded']

      if (userData.sub != data.atasan_id) {
        throw new Error('Not the assignor')
      }

      if (data.status != 1) {
        throw new Error('Cant decline if status not 1, current status '+data.status)
      }

      let status = 0
      let info = "Ditolak oleh " + userData.name + ", Tidak ada Panjar"

      if (data.uang_panjar > 0) {
        status = 100
        info = "Ditolak oleh " + userData.name + ", Panjar belum dikembalikan"
      }

      data.merge({
        status: status,
        info: info,
        note: request.input('keterangan'),
      })

      data.useTransaction(trx)
      await data.save()

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'DECLINE BTO',
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
