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

// Route.get('/', async () => {
//   return { hello: 'world' }
// }).middleware('user')

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

  //Teruskan
  Route.get('/superior/index', 'Manager/SuratsController.indexTeruskan')
  Route.get('/superior/approve/:id', 'Manager/SuratsController.approveSpdk')
  Route.put('/superior/decline/:id', 'Manager/SuratsController.declineSpdk')

  //Report
  Route.post('/report/add/:id', 'User/BtesController.addReport')
  Route.put('/report/update/:id', 'User/BtesController.updateReport')

  //Destination
  Route.put('/destination/attend/:id', 'User/BtesController.attendDestination')

  //BTE
  Route.post('/bte/add/:id', 'User/BtesController.createBte')
  Route.put('/bte/update/:id', 'User/BtesController.updateBte')
  Route.put('/bte/submit/:id', 'User/BtesController.submitBte')
}).middleware('user')

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
  Route.put('/surat-spdk/submit/:id', 'Admin/FormsAdminController.submitSurat')

}).middleware('admin')

Route.get('/pdf/dpregion/:id', 'Misc/PdfsController.generateDpRegion').as('pdf.dpregion')
Route.get('/pdf/:id/pengajuan-panjar-dalam-negeri', 'Misc/PdfsController.showDpRegion')

Route.get('/pdf/dpoutregion/:id', 'Misc/PdfsController.generateDpOutregion').as('pdf.dpoutregion')
Route.get('/pdf/:id/pengajuan-panjar-luar-negeri', 'Misc/PdfsController.showDpOutregion')

Route.get('/pdf/spdk/:id', 'Misc/PdfsController.generateSpdk').as('pdf.spdk')
Route.get('/pdf/:id/perintah-perjalanan-dinas', 'Misc/PdfsController.showSpdk')

Route.get('/pdf/bto/:id', 'Misc/PdfsController.generateBto').as('pdf.bto')
Route.get('/pdf/:id/bto', 'Misc/PdfsController.showBto')

Route.get('/pdf/bteregion/:id', 'Misc/PdfsController.generateBte').as('pdf.bteregion')
Route.get('/pdf/:id/bte-dalam-negeri', 'Misc/PdfsController.showBte')

Route.get('/pdf/bteoutregion/:id', 'Misc/PdfsController.generateBteLn').as('pdf.bteoutregion')
Route.get('/pdf/:id/bte-luar-negeri', 'Misc/PdfsController.showBteLn')
