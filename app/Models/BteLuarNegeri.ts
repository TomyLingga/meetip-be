import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class BteLuarNegeri extends BaseModel {
  public static table = 'bte_luar_negeri'

  // constructor() {
  //   super();
  //   this.table = 'bte_luar_negeri'; // Define the table name
  // }

  @column({ isPrimary: true })
  public id_bteln: number

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
  public uang_saku: number

  @column({})
  public uang_pp: number

  @column({})
  public uang_hotel: number

  @column({})
  public uang_laundry: number

  @column({})
  public uang_transport_dilokasi: number

  @column({})
  public uang_tiket: number

  @column({})
  public uang_komunikasi: number

  @column({})
  public airport: number

  @column({})
  public lain: JSON

  @column({})
  public total: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
