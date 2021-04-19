<template>
    <div>
      <pdf 
        ref="pdf"
        :src="url"
      >
      </pdf>
    </div>
</template>

<script>
import pdf from 'vue-pdf'
export default {
  components:{
      pdf
  },
  data(){
      return {
          url:"http://image.cache.timepack.cn/nodejs.pdf",
      }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="stylus">
.framebox
  height 100%
#show-iframe
  height 100%
  width 100%
</style>
