import { schema } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class FormValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    atasan_id: schema.number(),
    // tujuan: schema.string(),
    keperluan: schema.string(),
    tgl_berangkat: schema.string(),
    tgl_kembali: schema.string(),
    barang: schema.string(),
    jarak: schema.string(),
    rombongan: schema.string(),
    kendaraan: schema.string(),
    jam_pergi: schema.string(),
    jam_sampai: schema.string(),
    // wilayah: schema.string(),
    uang_panjar: schema.number(),
    lama_hari: schema.number(),
    lampiran: schema.file(),
    longitude: schema.array().members(schema.string()),
    latitude: schema.array().members(schema.string()),
    start_longitude: schema.string(),
    start_latitude: schema.string(),
  })
}
