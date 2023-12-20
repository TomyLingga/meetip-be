// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import Mail from "@ioc:Adonis/Addons/Mail"
import Database from "@ioc:Adonis/Lucid/Database"
import Form from "App/Models/Form"
import FormCancelValidator from "App/Validators/FormCancelValidator"
import Env from '@ioc:Adonis/Core/Env'
import User from 'App/Models/User'
import Destination from 'App/Models/Destination'
import axios from 'axios'

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
        .preload('report')

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

      console.log(data.atasan)
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
            jenis: 'SPDK',
          })
        })
      }

      data.merge({
        status: status,
        info: info,
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
        data
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

  public async update({response, request, params}){
    const trx = await Database.transaction()

    try {
      const data = await Form.findOrFail(params.id)

      let fileName = ""
      const lampiranExists = request.input('lampiran') !== null && request.input('lampiran') !== undefined

      if (lampiranExists) {
        const lampiranFile = request.file('lampiran')

        if (lampiranFile.state != 'consumed') {
            throw new Error('No file uploaded')
        }

        fileName = `${new Date().getTime()}_${lampiranFile.clientName}`
        await lampiranFile.move(Application.tmpPath('uploads/lampiran'), { name: fileName })

        if (lampiranFile.state != 'moved') {
            return lampiranFile.error()
        }
      } else {
          fileName = data.lampiran
      }
      const pemberiTugas = await User.findOrFail(request.input('atasan_id'))
      const userData = request['decoded']

      data.merge({
        atasan_id: request.input('pemberi_tugas_id'),
        jabatan: request.input('jabatan_user'),
        divisi: request.input('div_id'),
        departemen: request.input('dept_id'),
        keperluan: request.input('keperluan'),
        pemberi_tugas: pemberiTugas.name,
        tgl_berangkat: request.input('tgl_berangkat'),
        tgl_kembali: request.input('tgl_kembali'),
        lama_hari: request.input('lama_hari'),
        barang: request.input('barang'),
        rombongan: request.input('rombongan'),
        kendaraan: request.input('kendaraan'),
        lampiran: fileName,
        uang_panjar: request.input('uang_panjar'),
        tgl_pergi: request.input('tgl_berangkat'),
        tgl_sampai: request.input('tgl_kembali'),
        jam_pergi: request.input('jam_pergi'),
        jam_sampai: request.input('jam_sampai')
      })

      const newData = await data.save()

      const start_longitude = request.input('start_longitude')
      const start_latitude = request.input('start_latitude')
      const latitude = request.input('latitude', [])
      const longitude = request.input('longitude', [])
      let longestDistanceText = '0 km'
      let estimatedTimeText = '0 mins'
      let longestDistanceValue = 0
      let longestDistanceLatitude = null
      let longestDistanceLongitude = null
      const apiKey = Env.get('MAP_API_KEY')
      const destination_ids = request.input('destination_id', [])

      const existingDestinationIds = await Destination.query().where('forms_id', data.id).select('id');
      const destinationsToDelete = existingDestinationIds.map(idObj => idObj.id).filter(id => !destination_ids.includes(String(id)));

      for (const idToDelete of destinationsToDelete) {
          const destinationToDelete = await Destination.find(idToDelete);

          if (destinationToDelete) {
              await destinationToDelete.delete();
          }
      }

      for (let i = 0; i < latitude.length; i++) {
        if (parseInt(destination_ids[i], 10) != undefined && !Number.isNaN(parseInt(destination_ids[i], 10))) {
          let existingDestination = await Destination.find(parseInt(destination_ids[i], 10))

          if (existingDestination) {
              existingDestination.merge({
                  longitude: longitude[i],
                  latitude: latitude[i],
                  start_longitude: start_longitude,
                  start_latitude: start_latitude,
              })

              await existingDestination.save()
          } else {
              throw new Error(`Destination with id ${parseInt(destination_ids[i], 10)} not found.`)
          }
        } else {
            await Destination.create({
                forms_id: data.id,
                start_longitude: start_longitude,
                start_latitude: start_latitude,
                longitude: longitude[i],
                latitude: latitude[i],
                attend: false
            })
        }

        const origin = `${start_latitude},${start_longitude}`
        const destination = `${latitude[i]},${longitude[i]}`
        const distanceMatrixResponse = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
          params: {
            origins: origin,
            destinations: destination,
            key: apiKey,
          },
        })

        if (distanceMatrixResponse.data.status === 'OK') {
          const elements = distanceMatrixResponse.data.rows[0].elements

          if (elements && elements.length > 0) {
            const firstElement = elements[0]

            if (firstElement.distance && firstElement.distance.value) {
              const distanceValue = firstElement.distance.value

              if (distanceValue > longestDistanceValue) {
                longestDistanceValue = distanceValue
                longestDistanceText = firstElement.distance.text
                estimatedTimeText = firstElement.duration.text
                longestDistanceLatitude = latitude[i]
                longestDistanceLongitude = longitude[i]
              }
            } else {
              console.log('Invalid distance data in the response.')
            }
          } else {
            console.log('No elements in the response.')
          }
        } else {
          console.log('Distance Matrix API status is not OK.')
        }
      }

      const startGeocodeResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${start_latitude},${start_longitude}&key=${apiKey}`)
      const longestDistanceGeocodeResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${longestDistanceLatitude},${longestDistanceLongitude}&key=${apiKey}`)

      const startCountry = extractCountry(startGeocodeResponse.data)
      const startProvince = extractProvince(startGeocodeResponse.data)

      const longestDistanceCountry = extractCountry(longestDistanceGeocodeResponse.data)
      const longestDistanceProvince = extractProvince(longestDistanceGeocodeResponse.data)

      function extractCountry(geocodeData) {
        let country = ""

        for (const result of geocodeData.results) {
          for (const addressComponent of result.address_components) {
            if (addressComponent.types.includes("country")) {
              country = addressComponent.long_name
              break
            }
          }
        }

        return country
      }

      function extractProvince(geocodeData) {
        let province = ""

        for (const result of geocodeData.results) {
          for (const addressComponent of result.address_components) {
            if (
              addressComponent.types.includes("administrative_area_level_1") ||
              addressComponent.types.includes("locality")
            ) {
              province = addressComponent.long_name
              break
            }
          }
        }

        return province
      }

      let wilayah = "1"

      if (startCountry !== longestDistanceCountry) {
        wilayah = "3"
      } else if (startProvince !== longestDistanceProvince) {
        wilayah = "2"
      }

      data.merge({
        jarak: longestDistanceText,
        estimasi_waktu: estimatedTimeText,
        wilayah: wilayah,
      })

      data.useTransaction(trx)
      await data.save()

      await data.related('log').create({
        user_id: userData.sub,
        spdk_id: data.id,
        action: 'EDIT SPDK',
        info: '-',
      })

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
