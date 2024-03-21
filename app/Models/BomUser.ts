import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class BomUser extends BaseModel {
  public static table = 'bom_users'
  public serializeExtras = true

  @column({ isPrimary: true })
  public id: number

  @column({})
  public user_id: number

  @column({})
  public bom: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'user_id' })
  public div: BelongsTo<typeof User>
}
