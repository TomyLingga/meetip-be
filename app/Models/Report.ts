import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Form from './Form'

export default class Report extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({})
  public forms_id: number

  @column({})
  public laporan: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Form, {
    foreignKey: 'forms_id',
  })
  public form: BelongsTo<typeof Form>
}
