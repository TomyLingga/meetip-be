import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'spdk_drivers'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id')
      table.integer('assignor_id').nullable()
      table.string('mobil')
      table.string('plat')
      table.string('tujuan')
      table.string('keperluan')
      table.datetime('waktu_berangkat')
      table.datetime('waktu_kembali').nullable()
      table.integer('km_berangkat')
      table.integer('km_kembali').nullable()
      table.integer('lama_hari')
      table.string('keterangan').nullable()
      table.string('lampiran').nullable()
      table.string('nomor_surat')
      table.string('wilayah')
      table.date('tgl_surat').nullable()
      table.boolean('panjar')
      table.string('info')
      table.integer('status')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
