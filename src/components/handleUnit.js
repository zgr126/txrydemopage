import * as THREE from 'three'
import shp from 'shpjs'
import JSZip from 'jszip'
import iconv from 'iconv-lite'

let __x = -552000
let __y = -3586000
let tpDatas = {}
let num = 0
async function loadZip(d, name,op){
  let data = await _loadZip(d, op.file)
  let mesh = initLayer(data.features, name, op)
  let mDatas = {
      v: mesh.geometry.vertices,
      f: []
  }
  let l = mesh.geometry.faces.length
  let v = mesh.geometry.vertices
  let f = mesh.geometry.faces
  for (let i = 0;i<l;i++){
    mDatas.f.push([f[i].a,f[i].b,f[i].c])
    // mDatas.c.push([f[i].color.r, f[i].color.g, f[i].color.b])
  }
  return {
    tpData: tpDatas,
    meshData: mDatas,
    name: mesh.name,
    // lineBox: mesh.__line
  }
}
async function _loadZip(_data, file){
  let zip = new JSZip()
  let d = await lzip()
  return d
  async function lzip(){
    return await zip.loadAsync(_data,{
      decodeFileName: function (bytes) {
          return iconv.decode(bytes, 'gbk');
      }
    }).then((data)=>{
      return formatData(data)
    })
  }
  async function formatData(data){
    let fileName = Object.keys(data.files)[0].split('.')[0]
    console.log(fileName)
    let shpfile = data.files[`${fileName}.shp`].async("arraybuffer")
    // shpfile.then(function (blob) {
    //   console.log(blob)
    //   let a = iconv.decode(blob, 'cp936')
    //   console.log(a)
    //   return a

    //   return blob
    // })
    let dbffile = data.files[`${fileName}.dbf`].async("arraybuffer")
    // dbffile.then(function (blob) {
    //   console.log(blob)
    //   let a = iconv.decode(blob, 'cp936')
    //   console.log(a)
    //   // return a
    //   // return blob
    // })
    return await Promise.all([shpfile, dbffile]).then(v=>{
      
      return formatShp(v, fileName)
        // that.$refs['gl'].initLayer(r.features, fileName, _type);
    })
  }
  async function formatShp(v, fileName) {
    // let d = iconv.decode(v[0], 'gbk')
    // let d2 = iconv.decode(v[1], 'gbk')
    let d = v[0]
    let d2 = v[1]

    // var hex = 'cp936'
    // var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
    //   return parseInt(h, 10)
    // }))
    // var buffer = typedArray.buffer
    // function toBuffer(ab) {
    //     var buf = new Buffer(ab.byteLength);
    //     var view = new Uint8Array(ab);
    //     for (var i = 0; i < buf.length; ++i) {
    //         buf[i] = view[i];
    //     }
    //     return buf;
    // }
    // let buf = toBuffer(v[1])
    // let s = iconv.decode(buf, 'gbk')
    // let sssv = iconv.encode(s,'utf8')
    
    // let buff = sssv.buffer
    // console.log(111111111111111111)
    // console.log(v[1])
    // console.log(buff)
    // console.log(iconv.encodingExists('gbk'))
    let r = shp.combine([shp.parseShp(d), shp.parseDbf(v[1], file.codeFormat)])
    return await {
      features: r.features,
      name: fileName,
    }
  }
}
function initLayer(e, fileName, op){
  let type = op && op.type
    // type 数据类型 建筑 道路。。。。
    
    let box = new THREE.Group()
    box.name = 'group'
    tpDatas[fileName] = {
      datas:[],
      _tempDatas: [], // 临时数据，用于统计数量
      _tempFaceDatas: [],// 临时数据，用于统计face数量
      properties: []
    }
    let linesBox = [] //3d模式边框
    // this.layerLst.push({
    //   name: fileName,
    //   isShow: false
    // })
    var material = new THREE.MeshBasicMaterial({color: 0x000000})
    let newPolygon = (geoLst, properties)=>{
      var shape = new THREE.Shape()
      if (geoLst.length<3){
        return 
      }
      for (let i = 0;i< geoLst.length;i++) {
        if (i == 0) {
          shape.moveTo(geoLst[i][0]+__x,geoLst[i][1]+__y)
        }else{
          shape.lineTo(geoLst[i][0]+__x,geoLst[i][1]+__y)
        }
      }
      let _g 
      if (type == '3d'){
        // 建筑模型立体
        _g = new THREE.ExtrudeGeometry(//拉伸造型
          shape,//二维轮廓
          //拉伸参数
          {
            amount:properties['高度'], //拉伸长度
            bevelEnabled:false //无倒角
          }
        )
        let _l = []
        for (let i of shape.curves){
          _l.push([i.v1.x, i.v1.y, properties['高度']])
        }
        // linesBox.push(_l)
      }else{
        _g = new THREE.ShapeGeometry(shape)
      }
      
      
      let mesh = new THREE.Mesh(_g, material)
      mesh.properties = properties
      mesh.visible = true
      return mesh
    }
    
    function newLine(geoLst, properties){
      let points = []
      for (let i of geoLst){
        points.push( new THREE.Vector3(i[0]+__x,i[1]+__y, 0))
      }
      let curve = new THREE.CatmullRomCurve3(points)
      let geometry = new THREE.TubeGeometry(curve, 8,6,3, false)
      var line = new THREE.Mesh(geometry, material);

      line.properties = properties
      line.visible = true
      return line
    }
    function newPoint(geoXY, properties){
      var geometry = new THREE.SphereGeometry(30,8,12);
      var mesh = new THREE.Mesh(geometry,material);
      mesh.properties = properties
      mesh.visible = true
      mesh.position.set(geoXY[0]+__x, geoXY[1]+__y, 0)
      mesh.updateMatrix()
      return mesh
    }
    let buildUnit = (_v)=>{
      e.map(e=>{
        let p = e.geometry.type
        p = p.toLowerCase()
        let mesh
        
        let _properties = e.properties

        if (p.indexOf('polygon') !== -1){
          for (let i of e.geometry.coordinates){
            mesh = newPolygon(i, _properties)
          }
        }else if(p.indexOf('line') !== -1){
          // for (let i of e.geometry.coordinates){
            mesh = newLine(e.geometry.coordinates, _properties)
          // }
        }else if(p.indexOf('point') !== -1){
            mesh = newPoint(e.geometry.coordinates, _properties)
        }
        if (!mesh) return
        box.add(mesh)
        let _v = mesh.geometry.vertices
        let _vf = mesh.geometry.faces
        let s = tpDatas[fileName]._tempDatas.length
        let sf = tpDatas[fileName]._tempFaceDatas.length
        let l = _v.length
        let lf = _vf.length
        
        tpDatas[fileName].datas.push({
          s: s,
          e: s + l-1,
          l: l,
          sf: sf,
          lf: lf,
          ef: sf+lf-1,
          p: _properties,
          // g: mesh.geometry
        })
        tpDatas[fileName]._tempDatas.push(..._v)
        tpDatas[fileName]._tempFaceDatas.push(..._vf)
      })
    }
    buildUnit()
    tpDatas[fileName]._tempDatas = []
    tpDatas[fileName]._tempFaceDatas=[]
    let data0p = tpDatas[fileName].datas[0].p
    for (let i in data0p){
      switch (typeof data0p[i]) {
        case 'string':
          tpDatas[fileName].properties.push({
            i,type:'string'
          })
          break;
        case 'number':
          tpDatas[fileName].properties.push({
            i,type:'number'
          })
          break;
        default:
          break;
      }
      
    }
    let _mesh = mergeUnits(box)
    // let _mesh = new THREE.Mesh(new THREE.Geometry(), material)
    // for (let i of box.children){
    //   _mesh.add(i)
    // }
    _mesh.name = fileName
    // 3d模式加边框
    if (type == '3d'){
      
      // _mesh.__line = linesBox
    }
    return _mesh
}


function  mergeUnits(box){
    let g = new THREE.Geometry()
    let c = new THREE.Color(0x000000)
    let material = new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors})
    let m = new THREE.Mesh(g, material)
    for (let i of box.children){
        g.merge(i.geometry.clone(), i.matrix)
    }
    for (let i of g.faces){
        i.color = c.clone()
    }
    g.colorsNeedUpdate = true
    
    m.scale.set(0.01,0.01,0.01)
    m.rotation.set(-Math.PI/2,0,0)
    return m
}

export default {
    loadZip
}