import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, HasOne, belongsTo, column, hasOne } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import BteDriver from './BteDriver'
import DpDriver from './DpDriver'

export default class SpdkDriver extends BaseModel {
  public static table = 'spdk_drivers'
  public serializeExtras = true

  @column({ isPrimary: true })
  public id: number

  @column({})
  public user_id: number

  @column({})
  public assignor_id: number

  @column({})
  public mobil: string

  @column({})
  public plat: string

  @column({})
  public tujuan: string

  @column({})
  public keperluan: string

  @column({})
  public waktu_berangkat: DateTime

  @column({})
  public waktu_kembali: DateTime

  @column({})
  public km_berangkat: number

  @column({})
  public km_kembali: number

  @column({})
  public lama_hari: number

  @column({})
  public keterangan: string

  @column({})
  public lampiran: string

  @column({})
  public nomor_surat: string

  @column({})
  public wilayah: string

  @column({})
  public tgl_surat: Date

  @column({})
  public panjar: boolean

  @column({})
  public info: string

  @column({})
  public status: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  //
  @belongsTo(()=> User,{foreignKey: 'user_id',})
  public user: BelongsTo<typeof User>

  @belongsTo(() => User, {foreignKey: 'assignor_id',})
  public atasan: BelongsTo<typeof User>

  @hasOne(()=> BteDriver,{foreignKey: 'spdkd_id',})
  public bte: HasOne<typeof BteDriver>

  @hasOne(()=> DpDriver,{foreignKey: 'spdkd_id',})
  public dp: HasOne<typeof DpDriver>
}
