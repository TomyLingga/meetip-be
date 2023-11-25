// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database";
import Form from "App/Models/Form";
import Panjar from "App/Models/Panjar";
import PanjarValidator from "App/Validators/PanjarValidator";

export default class PanjarsController {
  public async create({request, response, params}) {
    const trx = await Database.transaction()

    try {
      await request.validate(PanjarValidator)
      const userData = request['decoded']
      const form = await Form.findOrFail(params.id)

      if (form.status != 300) {
        throw new Error('Cannot create panjar if status not equal to 300. Current status : '+ form.status)
      }

      const panjar = await Panjar.query()
                      .where('spdk_id', params.id)
                      .first()

      if (panjar) {
        throw new Error('DP for this spdk already exists')
      }

      const total_panjar =
        parseFloat(request.input('sarapan') || 0) +
        parseFloat(request.input('makan_siang') || 0) +
        parseFloat(request.input('makan_malam') || 0) +
        parseFloat(request.input('saku') || 0) +
        parseFloat(request.input('official') || 0) +
        parseFloat(request.input('dualima') || 0) +
        parseFloat(request.input('seratussatu') || 0) +
        parseFloat(request.input('duaratus') || 0) +
        parseFloat(request.input('hotel') || 0) +
        parseFloat(request.input('laundry') || 0) +
        parseFloat(request.input('transport_dilokasi') || 0) +
        parseFloat(request.input('tiket') || 0) +
        parseFloat(request.input('komunikasi') || 0) +
        parseFloat(request.input('airport') || 0)

      const newPanjar = await Panjar.create({
        user_id: form.user_id,
        spdk_id: form.id,
        kurs_usd: request.input('kurs_usd'),
        sarapan: request.input('sarapan'),
        makan_siang: request.input('makan_siang'),
        makan_malam: request.input('makan_malam'),
        saku: request.input('saku'),
        official: request.input('official'),
        dualima: request.input('dualima'),
        seratussatu: request.input('seratussatu'),
        duaratus: request.input('duaratus'),
        hotel: request.input('hotel'),
        laundry: request.input('laundry'),
        transport_dilokasi: request.input('transport_dilokasi'),
        tiket: request.input('tiket'),
        komunikasi: request.input('komunikasi'),
        airport: request.input('airport'),
        total_panjar: total_panjar,
      })

      newPanjar.useTransaction(trx)
      await newPanjar.save()

      await form.related('log').create({
        user_id: userData.sub,
        spdk_id: form.id,
        action: 'CREATE DP',
        info: '-',
      })

      await trx.commit()

      return response.send({
        success: true,
        data: newPanjar
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

  public async update({request, response, params}){
    const trx = await Database.transaction()

    try {
      await request.validate(PanjarValidator)
      const userData = request['decoded']
      const form = await Form.findOrFail(params.id)
      // const panjar = await Panjar.findOrFail(params.id)

      if (form.status < 300) {
        throw new Error('Cannot edit DP if status below 300. Current status : '+ form.status)
      }

      const total_panjar =
        parseFloat(request.input('sarapan') || 0) +
        parseFloat(request.input('makan_siang') || 0) +
        parseFloat(request.input('makan_malam') || 0) +
        parseFloat(request.input('saku') || 0) +
        parseFloat(request.input('official') || 0) +
        parseFloat(request.input('dualima') || 0) +
        parseFloat(request.input('seratussatu') || 0) +
        parseFloat(request.input('duaratus') || 0) +
        parseFloat(request.input('hotel') || 0) +
        parseFloat(request.input('laundry') || 0) +
        parseFloat(request.input('transport_dilokasi') || 0) +
        parseFloat(request.input('tiket') || 0) +
        parseFloat(request.input('komunikasi') || 0) +
        parseFloat(request.input('airport') || 0)

      await Panjar.query({ client: trx })
              .where('spdk_id', form.id)
              .update({
                kurs_usd: request.input('kurs_usd'),
                sarapan: request.input('sarapan'),
                makan_siang: request.input('makan_siang'),
                makan_malam: request.input('makan_malam'),
                saku: request.input('saku'),
                official: request.input('official'),
                dualima: request.input('dualima'),
                seratussatu: request.input('seratussatu'),
                duaratus: request.input('duaratus'),
                hotel: request.input('hotel'),
                laundry: request.input('laundry'),
                transport_dilokasi: request.input('transport_dilokasi'),
                tiket: request.input('tiket'),
                komunikasi: request.input('komunikasi'),
                airport: request.input('airport'),
                total_panjar: total_panjar,
              })

      // panjar.useTransaction(trx)
      // await panjar.save()

      await form.related('log').create({
        user_id: userData.sub,
        spdk_id: form.id,
        action: 'EDIT DP',
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

  public async submit({response, params, request}){
    const trx = await Database.transaction()

    try {

      const data = await Form.findOrFail(params.id)
      const userData = request['decoded']

      data.merge({
        status: 302,
        info: 'Pengecekan panjar oleh Administrator MeeTrip',
      })

      data.useTransaction(trx)
      await data.save()

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'SUBMIT DP',
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

  public async exportDp({}){}
}
