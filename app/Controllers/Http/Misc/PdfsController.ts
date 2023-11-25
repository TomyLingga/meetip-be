import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import fs from 'fs/promises';
import Application from '@ioc:Adonis/Core/Application'
import puppeteer from 'puppeteer'
import Form from 'App/Models/Form';
import Env from "@ioc:Adonis/Core/Env";
// import axios from 'axios'
import Route from '@ioc:Adonis/Core/Route'

export default class PdfsController {
  public async showLampiran({ params, response }: HttpContextContract) {
    const filename = params.filename;
    const filePath = Application.tmpPath(`uploads/lampiran/${filename}`)

    try {
      await fs.stat(filePath)

      return response.download(filePath, true)
    } catch (error) {

      return response.status(404).send('File not found');
    }
  }

  public async showDpRegion({response, params}){
    const url = `${Env.get('BASE_URL')}${Route.makeUrl('pdf.dpregion', { id: params.id })}`
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.emulateMediaType('screen')
    await page.goto(url, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'a4' })

    await browser.close()

    response.header('Content-type', 'application/pdf')
    response.header('Content-Disposition', `inline; filename="your_filename.pdf"`)

    return response.send(pdf)
  }

  public async generate({ view, params }: HttpContextContract) {
    const form = await Form.query()
          .where('id', params.id)
          .orderBy('created_at', 'desc')
          .preload('bteLuarNegeri')
          .preload('dpLuarNegeri')
          .preload('panjar')
          .preload('destinations')
          .preload('user', (userQuery) => {
            userQuery.preload('div')
            userQuery.preload('dept')
          })
          .preload('pemberiTugas', (userQuery) => {
            userQuery.preload('div')
            userQuery.preload('dept')
          })
          .preload('atasan', (userQuery) => {
            userQuery.preload('div')
            userQuery.preload('dept')
          })
          .preload('log', (logQuery) => {
            // logQuery.preload('user')
            logQuery.orderBy('created_at', 'asc')
          }).firstOrFail()
    // const logoPath = Application.tmpPath(`uploads/template/inl.png`)
    // const footerPath = Application.tmpPath(`uploads/template/footer.PNG`)
    // console.log(form.destinations)
​
    return view.render('pdf/dp_region', { form})
  }
}
