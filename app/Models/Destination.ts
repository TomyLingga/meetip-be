import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, } from '@ioc:Adonis/Lucid/Orm'
import Form from './Form'

export default class Destination extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({})
  public forms_id: number

  @column({})
  public longitude: string

  @column({})
  public latitude: string

  @column({})
  public start_longitude: string

  @column({})
  public start_latitude: string

  @column({})
  public attend: boolean

  @column({})
  public foto: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Form, {
    foreignKey: 'forms_id',
  })
  public form: BelongsTo<typeof Form>

}
