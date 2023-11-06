import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Division from './Division'

export default class Department extends BaseModel {
  public static table = 'departments'

  @column({ isPrimary: true })
  public id: number

  @column({})
  public divisi_id: number

  @column({})
  public department: string

  @column({})
  public kode: string

  @column({})
  public status: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Division, {foreignKey: 'divisi_id',})
  public form: BelongsTo<typeof Division>
}
