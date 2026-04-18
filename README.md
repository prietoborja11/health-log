# HealthLog — Nuxt 3 + Tailwind

App personal de seguimiento de salud, nutrición y ejercicio.

## Stack

- **Nuxt 3** — framework Vue con file-based routing
- **Tailwind CSS** — estilos utility-first con tema personalizado
- **Pinia** — estado global con persistencia en localStorage
- **Chart.js** — gráficos (área, barras, líneas, donut)
- **TypeScript** — tipado estricto en todo el proyecto

## Estructura

```
health-log/
├── types/index.ts          ← Todos los tipos TypeScript
├── utils/
│   ├── calculations.ts     ← BMI, porcentajes, sumas
│   └── dates.ts            ← Helpers de fechas
├── stores/app.ts           ← Estado global (Pinia) + localStorage
├── composables/useChat.ts  ← Lógica del chat con IA
├── assets/css/main.css     ← Tailwind + clases globales
├── components/
│   ├── layout/             ← AppHeader, AppNav
│   ├── ui/                 ← StatCard, Modal, ProgressBar
│   ├── charts/             ← CaloriesChart, WeightChart, MacroPie
│   └── forms/              ← MealForm, ExerciseForm, BodyForm, ProfileForm
└── pages/
    ├── index.vue           ← Dashboard
    ├── meals.vue           ← Comidas
    ├── exercise.vue        ← Ejercicio
    ├── body.vue            ← Parámetros corporales
    └── chat.vue            ← Chat IA
```

## Instalación y desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Arrancar en modo desarrollo
npm run dev
# → Abre http://localhost:3000
```

## Deploy a GitHub Pages

```bash
# 1. Generar build estático
npm run generate

# 2. El output estará en .output/public/
# Sube esa carpeta a GitHub Pages o Netlify
```

## Chat IA — API Key

La pestaña IA requiere una API Key de Anthropic:
1. Regístrate en https://console.anthropic.com
2. Crea una API Key en "API Keys"
3. En la app, ve a ◈ IA → 🔑 API Key → pégala

La key se guarda en `localStorage` del navegador (solo en tu dispositivo).

## iPhone — Pantalla de inicio

1. Haz `npm run generate`
2. Sube `.output/public/` a GitHub Pages → obtienes una URL pública
3. Abre esa URL en **Safari** en tu iPhone
4. Compartir → "Añadir a pantalla de inicio"

La app funciona como PWA: pantalla completa, sin barra del navegador.
