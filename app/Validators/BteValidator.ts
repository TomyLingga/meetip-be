import { schema } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class BteValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    kurs_usd: schema.number(),
    sarapan: schema.number(),
    makan_siang: schema.number(),
    makan_malam: schema.number(),
    uang_saku: schema.number(),
    uang_pp: schema.number(),
    uang_hotel: schema.number(),
    uang_laundry: schema.number(),
    uang_transport_dilokasi: schema.number(),
    uang_tiket: schema.number(),
    uang_komunikasi: schema.number(),
    airport: schema.number(),
  })
}
