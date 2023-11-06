import { schema} from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UangValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    pagi: schema.number(),
    siang: schema.number(),
    malam: schema.number(),
    hotel: schema.number(),
    laundry: schema.number(),
    pp: schema.number(),
    transport_lokal: schema.number(),
    tiket: schema.number(),
    saku: schema.number(),
    komunikasi: schema.number(),
    airport: schema.number(),
    official: schema.number(),
    dualima: schema.number(),
    seratus: schema.number(),
    duaratus: schema.number(),
  })

  // public messages: CustomMessages = {
  //   required: 'The {{ field }} field is required',
  // }
}
