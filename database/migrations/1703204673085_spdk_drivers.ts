import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'spdk_drivers'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id')
      table.string('assignor_id')
      table.string('mobil')
      table.string('plat')
      table.string('tujuan')
      table.string('keperluan')
      table.date('tgl_berangkat')
      table.date('tgl_kembali')
      table.string('lama_hari')
      table.string('keperluan')

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
