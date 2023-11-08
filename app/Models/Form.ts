import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, HasMany, HasOne, belongsTo, column, hasMany, hasOne } from '@ioc:Adonis/Lucid/Orm'
import BteLuarNegeri from './BteLuarNegeri'
import Destination from './Destination'
import User from './User'
import DpLuarNegeri from './DpLuarNegeri'
import Panjar from './Panjar'

export default class Form extends BaseModel {
  public static table = 'forms'
  public serializeExtras = true;
  @column({ isPrimary: true })
  public id: number

  @column({})
  public user_id: number

  @column({})
  public atasan_id: number

  @column({})
  public jabatan: string

  @column({})
  public divisi: string

  @column({})
  public departemen: string

  @column({})
  public tujuan: string

  @column({})
  public keperluan: string

  @column({})
  public pemberi_tugas: string

  @column({})
  public tgl_berangkat: string

  @column({})
  public tgl_kembali: string

  @column({})
  public lama_hari: number

  @column({})
  public barang: string

  @column({})
  public jarak: string

  @column({})
  public rombongan: string

  @column({})
  public estimasi_waktu: string

  @column({})
  public kendaraan: string

  @column({})
  public lampiran: string

  @column({})
  public nomor_surat: string

  @column({})
  public golongan: string

  @column({})
  public nama_supir: string

  @column({})
  public no_kendaraan: string

  @column({})
  public wilayah: string

  @column({})
  public tgl_surat: Date

  @column({})
  public uang_panjar: number

  @column({})
  public tgl_pergi: string

  @column({})
  public jam_pergi: string

  @column({})
  public tgl_sampai: string

  @column({})
  public jam_sampai: string

  @column({})
  public uang_makan: number

  @column({})
  public uang_hotel: number

  @column({})
  public uang_laundry: number

  @column({})
  public uang_saku: number

  @column({})
  public uang_komunikasi: number

  @column({})
  public uang_transport_dilokasi: number

  @column({})
  public uang_pp: number

  @column({})
  public uang_tiket: number

  @column({})
  public lain: JSON

  @column({})
  public total: number

  @column({})
  public note: string

  @column({})
  public status: string

  @column({})
  public darurat: number

  @column({})
  public info: string

  @column({})
  public teruskan: number

  @column({})
  public airport: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasOne(()=> BteLuarNegeri,{foreignKey: 'spdk_id',})
  public bteLuarNegeri: HasOne<typeof BteLuarNegeri>

  @hasOne(()=> DpLuarNegeri,{foreignKey: 'spdk_id',})
  public dpLuarNegeri: HasOne<typeof DpLuarNegeri>

  @hasOne(()=> Panjar,{foreignKey: 'spdk_id',})
  public panjar: HasOne<typeof Panjar>

  @hasMany(() => Destination,{foreignKey: 'forms_id',})
  public destinations: HasMany<typeof Destination>

  @belongsTo(()=> User,{foreignKey: 'user_id',})
  public user: BelongsTo<typeof User>

  @belongsTo(()=> User,{foreignKey: 'atasan_id',})
  public pemberiTugas: BelongsTo<typeof User>

  @belongsTo(() => User, {foreignKey: 'teruskan',})
  public atasan: BelongsTo<typeof User>

}
