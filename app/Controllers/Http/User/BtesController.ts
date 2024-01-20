// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database"
import Destination from "App/Models/Destination"
import Form from "App/Models/Form"
import Report from "App/Models/Report"
import Env from '@ioc:Adonis/Core/Env'
import axios from "axios"
import BteValidator from "App/Validators/BteValidator"
import BteLuarNegeri from "App/Models/BteLuarNegeri"

export default class BtesController {
  public async addReport({ response, params, request }) {
    const trx = await Database.transaction()

    try {
      const data = await Form.query()
        .where('id', params.id)
        .preload('user', (userQuery) => {
          userQuery.preload('div')
          userQuery.preload('dept')
        })
        .firstOrFail()

      const userData = request['decoded']

      if (data.user.id != userData.sub) {
        throw new Error('SPDK not belongs to User')
      }

      const report = await Report.query()
                      .where('forms_id', params.id)
                      .first()

      if (report) {
        throw new Error('Report for this spdk already exists')
      }

      const reportFile = request.file('report')

      if (reportFile.state != 'consumed') {
        throw new Error('No file uploaded')
      }

      const fileName = `${new Date().getTime()}_${reportFile.clientName}`
      await reportFile.move("./public/uploads/reports", { name: fileName })

      if (reportFile.state != 'moved') {
        return reportFile.error()
      }

      const newReport = await Report.create({
        forms_id: data.id,
        laporan: fileName
      })

      newReport.useTransaction(trx)
      await newReport.save()

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'ADD REPORT',
        info: '-',
      })

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

