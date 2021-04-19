<template>
  <div class="hello">
    
    <div class="bottom">
      <el-button size="mini" icon="el-icon-position" round v-if="!load3d && isMControls" @click="bottomposition(false)"></el-button>
      <el-button size="mini" icon="el-icon-rank" round v-if="!load3d && !isMControls" @click="bottomposition(true)"></el-button>
      <el-button size="mini" v-if="load3d" :loading="true" round @click="subE(1)">加载中...</el-button>
      <el-button size="mini" icon="el-icon-minus" round @click="subE(1)"></el-button>
      <el-button size="mini" icon="el-icon-plus" round @click="subE(-1)"></el-button>
    </div>
    <canvas id="WebGL-output"></canvas>
    <el-dialog 
      title="" 
      :visible.sync="showdocpng" 
      v-if="showdocpng"
      class="input-width2"
      width="700px"
      :destroy-on-close="true">
      <img :src="docPng">
    </el-dialog>
  </div>
</template>

<script>
import docPng from '../assets/doc.png'
// import work from './gl.worker.js'
// import handleUnit from './handleUnit'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {MapControls} from 'three/examples/jsm/controls/OrbitControls'
import TWEEN from '@tweenjs/tween.js'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'


let camera,scene,renderer,controls,mcontrols
let layers3d = new THREE.Group()
layers3d.name = 'layers3d'
let layers = new THREE.Group()
layers.name = 'layers'
let showLayers = new THREE.Group()
showLayers.name = 'showLayers'
let focusLayer = new THREE.Group()
focusLayer.name = 'focusLayer'
let selectLayer = new THREE.Group()
selectLayer.name = 'selectLayer'
// 项目写死偏移量
let __x = -552000
let __y = -3586000
let tWorker
let tpDatas={} // 当前构件数据, 用来优化大量构件选择
let tpDatas3d={}
let frameId = 0
let tpZips = []
export default {
  name: 'HelloWorld',
  data () {
    return {
      showdocpng: false,
      docPng: docPng,
      mainLst: [],
      mainLst2:[],
      hasFirst: false,
      isMControls: false,
      load3d: false,

      mouseDelay: 0,
      clickX: -1,
      clickY: -1,
      mouseX: -1,
      mouseY: -1,
      isHover: false,
      layerLst: [],
      tableData: [],
      isSelect: false,
      filter: [],
      focusLayerName: '',
      focusLayerProps: [],
      focusLayerSelectProp: '',
      focusLayerSelectPropType: '',
      focusLayerTable:[],
      focusLayerNumbermin: 0,
      focusLayerNumbermax: 1
    }
  },
  props: ['ismini', 'minifile'],
  methods: {
    bottomposition(){
      // camera.rotation.set(camera.rotation.x, camera.rotation.y, 0)
      // console.log(camera.rotation.z)
      // camera.updateProjectionMatrix()
      // camera.updateMatrix()
      
      // camera.position.set(0, 100, 0)
      // camera.rotation.set(-Math.PI/2, 0, 0)
      this.clearSState()
      this.isMControls = !this.isMControls
      if (this.isMControls){
        
        // 3d
        let l = []
        for (let i of this.mainLst){
          let p = tpDatas[i.id].properties
          let check = false
          for (let j of p){
            if (j.i == '高度'){
              check = true
              break
            }
          }
          if (i.isShow && check){
            l.push(i)
            break
          }
        }
        // let __v = true
        // if (__v){
        //   this.calc3dBorder(l)
        //   return 
        // }
        let len = l.length
        if (len != 0){
          this.load3d = true
          this.isMControls = false
        }
        
        for (let i of l){
          let _i = i
          fetch(this.axios.defaults.baseURL + _i.url).then(e=>{
            return e.blob()
          }).then(e=>{

            // let m = handleUnit.loadZip(e, _i.id, '3d')
            // m.then(_e=>{
            //   console.log(_e)
            //   this.load3d = false
            //   this.initLayer3d(_e)
            //   this.isMControls = true
            //   camera.updateMatrixWorld(true)
            //   controls.reset()
            //   mcontrols.reset()
            // })
            tWorker.postMessage({data:e, sign: 'loadZip', name: _i.id, op:{type: '3d', file: _i}})
            tWorker.onmessage = e=>{
                this.load3d = false
                let d = e.data
                if (d.sign == 'loadZip'){
                    d = d.data
                    let v = d.name
                    d.tpData = {[d.name]:d.tpData[v]}
                    this.initLayer3d(d)
                    this.isMControls = true
                    camera.updateMatrixWorld(true)
                    controls.reset()
                    mcontrols.reset()
                }
            }
          })
        }
        controls.reset()
        mcontrols.reset()
      }else{
        let l = layers3d.children
        if (layers3d.children[0]){
          let obj = layers3d.children[0]
          layers3d.remove(obj)
          obj.geometry.dispose()
        }
        
        camera.updateMatrixWorld(true)
        controls.reset()
        mcontrols.reset()
      }
      
      
      // camera.updateWorldMatrix()
    },
    initLayer(d){
      Object.assign(tpDatas, d.tpData)
      let g = new THREE.Geometry()
      for (let i of d.meshData.v){
        g.vertices.push(new THREE.Vector3(i.x, i.y, i.z))
      }
      let color = new THREE.Color('#000000')
      for (let i of d.meshData.f){
        let f = new THREE.Face3(i[0],i[1],i[2])
        f.color = color.clone()
        g.faces.push(f)
      }
      let material = new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors})
      let mesh = new THREE.Mesh(g, material)
      mesh.name = d.name
      layers.add(mesh)
      this.layerLst.push({
        name: mesh.name,
        isShow: false
      })
    },
    initLayer3d(d){
      Object.assign(tpDatas3d, d.tpData)
      let g = new THREE.Geometry()
      for (let i of d.meshData.v){
        g.vertices.push(new THREE.Vector3(i.x, i.y, i.z))
      }
      let color = new THREE.Color('#000000')
      for (let i of d.meshData.f){
        let f = new THREE.Face3(i[0],i[1],i[2])
        f.color = color.clone()
        g.faces.push(f)
      }
      let material = new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors, opacity: .8, transparent: true})
      let mesh = new THREE.Mesh(g, material)
      mesh.name = d.name
      // 3d边框
      console.log(d)
      let m2 = this.calc3dBorder(d)
      m2.name = 'border'
      mesh.add(m2)
      
      layers3d.add(mesh)
      // layers3d.push({
      //   name: mesh.name,
      //   isShow: false
      // })
    },
    init() {

				let cameraOutput = document.getElementById('WebGL-output')
        cameraOutput.addEventListener('mousedown', this.onDocumentMouseDown, true)
        cameraOutput.addEventListener('mousemove', this.onDocumentMouseMove, true)
        cameraOutput.addEventListener('mouseup', this.onDocumentMouseUp, true)
        cameraOutput.addEventListener('mouseenter', ()=>{this.isHover = false})
        cameraOutput.addEventListener('mouseleave', ()=>{this.isHover = false})
        
        cameraOutput.addEventListener('touchstart', this.onDocumentMouseDown, true)
        cameraOutput.addEventListener('touchend', this.onDocumentMouseUp, true)
        var context = cameraOutput.getContext('webgl')

				camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.001, 200000000 );
				camera.position.set(0, 100, 0)

				// scene

        scene = new THREE.Scene()
        window.THREE = THREE
        window.scene = scene
        window.camera = camera
        var ambientLight = new THREE.AmbientLight( 0xcccccc, 1 );
        ambientLight.name = 'light'
				scene.add( ambientLight );
        
        scene.add( camera )
        // scene.add(layers)
        // layers.visible = false
        showLayers.scale.set(0.01,0.01,0.01)
        showLayers.rotation.set(-Math.PI/2, 0, 0)
        scene.add(showLayers)

        selectLayer.scale.set(0.01,0.01,0.01)
        selectLayer.rotation.set(-Math.PI/2, 0, 0)
        scene.add(selectLayer)

        focusLayer.scale.set(0.01,0.01,0.01)
        focusLayer.rotation.set(-Math.PI/2, 0, 0)
        scene.add(focusLayer)

        layers3d.scale.set(0.01,0.01,0.01)
        layers3d.rotation.set(-Math.PI/2, 0, 0)
        scene.add(layers3d)
        // let planeG = new THREE.PlaneGeometry(100000,100000,1,1)
        // let planeM = new THREE.MeshBasicMaterial({color: 0x000000})
        // let plane = new THREE.Mesh(planeG, planeM)
        // plane.name = 'plane'
        // plane.rotation.set(-Math.PI/2,0,0)
        // scene.add(plane)
				// model
        
        
				var onProgress = function ( xhr ) {

					if ( xhr.lengthComputable ) {

						var percentComplete = xhr.loaded / xhr.total * 100;
						console.log( Math.round( percentComplete, 2 ) + '% downloaded' );

					}

				};

				var onError = function () { };


				renderer = new THREE.WebGLRenderer({ canvas: cameraOutput, context: context })
				renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor(0xeeeeee,1.0);
				// container.appendChild( renderer.domElement );

				// document.addEventListener( 'mousedown', this.onDocumentMouseDown, false );

				//

        window.addEventListener( 'resize', this.onWindowResize, true );
        this.onWindowResize()
        controls = new OrbitControls( camera, renderer.domElement );
				// controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
				// controls.dampingFactor = 0.1;
				controls.screenSpacePanning = false;
        controls.maxPolarAngle = 1.5
        controls.minPolarAngle = 0
				controls.minDistance = 0.000001;
        controls.maxDistance = 500;
        controls.saveState()

        mcontrols = new MapControls( camera, renderer.domElement );
				// mcontrols.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
				// mcontrols.dampingFactor = 0.1;
        mcontrols.enableRotate = false
				mcontrols.screenSpacePanning = false;

				mcontrols.minDistance = 0.000001;
        mcontrols.maxDistance = 500;
        mcontrols.saveState()
        // controls.enablePan = false
        // controls.enableZoom = false

        // controls.maxPolarAngle = Math.PI / 2;
        this.animate()
      },
    initHelper(){
      let help = new THREE.AxisHelper(20,2)
      // let help = new THREE.GridHelper(20,2,0xcccccc, 0x6aa6ff)
      help.position.z -= 0.00001
      scene.add(help)
    },
    render(){
      // bTextrue1.needsUpdate = true
      controls.enabled = true
      mcontrols.enabled = false
      // if (this.isMControls){
      //   // controlsSign = false
      //   controls.enabled = true
      //   mcontrols.enabled = false
      // }else{
      //   controls.enabled = false
      //   mcontrols.enabled = true
      // }
      
      TWEEN.update();
      
      // panoControl.update()
      if (renderer){
        renderer.render( scene, camera );
      }else{
        cancelAnimationFrame(frameId)
      }
      
    },
    animate(){
      frameId = requestAnimationFrame( this.animate );
      this.render();
    },
    onWindowResize() {
      let cameraOutput = document.getElementById('WebGL-output')
      let p = cameraOutput.parentElement
      let h = p.clientHeight
      let w = p.clientWidth
      let windowHalfX = w / 2;
      let windowHalfY = h / 2;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize( w, h );

    },
    onDocumentMouseDown (e) {
      this.clickX = e.offsetX || e.changedTouches[0].clientX
      this.clickY = e.offsetY || e.changedTouches[0].clientY
      this.isHover = true
    },
    onDocumentMouseMove (e) {
      this.mouseX = e.offsetX || e.changedTouches[0].clientX
      this.mouseY = e.offsetY || e.changedTouches[0].clientY
      // let mouse = {}
      // mouse.x = (clickX / window.innerWidth) * 2 - 1
      // mouse.y = -(clickY / window.innerHeight) * 2 + 1
      if (this.isHover)return
      let getObj = this.getMouseMoveObject()
      if (getObj){
        if (focusLayer.children[0]){
          if (focusLayer.children[0].suuid === getObj.uuid){
            return
          }else{
            focusLayer.remove(focusLayer.children[0])
          }
        }
        
        let o = getObj.clone()
        o.material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true})
        o.suuid = getObj.uuid
        
        
        focusLayer.add(o)
        
        if (!this.isSelect){
          let kvLst = Object.entries(getObj.properties)
          this.tableData = []
          for (let i of kvLst){
            this.tableData.push({
              key: i[0],
              value: i[1]
            })
          }
        }
        
      }
      if (getObj == false){
        if (!this.isSelect){
          this.tableData = []
          
        }
        if (focusLayer.children[0])  focusLayer.remove(focusLayer.children[0])
      }
      
      
    },
    onDocumentMouseUp (e) {
      this.isHover = false
      if (this.clickY == -1) return
      let clickX = e.offsetX || e.changedTouches[0].clientX
      let clickY = e.offsetY || e.changedTouches[0].clientY
      let far = Math.abs(this.clickX - clickX) + Math.abs(this.clickY - clickY)
      if (far > 3 ) return 
      e.preventDefault()
      let getObj = this.getMouseObject()
      if (getObj){
        
        if (selectLayer.children[0]){
          if (selectLayer.children[0].suuid === getObj.uuid){
            return
          }else{
            selectLayer.remove(selectLayer.children[0])
          }
        }
        
        let o = getObj.clone()
        o.material = new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true})
        o.suuid = getObj.uuid
        selectLayer.add(o)
        let kvLst = Object.entries(getObj.properties)
        this.tableData = []
        for (let i of kvLst){
          this.tableData.push({
            key: i[0],
            value: i[1]
          })
        }
        this.isSelect = true
      }
      if (getObj == false){
        this.isSelect = false
        this.tableData = []
        this.clearSState()
      }
      
      this.clickX = -1
      this.clickY = -1
    },
    getMouseMoveObject(){
      // delay
      this.mouseDelay += 1
      if (this.mouseDelay % 2 !== 1){
        return
      }
      if (this.isHover){
        return
      }
      return this.getMouseObject()
    },
    getMouseObject(){
      let dom = document.getElementById('WebGL-output')
      let w = dom.clientWidth
      let h = dom.clientHeight
      let mouse = {}
      mouse.x = (this.mouseX / w) * 2 - 1
      mouse.y = -(this.mouseY / h) * 2 + 1
      var raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      raycaster.far = 100000
      raycaster.near = 0.01
      raycaster.params.Line.threshold = .5;
      // scene.add(layers)
      // let _l = scene.getObjectByName('layers')
      // scene.updateMatrixWorld(true);
      // let checkLst = [_l]
      // for (let i of layers.children){
      //     checkLst.push(i)
      // }
      // let childrens = []
      // function getChildrenfromGroup(group){
      //   if (group.isGroup){
      //     for (let i of group.children){
      //       getChildrenfromGroup(i)
      //     }
      //   }else{
      //     childrens.push(group)
      //   }
      // }
      // getChildrenfromGroup(_l)
      let checkLst = []
      // let b = scene.getObjectByName('showLayers')
      checkLst.push(...showLayers.children)
      checkLst.push(...layers3d.children)
      var intersects = raycaster.intersectObjects(checkLst, true)
      // scene.remove(layers)
      let selectObj = null
      if (intersects.length > 0){
        // console.error(intersects[0])
        // console.log(tpDatas)
        let _obj = this.getTpDataFromVertex(intersects[0].object.name, intersects[0].face.b, intersects[0].object.geometry)
        
        // let p = new THREE.BoxGeometry(1,1,1)
        // let m = new THREE.MeshBasicMaterial({color: 0x00ff00})
        // let mesh = new THREE.Mesh(p,m)
        // let ppp = intersects[0].point.clone()
        // mesh.position.set(ppp.x,ppp.y,ppp.z)
        // scene.add(mesh)
        return _obj
        
      }else{
        return false
        
      }
    },
  },
  watch: {
    datas(o,n){
      console.log(o,n)
    }
  },
  destroyed(){
    // requestAnimationFrame(e=>{})
    // scene = undefined
    // camera = undefined
    
    // controls = undefined
    // mcontrols = undefined
    
    layers3d = new THREE.Group()
    layers = new THREE.Group()
    showLayers = new THREE.Group()
    focusLayer = new THREE.Group()
    selectLayer = new THREE.Group()
    // let camera,scene,renderer,controls,mcontrols
    tpDatas={} // 当前构件数据, 用来优化大量构件选择
    tpDatas3d={}
    tpZips = []
    tWorker.terminate()
    // tWorder = undefined
    window.removeEventListener( 'resize', this.onWindowResize, true );
    renderer.dispose();
    renderer.forceContextLoss();
    // renderer.context = null;
    // renderer.domElement = null;
    renderer = null;
  },
  mounted(){
    // console.log(tWorker)
    // tWorker = new work()
    this.init()
    this.initHelper()
    
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="stylus">
.hello
  padding 0
  margin 0
  height 100%
  width 100%
  overflow hidden
  position relative
#WebGL-output
  padding 0
  margin 0
  overflow hidden
.left
  width: 312px;
  height: calc(100% - 40px)
  margin 20px 0
  position: absolute;
  background: white;
  overflow: auto;
  .label
    display: inline-block;
    height: 40px;
    background: #3d5e80;
    color: #fff;
    width: 100%;
    line-height: 40px;
    text-align: center;
    position relative
    .doc
      cursor pointer
      position: absolute;
      top: 50%;
      margin-top: -8px;
      right: 10px;
  .labelbox
    padding 10px
    position relative
    .closeshaxuan
      position: absolute;
      top: 11px
      right: 11px;
      height: 20px;
      width: 20px;
      padding: 0px;
      line-height: 5px;
    .boxitem
      padding 10px 0 
      box-sizing border-box
      border-bottom: solid 1px #eaeaea;
    .l1, .l2, .l3
      display inline-block
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      
    .l1
      width 140px
    .l2
      width 80px
      vertical-align: baseline;
      line-height 1
    .l3
      width 50px
      text-align center
    .numinput
      width 70px
    .colorinput
      vertical-align: middle;
      float: right;
    .label_item
      margin 10px 0
      color #3d5e80
    .colorbutton
      width: 100%;
      margin: 10px 0;
    &.labelborder
      margin 10px
      padding 0 10px 10px 10px
      border: solid 1px #eaeaea;
      border-radius: 5px;
      .addcolorbutton, .subcolorbutton
        display: inline-block;
        width: 20px;
        padding: 3px;
        position: absolute;
        right: 32px;
      .subcolorbutton
        right 74px
    .filteritem
      border-bottom: solid 1px #eaeaea;
      padding: 10px;
/deep/ .el-table td , .el-table th
  background-color: inherit;
  padding 0
/deep/ .el-table .cell
  line-height 20px
  
.right
  width: 240px;
  position: absolute;
  right: 0;
  // height: 90%;
  overflow-y: auto;
  font-size: 12px;
  margin: 10px;
  border-radius: 5px;
  pointer-events: none;
  max-height: 90%;
  .rightcontent
    pointer-events: auto;
  // pointer-events: none; // 属性过多导致无法翻页
  /deep/ th 
    padding 0
  label
    display: inline-block;
    height: 30px;
    background: #3d5e80;
    color: #fff;
    width: 100%;
    line-height: 30px;
    text-align: center;
.bottom
  position: absolute;
  bottom: 20px;
  left: 50%;
.input-width2
  /deep/ .el-dialog__header
    padding 0
  /deep/ .el-dialog__body 
    text-align: center;
</style>
