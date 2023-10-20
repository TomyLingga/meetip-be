// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class TestMiddlesController {
  public async test({request, response}) {
    const userToken = request['userToken'];
    const decoded = request['decoded'];

    return response.send({ userToken, decoded }, 200)
  }

  public async test2({request, response}) {
    const userToken = request['userToken'];
    const decoded = request['decoded'];

    return response.send({ userToken, decoded }, 200)
  }
}
