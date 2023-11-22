/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
}).middleware('user')

Route.group(() => {
  Route.get('/test', 'Test/TestMiddlesController.test')

  //Pagu
  Route.get('/uang', 'Misc/UangsController.index')
  Route.get('/uang/:id/get', 'Misc/UangsController.show')
  Route.get('/uang/wilayah/:wilayah/level/:jabatan', 'Misc/UangsController.showByJabatanWilayah')
  Route.put('/uang/:id/update', 'Misc/UangsController.update')

  //Form
  Route.get('/my-spdk', 'User/SpdkController.indexByUser')
  Route.post('/my-spdk/add', 'User/SpdkController.create')
  Route.put('/my-spdk/update/:id', 'User/SpdkController.update')
  Route.put('/my-spdk/cancel/:id', 'User/SpdkController.cancel')

  //DP
  Route.post('/downpayment/add/:id', 'User/PanjarsController.create')
  Route.put('/downpayment/update/:id', 'User/PanjarsController.update')
  Route.get('/downpayment/submit/:id', 'User/PanjarsController.submit')

}).middleware('user')
