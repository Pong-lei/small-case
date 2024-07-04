<script setup>
import { caseListsStore } from './stores/caseLists'
import { onMounted } from 'vue'
const caseStore = caseListsStore()
onMounted(() => {
  console.log(caseStore.lists)
})
</script>

<template>
  <el-container class="mainWrapper">
    <el-header class="titleWrapper">
      <h2>这是一个标题</h2>
    </el-header>
    <el-main>
      <el-scrollbar class="scrollerWrapper">
        <div class="contentWrapper">
          <el-card class="itemCard" shadow="hover"  v-for="item in caseStore.lists" :key="item.path">
            <div class="imgWrapper"></div>
            <template #footer>
              <div class="itemBabel">{{ item.babelName }}</div>
            </template>
          </el-card>
        </div>
      </el-scrollbar>
    </el-main>
  </el-container>
</template>

<style scoped lang="scss">
.mainWrapper {
  height: 100vh;
  width: 100vw;
  .titleWrapper {
    display: flex;
    justify-content: center;
  }
  .contentWrapper {
    display: grid;
    padding: 0 40px;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }
  .scrollerWrapper {
    height: 100%;
  }

  .itemCard {
    cursor: pointer;
    .imgWrapper {
      width: 200px;
      height: 200px;
    }
    .itemBabel {
      display: flex;
      justify-content: center;
    }
  }
}
</style>
