// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database";
import Form from "App/Models/Form"
import FormCancelValidator from "App/Validators/FormCancelValidator";

export default class HcBtosController {

  public async approveBto({ response, params, request }) {
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
        status: 3,
        info: 'Proses pembuatan Surat Jalan oleh Administrator',
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
