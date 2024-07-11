<template>
  <el-scrollbar class="scrollerWrapper">
    <div class="contentWrapper">
      <template v-for="item in caseStore.lists" :key="item.path">
        <el-card v-if="!item.ishidden" @click="handleClick(item)" class="itemCard" shadow="hover">
          <div class="imgWrapper">
            <el-image  :src="item.img" :fit="scale-down" />
          </div>
          <template #footer>
            <div class="itemBabel">{{ item.babelName }}</div>
          </template>
        </el-card>
      </template>
    </div>
  </el-scrollbar>
</template>

<script setup>
import { caseListsStore } from '../../stores/caseLists'
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
let caseStore = caseListsStore()

const handleClick = (card) => {
  router.push({ path: card.path })
}
onMounted(()=>{
  console.log(caseStore.lists);
})
</script>

<style lang="scss" scoped>
.contentWrapper {
  display: grid;
  padding: 0 40px;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  :deep(.el-card__body){
    padding: 0;
  }
}
.scrollerWrapper {
  height: 100%;
}

.itemCard {
  min-width: 200px;
  cursor: pointer;
  .imgWrapper {
    height: 197px;
  }
  .itemBabel {
    display: flex;
    justify-content: center;
  }
}
</style>