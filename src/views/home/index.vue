<template>
  <el-scrollbar class="scrollerWrapper">
    <div class="contentWrapper">
      <el-card
        @click="handleClick(item)"
        class="itemCard"
        shadow="hover"
        v-for="item in caseStore.lists.slice(1)"
        :key="item.path"
      >
        <div class="imgWrapper"></div>
        <template #footer>
          <div class="itemBabel">{{ item.babelName }}</div>
        </template>
      </el-card>
    </div>
  </el-scrollbar>
</template>

<script setup>
import { caseListsStore } from "../../stores/caseLists";
import { onMounted, reactive } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
let caseStore = caseListsStore();

const handleClick = (card) => {
  router.push({ path: card.path });
};
</script>

<style lang="scss" scoped>
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
    min-width: 200px;
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
</style>