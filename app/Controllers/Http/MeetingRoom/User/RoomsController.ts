// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database"
import Room from "App/Models/Room"
import RoomValidator from "App/Validators/RoomValidator"
import Drive from '@ioc:Adonis/Core/Drive'

export default class RoomsController {
  public async index({response}) {
    const data = await Room.query().orderBy('created_at', 'desc')

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
      const data = await Room.findOrFail(params.id)

      data.foto_room = await Drive.getUrl(`room/${data.foto_room}`)

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

  public async create({request, response}) {
    const trx = await Database.transaction()
    try {
      await request.validate(RoomValidator)
      const lampiranFile = request.file('foto_room')

      if (lampiranFile.state != 'consumed') {
        throw new Error('No file uploaded')
      }

      const fileName = `${new Date().getTime()}_${lampiranFile.clientName}`
      await lampiranFile.move("./public/uploads/room", { name: fileName })

      if (lampiranFile.state != 'moved') {
        return lampiranFile.error()
      }
      const newRoom = await Room.create({
        name: request.input('name'),
        foto_room: fileName,
        description: request.input('description'),
        capacity: request.input('capacity')
      })
      newRoom.useTransaction(trx)
      await trx.commit()

      return response.send({success: true, data: newRoom}, 200)
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

  public async update({response, request, params}){
    const trx = await Database.transaction()

    try {
      await request.validate(RoomValidator)
      const data = await Room.findOrFail(params.id)

      const lampiranFile = request.file('foto_room')

      if (lampiranFile.state != 'consumed') {
        throw new Error('No file uploaded')
      }

      const fileName = `${new Date().getTime()}_${lampiranFile.clientName}`
      await lampiranFile.move("./public/uploads/room", { name: fileName })

      if (lampiranFile.state != 'moved') {
        return lampiranFile.error()
      }

      data.name = request.input('name')
      data.foto_room = fileName
      data.description = request.input('description')
      data.capacity = request.input('capacity')

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
        stack: error.stack,
      })
    }
  }
}
