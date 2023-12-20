import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
// import fs from 'fs/promises';
// import Application from '@ioc:Adonis/Core/Application'
import puppeteer from 'puppeteer'
import Form from 'App/Models/Form';
import Env from "@ioc:Adonis/Core/Env";
import axios from 'axios'
import Route from '@ioc:Adonis/Core/Route'
import Destination from 'App/Models/Destination';

export default class PdfsController {
  // SPDK
  public async showBto({response, params}){
    const url = `${Env.get('BASE_URL')}${Route.makeUrl('pdf.bto', { id: params.id })}`
    // const browser = await puppeteer.launch()
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage()
    await page.emulateMediaType('screen')
    await page.goto(url, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'a4' })

    await browser.close()

    response.header('Content-type', 'application/pdf')
    response.header('Content-Disposition', `inline; filename="Surat-Pengajuan-DP-Dalam-Negeri.pdf"`)

    return response.send(pdf)
  }

  public async generateBto({ view, params }: HttpContextContract) {
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
          .firstOrFail()

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
            displayName: {
              text: string;
              languageCode: string;
            }| null;
          }>(
            `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName&key=${apiKey}`
            // `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
            );
          if (placesResponse.data.displayName) {
            return placesResponse.data.displayName.text;
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

    return view.render('pdf/bto', { form, locationNames})
  }
  //DP dalam negeri
  public async showDpRegion({response, params}){
    const url = `${Env.get('BASE_URL')}${Route.makeUrl('pdf.dpregion', { id: params.id })}`
    // const browser = await puppeteer.launch()
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage()
    await page.emulateMediaType('screen')
    await page.goto(url, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'a4' })

    await browser.close()

    response.header('Content-type', 'application/pdf')
    response.header('Content-Disposition', `inline; filename="Surat-Pengajuan-DP-Dalam-Negeri.pdf"`)

    return response.send(pdf)
  }

  public async generateDpRegion({ view, params }: HttpContextContract) {
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
          .firstOrFail()

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
            displayName: {
              text: string;
              languageCode: string;
            }| null;
          }>(
            `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName&key=${apiKey}`
            // `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
            );
          if (placesResponse.data.displayName) {
            return placesResponse.data.displayName.text;
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

  // DP luar negeri
  public async showDpOutregion({response, params}){
    const url = `${Env.get('BASE_URL')}${Route.makeUrl('pdf.dpoutregion', { id: params.id })}`
    // const browser = await puppeteer.launch()
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage()
    await page.emulateMediaType('screen')
    await page.goto(url, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'a4' })

    await browser.close()

    response.header('Content-type', 'application/pdf')
    response.header('Content-Disposition', `inline; filename="Surat-Pengajuan-DP-Dalam-Negeri.pdf"`)

    return response.send(pdf)
  }

  public async generateDpOutregion({ view, params }: HttpContextContract) {
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
          .firstOrFail()

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
            displayName: {
              text: string;
              languageCode: string;
            }| null;
          }>(
            `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName&key=${apiKey}`
            // `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
            );
          if (placesResponse.data.displayName) {
            return placesResponse.data.displayName.text;
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

    return view.render('pdf/dp_outregion', { form, locationNames})
  }


  // SPDK
  public async showSpdk({response, params}){
    const url = `${Env.get('BASE_URL')}${Route.makeUrl('pdf.spdk', { id: params.id })}`
    // const browser = await puppeteer.launch()
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage()
    await page.emulateMediaType('screen')
    await page.goto(url, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'a4' })

    await browser.close()

    response.header('Content-type', 'application/pdf')
    response.header('Content-Disposition', `inline; filename="Surat-Pengajuan-DP-Dalam-Negeri.pdf"`)

    return response.send(pdf)
  }

  public async generateSpdk({ view, params }: HttpContextContract) {
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
          .firstOrFail()

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
            displayName: {
              text: string;
              languageCode: string;
            }| null;
          }>(
            `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName&key=${apiKey}`
            // `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
            );
          if (placesResponse.data.displayName) {
            return placesResponse.data.displayName.text;
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

    return view.render('pdf/spdk', { form, locationNames})
  }

  // BTE dalam Negeri
  public async showBte({response, params}){
    const url = `${Env.get('BASE_URL')}${Route.makeUrl('pdf.bteregion', { id: params.id })}`
    // const browser = await puppeteer.launch()
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage()
    await page.emulateMediaType('screen')
    await page.goto(url, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'a4' })

    await browser.close()

    response.header('Content-type', 'application/pdf')
    response.header('Content-Disposition', `inline; filename="Surat-Pengajuan-DP-Dalam-Negeri.pdf"`)

    return response.send(pdf)
  }

  public async generateBte({ view, params }: HttpContextContract) {
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
          .firstOrFail()

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
            displayName: {
              text: string;
              languageCode: string;
            }| null;
          }>(
            `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName&key=${apiKey}`
            // `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
            );
          if (placesResponse.data.displayName) {
            return placesResponse.data.displayName.text;
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

    return view.render('pdf/bte_region', { form, locationNames})
  }
  // BTE Luar negeri
  public async showBteLn({response, params}){
    const url = `${Env.get('BASE_URL')}${Route.makeUrl('pdf.bteoutregion', { id: params.id })}`
    // const browser = await puppeteer.launch()
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage()
    await page.emulateMediaType('screen')
    await page.goto(url, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'a4' })

    await browser.close()

    response.header('Content-type', 'application/pdf')
    response.header('Content-Disposition', `inline; filename="Surat-Pengajuan-DP-Dalam-Negeri.pdf"`)

    return response.send(pdf)
  }

  public async generateBteLn({ view, params }: HttpContextContract) {
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
          .firstOrFail()

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
            displayName: {
              text: string;
              languageCode: string;
            }| null;
          }>(
            `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName&key=${apiKey}`
            // `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
            );
          if (placesResponse.data.displayName) {
            return placesResponse.data.displayName.text;
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

    return view.render('pdf/bte_outregion', { form, locationNames})
  }
}
