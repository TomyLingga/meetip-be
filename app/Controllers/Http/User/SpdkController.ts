// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Application from '@ioc:Adonis/Core/Application'
import Database from "@ioc:Adonis/Lucid/Database"
import Form from "App/Models/Form"
import User from "App/Models/User"
import FormValidator from "App/Validators/FormValidator"
import Env from '@ioc:Adonis/Core/Env'
import axios from 'axios'
import { DateTime } from 'luxon'
import Destination from 'App/Models/Destination'
import Mail from '@ioc:Adonis/Addons/Mail'
import Division from 'App/Models/Division'
import FormUpdateValidator from 'App/Validators/FormUpdateValidator'
import FormCancelValidator from 'App/Validators/FormCancelValidator'
import Drive from '@ioc:Adonis/Core/Drive'

export default class SpdkController {
  public async indexByUser({ request, response }) {
    const userData = request['decoded']
    try {
      const data = await Form.query()
        .where('user_id', userData.sub)
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

  public async detailByUser({ response, params }) {
    try {
      const data = await Form.query()
        .where('id', params.id)
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
        .preload('report')
        .firstOrFail()

      if (data === null) {
        throw new Error('No data found');
      }
      data.lampiran = await Drive.getUrl(`lampiran/${data.lampiran}`)

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

  async generateNomorSurat() {
    const currentMonth = DateTime.local().toFormat('MM')
    const currentYear = DateTime.local().toFormat('yyyy')

    const count = await Form.query()
      .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [currentMonth])
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [currentYear])
      .count('* as total')

    const countFormatted = count[0].total.toString().padStart(4, '0')
    const monthInRoman = await this.getMonthInRoman(currentMonth)

    const nomorSurat = `${countFormatted}/INL/SPDK/${monthInRoman}/${currentYear}`

    return nomorSurat
  }

  async getMonthInRoman(monthNumber) {
    const monthsInRoman = {
      1: 'I', 2: 'II', 3: 'III', 4: 'IV',
      5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII',
      9: 'IX', 10: 'X', 11: 'XI', 12: 'XII'
    }

    return monthsInRoman[monthNumber]
  }

  async processRequest(request) {
    const userData = request['decoded']
    const userToken = request['userToken']
    const pemberiTugas = await User.findOrFail(request.input('atasan_id'))
    const urlDiv = Env.get('URL_PORTAL') + `division/get/${userData.divisi}`
    const urlDept = Env.get('URL_PORTAL') + `department/get/${userData.departemen}`
    const getDiv = await axios.get(urlDiv, { headers: { 'Authorization': userToken } })
    const getDept = await axios.get(urlDept, { headers: { 'Authorization': userToken } })

    return { userData, pemberiTugas, getDiv, getDept }
  }

  async getTeruskan(userData){
    let teruskan
    if (userData.grade == "1" || userData.grade == "2" || userData.grade == "3") {
        teruskan = await User.query()
          .where('departemen', userData.departemen)
          .where('grade', '4')
          .first()

      if (!teruskan){
        teruskan = await User.query()
        .where('divisi', userData.divisi)
        .where('grade', '5')
        .first()
      }

      if (!teruskan) {
        const division  = await Division.query().where('id', userData.divisi).first()

        if (division) {
          const bomUser = await User.find(division.bom)
          if (bomUser) {
            return bomUser
          }
        }
      }
      return teruskan
    }else if (userData.grade == "4") {
      teruskan = await User.query()
        .where('divisi', userData.divisi)
        .where('grade', '5')
        .first()

      if (!teruskan) {
        const division = await Division.query().where('id', userData.divisi).first()

        if (division) {
          const bomUser = await User.find(division.bom)
          if (bomUser) {
            return bomUser
          }
        }
      }
      return teruskan
    }else{
      const division = await Division.query().where('id', userData.divisi).first()
      if (division) {
        const bomUser = await User.find(division.bom)
        if (bomUser) {
          return bomUser
        }
      }
    }
  }

  async createForm(userData, pemberiTugas, fileName, getDiv, getDept, request, nomorSurat, teruskan) {
    let status, info

    if (request.input('uang_panjar') === '0') {
      status = 1
      info = "Menunggu Persetujuan dari " + pemberiTugas.name

      await Mail.sendLater((message) =>{
        message
        .from(Env.get('SMTP_USERNAME'))
        .to(pemberiTugas.email)
        .subject('Meetrip Notification')
        .priority('high')
        .htmlView('emails/approve_bto', {
          username: userData.name,
          userHP: userData.no_hp,
          userPosition: userData.jabatan,
          pemberiTugas: pemberiTugas.name,
          tgl_berangkat: request.input('tgl_berangkat'),
          tgl_kembali: request.input('tgl_kembali'),
          url: Env.get('URL_FE_PORTAL'),
          jenis: 'BTO',
        })
      })
    } else {
      status = 300
      info = "Silahkan ajukan DownPayment"
    }
    return Form.create({
      user_id: userData.sub,
      atasan_id: pemberiTugas.id,
      jabatan: userData.jabatan,
      divisi: getDiv.data.data.id,
      departemen: getDept.data.data.id,
      tujuan: "-",
      keperluan: request.input('keperluan'),
      pemberi_tugas: pemberiTugas.name,
      tgl_berangkat: request.input('tgl_berangkat'),
      tgl_kembali: request.input('tgl_kembali'),
      lama_hari: request.input('lama_hari'),
      barang: request.input('barang'),
      jarak: "",
      rombongan: request.input('rombongan'),
      estimasi_waktu: "",
      kendaraan: request.input('kendaraan'),
      lampiran: fileName,
      nomor_surat: nomorSurat,
      golongan: userData.grade,
      nama_supir: "-",
      no_kendaraan: "-",
      wilayah: "",
      tgl_surat: new Date(),
      uang_panjar: request.input('uang_panjar'),
      tgl_pergi: request.input('tgl_berangkat'),
      tgl_sampai: request.input('tgl_kembali'),
      jam_pergi: request.input('jam_pergi'),
      jam_sampai: request.input('jam_sampai'),
      uang_makan: 0,
      uang_hotel: 0,
      uang_laundry: 0,
      uang_saku: 0,
      uang_komunikasi: 0,
      uang_transport_dilokasi: 0,
      uang_pp: 0,
      uang_tiket: 0,
      total: 0,
      status: status,
      info: info,
      teruskan: teruskan.id,
      airport: 0
    })
  }

  async create({ request, response }) {
    const trx = await Database.transaction()

    try {
      await request.validate(FormValidator)
      const { userData, pemberiTugas, getDiv, getDept } = await this.processRequest(request)
      const teruskan = await this.getTeruskan(userData)

      const lampiranFile = request.file('lampiran')

      if (lampiranFile.state != 'consumed') {
        throw new Error('No file uploaded')
      }

      const fileName = `${new Date().getTime()}_${lampiranFile.clientName}`
      await lampiranFile.move("./public/uploads/lampiran", { name: fileName })

      if (lampiranFile.state != 'moved') {
        return lampiranFile.error()
      }

      const nomorSurat = await this.generateNomorSurat()

      const newForm = await this.createForm(userData, pemberiTugas, fileName, getDiv, getDept, request, nomorSurat, teruskan)
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

      for (let i = 0; i < longitude.length; i++) {
        await Destination.create({
          forms_id: newForm.id,
          start_longitude: start_longitude,
          start_latitude: start_latitude,
          longitude: longitude[i],
          latitude: latitude[i],
          attend: false
        })

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
      newForm.jarak = longestDistanceText
      newForm.estimasi_waktu = estimatedTimeText
      newForm.wilayah = wilayah
      newForm.useTransaction(trx)
      await newForm.save()

      await newForm.related('log').create({
        user_id: userData.sub,
        spdk_id: newForm.id,
        action: 'CREATE BTO',
        info: '-',
      })

      await trx.commit()

      return response.send({ success: true, data: newForm }, 200)
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
      await request.validate(FormUpdateValidator)

      const data = await Form.findOrFail(params.id)

      if (data.status >= 7 && data.status <= 12) {
        throw new Error('Cannot edit spdk with status between 7 and 12. Current status : '+data.status)
      }
      const { userData, pemberiTugas, getDiv, getDept } = await this.processRequest(request)

      if (data.user_id != userData.sub) {
        throw new Error('This SPDK does not belong to the logged-in user.')
      }

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

      data.merge({
        atasan_id: pemberiTugas.id,
        jabatan: userData.jabatan,
        divisi: getDiv.data.data.id,
        departemen: getDept.data.data.id,
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
        action: 'EDIT BTO',
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

  public async cancel({response, request, params}){
    const trx = await Database.transaction()

    try {
      await request.validate(FormCancelValidator)

      const data = await Form.findOrFail(params.id)

      if (data.status >= 7 && data.status <= 12) {
        throw new Error('Cannot cancel spdk with status between 7 and 12. Current status : '+data.status)
      }

      const userData = request['decoded']
      let status = 0
      let info = "Dibatalkan oleh " + userData.name + ", Tidak ada Panjar"

      if (data.uang_panjar > 0) {
        status = 100
        info = "Dibatalkan oleh " + userData.name + ", Panjar belum dikembalikan"
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
        action: 'CANCEL BTO',
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
