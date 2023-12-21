import { DateTime } from 'luxon'
import { BaseModel, HasMany, column, hasMany } from '@ioc:Adonis/Lucid/Orm'
import BookingList from './BookingList'

export default class Room extends BaseModel {
  public static table = 'rooms'
  public serializeExtras = true

  @column({ isPrimary: true })
  public id: number

  @column({})
  public name: string

  @column({})
  public foto_room: string

  @column({})
  public description: string

  @column({})
  public capacity: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => BookingList,{foreignKey: 'room_id',})
  public booking: HasMany<typeof BookingList>
}
