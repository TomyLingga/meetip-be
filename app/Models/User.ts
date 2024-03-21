import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, HasMany, HasOne, belongsTo, column, hasMany, hasOne } from '@ioc:Adonis/Lucid/Orm'
import Form from './Form'
import Division from './Division'
import Department from './Department'
import BomUser from './BomUser'

export default class User extends BaseModel {
  public static table = 'users'

  @column({ isPrimary: true })
  public id: number

  @column({})
  public name: string

  @column({})
  public email: string

  @column({})
  public email_verified_at: DateTime

  @column({})
  public password: string

  @column({})
  public remember_token: string

  @column({})
  public roles: string

  @column({})
  public noHP: string

  @column({})
  public foto: string

  @column({})
  public bio: string

  @column({})
  public jabatan: string

  @column({})
  public departemen: string

  @column({})
  public divisi: string

  @column({})
  public nrk: string

  @column({})
  public nik: string

  @column({})
  public bpjs_kesehatan: string

  @column({})
  public bpjs_ketenagakerjaan: string

  @column({})
  public tgl_masuk: Date

  @column({})
  public tgl_keluar: Date

  @column({})
  public masa_kerja: string

  @column({})
  public tempat_lahir: string

  @column({})
  public tgl_lahir: Date

  @column({})
  public jlh_tk: string

  @column({})
  public kelamin: string

  @column({})
  public status_karyawan: string

  @column({})
  public grade: string

  @column({})
  public pendidikan: string

  @column({})
  public jurusan: string

  @column({})
  public agama: string

  @column({})
  public kantor: string

  @column({})
  public keterangan: string

  @column({})
  public status_perkawinan: string

  @column({})
  public alamat_ktp: string

  @column({})
  public alamat_domisili: string

  @column({})
  public domisili: string

  @column({})
  public npwp: string

  @column({})
  public training: string

  @column({})
  public faskes_1: string

  @column({})
  public rekening: string

  @column({})
  public no_rekening: string

  @column({})
  public gaji_pokok: number

  @column({})
  public tunjangan_tetap: number

  @column({})
  public tunjangan_tidak_tetap: number

  @column({})
  public signature: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Form,{foreignKey: 'user_id',})
  public form: HasMany<typeof Form>

  @belongsTo(() => Division, { foreignKey: 'divisi' })
  public div: BelongsTo<typeof Division>

  @belongsTo(() => Department, { foreignKey: 'departemen' })
  public dept: BelongsTo<typeof Department>

  @hasOne(()=> BomUser,{foreignKey: 'user_id',})
  public bomUser: HasOne<typeof BomUser>
}
