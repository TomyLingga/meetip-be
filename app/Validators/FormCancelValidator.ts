import { schema } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class FormCancelValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    keterangan: schema.string(),
  })
}
