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
import SpdkLog from 'App/Models/SpdkLog'
import Mail from '@ioc:Adonis/Addons/Mail'

export default class SpdkController {
  public async indexByUser({ request, response }) {
    const userData = request['decoded']
    try {
      const data = await Form.query()
        .where('user_id', userData.sub)
        .orderBy('created_at', 'desc')
        .preload('bteLuarNegeri')
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

  async create({ request, response }) {
    const trx = await Database.transaction()

    try {
      const { userData, pemberiTugas, getDiv, getDept } = await this.processRequest(request)
      const lampiranFile = request.file('lampiran')

      if (lampiranFile.state != 'consumed') {
        throw new Error('No file uploaded')
      }

      const fileName = `${new Date().getTime()}_${lampiranFile.clientName}`
      await lampiranFile.move(Application.tmpPath('uploads/lampiran'), { name: fileName })

      if (lampiranFile.state != 'moved') {
        return lampiranFile.error()
      }

      const nomorSurat = await this.generateNomorSurat()

      const newForm = await this.createForm(userData, pemberiTugas, fileName, getDiv, getDept, request, nomorSurat)
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
      await newForm.save()

      await SpdkLog.create({
        user_id: userData.sub,
        spdk_id: newForm.id,
        action: 'CREATE BTO',
        info: '-',
      })

      await Mail.sendLater((message) =>{
        message
        .from(Env.get('SMTP_USERNAME'))
        .to(pemberiTugas.email)
        .subject('Meetrip Notification')
        .priority('high')
        .htmlView('emails/welcome', {
          user: {fullName: 'Some name'},
          url: 'https://your-app.com/verification-url',
        })
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

  async processRequest(request) {
    const userData = request['decoded']
    const userToken = request['userToken']
    await request.validate(FormValidator)
    const pemberiTugas = await User.findOrFail(request.input('atasan_id'))
    const urlDiv = Env.get('URL_PORTAL') + `division/get/${userData.divisi}`
    const urlDept = Env.get('URL_PORTAL') + `department/get/${userData.departemen}`
    const getDiv = await axios.get(urlDiv, { headers: { 'Authorization': userToken } })
    const getDept = await axios.get(urlDept, { headers: { 'Authorization': userToken } })

    return { userData, pemberiTugas, getDiv, getDept }
  }

  async createForm(userData, pemberiTugas, fileName, getDiv, getDept, request, nomorSurat) {
    let status, info;

    if (request.input('uang_panjar') === '0') {
      status = "1";
      info = "Menunggu Persetujuan dari " + pemberiTugas.name;
    } else {
      status = "300";
      info = "Silahkan ajukan DownPayment";
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
      teruskan: 2,
      airport: 0
    })
  }
}
