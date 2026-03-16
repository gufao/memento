import { createBro } from '@bro-sdk/web'

export const bro = createBro({
  apiKey: import.meta.env.VITE_BRO_API_KEY || '',
  autoPageView: true,
})
