import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import SpdkDriver from './SpdkDriver'

export default class BteDriver extends BaseModel {
  public static table = 'bte_drivers'
  public serializeExtras = true

  @column({ isPrimary: true })
  public id: number

  @column({})
  public user_id: number

  @column({})
  public spdkd_id: number

  @column({})
  public kurs_usd: number

  @column({})
  public sarapan: number

  @column({})
  public makan_siang: number

  @column({})
  public makan_malam: number

  @column({})
  public saku: number

  @column({})
  public pp: number

  @column({})
  public hotel: number

  @column({})
  public laundry: number

  @column({})
  public transport_dilokasi: number

  @column({})
  public tiket: number

  @column({})
  public komunikasi: number

  @column({})
  public airport: number

  @column({})
  public lain: any

  @column({})
  public total: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  //
  @belongsTo(()=> User,{foreignKey: 'user_id',})
  public user: BelongsTo<typeof User>

  @belongsTo(() => SpdkDriver, {foreignKey: 'spdkd_id',})
  public spdk_driver: BelongsTo<typeof SpdkDriver>
}
