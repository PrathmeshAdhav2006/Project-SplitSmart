import { apiClient } from './client'
import { mockApi } from '../mockApi'

export const appApi = import.meta.env.VITE_USE_BACKEND === 'true' ? apiClient : mockApi
