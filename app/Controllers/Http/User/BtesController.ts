// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database"
import Destination from "App/Models/Destination"
import Form from "App/Models/Form"
import Report from "App/Models/Report"
import Env from '@ioc:Adonis/Core/Env'
import axios from "axios"

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
      const data = await Destination.findOrFail(params.id)

      const userData = request['decoded']

      if (data.attend != false) {
        throw new Error('Stampped Already')
      }

      const apiKey = Env.get('MAP_API_KEY')

      const origin = `${data.latitude},${data.longitude}`
        const destination = `${request.input('current_latitude')},${request.input('current_longitude')}`
        const distanceMatrixResponse = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
          params: {
            origins: origin,
            destinations: destination,
            key: apiKey,
          },
        })

      // data.merge({
      //   status: 3,
      //   info: 'Sedang diproses Administrator MeeTrip',
      // })

      // await data.save()

      // await data.related('log').create({
      //   user_id: userData.sub,
      //   spdk_id: data.id,
      //   action: 'APPROVE BTO',
      //   info: '-',
      // })

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
