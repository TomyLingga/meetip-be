// import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Uang extends BaseModel {
  public static table = 'uang'

  @column({ isPrimary: true })
  public id: number

  @column({})
  public wilayah: string

  @column({})
  public jabatan: string

  @column({})
  public pagi: number

  @column({})
  public siang: number

  @column({})
  public malam: number

  @column({})
  public makan_dollar: number

  @column({})
  public hotel: number

  @column({})
  public laundry: number

  @column({})
  public pp: number

  @column({})
  public transport_lokal: number

  @column({})
  public tiket: number

  @column({})
  public saku: number

  @column({})
  public komunikasi: number

  @column({})
  public airport: number

  @column({})
  public official: number

  @column({})
  public dualima: number

  @column({})
  public seratus: number

  @column({})
  public duaratus: number
}
