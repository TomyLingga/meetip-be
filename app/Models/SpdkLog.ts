import { DateTime } from 'luxon'
import { BaseModel, column} from '@ioc:Adonis/Lucid/Orm'
// import User from './User'

export default class SpdkLog extends BaseModel {
  public static table = 'spdk_log'

  @column({ isPrimary: true })
  public id_log: number

  @column({})
  public user_id: number

  @column({})
  public spdk_id: number

  @column({})
  public action: string

  @column({})
  public info: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // @hasOne(()=> User,{foreignKey: 'user_id',})
  // public user: HasOne<typeof User>
}
