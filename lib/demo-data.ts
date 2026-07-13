import type { AINews, AITool, Experiment, KnowledgeItem } from "./types";

export const demoTools: AITool[] = [
  { id: "1", name: "Claude", category: "Езиков модел", description: "Усъвършенстван AI асистент за проучвания, анализи и работа с дълги текстове.", website_url: "https://claude.ai", status: "Активен", rating: 4.9, created_at: "2026-07-05T10:00:00Z", is_favorite: true },
  { id: "2", name: "Midjourney", category: "Генериране на изображения", description: "Създаване на висококачествени изображения и разработване на визуални концепции.", website_url: "https://midjourney.com", status: "Активен", rating: 4.8, created_at: "2026-07-03T10:00:00Z", is_favorite: true },
  { id: "3", name: "Perplexity", category: "Проучвания", description: "AI търсачка за проучвания с цитирани източници.", website_url: "https://perplexity.ai", status: "В тестване", rating: 4.6, created_at: "2026-06-28T10:00:00Z", is_favorite: false },
  { id: "4", name: "Cursor", category: "Разработка", description: "Редактор на код с AI за бърза продуктова разработка.", website_url: "https://cursor.com", status: "Активен", rating: 4.7, created_at: "2026-06-24T10:00:00Z", is_favorite: true },
  { id: "5", name: "ElevenLabs", category: "Аудио", description: "Естествен синтез на глас и разговорно аудио.", website_url: "https://elevenlabs.io", status: "В тестване", rating: 4.5, created_at: "2026-06-19T10:00:00Z", is_favorite: false },
];

export const demoNews: AINews[] = [
  { id: "1", title: "Отворените модели стопяват разликата в корпоративната производителност", summary: "Нови оценки показват, че по-малки специализирани модели се конкурират успешно при важни бизнес задачи.", source_url: "https://example.com/open-models", category: "Модели", published_date: "2026-07-09", created_at: "2026-07-09T09:00:00Z" },
  { id: "2", title: "AI агентите преминават от пилотни проекти към реална употреба", summary: "Екипите се фокусират върху надеждност, наблюдаемост и ясни граници за човешко одобрение.", source_url: "https://example.com/agents", category: "Индустрия", published_date: "2026-07-08", created_at: "2026-07-08T09:00:00Z" },
  { id: "3", title: "Мултимодалните процеси променят продуктовите проучвания", summary: "Гласови, визуални и текстови интерфейси се обединяват в новото поколение инструменти за проучване.", source_url: "https://example.com/multimodal", category: "Проучвания", published_date: "2026-07-06", created_at: "2026-07-06T09:00:00Z" },
  { id: "4", title: "Европейското управление на AI навлиза в нов етап", summary: "Продуктовите екипи подготвят документация и контрол на риска за по-широко внедряване.", source_url: "https://example.com/governance", category: "Регулации", published_date: "2026-07-04", created_at: "2026-07-04T09:00:00Z" },
];

export const demoExperiments: Experiment[] = [
  { id: "1", name: "Класификатор на заявки", description: "Разпределя входящите заявки по тема и спешност.", model_used: "GPT-4.1 mini", result: "94% точност", created_at: "2026-07-09T14:30:00Z" },
  { id: "2", name: "Генератор на продуктови задания", description: "Превръща бележки от интервюта в структурирани продуктови задания.", model_used: "Claude Sonnet", result: "Спестени 2,5 ч. на задание", created_at: "2026-07-07T11:20:00Z" },
  { id: "3", name: "Спринт за визуални концепции", description: "Генерира и оценява концепции за начална страница от една заявка.", model_used: "Midjourney", result: "Тествани 8 концепции", created_at: "2026-07-02T16:10:00Z" },
];

export const demoKnowledge: KnowledgeItem[] = [
  { id: "k1", title: "Llama 3: Fine-tuning Guide", description: "Детайлно ръководство за адаптиране на Llama 3 модели за специфични задачи.", category: "LLMs", source_url: "https://example.com/llama", status: "Ново", priority: "Среден", rating: 4.8, tags: ["Модели", "Open Source"], notes: "", created_at: "2026-07-09T10:00:00Z" },
  { id: "k2", title: "AutoGPT Next Gen", description: "Нов подход за автономни агенти с подобрена памет и планиране.", category: "Агенти", source_url: "https://example.com/autogpt", status: "Ново", priority: "Висок", rating: 4.2, tags: ["Агенти"], notes: "Да се сравни с текущия процес.", created_at: "2026-07-08T10:00:00Z" },
  { id: "k3", title: "AI Safety Paper 2024", description: "Анализ на рисковете при мащабно внедряване на автономни системи.", category: "Етика", source_url: "https://example.com/safety", status: "За преглед", priority: "Висок", rating: 4.9, tags: ["Проучване", "Етика"], notes: "", created_at: "2026-07-06T10:00:00Z" },
  { id: "k4", title: "LangSmith Cloud", description: "Платформа за наблюдение и контрол на LLM вериги.", category: "Инструменти", source_url: "https://example.com/langsmith", status: "За тестване", priority: "Среден", rating: 4.5, tags: ["Tools", "LLM"], notes: "", created_at: "2026-07-05T10:00:00Z" },
];
