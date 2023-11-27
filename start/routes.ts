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

  //Pemberi Tugas
  Route.get('/assignor/index', 'User/BtosController.indexPemberiTugas')
  Route.get('/assignor/approve/:id', 'User/BtosController.approveBto')
  Route.put('/assignor/decline/:id', 'User/BtosController.declineBto')

  //Form
  Route.get('/my-spdk', 'User/SpdkController.indexByUser')
  Route.get('/index-spdk/detail/:id', 'User/SpdkController.detailByUser')
  Route.post('/my-spdk/add', 'User/SpdkController.create')
  Route.put('/my-spdk/update/:id', 'User/SpdkController.update')
  Route.put('/my-spdk/cancel/:id', 'User/SpdkController.cancel')

  //DP
  Route.post('/downpayment/add/:id', 'User/PanjarsController.create')
  Route.put('/downpayment/update/:id', 'User/PanjarsController.update')
  Route.get('/downpayment/submit/:id', 'User/PanjarsController.submit')

}).middleware('user')

Route.get('/pdf/dpregion/:id', 'Misc/PdfsController.generateDpRegion').as('pdf.dpregion')
Route.get('/pdf/:id/pengajuan-panjar-dalam-negeri', 'Misc/PdfsController.showDpRegion')

Route.get('/pdf/dpoutregion/:id', 'Misc/PdfsController.generateDpOutregion').as('pdf.dpoutregion')
Route.get('/pdf/:id/pengajuan-panjar-luar-negeri', 'Misc/PdfsController.showDpOutregion')

//Lampiran
// Route.get('/spdk/:filename/lampiran', 'Misc/PdfsController.showLampiran')

Route.group(() => {
  //Form
  Route.get('/index-spdk', 'Admin/FormsAdminController.index')

}).middleware('hc')

Route.group(() => {

  //Panjar
  Route.get('/panjar-spdk/approve/:id', 'Admin/FormsAdminController.approvePanjar')
  Route.put('/panjar-spdk/revisi/:id', 'Admin/FormsAdminController.revisiPanjar')

  //SPDK
  Route.put('/surat-spdk/create/:id', 'Admin/FormsAdminController.createSurat')

}).middleware('admin')
