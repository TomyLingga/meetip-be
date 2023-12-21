import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Room from './Room'

export default class BookingList extends BaseModel {
  public static table = 'booking_lists'
  public serializeExtras = true

  @column({ isPrimary: true })
  public id: number

  @column({})
  public user_id: number

  @column({})
  public room_id: number

  @column({})
  public date: string

  @column({})
  public start_time: string

  @column({})
  public end_time: string

  @column({})
  public purpose: string

  @column({})
  public zoom: string

  @column({})
  public sound: string

  @column({})
  public snack: string

  @column({})
  public minuman: string

  @column({})
  public siang: string

  @column({})
  public malam: string

  @column({})
  public status: string

  @column({})
  public peserta: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(()=> User,{foreignKey: 'user_id',})
  public user: BelongsTo<typeof User>

  @belongsTo(()=> Room,{foreignKey: 'room_id',})
  public room: BelongsTo<typeof Room>
}
