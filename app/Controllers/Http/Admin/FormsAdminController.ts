// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Mail from "@ioc:Adonis/Addons/Mail"
import Database from "@ioc:Adonis/Lucid/Database"
import Form from "App/Models/Form"
import FormCancelValidator from "App/Validators/FormCancelValidator"
import Env from '@ioc:Adonis/Core/Env'

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
    const trx = await Database.transaction()

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
        .firstOrFail()

      const userData = request['decoded']

      data.merge({
        status: 1,
        info: 'Menunggu persetujuan dari ' + data.pemberiTugas.name,
      })

      await data.save()

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'APPROVE DP',
        info: '-',
      })

      await trx.commit()

      return response.send({
        success: true,
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

  public async createSurat({ response, params, request }) {
    const trx = await Database.transaction()

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
        .firstOrFail()

      const userData = request['decoded']

      data.merge({
        kendaraan: request.input('kendaraan'),
        no_kendaraan: request.input('no_kendaraan'),
        nama_supir: request.input('nama_supir'),
        status: 4,
        info: 'Cek terlebih dahulu sebelum mengirim',
      })

      await data.save()

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'CREATE SPDK',
        info: '-',
      })

      await trx.commit()

      return response.send({
        success: true,
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

  public async submitSurat({ response, params, request }) {
    const trx = await Database.transaction()

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
        .firstOrFail()

      const userData = request['decoded']
      let status, info

      if (data.atasan_id == data.teruskan) {
        status = 6
        info = "Silahkan Cetak"
      } else {
        status = 5
        info = "Menunggu Persetujuan dari " + data.atasan.name

        await Mail.sendLater((message) =>{
          message
          .from(Env.get('SMTP_USERNAME'))
          .to(data.atasan.email)
          .subject('Meetrip Notification')
          .priority('high')
          .htmlView('emails/approve_bto', {
            username: userData.name,
            userHP: userData.no_hp,
            userPosition: userData.jabatan,
            pemberiTugas: data.atasan.name,
            tgl_berangkat: request.input('tgl_berangkat'),
            tgl_kembali: request.input('tgl_kembali'),
            url: Env.get('URL_FE_PORTAL'),
          })
        })
      }

      data.merge({
        status: 1,
        info: 'Menunggu persetujuan dari ' + data.pemberiTugas.name,
      })

      await data.save()

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'SUBMIT SPDK',
        info: '-',
      })

      await trx.commit()

      return response.send({
        success: true,
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