  public async updateReport({ response, params, request }) {
    const trx = await Database.transaction()

    try {
      const data = await Form.query()
        .where('id', params.id)
        .preload('user', (userQuery) => {
          userQuery.preload('div')
          userQuery.preload('dept')
        })
        .firstOrFail()

      const userData = request['decoded']

      if (data.user.id != userData.sub) {
        throw new Error('SPDK not belongs to User')
      }

      const reportFile = request.file('report')

      if (reportFile.state != 'consumed') {
        throw new Error('No file uploaded')
      }

      const fileName = `${new Date().getTime()}_${reportFile.clientName}`
      await reportFile.move("./public/uploads/reports", { name: fileName })

      if (reportFile.state != 'moved') {
        return reportFile.error()
      }

      await Report.query({ client: trx })
              .where('forms_id', data.id)
              .update({
                laporan: fileName
              })

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'EDIT REPORT',
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

  public async attendDestination({ response, params, request }) {
    const trx = await Database.transaction()

    try {

      const tujuan = await Destination.findOrFail(params.id)

      const data = await Form.query()
        .where('id', tujuan.forms_id)
        .preload('user', (userQuery) => {
          userQuery.preload('div')
          userQuery.preload('dept')
        })
        .firstOrFail()

      const userData = request['decoded']

      if (data.user_id != userData.sub) {
        throw new Error('This SPDK does not belong to the logged-in user.')
      }

      if (tujuan.attend != false) {
        throw new Error('Stampped Already')
      }

      const apiKey = Env.get('MAP_API_KEY')

      const origin = `${request.input('current_latitude')},${request.input('current_longitude')}`
      const destination = `${tujuan.latitude},${tujuan.longitude}`
      const distanceMatrixResponse = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: origin,
          destinations: destination,
          key: apiKey,
        },
      })

      const distanceValue = distanceMatrixResponse.data.rows[0].elements[0].distance.value

      if (distanceValue <= 500) {
        tujuan.attend = true;
        await tujuan.save();

        await data.related('log').create({
          user_id: userData.sub,
          spdk_id: data.id,
          action: 'SUCCESS TO ATTEND',
          info: `Distance: ${distanceValue} meters`,
        })

        const otherDestinations = await Destination.query()
          .where('forms_id', tujuan.forms_id)
          // .andWhere('id', '<>', tujuan.id)
          .andWhere('attend', false)
          .first()

          // console.log(otherDestinations)

        if (otherDestinations === null) {
          // console.log('No other unattended destinations found')
          data.status = 7
          data.info = 'Silahkan isi BTE',
          await data.save()
        }

        await trx.commit()

        return response.send({
          success: true,
        }, 200)

      } else {

        await data.related('log').create({
          user_id: userData.sub,
          spdk_id: data.id,
          action: 'FAILED TO ATTEND',
          info: `Distance is greater than 500 meters. Distance: ${distanceValue} meters`,
        })

        await trx.commit()

        return response.status(400).json({
          error: 'Cannot attend when the distance is greater than 100 meters.',
          currentDistance: distanceValue,
        });
      }

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

  public async createBte({ request, response, params }) {
    const trx = await Database.transaction();

    try {
      await request.validate(BteValidator);
      const userData = request['decoded'];
      const form = await Form.findOrFail(params.id);

      if (form.status != 7) {
        throw new Error('Cannot create BTE if status not equal to 7. Current status: ' + form.status);
      }

      if (form.wilayah == '3') {
        const bte = await BteLuarNegeri.query()
          .where('spdk_id', params.id)
          .first();

        if (bte) {
          throw new Error('BTE Luar Negeri for this spdk already exists');
        }
      }

      let totalLain = 0;

      const lainArray = request.input('lain');
      const nilaiLainArray = request.input('nilai_lain');

      const lainData = lainArray.map((datalain, index) => ({
        datalain,
        nilailain: parseFloat(nilaiLainArray[index]) || 0,
      }));

      const lainJson = JSON.stringify(lainData);

      for (let i = 0; i < nilaiLainArray.length; i++) {
        const nilaiLain = parseFloat(nilaiLainArray[i]) || 0;
        totalLain += nilaiLain;
      }

      const total_bte =
        parseFloat(request.input('sarapan') || 0) +
        parseFloat(request.input('makan_siang') || 0) +
        parseFloat(request.input('makan_malam') || 0) +
        parseFloat(request.input('uang_saku') || 0) +
        parseFloat(request.input('uang_pp') || 0) +
        parseFloat(request.input('uang_hotel') || 0) +
        parseFloat(request.input('uang_laundry') || 0) +
        parseFloat(request.input('uang_transport_dilokasi') || 0) +
        parseFloat(request.input('uang_tiket') || 0) +
        parseFloat(request.input('uang_komunikasi') || 0) +
        parseFloat(request.input('airport') || 0) +
        totalLain;

      let newBte;

      if (form.wilayah == '3') {
        newBte = await BteLuarNegeri.create({
          user_id: form.user_id,
          spdk_id: form.id,
          kurs_usd: request.input('kurs_usd'),
          sarapan: request.input('sarapan'),
          makan_siang: request.input('makan_siang'),
          makan_malam: request.input('makan_malam'),
          uang_saku: request.input('uang_saku'),
          uang_pp: request.input('uang_pp'),
          uang_hotel: request.input('uang_hotel'),
          uang_laundry: request.input('uang_laundry'),
          uang_transport_dilokasi: request.input('uang_transport_dilokasi'),
          uang_tiket: request.input('uang_tiket'),
          uang_komunikasi: request.input('uang_komunikasi'),
          airport: request.input('airport'),
          lain: lainJson,
          total: total_bte,
        });

        form.merge({
          status: 8,
          info: 'Cek BTE terlebih dahulu sebelum mengirim',
        });
      } else {
        newBte = form.merge({
          uang_makan:
            parseFloat(request.input('sarapan') || 0) +
            parseFloat(request.input('makan_siang') || 0) +
            parseFloat(request.input('makan_malam') || 0),
          uang_hotel: request.input('uang_hotel'),
          uang_laundry: request.input('uang_laundry'),
          uang_saku: request.input('uang_saku'),
          uang_komunikasi: request.input('uang_komunikasi'),
          uang_transport_dilokasi: request.input('uang_transport_dilokasi'),
          uang_pp: request.input('uang_pp'),
          uang_tiket: request.input('uang_tiket'),
          airport: request.input('airport'),
          lain: lainJson,
          total: total_bte,
          status: 8,
          info: 'Cek BTE terlebih dahulu sebelum mengirim',
        });
      }

      newBte.useTransaction(trx);
      await newBte.save();

      await form.related('log').create({
        user_id: userData.sub,
        spdk_id: form.id,
        action: 'CREATE BTE',
        info: '-',
      })

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
      })
    }
  }

  public async updateBte({ request, response, params }) {
    const trx = await Database.transaction();
    try {
      await request.validate(BteValidator);
      const userData = request['decoded'];
      const form = await Form.findOrFail(params.id);

      if (form.status != 8 && form.status != 10) {
        throw new Error('Cannot edit BTE if status not equal to 8 or 10. Current status: ' + form.status);
      }

      let totalLain = 0;

      const lainArray = request.input('lain');
      const nilaiLainArray = request.input('nilai_lain');

      const lainData = lainArray.map((datalain, index) => ({
        datalain,
        nilailain: parseFloat(nilaiLainArray[index]) || 0,
      }));

      const lainJson = JSON.stringify(lainData);

      for (let i = 0; i < nilaiLainArray.length; i++) {
        const nilaiLain = parseFloat(nilaiLainArray[i]) || 0;
        totalLain += nilaiLain;
      }

      const totalBte =
        parseFloat(request.input('sarapan') || 0) +
        parseFloat(request.input('makan_siang') || 0) +
        parseFloat(request.input('makan_malam') || 0) +
        parseFloat(request.input('uang_saku') || 0) +
        parseFloat(request.input('uang_pp') || 0) +
        parseFloat(request.input('uang_hotel') || 0) +
        parseFloat(request.input('uang_laundry') || 0) +
        parseFloat(request.input('uang_transport_dilokasi') || 0) +
        parseFloat(request.input('uang_tiket') || 0) +
        parseFloat(request.input('uang_komunikasi') || 0) +
        parseFloat(request.input('airport') || 0) +
        totalLain;

      if (form.wilayah == '3') {
        const bte = await BteLuarNegeri.query()
          .where('spdk_id', params.id)
          .first();

        if (!bte) {
          throw new Error('BTE Luar Negeri for this SPDK does not exist');
        }

        bte.merge({
          kurs_usd: request.input('kurs_usd'),
          sarapan: request.input('sarapan'),
          makan_siang: request.input('makan_siang'),
          makan_malam: request.input('makan_malam'),
          uang_saku: request.input('uang_saku'),
          uang_pp: request.input('uang_pp'),
          uang_hotel: request.input('uang_hotel'),
          uang_laundry: request.input('uang_laundry'),
          uang_transport_dilokasi: request.input('uang_transport_dilokasi'),
          uang_tiket: request.input('uang_tiket'),
          uang_komunikasi: request.input('uang_komunikasi'),
          airport: request.input('airport'),
          lain: lainJson,
          total: totalBte,
        });

        await bte.useTransaction(trx).save();

        form.merge({
          status: 8,
          info: 'Check BTE before submitting',
        });

      }else{
        form.merge({
          uang_makan:
            parseFloat(request.input('sarapan') || 0) +
            parseFloat(request.input('makan_siang') || 0) +
            parseFloat(request.input('makan_malam') || 0),
          uang_hotel: request.input('uang_hotel'),
          uang_laundry: request.input('uang_laundry'),
          uang_saku: request.input('uang_saku'),
          uang_komunikasi: request.input('uang_komunikasi'),
          uang_transport_dilokasi: request.input('uang_transport_dilokasi'),
          uang_pp: request.input('uang_pp'),
          uang_tiket: request.input('uang_tiket'),
          airport: request.input('airport'),
          lain: lainJson,
          total: totalBte,
          status: 8,
          info: 'Cek BTE terlebih dahulu sebelum mengirim',
        })

        await form.useTransaction(trx).save();
      }

      await form.related('log').create({
        user_id: userData.sub,
        spdk_id: form.id,
        action: 'UPDATE BTE',
        info: '-',
      });

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
      })
    }
  }

  public async submitBte({ response, params, request }) {
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

      if (data.status != 8) {
        throw new Error('Cant submit if status not 8, current status '+data.status)
      }

      data.merge({
        status: 9,
        info: 'Pengecekan BTE oleh Administrator MeeTrip',
      });

      await data.save();

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'SUBMIT BTE',
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

  public async selesaiSpdk({ response, params, request }) {
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

      if (data.status != 6) {
        throw new Error('Cant submit if status not 6, current status '+data.status)
      }

      data.merge({
        status: 7,
        info: 'Silahkan Isi BTE',
      });

      await data.save();

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'DONE SPDK',
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
