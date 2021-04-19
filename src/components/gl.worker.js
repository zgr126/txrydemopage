import handleUnit from './handleUnit'
self.onmessage = event => {
  let data = event.data
  switch(data.sign){
    case 'loadZip':
      loadZip(data.data, data.name, data.op)
      console.log('worder')
      break
  }
}
async function loadZip(d, name, op){
  let m = await handleUnit.loadZip(d, name, op)
  postMessage({
    sign: 'loadZip',
    data: m
  })
}

console.error('worker!')