import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import fs from 'fs/promises';
import Application from '@ioc:Adonis/Core/Application'
import puppeteer from 'puppeteer'
import Form from 'App/Models/Form';
import Env from "@ioc:Adonis/Core/Env";
import axios from 'axios'
import Route from '@ioc:Adonis/Core/Route'
import Destination from 'App/Models/Destination';

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
    // const pdf = await page.pdf()
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
          .preload('destinations')
          .preload('panjar')
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

    const apiKey = Env.get('MAP_API_KEY')

    const destinations = await Destination.query()
          .where('forms_id', form.id)
    async function getLocationName(latitude: string, longitude: string): Promise<string> {
      try {
        const geocodingResponse = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
              );

        if (geocodingResponse.data.status === 'OK') {
          const placeId = geocodingResponse.data.results[0]?.place_id;

          const placesResponse = await axios.get<{
            status: string;
            result: { name: string } | null;
          }>(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
          );

          if (placesResponse.data.status === 'OK' && placesResponse.data.result) {
            return placesResponse.data.result.name;
          }
        }

        return 'Unknown Location';
      } catch (error) {
        console.error('Error fetching location name:', error.message);
        return 'Unknown Location';
      }
    }

    const locationNames: string[] = []

    for (const destination of destinations) {
      try {
          const locationName = await getLocationName(destination.latitude, destination.longitude)
          locationNames.push(locationName)
      } catch (error) {
          console.error('Error fetching location name:', error)
      }
    }

    return view.render('pdf/dp_region', { form, locationNames})
  }
}
