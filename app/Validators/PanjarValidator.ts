import { schema } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class PanjarValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    user_id: schema.number(),
    spdk_id: schema.number(),
    official: schema.number(),
    sarapan: schema.number(),
    makan_siang: schema.number(),
    makan_malam: schema.number(),
    saku: schema.number(),
    dualima: schema.number(),
    seratussatu: schema.number(),
    duaratus: schema.number(),
    hotel: schema.number(),
    laundry: schema.number(),
    transport_dilokasi: schema.number(),
    tiket: schema.number(),
    komunikasi: schema.number(),
    airport: schema.number(),
  })
}
