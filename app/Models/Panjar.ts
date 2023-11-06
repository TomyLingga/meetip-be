import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Panjar extends BaseModel {
  public static table = 'panjar'

  @column({ isPrimary: true })
  public id_panjar: number

  @column({})
  public user_id: number

  @column({})
  public spdk_id: number

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
  public official: number

  @column({})
  public dualima: number

  @column({})
  public seratussatu: number

  @column({})
  public duaratus: number

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
  public total_panjar: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
