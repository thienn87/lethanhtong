const resources = {
  en: {
    t1: "Multilingual SEO",
    t2: "A translation app optimizes SEO for multiple languages, improving visibility on search engines and increasing traffic and business opportunities.",
    t3: "Global Customer Reach",
    t4: "Providing content in various languages allows businesses to reach and serve customers from different countries, expanding market presence and creating new opportunities.",
    t5: "Enhanced AI-Powered Translation Experience",
    t6: "Translation applications often use AI technology to deliver more accurate and natural translations, improving user experience and helping customers understand content easily.",
    t7: "Start translate",
  },
  fr: {
    t1: "SEO Multilingue",
    t2: "Une application de traduction optimise le SEO pour plusieurs langues, améliorant la visibilité sur les moteurs de recherche et augmentant le trafic et les opportunités commerciales.",
    t3: "Portée Client Globale",
    t4: "Fournir du contenu dans différentes langues permet aux entreprises d'atteindre et de servir des clients de différents pays, élargissant leur présence sur le marché et créant de nouvelles opportunités.",
    t5: "Expérience de Traduction Améliorée par l'IA",
    t6: "Les applications de traduction utilisent souvent la technologie AI pour fournir des traductions plus précises et naturelles, améliorant l'expérience utilisateur et aidant les clients à comprendre le contenu facilement.",
    t7: "Commencer à traduire",
  },
  es: {
    t1: "SEO Multilingüe",
    t2: "Una aplicación de traducción optimiza el SEO para varios idiomas, mejorando la visibilidad en los motores de búsqueda y aumentando el tráfico y las oportunidades comerciales.",
    t3: "Alcance Global de Clientes",
    t4: "Proporcionar contenido en varios idiomas permite a las empresas alcanzar y atender a clientes de diferentes países, ampliando la presencia en el mercado y creando nuevas oportunidades.",
    t5: "Experiencia de Traducción Mejorada por IA",
    t6: "Las aplicaciones de traducción suelen utilizar tecnología de IA para ofrecer traducciones más precisas y naturales, mejorando la experiencia del usuario y ayudando a los clientes a entender el contenido fácilmente.",
    t7: "Comenzar a traducir",
  },
  zh: {
    t1: "多语言SEO",
    t2: "翻译应用程序为多种语言优化SEO，提高搜索引擎的可见性，并增加流量和商业机会。",
    t3: "全球客户覆盖",
    t4: "提供多种语言的内容使企业能够接触和服务于来自不同国家的客户，扩展市场份额并创造新机会。",
    t5: "增强的AI驱动翻译体验",
    t6: "翻译应用程序通常使用AI技术提供更准确和自然的翻译，改善用户体验，帮助客户轻松理解内容。",
    t7: "开始翻译",
  },
  ja: {
    t1: "多言語SEO",
    t2: "翻訳アプリは複数の言語のSEOを最適化し、検索エンジンでの可視性を向上させ、トラフィックとビジネスチャンスを増加させます。",
    t3: "グローバル顧客リーチ",
    t4: "さまざまな言語でコンテンツを提供することで、企業は異なる国の顧客に到達し、サービスを提供できるようになり、市場の存在感を拡大し、新たな機会を生み出します。",
    t5: "AIによる翻訳体験の向上",
    t6: "翻訳アプリケーションは、より正確で自然な翻訳を提供するためにAI技術を使用することが多く、ユーザーエクスペリエンスを改善し、顧客がコンテンツを簡単に理解できるようにします。",
    t7: "翻訳を開始",
  },
  de: {
    t1: "Mehrsprachige SEO",
    t2: "Eine Übersetzungs-App optimiert die SEO für mehrere Sprachen, verbessert die Sichtbarkeit in Suchmaschinen und erhöht den Traffic sowie die Geschäftsmöglichkeiten.",
    t3: "Globale Kundenreichweite",
    t4: "Die Bereitstellung von Inhalten in verschiedenen Sprachen ermöglicht es Unternehmen, Kunden aus verschiedenen Ländern zu erreichen und zu bedienen, die Marktpräsenz zu erweitern und neue Chancen zu schaffen.",
    t5: "Verbesserte KI-gesteuerte Übersetzungserfahrung",
    t6: "Übersetzungsanwendungen verwenden häufig KI-Technologie, um genauere und natürlichere Übersetzungen zu liefern, die Benutzererfahrung zu verbessern und den Kunden das Verständnis von Inhalten zu erleichtern.",
    t7: "Übersetzung starten",
  },
  it: {
    t1: "SEO Multilingue",
    t2: "Un'app di traduzione ottimizza la SEO per più lingue, migliorando la visibilità sui motori di ricerca e aumentando il traffico e le opportunità commerciali.",
    t3: "Raggio d'Azione Globale",
    t4: "Fornire contenuti in diverse lingue consente alle aziende di raggiungere e servire clienti provenienti da paesi diversi, espandendo la presenza sul mercato e creando nuove opportunità.",
    t5: "Esperienza di Traduzione Potenziata dall'IA",
    t6: "Le applicazioni di traduzione utilizzano spesso la tecnologia AI per fornire traduzioni più accurate e naturali, migliorando l'esperienza dell'utente e aiutando i clienti a comprendere facilmente il contenuto.",
    t7: "Inizia a tradurre",
  },
};

const getTranslation = (lang, key) => {
  return resources[lang][key];
};
export default getTranslation;
