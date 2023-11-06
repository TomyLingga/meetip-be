// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Mail from "@ioc:Adonis/Addons/Mail";
import Env from '@ioc:Adonis/Core/Env'

export default class TestMiddlesController {
  public async test({request, response}) {
    const userToken = request['userToken'];
    const decoded = request['decoded'];

    await Mail.sendLater((message) => {
      message
      .from(Env.get('SMTP_USERNAME'))
      .to('tomylingga51196@gmail.com')
      .subject('<no-reply> Ngetes Email')
      .priority('high')
      .htmlView('emails/welcome', {
        user: {fullName: 'Some name'},
        url: 'https://your-app.com/verification-url',
      })
    })
    return response.send({ userToken, decoded }, 200)
  }


  public async test2({request, response}) {
    const userToken = request['userToken'];
    const decoded = request['decoded'];

    return response.send({ userToken, decoded }, 200)
  }
}
