import { defineStore } from 'pinia';
import { routes } from '../router';

export const caseListsStore = defineStore('caseLists', {
  state: () => ({
    lists: routes
  }),
});
