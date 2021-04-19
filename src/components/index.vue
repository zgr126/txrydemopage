<template>
  <div class="contentpage">
      <bk ref="gl"></bk>
      <!-- <loadzip></loadzip> -->
  </div>
</template>

<script>

import bk from './bk'
export default {
    data(){
        return{
            
        }
    },
    methods:{
        // addZip(name, _type){
        //     let that = this
        //     fetch(`./${name}.zip`).then(function(response) {
        //         return response.blob();
        //     }).then(_data=>{
        //         let w = new work()
        //         w.postMessage({data:_data, sign: 'loadZip'})
        //         w.onmessage = e=>{
        //             let d = e.data
        //             if (d.sign == 'loadZip'){
        //                 d = d.data
        //                 that.$refs['gl'].initLayer(d);
        //             }
        //             // console.log(JSON.parse(e.data))
        //             // scene.add(e.data)
        //         }
        //         // let zip = new JSZip()
        //         // zip.loadAsync(_data,{
        //         // decodeFileName: function (bytes) {
        //         //     return iconv.decode(bytes, 'gbk');
        //         // }
        //         // }).then((data)=>{
        //         // let fileName = Object.keys(data.files)[0].split('.')[0]
        //         // console.log(fileName)
        //         // let shpfile = data.files[`${fileName}.shp`].async("arraybuffer")
        //         // shpfile.then(function (blob) {
        //         //     return blob
        //         // })
        //         // let dbffile = data.files[`${fileName}.dbf`].async("arraybuffer")
        //         // dbffile.then(function (blob) {return blob})
        //         // Promise.all([shpfile, dbffile]).then(v=>{
        //         //     let r = shp.combine([shp.parseShp(v[0], /*optional prj str*/),shp.parseDbf(v[1])])
        //         //     console.log(r.features)
        //         //     that.$refs['gl'].initLayer(r.features, fileName, _type);
        //         // })
        //         // let read = new FileReader()
        //         // read.blob
        //         // shp.combine([shp.parseShp(shpBuffer, /*optional prj str*/),shp.parseDbf(dbfBuffer)]);
        //         // shp(_data).then(function(geojson){
        //         //   console.log(geojson)
        //         // //see bellow for whats here this internally call shp.parseZip()
        //         // });
        //         // })
        //     })
        // },
    },
    mounted(){
        // this.addZip('daolu')
        // this.addZip('jianzhu', 'building')
        
    },
    components:{
        bk
    }
}
</script>

<style lang="stylus" scoped>
.contentpage
    height 100%
    width 100%
    overflow hidden
</style>