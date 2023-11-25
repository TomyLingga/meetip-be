/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/
import Event from '@ioc:Adonis/Core/Event'
import User from 'App/Models/User'
import puppeteer from 'puppeteer'
​
interface SendInvoice {
  user: User
  recipient: { name: string, email: string }
  signedInvoicePath: string
}
​
Event.on('send:invoice', async ({ user, recipient, signedInvoicePath }: SendInvoice) => {
  // TODO
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.emulateMediaType('screen')
})
