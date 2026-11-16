import type { Plugin } from 'vite'

export function precacheUrls(bundleFiles: string[], dataFiles: string[]): string[]
export function renderServiceWorker(template: string, urls: string[], version: string): string
export function serviceWorker(options?: { publicDir?: string }): Plugin
