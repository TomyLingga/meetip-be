import { DateTime } from 'luxon'
import { BaseModel, HasMany, HasOne, column, hasMany, hasOne } from '@ioc:Adonis/Lucid/Orm'
import Department from './Department'
import User from './User'

export default class Division extends BaseModel {
  public static table = 'divisions'

  @column({ isPrimary: true })
  public id: number

  @column({})
  public divisi: string

  @column({})
  public kode: string

  @column({})
  public bom: number

  @column({})
  public status: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Department,{foreignKey: 'divisi_id',})
  public destinations: HasMany<typeof Department>

  @hasOne(()=> User,{foreignKey: 'bom',})
  public atasan: HasOne<typeof User>
}
