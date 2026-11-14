import { router } from 'expo-router';

/** Parts of full Wise that are not in the prototype open a short note instead of a wrong screen. */
export function openDemo(title: string) {
  router.push({ pathname: '/demo-note', params: { title } });
}
