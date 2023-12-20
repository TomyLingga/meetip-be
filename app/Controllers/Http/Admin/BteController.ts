// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database";
import Form from "App/Models/Form";
import FormCancelValidator from "App/Validators/FormCancelValidator";

export default class BteController {
  public async approveBte({ response, params, request }) {
    const trx = await Database.transaction();

    try {
      const data = await Form.findOrFail(params.id)

      const userData = request['decoded'];

      if (data.status != 9) {
        throw new Error('Cant approve if status not 9, current status '+data.status)
      }

      data.merge({
        status: 11,
        info: 'Menunggu Pencairan',
      });

      await data.save();

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'APPROVE BTE',
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

  public async revisiBte({response, request, params}){
    const trx = await Database.transaction()

    try {
      await request.validate(FormCancelValidator)

      const data = await Form.findOrFail(params.id)

      const userData = request['decoded']

      if (data.status != 9) {
        throw new Error('Cant revision if status not 9, current status '+data.status)
      }

      data.merge({
        status: 10,
        info: 'Revisi',
        note: request.input('keterangan'),
      })

      data.useTransaction(trx)
      await data.save()

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'REVISION SPDK',
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

  public async cairBte({ response, params, request }) {
    const trx = await Database.transaction();

    try {
      const data = await Form.findOrFail(params.id);
      const userData = request['decoded'];

      if (data.status != 11) {
        throw new Error('Cant approve if status not 11, current status ' + data.status);
      }

      function formatAMPM(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours %= 12;
        hours = hours || 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        const strTime = `${hours}:${minutes} ${ampm}`;
        return strTime;
      }

      function monthNames(month) {
        const months = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[month];
      }

      const cairkanDate = new Date();

      const formattedDate = `${cairkanDate.getDate()} ${monthNames(cairkanDate.getMonth())} ${cairkanDate.getFullYear()}, ${formatAMPM(cairkanDate)}`;

      data.merge({
        status: 12,
        info: `Sudah dicairkan pada tanggal ${formattedDate}`,
      });

      await data.save();

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'PAY BTE',
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
}
