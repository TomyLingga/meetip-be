// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Database from "@ioc:Adonis/Lucid/Database";
import SpdkDriver from "App/Models/SpdkDriver";

export default class SpdkDriversController {
  // nomor SPJ/C-001/IX/2023

  public async index({response}){
    try {
      const data = await SpdkDriver.query()
        .orderBy('created_at', 'desc')
        .preload('bte')
        .preload('dp')
        .preload('user', (userQuery) => {
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

  public async indexByUser({request, response}){
    const userData = request['decoded']
    try {
      const data = await SpdkDriver.query()
        .where('user_id', userData.sub)
        .orderBy('created_at', 'desc')
        .preload('bte')
        .preload('dp')
        .preload('user', (userQuery) => {
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

  public async show({response, params}){
    try {
      const data = await SpdkDriver.query()
        .where('id', params.id)
        .orderBy('created_at', 'desc')
        .preload('bte')
        .preload('dp')
        .preload('user', (userQuery) => {
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

  // public async create({response, request}) {
  //   const trx = await Database.transaction()

  //   try {

  //   } catch (error) {

  //   }
  // }
}
