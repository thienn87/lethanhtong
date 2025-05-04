const resources = {
  en: {
    c1: "Benefits of Core Web Vitals",
    c2: "Improved User Experience: A faster and more stable website keeps users engaged longer and reduces bounce rates.",
    c3: "Enhanced SEO: Google considers Core Web Vitals as a ranking factor, so optimizing these metrics can improve your website’s search engine position.",
    c4: "Increased Conversions: A website optimized for user experience often leads to higher conversion rates, driving revenue and customer satisfaction.",
    c5: "Start optimize",
  },
  fr: {
    c1: "Avantages des Core Web Vitals",
    c2: "Amélioration de l'expérience utilisateur : Un site web plus rapide et plus stable garde les utilisateurs engagés plus longtemps et réduit le taux de rebond.",
    c3: "SEO amélioré : Google considère les Core Web Vitals comme un facteur de classement, donc optimiser ces métriques peut améliorer la position de votre site web dans les résultats de recherche.",
    c4: "Augmentation des conversions : Un site web optimisé pour l'expérience utilisateur conduit souvent à des taux de conversion plus élevés, ce qui augmente les revenus et la satisfaction des clients.",
    c5: "Commencer à optimiser",
  },
  es: {
    c1: "Beneficios de Core Web Vitals",
    c2: "Experiencia de usuario mejorada: Un sitio web más rápido y estable mantiene a los usuarios comprometidos por más tiempo y reduce las tasas de rebote.",
    c3: "SEO mejorado: Google considera Core Web Vitals como un factor de clasificación, por lo que optimizar estas métricas puede mejorar la posición de su sitio web en los motores de búsqueda.",
    c4: "Aumento de conversiones: Un sitio web optimizado para la experiencia del usuario a menudo conduce a tasas de conversión más altas, impulsando ingresos y satisfacción del cliente.",
    c5: "Comenzar a optimizar",
  },
  zh: {
    c1: "Core Web Vitals 的好处",
    c2: "改善用户体验：更快、更稳定的网站能让用户更长时间保持参与，减少跳出率。",
    c3: "增强SEO：Google将Core Web Vitals视为排名因素，因此优化这些指标可以改善您的网站在搜索引擎中的位置。",
    c4: "增加转化率：优化用户体验的网站通常会导致更高的转化率，从而推动收入和客户满意度。",
    c5: "开始优化",
  },
  ja: {
    c1: "Core Web Vitalsの利点",
    c2: "ユーザー体験の向上：より速く、より安定したウェブサイトは、ユーザーをより長く引き付け、直帰率を減少させます。",
    c3: "SEOの強化：GoogleはCore Web Vitalsをランキング要因として考慮しているため、これらの指標を最適化することでウェブサイトの検索エンジンでの位置を改善できます。",
    c4: "コンバージョンの増加：ユーザーエクスペリエンスに最適化されたウェブサイトは、通常、コンバージョン率の向上につながり、収益と顧客満足度を高めます。",
    c5: "最適化を開始",
  },
  de: {
    c1: "Vorteile der Core Web Vitals",
    c2: "Verbesserte Benutzererfahrung: Eine schnellere und stabilere Website hält die Nutzer länger beschäftigt und verringert die Absprungrate.",
    c3: "Verbessertes SEO: Google betrachtet die Core Web Vitals als Rankingfaktor, sodass die Optimierung dieser Metriken die Position Ihrer Website in den Suchmaschinen verbessern kann.",
    c4: "Erhöhte Konversionen: Eine für die Benutzererfahrung optimierte Website führt oft zu höheren Konversionsraten, was den Umsatz und die Kundenzufriedenheit steigert.",
    c5: "Optimierung starten",
  },
  it: {
    c1: "Benefici dei Core Web Vitals",
    c2: "Esperienza utente migliorata: Un sito web più veloce e stabile mantiene gli utenti coinvolti più a lungo e riduce il tasso di rimbalzo.",
    c3: "SEO migliorato: Google considera i Core Web Vitals un fattore di ranking, quindi ottimizzare queste metriche può migliorare la posizione del tuo sito web nei motori di ricerca.",
    c4: "Aumento delle conversioni: Un sito web ottimizzato per l'esperienza utente porta spesso a tassi di conversione più elevati, aumentando le entrate e la soddisfazione dei clienti.",
    c5: "Inizia a ottimizzare",
  },
};


const getTranslation = (lang, key) => {
  return resources[lang][key];
};
export default getTranslation;
