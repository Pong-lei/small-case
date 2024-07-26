<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
const handleClick = () => {
  router.push({ path: "/" });
};

</script>
<template>
  <el-container class="mainWrapper">
    <el-header>
      <div class="titleWrapper">
        <el-button class="backRouter" @click="handleClick" type="primary"
          >返回</el-button
        >
        <h2>这是一个标题</h2>
      </div>
    </el-header>
    <el-main>
      <router-view />
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
    align-content: center;
  }
  .backRouter {
    position: absolute;
    left: 20px;
    top: 20px;
    z-index: 100;
  }
}
</style>
