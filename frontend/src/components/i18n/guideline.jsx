const resources = {
  en: {
    guidelines: "Guidelines",
    g1: "Reach More People & Enhance User Experience",
    g2: "How to use Translate",
    g3: "Click translate. Select the content to translate. Translate the text to the desired language. Click Save to apply changes.",
    g4: "Faster Loading Times & Higher Search Rankings",
    g5: "How to optimize",
    g6: "Click Optimize button. Select the content you want to optimize. Click Save again to apply the improvements.",
    g7: "If you encounter any issues, feel free to contact us for support."
  },
  fr: {
    guidelines: "Lignes directrices",
    g1: "Atteignez plus de personnes et améliorez l'expérience utilisateur",
    g2: "Comment utiliser la traduction",
    g3: "Cliquez sur traduire. Sélectionnez le contenu à traduire. Traduisez le texte dans la langue souhaitée. Cliquez sur Enregistrer pour appliquer les modifications.",
    g4: "Temps de chargement plus rapides et meilleur classement dans les moteurs de recherche",
    g5: "Comment optimiser",
    g6: "Cliquez sur le bouton Optimiser. Sélectionnez le contenu que vous souhaitez optimiser. Cliquez à nouveau sur Enregistrer pour appliquer les améliorations.",
    g7: "Si vous rencontrez des problèmes, n'hésitez pas à nous contacter pour obtenir de l'aide."
  },
  es: {
    guidelines: "Directrices",
    g1: "Llega a más personas y mejora la experiencia del usuario",
    g2: "Cómo usar la traducción",
    g3: "Haz clic en traducir. Selecciona el contenido a traducir. Traduce el texto al idioma deseado. Haz clic en Guardar para aplicar los cambios.",
    g4: "Tiempos de carga más rápidos y mejor posicionamiento en los motores de búsqueda",
    g5: "Cómo optimizar",
    g6: "Haz clic en el botón Optimizar. Selecciona el contenido que deseas optimizar. Haz clic en Guardar nuevamente para aplicar las mejoras.",
    g7: "Si encuentras algún problema, no dudes en contactarnos para obtener apoyo."
  },
  zh: {
    guidelines: "指南",
    g1: "覆盖更多人群并提升用户体验",
    g2: "如何使用翻译功能",
    g3: "点击翻译。选择要翻译的内容。将文本翻译成所需语言。点击保存以应用更改。",
    g4: "更快的加载时间和更高的搜索排名",
    g5: "如何优化",
    g6: "点击优化按钮。选择要优化的内容。再次点击保存以应用改进。",
    g7: "如果您遇到任何问题，请随时与我们联系以获得支持。"
  },
  ja: {
    guidelines: "ガイドライン",
    g1: "より多くの人にリーチし、ユーザー体験を向上させる",
    g2: "翻訳機能の使い方",
    g3: "翻訳をクリックします。翻訳するコンテンツを選択します。テキストを希望の言語に翻訳します。変更を適用するには、保存をクリックします。",
    g4: "高速な読み込み時間と検索順位の向上",
    g5: "最適化方法",
    g6: "最適化ボタンをクリックします。最適化したいコンテンツを選択します。改善を適用するには、再度保存をクリックします。",
    g7: "問題が発生した場合は、遠慮なくお問い合わせください。"
  },
  de: {
    guidelines: "Richtlinien",
    g1: "Erreichen Sie mehr Menschen und verbessern Sie die Benutzererfahrung",
    g2: "So verwenden Sie die Übersetzungsfunktion",
    g3: "Klicken Sie auf Übersetzen. Wählen Sie den zu übersetzenden Inhalt aus. Übersetzen Sie den Text in die gewünschte Sprache. Klicken Sie auf Speichern, um die Änderungen zu übernehmen.",
    g4: "Schnellere Ladezeiten und höhere Suchmaschinenplatzierungen",
    g5: "So optimieren Sie",
    g6: "Klicken Sie auf die Schaltfläche Optimieren. Wählen Sie den Inhalt aus, den Sie optimieren möchten. Klicken Sie erneut auf Speichern, um die Verbesserungen anzuwenden.",
    g7: "Wenn Sie auf Probleme stoßen, zögern Sie nicht, uns um Unterstützung zu bitten."
  },
  it: {
    guidelines: "Linee guida",
    g1: "Raggiungi più persone e migliora l'esperienza utente",
    g2: "Come utilizzare la funzione di traduzione",
    g3: "Clicca su traduci. Seleziona il contenuto da tradurre. Traduci il testo nella lingua desiderata. Clicca su Salva per applicare le modifiche.",
    g4: "Tempi di caricamento più rapidi e posizionamento migliore nei motori di ricerca",
    g5: "Come ottimizzare",
    g6: "Clicca sul pulsante Ottimizza. Seleziona il contenuto che desideri ottimizzare. Clicca nuovamente su Salva per applicare i miglioramenti.",
    g7: "Se incontri problemi, non esitare a contattarci per assistenza."
  }
};


const getTranslation = (lang, key) => {
  return resources[lang][key];
};
export default getTranslation;
