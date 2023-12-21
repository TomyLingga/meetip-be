import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import BookingList from "App/Models/BookingList"
import Room from 'App/Models/Room';

export default class BookingsController {
  public async index({ response }) {
    try {
      const currentDate = new Date();

      const data = await BookingList.query()
        .where('date', '>=', currentDate)
        .where('status', 'PENDING')
        .orderBy('created_at', 'desc')
        .preload('user')
        .preload('room');

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

  public async myBooking({ request, response }) {
    const userData = request['decoded']
    try {
      const data = await BookingList.query()
        .where('user_id', userData.sub)
        .orderBy('created_at', 'desc')
        .preload('user')
        .preload('room')

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

  public async show({ response, params }) {
    try {
      const data = await BookingList.query()
        .where('id', params.id)
        .preload('user')
        .preload('room')
        .firstOrFail()

      if (data === null) {
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

  public async create({ response, request }: HttpContextContract) {
    try {
      const userData = request['decoded']
      const data = request.all();

      data.user_id = userData.sub;
      data.status = 'PENDING';

      const room = await Room.query().select('name').where('id', data.room_id).firstOrFail();

      const conflictingBookingsCount = await BookingList.query()
        .where('date', '=', data.date)
        .where('room_id', '=', data.room_id)
        .where('status', '=', 'PENDING')
        .andWhere((query) => {
          query
            .whereBetween('start_time', [data.start_time, data.end_time])
            .orWhereBetween('end_time', [data.start_time, data.end_time])
            .orWhere((subQuery) => {
              subQuery
                .where('start_time', '<=', data.start_time)
                .andWhere('end_time', '>=', data.end_time)
                .andWhere('status', '=', 'PENDING');
            });
        })

      if (conflictingBookingsCount.length <= 0) {

        const newBooking = await BookingList.create(data);

        return response.status(200).send({
          success: true,
          data: newBooking,
          msg: `Booking ruang ${room.name} berhasil ditambahkan`
        })
      } else {
        throw new Error(`Ruangan ${room.name} di waktu itu sudah dibooking`);
      }
    } catch (error) {
      return response.status(403).send({
        success: false,
        msg: error.message,
      })
    }
  }

  public async update({ response, request, params }: HttpContextContract) {
    try {
      const userData = request['decoded'];
      const bookingId = params.id; // Assuming the route parameter for the booking id is named 'id'

      // Retrieve the existing booking
      const existingBooking = await BookingList.query()
                    .where('id', bookingId)
                    .where('user_id', userData.sub) // Check if the user owns the booking
                    .firstOrFail();

      const newRoomId = request.input('room_id');
      const room = await Room.query().select('name').where('id', newRoomId).firstOrFail();

      existingBooking.merge({
        room_id: newRoomId,
        date: request.input('date'),
        start_time: request.input('start_time'),
        end_time: request.input('end_time'),
        purpose: request.input('purpose'),
        zoom: request.input('zoom'),
        sound: request.input('sound'),
        snack: request.input('snack'),
        minuman: request.input('minuman'),
        siang: request.input('siang'),
        malam: request.input('malam'),
        peserta: request.input('peserta')
      })

      const conflictingBookingsCount = await BookingList.query()
        .where('date', '=', request.input('date'))
        .where('room_id', '=', newRoomId)
        .where('id', '!=', existingBooking.id)
        .where('status', '=', 'PENDING')
        .andWhere((query) => {
          query
            .whereBetween('start_time', [request.input('start_time'), request.input('end_time')])
            .orWhereBetween('end_time', [request.input('start_time'), request.input('end_time')])
            .orWhere((subQuery) => {
              subQuery
                .where('start_time', '<=', request.input('start_time'))
                .andWhere('end_time', '>=', request.input('end_time'))
                .andWhere('status', '=', 'PENDING');
            });
        });

      if (conflictingBookingsCount.length <= 0) {
        await existingBooking.save(); // Save the changes

        return response.status(200).send({
          success: true,
          data: existingBooking,
          msg: `Booking ruang ${room.name} berhasil diupdate`,
        });
      } else {
        throw new Error(`Ruangan ${room.name} di waktu itu sudah dibooking`);
      }
    } catch (error) {
      return response.status(403).send({
        success: false,
        msg: error.message,
      });
    }
  }

  public async cancel({response, request, params}){
    const trx = await Database.transaction()

    try {
      const data = await BookingList.findOrFail(params.id)

      const userData = request['decoded']

      if (userData.sub != data.user_id) {
        throw new Error('Not the requestor')
      }

      data.merge({
        status: 'CANCELED',
      })

      data.useTransaction(trx)
      await data.save()

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
