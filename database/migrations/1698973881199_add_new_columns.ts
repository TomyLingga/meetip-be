import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'destinations'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('start_longitude')
      table.string('start_latitude')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('start_longitude')
      table.string('start_latitude')
    })
  }
}
