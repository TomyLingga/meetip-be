import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'bte_drivers'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id')
      table.integer('spdkd_id')
      table.decimal('kurs_usd', 20, 2)
      table.decimal('sarapan', 20, 2)
      table.decimal('makan_siang', 20, 2)
      table.decimal('makan_malam', 20, 2)
      table.decimal('saku', 20, 2)
      table.decimal('pp', 20, 2)
      table.decimal('hotel', 20, 2)
      table.decimal('laundry', 20, 2)
      table.decimal('transport_dilokasi', 20, 2)
      table.decimal('tiket', 20, 2)
      table.decimal('komunikasi', 20, 2)
      table.decimal('airport', 20, 2)
      table.jsonb('lain').nullable()
      table.decimal('total', 20, 2)
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
